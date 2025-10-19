/**
 * Conductor Metrics Collector Service
 * Collects and calculates MusicalConductor orchestration metrics
 */

export interface ConductorMetrics {
  timestamp: Date;
  repo: string;
  
  // Throughput metrics
  sequencesPerMinute: number;
  queueLength: number;
  avgExecutionTime: number; // milliseconds
  
  // Success/Error metrics
  successRate: number; // 0-1
  errorRate: number; // 0-1
  errorTypes: Record<string, number>; // error type -> count
  
  // Trends
  throughputTrend: 'increasing' | 'stable' | 'decreasing';
  successRateTrend: 'improving' | 'stable' | 'degrading';
}

export interface ConductorMetricsCache {
  [repoKey: string]: {
    metrics: ConductorMetrics;
    timestamp: number;
    ttl: number;
  };
}

export class ConductorMetricsCollector {
  private cache: ConductorMetricsCache = {};
  private readonly cacheTTL = 3600000; // 1 hour in milliseconds
  private metricsHistory: Map<string, ConductorMetrics[]> = new Map();

  /**
   * Collect Conductor metrics for a repository
   */
  async collectConductorMetrics(org: string, repo: string): Promise<ConductorMetrics> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached Conductor metrics for ${cacheKey}`);
      return this.cache[cacheKey].metrics;
    }

    console.log(`🔍 Collecting Conductor metrics for ${cacheKey}...`);

    try {
      // Generate mock metrics based on repository characteristics
      const metrics = this.generateMockConductorMetrics(org, repo);

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

      console.log(`✅ Collected Conductor metrics for ${cacheKey}`);
      return metrics;
    } catch (error) {
      console.error(`❌ Error collecting Conductor metrics for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Generate mock Conductor metrics
   */
  private generateMockConductorMetrics(org: string, repo: string): ConductorMetrics {
    const baseSequences = 100 + Math.random() * 200;
    const successRate = 0.92 + Math.random() * 0.07;
    
    return {
      timestamp: new Date(),
      repo: `${org}/${repo}`,
      sequencesPerMinute: Math.round(baseSequences),
      queueLength: Math.floor(Math.random() * 50),
      avgExecutionTime: 150 + Math.random() * 350,
      successRate,
      errorRate: 1 - successRate,
      errorTypes: {
        'timeout': Math.floor(Math.random() * 5),
        'validation': Math.floor(Math.random() * 3),
        'dependency': Math.floor(Math.random() * 2),
        'other': Math.floor(Math.random() * 1)
      },
      throughputTrend: this.calculateThroughputTrend(),
      successRateTrend: this.calculateSuccessRateTrend()
    };
  }

  /**
   * Calculate throughput trend direction
   */
  private calculateThroughputTrend(): 'increasing' | 'stable' | 'decreasing' {
    const rand = Math.random();
    if (rand < 0.33) return 'increasing';
    if (rand < 0.66) return 'stable';
    return 'decreasing';
  }

  /**
   * Calculate success rate trend direction
   */
  private calculateSuccessRateTrend(): 'improving' | 'stable' | 'degrading' {
    const rand = Math.random();
    if (rand < 0.33) return 'improving';
    if (rand < 0.66) return 'stable';
    return 'degrading';
  }

  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(org: string, repo: string, days: number = 7): ConductorMetrics[] {
    const cacheKey = `${org}/${repo}`;
    const history = this.metricsHistory.get(cacheKey) || [];
    
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    return history.filter(m => m.timestamp.getTime() > cutoffTime);
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
    console.log(`🗑️ Cleared all Conductor metrics caches`);
  }
}

// Export singleton instance
export const conductorMetricsCollector = new ConductorMetricsCollector();

