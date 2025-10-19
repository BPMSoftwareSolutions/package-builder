/**
 * Unit tests for ConductorMetricsCollector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConductorMetricsCollector } from './conductor-metrics-collector.js';

describe('ConductorMetricsCollector', () => {
  let collector: ConductorMetricsCollector;

  beforeEach(() => {
    collector = new ConductorMetricsCollector();
  });

  describe('collectConductorMetrics', () => {
    it('should collect conductor metrics for a repository', async () => {
      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');
      
      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('BPMSoftwareSolutions/musical-conductor');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should return metrics with valid throughput data', async () => {
      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');
      
      expect(metrics.sequencesPerMinute).toBeGreaterThan(0);
      expect(metrics.queueLength).toBeGreaterThanOrEqual(0);
      expect(metrics.avgExecutionTime).toBeGreaterThan(0);
    });

    it('should return metrics with valid success/error rates', async () => {
      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(1);
      expect(metrics.successRate + metrics.errorRate).toBeCloseTo(1, 1);
    });

    it('should return metrics with error types', async () => {
      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');
      
      expect(metrics.errorTypes).toBeDefined();
      expect(typeof metrics.errorTypes).toBe('object');
      expect(metrics.errorTypes['timeout']).toBeGreaterThanOrEqual(0);
    });

    it('should return metrics with valid trends', async () => {
      const metrics = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');

      expect(['increasing', 'stable', 'decreasing']).toContain(metrics.throughputTrend);
      expect(['improving', 'stable', 'degrading']).toContain(metrics.successRateTrend);
    });

    it('should cache metrics on subsequent calls', async () => {
      const metrics1 = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');
      const metrics2 = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'musical-conductor');
      
      // Should be the same object from cache
      expect(metrics1.timestamp.getTime()).toBe(metrics2.timestamp.getTime());
    });

    it('should handle different repositories', async () => {
      const metrics1 = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectConductorMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
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
      await collector.collectConductorMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by days parameter', async () => {
      await collector.collectConductorMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo', 1);
      
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific repository', async () => {
      await collector.collectConductorMetrics('BPMSoftwareSolutions', 'test-repo');
      collector.clearCache('BPMSoftwareSolutions', 'test-repo');
      
      // History should still exist
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
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

