/**
 * Unit tests for Root Cause Analysis Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RootCauseAnalysisService, CorrelatedEvent } from './root-cause-analysis.js';
import { Constraint } from './constraint-detection.js';
import { PRMetrics } from './pull-request-metrics-collector.js';

describe('RootCauseAnalysisService', () => {
  let service: RootCauseAnalysisService;

  beforeEach(() => {
    service = new RootCauseAnalysisService();
  });

  describe('analyzeRootCauses', () => {
    it('should analyze root causes for a constraint', () => {
      const constraint: Constraint = {
        id: 'test-1',
        stage: 'First Review',
        team: 'team-a',
        severity: 'high',
        medianTime: 240,
        p95Time: 480,
        p99Time: 600,
        previousMedianTime: 200,
        percentageIncrease: 20,
        trend: 'degrading',
        affectedPRCount: 10,
        recommendations: [],
        detectedAt: new Date()
      };

      const affectedPRs: PRMetrics[] = [];
      const analysis = service.analyzeRootCauses(constraint, affectedPRs);

      expect(analysis.constraintId).toBe('test-1');
      expect(analysis.stage).toBe('First Review');
      expect(analysis.team).toBe('team-a');
      expect(analysis.analyzedAt).toBeInstanceOf(Date);
    });

    it('should identify large PR pattern', () => {
      const constraint: Constraint = {
        id: 'test-1',
        stage: 'First Review',
        team: 'team-a',
        severity: 'high',
        medianTime: 240,
        p95Time: 480,
        p99Time: 600,
        previousMedianTime: 200,
        percentageIncrease: 20,
        trend: 'stable',
        affectedPRCount: 10,
        recommendations: [],
        detectedAt: new Date()
      };

      const affectedPRs: PRMetrics[] = [
        {
          prId: 'pr-1',
          prNumber: 1,
          repo: 'repo',
          createdAt: new Date(),
          totalCycleTime: 240,
          filesChanged: 25,
          additions: 300,
          deletions: 100,
          status: 'merged',
          author: 'author-1',
          title: 'Large PR'
        },
        {
          prId: 'pr-2',
          prNumber: 2,
          repo: 'repo',
          createdAt: new Date(),
          totalCycleTime: 240,
          filesChanged: 30,
          additions: 400,
          deletions: 150,
          status: 'merged',
          author: 'author-2',
          title: 'Large PR 2'
        }
      ];

      const analysis = service.analyzeRootCauses(constraint, affectedPRs);

      expect(analysis.failurePatterns.length).toBeGreaterThan(0);
      const largePattern = analysis.failurePatterns.find(p => p.pattern.includes('Large PR'));
      expect(largePattern).toBeDefined();
    });

    it('should identify author concentration pattern', () => {
      const constraint: Constraint = {
        id: 'test-1',
        stage: 'First Review',
        team: 'team-a',
        severity: 'high',
        medianTime: 240,
        p95Time: 480,
        p99Time: 600,
        previousMedianTime: 200,
        percentageIncrease: 20,
        trend: 'stable',
        affectedPRCount: 10,
        recommendations: [],
        detectedAt: new Date()
      };

      const affectedPRs: PRMetrics[] = [
        {
          prId: 'pr-1',
          prNumber: 1,
          repo: 'repo',
          createdAt: new Date(),
          totalCycleTime: 240,
          filesChanged: 10,
          additions: 100,
          deletions: 50,
          status: 'merged',
          author: 'author-1',
          title: 'PR 1'
        },
        {
          prId: 'pr-2',
          prNumber: 2,
          repo: 'repo',
          createdAt: new Date(),
          totalCycleTime: 240,
          filesChanged: 10,
          additions: 100,
          deletions: 50,
          status: 'merged',
          author: 'author-1',
          title: 'PR 2'
        },
        {
          prId: 'pr-3',
          prNumber: 3,
          repo: 'repo',
          createdAt: new Date(),
          totalCycleTime: 240,
          filesChanged: 10,
          additions: 100,
          deletions: 50,
          status: 'merged',
          author: 'author-1',
          title: 'PR 3'
        }
      ];

      const analysis = service.analyzeRootCauses(constraint, affectedPRs);

      expect(analysis.failurePatterns.length).toBeGreaterThan(0);
      const authorPattern = analysis.failurePatterns.find(p => p.pattern.includes('author-1'));
      expect(authorPattern).toBeDefined();
    });

    it('should generate immediate actions for critical constraints', () => {
      const constraint: Constraint = {
        id: 'test-1',
        stage: 'First Review',
        team: 'team-a',
        severity: 'critical',
        medianTime: 240,
        p95Time: 480,
        p99Time: 600,
        previousMedianTime: 200,
        percentageIncrease: 20,
        trend: 'degrading',
        affectedPRCount: 10,
        recommendations: [],
        detectedAt: new Date()
      };

      const affectedPRs: PRMetrics[] = [];
      const analysis = service.analyzeRootCauses(constraint, affectedPRs);

      expect(analysis.immediateActions.length).toBeGreaterThan(0);
      expect(analysis.immediateActions.some(a => a.includes('emergency'))).toBe(true);
    });

    it('should generate long-term improvements', () => {
      const constraint: Constraint = {
        id: 'test-1',
        stage: 'Approval',
        team: 'team-a',
        severity: 'high',
        medianTime: 240,
        p95Time: 480,
        p99Time: 600,
        previousMedianTime: 200,
        percentageIncrease: 20,
        trend: 'stable',
        affectedPRCount: 10,
        recommendations: [],
        detectedAt: new Date()
      };

      const affectedPRs: PRMetrics[] = [];
      const analysis = service.analyzeRootCauses(constraint, affectedPRs);

      expect(analysis.longTermImprovements.length).toBeGreaterThan(0);
      expect(analysis.longTermImprovements.some(i => i.includes('approval'))).toBe(true);
    });

    it('should correlate with events', () => {
      const constraint: Constraint = {
        id: 'test-1',
        stage: 'First Review',
        team: 'team-a',
        severity: 'high',
        medianTime: 240,
        p95Time: 480,
        p99Time: 600,
        previousMedianTime: 200,
        percentageIncrease: 20,
        trend: 'stable',
        affectedPRCount: 10,
        recommendations: [],
        detectedAt: new Date()
      };

      const events: CorrelatedEvent[] = [
        {
          type: 'team_change',
          description: 'Team member on leave',
          timestamp: new Date(),
          correlation: 0.8
        }
      ];

      const affectedPRs: PRMetrics[] = [];
      const analysis = service.analyzeRootCauses(constraint, affectedPRs, events);

      expect(analysis.correlatedEvents.length).toBe(1);
      expect(analysis.correlatedEvents[0].correlation).toBe(0.8);
    });

    it('should track affected PRs', () => {
      const constraint: Constraint = {
        id: 'test-1',
        stage: 'First Review',
        team: 'team-a',
        severity: 'high',
        medianTime: 240,
        p95Time: 480,
        p99Time: 600,
        previousMedianTime: 200,
        percentageIncrease: 20,
        trend: 'stable',
        affectedPRCount: 10,
        recommendations: [],
        detectedAt: new Date()
      };

      const affectedPRs: PRMetrics[] = [
        {
          prId: 'pr-1',
          prNumber: 1,
          repo: 'repo',
          createdAt: new Date(),
          totalCycleTime: 240,
          filesChanged: 10,
          additions: 100,
          deletions: 50,
          status: 'merged',
          author: 'author-1',
          title: 'PR 1'
        }
      ];

      const analysis = service.analyzeRootCauses(constraint, affectedPRs);

      expect(analysis.affectedPRs).toContain('pr-1');
    });
  });
});

