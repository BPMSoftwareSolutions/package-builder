/**
 * Bundle Metrics Collector Service
 * Collects and calculates bundle size and performance budget metrics
 */

export interface BundleMetrics {
  timestamp: Date;
  repo: string;
  
  // Sizes (in bytes)
  shellBundleSize: number;
  pluginBundleSizes: Record<string, number>; // plugin -> size
  totalBundleSize: number;
  
  // Budgets (in bytes)
  shellBudget: number;
  pluginBudgets: Record<string, number>;
  
  // Status
  shellStatus: 'green' | 'yellow' | 'red';
  pluginStatuses: Record<string, 'green' | 'yellow' | 'red'>;
  
  // Performance
  loadTime: number; // milliseconds
  runtimePerformance: Record<string, number>; // metric -> value
}

export interface BundleMetricsCache {
  [repoKey: string]: {
    metrics: BundleMetrics;
    timestamp: number;
    ttl: number;
  };
}

export class BundleMetricsCollector {
  private cache: BundleMetricsCache = {};
  private readonly cacheTTL = 3600000; // 1 hour in milliseconds
  private metricsHistory: Map<string, BundleMetrics[]> = new Map();

  /**
   * Collect bundle metrics for a repository
   */
  async collectBundleMetrics(org: string, repo: string): Promise<BundleMetrics> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached bundle metrics for ${cacheKey}`);
      return this.cache[cacheKey].metrics;
    }

    console.log(`🔍 Collecting bundle metrics for ${cacheKey}...`);

    try {
      // Generate mock bundle metrics
      const metrics = this.generateMockBundleMetrics(org, repo);

      // Store in history for trend analysis
      if (!this.metricsHistory.has(cacheKey)) {
        this.metricsHistory.set(cacheKey, []);
      }
      this.metricsHistory.get(cacheKey)!.push(metrics);

      // Cache the results
      this.cache[cacheKey] = {
        metrics,
        timestamp: now,
        ttl: this.cacheTTL
      };

      console.log(`✅ Collected bundle metrics for ${cacheKey}`);
      return metrics;
    } catch (error) {
      console.error(`❌ Error collecting bundle metrics for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Generate mock bundle metrics
   */
  private generateMockBundleMetrics(org: string, repo: string): BundleMetrics {
    const shellBudget = 500000; // 500KB
    const shellBundleSize = shellBudget * (0.7 + Math.random() * 0.25);
    
    const pluginBudgets: Record<string, number> = {
      'plugin-canvas': 200000,
      'plugin-components': 250000,
      'plugin-control-panel': 150000,
      'plugin-header': 100000,
      'plugin-library': 300000
    };

    const pluginBundleSizes: Record<string, number> = {};
    const pluginStatuses: Record<string, 'green' | 'yellow' | 'red'> = {};

    for (const [plugin, budget] of Object.entries(pluginBudgets)) {
      const size = budget * (0.6 + Math.random() * 0.35);
      pluginBundleSizes[plugin] = size;
      pluginStatuses[plugin] = this.calculateBundleStatus(size, budget);
    }

    const totalBundleSize = shellBundleSize + Object.values(pluginBundleSizes).reduce((a, b) => a + b, 0);

    return {
      timestamp: new Date(),
      repo: `${org}/${repo}`,
      shellBundleSize,
      pluginBundleSizes,
      totalBundleSize,
      shellBudget,
      pluginBudgets,
      shellStatus: this.calculateBundleStatus(shellBundleSize, shellBudget),
      pluginStatuses,
      loadTime: 1000 + Math.random() * 2000,
      runtimePerformance: {
        'fps': 55 + Math.random() * 5,
        'memory-usage-mb': 50 + Math.random() * 100,
        'cpu-usage-percent': 20 + Math.random() * 30
      }
    };
  }

  /**
   * Calculate bundle status based on size vs budget
   */
  private calculateBundleStatus(size: number, budget: number): 'green' | 'yellow' | 'red' {
    const ratio = size / budget;
    if (ratio <= 0.8) return 'green';
    if (ratio <= 0.95) return 'yellow';
    return 'red';
  }

  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(org: string, repo: string, days: number = 7): BundleMetrics[] {
    const cacheKey = `${org}/${repo}`;
    const history = this.metricsHistory.get(cacheKey) || [];
    
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    return history.filter(m => m.timestamp.getTime() > cutoffTime);
  }

  /**
   * Check if any bundle exceeds budget
   */
  checkBudgetAlerts(metrics: BundleMetrics): string[] {
    const alerts: string[] = [];
    
    if (metrics.shellStatus === 'red') {
      alerts.push(`Shell bundle exceeds budget: ${(metrics.shellBundleSize / 1024).toFixed(2)}KB / ${(metrics.shellBudget / 1024).toFixed(2)}KB`);
    }

    for (const [plugin, status] of Object.entries(metrics.pluginStatuses)) {
      if (status === 'red') {
        const size = metrics.pluginBundleSizes[plugin];
        const budget = metrics.pluginBudgets[plugin];
        alerts.push(`${plugin} exceeds budget: ${(size / 1024).toFixed(2)}KB / ${(budget / 1024).toFixed(2)}KB`);
      }
    }

    return alerts;
  }

  /**
   * Clear cache for a specific repository
   */
  clearCache(org: string, repo: string): void {
    const cacheKey = `${org}/${repo}`;
    delete this.cache[cacheKey];
    console.log(`🗑️ Cleared cache for ${cacheKey}`);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache = {};
    this.metricsHistory.clear();
    console.log(`🗑️ Cleared all bundle metrics caches`);
  }
}

// Export singleton instance
export const bundleMetricsCollector = new BundleMetricsCollector();

