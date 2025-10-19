/**
 * Code Quality Collector Service
 * Collects and calculates code quality metrics
 */

export interface QualityMetrics {
  timestamp: Date;
  repo: string;
  
  // Issues
  lintingIssues: {
    error: number;
    warning: number;
    info: number;
  };
  typeErrors: number;
  securityVulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  
  // Complexity
  avgCyclomaticComplexity: number;
  maxCyclomaticComplexity: number;
  duplicationPercentage: number;
  
  // Score
  qualityScore: number; // 0-100
  qualityTrend: 'improving' | 'stable' | 'degrading';
}

export interface QualityMetricsCache {
  [repoKey: string]: {
    metrics: QualityMetrics;
    timestamp: number;
    ttl: number;
  };
}

export class CodeQualityCollector {
  private cache: QualityMetricsCache = {};
  private readonly cacheTTL = 3600000; // 1 hour in milliseconds
  private metricsHistory: Map<string, QualityMetrics[]> = new Map();

  /**
   * Collect quality metrics for a repository
   */
  async collectQualityMetrics(org: string, repo: string): Promise<QualityMetrics> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached quality metrics for ${cacheKey}`);
      return this.cache[cacheKey].metrics;
    }

    console.log(`🔍 Collecting quality metrics for ${cacheKey}...`);

    try {
      // Generate mock metrics based on repository characteristics
      const metrics = this.generateMockQualityMetrics(org, repo);

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

      console.log(`✅ Collected quality metrics for ${cacheKey}`);
      return metrics;
    } catch (error) {
      console.error(`❌ Error collecting quality metrics for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Generate mock quality metrics
   */
  private generateMockQualityMetrics(org: string, repo: string): QualityMetrics {
    const baseQuality = 70 + Math.random() * 25;
    
    return {
      timestamp: new Date(),
      repo: `${org}/${repo}`,
      lintingIssues: {
        error: Math.floor(Math.random() * 10),
        warning: Math.floor(Math.random() * 30),
        info: Math.floor(Math.random() * 50)
      },
      typeErrors: Math.floor(Math.random() * 15),
      securityVulnerabilities: {
        critical: Math.floor(Math.random() * 2),
        high: Math.floor(Math.random() * 5),
        medium: Math.floor(Math.random() * 10),
        low: Math.floor(Math.random() * 20)
      },
      avgCyclomaticComplexity: 3 + Math.random() * 4,
      maxCyclomaticComplexity: 8 + Math.random() * 12,
      duplicationPercentage: Math.random() * 15,
      qualityScore: Math.round(baseQuality * 100) / 100,
      qualityTrend: this.calculateQualityTrend()
    };
  }

  /**
   * Calculate quality trend direction
   */
  private calculateQualityTrend(): 'improving' | 'stable' | 'degrading' {
    const rand = Math.random();
    if (rand < 0.35) return 'improving';
    if (rand < 0.65) return 'stable';
    return 'degrading';
  }

  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(org: string, repo: string, days: number = 7): QualityMetrics[] {
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
    console.log(`🗑️ Cleared all quality metrics caches`);
  }
}

// Export singleton instance
export const codeQualityCollector = new CodeQualityCollector();

