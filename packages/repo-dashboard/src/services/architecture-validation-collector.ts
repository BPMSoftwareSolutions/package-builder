/**
 * Architecture Validation Collector Service
 * Collects and calculates CIA/SPA gate validation metrics
 */

export interface ValidationViolation {
  type: string; // 'import-boundary', 'sequence-shape', etc.
  count: number;
  severity: 'error' | 'warning';
}

export interface ArchitectureValidationMetrics {
  timestamp: Date;
  repo: string;
  commit: string;
  
  // Pass/Fail metrics
  passed: boolean;
  passRate: number; // 0-1 for organization
  
  // Violations
  violations: ValidationViolation[];
  
  // Trends
  violationTrend: 'improving' | 'stable' | 'degrading';
}

export interface ValidationMetricsCache {
  [repoKey: string]: {
    metrics: ArchitectureValidationMetrics;
    timestamp: number;
    ttl: number;
  };
}

export class ArchitectureValidationCollector {
  private cache: ValidationMetricsCache = {};
  private readonly cacheTTL = 3600000; // 1 hour in milliseconds
  private metricsHistory: Map<string, ArchitectureValidationMetrics[]> = new Map();

  /**
   * Collect architecture validation metrics for a repository
   */
  async collectValidationMetrics(org: string, repo: string, commit: string = 'HEAD'): Promise<ArchitectureValidationMetrics> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached validation metrics for ${cacheKey}`);
      return this.cache[cacheKey].metrics;
    }

    console.log(`🔍 Collecting validation metrics for ${cacheKey}...`);

    try {
      // Generate mock validation metrics
      const metrics = this.generateMockValidationMetrics(org, repo, commit);

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

      console.log(`✅ Collected validation metrics for ${cacheKey}`);
      return metrics;
    } catch (error) {
      console.error(`❌ Error collecting validation metrics for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Generate mock validation metrics
   */
  private generateMockValidationMetrics(org: string, repo: string, commit: string): ArchitectureValidationMetrics {
    const passed = Math.random() > 0.15; // 85% pass rate
    const passRate = 0.80 + Math.random() * 0.19;
    
    const violations: ValidationViolation[] = [];
    if (!passed || Math.random() > 0.5) {
      violations.push({
        type: 'import-boundary',
        count: Math.floor(Math.random() * 5),
        severity: 'error'
      });
    }
    if (Math.random() > 0.7) {
      violations.push({
        type: 'sequence-shape',
        count: Math.floor(Math.random() * 3),
        severity: 'warning'
      });
    }
    if (Math.random() > 0.8) {
      violations.push({
        type: 'dependency-cycle',
        count: Math.floor(Math.random() * 2),
        severity: 'error'
      });
    }

    return {
      timestamp: new Date(),
      repo: `${org}/${repo}`,
      commit,
      passed,
      passRate,
      violations,
      violationTrend: this.calculateTrend()
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(): 'improving' | 'stable' | 'degrading' {
    const rand = Math.random();
    if (rand < 0.4) return 'improving';
    if (rand < 0.7) return 'stable';
    return 'degrading';
  }

  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(org: string, repo: string, days: number = 7): ArchitectureValidationMetrics[] {
    const cacheKey = `${org}/${repo}`;
    const history = this.metricsHistory.get(cacheKey) || [];
    
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    return history.filter(m => m.timestamp.getTime() > cutoffTime);
  }

  /**
   * Calculate organization-wide pass rate
   */
  calculateOrgPassRate(metrics: ArchitectureValidationMetrics[]): number {
    if (metrics.length === 0) return 0;
    const passCount = metrics.filter(m => m.passed).length;
    return passCount / metrics.length;
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
    console.log(`🗑️ Cleared all validation metrics caches`);
  }
}

// Export singleton instance
export const architectureValidationCollector = new ArchitectureValidationCollector();

