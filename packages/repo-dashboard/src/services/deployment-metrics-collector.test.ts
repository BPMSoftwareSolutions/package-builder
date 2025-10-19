/**
 * Tests for Deployment Metrics Collector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeploymentMetricsCollector } from './deployment-metrics-collector.js';

// Mock the GitHub API
vi.mock('../github.js', () => ({
  fetchGitHub: vi.fn()
}));

import { fetchGitHub } from '../github.js';

describe('DeploymentMetricsCollector', () => {
  let collector: DeploymentMetricsCollector;

  beforeEach(() => {
    collector = new DeploymentMetricsCollector();
    vi.clearAllMocks();
  });

  describe('calculateDeploymentMetrics', () => {
    it('should calculate metrics for a successful deployment', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      const run = {
        id: 12345,
        name: 'Deploy to Production',
        created_at: createdAt.toISOString(),
        updated_at: now.toISOString(),
        status: 'completed',
        conclusion: 'success'
      };

      const metrics = (collector as any).calculateDeploymentMetrics(run, 'org', 'repo');

      expect(metrics.workflowName).toBe('Deploy to Production');
      expect(metrics.environment).toBe('production');
      expect(metrics.status).toBe('success');
      expect(metrics.isRollback).toBe(false);
      expect(metrics.duration).toBeGreaterThan(0);
    });

    it('should detect rollback deployments', () => {
      const run = {
        id: 12346,
        name: 'Rollback Production',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'completed',
        conclusion: 'success'
      };

      const metrics = (collector as any).calculateDeploymentMetrics(run, 'org', 'repo');

      expect(metrics.isRollback).toBe(true);
      expect(metrics.environment).toBe('production');
    });

    it('should extract environment from workflow name', () => {
      const testCases = [
        { name: 'Deploy to Production', expected: 'production' },
        { name: 'Deploy to Staging', expected: 'staging' },
        { name: 'Deploy to Dev', expected: 'dev' },
        { name: 'Build and Test', expected: 'unknown' }
      ];

      for (const testCase of testCases) {
        const run = {
          id: 1,
          name: testCase.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'completed',
          conclusion: 'success'
        };

        const metrics = (collector as any).calculateDeploymentMetrics(run, 'org', 'repo');
        expect(metrics.environment).toBe(testCase.expected);
      }
    });

    it('should handle failed deployments', () => {
      const run = {
        id: 12347,
        name: 'Deploy to Production',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'completed',
        conclusion: 'failure'
      };

      const metrics = (collector as any).calculateDeploymentMetrics(run, 'org', 'repo');

      expect(metrics.status).toBe('failure');
    });
  });

  describe('collectDeploymentMetrics', () => {
    it('should collect deployment metrics from GitHub API', async () => {
      const mockResponse = {
        workflow_runs: [
          {
            id: 1,
            name: 'Deploy to Production',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            status: 'completed',
            conclusion: 'success'
          },
          {
            id: 2,
            name: 'Deploy to Staging',
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            status: 'completed',
            conclusion: 'success'
          }
        ]
      };

      (fetchGitHub as any).mockResolvedValue(mockResponse);

      const metrics = await collector.collectDeploymentMetrics('org', 'repo', 30);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].workflowName).toBe('Deploy to Production');
      expect(metrics[1].workflowName).toBe('Deploy to Staging');
    });

    it('should use cache for subsequent calls', async () => {
      const mockResponse = {
        workflow_runs: [
          {
            id: 1,
            name: 'Deploy',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'completed',
            conclusion: 'success'
          }
        ]
      };

      (fetchGitHub as any).mockResolvedValue(mockResponse);

      // First call
      const metrics1 = await collector.collectDeploymentMetrics('org', 'repo', 30);
      expect(fetchGitHub).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const metrics2 = await collector.collectDeploymentMetrics('org', 'repo', 30);
      expect(fetchGitHub).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('calculateAggregateMetrics', () => {
    it('should calculate aggregate deployment metrics', async () => {
      const mockResponse = {
        workflow_runs: [
          {
            id: 1,
            name: 'Deploy to Production',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            conclusion: 'success'
          },
          {
            id: 2,
            name: 'Deploy to Production',
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            conclusion: 'failure'
          }
        ]
      };

      (fetchGitHub as any).mockResolvedValue(mockResponse);

      const agg = await collector.calculateAggregateMetrics('org', 'repo', 30);

      expect(agg.repo).toBe('org/repo');
      expect(agg.deploymentCount).toBe(2);
      expect(agg.successCount).toBe(1);
      expect(agg.failureCount).toBe(1);
      expect(agg.successRate).toBe(0.5);
      expect(agg.deploysPerDay).toBeGreaterThan(0);
    });

    it('should return zeros for empty repository', async () => {
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: [] });

      const agg = await collector.calculateAggregateMetrics('org', 'empty-repo', 30);

      expect(agg.deploymentCount).toBe(0);
      expect(agg.successCount).toBe(0);
      expect(agg.failureCount).toBe(0);
      expect(agg.successRate).toBe(0);
    });
  });

  describe('cache management', () => {
    it('should clear cache for specific repository', async () => {
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: [] });

      await collector.collectDeploymentMetrics('org', 'repo', 30);
      let stats = collector.getCacheStats();
      expect(stats.totalEntries).toBe(1);

      collector.clearCache('org', 'repo');
      stats = collector.getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should provide cache statistics', async () => {
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: [] });

      await collector.collectDeploymentMetrics('org', 'repo', 30);
      const stats = collector.getCacheStats();

      expect(stats.totalEntries).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].key).toBe('org/repo');
    });
  });
});

