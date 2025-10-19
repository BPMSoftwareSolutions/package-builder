/**
 * Tests for Metrics Storage Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsStorage } from './metrics-storage.js';

describe('MetricsStorage', () => {
  let storage: MetricsStorage;

  beforeEach(() => {
    storage = new MetricsStorage();
  });

  describe('storePRMetrics', () => {
    it('should store PR metrics', () => {
      const metrics = {
        prCount: 10,
        mergedCount: 8,
        avgCycleTime: 1440
      };

      storage.storePRMetrics('org/repo', metrics, 30, 'Host Team');

      const history = storage.getMetricsHistory('org/repo', 'pr');
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('pr');
      expect(history[0].data).toEqual(metrics);
    });

    it('should store multiple PR metrics', () => {
      storage.storePRMetrics('org/repo1', { prCount: 5 }, 30);
      storage.storePRMetrics('org/repo2', { prCount: 10 }, 30);

      const history1 = storage.getMetricsHistory('org/repo1', 'pr');
      const history2 = storage.getMetricsHistory('org/repo2', 'pr');

      expect(history1).toHaveLength(1);
      expect(history2).toHaveLength(1);
    });
  });

  describe('storeDeploymentMetrics', () => {
    it('should store deployment metrics', () => {
      const metrics = {
        deploymentCount: 5,
        successCount: 4,
        successRate: 0.8
      };

      storage.storeDeploymentMetrics('org/repo', metrics, 30, 'Host Team');

      const history = storage.getMetricsHistory('org/repo', 'deployment');
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('deployment');
      expect(history[0].data).toEqual(metrics);
    });
  });

  describe('getMetricsHistory', () => {
    it('should retrieve metrics history for a repository', () => {
      storage.storePRMetrics('org/repo', { prCount: 5 }, 30);
      storage.storeDeploymentMetrics('org/repo', { deploymentCount: 3 }, 30);

      const history = storage.getMetricsHistory('org/repo');
      expect(history).toHaveLength(2);
    });

    it('should filter by type', () => {
      storage.storePRMetrics('org/repo', { prCount: 5 }, 30);
      storage.storeDeploymentMetrics('org/repo', { deploymentCount: 3 }, 30);

      const prHistory = storage.getMetricsHistory('org/repo', 'pr');
      const deployHistory = storage.getMetricsHistory('org/repo', 'deployment');

      expect(prHistory).toHaveLength(1);
      expect(deployHistory).toHaveLength(1);
    });

    it('should filter by days', () => {
      storage.storePRMetrics('org/repo', { prCount: 5 }, 30);

      // Should return the entry
      const history = storage.getMetricsHistory('org/repo', undefined, 30);
      expect(history).toHaveLength(1);
    });

    it('should return empty for non-existent repository', () => {
      const history = storage.getMetricsHistory('org/nonexistent');
      expect(history).toHaveLength(0);
    });
  });

  describe('time series management', () => {
    it('should add time series values', () => {
      const now = new Date();
      storage.addTimeSeriesValue('org/repo', 'avgCycleTime', 1440, now);

      const series = storage.getTimeSeries('org/repo', 'avgCycleTime');
      expect(series).toBeDefined();
      expect(series?.values).toHaveLength(1);
      expect(series?.values[0].value).toBe(1440);
    });

    it('should accumulate time series values', () => {
      storage.addTimeSeriesValue('org/repo', 'avgCycleTime', 1440);
      storage.addTimeSeriesValue('org/repo', 'avgCycleTime', 1500);
      storage.addTimeSeriesValue('org/repo', 'avgCycleTime', 1400);

      const series = storage.getTimeSeries('org/repo', 'avgCycleTime');
      expect(series?.values).toHaveLength(3);
    });

    it('should get all time series for a repository', () => {
      storage.addTimeSeriesValue('org/repo', 'avgCycleTime', 1440);
      storage.addTimeSeriesValue('org/repo', 'deploysPerDay', 2);
      storage.addTimeSeriesValue('org/repo', 'successRate', 0.95);

      const allSeries = storage.getRepositoryTimeSeries('org/repo');
      expect(allSeries).toHaveLength(3);
    });
  });

  describe('trend calculation', () => {
    it('should detect improving trend', () => {
      // Add decreasing values (improving)
      for (let i = 100; i > 0; i -= 10) {
        storage.addTimeSeriesValue('org/repo', 'cycleTime', i);
      }

      const trend = storage.calculateTrend('org/repo', 'cycleTime');
      expect(trend).toBe('improving');
    });

    it('should detect degrading trend', () => {
      // Add increasing values (degrading)
      for (let i = 0; i < 100; i += 10) {
        storage.addTimeSeriesValue('org/repo', 'cycleTime', i);
      }

      const trend = storage.calculateTrend('org/repo', 'cycleTime');
      expect(trend).toBe('degrading');
    });

    it('should detect stable trend', () => {
      // Add stable values
      for (let i = 0; i < 10; i++) {
        storage.addTimeSeriesValue('org/repo', 'cycleTime', 1440);
      }

      const trend = storage.calculateTrend('org/repo', 'cycleTime');
      expect(trend).toBe('stable');
    });
  });

  describe('metric statistics', () => {
    it('should calculate metric statistics', () => {
      storage.addTimeSeriesValue('org/repo', 'cycleTime', 1000);
      storage.addTimeSeriesValue('org/repo', 'cycleTime', 1500);
      storage.addTimeSeriesValue('org/repo', 'cycleTime', 1200);

      const stats = storage.getMetricStats('org/repo', 'cycleTime');

      expect(stats.count).toBe(3);
      expect(stats.min).toBe(1000);
      expect(stats.max).toBe(1500);
      expect(stats.avg).toBeGreaterThan(0);
      expect(stats.median).toBe(1200);
    });

    it('should return zeros for non-existent metric', () => {
      const stats = storage.getMetricStats('org/repo', 'nonexistent');

      expect(stats.count).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.avg).toBe(0);
    });
  });

  describe('storage management', () => {
    it('should provide storage statistics', () => {
      storage.storePRMetrics('org/repo1', { prCount: 5 }, 30);
      storage.storePRMetrics('org/repo2', { prCount: 10 }, 30);
      storage.addTimeSeriesValue('org/repo1', 'metric1', 100);
      storage.addTimeSeriesValue('org/repo2', 'metric2', 200);

      const stats = storage.getStats();

      expect(stats.historyEntries).toBe(2);
      expect(stats.timeSeriesCount).toBe(2);
      expect(stats.maxHistorySize).toBeGreaterThan(0);
    });

    it('should clear all data', () => {
      storage.storePRMetrics('org/repo', { prCount: 5 }, 30);
      storage.addTimeSeriesValue('org/repo', 'metric', 100);

      let stats = storage.getStats();
      expect(stats.historyEntries).toBe(1);
      expect(stats.timeSeriesCount).toBe(1);

      storage.clear();

      stats = storage.getStats();
      expect(stats.historyEntries).toBe(0);
      expect(stats.timeSeriesCount).toBe(0);
    });
  });
});

