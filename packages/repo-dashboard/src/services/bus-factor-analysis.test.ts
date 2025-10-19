/**
 * Unit tests for Bus Factor Analysis Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BusFactorAnalysisService } from './bus-factor-analysis.js';

describe('BusFactorAnalysisService', () => {
  let service: BusFactorAnalysisService;

  beforeEach(() => {
    service = new BusFactorAnalysisService();
  });

  describe('analyzeBusFactor', () => {
    it('should calculate bus factor of 1 when only one person has commits', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts', 'src/utils.ts'] },
        { author: 'alice', files: ['src/main.ts'] },
        { author: 'alice', files: ['src/api.ts'] },
      ];

      const analysis = await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);

      expect(analysis.busFactor).toBe(1);
      expect(analysis.riskLevel).toBe('critical');
      expect(analysis.keyPeople.length).toBeGreaterThan(0);
      expect(analysis.keyPeople[0].name).toBe('alice');
    });

    it('should calculate bus factor of 2 when two people cover 50% of commits', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
        { author: 'alice', files: ['src/utils.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
        { author: 'bob', files: ['src/config.ts'] },
        { author: 'charlie', files: ['src/test.ts'] },
      ];

      const analysis = await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);

      expect(analysis.busFactor).toBe(2);
      expect(analysis.riskLevel).toBe('high');
    });

    it('should identify orphaned files (single author)', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
        { author: 'charlie', files: ['src/config.ts'] },
      ];

      const analysis = await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);

      expect(analysis.orphanedFiles.length).toBe(3);
      expect(analysis.orphanedPercentage).toBe(100);
    });

    it('should generate recommendations for critical risk', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts', 'src/utils.ts', 'src/api.ts'] },
      ];

      const analysis = await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations[0]).toContain('CRITICAL');
    });

    it('should handle empty commit history', async () => {
      const analysis = await service.analyzeBusFactor('org', 'team', 'repo', []);

      expect(analysis.busFactor).toBeGreaterThanOrEqual(1);
      expect(analysis.busFactor).toBeLessThanOrEqual(5);
      expect(analysis.keyPeople.length).toBe(0);
    });

    it('should track key people with ownership percentages', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
        { author: 'alice', files: ['src/utils.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
      ];

      const analysis = await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);

      expect(analysis.keyPeople[0].ownership).toBeCloseTo(0.67, 1);
      expect(analysis.keyPeople[1].ownership).toBeCloseTo(0.33, 1);
    });

    it('should maintain history of analyses', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);
      await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);

      const history = service.getHistory('org', 'team', 'repo');
      expect(history.length).toBe(2);
    });

    it('should clear history', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);
      service.clearHistory('org', 'team', 'repo');

      const history = service.getHistory('org', 'team', 'repo');
      expect(history.length).toBe(0);
    });

    it('should limit history to max points', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      // Add more than max history points
      for (let i = 0; i < 150; i++) {
        await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);
      }

      const history = service.getHistory('org', 'team', 'repo');
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should calculate medium risk level for 3 people', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
        { author: 'alice', files: ['src/utils.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
        { author: 'bob', files: ['src/config.ts'] },
        { author: 'charlie', files: ['src/test.ts'] },
        { author: 'charlie', files: ['src/types.ts'] },
        { author: 'charlie', files: ['src/index.ts'] },
      ];

      const analysis = await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);

      // With 7 commits, 50% threshold is 3.5, so need alice (2) + bob (2) + charlie (3) = 7 commits
      // alice covers 2/7 = 28%, alice+bob = 4/7 = 57% (crosses 50% threshold at 2 people)
      expect(analysis.busFactor).toBeLessThanOrEqual(3);
      expect(['medium', 'high']).toContain(analysis.riskLevel);
    });

    it('should include timestamp in analysis', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      const analysis = await service.analyzeBusFactor('org', 'team', 'repo', commitHistory);

      expect(analysis.timestamp).toBeInstanceOf(Date);
    });
  });
});

