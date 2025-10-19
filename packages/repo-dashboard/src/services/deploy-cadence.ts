/**
 * Deploy Cadence Service
 * Tracks deployment frequency and success rates per environment
 */

import { DeploymentMetricsCollector, DeploymentMetrics } from './deployment-metrics-collector.js';

export interface DeployCadenceMetrics {
  timestamp: Date;
  team: string;
  org: string;
  repo: string;

  // Per environment
  environments: EnvironmentCadence[];

  // Overall metrics
  totalDeploysPerDay: number;
  overallSuccessRate: number;
  totalRollbacks: number;

  // Trend
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercentage: number;

  // History
  history: DeployCadenceDataPoint[];
}

export interface EnvironmentCadence {
  environment: string;
  deploysPerDay: number;
  successRate: number;
  failureCount: number;
  rollbackCount: number;
  lastDeployment?: Date;
  averageDeploymentTime: number; // minutes
}

export interface DeployCadenceDataPoint {
  timestamp: Date;
  deploysPerDay: number;
  successRate: number;
  rollbackCount: number;
}

export class DeployCadenceService {
  private deploymentCollector: DeploymentMetricsCollector;
  private cadenceHistory: Map<string, DeployCadenceDataPoint[]> = new Map();
  private readonly maxHistoryPoints = 100;

  constructor(deploymentCollector: DeploymentMetricsCollector) {
    this.deploymentCollector = deploymentCollector;
  }

  /**
   * Calculate deploy cadence metrics for a repository
   */
  async calculateDeployCadence(
    org: string,
    team: string,
    repo: string,
    days: number = 30
  ): Promise<DeployCadenceMetrics> {
    const timestamp = new Date();
    const historyKey = `${org}/${repo}`;

    try {
      // Collect deployment metrics
      const deployments = await this.deploymentCollector.collectDeploymentMetrics(org, repo, days);

      if (deployments.length === 0) {
        return this.createEmptyDeployCadence(timestamp, team, org, repo);
      }

      // Group by environment
      const byEnvironment = this.groupByEnvironment(deployments);

      // Calculate metrics per environment
      const environments: EnvironmentCadence[] = [];
      let totalDeploys = 0;
      let totalSuccessful = 0;
      let totalRollbacks = 0;

      for (const [env, deploys] of byEnvironment.entries()) {
        const successful = deploys.filter(d => d.status === 'success').length;
        const failed = deploys.filter(d => d.status === 'failure').length;
        const rollbacks = deploys.filter(d => d.isRollback).length;

        totalDeploys += deploys.length;
        totalSuccessful += successful;
        totalRollbacks += rollbacks;

        const deploysPerDay = (deploys.length / days);
        const successRate = deploys.length > 0 ? (successful / deploys.length) * 100 : 0;
        const avgDeploymentTime = deploys.length > 0
          ? deploys.reduce((sum, d) => sum + (d.duration || 0), 0) / deploys.length
          : 0;

        environments.push({
          environment: env,
          deploysPerDay: Math.round(deploysPerDay * 100) / 100,
          successRate: Math.round(successRate * 100) / 100,
          failureCount: failed,
          rollbackCount: rollbacks,
          lastDeployment: deploys[deploys.length - 1]?.triggeredAt,
          averageDeploymentTime: Math.round(avgDeploymentTime)
        });
      }

      // Calculate overall metrics
      const totalDeploysPerDay = totalDeploys / days;
      const overallSuccessRate = totalDeploys > 0 ? (totalSuccessful / totalDeploys) * 100 : 0;

      // Update history
      if (!this.cadenceHistory.has(historyKey)) {
        this.cadenceHistory.set(historyKey, []);
      }
      const history = this.cadenceHistory.get(historyKey)!;
      const dataPoint: DeployCadenceDataPoint = {
        timestamp,
        deploysPerDay: totalDeploysPerDay,
        successRate: overallSuccessRate,
        rollbackCount: totalRollbacks
      };
      history.push(dataPoint);

      if (history.length > this.maxHistoryPoints) {
        history.shift();
      }

      // Calculate trend
      const { trend, trendPercentage } = this.calculateTrend(history);

      const metrics: DeployCadenceMetrics = {
        timestamp,
        team,
        org,
        repo,
        environments,
        totalDeploysPerDay: Math.round(totalDeploysPerDay * 100) / 100,
        overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
        totalRollbacks,
        trend,
        trendPercentage,
        history
      };

      return metrics;
    } catch (error) {
      console.error(`❌ Error calculating deploy cadence for ${historyKey}:`, error);
      throw error;
    }
  }

  /**
   * Group deployments by environment
   */
  private groupByEnvironment(deployments: DeploymentMetrics[]): Map<string, DeploymentMetrics[]> {
    const grouped = new Map<string, DeploymentMetrics[]>();

    for (const deployment of deployments) {
      const env = deployment.environment || 'unknown';
      if (!grouped.has(env)) {
        grouped.set(env, []);
      }
      grouped.get(env)!.push(deployment);
    }

    return grouped;
  }

  /**
   * Calculate trend from history
   */
  private calculateTrend(history: DeployCadenceDataPoint[]): { trend: 'increasing' | 'stable' | 'decreasing'; trendPercentage: number } {
    if (history.length < 2) {
      return { trend: 'stable', trendPercentage: 0 };
    }

    const recent = history.slice(-7);
    const older = history.slice(-14, -7);

    const recentAvg = recent.reduce((sum, p) => sum + p.deploysPerDay, 0) / recent.length;
    const olderAvg = older.length > 0
      ? older.reduce((sum, p) => sum + p.deploysPerDay, 0) / older.length
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
   * Create empty deploy cadence
   */
  private createEmptyDeployCadence(timestamp: Date, team: string, org: string, repo: string): DeployCadenceMetrics {
    return {
      timestamp,
      team,
      org,
      repo,
      environments: [],
      totalDeploysPerDay: 0,
      overallSuccessRate: 0,
      totalRollbacks: 0,
      trend: 'stable',
      trendPercentage: 0,
      history: []
    };
  }

  /**
   * Clear history for a repository
   */
  clearHistory(org: string, repo: string): void {
    const historyKey = `${org}/${repo}`;
    this.cadenceHistory.delete(historyKey);
  }

  /**
   * Get history for a repository
   */
  getHistory(org: string, repo: string): DeployCadenceDataPoint[] {
    const historyKey = `${org}/${repo}`;
    return this.cadenceHistory.get(historyKey) || [];
  }
}

