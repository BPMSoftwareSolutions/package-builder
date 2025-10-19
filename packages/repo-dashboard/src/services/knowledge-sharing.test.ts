/**
 * Unit tests for Knowledge Sharing Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeSharingService } from './knowledge-sharing.js';

describe('KnowledgeSharingService', () => {
  let service: KnowledgeSharingService;

  beforeEach(() => {
    service = new KnowledgeSharingService();
  });

  describe('calculateMetrics', () => {
    it('should calculate knowledge sharing metrics', async () => {
      const prMetrics = [
        { reviewers: ['alice', 'bob'] },
        { reviewers: ['bob', 'charlie'] },
        { reviewers: ['alice'] },
      ];

      const metrics = await service.calculateMetrics(
        'org',
        'team',
        prMetrics,
        5,
        2,
        1
      );

      expect(metrics.reviewParticipants).toBe(3);
      expect(metrics.avgReviewersPerPR).toBeCloseTo(1.67, 1);
      expect(metrics.documentationUpdates).toBe(5);
      expect(metrics.knowledgeSharingEvents).toBe(2);
      expect(metrics.pairProgrammingSessions).toBe(1);
    });

    it('should calculate review coverage', async () => {
      const prMetrics = [
        { reviewers: ['alice', 'bob'] },
        { reviewers: ['bob', 'charlie'] },
      ];

      const metrics = await service.calculateMetrics('org', 'team', prMetrics, 0, 0, 0);

      expect(metrics.reviewCoverage).toBeGreaterThan(0);
      expect(metrics.reviewCoverage).toBeLessThanOrEqual(1);
    });

    it('should calculate documentation coverage', async () => {
      const metrics = await service.calculateMetrics('org', 'team', [], 10, 0, 0);

      expect(metrics.documentationCoverage).toBeGreaterThan(0);
      expect(metrics.documentationCoverage).toBeLessThanOrEqual(1);
    });

    it('should generate recommendations for low review coverage', async () => {
      const metrics = await service.calculateMetrics('org', 'team', [], 0, 0, 0);

      expect(metrics.recommendations.length).toBeGreaterThan(0);
      expect(metrics.recommendations.some(r => r.includes('review'))).toBe(true);
    });

    it('should generate recommendations for low documentation', async () => {
      const metrics = await service.calculateMetrics('org', 'team', [], 0, 0, 0);

      expect(metrics.recommendations.some(r => r.includes('documentation'))).toBe(true);
    });

    it('should generate recommendations for few knowledge sharing events', async () => {
      const metrics = await service.calculateMetrics('org', 'team', [], 0, 0, 0);

      expect(metrics.recommendations.some(r => r.includes('learning'))).toBe(true);
    });

    it('should generate recommendations for no pair programming', async () => {
      const metrics = await service.calculateMetrics('org', 'team', [], 0, 0, 0);

      expect(metrics.recommendations.some(r => r.includes('pair'))).toBe(true);
    });

    it('should calculate trend from history', async () => {
      const prMetrics = [
        { reviewers: ['alice', 'bob'] },
        { reviewers: ['bob', 'charlie'] },
      ];

      await service.calculateMetrics('org', 'team', prMetrics, 5, 2, 1);
      const metrics = await service.calculateMetrics('org', 'team', prMetrics, 5, 2, 1);

      expect(['improving', 'stable', 'degrading']).toContain(metrics.trend);
    });

    it('should maintain history', async () => {
      const prMetrics = [
        { reviewers: ['alice', 'bob'] },
      ];

      await service.calculateMetrics('org', 'team', prMetrics, 5, 2, 1);
      await service.calculateMetrics('org', 'team', prMetrics, 5, 2, 1);

      const history = service.getHistory('org', 'team');
      expect(history.length).toBe(2);
    });

    it('should clear history', async () => {
      const prMetrics = [
        { reviewers: ['alice', 'bob'] },
      ];

      await service.calculateMetrics('org', 'team', prMetrics, 5, 2, 1);
      service.clearHistory('org', 'team');

      const history = service.getHistory('org', 'team');
      expect(history.length).toBe(0);
    });

    it('should handle empty PR metrics', async () => {
      const metrics = await service.calculateMetrics('org', 'team', [], 0, 0, 0);

      expect(metrics.reviewParticipants).toBe(0);
      expect(metrics.avgReviewersPerPR).toBe(0);
    });

    it('should include timestamp', async () => {
      const metrics = await service.calculateMetrics('org', 'team', [], 0, 0, 0);

      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should limit history to max points', async () => {
      const prMetrics = [
        { reviewers: ['alice', 'bob'] },
      ];

      for (let i = 0; i < 150; i++) {
        await service.calculateMetrics('org', 'team', prMetrics, 5, 2, 1);
      }

      const history = service.getHistory('org', 'team');
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should calculate stable trend when metrics are consistent', async () => {
      const prMetrics = [
        { reviewers: ['alice', 'bob'] },
      ];

      for (let i = 0; i < 20; i++) {
        await service.calculateMetrics('org', 'team', prMetrics, 5, 2, 1);
      }

      const metrics = await service.calculateMetrics('org', 'team', prMetrics, 5, 2, 1);
      expect(metrics.trend).toBe('stable');
    });
  });
});

