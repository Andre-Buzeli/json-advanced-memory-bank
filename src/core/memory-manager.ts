/**
 * Memory Manager v4.0.0 - Dynamic Project Detection
 * Automatically detects IDE workspace and manages memories dynamically
 */

import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';
import { LRUCache } from 'lru-cache';

export interface Memory {
  id: string;
  content: string;
  tags: string[];
  timestamp: number;
  importance: number;
  projectContext: string;
}

export interface ProjectContext {
  name: string;
  path: string;
  detectedAt: number;
}

export class MemoryManager {
  private readonly cache: LRUCache<string, Memory>;
  private projectContext: ProjectContext | null = null;
  private readonly memoryDir: string;
  private readonly version = '4.0.0';

  constructor() {
    this.cache = new LRUCache<string, Memory>({
      max: 1000,
      ttl: 1000 * 60 * 60 * 24, // 24 hours
    });

    // Initialize with dynamic project detection
    this.initializeProjectContext();
    this.memoryDir = this.getMemoryDirectory();
    this.ensureMemoryDirectory();
  }

  /**
   * Dynamically detect the current project context
   */
  private initializeProjectContext(): void {
    const projectName = this.detectProjectName();
    const projectPath = this.detectProjectPath();

    this.projectContext = {
      name: projectName,
      path: projectPath,
      detectedAt: Date.now(),
    };
  }

  /**
   * Detect project name from multiple sources
   */
  private detectProjectName(): string {
    try {
      // Method 1: Check if we're in a VS Code workspace
      const workspaceName = this.detectVSCodeWorkspace();
      if (workspaceName) {
        return this.sanitizeProjectName(workspaceName);
      }

      // Method 2: Use current directory name
      const currentDir = process.cwd();
      const dirName = path.basename(currentDir);
      
      // Avoid user directories and common paths
      if (this.isValidProjectName(dirName)) {
        return this.sanitizeProjectName(dirName);
      }

      // Method 3: Check package.json name
      const packageName = this.detectPackageName();
      if (packageName) {
        return this.sanitizeProjectName(packageName);
      }

      // Fallback: use sanitized directory name
      return this.sanitizeProjectName(dirName || 'unknown-project');
    } catch (error) {
      console.error('[MemoryManager] Error detecting project name:', error);
      return 'unknown-project';
    }
  }

  /**
   * Detect VS Code workspace name from environment or process
   */
  private detectVSCodeWorkspace(): string | null {
    try {
      // Check environment variables
      const workspaceName = process.env.VSCODE_WORKSPACE_NAME;
      if (workspaceName) {
        return workspaceName;
      }

      // Check if running in VS Code context
      const term = process.env.TERM_PROGRAM;
      if (term === 'vscode') {
        const cwd = process.cwd();
        return path.basename(cwd);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Detect package.json name
   */
  private detectPackageName(): string | null {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      if (existsSync(packagePath)) {
        const packageContent = require(packagePath);
        const name = packageContent.name;
        if (name && typeof name === 'string') {
          // Remove npm scope if present
          return name.replace(/^@[^/]+\//, '');
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if a name is valid for a project
   */
  private isValidProjectName(name: string): boolean {
    if (!name || name.length < 2) return false;
    
    const invalidNames = [
      'src', 'dist', 'build', 'out', 'bin', 'lib',
      'node_modules', 'Users', 'Documents', 'Desktop',
      'Downloads', 'AppData', 'Program Files', 'Windows',
      'System32', 'temp', 'tmp', '.', '..'
    ];

    const lowerName = name.toLowerCase();
    return !invalidNames.includes(lowerName) && 
           !lowerName.includes('user') && 
           !lowerName.includes('admin') &&
           !/^[a-z]$/.test(lowerName); // Single letter names
  }

  /**
   * Sanitize project name for safe file system usage
   */
  private sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/^(-+)|(-+)$/g, '')
      .replace(/-+/g, '-')
      .substring(0, 50) || 'project';
  }

  /**
   * Detect project path
   */
  private detectProjectPath(): string {
    try {
      // Try to find git root first
      let currentPath = process.cwd();
      while (currentPath !== path.dirname(currentPath)) {
        if (existsSync(path.join(currentPath, '.git'))) {
          return currentPath;
        }
        currentPath = path.dirname(currentPath);
      }

      // Fallback to current working directory
      return process.cwd();
    } catch {
      return process.cwd();
    }
  }

  /**
   * Get the memory directory path
   */
  private getMemoryDirectory(): string {
    const projectName = this.projectContext?.name ?? 'unknown-project';
    const homeDir = os.homedir();
    return path.join(homeDir, '.advanced-memory-bank', projectName);
  }

  /**
   * Ensure memory directory exists
   */
  private ensureMemoryDirectory(): void {
    try {
      if (!existsSync(this.memoryDir)) {
        mkdirSync(this.memoryDir, { recursive: true });
      }
    } catch (error) {
      console.error('[MemoryManager] Error creating memory directory:', error);
      throw new Error(`Failed to create memory directory: ${this.memoryDir}`);
    }
  }

  /**
   * Get current project context
   */
  getProjectContext(): ProjectContext | null {
    return this.projectContext;
  }

  /**
   * Retrieve memories by tags
   */
  async getMemoriesByTags(tags: string[]): Promise<Memory[]> {
    const allMemories = await this.loadAllMemories();
    
    return allMemories.filter(memory => 
      tags.some(tag => memory.tags.includes(tag))
    ).sort((a, b) => b.importance - a.importance || b.timestamp - a.timestamp);
  }

  /**
   * Get recent memories
   */
  async getRecentMemories(limit: number = 10): Promise<Memory[]> {
    const allMemories = await this.loadAllMemories();
    
    allMemories.sort((a, b) => b.timestamp - a.timestamp);
    return allMemories.slice(0, limit);
  }

  /**
   * Delete a memory
   */
  async deleteMemory(id: string): Promise<boolean> {
    try {
      // Remove from cache
      this.cache.delete(id);

      // Remove from disk
      const filePath = path.join(this.memoryDir, `${id}.json`);
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }

      return true;
    } catch (error) {
      console.error('[MemoryManager] Error deleting memory:', error);
      return false;
    }
  }

  /**
   * Generate unique memory ID
   */
  private generateMemoryId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `mem-${timestamp}-${random}`;
  }

  /**
   * Persist memory to disk
   */
  private async persistMemory(memory: Memory): Promise<void> {
    try {
      const filePath = path.join(this.memoryDir, `${memory.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(memory, null, 2), 'utf-8');
    } catch (error) {
      console.error('[MemoryManager] Error persisting memory:', error);
      throw new Error(`Failed to persist memory: ${memory.id}`);
    }
  }

  /**
   * Load all memories from disk
   */
  private async loadAllMemories(): Promise<Memory[]> {
    try {
      if (!existsSync(this.memoryDir)) {
        return [];
      }

      const files = await fs.readdir(this.memoryDir);
      const memories: Memory[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.memoryDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const memory = JSON.parse(content) as Memory;
            memories.push(memory);
          } catch (error) {
            console.error(`[MemoryManager] Error loading memory file ${file}:`, error);
          }
        }
      }

      return memories;
    } catch (error) {
      console.error('[MemoryManager] Error loading memories:', error);
      return [];
    }
  }

  /**
   * Get memory statistics
   */
  async getStatistics(): Promise<{
    totalMemories: number;
    projectName: string;
    memoryPath: string;
    oldestMemory: number | undefined;
    newestMemory: number | undefined;
  }> {
    const memories = await this.loadAllMemories();
    
    return {
      totalMemories: memories.length,
      projectName: this.projectContext?.name ?? 'unknown',
      memoryPath: this.memoryDir,
      oldestMemory: memories.length > 0 ? Math.min(...memories.map(m => m.timestamp)) : undefined,
      newestMemory: memories.length > 0 ? Math.max(...memories.map(m => m.timestamp)) : undefined,
    };
  }

  /**
   * Clean up old memories
   */
  async cleanupOldMemories(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const memories = await this.loadAllMemories();
    const cutoffTime = Date.now() - maxAge;
    let deletedCount = 0;

    for (const memory of memories) {
      if (memory.timestamp < cutoffTime && memory.importance < 5) {
        const deleted = await this.deleteMemory(memory.id);
        if (deleted) {
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  /**
   * Store memory with simplified interface
   */
  async storeMemory(content: string, tags: string[] = [], importance: number = 5): Promise<Memory> {
    const id = this.generateMemoryId();
    const memory: Memory = {
      id,
      content,
      tags,
      importance: Math.max(1, Math.min(10, importance)),
      timestamp: Date.now(),
      projectContext: this.projectContext?.name ?? 'unknown',
    };

    // Store in cache
    this.cache.set(id, memory);

    // Persist to disk
    await this.persistMemory(memory);

    return memory;
  }

  /**
   * Get a specific memory by ID
   */
  async getMemory(id: string): Promise<Memory | null> {
    // Check cache first
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }

    // Load from disk
    try {
      const filePath = path.join(this.memoryDir, `${id}.json`);
      if (existsSync(filePath)) {
        const data = await fs.readFile(filePath, 'utf-8');
        const memory = JSON.parse(data) as Memory;
        this.cache.set(id, memory);
        return memory;
      }
    } catch (error) {
      console.error('[MemoryManager] Error loading memory:', error);
    }

    return null;
  }

  /**
   * Search memories with advanced options
   */
  async searchMemories(query: string, tags?: string[], limit: number = 10): Promise<Memory[]> {
    const allMemories = await this.loadAllMemories();
    const lowerQuery = query.toLowerCase();

    let filtered = allMemories.filter(memory => {
      const contentMatch = memory.content.toLowerCase().includes(lowerQuery);
      const tagMatch = memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      const tagFilter = !tags || tags.length === 0 || tags.some(tag => memory.tags.includes(tag));
      
      return (contentMatch || tagMatch) && tagFilter;
    });

    filtered.sort((a, b) => b.importance - a.importance || b.timestamp - a.timestamp);
    return filtered.slice(0, limit);
  }

  /**
   * List memories with filtering options
   */
  async listMemories(tags?: string[], limit: number = 20, sortBy: string = 'timestamp'): Promise<Memory[]> {
    const allMemories = await this.loadAllMemories();

    let filtered = allMemories;
    if (tags && tags.length > 0) {
      filtered = allMemories.filter(memory => 
        tags.some(tag => memory.tags.includes(tag))
      );
    }

    // Sort memories
    filtered.sort((a, b) => {
      if (sortBy === 'importance') {
        return b.importance - a.importance || b.timestamp - a.timestamp;
      } else {
        return b.timestamp - a.timestamp;
      }
    });

    return filtered.slice(0, limit);
  }

  /**
   * Update an existing memory
   */
  async updateMemory(id: string, content?: string, tags?: string[], importance?: number): Promise<boolean> {
    const memory = await this.getMemory(id);
    if (!memory) {
      return false;
    }

    // Update fields
    if (content !== undefined) memory.content = content;
    if (tags !== undefined) memory.tags = tags;
    if (importance !== undefined) memory.importance = Math.max(1, Math.min(10, importance));

    // Update cache
    this.cache.set(id, memory);

    // Persist to disk
    await this.persistMemory(memory);

    return true;
  }

  /**
   * Get project information
   */
  async getProjectInfo(): Promise<{
    projectName: string;
    projectPath: string;
    totalMemories: number;
    memoryDirectory: string;
    version: string;
  }> {
    const memories = await this.loadAllMemories();
    
    return {
      projectName: this.projectContext?.name ?? 'unknown',
      projectPath: this.projectContext?.path ?? process.cwd(),
      totalMemories: memories.length,
      memoryDirectory: this.memoryDir,
      version: this.version,
    };
  }
}
