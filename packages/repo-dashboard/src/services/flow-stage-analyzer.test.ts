/**
 * Unit tests for FlowStageAnalyzerService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlowStageAnalyzerService } from './flow-stage-analyzer.js';
import { PullRequestMetricsCollector, PRMetrics } from './pull-request-metrics-collector.js';

describe('FlowStageAnalyzerService', () => {
  let flowAnalyzer: FlowStageAnalyzerService;
  let mockPRCollector: PullRequestMetricsCollector;

  beforeEach(() => {
    mockPRCollector = {
      collectPRMetrics: vi.fn()
    } as any;
    flowAnalyzer = new FlowStageAnalyzerService(mockPRCollector);
  });

  describe('analyzeFlowStages', () => {
    it('should analyze flow stages for merged PRs', async () => {
      const mockMetrics: PRMetrics[] = [
        {
          prId: '1',
          prNumber: 1,
          repo: 'test-repo',
          createdAt: new Date('2025-01-01'),
          firstReviewAt: new Date('2025-01-02'),
          approvedAt: new Date('2025-01-03'),
          mergedAt: new Date('2025-01-04'),
          timeToFirstReview: 1440,
          timeToApproval: 1440,
          timeToMerge: 1440,
          status: 'merged',
          author: 'user1',
          title: 'Test PR 1',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 4320
        }
      ];

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const breakdown = await flowAnalyzer.analyzeFlowStages('org', 'team1', 'repo1', 30);

      expect(breakdown.stages.length).toBeGreaterThan(0);
      expect(breakdown.totalMedianCycleTime).toBe(4320);
      expect(breakdown.longestStage).toBeDefined();
    });

    it('should handle empty PR list', async () => {
      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue([]);

      const breakdown = await flowAnalyzer.analyzeFlowStages('org', 'team1', 'repo1', 30);

      expect(breakdown.stages.length).toBe(0);
      expect(breakdown.totalMedianCycleTime).toBe(0);
      expect(breakdown.anomalies.length).toBe(0);
    });

    it('should filter only merged PRs', async () => {
      const mockMetrics: PRMetrics[] = [
        {
          prId: '1',
          prNumber: 1,
          repo: 'test-repo',
          createdAt: new Date('2025-01-01'),
          firstReviewAt: new Date('2025-01-02'),
          approvedAt: new Date('2025-01-03'),
          mergedAt: new Date('2025-01-04'),
          timeToFirstReview: 1440,
          timeToApproval: 1440,
          timeToMerge: 1440,
          status: 'merged',
          author: 'user1',
          title: 'Test PR 1',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 4320
        },
        {
          prId: '2',
          prNumber: 2,
          repo: 'test-repo',
          createdAt: new Date('2025-01-01'),
          status: 'open',
          author: 'user2',
          title: 'Test PR 2',
          filesChanged: 3,
          additions: 80,
          deletions: 40,
          totalCycleTime: 0
        }
      ];

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const breakdown = await flowAnalyzer.analyzeFlowStages('org', 'team1', 'repo1', 30);

      expect(breakdown.totalMedianCycleTime).toBe(4320);
    });

    it('should detect anomalies in flow stages', async () => {
      const mockMetrics: PRMetrics[] = Array.from({ length: 10 }, (_, i) => ({
        prId: `${i}`,
        prNumber: i,
        repo: 'test-repo',
        createdAt: new Date('2025-01-01'),
        firstReviewAt: new Date('2025-01-02'),
        approvedAt: new Date('2025-01-03'),
        mergedAt: new Date('2025-01-04'),
        timeToFirstReview: i < 2 ? 7200 : 1440, // 2 PRs with 2x median time
        timeToApproval: 1440,
        timeToMerge: 1440,
        status: 'merged',
        author: 'user',
        title: `Test PR ${i}`,
        filesChanged: 5,
        additions: 100,
        deletions: 50,
        totalCycleTime: 4320
      }));

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const breakdown = await flowAnalyzer.analyzeFlowStages('org', 'team1', 'repo1', 30);

      expect(breakdown.anomalies.length).toBeGreaterThan(0);
    });

    it('should calculate stage percentages', async () => {
      const mockMetrics: PRMetrics[] = [
        {
          prId: '1',
          prNumber: 1,
          repo: 'test-repo',
          createdAt: new Date('2025-01-01'),
          firstReviewAt: new Date('2025-01-02'),
          approvedAt: new Date('2025-01-03'),
          mergedAt: new Date('2025-01-04'),
          timeToFirstReview: 1440,
          timeToApproval: 1440,
          timeToMerge: 1440,
          status: 'merged',
          author: 'user1',
          title: 'Test PR 1',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 4320
        }
      ];

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const breakdown = await flowAnalyzer.analyzeFlowStages('org', 'team1', 'repo1', 30);

      const totalPercentage = breakdown.stages.reduce((sum, s) => sum + s.percentageOfTime, 0);
      expect(totalPercentage).toBeGreaterThan(0);
    });
  });

  describe('clearHistory', () => {
    it('should clear history for a repository', async () => {
      const mockMetrics: PRMetrics[] = [
        {
          prId: '1',
          prNumber: 1,
          repo: 'test-repo',
          createdAt: new Date('2025-01-01'),
          firstReviewAt: new Date('2025-01-02'),
          approvedAt: new Date('2025-01-03'),
          mergedAt: new Date('2025-01-04'),
          timeToFirstReview: 1440,
          timeToApproval: 1440,
          timeToMerge: 1440,
          status: 'merged',
          author: 'user1',
          title: 'Test PR 1',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 4320
        }
      ];

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      await flowAnalyzer.analyzeFlowStages('org', 'team1', 'repo1', 30);
      flowAnalyzer.clearHistory('org', 'repo1');

      // After clearing, next call should have fresh history
      await flowAnalyzer.analyzeFlowStages('org', 'team1', 'repo1', 30);
    });
  });

  describe('stage metrics calculation', () => {
    it('should calculate median times correctly', async () => {
      const mockMetrics: PRMetrics[] = [
        {
          prId: '1',
          prNumber: 1,
          repo: 'test-repo',
          createdAt: new Date('2025-01-01'),
          firstReviewAt: new Date('2025-01-02'),
          approvedAt: new Date('2025-01-03'),
          mergedAt: new Date('2025-01-04'),
          timeToFirstReview: 1000,
          timeToApproval: 2000,
          timeToMerge: 3000,
          status: 'merged',
          author: 'user1',
          title: 'Test PR 1',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 6000
        },
        {
          prId: '2',
          prNumber: 2,
          repo: 'test-repo',
          createdAt: new Date('2025-01-01'),
          firstReviewAt: new Date('2025-01-02'),
          approvedAt: new Date('2025-01-03'),
          mergedAt: new Date('2025-01-04'),
          timeToFirstReview: 2000,
          timeToApproval: 3000,
          timeToMerge: 4000,
          status: 'merged',
          author: 'user2',
          title: 'Test PR 2',
          filesChanged: 5,
          additions: 100,
          deletions: 50,
          totalCycleTime: 9000
        }
      ];

      vi.mocked(mockPRCollector.collectPRMetrics).mockResolvedValue(mockMetrics);

      const breakdown = await flowAnalyzer.analyzeFlowStages('org', 'team1', 'repo1', 30);

      expect(breakdown.stages.length).toBeGreaterThan(0);
      const firstReviewStage = breakdown.stages.find(s => s.stage === 'First Review');
      expect(firstReviewStage?.medianTime).toBe(1500); // median of 1000 and 2000
    });
  });
});

