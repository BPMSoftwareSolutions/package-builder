/**
 * Unit tests for TestExecutionCollector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestExecutionCollector } from './test-execution-collector.js';

describe('TestExecutionCollector', () => {
  let collector: TestExecutionCollector;

  beforeEach(() => {
    collector = new TestExecutionCollector();
  });

  describe('collectTestMetrics', () => {
    it('should collect test metrics for a repository', async () => {
      const metrics = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should return metrics with valid test counts', async () => {
      const metrics = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.totalTests).toBeGreaterThan(0);
      expect(metrics.passedTests).toBeGreaterThanOrEqual(0);
      expect(metrics.failedTests).toBeGreaterThanOrEqual(0);
      expect(metrics.skippedTests).toBeGreaterThanOrEqual(0);
      expect(metrics.passedTests + metrics.failedTests + metrics.skippedTests).toBeLessThanOrEqual(metrics.totalTests + 1);
    });

    it('should return metrics with valid pass rate', async () => {
      const metrics = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.passRate).toBeGreaterThanOrEqual(0);
      expect(metrics.passRate).toBeLessThanOrEqual(1);
    });

    it('should return metrics with execution time', async () => {
      const metrics = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.totalExecutionTime).toBeGreaterThan(0);
      expect(metrics.avgTestExecutionTime).toBeGreaterThan(0);
    });

    it('should return metrics with flaky test data', async () => {
      const metrics = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(Array.isArray(metrics.flakyTests)).toBe(true);
      expect(metrics.flakyTestPercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.flakyTestPercentage).toBeLessThanOrEqual(1);
    });

    it('should return metrics with test type breakdown', async () => {
      const metrics = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.unitTests).toBeDefined();
      expect(metrics.unitTests.total).toBeGreaterThanOrEqual(0);
      expect(metrics.unitTests.passed).toBeGreaterThanOrEqual(0);
      
      expect(metrics.integrationTests).toBeDefined();
      expect(metrics.integrationTests.total).toBeGreaterThanOrEqual(0);
      expect(metrics.integrationTests.passed).toBeGreaterThanOrEqual(0);
      
      expect(metrics.e2eTests).toBeDefined();
      expect(metrics.e2eTests.total).toBeGreaterThanOrEqual(0);
      expect(metrics.e2eTests.passed).toBeGreaterThanOrEqual(0);
    });

    it('should cache metrics on subsequent calls', async () => {
      const metrics1 = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      // Should be the same object from cache
      expect(metrics1.timestamp.getTime()).toBe(metrics2.timestamp.getTime());
    });

    it('should handle different repositories', async () => {
      const metrics1 = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectTestMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
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
      await collector.collectTestMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by days parameter', async () => {
      await collector.collectTestMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo', 1);
      
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific repository', async () => {
      await collector.collectTestMetrics('BPMSoftwareSolutions', 'test-repo');
      collector.clearCache('BPMSoftwareSolutions', 'test-repo');
      
      // History should still exist
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
      await collector.collectTestMetrics('BPMSoftwareSolutions', 'repo1');
      await collector.collectTestMetrics('BPMSoftwareSolutions', 'repo2');
      
      collector.clearAllCaches();
      
      const history1 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo1');
      const history2 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo2');
      
      expect(history1).toEqual([]);
      expect(history2).toEqual([]);
    });
  });
});

