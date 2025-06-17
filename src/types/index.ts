/**
 * Advanced Memory Bank MCP Types v4.0.0
 * Type definitions for the memory management system
 */

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

export interface ProjectInfo {
  projectName: string;
  projectPath: string;
  totalMemories: number;
  memoryDirectory: string;
  version: string;
}

export interface SequentialThought {
  id: string;
  content: string;
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  timestamp: number;
}

export interface ThoughtResult {
  thoughtNumber: number;
  totalThoughts: number;
  content: string;
  status: string;
  nextThoughtNeeded: boolean;
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  content: string;
  completed: boolean;
  timestamp: number;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  currentStep: number;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowResult {
  success: boolean;
  message: string;
  workflow?: Workflow;
  currentStep?: WorkflowStep;
}

export interface CreativeAnalysis {
  analysisType?: string;
  depth?: string;
  wordCount?: number;
  sentenceCount?: number;
  summary?: string;
  insights: string[];
  suggestions?: string[];
  recommendations?: string[];
  patterns?: string[];
  themes?: string[];
  styleElements?: string[];
}

export interface AnalysisConfig {
  analysisType: 'structure' | 'themes' | 'style' | 'patterns' | 'comprehensive';
  depth: 'basic' | 'detailed' | 'comprehensive';
  includePatterns?: boolean;
  includeThemes?: boolean;
  includeStyle?: boolean;
}

export interface CreativeInsightConfig {
  theme: string;
  creativityLevel: 'conservative' | 'balanced' | 'innovative';
  limit: number;
  includeMemories?: boolean;
  contextualDepth?: 'shallow' | 'medium' | 'deep';
}

export interface MemorySearchOptions {
  query: string;
  tags?: string[];
  limit?: number;
  sortBy?: 'timestamp' | 'importance' | 'relevance';
  includeContent?: boolean;
  minImportance?: number;
  maxAge?: number; // in days
}

export interface MemoryListOptions {
  tags?: string[];
  limit?: number;
  sortBy?: 'timestamp' | 'importance';
  ascending?: boolean;
  minImportance?: number;
  maxAge?: number; // in days
}

export interface CacheConfig {
  maxSize: number;
  ttl: number; // time to live in milliseconds
  enablePersistence?: boolean;
  persistenceInterval?: number; // in milliseconds
}

export interface ProjectDetectionResult {
  name: string;
  path: string;
  source: 'vscode' | 'package.json' | 'git' | 'directory' | 'fallback';
  confidence: number; // 0-1
}

export interface MemoryValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SystemStats {
  totalMemories: number;
  memoriesThisWeek: number;
  memoriesThisMonth: number;
  averageImportance: number;
  mostUsedTags: string[];
  projectsManaged: string[];
  systemVersion: string;
  uptime: number; // in milliseconds
}

export type MemoryOperationResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
}
