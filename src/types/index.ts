/**
 * Type definitions for the Advanced Memory Bank system
 */

export interface MemoryEntry {
  /**
   * Unique identifier for the memory entry
   */
  id: string;
  
  /**
   * Project name this memory belongs to
   */
  project: string;
  
  /**
   * Title or name of the memory
   */
  title: string;
  
  /**
   * The type of memory file (e.g. summary, status, creative-analysis)
   */
  memoryType: MemoryType;
  
  /**
   * Memory content in markdown format
   */
  content: string;
  
  /**
   * Vector embedding of the memory content for semantic search
   */
  embedding?: number[];
  
  /**
   * Importance score for this memory (affects pruning decisions)
   * Ranges from 0.0 to 1.0, where higher values indicate more importance
   */
  importance: number;
  
  /**
   * Number of times this memory has been accessed
   */
  accessCount: number;
  
  /**
   * Timestamp when this memory was created
   */
  createdAt: Date;
  
  /**
   * Timestamp when this memory was last accessed
   */
  lastAccessed: Date;
  
  /**
   * Timestamp when this memory was last updated
   */
  lastUpdated: Date;
  
  /**
   * Metadata associated with the memory (e.g. workflow mode, tags)
   */
  metadata: MemoryMetadata;
}

/**
 * Types of memory files that comprise the memory bank
 */
export enum MemoryType {
  // Core files (always present)
  SUMMARY = 'summary',
  STATUS = 'status',
  PROGRESS = 'progress',
  BRIEF_PLAN = 'brief-plan',
  TROUBLESHOOTING = 'troubleshooting',
  DIRECTORY = 'directory',
  TECH_CONTEXT = 'tech-context',
  WORKFLOW_STATUS = 'workflow-status',
  CHANGE_HISTORY = 'change-history',
  ACTIVE_CONTEXT = 'active-context',
  
  // Dynamic files (created as needed)
  THINKING = 'thinking',
  CREATIVE = 'creative',
  ANALYSIS = 'analysis',
  TASKS = 'tasks',
  SETUP = 'setup',
  CUSTOM = 'custom'
}

/**
 * Metadata for memory entries
 */
export interface MemoryMetadata {
  /**
   * Development workflow mode this memory is associated with
   */
  workflowMode?: 'VAN' | 'PLAN' | 'CREATIVE' | 'IMPLEMENT' | 'QA';
  
  /**
   * Tags for easier searching and categorization
   */
  tags?: string[];
  
  /**
   * Associated files or resources
   */
  relatedResources?: string[];
  
  /**
   * Complexity level (1-4)
   */
  complexityLevel?: number;
  
  /**
   * Additional custom metadata (extensible)
   */
  [key: string]: unknown;
}

/**
 * Search parameters for memory queries
 */
export interface MemorySearchParams {
  /**
   * Project name to search within
   */
  project: string;
  
  /**
   * Natural language query for semantic search
   */
  query?: string;
  
  /**
   * Filter by memory type
   */
  memoryType?: MemoryType;
  
  /**
   * Filter by metadata fields
   */
  metadata?: Partial<MemoryMetadata>;
  
  /**
   * Maximum number of results to return
   */
  limit?: number;
  
  /**
   * Minimum similarity score (0.0-1.0) for semantic search results
   */
  similarityThreshold?: number;
}

/**
 * Result of a memory search operation
 */
export interface MemorySearchResult {
  /**
   * Memory entries matching the search criteria
   */
  memories: MemoryEntry[];
  
  /**
   * Similarity scores for each result (0.0-1.0)
   */
  scores?: number[];
  
  /**
   * Total number of matches found (may be greater than results returned if limit was applied)
   */
  totalMatches: number;
}

/**
 * Parameters for creating or updating a memory
 */
export interface MemoryUpsertParams {
  /**
   * Project name this memory belongs to
   */
  project: string;
  
  /**
   * Title or name of the memory
   */
  title: string;
  
  /**
   * Memory content in markdown format
   */
  content: string;
  
  /**
   * Type of memory file
   */
  memoryType: MemoryType;
  
  /**
   * Optional metadata to associate with the memory
   */
  metadata?: Partial<MemoryMetadata>;
}