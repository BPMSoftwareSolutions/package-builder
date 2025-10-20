import { describe, it, expect, beforeEach } from 'vitest';
import { ConductorMetricsExtractor } from './conductor-metrics-from-logs';
import { ConductorLogEntry } from './conductor-logs-collector';

describe('ConductorMetricsExtractor', () => {
  let extractor: ConductorMetricsExtractor;

  beforeEach(() => {
    extractor = new ConductorMetricsExtractor();
  });

  describe('extractMetrics', () => {
    it('should extract metrics from log entries', () => {
      const entries: ConductorLogEntry[] = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Sequence started',
          symphonyId: 'symphony-1',
          duration: 100,
        },
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Sequence completed',
          symphonyId: 'symphony-1',
          duration: 150,
        },
        {
          timestamp: new Date(),
          level: 'error',
          message: 'Sequence failed',
          symphonyId: 'symphony-2',
          duration: 50,
        },
      ];

      const metrics = extractor.extractMetrics(entries);

      expect(metrics.activeSequences).toBe(3);
      expect(metrics.completedSequences).toBe(2);
      expect(metrics.failedSequences).toBe(1);
      expect(metrics.avgSequenceDuration).toBe(100);
      expect(metrics.errorRate).toBeCloseTo(1 / 3, 2);
    });

    it('should handle empty log entries', () => {
      const metrics = extractor.extractMetrics([]);

      expect(metrics.activeSequences).toBe(0);
      expect(metrics.completedSequences).toBe(0);
      expect(metrics.failedSequences).toBe(0);
      expect(metrics.avgSequenceDuration).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });

    it('should calculate plugin metrics', () => {
      const entries: ConductorLogEntry[] = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Plugin executed',
          pluginName: 'plugin-a',
          duration: 100,
        },
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Plugin executed',
          pluginName: 'plugin-a',
          duration: 200,
        },
        {
          timestamp: new Date(),
          level: 'error',
          message: 'Plugin failed',
          pluginName: 'plugin-b',
          duration: 50,
        },
      ];

      const metrics = extractor.extractMetrics(entries);

      expect(metrics.pluginExecutionTimes['plugin-a']).toBe(150);
      expect(metrics.pluginExecutionTimes['plugin-b']).toBe(50);
      expect(metrics.pluginErrorRates['plugin-a']).toBe(0);
      expect(metrics.pluginErrorRates['plugin-b']).toBe(1);
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate p95 percentile', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const p95 = extractor.calculatePercentile(values, 0.95);

      expect(p95).toBeGreaterThanOrEqual(94);
      expect(p95).toBeLessThanOrEqual(100);
    });

    it('should calculate p99 percentile', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const p99 = extractor.calculatePercentile(values, 0.99);

      expect(p99).toBeGreaterThanOrEqual(98);
      expect(p99).toBeLessThanOrEqual(100);
    });

    it('should handle empty values', () => {
      const p95 = extractor.calculatePercentile([], 0.95);
      expect(p95).toBe(0);
    });

    it('should handle single value', () => {
      const p95 = extractor.calculatePercentile([42], 0.95);
      expect(p95).toBe(42);
    });
  });

  describe('analyzeErrors', () => {
    it('should analyze error types', () => {
      const entries: ConductorLogEntry[] = [
        {
          timestamp: new Date(),
          level: 'error',
          message: 'Error 1',
          error: { message: 'Error', code: 'TIMEOUT' },
        },
        {
          timestamp: new Date(),
          level: 'error',
          message: 'Error 2',
          error: { message: 'Error', code: 'TIMEOUT' },
        },
        {
          timestamp: new Date(),
          level: 'error',
          message: 'Error 3',
          error: { message: 'Error', code: 'FAILED' },
        },
      ];

      const errorTypes = extractor.analyzeErrors(entries);

      expect(errorTypes['TIMEOUT']).toBe(2);
      expect(errorTypes['FAILED']).toBe(1);
    });

    it('should handle errors without code', () => {
      const entries: ConductorLogEntry[] = [
        {
          timestamp: new Date(),
          level: 'error',
          message: 'Error without code',
          error: { message: 'Error' },
        },
      ];

      const errorTypes = extractor.analyzeErrors(entries);

      expect(errorTypes['unknown']).toBe(1);
    });

    it('should return empty object for no errors', () => {
      const entries: ConductorLogEntry[] = [
        { timestamp: new Date(), level: 'info', message: 'Info message' },
      ];

      const errorTypes = extractor.analyzeErrors(entries);

      expect(Object.keys(errorTypes)).toHaveLength(0);
    });
  });

  describe('aggregatePluginMetrics', () => {
    it('should aggregate plugin execution times', () => {
      const entries: ConductorLogEntry[] = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Plugin executed',
          pluginName: 'plugin-a',
          duration: 100,
        },
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Plugin executed',
          pluginName: 'plugin-a',
          duration: 200,
        },
      ];

      const metrics = extractor.aggregatePluginMetrics(entries);

      expect(metrics.executionTimes['plugin-a']).toBe(150);
    });

    it('should calculate plugin error rates', () => {
      const entries: ConductorLogEntry[] = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Plugin executed',
          pluginName: 'plugin-a',
        },
        {
          timestamp: new Date(),
          level: 'error',
          message: 'Plugin failed',
          pluginName: 'plugin-a',
        },
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Plugin executed',
          pluginName: 'plugin-a',
        },
      ];

      const metrics = extractor.aggregatePluginMetrics(entries);

      expect(metrics.errorRates['plugin-a']).toBeCloseTo(1 / 3, 2);
    });

    it('should handle entries without plugin name', () => {
      const entries: ConductorLogEntry[] = [
        { timestamp: new Date(), level: 'info', message: 'No plugin' },
      ];

      const metrics = extractor.aggregatePluginMetrics(entries);

      expect(Object.keys(metrics.executionTimes)).toHaveLength(0);
    });
  });
});

