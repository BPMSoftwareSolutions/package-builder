/**
 * Flow Stage Analyzer Service
 * Analyzes PR flow through different stages and identifies bottlenecks
 */

import { PullRequestMetricsCollector, PRMetrics } from './pull-request-metrics-collector.js';

export interface FlowStageMetrics {
  stage: string;
  percentageOfTime: number; // 0-100
  medianTime: number; // minutes
  p95Time: number; // 95th percentile
  p5Time: number; // 5th percentile
  trend: 'improving' | 'stable' | 'degrading';
  trendPercentage: number;
}

export interface FlowBreakdown {
  timestamp: Date;
  team: string;
  org: string;
  repo: string;

  // Stage breakdown
  stages: FlowStageMetrics[];

  // Overall metrics
  totalMedianCycleTime: number; // minutes
  longestStage: string;
  longestStageDuration: number;

  // Anomalies
  anomalies: FlowAnomaly[];
}

export interface FlowAnomaly {
  stage: string;
  type: 'slow' | 'fast' | 'inconsistent';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedPRCount: number;
}

export class FlowStageAnalyzerService {
  private prCollector: PullRequestMetricsCollector;
  private stageHistory: Map<string, FlowStageMetrics[][]> = new Map();
  private readonly maxHistoryPoints = 100;

  constructor(prCollector: PullRequestMetricsCollector) {
    this.prCollector = prCollector;
  }

  /**
   * Analyze flow stages for a repository
   */
  async analyzeFlowStages(
    org: string,
    team: string,
    repo: string,
    days: number = 30
  ): Promise<FlowBreakdown> {
    const timestamp = new Date();
    const historyKey = `${org}/${repo}`;

    try {
      // Collect PR metrics
      const metrics = await this.prCollector.collectPRMetrics(org, repo, days);

      // Filter for merged PRs only (completed flow)
      const mergedPRs = metrics.filter(m => m.status === 'merged' && m.mergedAt);

      if (mergedPRs.length === 0) {
        return this.createEmptyFlowBreakdown(timestamp, team, org, repo);
      }

      // Calculate stage metrics
      const stages = this.calculateStageMetrics(mergedPRs);

      // Find longest stage
      const longestStage = stages.reduce((max, s) => s.medianTime > max.medianTime ? s : max);

      // Detect anomalies
      const anomalies = this.detectAnomalies(mergedPRs, stages);

      // Update history
      if (!this.stageHistory.has(historyKey)) {
        this.stageHistory.set(historyKey, []);
      }
      const history = this.stageHistory.get(historyKey)!;
      history.push(stages);

      if (history.length > this.maxHistoryPoints) {
        history.shift();
      }

      // Calculate trends
      const stagesWithTrends = this.calculateTrends(stages, history);

      const breakdown: FlowBreakdown = {
        timestamp,
        team,
        org,
        repo,
        stages: stagesWithTrends,
        totalMedianCycleTime: mergedPRs.reduce((sum, p) => sum + p.totalCycleTime, 0) / mergedPRs.length,
        longestStage: longestStage.stage,
        longestStageDuration: longestStage.medianTime,
        anomalies
      };

      return breakdown;
    } catch (error) {
      console.error(`❌ Error analyzing flow stages for ${historyKey}:`, error);
      throw error;
    }
  }

  /**
   * Calculate metrics for each flow stage
   */
  private calculateStageMetrics(mergedPRs: PRMetrics[]): FlowStageMetrics[] {
    const stages: FlowStageMetrics[] = [];

    // Stage 1: Creation to First Review
    const timeToFirstReview = mergedPRs
      .filter(p => p.timeToFirstReview !== undefined)
      .map(p => p.timeToFirstReview!)
      .sort((a, b) => a - b);

    if (timeToFirstReview.length > 0) {
      stages.push({
        stage: 'First Review',
        percentageOfTime: this.calculatePercentage(timeToFirstReview, mergedPRs),
        medianTime: this.calculateMedian(timeToFirstReview),
        p95Time: this.calculatePercentile(timeToFirstReview, 95),
        p5Time: this.calculatePercentile(timeToFirstReview, 5),
        trend: 'stable',
        trendPercentage: 0
      });
    }

    // Stage 2: First Review to Approval
    const timeToApproval = mergedPRs
      .filter(p => p.timeToApproval !== undefined)
      .map(p => p.timeToApproval!)
      .sort((a, b) => a - b);

    if (timeToApproval.length > 0) {
      stages.push({
        stage: 'Approval',
        percentageOfTime: this.calculatePercentage(timeToApproval, mergedPRs),
        medianTime: this.calculateMedian(timeToApproval),
        p95Time: this.calculatePercentile(timeToApproval, 95),
        p5Time: this.calculatePercentile(timeToApproval, 5),
        trend: 'stable',
        trendPercentage: 0
      });
    }

    // Stage 3: Approval to Merge
    const timeToMerge = mergedPRs
      .filter(p => p.timeToMerge !== undefined)
      .map(p => p.timeToMerge!)
      .sort((a, b) => a - b);

    if (timeToMerge.length > 0) {
      stages.push({
        stage: 'Merge',
        percentageOfTime: this.calculatePercentage(timeToMerge, mergedPRs),
        medianTime: this.calculateMedian(timeToMerge),
        p95Time: this.calculatePercentile(timeToMerge, 95),
        p5Time: this.calculatePercentile(timeToMerge, 5),
        trend: 'stable',
        trendPercentage: 0
      });
    }

    return stages;
  }

  /**
   * Detect anomalies in flow stages
   */
  private detectAnomalies(mergedPRs: PRMetrics[], stages: FlowStageMetrics[]): FlowAnomaly[] {
    const anomalies: FlowAnomaly[] = [];

    for (const stage of stages) {
      // Check for slow stages (> 2x median)
      const slowPRs = mergedPRs.filter(p => {
        if (stage.stage === 'First Review') return p.timeToFirstReview && p.timeToFirstReview > stage.medianTime * 2;
        if (stage.stage === 'Approval') return p.timeToApproval && p.timeToApproval > stage.medianTime * 2;
        if (stage.stage === 'Merge') return p.timeToMerge && p.timeToMerge > stage.medianTime * 2;
        return false;
      });

      if (slowPRs.length > mergedPRs.length * 0.1) { // More than 10% of PRs
        anomalies.push({
          stage: stage.stage,
          type: 'slow',
          severity: 'high',
          description: `${slowPRs.length} PRs took more than 2x median time in ${stage.stage} stage`,
          affectedPRCount: slowPRs.length
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate trends from history
   */
  private calculateTrends(stages: FlowStageMetrics[], history: FlowStageMetrics[][]): FlowStageMetrics[] {
    return stages.map(stage => {
      if (history.length < 2) {
        return { ...stage, trend: 'stable', trendPercentage: 0 };
      }

      const recent = history.slice(-7);
      const older = history.slice(-14, -7);

      const recentStage = recent.find(s => s.find(st => st.stage === stage.stage));
      const olderStage = older.length > 0 ? older.find(s => s.find(st => st.stage === stage.stage)) : null;

      if (!recentStage || !olderStage) {
        return { ...stage, trend: 'stable', trendPercentage: 0 };
      }

      const recentMedian = recentStage.find(st => st.stage === stage.stage)?.medianTime || 0;
      const olderMedian = olderStage.find(st => st.stage === stage.stage)?.medianTime || recentMedian;

      const percentageChange = olderMedian > 0
        ? ((recentMedian - olderMedian) / olderMedian) * 100
        : 0;

      let trend: 'improving' | 'stable' | 'degrading' = 'stable';
      if (percentageChange < -5) {
        trend = 'improving';
      } else if (percentageChange > 5) {
        trend = 'degrading';
      }

      return {
        ...stage,
        trend,
        trendPercentage: Math.round(percentageChange * 100) / 100
      };
    });
  }

  /**
   * Helper: Calculate median
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  /**
   * Helper: Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  /**
   * Helper: Calculate percentage of total time
   */
  private calculatePercentage(stageTimes: number[], allPRs: PRMetrics[]): number {
    const totalTime = allPRs.reduce((sum, p) => sum + p.totalCycleTime, 0);
    const stageTotal = stageTimes.reduce((sum, t) => sum + t, 0);
    return totalTime > 0 ? (stageTotal / totalTime) * 100 : 0;
  }

  /**
   * Create empty flow breakdown
   */
  private createEmptyFlowBreakdown(timestamp: Date, team: string, org: string, repo: string): FlowBreakdown {
    return {
      timestamp,
      team,
      org,
      repo,
      stages: [],
      totalMedianCycleTime: 0,
      longestStage: 'N/A',
      longestStageDuration: 0,
      anomalies: []
    };
  }

  /**
   * Clear history for a repository
   */
  clearHistory(org: string, repo: string): void {
    const historyKey = `${org}/${repo}`;
    this.stageHistory.delete(historyKey);
  }
}

