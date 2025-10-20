/**
 * Tests for Insights Analyzer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InsightsAnalyzer } from './insights-analyzer.js';

// Mock the collectors
vi.mock('./pull-request-metrics-collector.js', () => ({
  prMetricsCollector: {
    calculateAggregateMetrics: vi.fn()
  }
}));

vi.mock('./deployment-metrics-collector.js', () => ({
  deploymentMetricsCollector: {
    calculateAggregateMetrics: vi.fn()
  }
}));

vi.mock('./code-quality-collector.js', () => ({
  codeQualityCollector: {
    collectQualityMetrics: vi.fn()
  }
}));

vi.mock('./test-coverage-collector.js', () => ({
  testCoverageCollector: {
    collectCoverageMetrics: vi.fn()
  }
}));

vi.mock('./metrics-aggregator.js', () => ({
  metricsAggregator: {
    initialize: vi.fn(),
    getTeams: vi.fn(),
    getTeamRepositories: vi.fn()
  }
}));

import { prMetricsCollector } from './pull-request-metrics-collector.js';
import { deploymentMetricsCollector } from './deployment-metrics-collector.js';
import { codeQualityCollector } from './code-quality-collector.js';
import { testCoverageCollector } from './test-coverage-collector.js';
import { metricsAggregator } from './metrics-aggregator.js';

describe('InsightsAnalyzer', () => {
  let analyzer: InsightsAnalyzer;

  beforeEach(() => {
    analyzer = new InsightsAnalyzer();
    vi.clearAllMocks();
  });

  describe('generateInsights', () => {
    it('should generate insights with trends, anomalies, and recommendations', async () => {
      // Mock metrics aggregator
      (metricsAggregator.initialize as any).mockResolvedValue(undefined);
      (metricsAggregator.getTeams as any).mockReturnValue(['team1']);
      (metricsAggregator.getTeamRepositories as any).mockReturnValue(['BPMSoftwareSolutions/repo1']);

      // Mock PR metrics
      (prMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        repo: 'BPMSoftwareSolutions/repo1',
        prCount: 10,
        mergedCount: 9,
        avgCycleTime: 300, // 5 hours
        medianCycleTime: 250,
        avgPRSize: 5,
        avgAdditions: 100,
        avgDeletions: 50
      });

      // Mock deployment metrics
      (deploymentMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        repo: 'BPMSoftwareSolutions/repo1',
        deploymentCount: 20,
        successCount: 18,
        failureCount: 2,
        successRate: 0.9,
        avgDuration: 15,
        deploysPerDay: 1.5,
        rollbackCount: 1
      });

      // Mock quality metrics
      (codeQualityCollector.collectQualityMetrics as any).mockResolvedValue({
        timestamp: new Date(),
        repo: 'BPMSoftwareSolutions/repo1',
        lintingIssues: { error: 0, warning: 2, info: 5 },
        typeErrors: 0,
        securityVulnerabilities: { critical: 0, high: 0, medium: 1, low: 2 },
        avgCyclomaticComplexity: 3.5,
        maxCyclomaticComplexity: 12,
        duplicationPercentage: 5,
        qualityScore: 85,
        qualityTrend: 'stable'
      });

      // Mock coverage metrics
      (testCoverageCollector.collectCoverageMetrics as any).mockResolvedValue({
        timestamp: new Date(),
        repo: 'BPMSoftwareSolutions/repo1',
        lineCoverage: 85,
        branchCoverage: 80,
        functionCoverage: 88,
        statementCoverage: 84,
        coverageTrend: 'stable',
        percentageChange: 0,
        uncoveredLines: 150,
        uncoveredBranches: 50,
        criticalPathCoverage: 92
      });

      const insights = await analyzer.generateInsights('BPMSoftwareSolutions', 30);

      expect(insights).toBeDefined();
      expect(insights.trends).toBeDefined();
      expect(insights.anomalies).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(insights.report).toBeDefined();
      expect(insights.timestamp).toBeDefined();
    });

    it('should detect high cycle time anomaly', async () => {
      (metricsAggregator.initialize as any).mockResolvedValue(undefined);
      (metricsAggregator.getTeams as any).mockReturnValue(['team1']);
      (metricsAggregator.getTeamRepositories as any).mockReturnValue(['BPMSoftwareSolutions/repo1']);

      // High cycle time (> 1 day = 1440 minutes)
      (prMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        repo: 'BPMSoftwareSolutions/repo1',
        prCount: 10,
        mergedCount: 9,
        avgCycleTime: 2000,
        medianCycleTime: 1900,
        avgPRSize: 5,
        avgAdditions: 100,
        avgDeletions: 50
      });

      (deploymentMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        repo: 'BPMSoftwareSolutions/repo1',
        deploymentCount: 20,
        successCount: 18,
        failureCount: 2,
        successRate: 0.9,
        avgDuration: 15,
        deploysPerDay: 1.5,
        rollbackCount: 1
      });

      (codeQualityCollector.collectQualityMetrics as any).mockResolvedValue({
        timestamp: new Date(),
        repo: 'BPMSoftwareSolutions/repo1',
        lintingIssues: { error: 0, warning: 2, info: 5 },
        typeErrors: 0,
        securityVulnerabilities: { critical: 0, high: 0, medium: 1, low: 2 },
        avgCyclomaticComplexity: 3.5,
        maxCyclomaticComplexity: 12,
        duplicationPercentage: 5,
        qualityScore: 85,
        qualityTrend: 'stable'
      });

      (testCoverageCollector.collectCoverageMetrics as any).mockResolvedValue({
        timestamp: new Date(),
        repo: 'BPMSoftwareSolutions/repo1',
        lineCoverage: 85,
        branchCoverage: 80,
        functionCoverage: 88,
        statementCoverage: 84,
        coverageTrend: 'stable',
        percentageChange: 0,
        uncoveredLines: 150,
        uncoveredBranches: 50,
        criticalPathCoverage: 92
      });

      const insights = await analyzer.generateInsights('BPMSoftwareSolutions', 30);

      expect(insights.anomalies.length).toBeGreaterThan(0);
      const cycleTimeAnomaly = insights.anomalies.find(a => a.metric === 'Cycle Time');
      expect(cycleTimeAnomaly).toBeDefined();
      expect(cycleTimeAnomaly?.severity).toBe('high');
    });

    it('should detect low test coverage anomaly', async () => {
      (metricsAggregator.initialize as any).mockResolvedValue(undefined);
      (metricsAggregator.getTeams as any).mockReturnValue(['team1']);
      (metricsAggregator.getTeamRepositories as any).mockReturnValue(['BPMSoftwareSolutions/repo1']);

      (prMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        repo: 'BPMSoftwareSolutions/repo1',
        prCount: 10,
        mergedCount: 9,
        avgCycleTime: 300,
        medianCycleTime: 250,
        avgPRSize: 5,
        avgAdditions: 100,
        avgDeletions: 50
      });

      (deploymentMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        repo: 'BPMSoftwareSolutions/repo1',
        deploymentCount: 20,
        successCount: 18,
        failureCount: 2,
        successRate: 0.9,
        avgDuration: 15,
        deploysPerDay: 1.5,
        rollbackCount: 1
      });

      (codeQualityCollector.collectQualityMetrics as any).mockResolvedValue({
        timestamp: new Date(),
        repo: 'BPMSoftwareSolutions/repo1',
        lintingIssues: { error: 0, warning: 2, info: 5 },
        typeErrors: 0,
        securityVulnerabilities: { critical: 0, high: 0, medium: 1, low: 2 },
        avgCyclomaticComplexity: 3.5,
        maxCyclomaticComplexity: 12,
        duplicationPercentage: 5,
        qualityScore: 85,
        qualityTrend: 'stable'
      });

      // Low coverage
      (testCoverageCollector.collectCoverageMetrics as any).mockResolvedValue({
        timestamp: new Date(),
        repo: 'BPMSoftwareSolutions/repo1',
        lineCoverage: 45,
        branchCoverage: 40,
        functionCoverage: 50,
        statementCoverage: 44,
        coverageTrend: 'degrading',
        percentageChange: -5,
        uncoveredLines: 500,
        uncoveredBranches: 150,
        criticalPathCoverage: 60
      });

      const insights = await analyzer.generateInsights('BPMSoftwareSolutions', 30);

      expect(insights.anomalies.length).toBeGreaterThan(0);
      const coverageAnomaly = insights.anomalies.find(a => a.metric === 'Test Coverage');
      expect(coverageAnomaly).toBeDefined();
      expect(coverageAnomaly?.severity).toBe('high');
    });

    it('should cache insights for 1 hour', async () => {
      (metricsAggregator.initialize as any).mockResolvedValue(undefined);
      (metricsAggregator.getTeams as any).mockReturnValue(['team1']);
      (metricsAggregator.getTeamRepositories as any).mockReturnValue(['BPMSoftwareSolutions/repo1']);

      (prMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        repo: 'BPMSoftwareSolutions/repo1',
        prCount: 10,
        mergedCount: 9,
        avgCycleTime: 300,
        medianCycleTime: 250,
        avgPRSize: 5,
        avgAdditions: 100,
        avgDeletions: 50
      });

      (deploymentMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        repo: 'BPMSoftwareSolutions/repo1',
        deploymentCount: 20,
        successCount: 18,
        failureCount: 2,
        successRate: 0.9,
        avgDuration: 15,
        deploysPerDay: 1.5,
        rollbackCount: 1
      });

      (codeQualityCollector.collectQualityMetrics as any).mockResolvedValue({
        timestamp: new Date(),
        repo: 'BPMSoftwareSolutions/repo1',
        lintingIssues: { error: 0, warning: 2, info: 5 },
        typeErrors: 0,
        securityVulnerabilities: { critical: 0, high: 0, medium: 1, low: 2 },
        avgCyclomaticComplexity: 3.5,
        maxCyclomaticComplexity: 12,
        duplicationPercentage: 5,
        qualityScore: 85,
        qualityTrend: 'stable'
      });

      (testCoverageCollector.collectCoverageMetrics as any).mockResolvedValue({
        timestamp: new Date(),
        repo: 'BPMSoftwareSolutions/repo1',
        lineCoverage: 85,
        branchCoverage: 80,
        functionCoverage: 88,
        statementCoverage: 84,
        coverageTrend: 'stable',
        percentageChange: 0,
        uncoveredLines: 150,
        uncoveredBranches: 50,
        criticalPathCoverage: 92
      });

      // First call
      const insights1 = await analyzer.generateInsights('BPMSoftwareSolutions', 30);

      // Second call should use cache
      const insights2 = await analyzer.generateInsights('BPMSoftwareSolutions', 30);

      expect(insights1).toEqual(insights2);
      // Verify that collectors were called only once (cached on second call)
      expect(metricsAggregator.initialize).toHaveBeenCalledTimes(1);
    });
  });
});

