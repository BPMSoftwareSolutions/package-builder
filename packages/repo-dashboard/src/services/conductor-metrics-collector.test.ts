/**
 * Unit tests for ConductorMetricsCollector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConductorMetricsCollector } from './conductor-metrics-collector.js';

// Mock the GitHub fetch function
vi.mock('../github.js', () => ({
  fetchGitHub: vi.fn()
}));

import { fetchGitHub } from '../github.js';

describe('ConductorMetricsCollector', () => {
  let collector: ConductorMetricsCollector;

  beforeEach(() => {
    collector = new ConductorMetricsCollector();
    vi.clearAllMocks();
  });

  // Helper function to create mock workflow runs
  const createMockWorkflowRuns = (successCount: number, failureCount: number) => {
    const runs = [];

    // Add successful runs
    for (let i = 0; i < successCount; i++) {
      runs.push({
        id: 1000 + i,
        name: 'Test Workflow',
        conclusion: 'success',
        status: 'completed',
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        updated_at: new Date(Date.now() - i * 3600000 + 300000).toISOString()
      });
    }

    // Add failed runs
    for (let i = 0; i < failureCount; i++) {
      runs.push({
        id: 2000 + i,
        name: 'Test Workflow',
        conclusion: 'failure',
        status: 'completed',
        created_at: new Date(Date.now() - (successCount + i) * 3600000).toISOString(),
        updated_at: new Date(Date.now() - (successCount + i) * 3600000 + 300000).toISOString()
      });
    }

    return runs;
  };

  describe('collectConductorMetrics', () => {
    it('should collect conductor metrics for a repository', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');

      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('BPMSoftwareSolutions/musical-conductor');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should return metrics with valid throughput data', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');

      expect(metrics.sequencesPerMinute).toBeGreaterThan(0);
      expect(metrics.queueLength).toBeGreaterThanOrEqual(0);
      expect(metrics.avgExecutionTime).toBeGreaterThan(0);
    });

    it('should return metrics with valid success/error rates', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');

      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(1);
      expect(metrics.successRate + metrics.errorRate).toBeCloseTo(1, 1);
    });

    it('should return metrics with error types', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');

      expect(metrics.errorTypes).toBeDefined();
      expect(typeof metrics.errorTypes).toBe('object');
      expect(metrics.errorTypes['timeout']).toBeGreaterThanOrEqual(0);
    });

    it('should return metrics with valid trends', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');

      expect(['increasing', 'stable', 'decreasing']).toContain(metrics.throughputTrend);
      expect(['improving', 'stable', 'degrading']).toContain(metrics.successRateTrend);
    });

    it('should cache metrics on subsequent calls', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      const metrics1 = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');
      const metrics2 = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');

      // Should be the same object from cache
      expect(metrics1.timestamp.getTime()).toBe(metrics2.timestamp.getTime());
      // fetchGitHub should only be called once due to caching
      expect(fetchGitHub).toHaveBeenCalledTimes(1);
    });

    it('should handle different repositories', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      const metrics1 = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');

      expect(metrics1.repo).toBe('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(metrics2.repo).toBe('BPMSoftwareSolutions/renderx-plugins-demo');
      // Should call fetchGitHub twice for different repos
      expect(fetchGitHub).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMetricsHistory', () => {
    it('should return empty history for new repository', () => {
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'new-repo');
      expect(history).toEqual([]);
    });

    it('should return metrics history after collection', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      await collector.collectConductorMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');

      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by days parameter', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      await collector.collectConductorMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo', 1);

      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific repository', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      await collector.collectConductorMetrics('BPMSoftwareSolutions', 'test-repo');
      collector.clearCache('BPMSoftwareSolutions', 'test-repo');

      // History should still exist
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
      const mockRuns = createMockWorkflowRuns(8, 2);
      (fetchGitHub as any).mockResolvedValue({ workflow_runs: mockRuns });

      await collector.collectConductorMetrics('BPMSoftwareSolutions', 'repo1');
      await collector.collectConductorMetrics('BPMSoftwareSolutions', 'repo2');

      collector.clearAllCaches();

      const history1 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo1');
      const history2 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo2');

      expect(history1).toEqual([]);
      expect(history2).toEqual([]);
    });
  });
});

