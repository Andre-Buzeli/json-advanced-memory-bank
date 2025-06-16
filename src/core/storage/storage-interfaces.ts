/**
 * Storage interface definitions
 */

import { ProjectJsonStructure } from '../../types/index.js';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  memoryUsage: number;
}

export interface ICacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  getStats(): CacheStats;
  cleanup(): void;
}

export interface IMemoryStorage {
  readProjectJson(projectName: string): Promise<ProjectJsonStructure>;
  writeProjectJson(projectName: string, data: ProjectJsonStructure): Promise<void>;
  getProjectJsonPath(projectName: string): string;
  ensureProjectExists(projectName: string): Promise<void>;
  clearCache(projectName?: string): void;
}
