/**
 * Conductor Metrics Extractor from Logs
 * Extracts metrics from conductor logs for analysis and visualization
 */

import { ConductorLogEntry } from './conductor-logs-collector';

export interface ConductorMetricsFromLogs {
  timestamp: Date;

  // Orchestration metrics from logs
  activeSequences: number;
  completedSequences: number;
  failedSequences: number;

  // Performance from logs
  avgSequenceDuration: number; // ms
  p95SequenceDuration: number;
  p99SequenceDuration: number;

  // Queue metrics
  queueLength: number;
  avgWaitTime: number; // ms

  // Error tracking from logs
  errorRate: number; // 0-1
  errorTypes: Record<string, number>;

  // Plugin metrics from logs
  pluginExecutionTimes: Record<string, number>; // plugin -> avg time
  pluginErrorRates: Record<string, number>; // plugin -> error rate
}

export class ConductorMetricsExtractor {
  /**
   * Extract metrics from conductor logs
   */
  extractMetrics(logEntries: ConductorLogEntry[]): ConductorMetricsFromLogs {
    const durations = logEntries.filter((e) => e.duration !== undefined).map((e) => e.duration!);
    const errorEntries = logEntries.filter((e) => e.level === 'error');
    const pluginMetrics = this.aggregatePluginMetrics(logEntries);
    const errorTypes = this.analyzeErrors(logEntries);

    return {
      timestamp: new Date(),
      activeSequences: logEntries.filter((e) => e.symphonyId).length,
      completedSequences: logEntries.filter((e) => e.level === 'info' && e.symphonyId).length,
      failedSequences: errorEntries.filter((e) => e.symphonyId).length,
      avgSequenceDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      p95SequenceDuration: this.calculatePercentile(durations, 0.95),
      p99SequenceDuration: this.calculatePercentile(durations, 0.99),
      queueLength: logEntries.length,
      avgWaitTime: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      errorRate: logEntries.length > 0 ? errorEntries.length / logEntries.length : 0,
      errorTypes,
      pluginExecutionTimes: pluginMetrics.executionTimes,
      pluginErrorRates: pluginMetrics.errorRates,
    };
  }

  /**
   * Calculate performance percentiles
   */
  calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;

    return sorted[Math.max(0, index)];
  }

  /**
   * Analyze error patterns
   */
  analyzeErrors(logEntries: ConductorLogEntry[]): Record<string, number> {
    const errorTypes: Record<string, number> = {};

    logEntries
      .filter((e) => e.level === 'error')
      .forEach((entry) => {
        const errorType = entry.error?.code || 'unknown';
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      });

    return errorTypes;
  }

  /**
   * Aggregate plugin metrics from logs
   */
  aggregatePluginMetrics(
    logEntries: ConductorLogEntry[]
  ): { executionTimes: Record<string, number>; errorRates: Record<string, number> } {
    const pluginData: Record<string, { durations: number[]; errors: number; total: number }> = {};

    logEntries.forEach((entry) => {
      if (!entry.pluginName) return;

      if (!pluginData[entry.pluginName]) {
        pluginData[entry.pluginName] = { durations: [], errors: 0, total: 0 };
      }

      pluginData[entry.pluginName].total++;

      if (entry.duration) {
        pluginData[entry.pluginName].durations.push(entry.duration);
      }

      if (entry.level === 'error') {
        pluginData[entry.pluginName].errors++;
      }
    });

    const executionTimes: Record<string, number> = {};
    const errorRates: Record<string, number> = {};

    Object.entries(pluginData).forEach(([pluginName, data]) => {
      if (data.durations.length > 0) {
        executionTimes[pluginName] = data.durations.reduce((a, b) => a + b, 0) / data.durations.length;
      }
      errorRates[pluginName] = data.total > 0 ? data.errors / data.total : 0;
    });

    return { executionTimes, errorRates };
  }
}

