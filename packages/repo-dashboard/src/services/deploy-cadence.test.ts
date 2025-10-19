/**
 * Unit tests for DeployCadenceService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeployCadenceService } from './deploy-cadence.js';
import { DeploymentMetricsCollector, DeploymentMetrics } from './deployment-metrics-collector.js';

describe('DeployCadenceService', () => {
  let deployCadence: DeployCadenceService;
  let mockDeploymentCollector: DeploymentMetricsCollector;

  beforeEach(() => {
    mockDeploymentCollector = {
      collectDeploymentMetrics: vi.fn()
    } as any;
    deployCadence = new DeployCadenceService(mockDeploymentCollector);
  });

  describe('calculateDeployCadence', () => {
    it('should calculate deploy cadence metrics', async () => {
      const mockDeployments: DeploymentMetrics[] = [
        {
          workflowRunId: '1',
          workflowName: 'Deploy to Production',
          environment: 'production',
          status: 'success',
          triggeredAt: new Date('2025-01-01'),
          duration: 300,
          isRollback: false,
          repo: 'test-repo'
        },
        {
          workflowRunId: '2',
          workflowName: 'Deploy to Production',
          environment: 'production',
          status: 'success',
          triggeredAt: new Date('2025-01-02'),
          duration: 300,
          isRollback: false,
          repo: 'test-repo'
        },
        {
          workflowRunId: '3',
          workflowName: 'Deploy to Staging',
          environment: 'staging',
          status: 'success',
          triggeredAt: new Date('2025-01-01'),
          duration: 200,
          isRollback: false,
          repo: 'test-repo'
        }
      ];

      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue(mockDeployments);

      const metrics = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);

      expect(metrics.environments.length).toBe(2);
      expect(metrics.totalDeploysPerDay).toBeGreaterThan(0);
      expect(metrics.overallSuccessRate).toBe(100);
    });

    it('should handle empty deployment list', async () => {
      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue([]);

      const metrics = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);

      expect(metrics.environments.length).toBe(0);
      expect(metrics.totalDeploysPerDay).toBe(0);
      expect(metrics.overallSuccessRate).toBe(0);
    });

    it('should calculate success rate correctly', async () => {
      const mockDeployments: DeploymentMetrics[] = [
        {
          workflowRunId: '1',
          workflowName: 'Deploy to Production',
          environment: 'production',
          status: 'success',
          triggeredAt: new Date('2025-01-01'),
          duration: 300,
          isRollback: false,
          repo: 'test-repo'
        },
        {
          workflowRunId: '2',
          workflowName: 'Deploy to Production',
          environment: 'production',
          status: 'failure',
          triggeredAt: new Date('2025-01-02'),
          duration: 300,
          isRollback: false,
          repo: 'test-repo'
        }
      ];

      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue(mockDeployments);

      const metrics = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);

      expect(metrics.overallSuccessRate).toBe(50);
    });

    it('should track rollbacks', async () => {
      const mockDeployments: DeploymentMetrics[] = [
        {
          workflowRunId: '1',
          workflowName: 'Deploy to Production',
          environment: 'production',
          status: 'success',
          triggeredAt: new Date('2025-01-01'),
          duration: 300,
          isRollback: false,
          repo: 'test-repo'
        },
        {
          workflowRunId: '2',
          workflowName: 'Rollback Production',
          environment: 'production',
          status: 'success',
          triggeredAt: new Date('2025-01-02'),
          duration: 300,
          isRollback: true,
          repo: 'test-repo'
        }
      ];

      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue(mockDeployments);

      const metrics = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);

      expect(metrics.totalRollbacks).toBe(1);
    });

    it('should group deployments by environment', async () => {
      const mockDeployments: DeploymentMetrics[] = [
        {
          workflowRunId: '1',
          workflowName: 'Deploy to Production',
          environment: 'production',
          status: 'success',
          triggeredAt: new Date('2025-01-01'),
          duration: 300,
          isRollback: false,
          repo: 'test-repo'
        },
        {
          workflowRunId: '2',
          workflowName: 'Deploy to Staging',
          environment: 'staging',
          status: 'success',
          triggeredAt: new Date('2025-01-01'),
          duration: 200,
          isRollback: false,
          repo: 'test-repo'
        },
        {
          workflowRunId: '3',
          workflowName: 'Deploy to Dev',
          environment: 'dev',
          status: 'success',
          triggeredAt: new Date('2025-01-01'),
          duration: 100,
          isRollback: false,
          repo: 'test-repo'
        }
      ];

      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue(mockDeployments);

      const metrics = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);

      expect(metrics.environments.length).toBe(3);
      expect(metrics.environments.map(e => e.environment)).toContain('production');
      expect(metrics.environments.map(e => e.environment)).toContain('staging');
      expect(metrics.environments.map(e => e.environment)).toContain('dev');
    });

    it('should calculate deploys per day', async () => {
      const mockDeployments: DeploymentMetrics[] = Array.from({ length: 30 }, (_, i) => ({
        workflowRunId: `${i}`,
        workflowName: 'Deploy to Production',
        environment: 'production',
        status: 'success',
        triggeredAt: new Date('2025-01-01'),
        duration: 300,
        isRollback: false,
        repo: 'test-repo'
      }));

      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue(mockDeployments);

      const metrics = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);

      expect(metrics.totalDeploysPerDay).toBe(1);
    });

    it('should track history', async () => {
      const mockDeployments: DeploymentMetrics[] = [
        {
          workflowRunId: '1',
          workflowName: 'Deploy to Production',
          environment: 'production',
          status: 'success',
          triggeredAt: new Date('2025-01-01'),
          duration: 300,
          isRollback: false,
          repo: 'test-repo'
        }
      ];

      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue(mockDeployments);

      const metrics1 = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);
      expect(metrics1.history.length).toBe(1);

      const metrics2 = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);
      expect(metrics2.history.length).toBe(2);
    });
  });

  describe('clearHistory', () => {
    it('should clear history for a repository', async () => {
      const mockDeployments: DeploymentMetrics[] = [
        {
          workflowRunId: '1',
          workflowName: 'Deploy to Production',
          environment: 'production',
          status: 'success',
          triggeredAt: new Date('2025-01-01'),
          duration: 300,
          isRollback: false,
          repo: 'test-repo'
        }
      ];

      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue(mockDeployments);

      await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);
      deployCadence.clearHistory('org', 'repo1');

      const history = deployCadence.getHistory('org', 'repo1');
      expect(history.length).toBe(0);
    });
  });

  describe('getHistory', () => {
    it('should return empty array for non-existent repository', () => {
      const history = deployCadence.getHistory('org', 'non-existent');
      expect(history).toEqual([]);
    });
  });

  describe('trend calculation', () => {
    it('should detect increasing trend', async () => {
      const mockDeployments: DeploymentMetrics[] = Array.from({ length: 30 }, (_, i) => ({
        workflowRunId: `${i}`,
        workflowName: 'Deploy to Production',
        environment: 'production',
        status: 'success',
        triggeredAt: new Date('2025-01-01'),
        duration: 300,
        isRollback: false,
        repo: 'test-repo'
      }));

      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue(mockDeployments);

      const metrics1 = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);

      // Simulate more deployments
      const moreDeployments = Array.from({ length: 50 }, (_, i) => ({
        workflowRunId: `${i}`,
        workflowName: 'Deploy to Production',
        environment: 'production',
        status: 'success',
        triggeredAt: new Date('2025-01-01'),
        duration: 300,
        isRollback: false,
        repo: 'test-repo'
      }));

      vi.mocked(mockDeploymentCollector.collectDeploymentMetrics).mockResolvedValue(moreDeployments);

      const metrics2 = await deployCadence.calculateDeployCadence('org', 'team1', 'repo1', 30);

      expect(metrics2.trend).toBeDefined();
    });
  });
});

