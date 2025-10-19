/**
 * Knowledge Sharing Service
 * Tracks knowledge distribution and identifies knowledge gaps
 */

export interface KnowledgeSharingMetrics {
  timestamp: Date;
  team: string;
  org: string;

  // Documentation
  documentationUpdates: number;
  documentationCoverage: number; // 0-1

  // Code review
  reviewParticipants: number;
  avgReviewersPerPR: number;
  reviewCoverage: number; // 0-1

  // Knowledge sharing
  knowledgeSharingEvents: number;
  pairProgrammingSessions: number;

  // Trend
  trend: 'improving' | 'stable' | 'degrading';
  trendPercentage: number;

  // Recommendations
  recommendations: string[];
}

export interface KnowledgeSharingDataPoint {
  timestamp: Date;
  documentationUpdates: number;
  reviewParticipants: number;
  avgReviewersPerPR: number;
  knowledgeSharingEvents: number;
}

export class KnowledgeSharingService {
  private sharingHistory: Map<string, KnowledgeSharingDataPoint[]> = new Map();
  private readonly maxHistoryPoints = 100;

  /**
   * Calculate knowledge sharing metrics for a team
   */
  async calculateMetrics(
    org: string,
    team: string,
    prMetrics: Array<{ reviewers: string[] }> = [],
    documentationUpdates: number = 0,
    knowledgeSharingEvents: number = 0,
    pairProgrammingSessions: number = 0
  ): Promise<KnowledgeSharingMetrics> {
    const timestamp = new Date();
    const historyKey = `${org}/${team}`;

    try {
      // Calculate review metrics
      const reviewParticipants = new Set<string>();
      let totalReviewers = 0;

      for (const pr of prMetrics) {
        pr.reviewers.forEach(r => reviewParticipants.add(r));
        totalReviewers += pr.reviewers.length;
      }

      const avgReviewersPerPR = prMetrics.length > 0 ? totalReviewers / prMetrics.length : 0;
      const reviewCoverage = reviewParticipants.size > 0 ? Math.min(1, reviewParticipants.size / 10) : 0;

      // Documentation coverage (0-1 scale)
      const documentationCoverage = Math.min(1, documentationUpdates / 10);

      // Store data point
      const dataPoint: KnowledgeSharingDataPoint = {
        timestamp,
        documentationUpdates,
        reviewParticipants: reviewParticipants.size,
        avgReviewersPerPR,
        knowledgeSharingEvents
      };

      if (!this.sharingHistory.has(historyKey)) {
        this.sharingHistory.set(historyKey, []);
      }
      const history = this.sharingHistory.get(historyKey)!;
      history.push(dataPoint);

      if (history.length > this.maxHistoryPoints) {
        history.shift();
      }

      // Calculate trend
      const { trend, trendPercentage } = this.calculateTrend(history);

      // Generate recommendations
      const recommendations: string[] = [];
      if (reviewCoverage < 0.3) {
        recommendations.push('Low code review participation. Encourage more team members to participate in reviews.');
      }
      if (documentationCoverage < 0.3) {
        recommendations.push('Low documentation updates. Increase documentation efforts.');
      }
      if (knowledgeSharingEvents < 2) {
        recommendations.push('Few knowledge sharing events. Schedule regular team learning sessions.');
      }
      if (pairProgrammingSessions < 1) {
        recommendations.push('No pair programming sessions. Consider implementing pair programming practices.');
      }

      const metrics: KnowledgeSharingMetrics = {
        timestamp,
        team,
        org,
        documentationUpdates,
        documentationCoverage: Math.round(documentationCoverage * 100) / 100,
        reviewParticipants: reviewParticipants.size,
        avgReviewersPerPR: Math.round(avgReviewersPerPR * 100) / 100,
        reviewCoverage: Math.round(reviewCoverage * 100) / 100,
        knowledgeSharingEvents,
        pairProgrammingSessions,
        trend,
        trendPercentage,
        recommendations
      };

      return metrics;
    } catch (error) {
      console.error(`❌ Error calculating knowledge sharing metrics for ${historyKey}:`, error);
      throw error;
    }
  }

  /**
   * Calculate trend from history
   */
  private calculateTrend(history: KnowledgeSharingDataPoint[]): { trend: 'improving' | 'stable' | 'degrading'; trendPercentage: number } {
    if (history.length < 2) {
      return { trend: 'stable', trendPercentage: 0 };
    }

    const recent = history.slice(-7);
    const older = history.slice(-14, -7);

    const recentAvg = recent.reduce((sum, p) => sum + p.reviewParticipants, 0) / recent.length;
    const olderAvg = older.length > 0
      ? older.reduce((sum, p) => sum + p.reviewParticipants, 0) / older.length
      : recentAvg;

    const percentageChange = olderAvg > 0
      ? ((recentAvg - olderAvg) / olderAvg) * 100
      : 0;

    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (percentageChange > 5) {
      trend = 'improving';
    } else if (percentageChange < -5) {
      trend = 'degrading';
    }

    return {
      trend,
      trendPercentage: Math.round(percentageChange * 100) / 100
    };
  }

  /**
   * Get history
   */
  getHistory(org: string, team: string): KnowledgeSharingDataPoint[] {
    const historyKey = `${org}/${team}`;
    return this.sharingHistory.get(historyKey) || [];
  }

  /**
   * Clear history
   */
  clearHistory(org: string, team: string): void {
    const historyKey = `${org}/${team}`;
    this.sharingHistory.delete(historyKey);
  }
}

