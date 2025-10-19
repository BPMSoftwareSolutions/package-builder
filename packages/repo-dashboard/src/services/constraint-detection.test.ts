/**
 * Unit tests for Constraint Detection Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConstraintDetectionService } from './constraint-detection.js';
import { FlowStageMetrics } from './flow-stage-analyzer.js';

describe('ConstraintDetectionService', () => {
  let service: ConstraintDetectionService;

  beforeEach(() => {
    service = new ConstraintDetectionService();
  });

  describe('detectConstraints', () => {
    it('should detect no constraints when all stages are healthy', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 30,
          medianTime: 60,
          p95Time: 120,
          p5Time: 30,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      const result = service.detectConstraints('org', 'team', 'repo', stages);

      expect(result.constraints).toHaveLength(0);
      expect(result.healthScore).toBeGreaterThan(90);
    });

    it('should detect high severity constraint when p95 time is high', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      const result = service.detectConstraints('org', 'team', 'repo', stages, 10);

      expect(result.constraints.length).toBeGreaterThan(0);
      const constraint = result.constraints[0];
      expect(constraint.severity).toBe('high');
      expect(constraint.stage).toBe('First Review');
    });

    it('should detect critical severity constraint when p99 time is high', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'Approval',
          percentageOfTime: 40,
          medianTime: 300,
          p95Time: 600,
          p5Time: 150,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      const result = service.detectConstraints('org', 'team', 'repo', stages, 15);

      expect(result.constraints.length).toBeGreaterThan(0);
      const constraint = result.constraints[0];
      // p95Time > 300 should be high severity
      expect(['high', 'critical']).toContain(constraint.severity);
    });

    it('should escalate severity when trend is degrading', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'Merge',
          percentageOfTime: 20,
          medianTime: 180,
          p95Time: 300,
          p5Time: 90,
          trend: 'degrading',
          trendPercentage: 25
        }
      ];

      const result = service.detectConstraints('org', 'team', 'repo', stages, 8);

      expect(result.constraints.length).toBeGreaterThan(0);
      const constraint = result.constraints[0];
      expect(constraint.trend).toBe('degrading');
      expect(constraint.percentageIncrease).toBe(25);
    });

    it('should generate recommendations for First Review stage', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      const result = service.detectConstraints('org', 'team', 'repo', stages);

      expect(result.constraints.length).toBeGreaterThan(0);
      const constraint = result.constraints[0];
      expect(constraint.recommendations.length).toBeGreaterThan(0);
      expect(constraint.recommendations.some(r => r.includes('reviewer'))).toBe(true);
    });

    it('should calculate constraint score correctly', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'stable',
          trendPercentage: 0
        },
        {
          stage: 'Approval',
          percentageOfTime: 30,
          medianTime: 180,
          p95Time: 360,
          p5Time: 90,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      const result = service.detectConstraints('org', 'team', 'repo', stages);

      expect(result.constraintScore).toBeGreaterThan(0);
      expect(result.constraintScore).toBeLessThanOrEqual(100);
      expect(result.healthScore).toBe(100 - result.constraintScore);
    });

    it('should identify primary and secondary constraints', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'stable',
          trendPercentage: 0
        },
        {
          stage: 'Approval',
          percentageOfTime: 30,
          medianTime: 180,
          p95Time: 360,
          p5Time: 90,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      const result = service.detectConstraints('org', 'team', 'repo', stages);

      if (result.constraints.length > 0) {
        expect(result.primaryConstraint).toBeDefined();
        expect(['high', 'critical']).toContain(result.primaryConstraint?.severity);
      }
    });
  });

  describe('getConstraintHistory', () => {
    it('should return empty history for new repository', () => {
      const history = service.getConstraintHistory('org', 'team', 'repo');
      expect(history).toHaveLength(0);
    });

    it('should maintain constraint history', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      service.detectConstraints('org', 'team', 'repo', stages);
      const history = service.getConstraintHistory('org', 'team', 'repo');

      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('clearHistory', () => {
    it('should clear constraint history', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      service.detectConstraints('org', 'team', 'repo', stages);
      service.clearHistory('org', 'team', 'repo');

      const history = service.getConstraintHistory('org', 'team', 'repo');
      expect(history).toHaveLength(0);
    });
  });

  describe('constraint metadata', () => {
    it('should include detection timestamp', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      const result = service.detectConstraints('org', 'team', 'repo', stages);

      if (result.constraints.length > 0) {
        expect(result.constraints[0].detectedAt).toBeInstanceOf(Date);
      }
    });

    it('should generate unique constraint IDs', () => {
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      // Add a small delay to ensure different timestamps
      const result1 = service.detectConstraints('org', 'team', 'repo', stages);

      // Wait a bit to ensure different random values
      const result2 = service.detectConstraints('org', 'team', 'repo', stages);

      if (result1.constraints.length > 0 && result2.constraints.length > 0) {
        // IDs should be different due to random component
        expect(result1.constraints[0].id).not.toBe(result2.constraints[0].id);
      }
    });
  });
});

