/**
 * Root Cause Analysis Service
 * Correlates constraints with events and generates actionable recommendations
 */

import { Constraint } from './constraint-detection.js';
import { PRMetrics } from './pull-request-metrics-collector.js';

export interface RootCauseAnalysis {
  constraintId: string;
  stage: string;
  team: string;

  // Root cause analysis
  primaryCause?: string;
  secondaryCauses: string[];
  confidence: number; // 0-1

  // Correlated events
  correlatedEvents: CorrelatedEvent[];

  // Affected PRs
  affectedPRs: string[];
  failurePatterns: FailurePattern[];

  // Actionable insights
  immediateActions: string[];
  longTermImprovements: string[];

  // Metadata
  analyzedAt: Date;
}

export interface CorrelatedEvent {
  type: 'deployment' | 'incident' | 'config_change' | 'team_change';
  description: string;
  timestamp: Date;
  correlation: number; // 0-1
}

export interface FailurePattern {
  pattern: string;
  frequency: number; // count
  percentage: number; // % of affected PRs
  severity: 'low' | 'medium' | 'high';
}

export class RootCauseAnalysisService {
  /**
   * Analyze root causes for a constraint
   */
  analyzeRootCauses(
    constraint: Constraint,
    affectedPRs: PRMetrics[],
    recentEvents: CorrelatedEvent[] = []
  ): RootCauseAnalysis {
    // Determine primary cause first
    const causes = this.determineCauses(constraint, affectedPRs, recentEvents);

    const analysis: RootCauseAnalysis = {
      constraintId: constraint.id,
      stage: constraint.stage,
      team: constraint.team,
      primaryCause: causes.primary,
      secondaryCauses: causes.secondary,
      confidence: causes.confidence,
      correlatedEvents: recentEvents,
      affectedPRs: affectedPRs.map(pr => pr.prId),
      failurePatterns: this.identifyFailurePatterns(affectedPRs, constraint.stage),
      immediateActions: [],
      longTermImprovements: [],
      analyzedAt: new Date()
    };

    // Generate recommendations
    analysis.immediateActions = this.generateImmediateActions(constraint, causes.primary);
    analysis.longTermImprovements = this.generateLongTermImprovements(constraint, causes.secondary);

    return analysis;
  }

  /**
   * Determine root causes
   */
  private determineCauses(
    constraint: Constraint,
    affectedPRs: PRMetrics[],
    events: CorrelatedEvent[]
  ): { primary?: string; secondary: string[]; confidence: number } {
    const causes: string[] = [];
    let confidence = 0.5;

    // Check for correlated events
    if (events.length > 0) {
      const topEvent = events.sort((a, b) => b.correlation - a.correlation)[0];
      if (topEvent.correlation > 0.7) {
        causes.push(`Recent ${topEvent.type}: ${topEvent.description}`);
        confidence = Math.min(1, confidence + 0.2);
      }
    }

    // Analyze PR patterns
    if (affectedPRs.length > 0) {
      const avgSize = affectedPRs.reduce((sum, pr) => sum + pr.filesChanged, 0) / affectedPRs.length;
      if (avgSize > 20) {
        causes.push('Large PR size causing longer review times');
        confidence = Math.min(1, confidence + 0.15);
      }

      const avgAuthorCount = new Set(affectedPRs.map(pr => pr.author)).size;
      if (avgAuthorCount === 1) {
        causes.push('Single author bottleneck - consider load balancing');
        confidence = Math.min(1, confidence + 0.1);
      }
    }

    // Stage-specific analysis
    if (constraint.stage === 'First Review') {
      causes.push('Reviewer availability or capacity constraints');
    } else if (constraint.stage === 'Approval') {
      causes.push('Approval process complexity or unclear criteria');
    } else if (constraint.stage === 'Merge') {
      causes.push('Merge conflicts or CI/CD pipeline delays');
    }

    return {
      primary: causes[0],
      secondary: causes.slice(1),
      confidence: Math.min(1, confidence)
    };
  }

  /**
   * Identify failure patterns in affected PRs
   */
  private identifyFailurePatterns(affectedPRs: PRMetrics[], _stage: string): FailurePattern[] {
    const patterns: FailurePattern[] = [];

    if (affectedPRs.length === 0) {
      return patterns;
    }

    // Pattern 1: Large PRs
    const largePRs = affectedPRs.filter(pr => pr.filesChanged > 20);
    if (largePRs.length > 0) {
      patterns.push({
        pattern: 'Large PR size (>20 files)',
        frequency: largePRs.length,
        percentage: (largePRs.length / affectedPRs.length) * 100,
        severity: 'high'
      });
    }

    // Pattern 2: High churn
    const highChurnPRs = affectedPRs.filter(pr => (pr.additions + pr.deletions) > 500);
    if (highChurnPRs.length > 0) {
      patterns.push({
        pattern: 'High code churn (>500 lines)',
        frequency: highChurnPRs.length,
        percentage: (highChurnPRs.length / affectedPRs.length) * 100,
        severity: 'medium'
      });
    }

    // Pattern 3: Specific authors
    const authorCounts = new Map<string, number>();
    affectedPRs.forEach(pr => {
      authorCounts.set(pr.author, (authorCounts.get(pr.author) || 0) + 1);
    });

    for (const [author, count] of authorCounts.entries()) {
      if (count > affectedPRs.length * 0.3) {
        patterns.push({
          pattern: `Author concentration: ${author}`,
          frequency: count,
          percentage: (count / affectedPRs.length) * 100,
          severity: 'medium'
        });
      }
    }

    return patterns;
  }

  /**
   * Generate immediate actions
   */
  private generateImmediateActions(constraint: Constraint, primaryCause?: string): string[] {
    const actions: string[] = [];

    if (primaryCause?.includes('Large PR')) {
      actions.push('Request PR authors to split large PRs into smaller chunks');
      actions.push('Implement PR size limits in CI/CD');
    }

    if (primaryCause?.includes('Reviewer')) {
      actions.push('Notify team leads about reviewer capacity');
      actions.push('Temporarily reduce PR approval requirements');
    }

    if (primaryCause?.includes('Merge')) {
      actions.push('Enable auto-merge for approved PRs');
      actions.push('Investigate CI/CD pipeline performance');
    }

    if (constraint.severity === 'critical') {
      actions.push('Schedule emergency team sync');
      actions.push('Assign dedicated resources to unblock PRs');
    }

    return actions;
  }

  /**
   * Generate long-term improvements
   */
  private generateLongTermImprovements(constraint: Constraint, _secondaryCauses: string[]): string[] {
    const improvements: string[] = [];

    improvements.push('Implement automated code review tools');
    improvements.push('Establish clear PR review SLAs');
    improvements.push('Conduct team training on efficient code review');
    improvements.push('Implement pair programming for complex changes');
    improvements.push('Automate repetitive review comments');

    if (constraint.stage === 'First Review') {
      improvements.push('Rotate reviewer assignments to balance load');
      improvements.push('Implement review queue management');
    } else if (constraint.stage === 'Approval') {
      improvements.push('Simplify approval process');
      improvements.push('Implement risk-based approval rules');
    } else if (constraint.stage === 'Merge') {
      improvements.push('Improve CI/CD pipeline performance');
      improvements.push('Implement conflict resolution automation');
    }

    return improvements;
  }
}

