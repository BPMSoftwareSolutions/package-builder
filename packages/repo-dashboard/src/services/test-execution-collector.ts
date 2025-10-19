/**
 * Test Execution Collector Service
 * Collects and calculates test execution metrics
 */

export interface TestMetrics {
  timestamp: Date;
  repo: string;
  
  // Results
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  passRate: number; // 0-1
  
  // Execution
  totalExecutionTime: number; // seconds
  avgTestExecutionTime: number; // milliseconds
  
  // Flakiness
  flakyTests: string[];
  flakyTestPercentage: number; // 0-1
  
  // By type
  unitTests: { total: number; passed: number };
  integrationTests: { total: number; passed: number };
  e2eTests: { total: number; passed: number };
}

export interface TestMetricsCache {
  [repoKey: string]: {
    metrics: TestMetrics;
    timestamp: number;
    ttl: number;
  };
}

export class TestExecutionCollector {
  private cache: TestMetricsCache = {};
  private readonly cacheTTL = 3600000; // 1 hour in milliseconds
  private metricsHistory: Map<string, TestMetrics[]> = new Map();

  /**
   * Collect test execution metrics for a repository
   */
  async collectTestMetrics(org: string, repo: string): Promise<TestMetrics> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached test metrics for ${cacheKey}`);
      return this.cache[cacheKey].metrics;
    }

    console.log(`🔍 Collecting test metrics for ${cacheKey}...`);

    try {
      // Generate mock metrics based on repository characteristics
      const metrics = this.generateMockTestMetrics(org, repo);

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

      console.log(`✅ Collected test metrics for ${cacheKey}`);
      return metrics;
    } catch (error) {
      console.error(`❌ Error collecting test metrics for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Generate mock test metrics
   */
  private generateMockTestMetrics(org: string, repo: string): TestMetrics {
    const totalTests = 100 + Math.floor(Math.random() * 400);
    const passRate = 0.85 + Math.random() * 0.14;
    const passedTests = Math.floor(totalTests * passRate);
    const failedTests = Math.floor(totalTests * (1 - passRate) * 0.8);
    const skippedTests = totalTests - passedTests - failedTests;
    
    const unitTotal = Math.floor(totalTests * 0.6);
    const integrationTotal = Math.floor(totalTests * 0.3);
    const e2eTotal = totalTests - unitTotal - integrationTotal;
    
    return {
      timestamp: new Date(),
      repo: `${org}/${repo}`,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate: Math.round(passRate * 10000) / 10000,
      totalExecutionTime: Math.round(30 + Math.random() * 120),
      avgTestExecutionTime: Math.round(100 + Math.random() * 400),
      flakyTests: this.generateFlakyTests(),
      flakyTestPercentage: Math.round(Math.random() * 5 * 100) / 100 / 100,
      unitTests: {
        total: unitTotal,
        passed: Math.floor(unitTotal * (0.9 + Math.random() * 0.09))
      },
      integrationTests: {
        total: integrationTotal,
        passed: Math.floor(integrationTotal * (0.8 + Math.random() * 0.15))
      },
      e2eTests: {
        total: e2eTotal,
        passed: Math.floor(e2eTotal * (0.75 + Math.random() * 0.2))
      }
    };
  }

  /**
   * Generate list of flaky test names
   */
  private generateFlakyTests(): string[] {
    const testNames = [
      'should handle async operations',
      'should validate user input',
      'should render component correctly',
      'should fetch data from API',
      'should handle errors gracefully'
    ];
    
    const count = Math.floor(Math.random() * 3);
    const flaky: string[] = [];
    for (let i = 0; i < count; i++) {
      flaky.push(testNames[Math.floor(Math.random() * testNames.length)]);
    }
    return flaky;
  }

  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(org: string, repo: string, days: number = 7): TestMetrics[] {
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
    console.log(`🗑️ Cleared all test metrics caches`);
  }
}

// Export singleton instance
export const testExecutionCollector = new TestExecutionCollector();

