/**
 * Pull Request Metrics Collector Service
 * Collects and calculates PR cycle time metrics from GitHub
 */

import { fetchGitHub } from '../github.js';

export interface PRMetrics {
  prId: string;
  prNumber: number;
  repo: string;
  createdAt: Date;
  firstReviewAt?: Date;
  approvedAt?: Date;
  mergedAt?: Date;

  // Calculated fields (in minutes)
  timeToFirstReview?: number;
  timeToApproval?: number;
  timeToMerge?: number;
  totalCycleTime: number;

  // Size metrics
  filesChanged: number;
  additions: number;
  deletions: number;

  // Status
  status: 'open' | 'merged' | 'closed';
  author: string;
  title: string;
}

export interface PRMetricsCache {
  [repoKey: string]: {
    metrics: PRMetrics[];
    timestamp: number;
    ttl: number;
  };
}

export class PullRequestMetricsCollector {
  private cache: PRMetricsCache = {};
  private readonly cacheTTL = 3600000; // 1 hour in milliseconds

  /**
   * Collect PR metrics for a repository
   */
  async collectPRMetrics(org: string, repo: string, days: number = 30): Promise<PRMetrics[]> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached PR metrics for ${cacheKey}`);
      return this.cache[cacheKey].metrics;
    }

    console.log(`🔍 Collecting PR metrics for ${cacheKey}...`);

    const metrics: PRMetrics[] = [];
    const since = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Fetch all PRs (merged and closed) from the last N days
      const endpoint = `/repos/${org}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100&since=${since}`;
      const prs = await fetchGitHub<any[]>(endpoint);

      for (const pr of prs) {
        const metric = this.calculatePRMetrics(pr, org, repo);
        metrics.push(metric);
      }

      // Cache the results
      this.cache[cacheKey] = {
        metrics,
        timestamp: now,
        ttl: this.cacheTTL
      };

      console.log(`✅ Collected ${metrics.length} PR metrics for ${cacheKey}`);
      return metrics;
    } catch (error) {
      console.error(`❌ Error collecting PR metrics for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Calculate metrics for a single PR
   */
  private calculatePRMetrics(pr: any, org: string, repo: string): PRMetrics {
    const createdAt = new Date(pr.created_at);
    const mergedAt = pr.merged_at ? new Date(pr.merged_at) : undefined;
    const closedAt = pr.closed_at ? new Date(pr.closed_at) : undefined;

    // Calculate total cycle time
    let totalCycleTime = 0;
    if (mergedAt) {
      totalCycleTime = Math.round((mergedAt.getTime() - createdAt.getTime()) / 60000); // minutes
    } else if (closedAt) {
      totalCycleTime = Math.round((closedAt.getTime() - createdAt.getTime()) / 60000);
    } else {
      totalCycleTime = Math.round((Date.now() - createdAt.getTime()) / 60000);
    }

    return {
      prId: `${org}/${repo}#${pr.number}`,
      prNumber: pr.number,
      repo: `${org}/${repo}`,
      createdAt,
      mergedAt,
      totalCycleTime,
      filesChanged: pr.changed_files || 0,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      status: pr.merged_at ? 'merged' : (pr.state === 'open' ? 'open' : 'closed'),
      author: pr.user?.login || 'unknown',
      title: pr.title
    };
  }

  /**
   * Calculate aggregate PR metrics for a repository
   */
  async calculateAggregateMetrics(org: string, repo: string, days: number = 30): Promise<any> {
    const metrics = await this.collectPRMetrics(org, repo, days);

    if (metrics.length === 0) {
      return {
        repo: `${org}/${repo}`,
        prCount: 0,
        mergedCount: 0,
        avgCycleTime: 0,
        medianCycleTime: 0,
        avgTimeToFirstReview: 0,
        avgPRSize: 0
      };
    }

    const mergedMetrics = metrics.filter(m => m.status === 'merged');
    const cycleTimes = mergedMetrics.map(m => m.totalCycleTime).sort((a, b) => a - b);

    return {
      repo: `${org}/${repo}`,
      prCount: metrics.length,
      mergedCount: mergedMetrics.length,
      avgCycleTime: Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length),
      medianCycleTime: cycleTimes[Math.floor(cycleTimes.length / 2)],
      avgPRSize: Math.round(metrics.reduce((sum, m) => sum + m.filesChanged, 0) / metrics.length),
      avgAdditions: Math.round(metrics.reduce((sum, m) => sum + m.additions, 0) / metrics.length),
      avgDeletions: Math.round(metrics.reduce((sum, m) => sum + m.deletions, 0) / metrics.length)
    };
  }

  /**
   * Clear cache for a specific repository or all
   */
  clearCache(org?: string, repo?: string): void {
    if (org && repo) {
      const cacheKey = `${org}/${repo}`;
      delete this.cache[cacheKey];
      console.log(`🗑️ Cleared cache for ${cacheKey}`);
    } else {
      this.cache = {};
      console.log(`🗑️ Cleared all PR metrics cache`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    const entries = Object.entries(this.cache);
    return {
      totalEntries: entries.length,
      entries: entries.map(([key, value]) => ({
        key,
        metricsCount: value.metrics.length,
        age: Date.now() - value.timestamp,
        ttl: value.ttl
      }))
    };
  }
}

// Export singleton instance
export const prMetricsCollector = new PullRequestMetricsCollector();

