/**
 * Mock Metrics Service
 * Provides mock/fallback metrics data for endpoints
 */

export interface MetricsData {
  timestamp: string;
  organization: string;
  summary?: Record<string, any>;
  aggregated?: Record<string, any>;
  byRepository?: Record<string, any>;
  trends?: Record<string, any>;
}

class MockMetricsService {
  /**
   * Get mock metrics for organization
   */
  getOrganizationMetrics(org: string, days: number = 30): MetricsData {
    return {
      timestamp: new Date().toISOString(),
      organization: org,
      summary: {
        totalRepos: 5,
        healthScore: 0.85,
        buildSuccessRate: 0.92,
        testCoverageAvg: 0.78,
        openIssuesTotal: 12,
        stalePRsTotal: 3,
        deploymentFrequency: 2.5,
        leadTimeForChanges: 4.2,
        meanTimeToRecovery: 1.5,
        changeFailureRate: 0.08,
      },
      byRepository: {
        'package-builder': {
          healthScore: 0.88,
          buildStatus: 'success',
          testCoverage: 0.82,
          openIssues: 5,
          stalePRs: 1,
          lastDeployment: new Date().toISOString(),
          deploymentFrequency: 3.0,
          leadTime: 3.5,
          mttr: 1.2,
          changeFailureRate: 0.05,
        },
      },
      trends: {
        healthScoreTrend: Array.from({ length: days }, () => 0.85 + Math.random() * 0.1),
        buildSuccessRateTrend: Array.from({ length: days }, () => 0.90 + Math.random() * 0.05),
        testCoverageTrend: Array.from({ length: days }, () => 0.75 + Math.random() * 0.1),
        deploymentFrequencyTrend: Array.from({ length: days }, () => 2.0 + Math.random() * 1.5),
      },
    };
  }

  /**
   * Get mock conductor metrics
   */
  getConductorMetrics(org: string): Record<string, any> {
    return {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        sequencesPerMinute: 250,
        avgQueueLength: 15,
        avgExecutionTime: 280,
        successRate: 0.94,
        errorRate: 0.06,
      },
    };
  }

  /**
   * Get mock validation metrics
   */
  getValidationMetrics(org: string): Record<string, any> {
    return {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        passRate: 0.85,
        failRate: 0.15,
        commonViolations: [
          { type: 'import-boundary', count: 12 },
          { type: 'sequence-shape', count: 5 },
          { type: 'dependency-cycle', count: 2 },
        ],
      },
    };
  }

  /**
   * Get mock bundle metrics
   */
  getBundleMetrics(org: string): Record<string, any> {
    return {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        totalBundleSize: 2500000,
        avgLoadTime: 1500,
        healthStatus: 'good',
      },
    };
  }

  /**
   * Get mock bundle alerts
   */
  getBundleAlerts(org: string): Record<string, any> {
    return {
      organization: org,
      timestamp: new Date().toISOString(),
      alerts: [
        {
          repository: 'renderx-plugins-canvas',
          severity: 'warning',
          message: 'Plugin bundle approaching budget limit',
        },
      ],
    };
  }

  /**
   * Get mock coverage metrics
   */
  getCoverageMetrics(org: string): Record<string, any> {
    return {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        lineCoverage: 82.5,
        branchCoverage: 78.3,
        functionCoverage: 85.1,
        statementCoverage: 81.2,
        trend: 'improving',
      },
    };
  }

  /**
   * Get mock team coverage metrics
   */
  getTeamCoverageMetrics(org: string, team: string): Record<string, any> {
    return {
      organization: org,
      team,
      timestamp: new Date().toISOString(),
      aggregated: {
        lineCoverage: 80.2,
        branchCoverage: 76.8,
        functionCoverage: 83.5,
        statementCoverage: 79.9,
        trend: 'stable',
      },
    };
  }

  /**
   * Get mock quality metrics
   */
  getQualityMetrics(org: string): Record<string, any> {
    return {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        qualityScore: 78.5,
        lintingIssues: { error: 5, warning: 25, info: 40 },
        typeErrors: 8,
        securityVulnerabilities: { critical: 0, high: 2, medium: 5, low: 12 },
        trend: 'improving',
      },
    };
  }

  /**
   * Get mock test metrics
   */
  getTestMetrics(org: string): Record<string, any> {
    return {
      organization: org,
      timestamp: new Date().toISOString(),
      aggregated: {
        totalTests: 2500,
        passRate: 0.92,
        avgExecutionTime: 250,
        flakyTestPercentage: 0.03,
        trend: 'stable',
      },
    };
  }

  /**
   * Get mock constraints
   */
  getConstraints(org: string): Record<string, any> {
    return {
      organization: org,
      timestamp: new Date().toISOString(),
      constraints: [],
    };
  }
}

export const mockMetricsService = new MockMetricsService();

