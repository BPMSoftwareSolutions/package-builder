/**
 * Configuration Drift Detection Service
 * Detects and tracks configuration differences across environments
 */

import { environmentConfigurationService } from './environment-configuration.js';

export interface ConfigurationDrift {
  timestamp: Date;
  repo: string;
  environment1: string;
  environment2: string;

  // Differences
  variableDifferences: Record<string, [string, string]>; // var -> [val1, val2]
  toolVersionDifferences: Record<string, [string, string]>;
  dependencyDifferences: Record<string, [string, string]>;

  // Severity
  severity: 'critical' | 'high' | 'medium' | 'low';
  riskLevel: number; // 0-100

  // Recommendations
  recommendations: string[];
}

export interface DriftMetrics {
  repo: string;
  totalDrifts: number;
  criticalDrifts: number;
  highDrifts: number;
  averageRiskLevel: number;
  lastDetected: Date;
}

export class ConfigurationDriftDetectionService {
  private driftHistory: Map<string, ConfigurationDrift[]> = new Map();

  /**
   * Detect drift between two environments
   */
  async detectDrift(
    org: string,
    repo: string,
    env1: 'dev' | 'staging' | 'production',
    env2: 'dev' | 'staging' | 'production'
  ): Promise<ConfigurationDrift> {
    console.log(`🔍 Detecting configuration drift between ${env1} and ${env2} for ${org}/${repo}`);

    const config1 = await environmentConfigurationService.collectEnvironmentConfiguration(org, repo, env1);
    const config2 = await environmentConfigurationService.collectEnvironmentConfiguration(org, repo, env2);

    const drift: ConfigurationDrift = {
      timestamp: new Date(),
      repo,
      environment1: env1,
      environment2: env2,
      variableDifferences: this.findDifferences(config1.variables, config2.variables),
      toolVersionDifferences: this.findDifferences(config1.toolVersions, config2.toolVersions),
      dependencyDifferences: this.findDifferences(config1.dependencies, config2.dependencies),
      severity: 'low',
      riskLevel: 0,
      recommendations: []
    };

    // Calculate severity and risk level
    this.calculateSeverity(drift);

    // Generate recommendations
    drift.recommendations = this.generateRecommendations(drift);

    // Store drift
    this.storeDrift(drift);

    return drift;
  }

  /**
   * Find differences between two configuration objects
   */
  private findDifferences(
    config1: Record<string, string>,
    config2: Record<string, string>
  ): Record<string, [string, string]> {
    const differences: Record<string, [string, string]> = {};

    // Check all keys in both configs
    const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);

    for (const key of allKeys) {
      const val1 = config1[key] || 'MISSING';
      const val2 = config2[key] || 'MISSING';

      if (val1 !== val2) {
        differences[key] = [val1, val2];
      }
    }

    return differences;
  }

  /**
   * Calculate severity and risk level
   */
  private calculateSeverity(drift: ConfigurationDrift): void {
    const totalDifferences =
      Object.keys(drift.variableDifferences).length +
      Object.keys(drift.toolVersionDifferences).length +
      Object.keys(drift.dependencyDifferences).length;

    // Check for critical differences
    const criticalKeys = ['NODE_ENV', 'node', 'python', 'docker'];
    let hasCritical = false;

    for (const key of criticalKeys) {
      if (drift.toolVersionDifferences[key] || drift.variableDifferences[key]) {
        hasCritical = true;
        break;
      }
    }

    // Determine severity
    if (hasCritical || totalDifferences > 10) {
      drift.severity = 'critical';
      drift.riskLevel = 90;
    } else if (totalDifferences > 5) {
      drift.severity = 'high';
      drift.riskLevel = 70;
    } else if (totalDifferences > 2) {
      drift.severity = 'medium';
      drift.riskLevel = 40;
    } else {
      drift.severity = 'low';
      drift.riskLevel = 10;
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(drift: ConfigurationDrift): string[] {
    const recommendations: string[] = [];

    if (Object.keys(drift.toolVersionDifferences).length > 0) {
      recommendations.push('Synchronize tool versions across environments');
    }

    if (Object.keys(drift.dependencyDifferences).length > 0) {
      recommendations.push('Update dependencies to match production versions');
    }

    if (Object.keys(drift.variableDifferences).length > 0) {
      recommendations.push('Review and align environment variables');
    }

    if (drift.severity === 'critical') {
      recommendations.push('⚠️ URGENT: Address critical drift immediately to prevent deployment issues');
    }

    return recommendations;
  }

  /**
   * Store drift in history
   */
  private storeDrift(drift: ConfigurationDrift): void {
    const key = `${drift.repo}:${drift.environment1}:${drift.environment2}`;
    const history = this.driftHistory.get(key) || [];
    history.push(drift);

    // Keep only last 50 drifts
    if (history.length > 50) {
      history.shift();
    }

    this.driftHistory.set(key, history);
  }

  /**
   * Get drift metrics for a repository
   */
  getDriftMetrics(repo: string): DriftMetrics {
    let totalDrifts = 0;
    let criticalDrifts = 0;
    let highDrifts = 0;
    let totalRiskLevel = 0;
    let lastDetected = new Date(0);

    for (const [key, drifts] of this.driftHistory.entries()) {
      if (key.startsWith(repo)) {
        totalDrifts += drifts.length;
        for (const drift of drifts) {
          if (drift.severity === 'critical') criticalDrifts++;
          if (drift.severity === 'high') highDrifts++;
          totalRiskLevel += drift.riskLevel;
          if (drift.timestamp > lastDetected) {
            lastDetected = drift.timestamp;
          }
        }
      }
    }

    return {
      repo,
      totalDrifts,
      criticalDrifts,
      highDrifts,
      averageRiskLevel: totalDrifts > 0 ? Math.round(totalRiskLevel / totalDrifts) : 0,
      lastDetected
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.driftHistory.clear();
  }
}

// Export singleton instance
export const configurationDriftDetectionService = new ConfigurationDriftDetectionService();

