/**
 * Deployment Metrics Collector Service
 * Collects and calculates deployment metrics from GitHub Actions
 */

import { fetchGitHub } from '../github.js';

export interface DeploymentMetrics {
  workflowRunId: string;
  repo: string;
  workflowName: string;
  environment: string; // 'dev', 'staging', 'production', or 'unknown'
  triggeredAt: Date;
  completedAt?: Date;

  // Calculated fields
  duration?: number; // minutes
  status: 'success' | 'failure' | 'cancelled' | 'in_progress';
  isRollback: boolean;
  conclusion?: string;
}

export interface DeploymentMetricsCache {
  [repoKey: string]: {
    metrics: DeploymentMetrics[];
    timestamp: number;
    ttl: number;
  };
}

export class DeploymentMetricsCollector {
  private cache: DeploymentMetricsCache = {};
  private readonly cacheTTL = 3600000; // 1 hour in milliseconds

  /**
   * Collect deployment metrics for a repository
   */
  async collectDeploymentMetrics(org: string, repo: string, days: number = 30): Promise<DeploymentMetrics[]> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached deployment metrics for ${cacheKey}`);
      return this.cache[cacheKey].metrics;
    }

    console.log(`🔍 Collecting deployment metrics for ${cacheKey}...`);

    const metrics: DeploymentMetrics[] = [];
    const since = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Fetch workflow runs
      const response = await fetchGitHub<any>(`/repos/${org}/${repo}/actions/runs?per_page=100`);
      const runs = response.workflow_runs || [];

      for (const run of runs) {
        // Filter by date
        const createdAt = new Date(run.created_at);
        if (createdAt.getTime() < new Date(since).getTime()) {
          continue;
        }

        const metric = this.calculateDeploymentMetrics(run, org, repo);
        metrics.push(metric);
      }

      // Cache the results
      this.cache[cacheKey] = {
        metrics,
        timestamp: now,
        ttl: this.cacheTTL
      };

      console.log(`✅ Collected ${metrics.length} deployment metrics for ${cacheKey}`);
      return metrics;
    } catch (error) {
      console.error(`❌ Error collecting deployment metrics for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Calculate metrics for a single workflow run
   */
  private calculateDeploymentMetrics(run: any, org: string, repo: string): DeploymentMetrics {
    const triggeredAt = new Date(run.created_at);
    const completedAt = run.updated_at ? new Date(run.updated_at) : undefined;

    // Determine environment from workflow name
    const workflowName = run.name || '';
    const environment = this.extractEnvironment(workflowName);

    // Calculate duration
    let duration: number | undefined;
    if (completedAt && run.status === 'completed') {
      duration = Math.round((completedAt.getTime() - triggeredAt.getTime()) / 60000); // minutes
    }

    // Determine if it's a rollback (heuristic: workflow name contains 'rollback' or 'revert')
    const isRollback = /rollback|revert/i.test(workflowName);

    // Map GitHub status to our status
    let status: 'success' | 'failure' | 'cancelled' | 'in_progress' = 'in_progress';
    if (run.status === 'completed') {
      if (run.conclusion === 'success') {
        status = 'success';
      } else if (run.conclusion === 'failure') {
        status = 'failure';
      } else if (run.conclusion === 'cancelled') {
        status = 'cancelled';
      }
    }

    return {
      workflowRunId: `${org}/${repo}#${run.id}`,
      repo: `${org}/${repo}`,
      workflowName,
      environment,
      triggeredAt,
      completedAt,
      duration,
      status,
      isRollback,
      conclusion: run.conclusion
    };
  }

  /**
   * Extract environment from workflow name
   */
  private extractEnvironment(workflowName: string): string {
    const lower = workflowName.toLowerCase();
    if (lower.includes('production') || lower.includes('prod')) return 'production';
    if (lower.includes('staging') || lower.includes('stage')) return 'staging';
    if (lower.includes('development') || lower.includes('dev')) return 'dev';
    return 'unknown';
  }

  /**
   * Calculate aggregate deployment metrics for a repository
   */
  async calculateAggregateMetrics(org: string, repo: string, days: number = 30): Promise<any> {
    const metrics = await this.collectDeploymentMetrics(org, repo, days);

    if (metrics.length === 0) {
      return {
        repo: `${org}/${repo}`,
        deploymentCount: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgDuration: 0,
        deploysPerDay: 0,
        rollbackCount: 0
      };
    }

    const successMetrics = metrics.filter(m => m.status === 'success');
    const failureMetrics = metrics.filter(m => m.status === 'failure');
    const rollbackMetrics = metrics.filter(m => m.isRollback);
    const durations = metrics.filter(m => m.duration).map(m => m.duration!);

    const daySpan = Math.max(1, days);
    const deploysPerDay = metrics.length / daySpan;

    return {
      repo: `${org}/${repo}`,
      deploymentCount: metrics.length,
      successCount: successMetrics.length,
      failureCount: failureMetrics.length,
      successRate: metrics.length > 0 ? successMetrics.length / metrics.length : 0,
      avgDuration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      deploysPerDay: Math.round(deploysPerDay * 100) / 100,
      rollbackCount: rollbackMetrics.length
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
      console.log(`🗑️ Cleared all deployment metrics cache`);
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
export const deploymentMetricsCollector = new DeploymentMetricsCollector();

