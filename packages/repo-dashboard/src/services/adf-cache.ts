/**
 * ADF Cache Service
 * Manages caching of Architecture Definition Files with TTL and metrics
 */

import { ArchitectureDefinition } from './adf-fetcher.js';

export interface CacheEntry {
  data: ArchitectureDefinition;
  timestamp: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  entries: Array<{
    key: string;
    age: number;
    hits: number;
  }>;
}

/**
 * ADFCache class for managing ADF cache with TTL and metrics
 */
export class ADFCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number; // milliseconds
  private hits: number = 0;
  private misses: number = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(ttlMinutes: number = 60) {
    this.ttl = ttlMinutes * 60 * 1000;
    this.startCleanupInterval();
  }

  /**
   * Get ADF from cache
   */
  get(key: string): ArchitectureDefinition | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      console.log(`⏰ Cache entry expired for ${key}`);
      return null;
    }

    // Update hit count
    entry.hits++;
    this.hits++;
    console.log(`✅ Cache hit for ${key} (hits: ${entry.hits})`);
    return entry.data;
  }

  /**
   * Set ADF in cache
   */
  set(key: string, data: ArchitectureDefinition): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
    console.log(`💾 Cached ADF for ${key}`);
  }

  /**
   * Check if key exists in cache and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('✅ Cache cleared');
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    console.log(`🔄 Invalidated ${count} cache entries matching pattern: ${pattern}`);
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      hits: entry.hits
    }));

    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      entries
    };
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop automatic cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cache cleanup: removed ${removed} expired entries`);
    }
  }

  /**
   * Set TTL for cache entries
   */
  setTTL(ttlMinutes: number): void {
    this.ttl = ttlMinutes * 60 * 1000;
    console.log(`⏱️ Cache TTL set to ${ttlMinutes} minutes`);
  }

  /**
   * Get current TTL in minutes
   */
  getTTL(): number {
    return this.ttl / (60 * 1000);
  }
}

// Export singleton instance with 1 hour TTL
export const adfCache = new ADFCache(60);

