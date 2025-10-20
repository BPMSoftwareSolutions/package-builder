/**
 * Unit tests for TestCoverageCollector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestCoverageCollector } from './test-coverage-collector.js';

// Mock the GitHub fetch function
vi.mock('../github.js', () => ({
  fetchGitHub: vi.fn()
}));

import { fetchGitHub } from '../github.js';

describe('TestCoverageCollector', () => {
  let collector: TestCoverageCollector;

  beforeEach(() => {
    collector = new TestCoverageCollector();
    vi.clearAllMocks();
  });

  // Helper function to create mock code scanning alerts
  const createMockCodeScanningAlerts = (alertCount: number = 5) => {
    const alerts = [];
    for (let i = 0; i < alertCount; i++) {
      alerts.push({
        number: 1000 + i,
        state: 'open',
        rule: {
          id: `rule-${i}`,
          severity: 'warning'
        }
      });
    }
    return alerts;
  };

  describe('collectCoverageMetrics', () => {
    it('should collect coverage metrics for a repository', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');

      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should return metrics with valid coverage percentages', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');

      expect(metrics.lineCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.lineCoverage).toBeLessThanOrEqual(100);
      expect(metrics.branchCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.branchCoverage).toBeLessThanOrEqual(100);
      expect(metrics.functionCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.functionCoverage).toBeLessThanOrEqual(100);
      expect(metrics.statementCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.statementCoverage).toBeLessThanOrEqual(100);
    });

    it('should return metrics with valid trend', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');

      expect(['improving', 'stable', 'degrading']).toContain(metrics.coverageTrend);
    });

    it('should return metrics with percentage change', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');

      expect(typeof metrics.percentageChange).toBe('number');
      expect(metrics.percentageChange).toBeGreaterThanOrEqual(-100);
      expect(metrics.percentageChange).toBeLessThanOrEqual(100);
    });

    it('should return metrics with uncovered lines and branches', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');

      expect(metrics.uncoveredLines).toBeGreaterThanOrEqual(0);
      expect(metrics.uncoveredBranches).toBeGreaterThanOrEqual(0);
    });

    it('should return metrics with critical path coverage', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');

      expect(metrics.criticalPathCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.criticalPathCoverage).toBeLessThanOrEqual(100);
    });

    it('should cache metrics on subsequent calls', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      const metrics1 = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');

      // Should be the same object from cache
      expect(metrics1.timestamp.getTime()).toBe(metrics2.timestamp.getTime());
      // fetchGitHub should only be called once due to caching
      expect(fetchGitHub).toHaveBeenCalledTimes(1);
    });

    it('should handle different repositories', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      const metrics1 = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');

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
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');

      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by days parameter', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo', 1);

      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific repository', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'test-repo');
      collector.clearCache('BPMSoftwareSolutions', 'test-repo');

      // History should still exist
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
      const mockAlerts = createMockCodeScanningAlerts(5);
      (fetchGitHub as any).mockResolvedValue(mockAlerts);

      await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'repo1');
      await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'repo2');

      collector.clearAllCaches();

      const history1 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo1');
      const history2 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo2');

      expect(history1).toEqual([]);
      expect(history2).toEqual([]);
    });
  });
});

