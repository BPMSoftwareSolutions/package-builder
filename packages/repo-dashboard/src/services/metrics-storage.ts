/**
 * Metrics Storage Service
 * Handles persistent storage of metrics data
 */



export interface StoredMetrics {
  id: string;
  type: 'pr' | 'deployment';
  repo: string;
  team?: string;
  data: any;
  timestamp: Date;
  period: number; // days
}

export interface MetricsTimeSeries {
  repo: string;
  metric: string;
  values: Array<{
    timestamp: Date;
    value: number;
  }>;
}

export class MetricsStorage {
  private metricsHistory: StoredMetrics[] = [];
  private timeSeries: Map<string, MetricsTimeSeries> = new Map();
  private readonly maxHistorySize = 10000; // Maximum in-memory entries

  /**
   * Store PR metrics
   */
  storePRMetrics(repo: string, metrics: any, period: number = 30, team?: string): void {
    const entry: StoredMetrics = {
      id: `pr-${repo}-${Date.now()}`,
      type: 'pr',
      repo,
      team,
      data: metrics,
      timestamp: new Date(),
      period
    };

    this.metricsHistory.push(entry);
    this.pruneHistory();

    console.log(`💾 Stored PR metrics for ${repo}`);
  }

  /**
   * Store deployment metrics
   */
  storeDeploymentMetrics(repo: string, metrics: any, period: number = 30, team?: string): void {
    const entry: StoredMetrics = {
      id: `deploy-${repo}-${Date.now()}`,
      type: 'deployment',
      repo,
      team,
      data: metrics,
      timestamp: new Date(),
      period
    };

    this.metricsHistory.push(entry);
    this.pruneHistory();

    console.log(`💾 Stored deployment metrics for ${repo}`);
  }

  /**
   * Get metrics history for a repository
   */
  getMetricsHistory(repo: string, type?: 'pr' | 'deployment', days: number = 30): StoredMetrics[] {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    return this.metricsHistory.filter(entry => {
      const isRepoMatch = entry.repo === repo;
      const isTypeMatch = !type || entry.type === type;
      const isTimeMatch = entry.timestamp.getTime() >= cutoffTime;

      return isRepoMatch && isTypeMatch && isTimeMatch;
    });
  }

  /**
   * Add value to time series
   */
  addTimeSeriesValue(repo: string, metric: string, value: number, timestamp: Date = new Date()): void {
    const key = `${repo}:${metric}`;

    if (!this.timeSeries.has(key)) {
      this.timeSeries.set(key, {
        repo,
        metric,
        values: []
      });
    }

    const series = this.timeSeries.get(key)!;
    series.values.push({ timestamp, value });

    // Keep only last 90 days of data
    const cutoffTime = Date.now() - 90 * 24 * 60 * 60 * 1000;
    series.values = series.values.filter(v => v.timestamp.getTime() >= cutoffTime);
  }

  /**
   * Get time series data
   */
  getTimeSeries(repo: string, metric: string): MetricsTimeSeries | undefined {
    const key = `${repo}:${metric}`;
    return this.timeSeries.get(key);
  }

  /**
   * Get all time series for a repository
   */
  getRepositoryTimeSeries(repo: string): MetricsTimeSeries[] {
    const result: MetricsTimeSeries[] = [];

    for (const [, series] of this.timeSeries.entries()) {
      if (series.repo === repo) {
        result.push(series);
      }
    }

    return result;
  }

  /**
   * Calculate trend from time series
   */
  calculateTrend(repo: string, metric: string): 'improving' | 'stable' | 'degrading' {
    const series = this.getTimeSeries(repo, metric);
    if (!series || series.values.length < 2) {
      return 'stable';
    }

    const values = series.values.map(v => v.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (percentChange < -5) return 'improving';
    if (percentChange > 5) return 'degrading';
    return 'stable';
  }

  /**
   * Get statistics for a metric
   */
  getMetricStats(repo: string, metric: string): any {
    const series = this.getTimeSeries(repo, metric);
    if (!series || series.values.length === 0) {
      return {
        repo,
        metric,
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        trend: 'stable'
      };
    }

    const values = series.values.map(v => v.value);
    const sorted = [...values].sort((a, b) => a - b);

    return {
      repo,
      metric,
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      median: sorted[Math.floor(sorted.length / 2)],
      trend: this.calculateTrend(repo, metric),
      lastValue: values[values.length - 1],
      lastTimestamp: series.values[series.values.length - 1].timestamp
    };
  }

  /**
   * Prune history to maintain size limits
   */
  private pruneHistory(): void {
    if (this.metricsHistory.length > this.maxHistorySize) {
      // Keep only the most recent entries
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
      console.log(`🗑️ Pruned metrics history to ${this.maxHistorySize} entries`);
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.metricsHistory = [];
    this.timeSeries.clear();
    console.log(`🗑️ Cleared all metrics storage`);
  }

  /**
   * Get storage statistics
   */
  getStats(): any {
    return {
      historyEntries: this.metricsHistory.length,
      timeSeriesCount: this.timeSeries.size,
      maxHistorySize: this.maxHistorySize,
      memoryUsage: {
        history: this.metricsHistory.length,
        timeSeries: this.timeSeries.size
      }
    };
  }
}

// Export singleton instance
export const metricsStorage = new MetricsStorage();

