/**
 * Memory Storage implementation for Advanced Memory Bank MCP
 */

import fs from 'fs-extra';
import path from 'path';
import { IMemoryStorage } from './storage-interfaces.js';
import { CacheManager } from './cache-manager.js';
import { ProjectJsonStructure } from '../../types/index.js';
import { 
  FileSystemError, 
  MemoryBankError, 
  ProjectNotFoundError,
  withErrorRecovery,
  ErrorRecoveryService
} from '../errors/index.js';

export class MemoryStorage implements IMemoryStorage {
  private cacheManager: CacheManager;
  private memoryBankRoot: string;
  private errorRecovery: ErrorRecoveryService;

  constructor(memoryBankRoot: string, cacheManager: CacheManager) {
    this.memoryBankRoot = memoryBankRoot;
    this.cacheManager = cacheManager;
    this.errorRecovery = new ErrorRecoveryService();
    
    // Ensure root directory exists
    this.ensureRootDirectory();
  }

  /**
   * Get the file path for a project's JSON file
   */
  getProjectJsonPath(projectName: string): string {
    return path.join(this.memoryBankRoot, `${projectName}.json`);
  }

  /**
   * Read project JSON data with caching
   */
  async readProjectJson(projectName: string): Promise<ProjectJsonStructure> {
    return withErrorRecovery(
      async () => {
        // Check cache first
        const cacheKey = CacheManager.createKey('project', projectName);
        const cached = this.cacheManager.get<ProjectJsonStructure>(cacheKey);
        
        if (cached) {
          return cached;
        }

        // Read from filesystem
        const filePath = this.getProjectJsonPath(projectName);
        
        if (!await fs.pathExists(filePath)) {
          throw new ProjectNotFoundError(projectName, {
            operation: 'read_project_json',
            details: { filePath }
          });
        }

        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const projectData: ProjectJsonStructure = JSON.parse(fileContent);
          
          // Validate basic structure
          this.validateProjectStructure(projectData, projectName);
          
          // Cache the result
          this.cacheManager.set(cacheKey, projectData);
          
          return projectData;
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw new MemoryBankError(
              `Invalid JSON format in project file: ${projectName}`,
              'INVALID_JSON_FORMAT',
              { 
                operation: 'parse_project_json', 
                projectName,
                details: { filePath, error: error.message }
              },
              { canRetry: false, fallbackAction: 'create_project' }
            );
          }
          throw new FileSystemError('read', filePath, error as Error, {
            operation: 'read_project_json',
            projectName
          });
        }
      },
      { operation: 'read_project_json', projectName },
      this.errorRecovery
    );
  }

  /**
   * Write project JSON data with caching
   */
  async writeProjectJson(projectName: string, data: ProjectJsonStructure): Promise<void> {
    return withErrorRecovery(
      async () => {
        const filePath = this.getProjectJsonPath(projectName);
        
        try {
          // Validate structure before writing
          this.validateProjectStructure(data, projectName);
          
          // Ensure directory exists
          await fs.ensureDir(path.dirname(filePath));
          
          // Write to filesystem
          const jsonContent = JSON.stringify(data, null, 2);
          await fs.writeFile(filePath, jsonContent, 'utf-8');
          
          // Update cache
          const cacheKey = CacheManager.createKey('project', projectName);
          this.cacheManager.set(cacheKey, { ...data });
          
          if (process.env.DEBUG_MEMORY_BANK === 'true') {
            console.log(`[MemoryStorage] Project ${projectName} written to ${filePath}`);
          }
        } catch (error) {
          throw new FileSystemError('write', filePath, error as Error, {
            operation: 'write_project_json',
            projectName
          });
        }
      },
      { operation: 'write_project_json', projectName },
      this.errorRecovery
    );
  }

  /**
   * Ensure project exists, creating default structure if needed
   */
  async ensureProjectExists(projectName: string): Promise<void> {
    return withErrorRecovery(
      async () => {
        const filePath = this.getProjectJsonPath(projectName);
        
        if (!await fs.pathExists(filePath)) {
          const defaultStructure: ProjectJsonStructure = {
            projectName,
            summary: '',
            memories: {},
            lastUpdated: new Date().toISOString()
          };
          
          await this.writeProjectJson(projectName, defaultStructure);
          
          if (process.env.DEBUG_MEMORY_BANK === 'true') {
            console.log(`[MemoryStorage] Created new project: ${projectName}`);
          }
        }
      },
      { operation: 'ensure_project_exists', projectName },
      this.errorRecovery
    );
  }

  /**
   * Clear cache for specific project or all projects
   */
  clearCache(projectName?: string): void {
    if (projectName) {
      const cacheKey = CacheManager.createKey('project', projectName);
      this.cacheManager.delete(cacheKey);
    } else {
      // Clear all project-related cache entries
      this.cacheManager.invalidatePattern('^project:');
    }
  }

  /**
   * Validate project JSON structure
   */
  private validateProjectStructure(data: any, projectName: string): asserts data is ProjectJsonStructure {
    if (!data || typeof data !== 'object') {
      throw new MemoryBankError(
        `Invalid project structure: not an object`,
        'INVALID_PROJECT_STRUCTURE',
        { operation: 'validate_project', projectName },
        { canRetry: false }
      );
    }

    const required = ['projectName', 'memories', 'lastUpdated'];
    for (const field of required) {
      if (!(field in data)) {
        throw new MemoryBankError(
          `Invalid project structure: missing field "${field}"`,
          'MISSING_REQUIRED_FIELD',
          { operation: 'validate_project', projectName, details: { missingField: field } },
          { canRetry: false }
        );
      }
    }

    if (typeof data.memories !== 'object' || data.memories === null) {
      throw new MemoryBankError(
        `Invalid project structure: memories must be an object`,
        'INVALID_MEMORIES_STRUCTURE',
        { operation: 'validate_project', projectName },
        { canRetry: false }
      );
    }
  }

  /**
   * Ensure root directory exists
   */
  private async ensureRootDirectory(): Promise<void> {
    try {
      await fs.ensureDir(this.memoryBankRoot);
    } catch (error) {
      throw new FileSystemError('create_directory', this.memoryBankRoot, error as Error, {
        operation: 'ensure_root_directory'
      });
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalProjects: number;
    totalSize: number;
    cacheStats: any;
  }> {
    try {
      const files = await fs.readdir(this.memoryBankRoot);
      const jsonFiles = files.filter(file => file.endsWith('.json') && !file.includes('.backup.'));
      
      let totalSize = 0;
      for (const file of jsonFiles) {
        const filePath = path.join(this.memoryBankRoot, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return {
        totalProjects: jsonFiles.length,
        totalSize,
        cacheStats: this.cacheManager.getStats()
      };
    } catch (error) {
      throw new FileSystemError('read_directory', this.memoryBankRoot, error as Error, {
        operation: 'get_storage_stats'
      });
    }
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<string[]> {
    return withErrorRecovery(
      async () => {
        try {
          const files = await fs.readdir(this.memoryBankRoot);
          const projectFiles = files.filter(file => 
            file.endsWith('.json') && 
            !file.includes('.backup.')
          );
          
          return projectFiles.map(file => file.slice(0, -5)); // Remove .json extension
        } catch (error) {
          throw new FileSystemError('read_directory', this.memoryBankRoot, error as Error, {
            operation: 'list_projects'
          });
        }
      },
      { operation: 'list_projects' },
      this.errorRecovery
    );
  }

  /**
   * Check if project exists
   */
  async projectExists(projectName: string): Promise<boolean> {
    try {
      const filePath = this.getProjectJsonPath(projectName);
      return await fs.pathExists(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Get project metadata without loading full data
   */
  async getProjectMetadata(projectName: string): Promise<{
    size: number;
    lastModified: Date;
    memoryCount: number;
  }> {
    return withErrorRecovery(
      async () => {
        const filePath = this.getProjectJsonPath(projectName);
        
        if (!await fs.pathExists(filePath)) {
          throw new ProjectNotFoundError(projectName, {
            operation: 'get_project_metadata'
          });
        }

        const stats = await fs.stat(filePath);
        const data = await this.readProjectJson(projectName);

        return {
          size: stats.size,
          lastModified: stats.mtime,
          memoryCount: Object.keys(data.memories).length
        };
      },
      { operation: 'get_project_metadata', projectName },
      this.errorRecovery
    );
  }
}
