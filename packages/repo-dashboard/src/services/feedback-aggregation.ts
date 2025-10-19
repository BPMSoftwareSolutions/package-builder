/**
 * Feedback Aggregation Service
 * Centralizes all feedback signals and generates alerts for critical issues
 */

import { BuildStatusService } from './build-status.js';
import { TestResultsService } from './test-results.js';
import { DeploymentStatusService } from './deployment-status.js';

export interface FeedbackSignal {
  timestamp: Date;
  type: 'build' | 'test' | 'deployment' | 'quality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  repo: string;
  actionRequired: boolean;
}

export interface FeedbackSummary {
  timestamp: Date;
  org: string;
  totalSignals: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  signals: FeedbackSignal[];
}

export class FeedbackAggregationService {
  private buildStatusService: BuildStatusService;
  private testResultsService: TestResultsService;
  private deploymentStatusService: DeploymentStatusService;
  private feedbackHistory: Map<string, FeedbackSignal[]> = new Map();

  constructor(
    buildStatusService: BuildStatusService,
    testResultsService: TestResultsService,
    deploymentStatusService: DeploymentStatusService
  ) {
    this.buildStatusService = buildStatusService;
    this.testResultsService = testResultsService;
    this.deploymentStatusService = deploymentStatusService;
  }

  /**
   * Aggregate feedback from all sources
   */
  async aggregateFeedback(org: string, repos: string[]): Promise<FeedbackSummary> {
    const signals: FeedbackSignal[] = [];

    console.log(`🔍 Aggregating feedback for ${org} (${repos.length} repos)...`);

    for (const repo of repos) {
      try {
        // Collect build feedback
        const buildStatus = await this.buildStatusService.getBuildStatus(org, repo);
        if (buildStatus && buildStatus.status === 'failure') {
          signals.push({
            timestamp: buildStatus.timestamp,
            type: 'build',
            severity: buildStatus.trend === 'degrading' ? 'critical' : 'high',
            title: `Build failure in ${repo}`,
            description: `Build ${buildStatus.buildId} failed after ${buildStatus.duration}s`,
            repo,
            actionRequired: true
          });
        }

        // Collect test feedback
        const testResults = await this.testResultsService.getLatestTestResults(org, repo);
        if (testResults && testResults.failingTests.length > 0) {
          signals.push({
            timestamp: testResults.timestamp,
            type: 'test',
            severity: testResults.failingTests.length > 5 ? 'critical' : 'high',
            title: `${testResults.failingTests.length} failing tests in ${repo}`,
            description: `${testResults.failedTests} tests failed out of ${testResults.totalTests}`,
            repo,
            actionRequired: true
          });
        }

        // Collect deployment feedback
        const deploymentStatus = await this.deploymentStatusService.getLatestDeploymentStatus(org, repo);
        if (deploymentStatus && deploymentStatus.status === 'failure') {
          signals.push({
            timestamp: deploymentStatus.timestamp,
            type: 'deployment',
            severity: 'critical',
            title: `Deployment failure in ${repo}`,
            description: `Deployment to ${deploymentStatus.environment} failed`,
            repo,
            actionRequired: true
          });
        }
      } catch (error) {
        console.error(`❌ Error aggregating feedback for ${org}/${repo}:`, error);
      }
    }

    // Sort by severity and timestamp
    signals.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Store in history
    this.feedbackHistory.set(org, signals);

    const summary: FeedbackSummary = {
      timestamp: new Date(),
      org,
      totalSignals: signals.length,
      criticalCount: signals.filter(s => s.severity === 'critical').length,
      highCount: signals.filter(s => s.severity === 'high').length,
      mediumCount: signals.filter(s => s.severity === 'medium').length,
      lowCount: signals.filter(s => s.severity === 'low').length,
      signals
    };

    console.log(`✅ Aggregated ${signals.length} feedback signals for ${org}`);
    return summary;
  }

  /**
   * Get feedback summary for organization
   */
  async getFeedbackSummary(org: string, repos: string[]): Promise<FeedbackSummary> {
    return this.aggregateFeedback(org, repos);
  }

  /**
   * Get critical signals requiring immediate action
   */
  getCriticalSignals(org: string): FeedbackSignal[] {
    const signals = this.feedbackHistory.get(org) || [];
    return signals.filter(s => s.severity === 'critical' && s.actionRequired);
  }
}

// Export singleton instance
export const feedbackAggregationService = new FeedbackAggregationService(
  new BuildStatusService(),
  new TestResultsService(),
  new DeploymentStatusService()
);

