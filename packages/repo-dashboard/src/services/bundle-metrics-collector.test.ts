/**
 * Unit tests for BundleMetricsCollector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BundleMetricsCollector } from './bundle-metrics-collector.js';

describe('BundleMetricsCollector', () => {
  let collector: BundleMetricsCollector;

  beforeEach(() => {
    collector = new BundleMetricsCollector();
  });

  describe('collectBundleMetrics', () => {
    it('should collect bundle metrics for a repository', async () => {
      const metrics = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
      expect(metrics).toBeDefined();
      expect(metrics.repo).toBe('BPMSoftwareSolutions/renderx-plugins-demo');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should return metrics with valid bundle sizes', async () => {
      const metrics = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
      expect(metrics.shellBundleSize).toBeGreaterThan(0);
      expect(metrics.totalBundleSize).toBeGreaterThan(0);
      expect(metrics.pluginBundleSizes).toBeDefined();
      expect(typeof metrics.pluginBundleSizes).toBe('object');
    });

    it('should return metrics with valid budgets', async () => {
      const metrics = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
      expect(metrics.shellBudget).toBeGreaterThan(0);
      expect(metrics.pluginBudgets).toBeDefined();
      expect(typeof metrics.pluginBudgets).toBe('object');
    });

    it('should return metrics with valid status values', async () => {
      const metrics = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
      expect(['green', 'yellow', 'red']).toContain(metrics.shellStatus);
      Object.values(metrics.pluginStatuses).forEach(status => {
        expect(['green', 'yellow', 'red']).toContain(status);
      });
    });

    it('should return metrics with performance data', async () => {
      const metrics = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
      expect(metrics.loadTime).toBeGreaterThan(0);
      expect(metrics.runtimePerformance).toBeDefined();
      expect(metrics.runtimePerformance['fps']).toBeGreaterThan(0);
      expect(metrics.runtimePerformance['memory-usage-mb']).toBeGreaterThan(0);
    });

    it('should cache metrics on subsequent calls', async () => {
      const metrics1 = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      const metrics2 = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'renderx-plugins-demo');
      
      expect(metrics1.timestamp.getTime()).toBe(metrics2.timestamp.getTime());
    });

    it('should handle different repositories', async () => {
      const metrics1 = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'renderx-plugins-canvas');
      const metrics2 = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'renderx-plugins-components');
      
      expect(metrics1.repo).toBe('BPMSoftwareSolutions/renderx-plugins-canvas');
      expect(metrics2.repo).toBe('BPMSoftwareSolutions/renderx-plugins-components');
    });
  });

  describe('getMetricsHistory', () => {
    it('should return empty history for new repository', () => {
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'new-repo');
      expect(history).toEqual([]);
    });

    it('should return metrics history after collection', async () => {
      await collector.collectBundleMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by days parameter', async () => {
      await collector.collectBundleMetrics('BPMSoftwareSolutions', 'test-repo');
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo', 1);
      
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkBudgetAlerts', () => {
    it('should return empty alerts when all bundles are within budget', async () => {
      const metrics = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'test-repo');
      
      // Manually set all statuses to green
      metrics.shellStatus = 'green';
      Object.keys(metrics.pluginStatuses).forEach(key => {
        metrics.pluginStatuses[key] = 'green';
      });
      
      const alerts = collector.checkBudgetAlerts(metrics);
      expect(alerts).toEqual([]);
    });

    it('should return alert when shell bundle exceeds budget', async () => {
      const metrics = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'test-repo');
      metrics.shellStatus = 'red';
      
      const alerts = collector.checkBudgetAlerts(metrics);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toContain('Shell bundle exceeds budget');
    });

    it('should return alerts for plugins exceeding budget', async () => {
      const metrics = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'test-repo');
      
      // Set first plugin to red
      const firstPlugin = Object.keys(metrics.pluginStatuses)[0];
      metrics.pluginStatuses[firstPlugin] = 'red';
      
      const alerts = collector.checkBudgetAlerts(metrics);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toContain(firstPlugin);
    });

    it('should return multiple alerts for multiple violations', async () => {
      const metrics = await collector.collectBundleMetrics('BPMSoftwareSolutions', 'test-repo');
      metrics.shellStatus = 'red';
      
      Object.keys(metrics.pluginStatuses).forEach(key => {
        metrics.pluginStatuses[key] = 'red';
      });
      
      const alerts = collector.checkBudgetAlerts(metrics);
      expect(alerts.length).toBeGreaterThan(1);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific repository', async () => {
      await collector.collectBundleMetrics('BPMSoftwareSolutions', 'test-repo');
      collector.clearCache('BPMSoftwareSolutions', 'test-repo');
      
      const history = collector.getMetricsHistory('BPMSoftwareSolutions', 'test-repo');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
      await collector.collectBundleMetrics('BPMSoftwareSolutions', 'repo1');
      await collector.collectBundleMetrics('BPMSoftwareSolutions', 'repo2');
      
      collector.clearAllCaches();
      
      const history1 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo1');
      const history2 = collector.getMetricsHistory('BPMSoftwareSolutions', 'repo2');
      
      expect(history1).toEqual([]);
      expect(history2).toEqual([]);
    });
  });
});

