/**
 * Metrics Aggregator Service
 * Aggregates PR and deployment metrics by team and calculates trends
 */

import { prMetricsCollector } from './pull-request-metrics-collector.js';
import { deploymentMetricsCollector } from './deployment-metrics-collector.js';

export interface TeamMetrics {
  team: string;
  repos: string[];

  // PR metrics
  avgCycleTime: number; // minutes
  medianCycleTime: number;
  avgTimeToFirstReview?: number;
  avgTimeToApproval?: number;
  avgPRSize: number; // files changed
  prCount: number;
  mergedPRCount: number;

  // Deployment metrics
  deploysPerDay: number;
  deploymentSuccessRate: number; // 0-1
  avgDeploymentDuration: number; // minutes
  deploymentCount: number;

  // Trends
  cycleTimeTrend: 'improving' | 'stable' | 'degrading';
  deploymentFrequencyTrend: 'increasing' | 'stable' | 'decreasing';

  // Time periods
  period: '7d' | '30d';
  timestamp: Date;
}

export interface RollingAverage {
  period: number; // days
  values: number[];
  average: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export class MetricsAggregator {
  private teamRepoMapping: { [team: string]: string[] } = {
    'Host Team': ['renderx-plugins-demo'],
    'SDK Team': ['renderx-plugins-sdk', 'renderx-manifest-tools'],
    'Conductor Team': ['musical-conductor'],
    'Plugin Teams': [
      'renderx-plugins-canvas',
      'renderx-plugins-components',
      'renderx-plugins-control-panel',
      'renderx-plugins-header',
      'renderx-plugins-library'
    ]
  };

  /**
   * Aggregate metrics for a team
   */
  async aggregateTeamMetrics(
    org: string,
    team: string,
    period: '7d' | '30d' = '30d'
  ): Promise<TeamMetrics> {
    const repos = this.teamRepoMapping[team] || [];
    const days = period === '7d' ? 7 : 30;

    console.log(`📊 Aggregating metrics for team: ${team} (${repos.length} repos)`);

    let totalCycleTimes: number[] = [];
    let totalPRCount = 0;
    let totalMergedPRCount = 0;
    let totalPRSize = 0;
    let totalDeployments = 0;
    let totalSuccessfulDeployments = 0;
    let totalDeploymentDurations: number[] = [];

    // Collect metrics from all team repositories
    for (const repo of repos) {
      try {
        // PR metrics
        const prMetrics = await prMetricsCollector.collectPRMetrics(org, repo, days);
        const prAgg = await prMetricsCollector.calculateAggregateMetrics(org, repo, days);

        totalPRCount += prAgg.prCount;
        totalMergedPRCount += prAgg.mergedCount;
        totalPRSize += prAgg.avgPRSize * prAgg.prCount;
        totalCycleTimes.push(...prMetrics.map(m => m.totalCycleTime));

        // Deployment metrics
        await deploymentMetricsCollector.collectDeploymentMetrics(org, repo, days);
        const deployAgg = await deploymentMetricsCollector.calculateAggregateMetrics(org, repo, days);

        totalDeployments += deployAgg.deploymentCount;
        totalSuccessfulDeployments += deployAgg.successCount;
        if (deployAgg.avgDuration > 0) {
          totalDeploymentDurations.push(deployAgg.avgDuration);
        }
      } catch (error) {
        console.warn(`⚠️ Error aggregating metrics for ${repo}:`, error);
      }
    }

    // Calculate aggregated values
    const avgCycleTime = totalCycleTimes.length > 0
      ? Math.round(totalCycleTimes.reduce((a, b) => a + b, 0) / totalCycleTimes.length)
      : 0;

    const medianCycleTime = totalCycleTimes.length > 0
      ? totalCycleTimes.sort((a, b) => a - b)[Math.floor(totalCycleTimes.length / 2)]
      : 0;

    const avgPRSize = totalPRCount > 0 ? Math.round(totalPRSize / totalPRCount) : 0;

    const deploysPerDay = totalDeployments / days;

    const deploymentSuccessRate = totalDeployments > 0
      ? totalSuccessfulDeployments / totalDeployments
      : 0;

    const avgDeploymentDuration = totalDeploymentDurations.length > 0
      ? Math.round(totalDeploymentDurations.reduce((a, b) => a + b, 0) / totalDeploymentDurations.length)
      : 0;

    // Calculate trends (simplified: compare first half vs second half)
    const cycleTimeTrend = this.calculateTrend(totalCycleTimes);
    const deploymentFrequencyTrend = totalDeployments > 0 ? 'stable' : 'stable';

    return {
      team,
      repos,
      avgCycleTime,
      medianCycleTime,
      avgPRSize,
      prCount: totalPRCount,
      mergedPRCount: totalMergedPRCount,
      deploysPerDay: Math.round(deploysPerDay * 100) / 100,
      deploymentSuccessRate,
      avgDeploymentDuration,
      deploymentCount: totalDeployments,
      cycleTimeTrend,
      deploymentFrequencyTrend,
      period,
      timestamp: new Date()
    };
  }

  /**
   * Calculate rolling average for a metric
   */
  calculateRollingAverage(values: number[], windowSize: number = 7): RollingAverage {
    if (values.length === 0) {
      return {
        period: windowSize,
        values: [],
        average: 0,
        trend: 'stable'
      };
    }

    const rollingAverages: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = values.slice(start, i + 1);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      rollingAverages.push(avg);
    }

    const average = rollingAverages[rollingAverages.length - 1] || 0;
    const trend = this.calculateTrend(rollingAverages);

    return {
      period: windowSize,
      values: rollingAverages,
      average,
      trend
    };
  }

  /**
   * Calculate trend from values
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 2) return 'stable';

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
   * Get all teams
   */
  getTeams(): string[] {
    return Object.keys(this.teamRepoMapping);
  }

  /**
   * Get repositories for a team
   */
  getTeamRepositories(team: string): string[] {
    return this.teamRepoMapping[team] || [];
  }
}

// Export singleton instance
export const metricsAggregator = new MetricsAggregator();

