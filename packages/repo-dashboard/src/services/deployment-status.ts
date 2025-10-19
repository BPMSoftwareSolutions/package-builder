/**
 * Deployment Status Service
 * Monitors deployment status in real-time and tracks deployment duration
 */

import { fetchGitHub } from '../github.js';

export interface DeploymentStatus {
  timestamp: Date;
  repo: string;
  deploymentId: string;
  environment: string;

  // Status
  status: 'success' | 'failure' | 'pending' | 'in_progress';
  duration: number; // seconds
  
  // Details
  failureReason?: string;
  
  // Rollback info
  isRollback: boolean;
  rollbackOf?: string;
  
  // Trend
  trend: 'improving' | 'stable' | 'degrading';
}

export interface DeploymentStatusCache {
  [repoKey: string]: {
    statuses: DeploymentStatus[];
    timestamp: number;
    ttl: number;
  };
}

export class DeploymentStatusService {
  private cache: DeploymentStatusCache = {};
  private readonly cacheTTL = 300000; // 5 minutes in milliseconds
  private deploymentHistory: Map<string, DeploymentStatus[]> = new Map();

  /**
   * Collect deployment status for a repository
   */
  async collectDeploymentStatus(org: string, repo: string, _days: number = 7): Promise<DeploymentStatus[]> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached deployment status for ${cacheKey}`);
      return this.cache[cacheKey].statuses;
    }

    console.log(`🔍 Collecting deployment status for ${cacheKey}...`);

    const statuses: DeploymentStatus[] = [];

    try {
      // Fetch deployments from GitHub API
      const endpoint = `/repos/${org}/${repo}/deployments?per_page=50`;
      const deployments = await fetchGitHub<any[]>(`${endpoint}`);

      for (const deployment of deployments) {
        const status = this.calculateDeploymentStatus(deployment, org, repo);
        statuses.push(status);
      }

      // Calculate trends
      this.calculateTrends(statuses, cacheKey);

      // Cache the results
      this.cache[cacheKey] = {
        statuses,
        timestamp: now,
        ttl: this.cacheTTL
      };

      // Store in history
      this.deploymentHistory.set(cacheKey, statuses);

      console.log(`✅ Collected ${statuses.length} deployment statuses for ${cacheKey}`);
      return statuses;
    } catch (error) {
      console.error(`❌ Error collecting deployment status for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Calculate metrics for a single deployment
   */
  private calculateDeploymentStatus(deployment: any, org: string, repo: string): DeploymentStatus {
    const createdAt = new Date(deployment.created_at);
    const updatedAt = new Date(deployment.updated_at);
    const duration = Math.round((updatedAt.getTime() - createdAt.getTime()) / 1000);

    // Determine status from deployment state
    let status: 'success' | 'failure' | 'pending' | 'in_progress' = 'pending';
    if (deployment.state === 'success') {
      status = 'success';
    } else if (deployment.state === 'failure') {
      status = 'failure';
    } else if (deployment.state === 'in_progress') {
      status = 'in_progress';
    }

    return {
      timestamp: createdAt,
      repo: `${org}/${repo}`,
      deploymentId: deployment.id.toString(),
      environment: deployment.environment || 'production',
      status,
      duration,
      failureReason: status === 'failure' ? 'Deployment failed' : undefined,
      isRollback: deployment.description?.includes('rollback') || false,
      rollbackOf: undefined,
      trend: 'stable'
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrends(statuses: DeploymentStatus[], _cacheKey: string): void {
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
   * Get latest deployment status for a repository
   */
  async getLatestDeploymentStatus(org: string, repo: string): Promise<DeploymentStatus | null> {
    const statuses = await this.collectDeploymentStatus(org, repo);
    return statuses.length > 0 ? statuses[0] : null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
    this.deploymentHistory.clear();
  }
}

// Export singleton instance
export const deploymentStatusService = new DeploymentStatusService();

