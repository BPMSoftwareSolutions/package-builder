/**
 * Tests for Metrics Aggregator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsAggregator } from './metrics-aggregator.js';

// Mock the collectors
vi.mock('./pull-request-metrics-collector.js', () => ({
  prMetricsCollector: {
    collectPRMetrics: vi.fn(),
    calculateAggregateMetrics: vi.fn()
  }
}));

vi.mock('./deployment-metrics-collector.js', () => ({
  deploymentMetricsCollector: {
    collectDeploymentMetrics: vi.fn(),
    calculateAggregateMetrics: vi.fn()
  }
}));

import { prMetricsCollector } from './pull-request-metrics-collector.js';
import { deploymentMetricsCollector } from './deployment-metrics-collector.js';

describe('MetricsAggregator', () => {
  let aggregator: MetricsAggregator;

  beforeEach(() => {
    aggregator = new MetricsAggregator();
    vi.clearAllMocks();
  });

  describe('aggregateTeamMetrics', () => {
    it('should aggregate metrics for Host Team', async () => {
      (prMetricsCollector.collectPRMetrics as any).mockResolvedValue([
        { totalCycleTime: 1440 } // 1 day
      ]);

      (prMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        prCount: 1,
        mergedCount: 1,
        avgCycleTime: 1440,
        avgPRSize: 5
      });

      (deploymentMetricsCollector.collectDeploymentMetrics as any).mockResolvedValue([
        { status: 'success', duration: 30 }
      ]);

      (deploymentMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        deploymentCount: 1,
        successCount: 1,
        failureCount: 0,
        successRate: 1,
        avgDuration: 30,
        deploysPerDay: 0.5
      });

      const teamMetrics = await aggregator.aggregateTeamMetrics('BPMSoftwareSolutions', 'Host Team', '30d');

      expect(teamMetrics.team).toBe('Host Team');
      expect(teamMetrics.repos).toContain('renderx-plugins-demo');
      expect(teamMetrics.prCount).toBeGreaterThanOrEqual(0);
      expect(teamMetrics.deploymentCount).toBeGreaterThanOrEqual(0);
    });

    it('should aggregate metrics for SDK Team', async () => {
      (prMetricsCollector.collectPRMetrics as any).mockResolvedValue([]);
      (prMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        prCount: 0,
        mergedCount: 0,
        avgCycleTime: 0,
        avgPRSize: 0
      });

      (deploymentMetricsCollector.collectDeploymentMetrics as any).mockResolvedValue([]);
      (deploymentMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        deploymentCount: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgDuration: 0,
        deploysPerDay: 0
      });

      const teamMetrics = await aggregator.aggregateTeamMetrics('BPMSoftwareSolutions', 'SDK Team', '30d');

      expect(teamMetrics.team).toBe('SDK Team');
      expect(teamMetrics.repos).toContain('renderx-plugins-sdk');
      expect(teamMetrics.repos).toContain('renderx-manifest-tools');
    });

    it('should use 7-day period when specified', async () => {
      (prMetricsCollector.collectPRMetrics as any).mockResolvedValue([]);
      (prMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        prCount: 0,
        mergedCount: 0,
        avgCycleTime: 0,
        avgPRSize: 0
      });

      (deploymentMetricsCollector.collectDeploymentMetrics as any).mockResolvedValue([]);
      (deploymentMetricsCollector.calculateAggregateMetrics as any).mockResolvedValue({
        deploymentCount: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgDuration: 0,
        deploysPerDay: 0
      });

      const teamMetrics = await aggregator.aggregateTeamMetrics('BPMSoftwareSolutions', 'Host Team', '7d');

      expect(teamMetrics.period).toBe('7d');
    });
  });

  describe('calculateRollingAverage', () => {
    it('should calculate rolling average', () => {
      const values = [10, 20, 30, 40, 50];
      const result = aggregator.calculateRollingAverage(values, 3);

      expect(result.period).toBe(3);
      expect(result.values).toHaveLength(5);
      expect(result.average).toBeGreaterThan(0);
    });

    it('should handle empty values', () => {
      const result = aggregator.calculateRollingAverage([], 3);

      expect(result.values).toHaveLength(0);
      expect(result.average).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it('should detect improving trend', () => {
      // Values that show improvement (decreasing)
      const values = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
      const result = aggregator.calculateRollingAverage(values, 5);

      expect(result.trend).toBe('improving');
    });

    it('should detect degrading trend', () => {
      // Values that show degradation (increasing)
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const result = aggregator.calculateRollingAverage(values, 5);

      expect(result.trend).toBe('degrading');
    });
  });

  describe('team management', () => {
    it('should return all teams', () => {
      const teams = aggregator.getTeams();

      expect(teams).toContain('Host Team');
      expect(teams).toContain('SDK Team');
      expect(teams).toContain('Conductor Team');
      expect(teams).toContain('Plugin Teams');
    });

    it('should return repositories for a team', () => {
      const repos = aggregator.getTeamRepositories('Host Team');

      expect(repos).toContain('renderx-plugins-demo');
      expect(repos).toHaveLength(1);
    });

    it('should return empty array for unknown team', () => {
      const repos = aggregator.getTeamRepositories('Unknown Team');

      expect(repos).toHaveLength(0);
    });

    it('should return all plugin team repositories', () => {
      const repos = aggregator.getTeamRepositories('Plugin Teams');

      expect(repos).toContain('renderx-plugins-canvas');
      expect(repos).toContain('renderx-plugins-components');
      expect(repos).toContain('renderx-plugins-control-panel');
      expect(repos).toContain('renderx-plugins-header');
      expect(repos).toContain('renderx-plugins-library');
    });
  });
});

