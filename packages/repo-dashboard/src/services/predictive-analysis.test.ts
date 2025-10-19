/**
 * Unit tests for Predictive Analysis Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PredictiveAnalysisService } from './predictive-analysis.js';
import { Constraint } from './constraint-detection.js';
import { FlowStageMetrics } from './flow-stage-analyzer.js';

describe('PredictiveAnalysisService', () => {
  let service: PredictiveAnalysisService;

  beforeEach(() => {
    service = new PredictiveAnalysisService();
  });

  describe('performPredictiveAnalysis', () => {
    it('should perform predictive analysis', () => {
      const constraints: Constraint[] = [];
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 30,
          medianTime: 120,
          p95Time: 180,
          p5Time: 60,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      const analysis = service.performPredictiveAnalysis(
        'org',
        'team',
        'repo',
        constraints,
        stages
      );

      expect(analysis.timestamp).toBeInstanceOf(Date);
      expect(analysis.team).toBe('team');
      expect(analysis.org).toBe('org');
      expect(analysis.repo).toBe('repo');
    });

    it('should forecast constraints', () => {
      const constraints: Constraint[] = [];
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'degrading',
          trendPercentage: 25
        }
      ];

      const analysis = service.performPredictiveAnalysis(
        'org',
        'team',
        'repo',
        constraints,
        stages
      );

      expect(analysis.forecastedConstraints.length).toBeGreaterThan(0);
      const forecast = analysis.forecastedConstraints[0];
      expect(forecast.stage).toBe('First Review');
      expect(forecast.trend).toBe('degrading');
    });

    it('should identify at-risk stages', () => {
      const constraints: Constraint[] = [];
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'degrading',
          trendPercentage: 25
        }
      ];

      const analysis = service.performPredictiveAnalysis(
        'org',
        'team',
        'repo',
        constraints,
        stages
      );

      expect(analysis.atRiskStages.length).toBeGreaterThan(0);
      const atRisk = analysis.atRiskStages[0];
      expect(atRisk.riskScore).toBeGreaterThan(0);
      expect(atRisk.riskFactors.length).toBeGreaterThan(0);
    });

    it('should predict bottleneck', () => {
      const constraints: Constraint[] = [
        {
          id: 'test-1',
          stage: 'First Review',
          team: 'team',
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
        }
      ];

      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'degrading',
          trendPercentage: 25
        }
      ];

      const analysis = service.performPredictiveAnalysis(
        'org',
        'team',
        'repo',
        constraints,
        stages
      );

      expect(analysis.bottleneckProbability).toBeGreaterThan(0);
      expect(analysis.estimatedTimeToBottleneck).toBeGreaterThan(0);
    });

    it('should generate preventive actions', () => {
      const constraints: Constraint[] = [];
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'degrading',
          trendPercentage: 25
        }
      ];

      const analysis = service.performPredictiveAnalysis(
        'org',
        'team',
        'repo',
        constraints,
        stages
      );

      expect(analysis.preventiveActions.length).toBeGreaterThan(0);
    });

    it('should calculate risk score for stages', () => {
      const constraints: Constraint[] = [];
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'degrading',
          trendPercentage: 25
        },
        {
          stage: 'Approval',
          percentageOfTime: 30,
          medianTime: 120,
          p95Time: 180,
          p5Time: 60,
          trend: 'stable',
          trendPercentage: 0
        }
      ];

      const analysis = service.performPredictiveAnalysis(
        'org',
        'team',
        'repo',
        constraints,
        stages
      );

      expect(analysis.atRiskStages.length).toBeGreaterThan(0);
      const firstReviewRisk = analysis.atRiskStages.find(s => s.stage === 'First Review');
      const approvalRisk = analysis.atRiskStages.find(s => s.stage === 'Approval');

      if (firstReviewRisk && approvalRisk) {
        expect(firstReviewRisk.riskScore).toBeGreaterThan(approvalRisk.riskScore);
      }
    });

    it('should handle empty constraints', () => {
      const constraints: Constraint[] = [];
      const stages: FlowStageMetrics[] = [];

      const analysis = service.performPredictiveAnalysis(
        'org',
        'team',
        'repo',
        constraints,
        stages
      );

      expect(analysis.bottleneckProbability).toBe(0);
      expect(analysis.estimatedTimeToBottleneck).toBe(0);
    });

    it('should handle historical data', () => {
      const constraints: Constraint[] = [];
      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'degrading',
          trendPercentage: 25
        }
      ];

      const historicalData: FlowStageMetrics[][] = [
        [
          {
            stage: 'First Review',
            percentageOfTime: 40,
            medianTime: 200,
            p95Time: 400,
            p5Time: 100,
            trend: 'stable',
            trendPercentage: 0
          }
        ],
        [
          {
            stage: 'First Review',
            percentageOfTime: 45,
            medianTime: 220,
            p95Time: 440,
            p5Time: 110,
            trend: 'stable',
            trendPercentage: 10
          }
        ]
      ];

      const analysis = service.performPredictiveAnalysis(
        'org',
        'team',
        'repo',
        constraints,
        stages,
        historicalData
      );

      expect(analysis.forecastedConstraints.length).toBeGreaterThan(0);
      const forecast = analysis.forecastedConstraints[0];
      expect(forecast.confidenceScore).toBeGreaterThan(0.5);
    });

    it('should determine correct timeframe for probability', () => {
      const constraints: Constraint[] = [
        {
          id: 'test-1',
          stage: 'First Review',
          team: 'team',
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
        }
      ];

      const stages: FlowStageMetrics[] = [
        {
          stage: 'First Review',
          percentageOfTime: 50,
          medianTime: 240,
          p95Time: 480,
          p5Time: 120,
          trend: 'degrading',
          trendPercentage: 25
        }
      ];

      const analysis = service.performPredictiveAnalysis(
        'org',
        'team',
        'repo',
        constraints,
        stages
      );

      expect(analysis.forecastedConstraints.length).toBeGreaterThan(0);
      const forecast = analysis.forecastedConstraints[0];
      expect(['immediate', 'today', 'this_week', 'this_month']).toContain(forecast.timeframe);
    });
  });
});

