/**
 * Memory manager for Advanced Memory Bank MCP v3.0.0
 * Simplified - Auto project detection, no backup system
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { EmbeddingService } from './embedding-service.js';
import { ContentAnalysisService } from './content-analysis.js';
import { SmartSummaryService } from './smart-summary.js';
import { ProjectDetector } from './project/project-detector.js';
// Import DatabaseService only when needed to avoid initialization errors
import type { DatabaseService } from '../database/database-service.js';
import {
  MemoryEntry,
  MemoryMetadata,
  EnhancedMemoryMetadata,
  MemorySearchParams,
  MemorySearchResult,
  MemoryUpsertParams,
  MemoryType,
  MemoryCategory,
  ImportanceLevel,
  ProjectJsonStructure,
  EnhancedProjectStructure,
  SmartSummary,
  ContentAnalysis,
  MemoryTemplate,
  MemoryRelationships
} from '../types/index.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Manager for all memory operations v3.0.0
 * Simplified with auto project detection and no backup system
 */
export class MemoryManager {
  private dbService: DatabaseService | null;
  private embeddingService: EmbeddingService;
  private contentAnalysisService: ContentAnalysisService;
  private smartSummaryService: SmartSummaryService;
  private projectDetector: ProjectDetector;
  private memoryBankRoot: string;
  private pruningThreshold: number;
  private similarityThreshold: number;
  private maxMemoryEntries: number;
  private jsonCache: Map<string, {data: ProjectJsonStructure, timestamp: number}>;
  private jsonCacheLifetime: number;
  
  constructor() {
    this.embeddingService = new EmbeddingService();
    this.contentAnalysisService = new ContentAnalysisService();
    this.smartSummaryService = new SmartSummaryService();
    this.projectDetector = new ProjectDetector();
    
    this.memoryBankRoot = process.env.MEMORY_BANK_ROOT || './memory-banks';
    this.pruningThreshold = parseFloat(process.env.MEMORY_PRUNING_THRESHOLD || '0.85');
    this.similarityThreshold = parseFloat(process.env.MEMORY_SIMILARITY_THRESHOLD || '0.90');
    this.maxMemoryEntries = parseInt(process.env.MEMORY_MAX_ENTRIES || '1000');
    this.jsonCache = new Map();
    this.jsonCacheLifetime = parseInt(process.env.MEMORY_JSON_CACHE_LIFETIME || '60000'); // 1 minuto padrão
    
    // Ensure memory bank root directory exists
    fs.ensureDirSync(this.memoryBankRoot);
    
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
   * Get current project name (auto-detected from IDE workspace)
   */
  getCurrentProjectName(): string {
    return this.projectDetector.getCurrentProjectName();
  }

  /**
   * Get effective project name for all operations
   */
  private getEffectiveProjectName(): string {
    return this.projectDetector.getEffectiveProjectName();
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const { DatabaseService } = await import('../database/database-service.js');
      this.dbService = new DatabaseService();
      
      if (this.dbService.isReady()) {
        process.stderr.write(`[MemoryManager] Database service initialized successfully\n`);
      }
    } catch (error) {
      process.stderr.write(`[MemoryManager] Failed to initialize database: ${error}\n`);
      this.dbService = null;
    }
  }

  /**
   * Get the file path for a project's JSON file
   */
  private getProjectJsonPath(projectName?: string): string {
    const effectiveProjectName = projectName || this.getEffectiveProjectName();
    return path.join(this.memoryBankRoot, `${effectiveProjectName}.json`);
  }

  /**
   * Read project data from JSON file with caching
   */
  private async readProjectJson(projectName?: string): Promise<ProjectJsonStructure> {
    const effectiveProjectName = projectName || this.getEffectiveProjectName();
    const cacheKey = `project:${effectiveProjectName}`;
    
    // Check cache first
    const cached = this.jsonCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.jsonCacheLifetime) {
      return cached.data;
    }

    const jsonPath = this.getProjectJsonPath(effectiveProjectName);
    
    try {
      if (await fs.pathExists(jsonPath)) {
        const data = await fs.readJson(jsonPath);
        
        // Validate and migrate data structure if needed
        const validatedData = this.validateAndMigrateProjectStructure(data, effectiveProjectName);
        
        // Update cache
        this.jsonCache.set(cacheKey, {
          data: validatedData,
          timestamp: Date.now()
        });
        
        return validatedData;
      } else {
        // Create default structure
        const defaultData = this.createDefaultProjectStructure(effectiveProjectName);
        await this.writeProjectJson(defaultData, effectiveProjectName);
        return defaultData;
      }
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error reading project JSON for ${effectiveProjectName}: ${error}\n`);
      
      // Return minimal valid structure
      const fallbackData = this.createDefaultProjectStructure(effectiveProjectName);
      return fallbackData;
    }
  }

  /**
   * Write project data to JSON file and update cache
   */
  private async writeProjectJson(data: ProjectJsonStructure, projectName?: string): Promise<void> {
    const effectiveProjectName = projectName || this.getEffectiveProjectName();
    const jsonPath = this.getProjectJsonPath(effectiveProjectName);
    const cacheKey = `project:${effectiveProjectName}`;
    
    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(jsonPath));
      
      // Write to file
      await fs.writeJson(jsonPath, data, { spaces: 2 });
      
      // Update cache
      this.jsonCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error writing project JSON for ${effectiveProjectName}: ${error}\n`);
      throw error;
    }
  }

  /**
   * Create default project structure
   */
  private createDefaultProjectStructure(projectName: string): ProjectJsonStructure {
    return {
      project: projectName,
      summary: `Project: ${projectName}`,
      memories: {},
      workflow: {
        mode: 'PLAN',
        complexity: 2,
        lastTransition: new Date().toISOString()
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalMemories: 0,
        version: '3.0.5'
      }
    };
  }

  /**
   * Validate and migrate project structure if needed
   */
  private validateAndMigrateProjectStructure(data: any, projectName: string): ProjectJsonStructure {
    // Basic validation and migration logic
    const validated: ProjectJsonStructure = {
      project: data.project || projectName,
      summary: data.summary || `Project: ${projectName}`,
      memories: data.memories || {},
      workflow: {
        mode: data.workflow?.mode || 'PLAN',
        complexity: data.workflow?.complexity || 2,
        lastTransition: data.workflow?.lastTransition || new Date().toISOString()
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalMemories: Object.keys(data.memories || {}).length,
        version: '3.0.5',
        ...data.metadata
      }
    };
    
    return validated;
  }

  /**
   * Clear cache for specific project or all projects
   */
  private clearCache(projectName?: string): void {
    if (projectName) {
      const cacheKey = `project:${projectName}`;
      this.jsonCache.delete(cacheKey);
    } else {
      this.jsonCache.clear();
    }
  }

  /**
   * Store a memory entry (auto-detects project)
   */
  async storeMemory(title: string, content: string, metadata?: Partial<MemoryMetadata>): Promise<void> {
    const projectName = this.getEffectiveProjectName();
    
    try {
      // Read current project data
      const projectData = await this.readProjectJson();
      
      // Analyze content for enhanced metadata
      const analysis = this.contentAnalysisService.analyzeContent(content, title, metadata);
      const enhancedMetadata = this.contentAnalysisService.generateEnhancedMetadata(content, title, analysis, metadata);
      
      // Create memory entry
      const memoryEntry: MemoryEntry = {
        title,
        content,
        timestamp: new Date().toISOString(),
        metadata: enhancedMetadata,
        vector: await this.embeddingService.generateEmbedding(content)
      };
      
      // Store in project data
      projectData.memories[title] = content;
      projectData.metadata.lastUpdated = new Date().toISOString();
      projectData.metadata.totalMemories = Object.keys(projectData.memories).length;
      
      // Update project summary
      const allMemoryEntries = Object.entries(projectData.memories).map(([key, value]) => ({
        title: key,
        content: value,
        timestamp: new Date().toISOString(),
        metadata: {},
        vector: []
      }));
      const smartSummary = this.smartSummaryService.generateProjectSummary(allMemoryEntries, projectName);
      projectData.summary = smartSummary.overview;
      
      // Save to filesystem
      await this.writeProjectJson(projectData);
      
      // Store in database if available
      if (this.dbService && this.dbService.isReady()) {
        await this.dbService.storeMemory(memoryEntry, projectName);
      }
      
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error storing memory: ${error}\n`);
      throw error;
    }
  }

  /**
   * Read a memory entry (auto-detects project)
   */
  async readMemory(title: string): Promise<string> {
    const projectName = this.getEffectiveProjectName();
    
    try {
      const projectData = await this.readProjectJson();
      
      if (projectData.memories[title]) {
        return projectData.memories[title];
      } else {
        throw new Error(`Memory '${title}' not found in project '${projectName}'`);
      }
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error reading memory: ${error}\n`);
      throw error;
    }
  }

  /**
   * Update memory with various operations (auto-detects project)
   */
  async updateMemory(args: any): Promise<string> {
    const projectName = this.getEffectiveProjectName();
    
    try {
      // Handle batch updates
      if (args.updates && Array.isArray(args.updates)) {
        const results: string[] = [];
        for (const update of args.updates) {
          const result = await this.updateSingleMemory(update, projectName);
          results.push(result);
        }
        return results.join('\n');
      } else {
        // Single update
        return await this.updateSingleMemory(args, projectName);
      }
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error updating memory: ${error}\n`);
      throw error;
    }
  }

  /**
   * Update a single memory entry
   */
  private async updateSingleMemory(args: any, projectName: string): Promise<string> {
    const { fileName, content, operation = 'append', insertAfter, insertBefore, removeText, replaceText } = args;
    
    if (!fileName) {
      throw new Error('fileName is required');
    }
    
    const projectData = await this.readProjectJson();
    let existingContent = projectData.memories[fileName] || '';
    
    // Handle removeText first
    if (removeText) {
      existingContent = existingContent.replace(removeText, '');
    }
    
    // Handle replaceText
    if (replaceText) {
      existingContent = existingContent.replace(replaceText.find, replaceText.replace);
    }
    
    // Handle content addition
    if (content) {
      switch (operation) {
        case 'prepend':
          existingContent = content + '\n\n' + existingContent;
          break;
        case 'replace':
          existingContent = content;
          break;
        case 'insert_after':
          if (insertAfter) {
            existingContent = existingContent.replace(insertAfter, insertAfter + '\n\n' + content);
          } else {
            existingContent += '\n\n' + content;
          }
          break;
        case 'insert_before':
          if (insertBefore) {
            existingContent = existingContent.replace(insertBefore, content + '\n\n' + insertBefore);
          } else {
            existingContent = content + '\n\n' + existingContent;
          }
          break;
        default: // append
          existingContent += '\n\n' + content;
          break;
      }
    }
    
    // Update memory
    projectData.memories[fileName] = existingContent;
    projectData.metadata.lastUpdated = new Date().toISOString();
    
    await this.writeProjectJson(projectData);
    
    return `Memory '${fileName}' updated successfully in project '${projectName}'`;
  }

  /**
   * List memories with summaries (auto-detects project)
   */
  async listMemoriesWithSummary(): Promise<string> {
    const projectName = this.getEffectiveProjectName();
    
    try {
      const projectData = await this.readProjectJson();
      const memories = projectData.memories;
      const memoryCount = Object.keys(memories).length;
      
      if (memoryCount === 0) {
        return `# 📋 Memories: ${projectName}\n\n**Total:** 0 memories\n\n*No memories found. Create your first memory with memory_bank_write.*\n\n---\n*Updated: ${new Date().toLocaleDateString()}*`;
      }
      
      let result = `# 📋 Memories: ${projectName}\n\n**Total:** ${memoryCount} memories\n\n`;
      
      const memoryEntries = Object.entries(memories);
      memoryEntries.forEach(([title, content], index) => {
        const summary = this.generateMemorySummary(content);
        result += `${index + 1}. **${title}** - ${summary}\n`;
      });
      
      result += `\n---\n*Updated: ${new Date().toLocaleDateString()}*`;
      
      return result;
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error listing memories: ${error}\n`);
      throw error;
    }
  }

  /**
   * Generate brief summary from memory content
   */
  private generateMemorySummary(content: string): string {
    // Remove markdown formatting
    let clean = content
      .replace(/^#+\s*/gm, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links
    
    // Get first meaningful line
    const lines = clean.split('\n').filter(line => line.trim().length > 0);
    const firstLine = lines[0] || 'No content';
    
    // Limit to 70 characters
    if (firstLine.length <= 70) {
      return firstLine;
    } else {
      return firstLine.substring(0, 67) + '...';
    }
  }

  /**
   * Reset project (auto-detects project)
   */
  async resetProject(): Promise<void> {
    const projectName = this.getEffectiveProjectName();
    
    try {
      const defaultData = this.createDefaultProjectStructure(projectName);
      await this.writeProjectJson(defaultData);
      this.clearCache(projectName);
      
      process.stderr.write(`[MemoryManager] Project '${projectName}' reset successfully\n`);
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error resetting project: ${error}\n`);
      throw error;
    }
  }

  /**
   * Semantic search (auto-detects project)
   */
  async semanticSearch(query: string, options: { limit?: number; similarityThreshold?: number } = {}): Promise<MemorySearchResult> {
    const projectName = this.getEffectiveProjectName();
    const { limit = 5, similarityThreshold = 0.7 } = options;
    
    try {
      const projectData = await this.readProjectJson();
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      const results: Array<{ title: string; content: string; similarity: number }> = [];
      
      for (const [title, content] of Object.entries(projectData.memories)) {
        const contentEmbedding = await this.embeddingService.generateEmbedding(content);
        const similarity = this.embeddingService.calculateSimilarity(queryEmbedding, contentEmbedding);
        
        if (similarity >= similarityThreshold) {
          results.push({ title, content, similarity });
        }
      }
      
      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity);
      
      // Limit results
      const limitedResults = results.slice(0, limit);
      
      return {
        query,
        results: limitedResults.map(r => ({
          title: r.title,
          content: r.content,
          relevanceScore: r.similarity,
          summary: this.generateMemorySummary(r.content),
          metadata: {}
        })),
        totalResults: results.length,
        searchMetadata: {
          projectName,
          similarityThreshold,
          executionTime: Date.now()
        }
      };
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error in semantic search: ${error}\n`);
      throw error;
    }
  }

  /**
   * Get context intelligence (auto-detects project)
   */
  async getContextIntelligence(taskDescription: string, currentContext?: string, maxSuggestions: number = 5): Promise<any> {
    const projectName = this.getEffectiveProjectName();
    
    try {
      // Use semantic search to find relevant memories
      const searchResults = await this.semanticSearch(taskDescription, { limit: maxSuggestions, similarityThreshold: 0.6 });
      
      return {
        taskDescription,
        projectName,
        suggestions: searchResults.results.map(r => ({
          memoryTitle: r.title,
          relevance: r.relevanceScore,
          summary: r.summary,
          reason: `Related to: "${taskDescription}"`
        })),
        totalSuggestions: searchResults.results.length,
        context: currentContext || 'No additional context provided'
      };
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error getting context intelligence: ${error}\n`);
      throw error;
    }
  }

  /**
   * Analyze memory bank (auto-detects project)
   */
  async analyzeMemoryBank(analysisType: string = 'all', includeMetrics: boolean = true): Promise<any> {
    const projectName = this.getEffectiveProjectName();
    
    try {
      const projectData = await this.readProjectJson();
      const memories = projectData.memories;
      
      const analysis: any = {
        projectName,
        analysisType,
        summary: {
          totalMemories: Object.keys(memories).length,
          lastUpdated: projectData.metadata.lastUpdated
        }
      };
      
      if (analysisType === 'all' || analysisType === 'dependencies') {
        analysis.dependencies = this.analyzeDependencies(memories);
      }
      
      if (analysisType === 'all' || analysisType === 'orphans') {
        analysis.orphans = this.analyzeOrphans(memories);
      }
      
      if (analysisType === 'all' || analysisType === 'cleanup') {
        analysis.cleanup = this.analyzeCleanup(memories);
      }
      
      if (includeMetrics) {
        analysis.metrics = {
          averageContentLength: this.calculateAverageContentLength(memories),
          memoryDistribution: this.analyzeMemoryDistribution(memories),
          lastActivity: projectData.metadata.lastUpdated
        };
      }
      
      return analysis;
    } catch (error) {
      process.stderr.write(`[MemoryManager] Error analyzing memory bank: ${error}\n`);
      throw error;
    }
  }

  private analyzeDependencies(memories: Record<string, string>): any {
    // Simple dependency analysis based on content references
    const dependencies: Record<string, string[]> = {};
    
    for (const [title, content] of Object.entries(memories)) {
      const refs = Object.keys(memories).filter(otherTitle => 
        otherTitle !== title && content.toLowerCase().includes(otherTitle.toLowerCase())
      );
      if (refs.length > 0) {
        dependencies[title] = refs;
      }
    }
    
    return dependencies;
  }

  private analyzeOrphans(memories: Record<string, string>): string[] {
    // Find memories that are not referenced by others
    const referenced = new Set<string>();
    
    for (const [title, content] of Object.entries(memories)) {
      for (const otherTitle of Object.keys(memories)) {
        if (title !== otherTitle && content.toLowerCase().includes(otherTitle.toLowerCase())) {
          referenced.add(otherTitle);
        }
      }
    }
    
    return Object.keys(memories).filter(title => !referenced.has(title));
  }

  private analyzeCleanup(memories: Record<string, string>): any {
    const suggestions = [];
    
    for (const [title, content] of Object.entries(memories)) {
      if (content.trim().length < 50) {
        suggestions.push(`Memory '${title}' has very little content (${content.length} chars)`);
      }
      if (content.split('\n').length === 1) {
        suggestions.push(`Memory '${title}' is only one line - consider expanding`);
      }
    }
    
    return {
      suggestions,
      totalSuggestions: suggestions.length
    };
  }

  private calculateAverageContentLength(memories: Record<string, string>): number {
    const lengths = Object.values(memories).map(content => content.length);
    return lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  }

  private analyzeMemoryDistribution(memories: Record<string, string>): any {
    const distribution = {
      short: 0,    // < 200 chars
      medium: 0,   // 200-1000 chars
      long: 0      // > 1000 chars
    };
    
    for (const content of Object.values(memories)) {
      if (content.length < 200) {
        distribution.short++;
      } else if (content.length < 1000) {
        distribution.medium++;
      } else {
        distribution.long++;
      }
    }
    
    return distribution;
  }

  /**
   * Cleanup method to properly close resources
   */
  cleanup(): void {
    // Clear caches
    this.jsonCache.clear();
    
    // Close database connection if exists
    if (this.dbService) {
      // Assuming database service has a cleanup method
      try {
        (this.dbService as any).cleanup?.();
      } catch (error) {
        process.stderr.write(`[MemoryManager] Error during database cleanup: ${error}\n`);
      }
    }
  }
}

// Export for backward compatibility
export default MemoryManager;
