/**
 * Unit tests for ADF Cache Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ADFCache } from '../../src/services/adf-cache.js';
import type { ArchitectureDefinition } from '../../src/services/adf-fetcher.js';

describe('ADFCache', () => {
  let cache: ADFCache;
  const mockADF: ArchitectureDefinition = {
    version: '1.0.0',
    name: 'Test Architecture',
    description: 'Test ADF',
    c4Model: {
      level: 'container',
      containers: [],
      relationships: []
    },
    metrics: {
      healthScore: 0.85,
      testCoverage: 0.80,
      buildStatus: 'success'
    }
  };

  beforeEach(() => {
    cache = new ADFCache(60); // 60 minute TTL
  });

  afterEach(() => {
    cache.stopCleanupInterval();
  });

  describe('basic operations', () => {
    it('should set and get ADF from cache', () => {
      cache.set('test-key', mockADF);
      const result = cache.get('test-key');

      expect(result).toEqual(mockADF);
    });

    it('should return null for missing key', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('test-key', mockADF);
      expect(cache.has('test-key')).toBe(true);
      expect(cache.has('non-existent-key')).toBe(false);
    });

    it('should delete entry from cache', () => {
      cache.set('test-key', mockADF);
      expect(cache.has('test-key')).toBe(true);

      const deleted = cache.delete('test-key');
      expect(deleted).toBe(true);
      expect(cache.has('test-key')).toBe(false);
    });

    it('should clear all cache entries', () => {
      cache.set('key1', mockADF);
      cache.set('key2', mockADF);

      cache.clear();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('cache statistics', () => {
    it('should track cache hits and misses', () => {
      cache.set('test-key', mockADF);

      // Hit
      cache.get('test-key');
      // Miss
      cache.get('non-existent-key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate', () => {
      cache.set('test-key', mockADF);

      cache.get('test-key'); // hit
      cache.get('test-key'); // hit
      cache.get('non-existent-key'); // miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should track entry hits', () => {
      cache.set('test-key', mockADF);

      cache.get('test-key');
      cache.get('test-key');
      cache.get('test-key');

      const stats = cache.getStats();
      const entry = stats.entries.find(e => e.key === 'test-key');
      expect(entry?.hits).toBe(3);
    });

    it('should return cache statistics', () => {
      cache.set('key1', mockADF);
      cache.set('key2', mockADF);

      const stats = cache.getStats();
      expect(stats).toHaveProperty('size', 2);
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(Array.isArray(stats.entries)).toBe(true);
    });
  });

  describe('TTL management', () => {
    it('should set and get TTL', () => {
      cache.setTTL(120);
      expect(cache.getTTL()).toBe(120);
    });

    it('should expire entries after TTL', async () => {
      const shortCache = new ADFCache(0.001); // 0.001 minutes = ~60ms
      shortCache.set('test-key', mockADF);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = shortCache.get('test-key');
      expect(result).toBeNull();

      shortCache.stopCleanupInterval();
    });
  });

  describe('pattern invalidation', () => {
    it('should invalidate entries matching pattern', () => {
      cache.set('org1/repo1/adf.json', mockADF);
      cache.set('org1/repo2/adf.json', mockADF);
      cache.set('org2/repo1/adf.json', mockADF);

      const invalidated = cache.invalidatePattern('^org1/');
      expect(invalidated).toBe(2);
      expect(cache.has('org1/repo1/adf.json')).toBe(false);
      expect(cache.has('org2/repo1/adf.json')).toBe(true);
    });

    it('should handle pattern with no matches', () => {
      cache.set('test-key', mockADF);

      const invalidated = cache.invalidatePattern('^nomatch/');
      expect(invalidated).toBe(0);
      expect(cache.has('test-key')).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should start and stop cleanup interval', () => {
      const cache2 = new ADFCache(60);
      expect(cache2).toBeDefined();

      cache2.stopCleanupInterval();
      // Should not throw
    });
  });
});

