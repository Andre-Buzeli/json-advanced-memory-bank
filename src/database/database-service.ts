/**
 * Database service for managing memory entries in PostgreSQL with pgvector
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  MemoryEntry,
  MemoryMetadata,
  MemorySearchParams,
  MemorySearchResult,
  MemoryType,
  MemoryUpsertParams
} from '../types/index.js';

// Dynamic LRUCache with fallback
let LRUCacheClass: any;
try {
  const lruModule = require('lru-cache');
  LRUCacheClass = lruModule.LRUCache || lruModule;
} catch (error) {
  // Fallback LRU cache implementation
  class SimpleLRUCache<K, V> {
    private cache = new Map<K, V>();
    private maxSize: number;
    
    constructor(options: { max: number; ttl?: number }) {
      this.maxSize = options.max;
    }
    
    get(key: K): V | undefined {
      return this.cache.get(key);
    }
    
    set(key: K, value: V): void {
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(key, value);
    }
    
    delete(key: K): boolean {
      return this.cache.delete(key);
    }
  }
  
  LRUCacheClass = SimpleLRUCache;
}

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Service for interacting with the PostgreSQL database
 */
export class DatabaseService {
  private sql: postgres.Sql;
  private memoryCache: any;

  constructor() {
    // Database connection parameters from environment
    const host = process.env.POSTGRES_HOST || 'localhost';
    const port = parseInt(process.env.POSTGRES_PORT || '5432');
    const user = process.env.POSTGRES_USER || 'postgres';
    const password = process.env.POSTGRES_PASSWORD || 'postgres';
    const database = process.env.POSTGRES_DB || 'memory_bank';

    // Initialize cache with max 100 entries
    this.memoryCache = new LRUCacheClass({
      max: 100,
      ttl: 1000 * 60 * 5 // 5 minute TTL
    });

    // Connect to PostgreSQL with proper error handling
    try {
      this.sql = postgres({
        host,
        port,
        user,
        password,
        database,
        onnotice: () => {}, // Ignore notices
        connect_timeout: 5, // 5 second timeout
        idle_timeout: 30,
        max_lifetime: 60 * 60, // 1 hour
        max: 10, // Maximum connections
      });
    } catch (error) {
      console.error('Failed to initialize PostgreSQL connection:', error);
      throw new Error('Database initialization failed. Check PostgreSQL connection parameters.');
    }
  }

  /**
   * Ensure the project exists in the database
   * @param projectName - Name of the project to ensure
   * @returns The project ID
   */
  async ensureProjectExists(projectName: string): Promise<number> {
    // Check if project exists, create if not
    const projects = await this.sql<{ id: number }[]>`
      INSERT INTO projects (name) 
      VALUES (${projectName}) 
      ON CONFLICT (name) DO UPDATE 
      SET last_accessed = NOW() 
      RETURNING id;
    `;
    
    return projects[0].id;
  }

  /**
   * Get all projects in the database
   * @returns Array of project names
   */
  async getProjects(): Promise<string[]> {
    const projects = await this.sql<{ name: string }[]>`
      SELECT name FROM projects 
      ORDER BY last_accessed DESC;
    `;
    
    return projects.map(p => p.name);
  }

  /**
   * Insert or update a memory entry
   * @param params - Memory entry parameters
   * @returns The created or updated memory entry
   */
  async upsertMemory(params: MemoryUpsertParams): Promise<MemoryEntry> {
    const { project, title, content, memoryType, metadata } = params;
    
    // Ensure project exists
    const projectId = await this.ensureProjectExists(project);

    // Check if memory already exists
    const existingMemories = await this.sql<{ id: string }[]>`
      SELECT id FROM memories 
      WHERE project_id = ${projectId} AND title = ${title};
    `;

    let memoryId: string;
    
    if (existingMemories.length > 0) {
      // Update existing memory
      memoryId = existingMemories[0].id;
      
      await this.sql`
        UPDATE memories 
        SET 
          content = ${content},
          memory_type = ${memoryType},
          last_updated = NOW(),
          last_accessed = NOW(),
          access_count = access_count + 1
        WHERE id = ${memoryId};
      `;
    } else {
      // Create new memory
      const result = await this.sql<{ id: string }[]>`
        INSERT INTO memories (
          project_id, title, memory_type, content,
          importance, access_count
        ) VALUES (
          ${projectId}, ${title}, ${memoryType}, ${content},
          0.5, 1
        ) RETURNING id;
      `;
      
      memoryId = result[0].id;
    }

    // Handle metadata if provided
    if (metadata) {
      // Delete existing metadata for this memory
      await this.sql`
        DELETE FROM memory_metadata 
        WHERE memory_id = ${memoryId};
      `;
      
      // Insert new metadata
      for (const [key, value] of Object.entries(metadata)) {
        await this.sql`
          INSERT INTO memory_metadata (memory_id, key, value) 
          VALUES (${memoryId}, ${key}, ${JSON.stringify(value)});
        `;
      }
    }

    // Clear cache for this memory
    const cacheKey = `${project}:${title}`;
    this.memoryCache.delete(cacheKey);
    
    // Return the updated memory
    return this.getMemoryByTitle(project, title);
  }

  /**
   * Update the embedding vector for a memory
   * @param projectName - Project name
   * @param title - Memory title
   * @param embedding - Vector embedding array
   */
  async updateMemoryEmbedding(projectName: string, title: string, embedding: number[]): Promise<void> {
    const projectId = await this.ensureProjectExists(projectName);
    
    await this.sql`
      UPDATE memories 
      SET embedding = ${embedding}::vector 
      WHERE project_id = ${projectId} AND title = ${title};
    `;
    
    // Clear cache for this memory
    const cacheKey = `${projectName}:${title}`;
    this.memoryCache.delete(cacheKey);
  }

  /**
   * Get a memory entry by its title
   * @param projectName - Project name
   * @param title - Memory title
   * @returns The memory entry or null if not found
   */
  async getMemoryByTitle(projectName: string, title: string): Promise<MemoryEntry> {
    const cacheKey = `${projectName}:${title}`;
    
    // Check cache first
    const cached = this.memoryCache.get(cacheKey);
    if (cached) {
      // Update access count and last accessed in the background
      this.updateMemoryAccessStats(projectName, title).catch(console.error);
      return cached;
    }
    
    const projectId = await this.ensureProjectExists(projectName);
    
    // Get the memory and its metadata
    const memories = await this.sql<Array<{
      id: string;
      title: string;
      memory_type: string;
      content: string;
      embedding: number[] | null;
      importance: number;
      access_count: number;
      created_at: Date;
      last_accessed: Date;
      last_updated: Date;
    }>>`
      UPDATE memories 
      SET 
        access_count = access_count + 1,
        last_accessed = NOW()
      WHERE project_id = ${projectId} AND title = ${title}
      RETURNING 
        id, title, memory_type, content, embedding, 
        importance, access_count, created_at, last_accessed, last_updated;
    `;

    if (memories.length === 0) {
      throw new Error(`Memory titled "${title}" not found in project "${projectName}"`);
    }

    const memory = memories[0];
    
    // Get metadata
    const metadata = await this.getMemoryMetadata(memory.id);
    
    // Construct the memory entry
    const memoryEntry: MemoryEntry = {
      id: memory.id,
      project: projectName,
      title: memory.title,
      memoryType: memory.memory_type as MemoryType,
      content: memory.content,
      embedding: memory.embedding || undefined,
      importance: memory.importance,
      accessCount: memory.access_count,
      createdAt: new Date(memory.created_at),
      lastAccessed: new Date(memory.last_accessed),
      lastUpdated: new Date(memory.last_updated),
      metadata: metadata
    };

    // Cache the result
    this.memoryCache.set(cacheKey, memoryEntry);
    
    return memoryEntry;
  }
  
  /**
   * Update access statistics for a memory
   * @param projectName - Project name
   * @param title - Memory title
   */
  private async updateMemoryAccessStats(projectName: string, title: string): Promise<void> {
    const projectId = await this.ensureProjectExists(projectName);
    
    await this.sql`
      UPDATE memories 
      SET 
        access_count = access_count + 1,
        last_accessed = NOW()
      WHERE project_id = ${projectId} AND title = ${title};
    `;
  }

  /**
   * Get all memory entries for a project
   * @param projectName - Project name
   * @returns Array of memory entries
   */
  async getProjectMemories(projectName: string): Promise<MemoryEntry[]> {
    const projectId = await this.ensureProjectExists(projectName);
    
    const memories = await this.sql<Array<{
      id: string;
      title: string;
      memory_type: string;
      content: string;
      embedding: number[] | null;
      importance: number;
      access_count: number;
      created_at: Date;
      last_accessed: Date;
      last_updated: Date;
    }>>`
      SELECT 
        id, title, memory_type, content, embedding, 
        importance, access_count, created_at, last_accessed, last_updated
      FROM memories
      WHERE project_id = ${projectId}
      ORDER BY last_accessed DESC;
    `;

    // Get metadata for each memory
    const memoryEntries: MemoryEntry[] = [];
    
    for (const memory of memories) {
      const metadata = await this.getMemoryMetadata(memory.id);
      
      const memoryEntry: MemoryEntry = {
        id: memory.id,
        project: projectName,
        title: memory.title,
        memoryType: memory.memory_type as MemoryType,
        content: memory.content,
        embedding: memory.embedding || undefined,
        importance: memory.importance,
        accessCount: memory.access_count,
        createdAt: new Date(memory.created_at),
        lastAccessed: new Date(memory.last_accessed),
        lastUpdated: new Date(memory.last_updated),
        metadata: metadata
      };
      
      memoryEntries.push(memoryEntry);
      
      // Update cache
      const cacheKey = `${projectName}:${memory.title}`;
      this.memoryCache.set(cacheKey, memoryEntry);
    }
    
    return memoryEntries;
  }

  /**
   * Delete a memory entry
   * @param projectName - Project name
   * @param title - Memory title
   * @returns True if the memory was deleted, false if not found
   */
  async deleteMemory(projectName: string, title: string): Promise<boolean> {
    const projectId = await this.ensureProjectExists(projectName);
    
    const result = await this.sql`
      DELETE FROM memories 
      WHERE project_id = ${projectId} AND title = ${title}
      RETURNING id;
    `;
    
    // Clear cache
    const cacheKey = `${projectName}:${title}`;
    this.memoryCache.delete(cacheKey);
    
    return result.length > 0;
  }

  /**
   * Search for similar memories using vector similarity
   * @param params - Search parameters
   * @returns Search results
   */
  async searchMemories(params: MemorySearchParams): Promise<MemorySearchResult> {
    const { project, query, memoryType, metadata, limit = 10, similarityThreshold = 0.7 } = params;
    
    const projectId = await this.ensureProjectExists(project);
    
    // If no vector query, do a simple text search
    if (!query) {
      return this.searchMemoriesByText(projectId, project, memoryType, metadata, limit);
    }

    // If we do have a vector query but no embedding, we need to wait for it
    throw new Error('Vector search requires embeddings - use MemoryManager.searchMemories instead');
  }

  /**
   * Search for memories using vector similarity, given a vector embedding
   * @param projectName - Project name
   * @param embedding - Vector embedding to search with
   * @param memoryType - Optional filter by memory type
   * @param metadata - Optional filter by metadata
   * @param limit - Maximum results to return (default: 10)
   * @param similarityThreshold - Minimum similarity score (default: 0.7)
   * @returns Search results with similarity scores
   */
  async searchMemoriesByVector(
    projectName: string, 
    embedding: number[], 
    memoryType?: MemoryType,
    metadata?: Partial<MemoryMetadata>,
    limit = 10, 
    similarityThreshold = 0.7
  ): Promise<MemorySearchResult> {
    const projectId = await this.ensureProjectExists(projectName);

    // Base query for memories with embeddings
    let query = this.sql`
      SELECT 
        id, title, memory_type, content, embedding, 
        importance, access_count, created_at, last_accessed, last_updated,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM memories
      WHERE 
        project_id = ${projectId} 
        AND embedding IS NOT NULL
    `;
    
    // Add memory type filter if specified
    if (memoryType) {
      query = this.sql`${query} AND memory_type = ${memoryType}`;
    }
    
    // Filter by minimum similarity
    query = this.sql`${query} AND (1 - (embedding <=> ${embedding}::vector)) > ${similarityThreshold}`;
    
    // Add ordering and limit
    query = this.sql`${query} ORDER BY similarity DESC LIMIT ${limit}`;
    
    // Execute the search
    const results = await query;
    
    // Filter by metadata if needed
    let filteredResults = results;
    if (metadata) {
      filteredResults = [];
      for (const result of results) {
        const memMetadata = await this.getMemoryMetadata(result.id);
        let matches = true;
        
        for (const [key, value] of Object.entries(metadata)) {
          if (memMetadata[key] !== value) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          filteredResults.push(result);
        }
      }
    }

    // Convert to memory entries
    const memories: MemoryEntry[] = [];
    const scores: number[] = [];
    
    for (const result of filteredResults) {
      const memoryMetadata = await this.getMemoryMetadata(result.id);
      
      memories.push({
        id: result.id,
        project: projectName,
        title: result.title,
        memoryType: result.memory_type as MemoryType,
        content: result.content,
        embedding: result.embedding,
        importance: result.importance,
        accessCount: result.access_count,
        createdAt: new Date(result.created_at),
        lastAccessed: new Date(result.last_accessed),
        lastUpdated: new Date(result.last_updated),
        metadata: memoryMetadata
      });
      
      scores.push(result.similarity);
      
      // Update access stats in the background
      this.updateMemoryAccessStats(projectName, result.title).catch(console.error);
    }

    return {
      memories,
      scores,
      totalMatches: filteredResults.length
    };
  }

  /**
   * Simple text-based search for memories
   * @param projectId - Project ID
   * @param projectName - Project name
   * @param memoryType - Optional filter by memory type
   * @param metadata - Optional filter by metadata
   * @param limit - Maximum results to return
   * @returns Search results
   */
  private async searchMemoriesByText(
    projectId: number,
    projectName: string,
    memoryType?: MemoryType,
    metadata?: Partial<MemoryMetadata>,
    limit = 10
  ): Promise<MemorySearchResult> {
    // Base query
    let query = this.sql`
      SELECT 
        id, title, memory_type, content, embedding, 
        importance, access_count, created_at, last_accessed, last_updated
      FROM memories
      WHERE project_id = ${projectId}
    `;
    
    // Add memory type filter if specified
    if (memoryType) {
      query = this.sql`${query} AND memory_type = ${memoryType}`;
    }
    
    // Add ordering and limit
    query = this.sql`${query} ORDER BY last_accessed DESC LIMIT ${limit}`;
    
    // Execute the search
    const results = await query;
    
    // Filter by metadata if needed
    let filteredResults = results;
    if (metadata) {
      filteredResults = [];
      for (const result of results) {
        const memMetadata = await this.getMemoryMetadata(result.id);
        let matches = true;
        
        for (const [key, value] of Object.entries(metadata)) {
          if (memMetadata[key] !== value) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          filteredResults.push(result);
        }
      }
    }

    // Convert to memory entries
    const memories: MemoryEntry[] = [];
    
    for (const result of filteredResults) {
      const memoryMetadata = await this.getMemoryMetadata(result.id);
      
      memories.push({
        id: result.id,
        project: projectName,
        title: result.title,
        memoryType: result.memory_type as MemoryType,
        content: result.content,
        embedding: result.embedding || undefined,
        importance: result.importance,
        accessCount: result.access_count,
        createdAt: new Date(result.created_at),
        lastAccessed: new Date(result.last_accessed),
        lastUpdated: new Date(result.last_updated),
        metadata: memoryMetadata
      });
      
      // Update access stats in the background
      this.updateMemoryAccessStats(projectName, result.title).catch(console.error);
    }

    return {
      memories,
      totalMatches: filteredResults.length
    };
  }

  /**
   * Get metadata for a memory entry
   * @param memoryId - Memory ID
   * @returns Metadata object
   */
  private async getMemoryMetadata(memoryId: string): Promise<MemoryMetadata> {
    const metadataRows = await this.sql<Array<{ key: string; value: any }>>`
      SELECT key, value FROM memory_metadata WHERE memory_id = ${memoryId};
    `;
    
    const metadata: MemoryMetadata = {};
    for (const row of metadataRows) {
      metadata[row.key] = row.value;
    }
    
    return metadata;
  }

  /**
   * Update the importance score of a memory
   * @param projectName - Project name
   * @param title - Memory title
   * @param importance - New importance score (0.0-1.0)
   */
  async updateMemoryImportance(projectName: string, title: string, importance: number): Promise<void> {
    const projectId = await this.ensureProjectExists(projectName);
    
    await this.sql`
      UPDATE memories 
      SET importance = ${Math.max(0, Math.min(1, importance))}
      WHERE project_id = ${projectId} AND title = ${title};
    `;
    
    // Clear cache
    const cacheKey = `${projectName}:${title}`;
    this.memoryCache.delete(cacheKey);
  }

  /**
   * Get memories for pruning (oldest, least accessed, least important)
   * @param projectName - Project name
   * @param limit - Maximum number of memories to retrieve
   * @returns Array of memory candidates for pruning
   */
  async getMemoriesForPruning(projectName: string, limit = 10): Promise<MemoryEntry[]> {
    const projectId = await this.ensureProjectExists(projectName);
    
    const results = await this.sql<Array<{
      id: string;
      title: string;
      memory_type: string;
      content: string;
      embedding: number[] | null;
      importance: number;
      access_count: number;
      created_at: Date;
      last_accessed: Date;
      last_updated: Date;
    }>>`
      SELECT 
        id, title, memory_type, content, embedding, 
        importance, access_count, created_at, last_accessed, last_updated
      FROM memories
      WHERE 
        project_id = ${projectId} 
        AND memory_type NOT IN ('summary', 'workflow-status', 'tech-context')
      ORDER BY 
        importance ASC,
        access_count ASC,
        last_accessed ASC
      LIMIT ${limit};
    `;
    
    // Convert to memory entries
    const memories: MemoryEntry[] = [];
    
    for (const result of results) {
      const memoryMetadata = await this.getMemoryMetadata(result.id);
      
      memories.push({
        id: result.id,
        project: projectName,
        title: result.title,
        memoryType: result.memory_type as MemoryType,
        content: result.content,
        embedding: result.embedding || undefined,
        importance: result.importance,
        accessCount: result.access_count,
        createdAt: new Date(result.created_at),
        lastAccessed: new Date(result.last_accessed),
        lastUpdated: new Date(result.last_updated),
        metadata: memoryMetadata
      });
    }
    
    return memories;
  }

  /**
   * Count the total number of memories for a project
   * @param projectName - Project name
   * @returns The count of memories
   */
  async countProjectMemories(projectName: string): Promise<number> {
    const projectId = await this.ensureProjectExists(projectName);
    
    const result = await this.sql<[{ count: number }]>`
      SELECT COUNT(*) as count FROM memories WHERE project_id = ${projectId};
    `;
    
    return parseInt(result[0].count.toString());
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.sql.end();
  }
}