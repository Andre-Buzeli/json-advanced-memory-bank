/**
 * Memory manager for the advanced vector-based memory system
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { EmbeddingService } from './embedding-service.js';
// Import DatabaseService only when needed to avoid initialization errors
import type { DatabaseService } from '../database/database-service.js';
import {
  MemoryEntry,
  MemoryMetadata,
  MemorySearchParams,
  MemorySearchResult,
  MemoryUpsertParams,
  MemoryType
} from '../types/index.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Manager for all memory operations with vector semantics
 */
export class MemoryManager {
  private dbService: DatabaseService | null;
  private embeddingService: EmbeddingService;
  private memoryBankRoot: string;
  private memoryBankBackup: string;
  private pruningThreshold: number;
  private similarityThreshold: number;
  private maxMemoryEntries: number;
  private jsonCache: Map<string, {data: Record<string, string>, timestamp: number}>;
  private jsonCacheLifetime: number;
  private backupInterval: NodeJS.Timeout | null = null;
  private backupInProgress: boolean = false;
  private activeProject: string | null = null;
  
  constructor() {
    this.embeddingService = new EmbeddingService();
    
    this.memoryBankRoot = process.env.MEMORY_BANK_ROOT || './memory-banks';
    this.memoryBankBackup = process.env.MEMORY_BANK_BACKUP || path.join(this.memoryBankRoot, 'backups');
    this.pruningThreshold = parseFloat(process.env.MEMORY_PRUNING_THRESHOLD || '0.85');
    this.similarityThreshold = parseFloat(process.env.MEMORY_SIMILARITY_THRESHOLD || '0.90');
    this.maxMemoryEntries = parseInt(process.env.MEMORY_MAX_ENTRIES || '1000');
    this.jsonCache = new Map();
    this.jsonCacheLifetime = parseInt(process.env.MEMORY_JSON_CACHE_LIFETIME || '60000'); // 1 minuto padrão
    
    // Ensure memory bank root directory exists
    fs.ensureDirSync(this.memoryBankRoot);
    // Ensure backup directory exists
    fs.ensureDirSync(this.memoryBankBackup);
    
    // Start automatic backup routine
    this.startAutomaticBackups();
    
    // Initialize database service with error handling
    this.dbService = null;
    
    // By default, we're using filesystem-only mode (no external dependencies)
    // Only try to initialize database if explicitly enabled
    const databaseEnabled = process.env.ENABLE_DATABASE === 'true';
    
    if (databaseEnabled) {
      // Database initialization only if explicitly enabled via ENABLE_DATABASE=true
      this.initializeDatabase().catch(error => {
        // Database initialization failed - continue with filesystem fallback
        // Use process.stderr to avoid contaminating JSON-RPC protocol
        process.stderr.write(`[MemoryManager] Database initialization failed: ${error}\n`);
      });
    }
  }
  
  /**
   * Initialize database service asynchronously to avoid blocking constructor
   */
  private async initializeDatabase(): Promise<void> {
    try {
      const { DatabaseService } = await import('../database/database-service.js');
      this.dbService = new DatabaseService();
      // Database service initialized successfully
    } catch (error) {
      // Database service unavailable, using filesystem fallback
      this.dbService = null;
    }
  }

  /**
   * List all projects in the memory bank
   * @returns Array of project names
   */
  async listProjects(): Promise<string[]> {
    let dbProjects: string[] = [];
    
    // Check database for projects if available
    if (this.dbService) {
      try {
        dbProjects = await this.dbService.getProjects();
      } catch (error) {
        // Database query failed, using filesystem only
      }
    }
    
    // Also check filesystem for directories (backward compatibility)
    const fsProjects = await this.getProjectsFromFilesystem();
    
    // Combine and deduplicate
    return [...new Set([...dbProjects, ...fsProjects])];
  }
  
  /**
   * Caminho do arquivo JSON único de memórias do projeto
   */
  private getProjectJsonPath(projectName: string): string {
    return path.join(this.memoryBankRoot, projectName, 'memory-bank.json');
  }

  /**
   * Caminho do arquivo de backup do JSON
   */
  private getProjectJsonBackupPath(projectName: string): string {
    return path.join(this.memoryBankRoot, projectName, 'memory-bank.backup.json');
  }

  /**
   * Lê todas as memórias do arquivo JSON único do projeto, usando cache quando possível
   */
  private async readProjectJson(projectName: string): Promise<Record<string, string>> {
    // Verificar se temos dados em cache e se ainda são válidos
    const cached = this.jsonCache.get(projectName);
    const now = Date.now();
    if (cached && (now - cached.timestamp < this.jsonCacheLifetime)) {
      return cached.data;
    }

    const jsonPath = this.getProjectJsonPath(projectName);
    if (!(await fs.pathExists(jsonPath))) return {};
    try {
      const raw = await fs.readFile(jsonPath, 'utf-8');
      const data = JSON.parse(raw);
      
      // Atualizar o cache
      this.jsonCache.set(projectName, { data, timestamp: now });
      
      return data;
    } catch (error) {
      console.warn(`Erro ao ler arquivo JSON do projeto ${projectName}:`, error instanceof Error ? error.message : String(error));
      
      // Tentar ler do backup se o arquivo principal falhar
      const backupPath = this.getProjectJsonBackupPath(projectName);
      if (await fs.pathExists(backupPath)) {
        try {
          const backupRaw = await fs.readFile(backupPath, 'utf-8');
          const backupData = JSON.parse(backupRaw);
          console.log(`Restaurado com sucesso do backup para o projeto ${projectName}`);
          return backupData;
        } catch {
          // Se o backup também falhar, retornar objeto vazio
          return {};
        }
      }
      
      return {};
    }
  }

  /**
   * Grava todas as memórias no arquivo JSON único do projeto com gerenciamento de concorrência
   */
  private async writeProjectJson(projectName: string, data: Record<string, string>): Promise<void> {
    // Atualizar o cache imediatamente
    this.jsonCache.set(projectName, { data: { ...data }, timestamp: Date.now() });
    
    const jsonPath = this.getProjectJsonPath(projectName);
    const backupPath = this.getProjectJsonBackupPath(projectName);
    const projectDir = path.dirname(jsonPath);
    
    try {
      // Garantir que o diretório existe
      await fs.ensureDir(projectDir);
      
      // Criar um backup do arquivo atual se existir
      if (await fs.pathExists(jsonPath)) {
        await fs.copyFile(jsonPath, backupPath);
      }
      
      // Escrever o novo conteúdo
      const formattedJson = JSON.stringify(data, null, 2);
      await fs.writeFile(jsonPath, formattedJson, 'utf-8');
    } catch (error) {
      console.error(`Erro ao escrever arquivo JSON do projeto ${projectName}:`, error instanceof Error ? error.message : String(error));
      throw new Error(`Falha ao salvar memórias para o projeto ${projectName}`);
    }
  }

  /**
   * Clear the cache for a specific project or all projects
   */
  private clearProjectJsonCache(projectName?: string): void {
    if (projectName) {
      this.jsonCache.delete(projectName);
    } else {
      this.jsonCache.clear();
    }
  }
  
  /**
   * Get all memory entries for a project
   * @param projectName - Project name
   * @returns Array of memory titles
   */
  async listProjectMemories(projectName: string): Promise<string[]> {
    if (this.dbService) {
      try {
        const memories = await this.dbService.getProjectMemories(projectName);
        return memories.map(memory => memory.title);
      } catch {}
    }
    // Filesystem JSON único
    const all = await this.readProjectJson(projectName);
    return Object.keys(all);
  }
  
  /**
   * Get all memory files from filesystem (for backward compatibility)
   * @param projectName - Project name
   * @returns Array of file names
   */
  private async getFilesFromFilesystem(projectName: string): Promise<string[]> {
    const projectPath = path.join(this.memoryBankRoot, projectName);
    
    try {
      if (await fs.pathExists(projectPath)) {
        const files = await fs.readdir(projectPath);
        return files.filter(file => file.endsWith('.md'));
      }
    } catch (error) {
      // Ignore errors, return empty array
    }
    
    return [];
  }
  
  /**
   * Get all memory entries from filesystem as MemoryEntry objects
   * @param projectName - Project name
   * @returns Array of MemoryEntry objects
   */
  private async getMemoriesFromFilesystem(projectName: string): Promise<MemoryEntry[]> {
    const files = await this.getFilesFromFilesystem(projectName);
    const memories: MemoryEntry[] = [];
    
    for (const file of files) {
      try {
        const memoryTitle = file.endsWith('.md') ? file.slice(0, -3) : file;
        const content = await this.readMemory(projectName, memoryTitle);
        
        // Determine memory type using robust system
        const memoryType = this.getMemoryType(memoryTitle);
        
        // Create memory entry
        const now = new Date();
        const memoryEntry: MemoryEntry = {
          id: `${projectName}-${memoryTitle}`,
          project: projectName,
          title: memoryTitle,
          memoryType: memoryType as MemoryType,
          content: content,
          importance: 0.5, // Default importance
          accessCount: 1,
          createdAt: now,
          lastAccessed: now,
          lastUpdated: now,
          metadata: this.extractMetadataFromContent(content)
        };
        
        memories.push(memoryEntry);
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return memories;
  }
  
  /**
   * Get all projects from filesystem (for backward compatibility)
   * @returns Array of project names
   */
  private async getProjectsFromFilesystem(): Promise<string[]> {
    try {
      if (await fs.pathExists(this.memoryBankRoot)) {
        const items = await fs.readdir(this.memoryBankRoot);
        const projects = [];
        
        for (const item of items) {
          const itemPath = path.join(this.memoryBankRoot, item);
          const stats = await fs.stat(itemPath);
          if (stats.isDirectory()) {
            projects.push(item);
          }
        }
        
        return projects;
      }
    } catch (error) {
      // Ignore errors, return empty array
    }
    
    return [];
  }
  
  /**
   * Read a memory file
   * @param projectName - Project name
   * @param fileName - Memory file name (with or without .md extension)
   * @returns The memory content
   */
  async readMemory(projectName: string, fileName: string): Promise<string> {
    // Track the active project
    this.updateActiveProject(projectName);
    
    const memoryTitle = fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName;
    if (this.dbService) {
      try {
        const memory = await this.dbService.getMemoryByTitle(projectName, memoryTitle);
        return memory.content;
      } catch {}
    }
    const all = await this.readProjectJson(projectName);
    if (!(memoryTitle in all)) throw new Error(`Memory titled "${memoryTitle}" not found in project "${projectName}"`);
    return all[memoryTitle];
  }
  
  /**
   * Import a legacy file from filesystem to database
   * @param projectName - Project name
   * @param memoryTitle - Memory title
   * @param content - Memory content
   */
  private async importLegacyFile(projectName: string, memoryTitle: string, content: string): Promise<void> {
    if (!this.dbService) {
      return; // Skip if no database service
    }
    
    try {
      // Determine memory type using robust system
      const memoryType = this.getMemoryType(memoryTitle);
      
      // Create memory in database
      await this.dbService.upsertMemory({
        project: projectName,
        title: memoryTitle,
        content: content,
        memoryType: memoryType as MemoryType,
        metadata: {}
      });
      
      // Generate embedding in background
      this.generateAndStoreEmbedding(projectName, memoryTitle, content).catch(console.error);
    } catch (error) {
      console.warn('Failed to import legacy file to database:', error?.message || error);
    }
  }
  
  /**
   * Get memory type using robust fallback system
   * @param memoryTitle - Memory title
   * @returns Memory type (enum or string)
   */
  private getMemoryType(memoryTitle: string): MemoryType | string {
    // Create mapping function that works with or without enum
    const getTypeValue = (enumKey: string, fallbackString: string): MemoryType | string => {
      try {
        // Try to access the enum value
        const enumValue = (MemoryType as any)[enumKey];
        if (enumValue !== undefined) {
          return enumValue;
        }
        throw new Error('Enum not available');
      } catch (error) {
        return fallbackString;
      }
    };
    
    // Map memory titles to types
    if (memoryTitle === 'summary') return getTypeValue('SUMMARY', 'summary');
    if (memoryTitle === 'status') return getTypeValue('STATUS', 'status');
    if (memoryTitle === 'progress') return getTypeValue('PROGRESS', 'progress');
    if (memoryTitle === 'brief-plan') return getTypeValue('BRIEF_PLAN', 'brief-plan');
    if (memoryTitle === 'troubleshooting') return getTypeValue('TROUBLESHOOTING', 'troubleshooting');
    if (memoryTitle === 'directory') return getTypeValue('DIRECTORY', 'directory');
    if (memoryTitle === 'tech-context') return getTypeValue('TECH_CONTEXT', 'tech-context');
    if (memoryTitle === 'workflow-status') return getTypeValue('WORKFLOW_STATUS', 'workflow-status');
    if (memoryTitle === 'change-history') return getTypeValue('CHANGE_HISTORY', 'change-history');
    if (memoryTitle === 'active-context') return getTypeValue('ACTIVE_CONTEXT', 'active-context');
    if (memoryTitle.startsWith('thinking-')) return getTypeValue('THINKING', 'thinking');
    if (memoryTitle.startsWith('creative-')) return getTypeValue('CREATIVE', 'creative');
    if (memoryTitle.startsWith('analysis-')) return getTypeValue('ANALYSIS', 'analysis');
    if (memoryTitle.startsWith('tasks-')) return getTypeValue('TASKS', 'tasks');
    if (memoryTitle.startsWith('setup-')) return getTypeValue('SETUP', 'setup');
    
    // Default to custom
    return getTypeValue('CUSTOM', 'custom');
  }
  
  /**
   * Write a new memory file
   * @param projectName - Project name
   * @param fileName - Memory file name (with or without .md extension)
   * @param content - Memory content
   * @returns Success message
   */
  async writeMemory(projectName: string, fileName: string, content: string): Promise<string> {
    // Track the active project
    this.updateActiveProject(projectName);
    
    const memoryTitle = fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName;
    if (this.dbService) {
      try {
        await this.dbService.upsertMemory({
          project: projectName,
          title: memoryTitle,
          content: content,
          memoryType: this.getMemoryType(memoryTitle) as MemoryType,
          metadata: this.extractMetadataFromContent(content)
        });
        this.generateAndStoreEmbedding(projectName, memoryTitle, content).catch(() => {});
        return `Memory "${memoryTitle}" saved successfully in project "${projectName}" (database)`;
      } catch {}
    }
    const all = await this.readProjectJson(projectName);
    all[memoryTitle] = content;
    await this.writeProjectJson(projectName, all);
    return `Memory "${memoryTitle}" saved successfully in project "${projectName}" (filesystem-json)`;
  }
  
  /**
   * Update an existing memory file with advanced operations
   * @param projectName - Project name
   * @param fileName - Memory file name (with or without .md extension)
   * @param content - Memory content to add
   * @param options - Update options
   * @returns Success message
   */
  async updateMemory(
    projectName: string, 
    fileName: string, 
    content: string, 
    options: {
      removeText?: string;
      replaceText?: { find: string; replace: string };
      operation?: 'append' | 'prepend' | 'replace' | 'insert_after' | 'insert_before';
      insertAfter?: string;
      insertBefore?: string;
    } = {}
  ): Promise<string> {
    const memoryTitle = fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName;
    let currentContent = '';
    
    try {
      currentContent = await this.readMemory(projectName, memoryTitle);
    } catch {
      throw new Error(`Memory titled "${memoryTitle}" not found in project "${projectName}"`);
    }
    
    let newContent = currentContent;
    
    // Apply remove operation first
    if (options.removeText && newContent.includes(options.removeText)) {
      newContent = newContent.replace(new RegExp(this.escapeRegExp(options.removeText), 'g'), '');
    }
    
    // Apply replace operation
    if (options.replaceText) {
      const { find, replace } = options.replaceText;
      newContent = newContent.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
    }
    
    // Apply content insertion based on operation
    const operation = options.operation || 'append';
    
    switch (operation) {
      case 'append':
        if (content && !newContent.includes(content)) {
          newContent = newContent.trim() + '\n' + content;
        }
        break;
        
      case 'prepend':
        if (content && !newContent.includes(content)) {
          newContent = content + '\n' + newContent.trim();
        }
        break;
        
      case 'replace':
        newContent = content;
        break;
        
      case 'insert_after':
        if (options.insertAfter && content) {
          const insertIndex = newContent.indexOf(options.insertAfter);
          if (insertIndex !== -1) {
            const insertPosition = insertIndex + options.insertAfter.length;
            newContent = newContent.slice(0, insertPosition) + '\n' + content + newContent.slice(insertPosition);
          } else {
            // Fallback to append if marker not found
            newContent = newContent.trim() + '\n' + content;
          }
        }
        break;
        
      case 'insert_before':
        if (options.insertBefore && content) {
          const insertIndex = newContent.indexOf(options.insertBefore);
          if (insertIndex !== -1) {
            newContent = newContent.slice(0, insertIndex) + content + '\n' + newContent.slice(insertIndex);
          } else {
            // Fallback to prepend if marker not found
            newContent = content + '\n' + newContent.trim();
          }
        }
        break;
    }
    
    return this.writeMemory(projectName, memoryTitle, newContent);
  }
  
  /**
   * Batch update multiple memory files with advanced operations
   * @param projectName - Project name
   * @param updates - Array of update operations
   * @returns Array of results for each update
   */
  async batchUpdateMemory(
    projectName: string, 
    updates: Array<{
      fileName: string;
      content: string;
      removeText?: string;
      replaceText?: { find: string; replace: string };
      operation?: 'append' | 'prepend' | 'replace' | 'insert_after' | 'insert_before';
      insertAfter?: string;
      insertBefore?: string;
    }>
  ): Promise<Array<{fileName: string, status: string, message: string}>> {
    const results = [];
    for (const update of updates) {
      try {
        const options = {
          removeText: update.removeText,
          replaceText: update.replaceText,
          operation: update.operation,
          insertAfter: update.insertAfter,
          insertBefore: update.insertBefore
        };
        const message = await this.updateMemory(projectName, update.fileName, update.content, options);
        results.push({ fileName: update.fileName, status: 'success', message });
      } catch (error) {
        results.push({ fileName: update.fileName, status: 'error', message: error instanceof Error ? error.message : String(error) });
      }
    }
    return results;
  }
  
  /**
   * Generate embedding for memory content and store it
   * @param projectName - Project name
   * @param memoryTitle - Memory title
   * @param content - Memory content
   */
  private async generateAndStoreEmbedding(projectName: string, memoryTitle: string, content: string): Promise<void> {
    if (!this.dbService) {
      return; // Skip if no database service
    }
    
    try {
      const embedding = await this.embeddingService.generateEmbedding(content);
      await this.dbService.updateMemoryEmbedding(projectName, memoryTitle, embedding);
    } catch (error) {
      console.error(`Error generating embedding for ${projectName}/${memoryTitle}:`, error);
    }
  }
  
  /**
   * Extract metadata from memory content
   * @param content - Memory content
   * @returns Extracted metadata
   */
  private extractMetadataFromContent(content: string): MemoryMetadata {
    const metadata: MemoryMetadata = {};
    
    // Extract workflow mode
    const modeMatch = content.match(/Mode:\s*(VAN|PLAN|CREATIVE|IMPLEMENT|QA)/i);
    if (modeMatch) {
      metadata.workflowMode = modeMatch[1].toUpperCase() as any;
    }
    
    // Extract complexity level
    const complexityMatch = content.match(/Complexity\s*Level\s*[:-]?\s*([1-4])/i);
    if (complexityMatch) {
      metadata.complexityLevel = parseInt(complexityMatch[1]);
    }
    
    // Extract tags using hashtags or specific tag sections
    const tagMatches = content.match(/(?:^|\s)#([a-zA-Z0-9-_]+)/g);
    const tagSection = content.match(/(?:tags|keywords):\s*([^\n]+)/i);
    
    const tags = new Set<string>();
    
    if (tagMatches) {
      for (const match of tagMatches) {
        const tag = match.trim().substring(1).toLowerCase();
        if (tag) tags.add(tag);
      }
    }
    
    if (tagSection) {
      const sectionTags = tagSection[1].split(/[,;]/).map(tag => tag.trim().toLowerCase());
      for (const tag of sectionTags) {
        if (tag) tags.add(tag);
      }
    }
    
    if (tags.size > 0) {
      metadata.tags = Array.from(tags);
    }
    
    return metadata;
  }
  
  /**
   * Search memories with semantic understanding
   * @param params - Search parameters
   * @returns Search results
   */
  async searchMemories(params: MemorySearchParams): Promise<MemorySearchResult> {
    const { project, query } = params;
    
    if (!this.dbService) {
      // Filesystem-only fallback - very basic search
      return this.searchMemoriesFilesystem(params);
    }
    
    try {
      // If no query, use simple text search
      if (!query) {
        return this.dbService.searchMemories(params);
      }
      
      // Generate embedding for the query
      const embedding = await this.embeddingService.generateEmbedding(query);
      
      // Search using vector similarity
      return this.dbService.searchMemoriesByVector(
        project,
        embedding,
        params.memoryType,
        params.metadata,
        params.limit,
        params.similarityThreshold
      );
    } catch (error) {
      // Database search failed, using filesystem fallback
      return this.searchMemoriesFilesystem(params);
    }
  }
  
  /**
   * Prune memories when we exceed max entries
   * @param projectName - Project name
   */
  private async pruneMemories(projectName: string): Promise<void> {
    const count = await this.dbService.countProjectMemories(projectName);
    const toRemove = Math.max(1, Math.floor(count * 0.1)); // Remove ~10% of memories
    
    const pruningCandidates = await this.dbService.getMemoriesForPruning(projectName, toRemove);
    
    for (const memory of pruningCandidates) {
      // Skip core files
      if ([
        MemoryType.SUMMARY,
        MemoryType.STATUS,
        MemoryType.WORKFLOW_STATUS,
        MemoryType.TECH_CONTEXT,
        MemoryType.ACTIVE_CONTEXT,
        MemoryType.BRIEF_PLAN
      ].includes(memory.memoryType)) {
        continue;
      }
      
      // Remove from database
      await this.dbService.deleteMemory(projectName, memory.title);
      
      // Try to remove from filesystem (backward compatibility)
      try {
        const filePath = path.join(this.memoryBankRoot, projectName, `${memory.title}.md`);
        if (await fs.pathExists(filePath)) {
          await fs.unlink(filePath);
        }
      } catch (error) {
        // Ignore filesystem errors
      }
    }
  }
  
  /**
   * Find and merge similar memories to avoid duplication
   * @param projectName - Project name
   * @param memoryTitle - Memory title to check for similar content
   */
  private async findAndMergeSimilarMemories(projectName: string, memoryTitle: string): Promise<void> {
    try {
      // Get the memory content and embedding
      const memory = await this.dbService.getMemoryByTitle(projectName, memoryTitle);
      
      // Skip if no embedding available
      if (!memory.embedding) {
        return;
      }
      
      // Search for similar memories
      const similarMemories = await this.dbService.searchMemoriesByVector(
        projectName,
        memory.embedding,
        undefined,
        undefined,
        5,
        this.similarityThreshold
      );
      
      // Skip if no similar memories (besides itself)
      if (similarMemories.memories.length <= 1) {
        return;
      }
      
      // Remove self from similar memories
      const filteredMemories = similarMemories.memories.filter(m => m.title !== memoryTitle);
      
      // Skip if no similar memories after filtering
      if (filteredMemories.length === 0) {
        return;
      }
      
      // Check for exact matches by type
      for (const similar of filteredMemories) {
        // Skip core files for merging
        if ([
          MemoryType.SUMMARY,
          MemoryType.STATUS,
          MemoryType.WORKFLOW_STATUS,
          MemoryType.TECH_CONTEXT,
          MemoryType.ACTIVE_CONTEXT,
          MemoryType.BRIEF_PLAN
        ].includes(similar.memoryType)) {
          continue;
        }
        
        // If same type, consider merging
        if (similar.memoryType === memory.memoryType) {
          // Content should be different enough to justify keeping both
          const newContent = this.mergeMemoryContents(memory.content, similar.content);
          
          // Update the memory with merged content
          await this.updateMemory(projectName, memoryTitle, newContent);
          
          // Delete the similar memory
          await this.dbService.deleteMemory(projectName, similar.title);
          
          // Try to remove from filesystem (backward compatibility)
          try {
            const filePath = path.join(this.memoryBankRoot, projectName, `${similar.title}.md`);
            if (await fs.pathExists(filePath)) {
              await fs.unlink(filePath);
            }
          } catch (error) {
            // Ignore filesystem errors
          }
          
          // Only merge one memory at a time to avoid excessive changes
          break;
        }
      }
    } catch (error) {
      // Log error but don't throw
      console.error(`Error merging similar memories for ${projectName}/${memoryTitle}:`, error);
    }
  }
  
  /**
   * Merge content from two memory files
   * @param content1 - First memory content
   * @param content2 - Second memory content
   * @returns Merged content
   */
  private mergeMemoryContents(content1: string, content2: string): string {
    // Simple heuristic: Split by sections (H1, H2) and combine unique sections
    const sections1 = this.splitIntoSections(content1);
    const sections2 = this.splitIntoSections(content2);
    
    // Combine header sections
    const headerSection1 = sections1.header;
    const headerSection2 = sections2.header;
    
    // Use the most recent header (assuming it has the latest metadata)
    // Check for date patterns to determine which is more recent
    const datePattern = /\d{4}-\d{2}-\d{2}/;
    const date1 = headerSection1.match(datePattern);
    const date2 = headerSection2.match(datePattern);
    
    let mergedHeader: string;
    
    if (date1 && date2) {
      mergedHeader = date1[0] > date2[0] ? headerSection1 : headerSection2;
    } else {
      // If no dates, prefer the longer header as it might contain more metadata
      mergedHeader = headerSection1.length >= headerSection2.length ? headerSection1 : headerSection2;
    }
    
    // Handle additional header notes that might be missing
    const headerLines1 = headerSection1.split('\n');
    const headerLines2 = headerSection2.split('\n');
    
    const combinedHeaderLines = new Set<string>();
    [...headerLines1, ...headerLines2].forEach(line => {
      if (line.trim()) combinedHeaderLines.add(line.trim());
    });
    
    mergedHeader = Array.from(combinedHeaderLines).join('\n') + '\n\n';
    
    // Combine content sections, removing duplicates
    const allSections = new Map<string, string>();
    
    // Add sections from both contents
    [...sections1.contentSections, ...sections2.contentSections].forEach(section => {
      const heading = section.split('\n')[0];
      
      if (allSections.has(heading)) {
        // If section already exists, use the longer one
        const existing = allSections.get(heading) || '';
        if (section.length > existing.length) {
          allSections.set(heading, section);
        }
      } else {
        allSections.set(heading, section);
      }
    });
    
    // Rebuild content
    const mergedContent = mergedHeader + Array.from(allSections.values()).join('\n\n');
    
    return mergedContent;
  }
  
  /**
   * Split content into header and content sections
   * @param content - Memory content
   * @returns Object with header and content sections
   */
  private splitIntoSections(content: string): { header: string; contentSections: string[] } {
    const lines = content.split('\n');
    
    let headerEndIndex = 0;
    
    // Header ends at the first H1 or H2
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('# ') || lines[i].startsWith('## ')) {
        headerEndIndex = i;
        break;
      }
    }
    
    const header = lines.slice(0, headerEndIndex).join('\n');
    const contentLines = lines.slice(headerEndIndex);
    
    // Split content into sections by headings
    const contentSections: string[] = [];
    let currentSection: string[] = [];
    
    for (const line of contentLines) {
      if ((line.startsWith('# ') || line.startsWith('## ')) && currentSection.length > 0) {
        contentSections.push(currentSection.join('\n'));
        currentSection = [line];
      } else {
        currentSection.push(line);
      }
    }
    
    if (currentSection.length > 0) {
      contentSections.push(currentSection.join('\n'));
    }
    
    return {
      header,
      contentSections
    };
  }
  
  /**
   * Run memory bank analysis
   * @param projectName - Project name
   * @param analysisType - Type of analysis to perform
   * @param includeMetrics - Whether to include metrics
   * @returns Analysis results
   */
  async analyzeMemory(
    projectName: string,
    analysisType: 'dependencies' | 'orphans' | 'cleanup' | 'all' = 'all',
    includeMetrics = true
  ): Promise<string> {
    // Get all memories for the project - use database if available, filesystem JSON fallback otherwise
    let memories: MemoryEntry[] = [];
    
    if (this.dbService) {
      try {
        memories = await this.dbService.getProjectMemories(projectName);
      } catch (error) {
        console.warn('Database query failed, using JSON filesystem fallback:', error?.message || error);
        // Use JSON format instead of individual files
        memories = await this.getMemoriesFromJson(projectName);
      }
    } else {
      // Use JSON format instead of individual files
      memories = await this.getMemoriesFromJson(projectName);
    }
    
    // Return if no memories
    if (memories.length === 0) {
      return `No memories found in project "${projectName}"`;
    }
    
    // Map of memory titles to their content
    const memoryContents = new Map<string, string>();
    memories.forEach(memory => {
      memoryContents.set(memory.title, memory.content);
    });
    
    // Analyze dependencies between memories
    const dependencies: Record<string, string[]> = {};
    const allReferences = new Set<string>();
    
    // Regex patterns for dependency detection
    const referencePatterns = [
      /\[([^\]]+)\]\(([^)]+\.md)\)/g,     // [text](file.md)
      /\b([a-zA-Z0-9-]+\.md)\b/g,        // direct file mentions
      /see ([a-zA-Z0-9-]+\.md)/gi,       // "see file.md"
      /refer to ([a-zA-Z0-9-]+\.md)/gi   // "refer to file.md"
    ];
    
    for (const memory of memories) {
      const fileReferences = new Set<string>();
      
      // Apply all reference patterns
      for (const pattern of referencePatterns) {
        const matches = [...memory.content.matchAll(pattern)];
        for (const match of matches) {
          // Extract filename from match (different patterns have filename in different groups)
          let referencedFile = '';
          if (pattern.source.includes('\\[')) {
            // Link pattern [text](file.md)
            referencedFile = match[2];
          } else {
            // Direct mention patterns
            referencedFile = match[1];
          }
          
          // Clean up and validate the referenced file
          if (referencedFile && referencedFile.endsWith('.md')) {
            const baseName = referencedFile.endsWith('.md') 
              ? referencedFile.slice(0, -3) 
              : referencedFile;
              
            if (memories.some(m => m.title === baseName)) {
              fileReferences.add(baseName);
              allReferences.add(baseName);
            }
          }
        }
      }
      
      dependencies[memory.title] = Array.from(fileReferences);
    }
    
    // Find orphaned files (files not referenced by others)
    const orphanedFiles = memories
      .map(m => m.title)
      .filter(title => !allReferences.has(title));
    
    // Generate cleanup suggestions
    const cleanupSuggestions: Array<{
      type: string;
      reason: string;
      action: string;
      files: string[];
    }> = [];
    
    // Identify empty or minimal files
    for (const memory of memories) {
      if (memory.content.trim().length < 100) {
        // Skip core files for empty check
        if ([
          MemoryType.SUMMARY,
          MemoryType.STATUS,
          MemoryType.WORKFLOW_STATUS,
          MemoryType.TECH_CONTEXT,
          MemoryType.ACTIVE_CONTEXT,
          MemoryType.BRIEF_PLAN
        ].includes(memory.memoryType)) {
          continue;
        }
        
        cleanupSuggestions.push({
          type: 'empty',
          files: [`${memory.title}.md`],
          reason: 'File contains minimal content (less than 100 characters)',
          action: 'Consider expanding content or removing if not needed'
        });
      }
    }
    
    // Identify duplicate content
    const filesByContent = new Map<string, string[]>();
    for (const memory of memories) {
      const normalizedContent = memory.content.replace(/\s+/g, ' ').trim().toLowerCase();
      if (normalizedContent.length > 100) { // Only check substantial content
        if (filesByContent.has(normalizedContent)) {
          filesByContent.get(normalizedContent)!.push(`${memory.title}.md`);
        } else {
          filesByContent.set(normalizedContent, [`${memory.title}.md`]);
        }
      }
    }
    
    // Add duplicate suggestions
    for (const [_, files] of filesByContent.entries()) {
      if (files.length > 1) {
        cleanupSuggestions.push({
          type: 'duplicate',
          files: files,
          reason: 'Files contain identical or very similar content',
          action: 'Consider merging or removing duplicate files'
        });
      }
    }
    
    // Check for outdated files based on access patterns
    const oldMemories = memories.filter(m => 
      m.accessCount < 3 && 
      (Date.now() - m.lastAccessed.getTime()) > 30 * 24 * 60 * 60 * 1000 // 30 days
    );
    
    if (oldMemories.length > 0) {
      cleanupSuggestions.push({
        type: 'outdated',
        files: oldMemories.map(m => `${m.title}.md`),
        reason: 'Files have not been accessed in over 30 days and have low access counts',
        action: 'Review if these files are still relevant or need updating'
      });
    }
    
    // Compile analysis result based on requested type
    let result = `# 📊 Advanced Memory Bank Analysis Report\n\n`;
    result += `**Project:** ${projectName}\n`;
    result += `**Analysis Type:** ${analysisType}\n`;
    result += `**Files Analyzed:** ${memories.length}\n\n`;
    
    if (analysisType === 'dependencies' || analysisType === 'all') {
      result += `## 🔗 Dependencies\n\n`;
      
      for (const [title, refs] of Object.entries(dependencies)) {
        result += `### ${title}.md\n`;
        result += refs.length > 0 
          ? `**References:** ${refs.map(r => `${r}.md`).join(', ')}\n\n`
          : '**No outgoing references**\n\n';
      }
    }
    
    if (analysisType === 'orphans' || analysisType === 'all') {
      result += `## 🏝️ Orphaned Files\n\n`;
      
      if (orphanedFiles.length > 0) {
        for (const file of orphanedFiles) {
          result += `- **${file}.md** - Not referenced by any other file\n`;
        }
      } else {
        result += 'No orphaned files found - all files are referenced by others\n';
      }
      
      result += '\n';
    }
    
    if (analysisType === 'cleanup' || analysisType === 'all') {
      result += `## 🧹 Cleanup Suggestions\n\n`;
      
      if (cleanupSuggestions.length > 0) {
        for (let i = 0; i < cleanupSuggestions.length; i++) {
          const suggestion = cleanupSuggestions[i];
          result += `### ${i + 1}. ${suggestion.type.toUpperCase()}: ${suggestion.reason}\n`;
          result += `**Files:** ${suggestion.files.join(', ')}\n`;
          result += `**Action:** ${suggestion.action}\n\n`;
        }
      } else {
        result += 'No cleanup suggestions at this time\n\n';
      }
    }
    
    if (includeMetrics) {
      // Calculate metrics
      const totalReferences = Object.values(dependencies).reduce((sum, refs) => sum + refs.length, 0);
      const avgReferencesPerFile = Math.round((totalReferences / memories.length) * 100) / 100;
      
      // Detect circular dependencies (simplified algorithm)
      const circularDependencies = this.detectCircularDependencies(dependencies);
      
      result += `## 📈 Metrics\n\n`;
      result += `- **Total Files:** ${memories.length}\n`;
      result += `- **Total References:** ${totalReferences}\n`;
      result += `- **Average References per File:** ${avgReferencesPerFile}\n`;
      result += `- **Orphaned Files:** ${orphanedFiles.length}\n`;
      result += `- **Circular Dependencies:** ${circularDependencies.length}\n\n`;
      
      if (circularDependencies.length > 0) {
        result += `### ⚠️ Circular Dependencies Detected:\n`;
        for (const cycle of circularDependencies) {
          result += `- ${cycle.join(' → ')}\n`;
        }
      } else {
        result += '✅ No circular dependencies detected\n';
      }
      
      result += '\n';
    }
    
    result += `---\n*Analysis completed at ${new Date().toISOString()}*`;
    
    return result;
  }
  
  /**
   * Detect circular dependencies in memories
   * @param dependencies - Map of memory dependencies
   * @returns Array of circular dependency paths
   */
  private detectCircularDependencies(dependencies: Record<string, string[]>): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    
    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), node]);
        }
        return;
      }
      
      if (visited.has(node)) {
        return;
      }
      
      visited.add(node);
      recursionStack.add(node);
      
      const nodeReferences = dependencies[node] || [];
      for (const reference of nodeReferences) {
        dfs(reference, [...path, node]);
      }
      
      recursionStack.delete(node);
    };
    
    // Check for cycles starting from each file
    for (const fileName of Object.keys(dependencies)) {
      if (!visited.has(fileName)) {
        dfs(fileName, []);
      }
    }
    
    return cycles;
  }
  
  /**
   * Provide intelligent context suggestions based on task description
   * @param projectName - Project name
   * @param taskDescription - Task description
   * @param currentContext - Current context (optional)
   * @param maxSuggestions - Maximum number of suggestions
   * @returns Suggested relevant memory files
   */
  async getContextSuggestions(
    projectName: string,
    taskDescription: string,
    currentContext = '',
    maxSuggestions = 5
  ): Promise<string> {
    if (!this.dbService) {
      // Simple filesystem-based context suggestions
      return this.getContextSuggestionsFilesystem(projectName, taskDescription, currentContext, maxSuggestions);
    }
    
    try {
      // Generate embedding for the task description
      const taskEmbedding = await this.embeddingService.generateEmbedding(
        taskDescription + (currentContext ? ` ${currentContext}` : '')
      );
      
      // Search for similar memories
      const similarMemories = await this.dbService.searchMemoriesByVector(
        projectName,
        taskEmbedding,
        undefined,
        undefined,
        maxSuggestions,
        0.5 // Lower threshold for context suggestions
      );
      
      if (similarMemories.memories.length === 0) {
        return `No relevant memory files found for task "${taskDescription}" in project "${projectName}"`;
      }
      
      // Generate result text
      let result = `# 🎯 Context Intelligence Suggestions\n\n`;
      result += `**Task:** "${taskDescription}"\n`;
      if (currentContext) {
        result += `**Context:** ${currentContext}\n`;
      }
      result += `**Project:** ${projectName}\n\n`;
      result += `## 📋 Suggested Files\n\n`;
      
      for (let i = 0; i < similarMemories.memories.length; i++) {
        const memory = similarMemories.memories[i];
        const score = similarMemories.scores ? similarMemories.scores[i] : 0.5;
        
        // Extract key topics from content (headers or strong text)
        const keyTopics = this.extractKeyTopics(memory.content, 3);
        
        result += `### ${i + 1}. ${memory.title}.md (Score: ${Math.round(score * 10)}/10)\n\n`;
        
        // Generate relevance reasoning
        const reasons = [];
        
        // Check for direct keyword matches
        const taskKeywords = taskDescription.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const matchedKeywords = taskKeywords.filter(k => memory.content.toLowerCase().includes(k));
        
        if (matchedKeywords.length > 0) {
          reasons.push(`Contains relevant keywords: ${matchedKeywords.join(', ')}`);
        }
        
        // Check memory type
        switch (memory.memoryType) {
          case MemoryType.TECH_CONTEXT:
            reasons.push('Contains technical context and architecture decisions');
            break;
          case MemoryType.WORKFLOW_STATUS:
            reasons.push('Contains current workflow status');
            break;
          case MemoryType.ACTIVE_CONTEXT:
            reasons.push('Contains active work context');
            break;
          case MemoryType.CREATIVE:
            reasons.push('Contains creative design decisions');
            break;
          case MemoryType.THINKING:
            reasons.push('Contains detailed thinking process');
            break;
        }
        
        // Check recency
        const daysOld = (Date.now() - memory.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) {
          reasons.push('Recently updated');
        }
        
        // Check size
        if (memory.content.length > 2000) {
          reasons.push('Contains comprehensive content');
        }
        
        result += `**Why relevant:** ${reasons.join('; ') || 'Semantic similarity to task description'}\n\n`;
        result += `**Key topics:** ${keyTopics.join(', ')}\n\n`;
        result += `---\n`;
      }
      
      // Add analysis summary
      const memoryCount = await this.dbService.countProjectMemories(projectName);
      result += `\n**Analysis Summary:**\n`;
      result += `- Total files analyzed: ${memoryCount}\n`;
      result += `- Relevant files found: ${similarMemories.totalMatches}\n`;
      result += `- Top suggestions returned: ${similarMemories.memories.length}\n\n`;
      result += `> 🤖 AI-powered suggestions based on semantic vector similarity\n`;
      
      return result;
    } catch (error) {
      console.warn('Database context suggestions failed, using filesystem fallback:', error?.message || error);
      return this.getContextSuggestionsFilesystem(projectName, taskDescription, currentContext, maxSuggestions);
    }
  }
  
  /**
   * Filesystem-based context suggestions fallback
   * @param projectName - Project name
   * @param taskDescription - Task description
   * @param currentContext - Current context (optional)
   * @param maxSuggestions - Maximum number of suggestions
   * @returns Suggested relevant memory files
   */
  private async getContextSuggestionsFilesystem(
    projectName: string,
    taskDescription: string,
    currentContext = '',
    maxSuggestions = 5
  ): Promise<string> {
    try {
      const memories = await this.getMemoriesFromFilesystem(projectName);
      
      if (memories.length === 0) {
        return `No memories found in project "${projectName}"`;
      }
      
      // Simple keyword-based scoring
      const taskKeywords = taskDescription.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const scoredMemories: Array<{ memory: MemoryEntry; score: number }> = [];
      
      for (const memory of memories) {
        let score = 0;
        const contentLower = memory.content.toLowerCase();
        
        // Score based on keyword matches
        for (const keyword of taskKeywords) {
          const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
          score += matches;
        }
        
        // Bonus for important memory types
        if ([MemoryType.TECH_CONTEXT, MemoryType.WORKFLOW_STATUS, MemoryType.ACTIVE_CONTEXT].includes(memory.memoryType)) {
          score += 2;
        }
        
        // Bonus for recent files (filesystem doesn't have real dates)
        if (memory.content.length > 1000) {
          score += 1;
        }
        
        if (score > 0) {
          scoredMemories.push({ memory, score });
        }
      }
      
      // Sort by score and take top results
      scoredMemories.sort((a, b) => b.score - a.score);
      const topMemories = scoredMemories.slice(0, maxSuggestions);
      
      if (topMemories.length === 0) {
        return `No relevant memory files found for task "${taskDescription}" in project "${projectName}"`;
      }
      
      // Generate result text
      let result = `# 🎯 Context Intelligence Suggestions (Filesystem Mode)\n\n`;
      result += `**Task:** "${taskDescription}"\n`;
      if (currentContext) {
        result += `**Context:** ${currentContext}\n`;
      }
      result += `**Project:** ${projectName}\n\n`;
      result += `## 📋 Suggested Files\n\n`;
      
      for (let i = 0; i < topMemories.length; i++) {
        const { memory, score } = topMemories[i];
        const keyTopics = this.extractKeyTopics(memory.content, 3);
        
        result += `### ${i + 1}. ${memory.title}.md (Score: ${Math.min(score, 10)}/10)\n\n`;
        
        // Generate relevance reasoning
        const reasons = [];
        const matchedKeywords = taskKeywords.filter(k => memory.content.toLowerCase().includes(k));
        
        if (matchedKeywords.length > 0) {
          reasons.push(`Contains keywords: ${matchedKeywords.join(', ')}`);
        }
        
        switch (memory.memoryType) {
          case MemoryType.TECH_CONTEXT:
            reasons.push('Technical context file');
            break;
          case MemoryType.WORKFLOW_STATUS:
            reasons.push('Current workflow status');
            break;
          case MemoryType.ACTIVE_CONTEXT:
            reasons.push('Active work context');
            break;
          case MemoryType.CREATIVE:
            reasons.push('Creative analysis');
            break;
          case MemoryType.THINKING:
            reasons.push('Thinking process');
            break;
        }
        
        if (memory.content.length > 2000) {
          reasons.push('Comprehensive content');
        }
        
        result += `**Why relevant:** ${reasons.join('; ') || 'Keyword-based relevance'}\n\n`;
        result += `**Key topics:** ${keyTopics.join(', ')}\n\n`;
        result += `---\n`;
      }
      
      result += `\n**Analysis Summary:**\n`;
      result += `- Total files analyzed: ${memories.length}\n`;
      result += `- Relevant files found: ${topMemories.length}\n\n`;
      result += `> 🔍 Basic keyword-based suggestions (database unavailable)\n`;
      
      return result;
    } catch (error) {
      return `Error analyzing context for project "${projectName}": ${error?.message || error}`;
    }
  }
  
  /**
   * Extract key topics from memory content
   * @param content - Memory content
   * @param maxTopics - Maximum number of topics to extract
   * @returns Array of key topics
   */
  private extractKeyTopics(content: string, maxTopics: number): string[] {
    const topics: string[] = [];
    
    // Extract markdown headers
    const headerMatches = content.match(/^#+\s+(.+)$/gm);
    if (headerMatches) {
      topics.push(...headerMatches
        .map(h => h.replace(/^#+\s+/, '').trim())
        .filter(Boolean)
        .slice(0, maxTopics)
      );
    }
    
    // If not enough topics, extract from strong text
    if (topics.length < maxTopics) {
      const strongMatches = content.match(/\*\*([^*]+)\*\*/g);
      if (strongMatches) {
        topics.push(...strongMatches
          .map(s => s.replace(/\*\*/g, '').trim())
          .filter(Boolean)
          .slice(0, maxTopics - topics.length)
        );
      }
    }
    
    return topics.slice(0, maxTopics);
  }
  
  /**
   * Filesystem-based search fallback otimizado para JSON quando o banco de dados está indisponível
   * @param params - Search parameters
   * @returns Search results
   */
  private async searchMemoriesFilesystem(params: MemorySearchParams): Promise<MemorySearchResult> {
    const { project, query, limit = 10 } = params;
    try {
      // Busca todas as memórias do JSON único, usando cache
      const all = await this.readProjectJson(project);
      const results: MemoryEntry[] = [];
      let totalMatches = 0;
      
      // Preparar termos de pesquisa para melhor performance
      const searchTerms: string[] = [];
      if (query) {
        // Dividir a consulta em termos para pesquisa mais precisa
        searchTerms.push(...query.toLowerCase().split(/\s+/).filter(term => term.length > 2));
      }

      // Pré-filtro para reduzir a quantidade de texto a ser processado
      const filteredTitles = Object.keys(all).filter(memoryTitle => {
        // Filtro por tipo, se especificado
        if (params.memoryType && this.getMemoryType(memoryTitle) !== params.memoryType) {
          return false;
        }
        
        // Se não há termos de busca, incluir todos
        if (searchTerms.length === 0) {
          return true;
        }
        
        // Verificação rápida por título primeiro
        if (searchTerms.some(term => memoryTitle.toLowerCase().includes(term))) {
          return true;
        }
        
        // Verificar o conteúdo, mas apenas se necessário
        const contentLower = all[memoryTitle].toLowerCase();
        return searchTerms.some(term => contentLower.includes(term));
      });
      
      // Processar apenas os títulos filtrados
      for (const memoryTitle of filteredTitles) {
        const content = all[memoryTitle];
        const memoryType = this.getMemoryType(memoryTitle);
        totalMatches++;
        
        // Calcular pontuação de relevância
        let relevanceScore = 0;
        if (searchTerms.length > 0) {
          const contentLower = content.toLowerCase();
          const titleLower = memoryTitle.toLowerCase();
          
          // Pontuação baseada em correspondências no título (peso maior)
          for (const term of searchTerms) {
            if (titleLower.includes(term)) {
              relevanceScore += 10;
            }
          }
          
          // Pontuação baseada em correspondências no conteúdo
          for (const term of searchTerms) {
            const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
            relevanceScore += matches;
          }
        } else {
          // Se não há termos de busca, dar relevância básica por tipo e tamanho
          relevanceScore = 5;
          
          // Maior relevância para tipos importantes
          if (['summary', 'tech-context', 'active-context'].includes(String(memoryType))) {
            relevanceScore += 5;
          }
        }
        
        // Extrair metadados uma única vez e reutilizar
        const metadata = this.extractMetadataFromContent(content);
        
        // Verificar filtros de metadados, se especificados
        if (params.metadata) {
          let metadataMatch = true;
          
          for (const [key, value] of Object.entries(params.metadata)) {
            if (metadata[key] !== value) {
              metadataMatch = false;
              break;
            }
          }
          
          if (!metadataMatch) continue;
        }
        
        // Criar entrada de memória
        const now = new Date();
        const memoryEntry: MemoryEntry = {
          id: `${project}-${memoryTitle}`,
          project,
          title: memoryTitle,
          memoryType: memoryType as MemoryType,
          content,
          importance: 0.5,
          accessCount: 1,
          createdAt: now,
          lastAccessed: now,
          lastUpdated: now,
          metadata
        };
        
        // Adicionar pontuação de relevância como propriedade temporária
        const entryWithScore = { ...memoryEntry, relevanceScore };
        
        results.push(entryWithScore);
      }
      
      // Ordenar por relevância
      results.sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore);
      
      // Limitar resultados
      const limitedResults = results.slice(0, limit);
      
      // Calcular pontuações normalizadas de 0 a 1
      const maxScore = results.length > 0 ? Math.max(...results.map(r => (r as any).relevanceScore)) : 1;
      const scores = limitedResults.map(r => Math.min((r as any).relevanceScore / maxScore, 1));
      
      // Remover a propriedade temporária de pontuação
      limitedResults.forEach(r => delete (r as any).relevanceScore);
      
      return {
        memories: limitedResults,
        totalMatches,
        scores
      };
    } catch (error) {
      console.error('Filesystem search failed:', error instanceof Error ? error.message : String(error));
      return {
        memories: [],
        totalMatches: 0,
        scores: []
      };
    }
  }
  
  /**
   * Delete a memory entry from the memory bank
   * @param projectName - Project name
   * @param fileName - Memory entry name (with or without .md extension)
   * @returns Success message
   */
  async deleteMemory(projectName: string, fileName: string): Promise<string> {
    const memoryTitle = fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName;
    if (this.dbService) {
      try {
        const result = await this.dbService.deleteMemory(projectName, memoryTitle);
        if (result) return `Memory "${memoryTitle}" deleted successfully from project "${projectName}".`;
      } catch {}
    }
    const all = await this.readProjectJson(projectName);
    if (!(memoryTitle in all)) throw new Error(`Memory titled "${memoryTitle}" not found in project "${projectName}".`);
    delete all[memoryTitle];
    await this.writeProjectJson(projectName, all);
    return `Memory "${memoryTitle}" deleted successfully from project "${projectName}" (filesystem-json).`;
  }

  /**
   * Migra os arquivos .md existentes para o formato JSON único
   * @param projectName - Nome do projeto a ser migrado
   * @returns Mensagem de sucesso com estatísticas
   */
  async migrateProjectToJson(projectName: string): Promise<string> {
    const projectPath = path.join(this.memoryBankRoot, projectName);
    let migrationStats = {
      total: 0,
      success: 0,
      skipped: 0,
      errors: 0
    };
    
    try {
      // Verificar se o diretório do projeto existe
      if (!(await fs.pathExists(projectPath))) {
        return `Projeto "${projectName}" não encontrado.`;
      }
      
      // Obter todos os arquivos .md no diretório
      const files = await fs.readdir(projectPath);
      const mdFiles = files.filter(file => file.endsWith('.md'));
      
      migrationStats.total = mdFiles.length;
      
      if (mdFiles.length === 0) {
        return `Nenhum arquivo .md encontrado no projeto "${projectName}" para migrar.`;
      }
      
      // Carregar o JSON atual (caso já exista)
      const jsonData = await this.readProjectJson(projectName);
      
      // Processar cada arquivo .md
      for (const mdFile of mdFiles) {
        try {
          const memoryTitle = mdFile.slice(0, -3); // Remover extensão .md
          
          // Verificar se essa memória já existe no JSON
          if (jsonData[memoryTitle]) {
            migrationStats.skipped++;
            continue;
          }
          
          // Ler o conteúdo do arquivo .md
          const mdPath = path.join(projectPath, mdFile);
          const content = await fs.readFile(mdPath, 'utf-8');
          
          // Adicionar ao objeto JSON
          jsonData[memoryTitle] = content;
          migrationStats.success++;
          
        } catch (error) {
          console.error(`Erro ao migrar ${mdFile}:`, error instanceof Error ? error.message : String(error));
          migrationStats.errors++;
        }
      }
      
      // Salvar o JSON atualizado
      await this.writeProjectJson(projectName, jsonData);
      
      return `Migração do projeto "${projectName}" concluída com sucesso.\n` +
             `Total de arquivos: ${migrationStats.total}\n` +
             `Migrados com sucesso: ${migrationStats.success}\n` +
             `Ignorados (já existentes): ${migrationStats.skipped}\n` +
             `Erros: ${migrationStats.errors}`;
      
    } catch (error) {
      return `Erro ao migrar projeto "${projectName}": ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Migra todos os projetos para o formato JSON
   * @returns Mensagem de sucesso com estatísticas
   */
  async migrateAllProjectsToJson(): Promise<string> {
    try {
      const projects = await this.getProjectsFromFilesystem();
      if (projects.length === 0) {
        return "Nenhum projeto encontrado para migrar.";
      }
      
      const results: Record<string, string> = {};
      let totalSuccess = 0;
      
      for (const project of projects) {
        results[project] = await this.migrateProjectToJson(project);
        if (!results[project].includes('Erro')) {
          totalSuccess++;
        }
      }
      
      let summaryMessage = `Migração concluída para ${totalSuccess}/${projects.length} projetos.\n\n`;
      
      for (const [project, result] of Object.entries(results)) {
        summaryMessage += `## ${project}\n${result}\n\n`;
      }
      
      return summaryMessage;
      
    } catch (error) {
      return `Erro ao migrar projetos: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Verifica a integridade do arquivo JSON de um projeto
   * @param projectName - Nome do projeto a ser verificado
   * @returns Resultado da verificação
   */
  async verifyProjectJsonIntegrity(projectName: string): Promise<{
    isValid: boolean;
    errorMessage?: string;
    stats?: {
      totalEntries: number;
      validEntries: number;
      corruptedEntries: string[];
    }
  }> {
    try {
      const jsonPath = this.getProjectJsonPath(projectName);
      
      // Verificar se o arquivo existe
      if (!(await fs.pathExists(jsonPath))) {
        return {
          isValid: false,
          errorMessage: `Arquivo JSON não encontrado para o projeto "${projectName}"`
        };
      }
      
      // Ler o arquivo diretamente (sem usar cache)
      const raw = await fs.readFile(jsonPath, 'utf-8');
      
      try {
        // Verificar se é um JSON válido
        const data = JSON.parse(raw);
        
        if (typeof data !== 'object' || data === null) {
          return {
            isValid: false,
            errorMessage: `Formato inválido: o JSON não é um objeto`
          };
        }
        
        // Verificar cada entrada
        const stats = {
          totalEntries: Object.keys(data).length,
          validEntries: 0,
          corruptedEntries: [] as string[]
        };
        
        for (const [key, value] of Object.entries(data)) {
          if (typeof value !== 'string') {
            stats.corruptedEntries.push(key);
          } else {
            stats.validEntries++;
          }
        }
        
        return {
          isValid: stats.corruptedEntries.length === 0,
          stats
        };
        
      } catch (error) {
        // Erro ao analisar o JSON
        return {
          isValid: false,
          errorMessage: `JSON inválido: ${error instanceof Error ? error.message : String(error)}`
        };
      }
      
    } catch (error) {
      // Erro ao acessar o arquivo
      return {
        isValid: false,
        errorMessage: `Erro ao verificar integridade: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Tenta reparar um arquivo JSON corrompido
   * @param projectName - Nome do projeto a ser reparado
   * @returns Resultado da operação de reparo
   */
  async repairProjectJson(projectName: string): Promise<{
    success: boolean;
    message: string;
    entriesRecovered?: number;
    entriesLost?: number;
  }> {
    try {
      const jsonPath = this.getProjectJsonPath(projectName);
      const backupPath = this.getProjectJsonBackupPath(projectName);
      
      // Verificar integridade primeiro
      const integrityCheck = await this.verifyProjectJsonIntegrity(projectName);
      
      // Se o arquivo já está válido, não precisa reparar
      if (integrityCheck.isValid) {
        return {
          success: true,
          message: `O arquivo JSON do projeto "${projectName}" já está íntegro.`
        };
      }
      
      // Se o arquivo não existe, não há o que reparar
      if (!integrityCheck.stats) {
        // Verificar se existe backup
        if (await fs.pathExists(backupPath)) {
          // Restaurar do backup
          await fs.copyFile(backupPath, jsonPath);
          
          // Verificar se a restauração foi bem-sucedida
          const restoredCheck = await this.verifyProjectJsonIntegrity(projectName);
          if (restoredCheck.isValid) {
            return {
              success: true,
              message: `Arquivo JSON restaurado com sucesso a partir do backup.`,
              entriesRecovered: restoredCheck.stats?.validEntries || 0
            };
          }
        }
        
        // Criar um novo arquivo vazio
        await this.writeProjectJson(projectName, {});
        return {
          success: true,
          message: `Arquivo JSON não encontrado. Um novo arquivo vazio foi criado.`,
          entriesRecovered: 0
        };
      }
      
      // Se há entradas corrompidas, tentar repará-las
      if (integrityCheck.stats.corruptedEntries.length > 0) {
        // Ler o arquivo diretamente
        const raw = await fs.readFile(jsonPath, 'utf-8');
        let data: Record<string, any>;
        
        try {
          data = JSON.parse(raw);
        } catch {
          // Se não conseguir analisar o JSON, tentar restaurar do backup
          if (await fs.pathExists(backupPath)) {
            await fs.copyFile(backupPath, jsonPath);
            return {
              success: true,
              message: `JSON inválido. Arquivo restaurado do backup.`,
              entriesRecovered: 0
            };
          } else {
            // Criar um novo arquivo vazio
            await this.writeProjectJson(projectName, {});
            return {
              success: true,
              message: `JSON inválido e sem backup disponível. Um novo arquivo vazio foi criado.`,
              entriesRecovered: 0,
              entriesLost: 0
            };
          }
        }
        
        // Remover entradas corrompidas
        const repairedData: Record<string, string> = {};
        let entriesRecovered = 0;
        
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            repairedData[key] = value;
            entriesRecovered++;
          }
        }
        
        // Salvar o arquivo reparado
        await this.writeProjectJson(projectName, repairedData);
        
        // Limpar o cache
        this.clearProjectJsonCache(projectName);
        
        return {
          success: true,
          message: `Arquivo JSON reparado. ${entriesRecovered} entradas recuperadas, ${integrityCheck.stats.corruptedEntries.length} entradas perdidas.`,
          entriesRecovered,
          entriesLost: integrityCheck.stats.corruptedEntries.length
        };
      }
      
      return {
        success: false,
        message: `Não foi possível reparar o arquivo: ${integrityCheck.errorMessage}`
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Erro ao tentar reparar: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Otimiza o arquivo JSON de memória de um projeto específico
   * @param projectName - Nome do projeto a ser otimizado
   * @param options - Opções de otimização
   * @returns Mensagem de status da otimização
   */
  async optimizeProjectJson(
    projectName: string,
    options: {
      removeEmpty?: boolean;
      deduplicate?: boolean;
      createBackup?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const jsonPath = this.getProjectJsonPath(projectName);
      
      // Verificar se o arquivo existe
      if (!(await fs.pathExists(jsonPath))) {
        return `Erro: Arquivo JSON não encontrado para o projeto "${projectName}".`;
      }
      
      // Criar backup se solicitado (padrão é true)
      if (options.createBackup !== false) {
        const backupPath = path.join(
          path.dirname(jsonPath),
          `memory-bank.backup-${Date.now()}.json`
        );
        await fs.copyFile(jsonPath, backupPath);
      }
      
      // Ler dados JSON (direto do arquivo, ignorando o cache)
      const jsonRaw = await fs.readFile(jsonPath, 'utf-8');
      let jsonData: Record<string, string>;
      try {
        jsonData = JSON.parse(jsonRaw);
      } catch (error) {
        return `Erro: O arquivo JSON do projeto "${projectName}" está corrompido e não pode ser analisado.`;
      }
      
      // Estatísticas de otimização
      const stats = {
        before: {
          totalEntries: Object.keys(jsonData).length,
          totalSize: jsonRaw.length
        },
        removed: {
          empty: 0,
          duplicates: 0
        },
        after: {
          totalEntries: 0,
          totalSize: 0
        }
      };
      
      // Aplicar otimizações
      
      // 1. Remover entradas vazias ou quase vazias
      if (options.removeEmpty) {
        const keysToRemove = [];
        for (const [key, value] of Object.entries(jsonData)) {
          // Verificar se a entrada está vazia ou é muito pequena
          if (!value || value.trim().length < 10) {
            keysToRemove.push(key);
          }
        }
        
        // Remover as entradas identificadas
        for (const key of keysToRemove) {
          delete jsonData[key];
          stats.removed.empty++;
        }
      }
      
      // 2. Encontrar e mesclar duplicatas
      if (options.deduplicate) {
        const contentMap = new Map<string, string[]>();
        
        // Primeiro passo: agrupar por conteúdo similar
        for (const [key, value] of Object.entries(jsonData)) {
          // Calculamos um hash simples do conteúdo para comparação
          const contentHash = this.simpleContentHash(value);
          if (!contentMap.has(contentHash)) {
            contentMap.set(contentHash, []);
          }
          contentMap.get(contentHash)!.push(key);
        }
        
        // Segundo passo: mesclar duplicatas
        for (const [_, keys] of contentMap.entries()) {
          if (keys.length > 1) {
            // Manter a primeira entrada e remover as demais
            const primaryKey = keys[0];
            for (let i = 1; i < keys.length; i++) {
              delete jsonData[keys[i]];
              stats.removed.duplicates++;
            }
          }
        }
      }
      
      // Atualizar estatísticas finais
      stats.after.totalEntries = Object.keys(jsonData).length;
      
      // Salvar o JSON otimizado
      const optimizedJson = JSON.stringify(jsonData, null, 2);
      stats.after.totalSize = optimizedJson.length;
      
      await fs.writeFile(jsonPath, optimizedJson, 'utf-8');
      
      // Atualizar o cache
      this.clearProjectJsonCache(projectName);
      
      return `Otimização do JSON para o projeto "${projectName}" concluída com sucesso.\n\n` +
             `Estatísticas:\n` +
             `- Antes: ${stats.before.totalEntries} entradas, ${this.formatBytes(stats.before.totalSize)}\n` +
             `- Removidas: ${stats.removed.empty} entradas vazias, ${stats.removed.duplicates} duplicatas\n` +
             `- Depois: ${stats.after.totalEntries} entradas, ${this.formatBytes(stats.after.totalSize)}\n` +
             `- Redução: ${this.formatBytes(stats.before.totalSize - stats.after.totalSize)} (${
               Math.round((stats.before.totalSize - stats.after.totalSize) / stats.before.totalSize * 100)
             }%)`;
      
    } catch (error) {
      return `Erro ao otimizar JSON para o projeto "${projectName}": ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }
  
  /**
   * Otimiza os arquivos JSON de memória de todos os projetos
   * @param options - Opções de otimização
   * @returns Mensagem de status da otimização
   */
  async optimizeAllProjectsJson(
    options: {
      removeEmpty?: boolean;
      deduplicate?: boolean;
      createBackup?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const projects = await this.getProjectsFromFilesystem();
      if (projects.length === 0) {
        return "Nenhum projeto encontrado para otimizar.";
      }
      
      const results: Record<string, string> = {};
      let totalSuccess = 0;
      
      for (const project of projects) {
        // Verificar se o arquivo JSON existe para este projeto
        const jsonPath = this.getProjectJsonPath(project);
        if (!(await fs.pathExists(jsonPath))) {
          results[project] = `Arquivo JSON não encontrado.`;
          continue;
        }
        
        results[project] = await this.optimizeProjectJson(project, options);
        if (!results[project].includes('Erro')) {
          totalSuccess++;
        }
      }
      
      let summaryMessage = `Otimização concluída para ${totalSuccess}/${projects.length} projetos.\n\n`;
      
      for (const [project, result] of Object.entries(results)) {
        summaryMessage += `## ${project}\n${result}\n\n`;
      }
      
      return summaryMessage;
      
    } catch (error) {
      return `Erro ao otimizar projetos: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  /**
   * Calcula um hash simples do conteúdo para detecção de duplicatas
   * @param content - Conteúdo a ser hashado
   * @returns Hash simplificado
   */
  private simpleContentHash(content: string): string {
    // Normalizar o conteúdo removendo espaços extras e convertendo para minúsculas
    const normalized = content.trim().toLowerCase().replace(/\s+/g, ' ');
    
    // Caso o conteúdo seja muito grande, usamos apenas partes dele
    if (normalized.length > 1000) {
      return `${normalized.substring(0, 300)}|${normalized.substring(normalized.length - 300)}`;
    }
    
    return normalized;
  }
  
  /**
   * Formata tamanho em bytes para uma string legível
   * @param bytes - Tamanho em bytes
   * @returns String formatada (ex: "1.2 KB")
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Get all memory entries from the JSON file as MemoryEntry objects
   * @param projectName - Project name
   * @returns Array of MemoryEntry objects
   */
  private async getMemoriesFromJson(projectName: string): Promise<MemoryEntry[]> {
    const memories: MemoryEntry[] = [];
    
    try {
      // Ler o arquivo JSON
      const jsonData = await this.readProjectJson(projectName);
      
      // Obter estatísticas de arquivo para timestamps
      const jsonPath = this.getProjectJsonPath(projectName);
      let lastModified: Date;
      
      try {
        const stats = await fs.stat(jsonPath);
        lastModified = stats.mtime;
      } catch (error) {
        // Usar data atual se não for possível obter a data de modificação
        lastModified = new Date();
      }
      
      // Converter entradas JSON em objetos MemoryEntry
      for (const [memoryTitle, content] of Object.entries(jsonData)) {
        try {
          // Determinar tipo de memória
          const memoryType = this.getMemoryType(memoryTitle);
          
          // Criar entrada de memória
          const memoryEntry: MemoryEntry = {
            id: `${projectName}-${memoryTitle}`,
            project: projectName,
            title: memoryTitle,
            memoryType: memoryType as MemoryType,
            content: content,
            importance: 0.5, // Importância padrão
            accessCount: 1,
            createdAt: lastModified, // Usar a data de modificação do arquivo JSON
            lastAccessed: new Date(),
            lastUpdated: lastModified, // Usar a data de modificação do arquivo JSON
            metadata: this.extractMetadataFromContent(content)
          };
          
          memories.push(memoryEntry);
        } catch (error) {
          // Ignorar entradas que não podem ser processadas
          console.warn(`Error processing memory entry ${memoryTitle}:`, 
            error instanceof Error ? error.message : String(error));
        }
      }
    } catch (error) {
      console.warn(`Error reading JSON memories from project ${projectName}:`, 
        error instanceof Error ? error.message : String(error));
    }
    
    return memories;
  }

  /**
   * Start periodic automatic backup process
   * Executed every 5 minutes
   */
  private startAutomaticBackups(): void {
    // Clear any existing interval
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    // Set up a new interval (300000 ms = 5 minutes)
    this.backupInterval = setInterval(async () => {
      await this.performAutomaticBackup();
    }, 300000);
    
    // Debug log without interfering with MCP protocol
    if (process.env.DEBUG_MEMORY_BANK === 'true') {
      console.log('[@andrebuzeli/advanced-json-memory-bank] Automatic backup routine started (every 5 minutes)');
    }
  }

  /**
   * Stop automatic backup process
   */
  private stopAutomaticBackups(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('[MemoryManager] Automatic backup routine stopped');
    }
  }

  /**
   * Perform an automatic backup of the active project only
   */
  private async performAutomaticBackup(): Promise<void> {
    if (this.backupInProgress) {
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.log('[MemoryManager] Skipping backup - another backup is already in progress');
      }
      return;
    }

    // Only backup if there's an active project
    if (!this.activeProject) {
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.log('[MemoryManager] No active project for automatic backup');
      }
      return;
    }

    try {
      this.backupInProgress = true;
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.log(`[MemoryManager] Starting automatic backup for project: ${this.activeProject}`);
      }
      
      const timestamp = this.generateBackupTimestamp();
      const projectBackupDir = path.join(this.memoryBankBackup, this.activeProject);
      
      await fs.ensureDir(projectBackupDir);
      
      const backupFilePath = path.join(projectBackupDir, `${this.activeProject}_${timestamp}.json`);
      await this.backupProjectToFile(this.activeProject, backupFilePath);
      
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.log(`[MemoryManager] Automatic backup completed for ${this.activeProject} to ${backupFilePath}`);
      }
    } catch (error) {
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.error('[MemoryManager] Error during automatic backup:', 
          error instanceof Error ? error.message : String(error));
      }
    } finally {
      this.backupInProgress = false;
    }
  }

  /**
   * Reset/clear all memory entries for a project by deleting the JSON file
   * @param projectName - Project name
   * @param createBackup - Whether to create a backup before resetting
   * @returns Success message
   */
  async resetProjectMemory(projectName: string, createBackup: boolean = true): Promise<string> {
    try {
      const jsonPath = this.getProjectJsonPath(projectName);
      
      // Check if the project exists
      if (!(await fs.pathExists(jsonPath))) {
        return `Project "${projectName}" does not exist or has no memory data.`;
      }
      
      // Create backup if requested
      if (createBackup) {
        const timestamp = this.generateBackupTimestamp();
        const backupPath = path.join(
          this.memoryBankBackup,
          `${projectName}_reset_backup_${timestamp}.json`
        );
        
        // Ensure backup directory exists
        await fs.ensureDir(this.memoryBankBackup);
        
        // Copy current JSON file to backup
        await fs.copyFile(jsonPath, backupPath);
      }
      
      // Remove the JSON file
      await fs.remove(jsonPath);
      
      // Clear cache for this project
      this.clearProjectJsonCache(projectName);
      
      // Also try to delete from database if available
      if (this.dbService) {
        try {
          const memories = await this.dbService.getProjectMemories(projectName);
          for (const memory of memories) {
            await this.dbService.deleteMemory(projectName, memory.title);
          }
        } catch (error) {
          // Database deletion failed, but filesystem reset was successful
        }
      }
      
      const backupMessage = createBackup ? ' (backup created)' : '';
      return `Project "${projectName}" has been completely reset${backupMessage}. All memory entries have been deleted.`;
      
    } catch (error) {
      return `Error resetting project "${projectName}": ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Generate timestamp string for backups
   * Format: YYYY-MM-DD_HH-MM-SS
   */
  private generateBackupTimestamp(): string {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  /**
   * Backup a specific project to a directory
   * @param projectName - Name of the project to backup
   * @param backupDir - Directory to store the backup
   */
  private async backupProjectToDirectory(projectName: string, backupDir: string): Promise<void> {
    try {
      const projectDir = path.join(this.memoryBankRoot, projectName);
      const jsonPath = this.getProjectJsonPath(projectName);
      
      if (!(await fs.pathExists(jsonPath))) {
        console.log(`[MemoryManager] Skipping backup for project ${projectName} - no memory-bank.json found`);
        return;
      }
      
      // Create project directory in backup
      const projectBackupDir = path.join(backupDir, projectName);
      await fs.ensureDir(projectBackupDir);
      
      // Copy the project JSON file
      await fs.copy(jsonPath, path.join(projectBackupDir, 'memory-bank.json'));
      
      console.log(`[MemoryManager] Project ${projectName} backed up successfully`);
    } catch (error) {
      console.error(`[MemoryManager] Error backing up project ${projectName}:`, 
        error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Backup a single project to a specific file path
   * @param projectName - Name of the project to backup
   * @param backupFilePath - Full path where to save the backup file
   */
  private async backupProjectToFile(projectName: string, backupFilePath: string): Promise<void> {
    try {
      const jsonPath = this.getProjectJsonPath(projectName);
      
      if (!(await fs.pathExists(jsonPath))) {
        if (process.env.DEBUG_MEMORY_BANK === 'true') {
          console.log(`[MemoryManager] Skipping backup for project ${projectName} - no memory-bank.json found`);
        }
        return;
      }
      
      // Copy the project JSON file to the backup location
      await fs.copy(jsonPath, backupFilePath);
      
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.log(`[MemoryManager] Project ${projectName} backed up to ${backupFilePath}`);
      }
    } catch (error) {
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.error(`[MemoryManager] Error backing up project ${projectName}:`, 
          error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * Public method to create a manual backup of all projects to a specific directory
   * @param customBackupDir - Custom directory to store the backup (optional)
   * @returns Result message
   */
  public async createManualBackup(customBackupDir?: string): Promise<string> {
    if (this.backupInProgress) {
      return 'Another backup operation is already in progress. Please try again later.';
    }

    try {
      this.backupInProgress = true;
      const projects = await this.listProjects();
      
      if (projects.length === 0) {
        return 'No projects found to backup.';
      }

      const timestamp = this.generateBackupTimestamp();
      const backupDir = customBackupDir 
        ? path.join(customBackupDir, timestamp)
        : path.join(this.memoryBankBackup, timestamp);
      
      await fs.ensureDir(backupDir);
      
      const successfulBackups = [];
      const failedBackups = [];
      
      for (const project of projects) {
        try {
          await this.backupProjectToDirectory(project, backupDir);
          successfulBackups.push(project);
        } catch (error) {
          failedBackups.push(project);
          console.error(`Error backing up project ${project}:`, error);
        }
      }
      
      let resultMessage = `Backup completed at: ${backupDir}\n\n`;
      resultMessage += `Total projects: ${projects.length}\n`;
      resultMessage += `Successfully backed up: ${successfulBackups.length}\n`;
      
      if (failedBackups.length > 0) {
        resultMessage += `Failed backups: ${failedBackups.length} (${failedBackups.join(', ')})\n`;
      }
      
      return resultMessage;
    } catch (error) {
      return `Error creating backup: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      this.backupInProgress = false;
    }
  }

  /**
   * Get project summary with all modules/topics
   * @param projectName - Project name
   * @param detailed - Whether to include detailed information
   * @returns Project summary
   */
  async getProjectSummary(projectName: string, detailed: boolean = false): Promise<string> {
    try {
      const jsonData = await this.readProjectJson(projectName);
      
      if (Object.keys(jsonData).length === 0) {
        return `Project "${projectName}" has no memory entries.`;
      }
      
      let summary = `# 📋 Project Summary: ${projectName}\n\n`;
      summary += `**Total Modules/Topics:** ${Object.keys(jsonData).length}\n`;
      summary += `**Last Updated:** ${new Date().toISOString().split('T')[0]}\n\n`;
      
      // Check if there's a summary module
      if (jsonData['summary']) {
        summary += `## 📖 Project Overview\n\n`;
        if (detailed) {
          summary += `${jsonData['summary']}\n\n`;
        } else {
          // Extract first paragraph only
          const firstParagraph = jsonData['summary'].split('\n\n')[0];
          summary += `${firstParagraph}${jsonData['summary'].length > firstParagraph.length ? '...' : ''}\n\n`;
        }
      }
      
      // List all modules
      summary += `## 📑 Available Modules/Topics\n\n`;
      
      const sortedKeys = Object.keys(jsonData).sort();
      for (let i = 0; i < sortedKeys.length; i++) {
        const key = sortedKeys[i];
        const content = jsonData[key];
        
        summary += `### ${i + 1}. ${key}\n`;
        
        if (detailed) {
          // Include more details
          const contentLength = content.length;
          const firstLine = content.split('\n')[0] || 'No content';
          summary += `**Size:** ${this.formatBytes(contentLength)}\n`;
          summary += `**Preview:** ${firstLine}\n`;
          
          // Extract memory type if recognizable
          const memoryType = this.getMemoryType(key);
          summary += `**Type:** ${String(memoryType)}\n`;
        } else {
          // Just basic info
          const contentPreview = content.substring(0, 100);
          summary += `${contentPreview}${content.length > 100 ? '...' : ''}\n`;
        }
        
        summary += `\n`;
      }
      
      // Add statistics
      if (detailed) {
        const totalSize = Object.values(jsonData).reduce((sum, content) => sum + content.length, 0);
        const avgSize = Math.round(totalSize / Object.keys(jsonData).length);
        
        summary += `## 📊 Statistics\n\n`;
        summary += `- **Total Content Size:** ${this.formatBytes(totalSize)}\n`;
        summary += `- **Average Module Size:** ${this.formatBytes(avgSize)}\n`;
        summary += `- **Modules by Type:**\n`;
        
        // Count by type
        const typeCount: Record<string, number> = {};
        for (const key of Object.keys(jsonData)) {
          const type = String(this.getMemoryType(key));
          typeCount[type] = (typeCount[type] || 0) + 1;
        }
        
        for (const [type, count] of Object.entries(typeCount)) {
          summary += `  - ${type}: ${count}\n`;
        }
      }
      
      summary += `\n---\n*Generated on ${new Date().toISOString()}*`;
      
      return summary;
      
    } catch (error) {
      return `Error generating summary for project "${projectName}": ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Update project summary
   * @param projectName - Project name
   * @param summaryContent - Summary content
   * @param operation - Operation to perform
   * @returns Success message
   */
  async updateProjectSummary(
    projectName: string, 
    summaryContent: string, 
    operation: 'create' | 'update' | 'append' = 'update'
  ): Promise<string> {
    try {
      const jsonData = await this.readProjectJson(projectName);
      
      switch (operation) {
        case 'create':
          if (jsonData['summary']) {
            return `Summary already exists for project "${projectName}". Use 'update' or 'append' operation instead.`;
          }
          jsonData['summary'] = summaryContent;
          break;
          
        case 'update':
          jsonData['summary'] = summaryContent;
          break;
          
        case 'append':
          if (jsonData['summary']) {
            jsonData['summary'] += '\n\n' + summaryContent;
          } else {
            jsonData['summary'] = summaryContent;
          }
          break;
      }
      
      await this.writeProjectJson(projectName, jsonData);
      
      return `Summary ${operation}d successfully for project "${projectName}".`;
      
    } catch (error) {
      return `Error updating summary for project "${projectName}": ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Escape special characters for use in regular expressions
   * @param string - String to escape
   * @returns Escaped string
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}