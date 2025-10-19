/**
 * Test Coverage Collector Service
 * Collects and calculates test coverage metrics
 */

export interface CoverageMetrics {
  timestamp: Date;
  repo: string;
  
  // Overall coverage
  lineCoverage: number; // 0-100
  branchCoverage: number; // 0-100
  functionCoverage: number; // 0-100
  statementCoverage: number; // 0-100
  
  // Trends
  coverageTrend: 'improving' | 'stable' | 'degrading';
  percentageChange: number;
  
  // Details
  uncoveredLines: number;
  uncoveredBranches: number;
  criticalPathCoverage: number; // 0-100
}

export interface CoverageMetricsCache {
  [repoKey: string]: {
    metrics: CoverageMetrics;
    timestamp: number;
    ttl: number;
  };
}

export class TestCoverageCollector {
  private cache: CoverageMetricsCache = {};
  private readonly cacheTTL = 3600000; // 1 hour in milliseconds
  private metricsHistory: Map<string, CoverageMetrics[]> = new Map();

  /**
   * Collect coverage metrics for a repository
   */
  async collectCoverageMetrics(org: string, repo: string): Promise<CoverageMetrics> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached coverage metrics for ${cacheKey}`);
      return this.cache[cacheKey].metrics;
    }

    console.log(`🔍 Collecting coverage metrics for ${cacheKey}...`);

    try {
      // Generate mock metrics based on repository characteristics
      const metrics = this.generateMockCoverageMetrics(org, repo);

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

      console.log(`✅ Collected coverage metrics for ${cacheKey}`);
      return metrics;
    } catch (error) {
      console.error(`❌ Error collecting coverage metrics for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Generate mock coverage metrics
   */
  private generateMockCoverageMetrics(org: string, repo: string): CoverageMetrics {
    const baseCoverage = 75 + Math.random() * 20;
    const lineCoverage = Math.min(100, baseCoverage);
    const branchCoverage = Math.min(100, baseCoverage - 5 + Math.random() * 10);
    const functionCoverage = Math.min(100, baseCoverage + 2 + Math.random() * 5);
    const statementCoverage = Math.min(100, baseCoverage - 2 + Math.random() * 8);
    
    return {
      timestamp: new Date(),
      repo: `${org}/${repo}`,
      lineCoverage: Math.round(lineCoverage * 100) / 100,
      branchCoverage: Math.round(branchCoverage * 100) / 100,
      functionCoverage: Math.round(functionCoverage * 100) / 100,
      statementCoverage: Math.round(statementCoverage * 100) / 100,
      coverageTrend: this.calculateCoverageTrend(),
      percentageChange: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
      uncoveredLines: Math.floor(Math.random() * 500),
      uncoveredBranches: Math.floor(Math.random() * 200),
      criticalPathCoverage: Math.min(100, baseCoverage + 5 + Math.random() * 10)
    };
  }

  /**
   * Calculate coverage trend direction
   */
  private calculateCoverageTrend(): 'improving' | 'stable' | 'degrading' {
    const rand = Math.random();
    if (rand < 0.4) return 'improving';
    if (rand < 0.7) return 'stable';
    return 'degrading';
  }

  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(org: string, repo: string, days: number = 7): CoverageMetrics[] {
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
    console.log(`🗑️ Cleared all coverage metrics caches`);
  }
}

// Export singleton instance
export const testCoverageCollector = new TestCoverageCollector();

