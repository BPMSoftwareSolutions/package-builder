import { describe, it, expect, beforeEach } from 'vitest';
import { ConductorLogsCollector, ConductorLogEntry, LogFilters } from './conductor-logs-collector';

describe('ConductorLogsCollector', () => {
  let collector: ConductorLogsCollector;

  beforeEach(() => {
    collector = new ConductorLogsCollector();
  });

  describe('addLogEntry', () => {
    it('should add a log entry', () => {
      const entry: ConductorLogEntry = {
        timestamp: new Date(),
        level: 'info',
        message: 'Test message',
      };

      collector.addLogEntry(entry);
      expect(collector.getLogs()).toHaveLength(1);
      expect(collector.getLogs()[0]).toEqual(entry);
    });

    it('should add multiple log entries', () => {
      const entries: ConductorLogEntry[] = [
        { timestamp: new Date(), level: 'info', message: 'Message 1' },
        { timestamp: new Date(), level: 'error', message: 'Message 2' },
        { timestamp: new Date(), level: 'warn', message: 'Message 3' },
      ];

      entries.forEach((entry) => collector.addLogEntry(entry));
      expect(collector.getLogs()).toHaveLength(3);
    });
  });

  describe('filterLogs', () => {
    let entries: ConductorLogEntry[];

    beforeEach(() => {
      entries = [
        {
          timestamp: new Date('2025-01-01'),
          level: 'info',
          message: 'Info message',
          pluginName: 'plugin-a',
          symphonyId: 'symphony-1',
        },
        {
          timestamp: new Date('2025-01-02'),
          level: 'error',
          message: 'Error message',
          pluginName: 'plugin-b',
          symphonyId: 'symphony-2',
        },
        {
          timestamp: new Date('2025-01-03'),
          level: 'warn',
          message: 'Warning message',
          pluginName: 'plugin-a',
          symphonyId: 'symphony-1',
        },
      ];
    });

    it('should filter by level', () => {
      const filters: LogFilters = { level: 'error' };
      const result = collector.filterLogs(entries, filters);
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('error');
    });

    it('should filter by plugin name', () => {
      const filters: LogFilters = { pluginName: 'plugin-a' };
      const result = collector.filterLogs(entries, filters);
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.pluginName === 'plugin-a')).toBe(true);
    });

    it('should filter by symphony ID', () => {
      const filters: LogFilters = { symphonyId: 'symphony-1' };
      const result = collector.filterLogs(entries, filters);
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.symphonyId === 'symphony-1')).toBe(true);
    });

    it('should filter by time range', () => {
      const filters: LogFilters = {
        startTime: new Date('2025-01-02'),
        endTime: new Date('2025-01-02'),
      };
      const result = collector.filterLogs(entries, filters);
      expect(result).toHaveLength(1);
    });

    it('should filter by search text', () => {
      const filters: LogFilters = { searchText: 'Error' };
      const result = collector.filterLogs(entries, filters);
      expect(result).toHaveLength(1);
      expect(result[0].message).toContain('Error');
    });

    it('should apply multiple filters', () => {
      const filters: LogFilters = { level: 'info', pluginName: 'plugin-a' };
      const result = collector.filterLogs(entries, filters);
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('info');
      expect(result[0].pluginName).toBe('plugin-a');
    });
  });

  describe('extractMetrics', () => {
    it('should extract metrics from log entries', () => {
      const entries: ConductorLogEntry[] = [
        { timestamp: new Date(), level: 'info', message: 'Message 1', duration: 100 },
        { timestamp: new Date(), level: 'error', message: 'Message 2', duration: 200 },
        { timestamp: new Date(), level: 'warn', message: 'Message 3', duration: 150 },
      ];

      const metrics = collector.extractMetrics(entries);

      expect(metrics.totalEntries).toBe(3);
      expect(metrics.errorCount).toBe(1);
      expect(metrics.warningCount).toBe(1);
      expect(metrics.avgDuration).toBe(150);
      expect(metrics.maxDuration).toBe(200);
      expect(metrics.minDuration).toBe(100);
    });

    it('should handle entries without duration', () => {
      const entries: ConductorLogEntry[] = [
        { timestamp: new Date(), level: 'info', message: 'Message 1' },
        { timestamp: new Date(), level: 'error', message: 'Message 2' },
      ];

      const metrics = collector.extractMetrics(entries);

      expect(metrics.totalEntries).toBe(2);
      expect(metrics.errorCount).toBe(1);
      expect(metrics.avgDuration).toBe(0);
    });

    it('should handle empty entries', () => {
      const metrics = collector.extractMetrics([]);

      expect(metrics.totalEntries).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.warningCount).toBe(0);
      expect(metrics.avgDuration).toBe(0);
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      const entry: ConductorLogEntry = {
        timestamp: new Date(),
        level: 'info',
        message: 'Test message',
      };

      collector.addLogEntry(entry);
      expect(collector.getLogs()).toHaveLength(1);

      collector.clearLogs();
      expect(collector.getLogs()).toHaveLength(0);
    });
  });
});

