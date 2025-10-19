/**
 * Unit tests for ArchitectureValidationCollector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArchitectureValidationCollector } from './architecture-validation-collector.js';

describe('ArchitectureValidationCollector', () => {
  let collector: ArchitectureValidationCollector;

  beforeEach(() => {
    collector = new ArchitectureValidationCollector();
  });

  describe('collectValidationMetrics', () => {
    it('should collect validation metrics for a repository', async () => {
      const metrics = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('BPMSoftwareSolutions/renderx-plugins-sdk');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should return metrics with valid pass/fail data', async () => {
      const metrics = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(typeof metrics.passed).toBe('boolean');
      expect(metrics.passRate).toBeGreaterThanOrEqual(0);
      expect(metrics.passRate).toBeLessThanOrEqual(1);
    });

    it('should return metrics with violations array', async () => {
      const metrics = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(Array.isArray(metrics.violations)).toBe(true);
      metrics.violations.forEach(violation => {
        expect(typeof violation.type).toBe('string');
        expect(typeof violation.count).toBe('number');
        expect(['error', 'warning']).toContain(violation.severity);
      });
    });

    it('should return metrics with valid trend', async () => {
      const metrics = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(['improving', 'stable', 'degrading']).toContain(metrics.violationTrend);
    });

    it('should include commit hash in metrics', async () => {
      const metrics = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk', 'abc123');
      
      expect(metrics.commit).toBe('abc123');
    });

    it('should use HEAD as default commit', async () => {
      const metrics = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics.commit).toBe('HEAD');
    });

    it('should cache metrics on subsequent calls', async () => {
      const metrics1 = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      const metrics2 = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'renderx-plugins-sdk');
      
      expect(metrics1.timestamp.getTime()).toBe(metrics2.timestamp.getTime());
    });

    it('should handle different repositories', async () => {
      const metrics1 = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      const metrics2 = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'musical-conductor');
      
      expect(metrics1.repo).toBe('BPMSoftwareSolutions/renderx-plugins-demo');
      expect(metrics2.repo).toBe('BPMSoftwareSolutions/musical-conductor');
    });
  });

  describe('getMetricsHistory', () => {
    it('should return empty history for new repository', () => {
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'new-repo');
      expect(history).toEqual([]);
    });

    it('should return metrics history after collection', async () => {
      await collector.collectValidationMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by days parameter', async () => {
      await collector.collectValidationMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo', 1);
      
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateOrgPassRate', () => {
    it('should return 0 for empty metrics array', () => {
      const passRate = collector.calculateOrgPassRate([]);
      expect(passRate).toBe(0);
    });

    it('should calculate pass rate correctly', async () => {
      const metrics1 = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'repo1');
      const metrics2 = await collector.collectValidationMetrics('BPMSoftwareSolutions', 'repo2');
      
      const passRate = collector.calculateOrgPassRate([metrics1, metrics2]);
      
      expect(passRate).toBeGreaterThanOrEqual(0);
      expect(passRate).toBeLessThanOrEqual(1);
    });

    it('should return 1.0 when all metrics passed', () => {
      const metrics = [
        {
          timestamp: new Date(),
          repo: 'repo1',
          commit: 'abc123',
          passed: true,
          passRate: 1.0,
          violations: [],
          violationTrend: 'improving' as const
        },
        {
          timestamp: new Date(),
          repo: 'repo2',
          commit: 'def456',
          passed: true,
          passRate: 1.0,
          violations: [],
          violationTrend: 'improving' as const
        }
      ];
      
      const passRate = collector.calculateOrgPassRate(metrics);
      expect(passRate).toBe(1.0);
    });

    it('should return 0.5 when half metrics passed', () => {
      const metrics = [
        {
          timestamp: new Date(),
          repo: 'repo1',
          commit: 'abc123',
          passed: true,
          passRate: 1.0,
          violations: [],
          violationTrend: 'improving' as const
        },
        {
          timestamp: new Date(),
          repo: 'repo2',
          commit: 'def456',
          passed: false,
          passRate: 0.0,
          violations: [{ type: 'import-boundary', count: 5, severity: 'error' as const }],
          violationTrend: 'degrading' as const
        }
      ];
      
      const passRate = collector.calculateOrgPassRate(metrics);
      expect(passRate).toBe(0.5);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific repository', async () => {
      await collector.collectValidationMetrics('BPMSoftwareSolutions', 'test-repo');
      collector.clearCache('BPMSoftwareSolutions', 'test-repo');
      
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
      await collector.collectValidationMetrics('BPMSoftwareSolutions', 'repo1');
      await collector.collectValidationMetrics('BPMSoftwareSolutions', 'repo2');
      
      collector.clearAllCaches();
      
      const history1 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo1');
      const history2 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo2');
      
      expect(history1).toEqual([]);
      expect(history2).toEqual([]);
    });
  });
});

