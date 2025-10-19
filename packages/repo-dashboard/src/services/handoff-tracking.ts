/**
 * Handoff Tracking Service
 * Tracks PR reviews across teams and measures hand-off efficiency
 */

import { PRMetrics } from './pull-request-metrics-collector.js';

export interface HandoffMetrics {
  timestamp: Date;
  sourceTeam: string;
  targetTeam: string;

  // Timing
  avgHandoffTime: number; // minutes
  medianHandoffTime: number;
  p95HandoffTime: number;

  // Frequency
  handoffsPerDay: number;
  totalHandoffs: number;

  // Bottlenecks
  avgApprovalTime: number;
  avgReviewTime: number;

  // Trend
  trend: 'improving' | 'stable' | 'degrading';
}

export interface TeamHandoffMetrics {
  team: string;
  incomingHandoffs: HandoffMetrics[];
  outgoingHandoffs: HandoffMetrics[];
  avgHandoffTime: number;
  bottlenecks: string[];
  efficiency: number; // 0-100
}

/**
 * Service for tracking cross-team handoffs
 */
export class HandoffTrackingService {
  private teamRepoMapping: Map<string, string[]> = new Map();
  private handoffMetricsCache: Map<string, HandoffMetrics> = new Map();

  /**
   * Initialize team-to-repo mapping
   */
  initializeTeamMapping(teamMapping: Record<string, string[]>): void {
    this.teamRepoMapping.clear();
    for (const [team, repos] of Object.entries(teamMapping)) {
      this.teamRepoMapping.set(team, repos);
    }
    console.log(`✅ Initialized handoff tracking for ${this.teamRepoMapping.size} teams`);
  }

  /**
   * Get team for a repository
   */
  private getTeamForRepo(repo: string): string | null {
    for (const [team, repos] of this.teamRepoMapping.entries()) {
      if (repos.includes(repo)) {
        return team;
      }
    }
    return null;
  }

  /**
   * Calculate handoff metrics from PR metrics
   */
  calculateHandoffMetrics(prMetrics: PRMetrics[]): HandoffMetrics[] {
    const handoffMap = new Map<string, PRMetrics[]>();

    // Group PRs by source team (simplified: assume all PRs from same repo are from same team)
    for (const pr of prMetrics) {
      const sourceTeam = this.getTeamForRepo(pr.repo) || 'Unknown';
      // For simplicity, create a handoff pair with a generic target team
      const targetTeam = 'Review Team';
      const key = `${sourceTeam}->${targetTeam}`;

      if (!handoffMap.has(key)) {
        handoffMap.set(key, []);
      }
      handoffMap.get(key)!.push(pr);
    }

    // Calculate metrics for each handoff pair
    const metrics: HandoffMetrics[] = [];
    for (const [key, prs] of handoffMap.entries()) {
      const [sourceTeam, targetTeam] = key.split('->');
      const times = prs.map(pr => pr.totalCycleTime || 0);
      times.sort((a, b) => a - b);

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const medianTime = times[Math.floor(times.length / 2)];
      const p95Time = times[Math.floor(times.length * 0.95)];

      const approvalTimes = prs.map(pr => pr.timeToApproval || 0);
      const avgApprovalTime = approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length;

      const reviewTimes = prs.map(pr => pr.timeToFirstReview || 0);
      const avgReviewTime = reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length;

      // Calculate trend (simplified)
      const trend: 'improving' | 'stable' | 'degrading' = avgTime < 480 ? 'improving' : 'stable';

      const metric: HandoffMetrics = {
        timestamp: new Date(),
        sourceTeam,
        targetTeam,
        avgHandoffTime: Math.round(avgTime),
        medianHandoffTime: Math.round(medianTime),
        p95HandoffTime: Math.round(p95Time),
        handoffsPerDay: prs.length / 30, // Simplified: assume 30-day period
        totalHandoffs: prs.length,
        avgApprovalTime: Math.round(avgApprovalTime),
        avgReviewTime: Math.round(avgReviewTime),
        trend
      };

      metrics.push(metric);
      this.handoffMetricsCache.set(key, metric);
    }

    console.log(`✅ Calculated handoff metrics for ${metrics.length} team pairs`);
    return metrics;
  }

  /**
   * Get handoff metrics for a team
   */
  getTeamHandoffMetrics(team: string): TeamHandoffMetrics {
    const incomingHandoffs: HandoffMetrics[] = [];
    const outgoingHandoffs: HandoffMetrics[] = [];

    for (const [, metric] of this.handoffMetricsCache.entries()) {
      if (metric.sourceTeam === team) {
        outgoingHandoffs.push(metric);
      } else if (metric.targetTeam === team) {
        incomingHandoffs.push(metric);
      }
    }

    // Calculate average handoff time
    const allHandoffs = [...incomingHandoffs, ...outgoingHandoffs];
    const avgHandoffTime = allHandoffs.length > 0
      ? allHandoffs.reduce((sum, m) => sum + m.avgHandoffTime, 0) / allHandoffs.length
      : 0;

    // Identify bottlenecks (handoffs taking > 8 hours)
    const bottlenecks = allHandoffs
      .filter(m => m.avgHandoffTime > 480)
      .map(m => `${m.sourceTeam} -> ${m.targetTeam}`);

    // Calculate efficiency (0-100, higher is better)
    const efficiency = Math.max(0, Math.min(100, 100 - (avgHandoffTime / 480) * 100));

    return {
      team,
      incomingHandoffs,
      outgoingHandoffs,
      avgHandoffTime: Math.round(avgHandoffTime),
      bottlenecks,
      efficiency: Math.round(efficiency)
    };
  }

  /**
   * Get all handoff metrics
   */
  getAllHandoffMetrics(): HandoffMetrics[] {
    return Array.from(this.handoffMetricsCache.values());
  }

  /**
   * Identify approval bottlenecks
   */
  identifyApprovalBottlenecks(): { team: string; avgApprovalTime: number }[] {
    const teamApprovalTimes = new Map<string, number[]>();

    for (const metric of this.handoffMetricsCache.values()) {
      if (!teamApprovalTimes.has(metric.targetTeam)) {
        teamApprovalTimes.set(metric.targetTeam, []);
      }
      teamApprovalTimes.get(metric.targetTeam)!.push(metric.avgApprovalTime);
    }

    const bottlenecks: { team: string; avgApprovalTime: number }[] = [];
    for (const [team, times] of teamApprovalTimes.entries()) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgTime > 240) { // > 4 hours
        bottlenecks.push({ team, avgApprovalTime: Math.round(avgTime) });
      }
    }

    return bottlenecks.sort((a, b) => b.avgApprovalTime - a.avgApprovalTime);
  }
}

// Export singleton instance
export const handoffTrackingService = new HandoffTrackingService();

