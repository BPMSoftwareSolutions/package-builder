/**
 * Constraint Detection Service
 * Identifies bottlenecks and constraints in the value stream using statistical analysis
 */

import { FlowStageMetrics } from './flow-stage-analyzer.js';

export interface Constraint {
  id: string;
  stage: string;
  team: string;
  severity: 'critical' | 'high' | 'medium' | 'low';

  // Metrics
  medianTime: number; // minutes
  p95Time: number;
  p99Time: number;

  // Comparison
  previousMedianTime: number;
  percentageIncrease: number;

  // Trend
  trend: 'improving' | 'stable' | 'degrading';

  // Root cause
  rootCause?: string;
  affectedPRCount: number;

  // Recommendations
  recommendations: string[];

  // Metadata
  detectedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface ConstraintRadarData {
  timestamp: Date;
  team: string;
  org: string;
  repo: string;

  // Constraints
  constraints: Constraint[];
  primaryConstraint?: Constraint;
  secondaryConstraints: Constraint[];

  // Overall metrics
  constraintScore: number; // 0-100, higher is worse
  healthScore: number; // 0-100, higher is better
}

export class ConstraintDetectionService {
  private constraintHistory: Map<string, Constraint[]> = new Map();
  private readonly maxHistoryPoints = 100;
  private readonly thresholds = {
    criticalPercentile: 99,
    highPercentile: 95,
    mediumPercentile: 75,
    degradationThreshold: 20 // % increase to flag as degrading
  };

  /**
   * Detect constraints from flow stage metrics
   */
  detectConstraints(
    org: string,
    team: string,
    repo: string,
    stages: FlowStageMetrics[],
    prCount: number = 0
  ): ConstraintRadarData {
    const timestamp = new Date();
    const historyKey = `${org}/${team}/${repo}`;

    const constraints: Constraint[] = [];

    // Analyze each stage for constraints
    for (const stage of stages) {
      const constraint = this.analyzeStage(stage, team, org, repo, prCount);
      if (constraint) {
        constraints.push(constraint);
      }
    }

    // Sort by severity
    constraints.sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity));

    // Update history
    if (!this.constraintHistory.has(historyKey)) {
      this.constraintHistory.set(historyKey, []);
    }
    const history = this.constraintHistory.get(historyKey)!;
    history.push(...constraints);

    if (history.length > this.maxHistoryPoints) {
      history.splice(0, history.length - this.maxHistoryPoints);
    }

    // Calculate scores
    const constraintScore = this.calculateConstraintScore(constraints);
    const healthScore = 100 - constraintScore;

    const radarData: ConstraintRadarData = {
      timestamp,
      team,
      org,
      repo,
      constraints,
      primaryConstraint: constraints[0],
      secondaryConstraints: constraints.slice(1),
      constraintScore,
      healthScore
    };

    return radarData;
  }

  /**
   * Analyze a single stage for constraints
   */
  private analyzeStage(
    stage: FlowStageMetrics,
    team: string,
    org: string,
    repo: string,
    prCount: number
  ): Constraint | null {
    // Determine severity based on percentiles
    // Only flag as constraint if p95 is significantly high
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';

    if (stage.p95Time > 600) {
      severity = 'critical';
    } else if (stage.p95Time > 300) {
      severity = 'high';
    } else if (stage.medianTime > 240 && stage.p95Time > 240) {
      severity = 'medium';
    }

    // Calculate percentage increase from previous
    const percentageIncrease = stage.trendPercentage || 0;

    // Adjust severity based on trend
    if (stage.trend === 'degrading' && percentageIncrease > this.thresholds.degradationThreshold) {
      if (severity === 'low') severity = 'medium';
      else if (severity === 'medium') severity = 'high';
      else if (severity === 'high') severity = 'critical';
    }

    // Only return constraint if severity is at least medium
    if (severity === 'low') {
      return null;
    }

    const constraint: Constraint = {
      id: `${org}/${repo}/${stage.stage}/${Date.now()}-${Math.random()}`,
      stage: stage.stage,
      team,
      severity,
      medianTime: stage.medianTime,
      p95Time: stage.p95Time,
      p99Time: stage.p95Time * 1.2, // Estimate p99 as 1.2x p95
      previousMedianTime: stage.medianTime / (1 + percentageIncrease / 100),
      percentageIncrease,
      trend: stage.trend,
      affectedPRCount: prCount,
      recommendations: this.generateRecommendations(stage, severity),
      detectedAt: new Date()
    };

    return constraint;
  }

  /**
   * Generate recommendations for a constraint
   */
  private generateRecommendations(stage: FlowStageMetrics, severity: string): string[] {
    const recommendations: string[] = [];

    if (stage.stage === 'First Review') {
      recommendations.push('Increase reviewer availability');
      recommendations.push('Implement automated code review tools');
      recommendations.push('Set SLA for first review (e.g., 4 hours)');
    } else if (stage.stage === 'Approval') {
      recommendations.push('Reduce approval requirements');
      recommendations.push('Implement approval automation');
      recommendations.push('Clarify approval criteria');
    } else if (stage.stage === 'Merge') {
      recommendations.push('Automate merge process');
      recommendations.push('Reduce merge conflicts');
      recommendations.push('Implement auto-merge for approved PRs');
    }

    if (stage.trend === 'degrading') {
      recommendations.push('Investigate recent changes affecting this stage');
      recommendations.push('Review team capacity and workload');
    }

    if (severity === 'critical') {
      recommendations.push('Escalate to team lead immediately');
      recommendations.push('Consider temporary process changes');
    }

    return recommendations;
  }

  /**
   * Calculate overall constraint score (0-100, higher is worse)
   */
  private calculateConstraintScore(constraints: Constraint[]): number {
    if (constraints.length === 0) return 0;

    const severityScores = constraints.map(c => this.getSeverityScore(c.severity));
    const avgScore = severityScores.reduce((a, b) => a + b, 0) / severityScores.length;

    // Scale to 0-100
    return Math.min(100, Math.round(avgScore * 25));
  }

  /**
   * Get numeric score for severity
   */
  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'critical':
        return 4;
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
      default:
        return 1;
    }
  }

  /**
   * Get constraint history for a team
   */
  getConstraintHistory(org: string, team: string, repo: string): Constraint[] {
    const historyKey = `${org}/${team}/${repo}`;
    return this.constraintHistory.get(historyKey) || [];
  }

  /**
   * Clear history for a repository
   */
  clearHistory(org: string, team: string, repo: string): void {
    const historyKey = `${org}/${team}/${repo}`;
    this.constraintHistory.delete(historyKey);
  }
}

