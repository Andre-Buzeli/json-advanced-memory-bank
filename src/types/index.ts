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
   * @deprecated Use metadata.importanceLevel instead
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
   * Enhanced metadata with intelligence features
   */
  metadata: EnhancedMemoryMetadata;
  
  /**
   * Content analysis results for automatic categorization
   */
  contentAnalysis?: ContentAnalysis;
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
 * Search parameters for memory queries with enhanced filtering
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
   * Filter by memory category
   */
  category?: MemoryCategory;
  
  /**
   * Filter by importance level
   */
  importanceLevel?: ImportanceLevel;
  
  /**
   * Filter by tags
   */
  tags?: string[];
  
  /**
   * Filter by date range
   */
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  
  /**
   * Filter by metadata fields
   */
  metadata?: Partial<EnhancedMemoryMetadata>;
  
  /**
   * Maximum number of results to return
   */
  limit?: number;
  
  /**
   * Minimum similarity score (0.0-1.0) for semantic search results
   */
  similarityThreshold?: number;
  
  /**
   * Include archived memories in results
   */
  includeArchived?: boolean;
  
  /**
   * Sort order for results
   */
  sortBy?: 'relevance' | 'date' | 'importance' | 'alphabetical';
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Enhanced result of a memory search operation
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
  
  /**
   * Search metadata and insights
   */
  searchMetadata: {
    queryTime: number;
    categoriesFound: MemoryCategory[];
    averageRelevance: number;
    suggestedRelated: string[];
  };
  
  /**
   * Faceted search results for filtering
   */
  facets: {
    categories: Record<MemoryCategory, number>;
    importanceLevels: Record<ImportanceLevel, number>;
    tags: Record<string, number>;
    dateRanges: Record<string, number>;
  };
}

/**
 * Parameters for creating or updating a memory with enhanced features
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
   * Optional category (if not provided, will be auto-detected)
   */
  category?: MemoryCategory;
  
  /**
   * Optional importance level (if not provided, will be auto-detected)
   */
  importanceLevel?: ImportanceLevel;
  
  /**
   * Optional metadata to associate with the memory
   */
  metadata?: Partial<EnhancedMemoryMetadata>;
  
  /**
   * Force content analysis even if content hasn't changed significantly
   */
  forceAnalysis?: boolean;
  
  /**
   * Template to use for structured content
   */
  template?: string;
  
  /**
   * Whether to automatically detect relationships with other memories
   */
  autoDetectRelationships?: boolean;
}

/**
 * Structure for the project JSON file
 */
export interface ProjectJsonStructure {
  /**
   * Project name
   */
  projectName: string;
  
  /**
   * Last update timestamp
   */
  lastUpdated: string;
  
  /**
   * Project summary - List of memories and their short descriptions for navigation
   */
  summary: string;
  
  /**
   * Memory entries for this project
   */
  memories: Record<string, string>;
}

/**
 * Enhanced memory categories based on content analysis
 */
export enum MemoryCategory {
  RESEARCH = 'research',           // 🔍 Research and investigation
  DECISION = 'decision',           // 🎯 Decision making and recommendations  
  IMPLEMENTATION = 'implementation', // 🔧 Code, setup, technical implementation
  STATUS = 'status',               // 📊 Project status and progress tracking
  GUIDE = 'guide',                 // 📚 How-to guides and documentation
  ANALYSIS = 'analysis',           // 📈 Data analysis and insights
  MEETING = 'meeting',             // 🤝 Meeting notes and discussions
  ISSUE = 'issue',                 // ⚠️ Problems and troubleshooting
  IDEA = 'idea',                   // 💡 Ideas and brainstorming
  REFERENCE = 'reference'          // 📖 Reference materials and links
}

/**
 * Importance levels for memory prioritization
 */
export enum ImportanceLevel {
  LOW = 'low',           // Nice to have, can be archived
  MEDIUM = 'medium',     // Important for context
  HIGH = 'high',         // Critical for project success  
  CRITICAL = 'critical'  // Cannot be removed, core information
}

/**
 * Enhanced metadata structure with intelligence features
 */
export interface EnhancedMemoryMetadata extends MemoryMetadata {
  /**
   * Auto-detected category based on content analysis
   */
  category: MemoryCategory;
  
  /**
   * Importance level for prioritization and pruning decisions
   */
  importanceLevel: ImportanceLevel;
  
  /**
   * Estimated reading time in minutes
   */
  estimatedReadTime: number;
  
  /**
   * Content size in KB
   */
  sizeKB: number;
  
  /**
   * Completeness percentage (0-100)
   */
  completeness: number;
  
  /**
   * IDs of memories this one depends on
   */
  dependencies: string[];
  
  /**
   * IDs of memories that depend on this one
   */
  dependents: string[];
  
  /**
   * Related memory IDs (cross-references)
   */
  relatedMemories: string[];
  
  /**
   * Auto-extracted keywords from content
   */
  keywords: string[];
  
  /**
   * Language of the content (auto-detected)
   */
  language: string;
  
  /**
   * Hash of content for change detection
   */
  contentHash: string;
  
  /**
   * Version number for tracking changes
   */
  version: number;
  
  /**
   * Flag indicating if memory should be archived
   */
  archived: boolean;
  
  /**
   * Auto-generated actionable items from content
   */
  actionItems: string[];
  
  /**
   * Progress indicators extracted from content
   */
  progressIndicators: {
    completed: string[];
    inProgress: string[];
    pending: string[];
  };
}

/**
 * Smart summary structure for intelligent project overview
 */
export interface SmartSummary {
  /**
   * High-level project status
   */
  projectStatus: string;
  
  /**
   * Immediate next actions required
   */
  nextActions: string[];
  
  /**
   * Recent progress made
   */
  recentProgress: string[];
  
  /**
   * Current blockers preventing progress
   */
  blockers: string[];
  
  /**
   * Key decisions made in the project
   */
  keyDecisions: string[];
  
  /**
   * Estimated completion time
   */
  completionEstimate: string;
  
  /**
   * Progress by category
   */
  categoryProgress: Record<MemoryCategory, number>;
  
  /**
   * Critical memories that need attention
   */
  criticalMemories: string[];
  
  /**
   * Recently modified memories
   */
  recentlyModified: string[];
}

/**
 * Memory relationship graph for dependency tracking
 */
export interface MemoryRelationships {
  /**
   * Memory ID this relationship data belongs to
   */
  memoryId: string;
  
  /**
   * Memories that this one leads to or enables
   */
  leadsTo: string[];
  
  /**
   * Memories that reference this one
   */
  referencedBy: string[];
  
  /**
   * Memories that are prerequisites for this one
   */
  prerequisites: string[];
  
  /**
   * Semantic similarity scores with other memories
   */
  similarityScores: Record<string, number>;
  
  /**
   * Strength of relationships (0.0-1.0)
   */
  relationshipStrengths: Record<string, number>;
}

/**
 * Enhanced project structure with intelligence features
 */
export interface EnhancedProjectStructure extends ProjectJsonStructure {
  /**
   * Smart summary with actionable insights
   */
  smartSummary: SmartSummary;
  
  /**
   * Memory categories and their contents
   */
  memoryCategories: Record<MemoryCategory, string[]>;
  
  /**
   * Project-wide progress tracking
   */
  progressTracking: {
    overall: number;
    phases: Record<string, number>;
    milestones: {
      completed: string[];
      current: string;
      next: string[];
    };
  };
  
  /**
   * Memory relationships graph
   */
  relationships: Record<string, MemoryRelationships>;
  
  /**
   * Size management information
   */
  sizeManagement: {
    totalSizeKB: number;
    largeMemories: string[];
    chunkingStrategy: {
      maxSizeKB: number;
      chunkMethod: 'semantic_sections' | 'character_limit' | 'manual';
    };
  };
  
  /**
   * Auto-detected project characteristics
   */
  projectCharacteristics: {
    primaryLanguages: string[];
    projectType: string;
    complexity: number;
    estimatedDuration: string;
    teamSize: number;
  };
  
  /**
   * Archive information
   */
  archiveInfo: {
    archivedMemories: string[];
    archiveReason: Record<string, string>;
    lastArchiveDate: string;
  };
}

/**
 * Memory template structure for standardized content
 */
export interface MemoryTemplate {
  /**
   * Template ID
   */
  id: string;
  
  /**
   * Template name
   */
  name: string;
  
  /**
   * Category this template is for
   */
  category: MemoryCategory;
  
  /**
   * Template sections with descriptions
   */
  sections: {
    id: string;
    name: string;
    description: string;
    required: boolean;
    placeholder: string;
  }[];
  
  /**
   * Required metadata fields for this template
   */
  requiredFields: string[];
  
  /**
   * Example content for guidance
   */
  example: string;
}

/**
 * Content analysis result for automatic categorization
 */
export interface ContentAnalysis {
  /**
   * Detected category with confidence score
   */
  category: {
    type: MemoryCategory;
    confidence: number;
  };
  
  /**
   * Detected importance level
   */
  importance: {
    level: ImportanceLevel;
    confidence: number;
  };
  
  /**
   * Extracted keywords and their relevance scores
   */
  keywords: Record<string, number>;
  
  /**
   * Detected action items
   */
  actionItems: string[];
  
  /**
   * Progress indicators found in content
   */
  progressIndicators: {
    checkboxes: {
      total: number;
      completed: number;
    };
    percentages: number[];
    statusKeywords: string[];
  };
  
  /**
   * Detected relationships with other content
   */
  relationships: {
    mentions: string[];
    references: string[];
    dependencies: string[];
  };
  
  /**
   * Content quality metrics
   */
  quality: {
    completeness: number;
    readability: number;
    structure: number;
  };
}