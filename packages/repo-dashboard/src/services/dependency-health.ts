/**
 * Dependency Health Service
 * Monitors dependency versions, detects breaking changes, and tracks integration test results
 */

export interface DependencyVersion {
  name: string;
  currentVersion: string;
  latestVersion: string;
  isUpToDate: boolean;
  hasBreakingChanges: boolean;
  releaseDate: Date;
  changelogUrl?: string;
}

export interface DependencyHealthStatus {
  repo: string;
  timestamp: Date;
  totalDependencies: number;
  upToDateCount: number;
  outdatedCount: number;
  breakingChangesCount: number;
  healthScore: number; // 0-100
  dependencies: DependencyVersion[];
}

export interface IntegrationTestResult {
  repo: string;
  dependencyName: string;
  testDate: Date;
  passed: boolean;
  failureReason?: string;
  duration: number; // milliseconds
}

export interface DependencyAlert {
  id: string;
  repo: string;
  dependencyName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  createdAt: Date;
  resolved: boolean;
}

/**
 * Service for tracking dependency health
 */
export class DependencyHealthService {
  private healthStatusCache: Map<string, DependencyHealthStatus> = new Map();
  private testResultsCache: Map<string, IntegrationTestResult[]> = new Map();
  private alertsCache: Map<string, DependencyAlert[]> = new Map();

  /**
   * Check dependency health for a repository
   */
  checkDependencyHealth(
    repo: string,
    dependencies: DependencyVersion[]
  ): DependencyHealthStatus {
    const upToDateCount = dependencies.filter(d => d.isUpToDate).length;
    const outdatedCount = dependencies.length - upToDateCount;
    const breakingChangesCount = dependencies.filter(d => d.hasBreakingChanges).length;

    // Calculate health score
    const healthScore = Math.max(0, Math.min(100,
      100 - (outdatedCount * 10) - (breakingChangesCount * 20)
    ));

    const status: DependencyHealthStatus = {
      repo,
      timestamp: new Date(),
      totalDependencies: dependencies.length,
      upToDateCount,
      outdatedCount,
      breakingChangesCount,
      healthScore,
      dependencies
    };

    this.healthStatusCache.set(repo, status);

    // Generate alerts for breaking changes
    for (const dep of dependencies) {
      if (dep.hasBreakingChanges) {
        this.createAlert(repo, dep.name, 'critical', `Breaking changes detected in ${dep.name}`);
      } else if (!dep.isUpToDate) {
        this.createAlert(repo, dep.name, 'medium', `${dep.name} is outdated`);
      }
    }

    console.log(`✅ Checked dependency health for ${repo}: ${healthScore}/100`);
    return status;
  }

  /**
   * Record integration test result
   */
  recordTestResult(result: IntegrationTestResult): void {
    const key = `${result.repo}:${result.dependencyName}`;
    if (!this.testResultsCache.has(key)) {
      this.testResultsCache.set(key, []);
    }
    this.testResultsCache.get(key)!.push(result);

    // Update alerts based on test results
    if (!result.passed) {
      this.createAlert(
        result.repo,
        result.dependencyName,
        'high',
        `Integration test failed: ${result.failureReason || 'Unknown error'}`
      );
    }

    console.log(`✅ Recorded test result for ${result.repo}:${result.dependencyName}`);
  }

  /**
   * Get test results for a dependency
   */
  getTestResults(repo: string, dependencyName: string): IntegrationTestResult[] {
    const key = `${repo}:${dependencyName}`;
    return this.testResultsCache.get(key) || [];
  }

  /**
   * Get test pass rate for a dependency
   */
  getTestPassRate(repo: string, dependencyName: string): number {
    const results = this.getTestResults(repo, dependencyName);
    if (results.length === 0) return 100;

    const passedCount = results.filter(r => r.passed).length;
    return Math.round((passedCount / results.length) * 100);
  }

  /**
   * Create an alert
   */
  private createAlert(
    repo: string,
    dependencyName: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    message: string
  ): void {
    const alert: DependencyAlert = {
      id: `${repo}:${dependencyName}:${Date.now()}`,
      repo,
      dependencyName,
      severity,
      message,
      createdAt: new Date(),
      resolved: false
    };

    if (!this.alertsCache.has(repo)) {
      this.alertsCache.set(repo, []);
    }
    this.alertsCache.get(repo)!.push(alert);
  }

  /**
   * Get alerts for a repository
   */
  getAlerts(repo: string, includeResolved: boolean = false): DependencyAlert[] {
    const alerts = this.alertsCache.get(repo) || [];
    return includeResolved ? alerts : alerts.filter(a => !a.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    for (const alerts of this.alertsCache.values()) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        console.log(`✅ Resolved alert: ${alertId}`);
        return;
      }
    }
  }

  /**
   * Get health status for a repository
   */
  getHealthStatus(repo: string): DependencyHealthStatus | null {
    return this.healthStatusCache.get(repo) || null;
  }

  /**
   * Get all health statuses
   */
  getAllHealthStatuses(): DependencyHealthStatus[] {
    return Array.from(this.healthStatusCache.values());
  }

  /**
   * Get organization-wide health score
   */
  getOrganizationHealthScore(): number {
    const statuses = this.getAllHealthStatuses();
    if (statuses.length === 0) return 100;

    const avgScore = statuses.reduce((sum, s) => sum + s.healthScore, 0) / statuses.length;
    return Math.round(avgScore);
  }
}

// Export singleton instance
export const dependencyHealthService = new DependencyHealthService();

