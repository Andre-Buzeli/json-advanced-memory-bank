/**
 * Memory manager for the advanced vector-based memory system
 * Refactored version using modular architecture
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
  MemoryType,
  ProjectJsonStructure
} from '../types/index.js';

// Import modular components
import { CacheManager } from './storage/cache-manager.js';
import { MemoryStorage } from './storage/memory-storage.js';
import { ProjectDetector } from './project/project-detector.js';
import { BackupManager } from './backup/backup-manager.js';
import { 
  MemoryBankError, 
  ProjectNotFoundError, 
  BackupError 
} from './errors/custom-errors.js';
import { ErrorRecoveryService } from './errors/error-recovery.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Manager for all memory operations with vector semantics
 * Refactored to use modular architecture
 */
export class MemoryManager {
  private dbService: DatabaseService | null;
  private embeddingService: EmbeddingService;
  private memoryBankRoot: string;
  private memoryBankBackup: string;
  private pruningThreshold: number;
  private similarityThreshold: number;
  private maxMemoryEntries: number;
  private backupInterval: NodeJS.Timeout | null = null;
  private backupInProgress: boolean = false;
  
  // Modular components
  private cacheManager: CacheManager;
  private memoryStorage: MemoryStorage;
  private projectDetector: ProjectDetector;
  private backupManager: BackupManager;
  private errorRecovery: ErrorRecoveryService;
  
  constructor() {
    this.embeddingService = new EmbeddingService();
    
    this.memoryBankRoot = process.env.MEMORY_BANK_ROOT || './memory-banks';
    this.memoryBankBackup = process.env.MEMORY_BANK_BACKUP || path.join(this.memoryBankRoot, 'backups');
    this.pruningThreshold = parseFloat(process.env.MEMORY_PRUNING_THRESHOLD || '0.85');
    this.similarityThreshold = parseFloat(process.env.MEMORY_SIMILARITY_THRESHOLD || '0.90');
    this.maxMemoryEntries = parseInt(process.env.MEMORY_MAX_ENTRIES || '1000');
    
    // Initialize modular components
    this.cacheManager = new CacheManager();
    this.memoryStorage = new MemoryStorage(this.memoryBankRoot, this.cacheManager);
    this.projectDetector = new ProjectDetector();
    this.backupManager = new BackupManager(this.memoryBankBackup);
    this.errorRecovery = new ErrorRecoveryService();
    
    // Ensure directories exist
    fs.ensureDirSync(this.memoryBankRoot);
    fs.ensureDirSync(this.memoryBankBackup);
    
    // Start automatic backup routine
    this.startAutomaticBackups();
    
    // Initialize database service with error handling
    this.dbService = null;
    
    // By default, we're using filesystem-only mode (no external dependencies)
    const databaseEnabled = process.env.ENABLE_DATABASE === 'true';
    
    if (databaseEnabled) {
      this.initializeDatabase().catch(error => {
        process.stderr.write(`[MemoryManager] Database initialization failed: ${error}\n`);
      });
    }
  }
  
  /**
   * Initialize database service asynchronously
   */
  private async initializeDatabase(): Promise<void> {
    try {
      const { DatabaseService } = await import('../database/database-service.js');
      this.dbService = new DatabaseService();
    } catch (error) {
      this.dbService = null;
    }
  }

  /**
   * Get current project name using project detector
   */
  getCurrentProjectName(): string {
    return this.projectDetector.getCurrentProjectName();
  }

  /**
   * Set active project manually
   */
  setActiveProject(projectName: string): void {
    this.projectDetector.setActiveProject(projectName);
  }

  /**
   * List all projects in the memory bank
   */
  async listProjects(): Promise<string[]> {
    try {
      let dbProjects: string[] = [];
      
      // Check database for projects if available
      if (this.dbService) {
        try {
          dbProjects = await this.dbService.getProjects();
        } catch (error) {
          // Database query failed, using filesystem only
        }
      }
      
      // Check filesystem for JSON files (main source of truth)
      const fsProjects = await this.getProjectsFromJsonFiles();
      
      // Combine and deduplicate
      return [...new Set([...dbProjects, ...fsProjects])];
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'listProjects',
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
      return [];
    }
  }

  /**
   * Get projects from JSON files in the filesystem
   */
  private async getProjectsFromJsonFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.memoryBankRoot);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
    } catch (error) {
      return [];
    }
  }

  /**
   * List files in a specific project
   */
  async listProjectFiles(projectName?: string): Promise<string[]> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      const projectData = await this.readProjectJson(effectiveProjectName);
      return Object.keys(projectData.memories);
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'listProjectFiles',
        projectName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
      return [];
    }
  }

  /**
   * Read project JSON data
   */
  private async readProjectJson(projectName: string): Promise<ProjectJsonStructure> {
    return await this.memoryStorage.readProjectJson(projectName);
  }

  /**
   * Write project JSON data
   */
  private async writeProjectJson(projectName: string, data: ProjectJsonStructure): Promise<void> {
    await this.memoryStorage.writeProjectJson(projectName, data);
  }

  /**
   * Read memory from storage
   */
  async readMemory(fileName: string, projectName?: string): Promise<string> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      const projectData = await this.readProjectJson(effectiveProjectName);
      
      if (!projectData.memories[fileName]) {
        throw new ProjectNotFoundError(
          `Memory '${fileName}' not found in project '${effectiveProjectName}'`,
          { operation: 'readMemory', projectName: effectiveProjectName, fileName, timestamp: new Date().toISOString() }
        );
      }
      
      return projectData.memories[fileName];
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'readMemory',
        projectName,
        fileName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
      return '';
    }
  }

  /**
   * Write memory to storage
   */
  async writeMemory(fileName: string, content: string, projectName?: string): Promise<void> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      const projectData = await this.readProjectJson(effectiveProjectName);
      
      projectData.memories[fileName] = content;
      projectData.lastUpdated = new Date().toISOString();
      
      await this.writeProjectJson(effectiveProjectName, projectData);
      
      // Create backup if needed
      if (this.backupManager.canCreateBackup(effectiveProjectName)) {
        await this.backupManager.createBackup(effectiveProjectName);
      }
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'writeMemory',
        projectName,
        fileName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
    }
  }

  /**
   * Update memory with advanced operations
   */
  async updateMemory(
    fileName: string, 
    content: string, 
    operation: 'append' | 'prepend' | 'replace' = 'replace',
    projectName?: string,
    removeText?: string
  ): Promise<void> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      const projectData = await this.readProjectJson(effectiveProjectName);
      
      let existingContent = projectData.memories[fileName] || '';
      
      // Remove text if specified
      if (removeText && existingContent.includes(removeText)) {
        existingContent = existingContent.replace(removeText, '');
      }
      
      // Apply operation
      switch (operation) {
        case 'append':
          projectData.memories[fileName] = existingContent + '\n' + content;
          break;
        case 'prepend':
          projectData.memories[fileName] = content + '\n' + existingContent;
          break;
        case 'replace':
        default:
          projectData.memories[fileName] = content;
          break;
      }
      
      projectData.lastUpdated = new Date().toISOString();
      await this.writeProjectJson(effectiveProjectName, projectData);
      
      // Create backup if needed
      if (this.backupManager.canCreateBackup(effectiveProjectName)) {
        await this.backupManager.createBackup(effectiveProjectName);
      }
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'updateMemory',
        projectName,
        fileName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
    }
  }

  /**
   * Delete memory from storage
   */
  async deleteMemory(fileName: string, projectName?: string): Promise<void> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      const projectData = await this.readProjectJson(effectiveProjectName);
      
      if (projectData.memories[fileName]) {
        delete projectData.memories[fileName];
        projectData.lastUpdated = new Date().toISOString();
        await this.writeProjectJson(effectiveProjectName, projectData);
      }
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'deleteMemory',
        projectName,
        fileName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
    }
  }

  /**
   * Reset project memory completely
   */
  async resetProjectMemory(projectName?: string, createBackup = true): Promise<void> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      
      // Create backup before reset if requested
      if (createBackup && this.backupManager.canCreateBackup(effectiveProjectName, true)) {
        await this.backupManager.createBackup(effectiveProjectName, { force: true });
      }
      
      // Reset project data
      const newProjectData: ProjectJsonStructure = {
        projectName: effectiveProjectName,
        lastUpdated: new Date().toISOString(),
        summary: '',
        memories: {}
      };
      
      await this.writeProjectJson(effectiveProjectName, newProjectData);
      
      // Clear cache for this project
      this.cacheManager.delete(effectiveProjectName);
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'resetProjectMemory',
        projectName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
    }
  }

  /**
   * Get project summary
   */
  async getProjectSummary(projectName?: string, detailed = false): Promise<any> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      const projectData = await this.readProjectJson(effectiveProjectName);
      
      if (detailed) {
        return {
          projectName: effectiveProjectName,
          summary: projectData.summary,
          lastUpdated: projectData.lastUpdated,
          memoryCount: Object.keys(projectData.memories).length,
          memories: Object.keys(projectData.memories).map(key => ({
            fileName: key,
            preview: projectData.memories[key].substring(0, 200) + '...',
            size: projectData.memories[key].length
          }))
        };
      }
      
      return {
        projectName: effectiveProjectName,
        summary: projectData.summary,
        memoryCount: Object.keys(projectData.memories).length
      };
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'getProjectSummary',
        projectName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
      return { projectName: projectName || this.getCurrentProjectName(), summary: '', memoryCount: 0 };
    }
  }

  /**
   * Update project summary
   */
  async updateProjectSummary(
    content: string, 
    operation: 'create' | 'update' | 'append' = 'update',
    projectName?: string
  ): Promise<void> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      const projectData = await this.readProjectJson(effectiveProjectName);
      
      switch (operation) {
        case 'append':
          projectData.summary = (projectData.summary || '') + '\n' + content;
          break;
        case 'create':
        case 'update':
        default:
          projectData.summary = content;
          break;
      }
      
      projectData.lastUpdated = new Date().toISOString();
      await this.writeProjectJson(effectiveProjectName, projectData);
      
      // Create backup if needed
      if (this.backupManager.canCreateBackup(effectiveProjectName)) {
        await this.backupManager.createBackup(effectiveProjectName);
      }
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'updateProjectSummary',
        projectName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
    }
  }

  /**
   * Semantic search across memories
   */
  async semanticSearch(
    query: string,
    projectName?: string,
    limit = 10,
    similarityThreshold = 0.7
  ): Promise<MemorySearchResult[]> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      
      // Get all memories for the project
      const projectData = await this.readProjectJson(effectiveProjectName);
      const memories = projectData.memories;
      
      if (Object.keys(memories).length === 0) {
        return [];
      }
      
      // Calculate query embedding
      const queryEmbedding = this.embeddingService.generateEmbedding(query);
      
      const results: MemorySearchResult[] = [];
      
      for (const [fileName, content] of Object.entries(memories)) {
        if (typeof content === 'string') {
          // Calculate content embedding
          const contentEmbedding = this.embeddingService.generateEmbedding(content);
          
          // Calculate similarity
          const similarity = this.embeddingService.cosineSimilarity(queryEmbedding, contentEmbedding);
          
          if (similarity >= similarityThreshold) {
            results.push({
              content,
              metadata: {
                projectName: effectiveProjectName,
                fileName,
                memoryType: 'text' as MemoryType,
                lastUpdated: new Date().toISOString(),
                tags: [],
                importance: 1.0
              },
              score: similarity,
              embedding: contentEmbedding
            });
          }
        }
      }
      
      // Sort by similarity and limit results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'semanticSearch',
        projectName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
      return [];
    }
  }

  /**
   * Context intelligence for relevant file suggestions
   */
  async contextIntelligence(
    taskDescription: string,
    projectName?: string,
    maxSuggestions = 5
  ): Promise<any> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      
      // Use semantic search to find relevant memories
      const searchResults = await this.semanticSearch(taskDescription, effectiveProjectName, maxSuggestions);
      
      return {
        suggestions: searchResults.map(result => ({
          fileName: result.metadata.fileName,
          relevanceScore: result.score,
          preview: result.content.substring(0, 200) + '...',
          reason: `High semantic similarity (${(result.score * 100).toFixed(1)}%) to task description`
        })),
        taskContext: taskDescription,
        projectName: effectiveProjectName,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'contextIntelligence',
        projectName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
      return { suggestions: [], taskContext: taskDescription, projectName: projectName || this.getCurrentProjectName() };
    }
  }

  /**
   * Create manual backup
   */
  async createBackup(projectName?: string, customPath?: string): Promise<string> {
    try {
      const effectiveProjectName = projectName || this.getCurrentProjectName();
      return await this.backupManager.createBackup(effectiveProjectName, {
        force: true,
        customPath
      });
    } catch (error) {
      const handled = await this.errorRecovery.recoverFromError(error as Error, {
        operation: 'createBackup',
        projectName,
        timestamp: new Date().toISOString()
      });
      if (!handled.recovered) {
        throw error;
      }
      return '';
    }
  }

  /**
   * Start automatic backup routine
   */
  private startAutomaticBackups(): void {
    // Clear existing interval if any
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    
    // Start backup every 10 minutes
    this.backupInterval = setInterval(async () => {
      if (!this.backupInProgress) {
        this.backupInProgress = true;
        try {
          const projects = await this.listProjects();
          for (const project of projects) {
            if (this.backupManager.canCreateBackup(project)) {
              await this.backupManager.createBackup(project);
            }
          }
        } catch (error) {
          process.stderr.write(`[MemoryManager] Automatic backup failed: ${error}\n`);
        } finally {
          this.backupInProgress = false;
        }
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Stop automatic backups (cleanup)
   */
  public cleanup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  // Legacy methods for backward compatibility
  
  /**
   * @deprecated Use semanticSearch instead
   */
  async searchMemories(params: MemorySearchParams): Promise<MemorySearchResult[]> {
    return this.semanticSearch(
      params.query,
      params.projectName,
      params.limit,
      params.similarityThreshold
    );
  }

  /**
   * @deprecated Use writeMemory instead
   */
  async upsertMemory(params: MemoryUpsertParams): Promise<void> {
    await this.writeMemory(
      params.id,
      params.content,
      params.projectName
    );
  }

  /**
   * @deprecated Use deleteMemory instead
   */
  async deleteMemoryEntry(id: string, projectName?: string): Promise<void> {
    await this.deleteMemory(id, projectName);
  }
}

// Export for backward compatibility
export default MemoryManager;
