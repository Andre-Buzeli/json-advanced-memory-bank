/**
 * Cache Manager implementation for Advanced Memory Bank MCP
 */

import { ICacheManager, CacheEntry, CacheStats } from './storage-interfaces.js';
import { MemoryBankError } from '../errors/index.js';

export class CacheManager implements ICacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly defaultTTL: number;
  private readonly maxSize: number;

  constructor(defaultTTL: number = 60000, maxSize: number = 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      memoryUsage: 0
    };

    // Start periodic cleanup
    this.startCleanupInterval();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.updateStats();
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    try {
      // Check if we need to evict items to make space
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }

      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL
      };

      this.cache.set(key, entry);
      this.updateStats();
    } catch (error) {
      throw new MemoryBankError(
        `Failed to set cache entry for key: ${key}`,
        'CACHE_SET_FAILED',
        { operation: 'cache_set', details: { key, error: error instanceof Error ? error.message : 'Unknown error' } },
        { canRetry: false }
      );
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.updateStats();
    }
    return result;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.updateStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Manual cleanup of expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.updateStats();
    }

    if (process.env.DEBUG_MEMORY_BANK === 'true') {
      console.log(`[CacheManager] Cleaned up ${removedCount} expired entries`);
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const [key, entry] of this.cache.entries()) {
      memoryUsage += key.length * 2; // UTF-16 string
      memoryUsage += JSON.stringify(entry.data).length * 2;
      memoryUsage += 48; // Approximate overhead for entry object
    }
    this.stats.memoryUsage = memoryUsage;
  }

  /**
   * Evict least recently used entry to make space
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.updateStats();
      
      if (process.env.DEBUG_MEMORY_BANK === 'true') {
        console.log(`[CacheManager] Evicted LRU entry: ${oldestKey}`);
      }
    }
  }

  /**
   * Start periodic cleanup interval
   */
  private startCleanupInterval(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Get formatted cache summary
   */
  getSummary(): string {
    const hitRatio = (this.getHitRatio() * 100).toFixed(1);
    const memoryMB = (this.stats.memoryUsage / 1024 / 1024).toFixed(2);
    
    return `Cache: ${this.stats.size}/${this.maxSize} entries, ` +
           `${hitRatio}% hit ratio, ${memoryMB}MB memory`;
  }

  /**
   * Create cache key from components
   */
  static createKey(...components: string[]): string {
    return components.join(':');
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): number {
    let removedCount = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.updateStats();
    }

    return removedCount;
  }

  /**
   * Preload cache with data
   */
  preload<T>(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.ttl);
    }
  }
}
