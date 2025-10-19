/**
 * Code Ownership Service
 * Calculates code ownership metrics and tracks ownership changes
 */

export interface FileOwnership {
  file: string;
  owner: string;
  commits: number;
  lastModified: Date;
  reviewCoverage: number; // 0-1
}

export interface CodeOwnershipMetrics {
  timestamp: Date;
  team: string;
  repo: string;
  org: string;

  // Ownership concentration
  ownershipConcentration: number; // 0-1, higher = more concentrated
  topOwners: Array<{ name: string; ownership: number }>;

  // Orphaned code
  orphanedFiles: FileOwnership[];
  orphanedPercentage: number;

  // Review coverage
  avgReviewCoverage: number; // 0-1
  filesWithoutReview: number;

  // Recommendations
  recommendations: string[];
}

export class CodeOwnershipService {
  private ownershipHistory: Map<string, CodeOwnershipMetrics[]> = new Map();
  private readonly maxHistoryPoints = 100;

  /**
   * Calculate code ownership metrics
   */
  async calculateOwnership(
    org: string,
    team: string,
    repo: string,
    commitHistory: Array<{ author: string; files: string[] }> = [],
    reviewData: Array<{ file: string; reviewers: string[] }> = []
  ): Promise<CodeOwnershipMetrics> {
    const timestamp = new Date();
    const historyKey = `${org}/${team}/${repo}`;

    try {
      // Calculate file ownership
      const fileOwnership = new Map<string, { owner: string; commits: number; lastModified: Date }>();

      for (const commit of commitHistory) {
        for (const file of commit.files) {
          if (!fileOwnership.has(file)) {
            fileOwnership.set(file, { owner: commit.author, commits: 0, lastModified: new Date() });
          }
          const ownership = fileOwnership.get(file)!;
          ownership.commits++;
          ownership.lastModified = new Date();
        }
      }

      // Calculate ownership concentration
      const ownershipCounts = new Map<string, number>();
      for (const [_, ownership] of fileOwnership) {
        const count = ownershipCounts.get(ownership.owner) || 0;
        ownershipCounts.set(ownership.owner, count + 1);
      }

      const totalFiles = fileOwnership.size || 1;
      const maxOwnership = Math.max(...Array.from(ownershipCounts.values()), 1);
      const ownershipConcentration = maxOwnership / totalFiles;

      // Get top owners
      const topOwners = Array.from(ownershipCounts.entries())
        .map(([name, count]) => ({ name, ownership: count / totalFiles }))
        .sort((a, b) => b.ownership - a.ownership)
        .slice(0, 5);

      // Calculate review coverage
      const reviewMap = new Map<string, Set<string>>();
      for (const review of reviewData) {
        if (!reviewMap.has(review.file)) {
          reviewMap.set(review.file, new Set());
        }
        review.reviewers.forEach(r => reviewMap.get(review.file)!.add(r));
      }

      const filesWithReview = Array.from(reviewMap.values()).filter(r => r.size > 0).length;
      const avgReviewCoverage = totalFiles > 0 ? filesWithReview / totalFiles : 0;
      const filesWithoutReview = totalFiles - filesWithReview;

      // Identify orphaned files (single owner, no reviews)
      const orphanedFiles: FileOwnership[] = [];
      for (const [file, ownership] of fileOwnership) {
        const reviewers = reviewMap.get(file)?.size || 0;
        if (reviewers === 0) {
          orphanedFiles.push({
            file,
            owner: ownership.owner,
            commits: ownership.commits,
            lastModified: ownership.lastModified,
            reviewCoverage: 0
          });
        }
      }

      const orphanedPercentage = totalFiles > 0 ? (orphanedFiles.length / totalFiles) * 100 : 0;

      // Generate recommendations
      const recommendations: string[] = [];
      if (ownershipConcentration > 0.5) {
        recommendations.push('High ownership concentration. Distribute code ownership more evenly.');
      }
      if (avgReviewCoverage < 0.5) {
        recommendations.push('Low review coverage. Increase code review participation.');
      }
      if (orphanedPercentage > 30) {
        recommendations.push(`${Math.round(orphanedPercentage)}% of files lack reviews. Improve review coverage.`);
      }

      const metrics: CodeOwnershipMetrics = {
        timestamp,
        team,
        repo,
        org,
        ownershipConcentration: Math.round(ownershipConcentration * 100) / 100,
        topOwners,
        orphanedFiles: orphanedFiles.slice(0, 10),
        orphanedPercentage: Math.round(orphanedPercentage * 100) / 100,
        avgReviewCoverage: Math.round(avgReviewCoverage * 100) / 100,
        filesWithoutReview,
        recommendations
      };

      // Store in history
      if (!this.ownershipHistory.has(historyKey)) {
        this.ownershipHistory.set(historyKey, []);
      }
      const history = this.ownershipHistory.get(historyKey)!;
      history.push(metrics);

      if (history.length > this.maxHistoryPoints) {
        history.shift();
      }

      return metrics;
    } catch (error) {
      console.error(`❌ Error calculating code ownership for ${historyKey}:`, error);
      throw error;
    }
  }

  /**
   * Get history
   */
  getHistory(org: string, team: string, repo: string): CodeOwnershipMetrics[] {
    const historyKey = `${org}/${team}/${repo}`;
    return this.ownershipHistory.get(historyKey) || [];
  }

  /**
   * Clear history
   */
  clearHistory(org: string, team: string, repo: string): void {
    const historyKey = `${org}/${team}/${repo}`;
    this.ownershipHistory.delete(historyKey);
  }
}

