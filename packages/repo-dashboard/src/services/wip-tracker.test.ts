/**
 * Unit tests for WIPTrackerService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WIPTrackerService } from './wip-tracker.js';
import { PullRequestMetricsCollector, PRMetrics } from './pull-request-metrics-collector.js';

describe('WIPTrackerService', () => {
  let wipTracker: WIPTrackerService;
  let mockPRCollector: PullRequestMetricsCollector;

  beforeEach(() => {
    mockPRCollector = {
      collectPRMetrics: vi.fn()
    } as any;
    wipTracker = new WIPTrackerService(mockPRCollector);
  });

  describe('calculateWIPMetrics', () => {
    it('should calculate WIP metrics for a team', async () => {
      const mockMetrics: PRMetrics[] = [
        {
          prId: '1',
          prNumber: 1,
          repo: 'test-repo',
          createdAt: new Date(),
          mergedAt: new Date(),
          status: 'open',
          author: 'user1',
          title: 'Test PR 1',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 1440
        },
        {
          prId: '2',
          prNumber: 2,
          repo: 'test-repo',
          createdAt: new Date(),
          mergedAt: new Date(),
          status: 'open',
          author: 'user2',
          title: 'Test PR 2',
          filesChanged: 3,
          additions: 80,
          deletions: 40,
          totalCycleTime: 1440
        }
      ];

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const metrics = await wipTracker.calculateWIPMetrics('org', 'team1', ['repo1'], 30);

      expect(metrics.openPRCount).toBe(2);
      expect(metrics.avgFilesChanged).toBe(4);
      // (100 + 50 + 80 + 40) / 2 = 270 / 2 = 135
      expect(metrics.avgDiffLines).toBe(135);
      expect(metrics.trend).toBeDefined();
    });

    it('should handle empty PR list', async () => {
      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue([]);

      const metrics = await wipTracker.calculateWIPMetrics('org', 'team1', ['repo1'], 30);

      expect(metrics.openPRCount).toBe(0);
      expect(metrics.avgFilesChanged).toBe(0);
      expect(metrics.avgDiffLines).toBe(0);
    });

    it('should filter only open PRs', async () => {
      const mockMetrics: PRMetrics[] = [
        {
          prId: '1',
          prNumber: 1,
          repo: 'test-repo',
          createdAt: new Date(),
          mergedAt: new Date(),
          status: 'open',
          author: 'user1',
          title: 'Test PR 1',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 1440
        },
        {
          prId: '2',
          prNumber: 2,
          repo: 'test-repo',
          createdAt: new Date(),
          mergedAt: new Date(),
          status: 'merged',
          author: 'user2',
          title: 'Test PR 2',
          filesChanged: 3,
          additions: 80,
          deletions: 40,
          totalCycleTime: 1440
        }
      ];

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const metrics = await wipTracker.calculateWIPMetrics('org', 'team1', ['repo1'], 30);

      expect(metrics.openPRCount).toBe(1);
    });

    it('should track history', async () => {
      const mockMetrics: PRMetrics[] = [
        {
          prId: '1',
          prNumber: 1,
          repo: 'test-repo',
          createdAt: new Date(),
          mergedAt: new Date(),
          status: 'open',
          author: 'user1',
          title: 'Test PR 1',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 1440
        }
      ];

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const metrics1 = await wipTracker.calculateWIPMetrics('org', 'team1', ['repo1'], 30);
      expect(metrics1.history.length).toBe(1);

      const metrics2 = await wipTracker.calculateWIPMetrics('org', 'team1', ['repo1'], 30);
      expect(metrics2.history.length).toBe(2);
    });
  });

  describe('checkWIPAlert', () => {
    it('should detect WIP threshold exceeded', async () => {
      const mockMetrics: PRMetrics[] = Array.from({ length: 15 }, (_, i) => ({
        prId: `${i}`,
        prNumber: i,
        repo: 'test-repo',
        createdAt: new Date(),
        mergedAt: new Date(),
        status: 'open',
        author: 'user',
        title: `Test PR ${i}`,
        filesChanged: 5,
        additions: 100,
        deletions: 50,
        totalCycleTime: 1440
      }));

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const alert = await wipTracker.checkWIPAlert('org', 'team1', ['repo1'], 10);

      expect(alert.isExceeded).toBe(true);
      expect(alert.currentWIP).toBe(15);
      expect(alert.threshold).toBe(10);
    });

    it('should not alert when WIP is below threshold', async () => {
      const mockMetrics: PRMetrics[] = Array.from({ length: 5 }, (_, i) => ({
        prId: `${i}`,
        prNumber: i,
        repo: 'test-repo',
        createdAt: new Date(),
        mergedAt: new Date(),
        status: 'open',
        author: 'user',
        title: `Test PR ${i}`,
        filesChanged: 5,
        additions: 100,
        deletions: 50,
        totalCycleTime: 1440
      }));

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const alert = await wipTracker.checkWIPAlert('org', 'team1', ['repo1'], 10);

      expect(alert.isExceeded).toBe(false);
      expect(alert.currentWIP).toBe(5);
    });

    it('should set critical severity when WIP exceeds 1.5x threshold', async () => {
      const mockMetrics: PRMetrics[] = Array.from({ length: 20 }, (_, i) => ({
        prId: `${i}`,
        prNumber: i,
        repo: 'test-repo',
        createdAt: new Date(),
        mergedAt: new Date(),
        status: 'open',
        author: 'user',
        title: `Test PR ${i}`,
        filesChanged: 5,
        additions: 100,
        deletions: 50,
        totalCycleTime: 1440
      }));

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const alert = await wipTracker.checkWIPAlert('org', 'team1', ['repo1'], 10);

      expect(alert.severity).toBe('critical');
    });
  });

  describe('clearHistory', () => {
    it('should clear history for a team', async () => {
      const mockMetrics: PRMetrics[] = [
        {
          prId: '1',
          prNumber: 1,
          repo: 'test-repo',
          createdAt: new Date(),
          mergedAt: new Date(),
          status: 'open',
          author: 'user1',
          title: 'Test PR 1',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 1440
        }
      ];

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      await wipTracker.calculateWIPMetrics('org', 'team1', ['repo1'], 30);
      wipTracker.clearHistory('org', 'team1');

      const history = wipTracker.getHistory('org', 'team1');
      expect(history.length).toBe(0);
    });
  });

  describe('getHistory', () => {
    it('should return empty array for non-existent team', () => {
      const history = wipTracker.getHistory('org', 'non-existent');
      expect(history).toEqual([]);
    });
  });
});

