/**
 * Build Status Service
 * Monitors build failures in real-time and tracks build duration trends
 */

import { fetchGitHub } from '../github.js';

export interface BuildStatus {
  timestamp: Date;
  repo: string;
  buildId: string;

  // Status
  status: 'success' | 'failure' | 'cancelled' | 'running';
  duration: number; // seconds
  
  // Details
  failureReason?: string;
  failedStage?: string;
  
  // Flakiness
  isFlaky: boolean;
  flakinessScore: number; // 0-1
  
  // Trend
  trend: 'improving' | 'stable' | 'degrading';
}

export interface BuildStatusCache {
  [repoKey: string]: {
    statuses: BuildStatus[];
    timestamp: number;
    ttl: number;
  };
}

export class BuildStatusService {
  private cache: BuildStatusCache = {};
  private readonly cacheTTL = 300000; // 5 minutes in milliseconds
  private buildHistory: Map<string, BuildStatus[]> = new Map();

  /**
   * Collect build status for a repository
   */
  async collectBuildStatus(org: string, repo: string, _days: number = 7): Promise<BuildStatus[]> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached build status for ${cacheKey}`);
      return this.cache[cacheKey].statuses;
    }

    console.log(`🔍 Collecting build status for ${cacheKey}...`);

    const statuses: BuildStatus[] = [];

    try {
      // Fetch workflow runs from GitHub Actions
      const endpoint = `/repos/${org}/${repo}/actions/runs?per_page=100`;
      const response = await fetchGitHub<any>(`${endpoint}`);
      const runs = response.workflow_runs || [];

      for (const run of runs) {
        const status = this.calculateBuildStatus(run, org, repo);
        statuses.push(status);
      }

      // Calculate flakiness and trends
      this.calculateFlakiness(statuses);
      this.calculateTrends(statuses, cacheKey);

      // Cache the results
      this.cache[cacheKey] = {
        statuses,
        timestamp: now,
        ttl: this.cacheTTL
      };

      // Store in history
      this.buildHistory.set(cacheKey, statuses);

      console.log(`✅ Collected ${statuses.length} build statuses for ${cacheKey}`);
      return statuses;
    } catch (error) {
      console.error(`❌ Error collecting build status for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Calculate metrics for a single build
   */
  private calculateBuildStatus(run: any, org: string, repo: string): BuildStatus {
    const createdAt = new Date(run.created_at);
    const updatedAt = new Date(run.updated_at);
    const duration = Math.round((updatedAt.getTime() - createdAt.getTime()) / 1000);

    return {
      timestamp: createdAt,
      repo: `${org}/${repo}`,
      buildId: run.id.toString(),
      status: run.conclusion === 'success' ? 'success' : run.conclusion === 'failure' ? 'failure' : 'cancelled',
      duration,
      failureReason: run.conclusion === 'failure' ? 'Build failed' : undefined,
      failedStage: undefined,
      isFlaky: false,
      flakinessScore: 0,
      trend: 'stable'
    };
  }

  /**
   * Calculate flakiness score based on failure patterns
   */
  private calculateFlakiness(statuses: BuildStatus[]): void {
    const failureCount = statuses.filter(s => s.status === 'failure').length;
    const totalCount = statuses.length;
    
    for (const status of statuses) {
      if (status.status === 'failure') {
        const flakinessScore = totalCount > 0 ? failureCount / totalCount : 0;
        status.flakinessScore = Math.min(flakinessScore, 1);
        status.isFlaky = flakinessScore > 0.3; // Mark as flaky if >30% failure rate
      }
    }
  }

  /**
   * Calculate trend direction
   */
  private calculateTrends(statuses: BuildStatus[], _cacheKey: string): void {
    if (statuses.length < 2) {
      return;
    }

    const recentStatuses = statuses.slice(0, 5);
    const olderStatuses = statuses.slice(5, 10);

    if (olderStatuses.length === 0) {
      return;
    }

    const recentFailureRate = recentStatuses.filter(s => s.status === 'failure').length / recentStatuses.length;
    const olderFailureRate = olderStatuses.filter(s => s.status === 'failure').length / olderStatuses.length;

    for (const status of statuses) {
      if (recentFailureRate > olderFailureRate * 1.2) {
        status.trend = 'degrading';
      } else if (recentFailureRate < olderFailureRate * 0.8) {
        status.trend = 'improving';
      } else {
        status.trend = 'stable';
      }
    }
  }

  /**
   * Get build status for a repository
   */
  async getBuildStatus(org: string, repo: string): Promise<BuildStatus | null> {
    const statuses = await this.collectBuildStatus(org, repo);
    return statuses.length > 0 ? statuses[0] : null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
    this.buildHistory.clear();
  }
}

// Export singleton instance
export const buildStatusService = new BuildStatusService();

