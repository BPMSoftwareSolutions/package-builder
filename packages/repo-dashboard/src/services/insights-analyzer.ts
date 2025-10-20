/**
 * Insights Analyzer Service
 * Analyzes metrics from collectors to generate trends, anomalies, and recommendations
 */

import { prMetricsCollector } from './pull-request-metrics-collector.js';
import { deploymentMetricsCollector } from './deployment-metrics-collector.js';
import { codeQualityCollector } from './code-quality-collector.js';
import { testCoverageCollector } from './test-coverage-collector.js';
import { metricsAggregator } from './metrics-aggregator.js';

export interface Trend {
  metric: string;
  description: string;
  direction: 'up' | 'down' | 'stable';
  change: number; // percentage
  value?: number;
}

export interface Anomaly {
  metric: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  value?: number;
  threshold?: number;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actions: string[];
  metric?: string;
}

export interface InsightsReport {
  trends: Trend[];
  anomalies: Anomaly[];
  recommendations: Recommendation[];
  report: string;
  timestamp: string;
}

export class InsightsAnalyzer {
  private readonly cacheTTL = 3600000; // 1 hour in milliseconds
  private lastAnalysis: { timestamp: number; data: InsightsReport } | null = null;

  /**
   * Generate comprehensive insights from all metrics
   */
  async generateInsights(org: string, days: number = 30): Promise<InsightsReport> {
    const now = Date.now();

    // Check cache
    if (this.lastAnalysis && now - this.lastAnalysis.timestamp < this.cacheTTL) {
      console.log(`✅ Using cached insights`);
      return this.lastAnalysis.data;
    }

    console.log(`🔍 Generating insights for ${org}...`);

    try {
      // Initialize metrics aggregator to get teams and repos
      try {
        await metricsAggregator.initialize();
      } catch (error) {
        console.warn(`⚠️ Failed to initialize MetricsAggregator, will return empty insights:`, error);
        // Return empty insights if ADF initialization fails
        const emptyInsights: InsightsReport = {
          trends: [],
          anomalies: [],
          recommendations: [],
          report: '# System Analysis Report\n\nNo data available. Please ensure the ADF file is accessible.',
          timestamp: new Date().toISOString()
        };
        return emptyInsights;
      }

      const teams = metricsAggregator.getTeams();

      // If no teams found, return empty insights
      if (teams.length === 0) {
        console.warn(`⚠️ No teams found in ADF, returning empty insights`);
        const emptyInsights: InsightsReport = {
          trends: [],
          anomalies: [],
          recommendations: [],
          report: '# System Analysis Report\n\nNo teams configured in the Architecture Definition File.',
          timestamp: new Date().toISOString()
        };
        return emptyInsights;
      }

      // Collect metrics from all repositories
      const allPRMetrics: any[] = [];
      const allDeploymentMetrics: any[] = [];
      const allQualityMetrics: any[] = [];
      const allCoverageMetrics: any[] = [];

      for (const team of teams) {
        const repos = metricsAggregator.getTeamRepositories(team);
        for (const repo of repos) {
          const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
          try {
            const prAgg = await prMetricsCollector.calculateAggregateMetrics(org, repoName, days);
            allPRMetrics.push(prAgg);

            const deployAgg = await deploymentMetricsCollector.calculateAggregateMetrics(org, repoName, days);
            allDeploymentMetrics.push(deployAgg);

            const quality = await codeQualityCollector.collectQualityMetrics(org, repoName);
            allQualityMetrics.push(quality);

            const coverage = await testCoverageCollector.collectCoverageMetrics(org, repoName);
            allCoverageMetrics.push(coverage);
          } catch (error) {
            console.warn(`⚠️ Failed to collect metrics for ${org}/${repoName}:`, error);
          }
        }
      }

      // Generate insights
      const trends = this.analyzeTrends(allPRMetrics, allDeploymentMetrics, allQualityMetrics, allCoverageMetrics);
      const anomalies = this.detectAnomalies(allPRMetrics, allDeploymentMetrics, allQualityMetrics, allCoverageMetrics);
      const recommendations = this.generateRecommendations(trends, anomalies, allPRMetrics, allDeploymentMetrics);
      const report = this.generateMarkdownReport(trends, anomalies, recommendations);

      const insights: InsightsReport = {
        trends,
        anomalies,
        recommendations,
        report,
        timestamp: new Date().toISOString()
      };

      // Cache the results
      this.lastAnalysis = {
        timestamp: now,
        data: insights
      };

      console.log(`✅ Generated insights with ${trends.length} trends, ${anomalies.length} anomalies, ${recommendations.length} recommendations`);
      return insights;
    } catch (error) {
      console.error(`❌ Error generating insights:`, error);
      // Return empty insights on error instead of throwing
      const emptyInsights: InsightsReport = {
        trends: [],
        anomalies: [],
        recommendations: [],
        report: `# System Analysis Report\n\nError generating insights: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      return emptyInsights;
    }
  }

  /**
   * Analyze trends from metrics
   */
  private analyzeTrends(prMetrics: any[], deployMetrics: any[], qualityMetrics: any[], coverageMetrics: any[]): Trend[] {
    const trends: Trend[] = [];

    // Cycle time trend
    if (prMetrics.length > 0) {
      const avgCycleTime = prMetrics.reduce((sum, m) => sum + m.avgCycleTime, 0) / prMetrics.length;
      trends.push({
        metric: 'Cycle Time',
        description: `Average PR cycle time is ${Math.round(avgCycleTime)} minutes`,
        direction: avgCycleTime < 480 ? 'up' : avgCycleTime > 1440 ? 'down' : 'stable',
        change: avgCycleTime < 480 ? 5 : avgCycleTime > 1440 ? -10 : 0,
        value: avgCycleTime
      });
    }

    // Deployment frequency trend
    if (deployMetrics.length > 0) {
      const avgDeploysPerDay = deployMetrics.reduce((sum, m) => sum + m.deploysPerDay, 0) / deployMetrics.length;
      trends.push({
        metric: 'Deployment Frequency',
        description: `Average ${avgDeploysPerDay.toFixed(2)} deployments per day`,
        direction: avgDeploysPerDay > 1 ? 'up' : avgDeploysPerDay > 0.5 ? 'stable' : 'down',
        change: avgDeploysPerDay > 1 ? 8 : avgDeploysPerDay > 0.5 ? 0 : -5,
        value: avgDeploysPerDay
      });
    }

    // Code quality trend
    if (qualityMetrics.length > 0) {
      const avgQualityScore = qualityMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / qualityMetrics.length;
      trends.push({
        metric: 'Code Quality',
        description: `Average quality score is ${Math.round(avgQualityScore)}%`,
        direction: avgQualityScore > 80 ? 'up' : avgQualityScore > 60 ? 'stable' : 'down',
        change: avgQualityScore > 80 ? 3 : avgQualityScore > 60 ? 0 : -5,
        value: avgQualityScore
      });
    }

    // Test coverage trend
    if (coverageMetrics.length > 0) {
      const avgCoverage = coverageMetrics.reduce((sum, m) => sum + m.lineCoverage, 0) / coverageMetrics.length;
      trends.push({
        metric: 'Test Coverage',
        description: `Average line coverage is ${Math.round(avgCoverage)}%`,
        direction: avgCoverage > 80 ? 'up' : avgCoverage > 60 ? 'stable' : 'down',
        change: avgCoverage > 80 ? 2 : avgCoverage > 60 ? 0 : -3,
        value: avgCoverage
      });
    }

    return trends;
  }

  /**
   * Detect anomalies in metrics
   */
  private detectAnomalies(prMetrics: any[], deployMetrics: any[], qualityMetrics: any[], coverageMetrics: any[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // High cycle time anomaly
    if (prMetrics.length > 0) {
      const avgCycleTime = prMetrics.reduce((sum, m) => sum + m.avgCycleTime, 0) / prMetrics.length;
      if (avgCycleTime > 1440) { // > 1 day
        anomalies.push({
          metric: 'Cycle Time',
          description: `Cycle time is unusually high at ${Math.round(avgCycleTime)} minutes`,
          severity: avgCycleTime > 2880 ? 'critical' : 'high',
          value: avgCycleTime,
          threshold: 1440
        });
      }
    }

    // Low deployment success rate
    if (deployMetrics.length > 0) {
      const avgSuccessRate = deployMetrics.reduce((sum, m) => sum + m.successRate, 0) / deployMetrics.length;
      if (avgSuccessRate < 0.8) {
        anomalies.push({
          metric: 'Deployment Success Rate',
          description: `Success rate is ${Math.round(avgSuccessRate * 100)}%, below target of 80%`,
          severity: avgSuccessRate < 0.6 ? 'critical' : 'high',
          value: avgSuccessRate * 100,
          threshold: 80
        });
      }
    }

    // Low code quality
    if (qualityMetrics.length > 0) {
      const avgQualityScore = qualityMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / qualityMetrics.length;
      if (avgQualityScore < 60) {
        anomalies.push({
          metric: 'Code Quality',
          description: `Quality score is ${Math.round(avgQualityScore)}%, below acceptable threshold`,
          severity: avgQualityScore < 40 ? 'critical' : 'high',
          value: avgQualityScore,
          threshold: 60
        });
      }
    }

    // Low test coverage
    if (coverageMetrics.length > 0) {
      const avgCoverage = coverageMetrics.reduce((sum, m) => sum + m.lineCoverage, 0) / coverageMetrics.length;
      if (avgCoverage < 60) {
        anomalies.push({
          metric: 'Test Coverage',
          description: `Coverage is ${Math.round(avgCoverage)}%, below target of 80%`,
          severity: avgCoverage < 40 ? 'critical' : 'high',
          value: avgCoverage,
          threshold: 80
        });
      }
    }

    return anomalies;
  }

  /**
   * Generate recommendations based on trends and anomalies
   */
  private generateRecommendations(_trends: Trend[], anomalies: Anomaly[], _prMetrics: any[], _deployMetrics: any[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recommendations based on anomalies
    for (const anomaly of anomalies) {
      if (anomaly.metric === 'Cycle Time') {
        recommendations.push({
          title: 'Reduce PR Review Time',
          description: 'Cycle time is high. Consider implementing code review best practices.',
          priority: anomaly.severity === 'critical' ? 'high' : 'medium',
          actions: [
            'Set up automated code review guidelines',
            'Implement smaller PR size limits',
            'Schedule regular code review sessions',
            'Use automated testing to reduce review burden'
          ],
          metric: 'Cycle Time'
        });
      }

      if (anomaly.metric === 'Deployment Success Rate') {
        recommendations.push({
          title: 'Improve Deployment Reliability',
          description: 'Deployment success rate is below target. Investigate failure causes.',
          priority: anomaly.severity === 'critical' ? 'high' : 'medium',
          actions: [
            'Review recent deployment failures',
            'Enhance pre-deployment testing',
            'Implement canary deployments',
            'Improve rollback procedures'
          ],
          metric: 'Deployment Success Rate'
        });
      }

      if (anomaly.metric === 'Code Quality') {
        recommendations.push({
          title: 'Improve Code Quality',
          description: 'Code quality score is below acceptable levels.',
          priority: anomaly.severity === 'critical' ? 'high' : 'medium',
          actions: [
            'Enforce linting rules in CI/CD',
            'Conduct code quality reviews',
            'Refactor high-complexity code',
            'Add static analysis tools'
          ],
          metric: 'Code Quality'
        });
      }

      if (anomaly.metric === 'Test Coverage') {
        recommendations.push({
          title: 'Increase Test Coverage',
          description: 'Test coverage is below target. Add more unit and integration tests.',
          priority: anomaly.severity === 'critical' ? 'high' : 'medium',
          actions: [
            'Add unit tests for critical paths',
            'Implement integration tests',
            'Set minimum coverage thresholds',
            'Review untested code sections'
          ],
          metric: 'Test Coverage'
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(trends: Trend[], anomalies: Anomaly[], recommendations: Recommendation[]): string {
    let report = '# System Analysis Report\n\n';

    report += '## Executive Summary\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '## Trends\n\n';
    if (trends.length === 0) {
      report += 'No significant trends detected.\n\n';
    } else {
      for (const trend of trends) {
        const arrow = trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️';
        report += `### ${arrow} ${trend.metric}\n`;
        report += `${trend.description}\n`;
        report += `Change: ${trend.change > 0 ? '+' : ''}${trend.change}%\n\n`;
      }
    }

    report += '## Anomalies Detected\n\n';
    if (anomalies.length === 0) {
      report += 'No anomalies detected.\n\n';
    } else {
      for (const anomaly of anomalies) {
        const icon = anomaly.severity === 'critical' ? '🚨' : anomaly.severity === 'high' ? '⚠️' : 'ℹ️';
        report += `### ${icon} ${anomaly.metric} (${anomaly.severity.toUpperCase()})\n`;
        report += `${anomaly.description}\n\n`;
      }
    }

    report += '## Recommendations\n\n';
    if (recommendations.length === 0) {
      report += 'No recommendations at this time.\n\n';
    } else {
      for (const rec of recommendations) {
        report += `### ${rec.title}\n`;
        report += `**Priority**: ${rec.priority.toUpperCase()}\n\n`;
        report += `${rec.description}\n\n`;
        report += '**Actions**:\n';
        for (const action of rec.actions) {
          report += `- ${action}\n`;
        }
        report += '\n';
      }
    }

    return report;
  }
}

// Export singleton instance
export const insightsAnalyzer = new InsightsAnalyzer();

