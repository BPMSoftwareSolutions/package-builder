/**
 * WIP (Work In Progress) Tracker Service
 * Tracks open PRs and calculates WIP metrics per team
 */

import { PullRequestMetricsCollector, PRMetrics } from './pull-request-metrics-collector.js';

export interface WIPMetrics {
  timestamp: Date;
  team: string;
  org: string;

  // Current state
  openPRCount: number;
  avgFilesChanged: number;
  avgDiffLines: number;

  // Trend
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercentage: number;

  // History for trend calculation
  history: WIPDataPoint[];
}

export interface WIPDataPoint {
  timestamp: Date;
  openPRCount: number;
  avgFilesChanged: number;
  avgDiffLines: number;
}

export interface WIPAlert {
  team: string;
  org: string;
  threshold: number;
  currentWIP: number;
  isExceeded: boolean;
  severity: 'warning' | 'critical';
}

export class WIPTrackerService {
  private prCollector: PullRequestMetricsCollector;
  private wipHistory: Map<string, WIPDataPoint[]> = new Map();
  private readonly maxHistoryPoints = 100;

  constructor(prCollector: PullRequestMetricsCollector) {
    this.prCollector = prCollector;
  }

  /**
   * Calculate WIP metrics for a team
   */
  async calculateWIPMetrics(
    org: string,
    team: string,
    repos: string[],
    days: number = 30
  ): Promise<WIPMetrics> {
    const timestamp = new Date();
    const historyKey = `${org}/${team}`;

    try {
      // Collect PR metrics for all team repositories
      const allMetrics: PRMetrics[] = [];
      for (const repo of repos) {
        const metrics = await this.prCollector.collectPRMetrics(org, repo, days);
        allMetrics.push(...metrics);
      }

      // Filter for open PRs only
      const openPRs = allMetrics.filter(m => m.status === 'open');

      // Calculate averages
      const avgFilesChanged = openPRs.length > 0
        ? openPRs.reduce((sum, m) => sum + m.filesChanged, 0) / openPRs.length
        : 0;

      const avgDiffLines = openPRs.length > 0
        ? openPRs.reduce((sum, m) => sum + (m.additions + m.deletions), 0) / openPRs.length
        : 0;

      // Calculate trend
      const dataPoint: WIPDataPoint = {
        timestamp,
        openPRCount: openPRs.length,
        avgFilesChanged,
        avgDiffLines
      };

      // Update history
      if (!this.wipHistory.has(historyKey)) {
        this.wipHistory.set(historyKey, []);
      }
      const history = this.wipHistory.get(historyKey)!;
      history.push(dataPoint);

      // Keep only recent history
      if (history.length > this.maxHistoryPoints) {
        history.shift();
      }

      // Calculate trend
      const { trend, trendPercentage } = this.calculateTrend(history);

      const metrics: WIPMetrics = {
        timestamp,
        team,
        org,
        openPRCount: openPRs.length,
        avgFilesChanged: Math.round(avgFilesChanged * 100) / 100,
        avgDiffLines: Math.round(avgDiffLines * 100) / 100,
        trend,
        trendPercentage,
        history
      };

      return metrics;
    } catch (error) {
      console.error(`❌ Error calculating WIP metrics for ${historyKey}:`, error);
      throw error;
    }
  }

  /**
   * Check if WIP exceeds threshold
   */
  async checkWIPAlert(
    org: string,
    team: string,
    repos: string[],
    threshold: number = 10
  ): Promise<WIPAlert> {
    const metrics = await this.calculateWIPMetrics(org, team, repos);

    const isExceeded = metrics.openPRCount > threshold;
    const severity = metrics.openPRCount > threshold * 1.5 ? 'critical' : 'warning';

    return {
      team,
      org,
      threshold,
      currentWIP: metrics.openPRCount,
      isExceeded,
      severity
    };
  }

  /**
   * Calculate trend from history
   */
  private calculateTrend(history: WIPDataPoint[]): { trend: 'increasing' | 'stable' | 'decreasing'; trendPercentage: number } {
    if (history.length < 2) {
      return { trend: 'stable', trendPercentage: 0 };
    }

    const recent = history.slice(-7); // Last 7 data points
    const older = history.slice(-14, -7); // Previous 7 data points

    const recentAvg = recent.reduce((sum, p) => sum + p.openPRCount, 0) / recent.length;
    const olderAvg = older.length > 0
      ? older.reduce((sum, p) => sum + p.openPRCount, 0) / older.length
      : recentAvg;

    const percentageChange = olderAvg > 0
      ? ((recentAvg - olderAvg) / olderAvg) * 100
      : 0;

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (percentageChange > 5) {
      trend = 'increasing';
    } else if (percentageChange < -5) {
      trend = 'decreasing';
    }

    return {
      trend,
      trendPercentage: Math.round(percentageChange * 100) / 100
    };
  }

  /**
   * Clear history for a team
   */
  clearHistory(org: string, team: string): void {
    const historyKey = `${org}/${team}`;
    this.wipHistory.delete(historyKey);
  }

  /**
   * Get history for a team
   */
  getHistory(org: string, team: string): WIPDataPoint[] {
    const historyKey = `${org}/${team}`;
    return this.wipHistory.get(historyKey) || [];
  }
}

