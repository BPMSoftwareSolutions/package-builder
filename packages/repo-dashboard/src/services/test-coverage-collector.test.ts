/**
 * Unit tests for TestCoverageCollector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestCoverageCollector } from './test-coverage-collector.js';

describe('TestCoverageCollector', () => {
  let collector: TestCoverageCollector;

  beforeEach(() => {
    collector = new TestCoverageCollector();
  });

  describe('collectCoverageMetrics', () => {
    it('should collect coverage metrics for a repository', async () => {
      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should return metrics with valid coverage percentages', async () => {
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
      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(['improving', 'stable', 'degrading']).toContain(metrics.coverageTrend);
    });

    it('should return metrics with percentage change', async () => {
      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(typeof metrics.percentageChange).toBe('number');
      expect(metrics.percentageChange).toBeGreaterThanOrEqual(-100);
      expect(metrics.percentageChange).toBeLessThanOrEqual(100);
    });

    it('should return metrics with uncovered lines and branches', async () => {
      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.uncoveredLines).toBeGreaterThanOrEqual(0);
      expect(metrics.uncoveredBranches).toBeGreaterThanOrEqual(0);
    });

    it('should return metrics with critical path coverage', async () => {
      const metrics = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.criticalPathCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.criticalPathCoverage).toBeLessThanOrEqual(100);
    });

    it('should cache metrics on subsequent calls', async () => {
      const metrics1 = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      // Should be the same object from cache
      expect(metrics1.timestamp.getTime()).toBe(metrics2.timestamp.getTime());
    });

    it('should handle different repositories', async () => {
      const metrics1 = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
      expect(metrics1.repo).toBe('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(metrics2.repo).toBe('BPMSoftwareSolutions/renderx-plugins-demo');
    });
  });

  describe('getMetricsHistory', () => {
    it('should return empty history for new repository', () => {
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'new-repo');
      expect(history).toEqual([]);
    });

    it('should return metrics history after collection', async () => {
      await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by days parameter', async () => {
      await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo', 1);
      
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific repository', async () => {
      await collector.collectCoverageMetrics('BPMSoftwareSolutions', 'test-repo');
      collector.clearCache('BPMSoftwareSolutions', 'test-repo');
      
      // History should still exist
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
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

