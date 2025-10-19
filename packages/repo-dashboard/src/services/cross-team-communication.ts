/**
 * Cross-Team Communication Service
 * Tracks cross-team issues, measures response times, and identifies communication patterns
 */

import { Issue } from '../types.js';

export interface CrossTeamIssue {
  issueNumber: number;
  title: string;
  sourceTeam: string;
  targetTeam: string;
  createdAt: Date;
  resolvedAt?: Date;
  responseTime: number; // minutes
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface CommunicationMetrics {
  sourceTeam: string;
  targetTeam: string;
  totalIssues: number;
  avgResponseTime: number; // minutes
  medianResponseTime: number;
  resolutionRate: number; // 0-1
  communicationFrequency: number; // issues per day
}

export interface TeamCommunicationPattern {
  team: string;
  incomingCommunication: CommunicationMetrics[];
  outgoingCommunication: CommunicationMetrics[];
  avgResponseTime: number;
  recommendations: string[];
}

/**
 * Service for tracking cross-team communication
 */
export class CrossTeamCommunicationService {
  private teamRepoMapping: Map<string, string[]> = new Map();
  private crossTeamIssuesCache: Map<string, CrossTeamIssue> = new Map();
  private communicationMetricsCache: Map<string, CommunicationMetrics> = new Map();

  /**
   * Initialize team-to-repo mapping
   */
  initializeTeamMapping(teamMapping: Record<string, string[]>): void {
    this.teamRepoMapping.clear();
    for (const [team, repos] of Object.entries(teamMapping)) {
      this.teamRepoMapping.set(team, repos);
    }
    console.log(`✅ Initialized communication tracking for ${this.teamRepoMapping.size} teams`);
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
   * Track cross-team issue
   */
  trackCrossTeamIssue(
    issue: Issue,
    sourceRepo: string,
    targetRepo: string,
    responseTime: number
  ): CrossTeamIssue | null {
    const sourceTeam = this.getTeamForRepo(sourceRepo);
    const targetTeam = this.getTeamForRepo(targetRepo);

    if (!sourceTeam || !targetTeam || sourceTeam === targetTeam) {
      return null;
    }

    const crossTeamIssue: CrossTeamIssue = {
      issueNumber: issue.number,
      title: issue.title,
      sourceTeam,
      targetTeam,
      createdAt: new Date(issue.createdAt),
      responseTime,
      status: issue.state === 'closed' ? 'resolved' : 'open',
      priority: this.determinePriority(issue.title)
    };

    const key = `${sourceTeam}->${targetTeam}:${issue.number}`;
    this.crossTeamIssuesCache.set(key, crossTeamIssue);

    console.log(`✅ Tracked cross-team issue: ${sourceTeam} -> ${targetTeam}`);
    return crossTeamIssue;
  }

  /**
   * Determine issue priority from title
   */
  private determinePriority(title: string): 'critical' | 'high' | 'medium' | 'low' {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('critical') || lowerTitle.includes('blocker')) return 'critical';
    if (lowerTitle.includes('urgent') || lowerTitle.includes('high')) return 'high';
    if (lowerTitle.includes('low')) return 'low';
    return 'medium';
  }

  /**
   * Calculate communication metrics between two teams
   */
  calculateCommunicationMetrics(sourceTeam: string, targetTeam: string): CommunicationMetrics {
    const key = `${sourceTeam}->${targetTeam}`;
    const issues = Array.from(this.crossTeamIssuesCache.values()).filter(
      i => i.sourceTeam === sourceTeam && i.targetTeam === targetTeam
    );

    if (issues.length === 0) {
      return {
        sourceTeam,
        targetTeam,
        totalIssues: 0,
        avgResponseTime: 0,
        medianResponseTime: 0,
        resolutionRate: 0,
        communicationFrequency: 0
      };
    }

    const responseTimes = issues.map(i => i.responseTime).sort((a, b) => a - b);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const medianResponseTime = responseTimes[Math.floor(responseTimes.length / 2)];
    const resolvedCount = issues.filter(i => i.status === 'resolved').length;
    const resolutionRate = resolvedCount / issues.length;

    // Assume 30-day period
    const communicationFrequency = issues.length / 30;

    const metrics: CommunicationMetrics = {
      sourceTeam,
      targetTeam,
      totalIssues: issues.length,
      avgResponseTime: Math.round(avgResponseTime),
      medianResponseTime: Math.round(medianResponseTime),
      resolutionRate: Math.round(resolutionRate * 100) / 100,
      communicationFrequency: Math.round(communicationFrequency * 100) / 100
    };

    this.communicationMetricsCache.set(key, metrics);
    return metrics;
  }

  /**
   * Get communication pattern for a team
   */
  getTeamCommunicationPattern(team: string): TeamCommunicationPattern {
    const incomingCommunication: CommunicationMetrics[] = [];
    const outgoingCommunication: CommunicationMetrics[] = [];

    for (const [sourceTeam] of this.teamRepoMapping.entries()) {
      if (sourceTeam !== team) {
        const metrics = this.calculateCommunicationMetrics(sourceTeam, team);
        if (metrics.totalIssues > 0) {
          incomingCommunication.push(metrics);
        }

        const outMetrics = this.calculateCommunicationMetrics(team, sourceTeam);
        if (outMetrics.totalIssues > 0) {
          outgoingCommunication.push(outMetrics);
        }
      }
    }

    // Calculate average response time
    const allMetrics = [...incomingCommunication, ...outgoingCommunication];
    const avgResponseTime = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / allMetrics.length
      : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(incomingCommunication, outgoingCommunication);

    return {
      team,
      incomingCommunication,
      outgoingCommunication,
      avgResponseTime: Math.round(avgResponseTime),
      recommendations
    };
  }

  /**
   * Generate recommendations for improving communication
   */
  private generateRecommendations(
    incoming: CommunicationMetrics[],
    outgoing: CommunicationMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow response times
    const slowIncoming = incoming.filter(m => m.avgResponseTime > 480);
    if (slowIncoming.length > 0) {
      recommendations.push(`Improve response time to ${slowIncoming.map(m => m.sourceTeam).join(', ')}`);
    }

    // Check for low resolution rates
    const lowResolution = [...incoming, ...outgoing].filter(m => m.resolutionRate < 0.8);
    if (lowResolution.length > 0) {
      recommendations.push('Increase issue resolution rate');
    }

    // Check for high communication frequency
    const highFrequency = [...incoming, ...outgoing].filter(m => m.communicationFrequency > 1);
    if (highFrequency.length > 0) {
      recommendations.push('Consider consolidating frequent communications');
    }

    return recommendations;
  }

  /**
   * Get all cross-team issues
   */
  getAllCrossTeamIssues(): CrossTeamIssue[] {
    return Array.from(this.crossTeamIssuesCache.values());
  }

  /**
   * Get cross-team issues for a team
   */
  getTeamCrossTeamIssues(team: string): CrossTeamIssue[] {
    return Array.from(this.crossTeamIssuesCache.values()).filter(
      i => i.sourceTeam === team || i.targetTeam === team
    );
  }
}

// Export singleton instance
export const crossTeamCommunicationService = new CrossTeamCommunicationService();

