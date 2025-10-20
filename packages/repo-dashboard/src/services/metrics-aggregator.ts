/**
 * Metrics Aggregator Service
 * Aggregates PR and deployment metrics by team and calculates trends
 * Uses ADFTeamMapper to get team-to-repository mappings from ADF
 */

import { prMetricsCollector } from './pull-request-metrics-collector.js';
import { deploymentMetricsCollector } from './deployment-metrics-collector.js';
import { ADFTeamMapper } from './adf-team-mapper.js';
import { adfFetcher } from './adf-fetcher.js';

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
  private adfTeamMapper: ADFTeamMapper;
  private initialized = false;

  constructor() {
    this.adfTeamMapper = new ADFTeamMapper();
  }

  /**
   * Initialize the aggregator with ADF data
   * Can optionally provide ADF data directly (useful for testing)
   */
  async initialize(adfData?: ArchitectureDefinition): Promise<void> {
    if (this.initialized) return;

    try {
      let adf: ArchitectureDefinition;

      if (adfData) {
        // Use provided ADF data (for testing)
        adf = adfData;
        console.log('✅ MetricsAggregator initialized with provided ADF data');
      } else {
        // Fetch the default ADF from renderx-plugins-demo repository
        adf = await adfFetcher.fetchADF({
          org: 'BPMSoftwareSolutions',
          repo: 'renderx-plugins-demo',
          branch: 'main',
          path: 'docs/renderx-plugins-demo-adf.json'
        });
        console.log('✅ MetricsAggregator initialized with fetched ADF data');
      }

      await this.adfTeamMapper.initializeFromADF(adf);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize MetricsAggregator:', error);
      throw error;
    }
  }

  /**
   * Get all teams from ADF
   */
  getTeams(): string[] {
    if (!this.initialized) {
      console.warn('⚠️ MetricsAggregator not initialized, returning empty teams');
      return [];
    }
    return this.adfTeamMapper.getTeams();
  }

  /**
   * Get repositories for a team
   */
  getTeamRepositories(team: string): string[] {
    if (!this.initialized) {
      console.warn('⚠️ MetricsAggregator not initialized, returning empty repos');
      return [];
    }
    return this.adfTeamMapper.getTeamRepositories(team);
  }

  /**
   * Aggregate metrics for a team
   */
  async aggregateTeamMetrics(
    org: string,
    team: string,
    period: '7d' | '30d' = '30d'
  ): Promise<TeamMetrics> {
    if (!this.initialized) {
      await this.initialize();
    }

    const repos = this.getTeamRepositories(team);
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
        // Extract repo name from full path (e.g., "BPMSoftwareSolutions/renderx-plugins-demo" -> "renderx-plugins-demo")
        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;

        // PR metrics
        const prMetrics = await prMetricsCollector.collectPRMetrics(org, repoName, days);
        const prAgg = await prMetricsCollector.calculateAggregateMetrics(org, repoName, days);

        totalPRCount += prAgg.prCount;
        totalMergedPRCount += prAgg.mergedCount;
        totalPRSize += prAgg.avgPRSize * prAgg.prCount;
        totalCycleTimes.push(...prMetrics.map(m => m.totalCycleTime));

        // Deployment metrics
        await deploymentMetricsCollector.collectDeploymentMetrics(org, repoName, days);
        const deployAgg = await deploymentMetricsCollector.calculateAggregateMetrics(org, repoName, days);

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
    if (!this.initialized) {
      console.warn('⚠️ MetricsAggregator not initialized, returning empty teams');
      return [];
    }
    return this.adfTeamMapper.getTeams();
  }

  /**
   * Get repositories for a team
   */
  getTeamRepositories(team: string): string[] {
    if (!this.initialized) {
      console.warn('⚠️ MetricsAggregator not initialized, returning empty repos');
      return [];
    }
    return this.adfTeamMapper.getTeamRepositories(team);
  }
}

// Export singleton instance
export const metricsAggregator = new MetricsAggregator();

