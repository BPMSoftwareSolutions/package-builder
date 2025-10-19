/**
 * Environment Health Service
 * Calculates environment consistency scores and tracks environment-related failures
 */

import { buildEnvironmentService, BuildEnvironmentMetrics } from './build-environment.js';
import { configurationDriftDetectionService, DriftMetrics } from './configuration-drift-detection.js';

export interface EnvironmentHealthScore {
  repo: string;
  timestamp: Date;

  // Scores (0-100)
  consistencyScore: number;
  reproducibilityScore: number;
  driftScore: number; // lower is better
  overallHealthScore: number;

  // Metrics
  environmentRelatedFailures: number;
  mttr: number; // Mean Time To Recovery in minutes
  failureRate: number; // 0-1

  // Status
  status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

export interface EnvironmentHealthMetrics {
  repo: string;
  healthScores: EnvironmentHealthScore[];
  averageHealthScore: number;
  trend: 'improving' | 'stable' | 'degrading';
  lastUpdated: Date;
}

export class EnvironmentHealthService {
  private healthHistory: Map<string, EnvironmentHealthScore[]> = new Map();
  private failureTracking: Map<string, number> = new Map();

  /**
   * Calculate environment health score
   */
  async calculateEnvironmentHealth(org: string, repo: string): Promise<EnvironmentHealthScore> {
    console.log(`💚 Calculating environment health for ${org}/${repo}`);

    // Get metrics from other services
    const buildMetrics = buildEnvironmentService.getBuildEnvironmentMetrics(repo);
    const driftMetrics = configurationDriftDetectionService.getDriftMetrics(repo);

    // Calculate individual scores
    const reproducibilityScore = Math.round(buildMetrics.reproducibilityRate * 100);
    const consistencyScore = this.calculateConsistencyScore(buildMetrics);
    const driftScore = this.calculateDriftScore(driftMetrics);

    // Calculate overall health score (weighted average)
    const overallHealthScore = Math.round(
      (reproducibilityScore * 0.4 + consistencyScore * 0.3 + (100 - driftScore) * 0.3)
    );

    // Track failures
    const environmentRelatedFailures = buildMetrics.failedBuilds;
    const mttr = this.calculateMTTR(repo);
    const failureRate = buildMetrics.successRate === 0 ? 0 : 1 - buildMetrics.successRate;

    // Determine status
    const status = this.determineStatus(overallHealthScore, driftScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overallHealthScore,
      reproducibilityScore,
      consistencyScore,
      driftScore
    );

    const healthScore: EnvironmentHealthScore = {
      repo,
      timestamp: new Date(),
      consistencyScore,
      reproducibilityScore,
      driftScore,
      overallHealthScore,
      environmentRelatedFailures,
      mttr,
      failureRate,
      status,
      recommendations
    };

    // Store in history
    this.storeHealthScore(healthScore);

    return healthScore;
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(buildMetrics: BuildEnvironmentMetrics): number {
    // Based on success rate and build duration consistency
    const successScore = buildMetrics.successRate * 100;
    const durationVariance = this.calculateDurationVariance(buildMetrics.repo);

    return Math.round((successScore * 0.7 + (100 - durationVariance) * 0.3));
  }

  /**
   * Calculate drift score (0-100, lower is better)
   */
  private calculateDriftScore(driftMetrics: DriftMetrics): number {
    const criticalWeight = driftMetrics.criticalDrifts * 30;
    const highWeight = driftMetrics.highDrifts * 15;
    const averageWeight = driftMetrics.averageRiskLevel;

    return Math.min(100, Math.round((criticalWeight + highWeight + averageWeight) / 3));
  }

  /**
   * Calculate duration variance
   */
  private calculateDurationVariance(_repo: string): number {
    // Mock calculation - in production, would calculate actual variance
    return Math.random() * 30; // 0-30% variance
  }

  /**
   * Calculate Mean Time To Recovery
   */
  private calculateMTTR(_repo: string): number {
    // Mock calculation - in production, would track actual recovery times
    return Math.floor(Math.random() * 120) + 15; // 15-135 minutes
  }

  /**
   * Determine health status
   */
  private determineStatus(
    overallScore: number,
    driftScore: number
  ): 'healthy' | 'warning' | 'critical' {
    if (overallScore >= 80 && driftScore <= 30) {
      return 'healthy';
    } else if (overallScore >= 60 && driftScore <= 60) {
      return 'warning';
    }
    return 'critical';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    overallScore: number,
    reproducibilityScore: number,
    consistencyScore: number,
    driftScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (reproducibilityScore < 80) {
      recommendations.push('Improve build reproducibility by standardizing build environments');
    }

    if (consistencyScore < 80) {
      recommendations.push('Investigate build failures and improve consistency');
    }

    if (driftScore > 50) {
      recommendations.push('Address configuration drift across environments');
    }

    if (overallScore < 60) {
      recommendations.push('⚠️ URGENT: Environment health is critical, immediate action required');
    }

    return recommendations;
  }

  /**
   * Store health score
   */
  private storeHealthScore(score: EnvironmentHealthScore): void {
    const history = this.healthHistory.get(score.repo) || [];
    history.push(score);

    // Keep only last 100 scores
    if (history.length > 100) {
      history.shift();
    }

    this.healthHistory.set(score.repo, history);
  }

  /**
   * Get environment health metrics
   */
  getEnvironmentHealthMetrics(repo: string): EnvironmentHealthMetrics {
    const scores = this.healthHistory.get(repo) || [];

    const averageHealthScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.overallHealthScore, 0) / scores.length)
      : 0;

    const trend = this.calculateTrend(scores);

    return {
      repo,
      healthScores: scores,
      averageHealthScore,
      trend,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate trend
   */
  private calculateTrend(scores: EnvironmentHealthScore[]): 'improving' | 'stable' | 'degrading' {
    if (scores.length < 2) return 'stable';

    const recent = scores.slice(-5);
    const older = scores.slice(-10, -5);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, s) => sum + s.overallHealthScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.overallHealthScore, 0) / older.length;

    const change = recentAvg - olderAvg;

    if (change > 5) return 'improving';
    if (change < -5) return 'degrading';
    return 'stable';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.healthHistory.clear();
    this.failureTracking.clear();
  }
}

// Export singleton instance
export const environmentHealthService = new EnvironmentHealthService();

