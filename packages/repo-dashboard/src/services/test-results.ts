/**
 * Test Results Service
 * Collects test results from CI/CD and tracks test coverage trends
 */

import { fetchGitHub } from '../github.js';

export interface TestResults {
  timestamp: Date;
  repo: string;
  buildId: string;
  
  // Results
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  
  // Coverage
  coverage: number; // 0-1
  coverageTrend: 'improving' | 'stable' | 'degrading';
  
  // Failing tests
  failingTests: {
    name: string;
    error: string;
    duration: number;
  }[];
  
  // Execution time
  totalDuration: number; // seconds
  avgTestDuration: number;
}

export interface TestResultsCache {
  [repoKey: string]: {
    results: TestResults[];
    timestamp: number;
    ttl: number;
  };
}

export class TestResultsService {
  private cache: TestResultsCache = {};
  private readonly cacheTTL = 300000; // 5 minutes in milliseconds
  private testHistory: Map<string, TestResults[]> = new Map();

  /**
   * Collect test results for a repository
   */
  async collectTestResults(org: string, repo: string): Promise<TestResults[]> {
    const cacheKey = `${org}/${repo}`;
    const now = Date.now();

    // Check cache
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cache[cacheKey].ttl) {
      console.log(`✅ Using cached test results for ${cacheKey}`);
      return this.cache[cacheKey].results;
    }

    console.log(`🔍 Collecting test results for ${cacheKey}...`);

    const results: TestResults[] = [];

    try {
      // Fetch workflow runs
      const endpoint = `/repos/${org}/${repo}/actions/runs?per_page=50`;
      const response = await fetchGitHub<any>(`${endpoint}`);
      const runs = response.workflow_runs || [];

      for (const run of runs) {
        const testResult = this.calculateTestResults(run, org, repo);
        results.push(testResult);
      }

      // Calculate coverage trends
      this.calculateCoverageTrends(results, cacheKey);

      // Cache the results
      this.cache[cacheKey] = {
        results,
        timestamp: now,
        ttl: this.cacheTTL
      };

      // Store in history
      this.testHistory.set(cacheKey, results);

      console.log(`✅ Collected ${results.length} test result sets for ${cacheKey}`);
      return results;
    } catch (error) {
      console.error(`❌ Error collecting test results for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Calculate metrics for test results
   */
  private calculateTestResults(run: any, org: string, repo: string): TestResults {
    const createdAt = new Date(run.created_at);
    const updatedAt = new Date(run.updated_at);
    const duration = Math.round((updatedAt.getTime() - createdAt.getTime()) / 1000);

    // Mock test data - in production, this would parse actual test results
    const totalTests = Math.floor(Math.random() * 500) + 100;
    const passedTests = Math.floor(totalTests * 0.95);
    const failedTests = totalTests - passedTests - Math.floor(totalTests * 0.02);
    const skippedTests = Math.floor(totalTests * 0.02);

    return {
      timestamp: createdAt,
      repo: `${org}/${repo}`,
      buildId: run.id.toString(),
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      coverage: 0.85 + Math.random() * 0.1, // 85-95% coverage
      coverageTrend: 'stable',
      failingTests: failedTests > 0 ? [
        {
          name: 'test_example_failure',
          error: 'Expected true but got false',
          duration: 2500
        }
      ] : [],
      totalDuration: duration,
      avgTestDuration: duration / totalTests
    };
  }

  /**
   * Calculate coverage trends
   */
  private calculateCoverageTrends(results: TestResults[], _cacheKey: string): void {
    if (results.length < 2) {
      return;
    }

    const recentCoverage = results[0].coverage;
    const previousCoverage = results[1].coverage;

    for (const result of results) {
      if (recentCoverage > previousCoverage * 1.02) {
        result.coverageTrend = 'improving';
      } else if (recentCoverage < previousCoverage * 0.98) {
        result.coverageTrend = 'degrading';
      } else {
        result.coverageTrend = 'stable';
      }
    }
  }

  /**
   * Get latest test results for a repository
   */
  async getLatestTestResults(org: string, repo: string): Promise<TestResults | null> {
    const results = await this.collectTestResults(org, repo);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
    this.testHistory.clear();
  }
}

// Export singleton instance
export const testResultsService = new TestResultsService();

