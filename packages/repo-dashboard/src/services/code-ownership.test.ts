/**
 * Unit tests for Code Ownership Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeOwnershipService } from './code-ownership.js';

describe('CodeOwnershipService', () => {
  let service: CodeOwnershipService;

  beforeEach(() => {
    service = new CodeOwnershipService();
  });

  describe('calculateOwnership', () => {
    it('should calculate code ownership metrics', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts', 'src/utils.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
      ];

      const metrics = await service.calculateOwnership(
        'org',
        'team',
        'repo',
        commitHistory,
        []
      );

      expect(metrics.ownershipConcentration).toBeGreaterThan(0);
      expect(metrics.topOwners.length).toBeGreaterThan(0);
    });

    it('should identify top owners', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts', 'src/utils.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
        { author: 'charlie', files: ['src/config.ts'] },
      ];

      const metrics = await service.calculateOwnership(
        'org',
        'team',
        'repo',
        commitHistory,
        []
      );

      expect(metrics.topOwners[0].name).toBe('alice');
      // alice owns 2 files out of 4 total = 0.5
      expect(metrics.topOwners[0].ownership).toBeCloseTo(0.5, 0.1);
    });

    it('should calculate review coverage', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
      ];

      const reviewData = [
        { file: 'src/main.ts', reviewers: ['bob', 'charlie'] },
      ];

      const metrics = await service.calculateOwnership(
        'org',
        'team',
        'repo',
        commitHistory,
        reviewData
      );

      expect(metrics.avgReviewCoverage).toBeGreaterThan(0);
      expect(metrics.avgReviewCoverage).toBeLessThanOrEqual(1);
    });

    it('should identify orphaned files without reviews', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
      ];

      const reviewData = [
        { file: 'src/main.ts', reviewers: ['bob'] },
      ];

      const metrics = await service.calculateOwnership(
        'org',
        'team',
        'repo',
        commitHistory,
        reviewData
      );

      expect(metrics.orphanedFiles.length).toBeGreaterThan(0);
      expect(metrics.filesWithoutReview).toBeGreaterThan(0);
    });

    it('should generate recommendations for high ownership concentration', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts', 'src/utils.ts', 'src/api.ts'] },
      ];

      const metrics = await service.calculateOwnership(
        'org',
        'team',
        'repo',
        commitHistory,
        []
      );

      expect(metrics.recommendations.some(r => r.includes('ownership'))).toBe(true);
    });

    it('should generate recommendations for low review coverage', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      const metrics = await service.calculateOwnership(
        'org',
        'team',
        'repo',
        commitHistory,
        []
      );

      expect(metrics.recommendations.some(r => r.includes('review'))).toBe(true);
    });

    it('should calculate orphaned percentage', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
        { author: 'charlie', files: ['src/config.ts'] },
      ];

      const metrics = await service.calculateOwnership(
        'org',
        'team',
        'repo',
        commitHistory,
        []
      );

      expect(metrics.orphanedPercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.orphanedPercentage).toBeLessThanOrEqual(100);
    });

    it('should maintain history', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      await service.calculateOwnership('org', 'team', 'repo', commitHistory, []);
      await service.calculateOwnership('org', 'team', 'repo', commitHistory, []);

      const history = service.getHistory('org', 'team', 'repo');
      expect(history.length).toBe(2);
    });

    it('should clear history', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      await service.calculateOwnership('org', 'team', 'repo', commitHistory, []);
      service.clearHistory('org', 'team', 'repo');

      const history = service.getHistory('org', 'team', 'repo');
      expect(history.length).toBe(0);
    });

    it('should handle empty commit history', async () => {
      const metrics = await service.calculateOwnership('org', 'team', 'repo', [], []);

      expect(metrics.topOwners.length).toBe(0);
      expect(metrics.avgReviewCoverage).toBe(0);
    });

    it('should include timestamp', async () => {
      const metrics = await service.calculateOwnership('org', 'team', 'repo', [], []);

      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should limit history to max points', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      for (let i = 0; i < 150; i++) {
        await service.calculateOwnership('org', 'team', 'repo', commitHistory, []);
      }

      const history = service.getHistory('org', 'team', 'repo');
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should track last modified date for files', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      const metrics = await service.calculateOwnership(
        'org',
        'team',
        'repo',
        commitHistory,
        []
      );

      if (metrics.orphanedFiles.length > 0) {
        expect(metrics.orphanedFiles[0].lastModified).toBeInstanceOf(Date);
      }
    });
  });
});

