/**
 * Tests for Pull Request Metrics Collector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PullRequestMetricsCollector, PRMetrics } from './pull-request-metrics-collector.js';

// Mock the GitHub API
vi.mock('../github.js', () => ({
  fetchGitHub: vi.fn()
}));

import { fetchGitHub } from '../github.js';

describe('PullRequestMetricsCollector', () => {
  let collector: PullRequestMetricsCollector;

  beforeEach(() => {
    collector = new PullRequestMetricsCollector();
    vi.clearAllMocks();
  });

  describe('calculatePRMetrics', () => {
    it('should calculate metrics for a merged PR', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const mergedAt = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const pr = {
        number: 123,
        created_at: createdAt.toISOString(),
        merged_at: mergedAt.toISOString(),
        closed_at: null,
        state: 'closed',
        changed_files: 5,
        additions: 100,
        deletions: 50,
        user: { login: 'testuser' },
        title: 'Test PR'
      };

      const metrics = (collector as any).calculatePRMetrics(pr, 'org', 'repo');

      expect(metrics.prNumber).toBe(123);
      expect(metrics.repo).toBe('org/repo');
      expect(metrics.status).toBe('merged');
      expect(metrics.filesChanged).toBe(5);
      expect(metrics.additions).toBe(100);
      expect(metrics.deletions).toBe(50);
      expect(metrics.author).toBe('testuser');
      expect(metrics.totalCycleTime).toBeGreaterThan(0);
    });

    it('should calculate metrics for an open PR', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const pr = {
        number: 456,
        created_at: createdAt.toISOString(),
        merged_at: null,
        closed_at: null,
        state: 'open',
        changed_files: 3,
        additions: 50,
        deletions: 20,
        user: { login: 'developer' },
        title: 'WIP: New feature'
      };

      const metrics = (collector as any).calculatePRMetrics(pr, 'org', 'repo');

      expect(metrics.status).toBe('open');
      expect(metrics.prNumber).toBe(456);
      expect(metrics.totalCycleTime).toBeGreaterThan(0);
    });
  });

  describe('collectPRMetrics', () => {
    it('should collect PR metrics from GitHub API', async () => {
      const mockPRs = [
        {
          number: 1,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: null,
          state: 'closed',
          changed_files: 5,
          additions: 100,
          deletions: 50,
          user: { login: 'user1' },
          title: 'PR 1'
        },
        {
          number: 2,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: null,
          state: 'closed',
          changed_files: 3,
          additions: 75,
          deletions: 30,
          user: { login: 'user2' },
          title: 'PR 2'
        }
      ];

      (fetchGitHub as any).mockResolvedValue(mockPRs);

      const metrics = await collector.collectPRMetrics('org', 'repo', 30);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].prNumber).toBe(1);
      expect(metrics[1].prNumber).toBe(2);
      expect(fetchGitHub).toHaveBeenCalled();
    });

    it('should use cache for subsequent calls', async () => {
      const mockPRs = [
        {
          number: 1,
          created_at: new Date().toISOString(),
          merged_at: new Date().toISOString(),
          closed_at: null,
          state: 'closed',
          changed_files: 5,
          additions: 100,
          deletions: 50,
          user: { login: 'user1' },
          title: 'PR 1'
        }
      ];

      (fetchGitHub as any).mockResolvedValue(mockPRs);

      // First call
      const metrics1 = await collector.collectPRMetrics('org', 'repo', 30);
      expect(fetchGitHub).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const metrics2 = await collector.collectPRMetrics('org', 'repo', 30);
      expect(fetchGitHub).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('calculateAggregateMetrics', () => {
    it('should calculate aggregate metrics', async () => {
      const mockPRs = [
        {
          number: 1,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: null,
          state: 'closed',
          changed_files: 5,
          additions: 100,
          deletions: 50,
          user: { login: 'user1' },
          title: 'PR 1'
        }
      ];

      (fetchGitHub as any).mockResolvedValue(mockPRs);

      const agg = await collector.calculateAggregateMetrics('org', 'repo', 30);

      expect(agg.repo).toBe('org/repo');
      expect(agg.prCount).toBe(1);
      expect(agg.mergedCount).toBe(1);
      expect(agg.avgCycleTime).toBeGreaterThan(0);
      expect(agg.avgPRSize).toBe(5);
    });

    it('should return zeros for empty repository', async () => {
      (fetchGitHub as any).mockResolvedValue([]);

      const agg = await collector.calculateAggregateMetrics('org', 'empty-repo', 30);

      expect(agg.prCount).toBe(0);
      expect(agg.mergedCount).toBe(0);
      expect(agg.avgCycleTime).toBe(0);
      expect(agg.avgPRSize).toBe(0);
    });
  });

  describe('cache management', () => {
    it('should clear cache for specific repository', async () => {
      const mockPRs = [];
      (fetchGitHub as any).mockResolvedValue(mockPRs);

      await collector.collectPRMetrics('org', 'repo', 30);
      let stats = collector.getCacheStats();
      expect(stats.totalEntries).toBe(1);

      collector.clearCache('org', 'repo');
      stats = collector.getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should clear all cache', async () => {
      const mockPRs = [];
      (fetchGitHub as any).mockResolvedValue(mockPRs);

      await collector.collectPRMetrics('org', 'repo1', 30);
      await collector.collectPRMetrics('org', 'repo2', 30);

      let stats = collector.getCacheStats();
      expect(stats.totalEntries).toBe(2);

      collector.clearCache();
      stats = collector.getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should provide cache statistics', async () => {
      const mockPRs = [];
      (fetchGitHub as any).mockResolvedValue(mockPRs);

      await collector.collectPRMetrics('org', 'repo', 30);
      const stats = collector.getCacheStats();

      expect(stats.totalEntries).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].key).toBe('org/repo');
      expect(stats.entries[0].metricsCount).toBe(0);
    });
  });
});

