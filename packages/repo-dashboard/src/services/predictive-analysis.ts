/**
 * Predictive Analysis Service
 * Forecasts future constraints and identifies at-risk stages
 */

import { Constraint } from './constraint-detection.js';
import { FlowStageMetrics } from './flow-stage-analyzer.js';

export interface PredictiveAnalysis {
  timestamp: Date;
  team: string;
  org: string;
  repo: string;

  // Forecasts
  forecastedConstraints: ForecastedConstraint[];
  atRiskStages: AtRiskStage[];

  // Predictions
  predictedBottleneck?: string;
  bottleneckProbability: number; // 0-1
  estimatedTimeToBottleneck: number; // hours

  // Recommendations
  preventiveActions: string[];
}

export interface ForecastedConstraint {
  stage: string;
  currentSeverity: 'critical' | 'high' | 'medium' | 'low';
  forecastedSeverity: 'critical' | 'high' | 'medium' | 'low';
  probability: number; // 0-1
  timeframe: 'immediate' | 'today' | 'this_week' | 'this_month';
  trend: 'improving' | 'stable' | 'degrading';
  confidenceScore: number; // 0-1
}

export interface AtRiskStage {
  stage: string;
  riskScore: number; // 0-100
  riskFactors: string[];
  estimatedImpact: string;
  mitigationStrategies: string[];
}

export class PredictiveAnalysisService {


  /**
   * Perform predictive analysis
   */
  performPredictiveAnalysis(
    org: string,
    team: string,
    repo: string,
    currentConstraints: Constraint[],
    stages: FlowStageMetrics[],
    historicalData: FlowStageMetrics[][] = []
  ): PredictiveAnalysis {
    const timestamp = new Date();

    // Forecast constraints
    const forecastedConstraints = this.forecastConstraints(
      currentConstraints,
      stages,
      historicalData
    );

    // Identify at-risk stages
    const atRiskStages = this.identifyAtRiskStages(stages, historicalData);

    // Predict bottleneck
    const bottleneckPrediction = this.predictBottleneck(
      currentConstraints,
      forecastedConstraints,
      historicalData
    );

    // Generate preventive actions
    const preventiveActions = this.generatePreventiveActions(
      forecastedConstraints,
      atRiskStages
    );

    return {
      timestamp,
      team,
      org,
      repo,
      forecastedConstraints,
      atRiskStages,
      predictedBottleneck: bottleneckPrediction.stage,
      bottleneckProbability: bottleneckPrediction.probability,
      estimatedTimeToBottleneck: bottleneckPrediction.hoursUntilBottleneck,
      preventiveActions
    };
  }

  /**
   * Forecast constraints based on trends
   */
  private forecastConstraints(
    currentConstraints: Constraint[],
    stages: FlowStageMetrics[],
    historicalData: FlowStageMetrics[][]
  ): ForecastedConstraint[] {
    const forecasts: ForecastedConstraint[] = [];

    for (const stage of stages) {
      const currentConstraint = currentConstraints.find(c => c.stage === stage.stage);
      const currentSeverity = (currentConstraint?.severity || 'low') as any;

      // Calculate trend
      const trend = this.calculateTrendDirection(stage, historicalData);

      // Forecast severity
      const forecastedSeverity = this.forecastSeverity(stage, trend);

      // Calculate probability
      const probability = this.calculateConstraintProbability(stage, trend, historicalData);

      // Determine timeframe
      const timeframe = this.determineTimeframe(probability, trend);

      // Calculate confidence
      const confidenceScore = Math.min(1, 0.5 + (historicalData.length * 0.05));

      forecasts.push({
        stage: stage.stage,
        currentSeverity,
        forecastedSeverity,
        probability,
        timeframe,
        trend,
        confidenceScore
      });
    }

    return forecasts;
  }

  /**
   * Identify at-risk stages
   */
  private identifyAtRiskStages(
    stages: FlowStageMetrics[],
    historicalData: FlowStageMetrics[][]
  ): AtRiskStage[] {
    const atRiskStages: AtRiskStage[] = [];

    for (const stage of stages) {
      const riskScore = this.calculateRiskScore(stage, historicalData);

      if (riskScore > 30) {
        const riskFactors = this.identifyRiskFactors(stage, historicalData);
        const mitigationStrategies = this.generateMitigationStrategies(stage, riskFactors);

        atRiskStages.push({
          stage: stage.stage,
          riskScore,
          riskFactors,
          estimatedImpact: this.estimateImpact(riskScore),
          mitigationStrategies
        });
      }
    }

    return atRiskStages.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Calculate risk score for a stage
   */
  private calculateRiskScore(stage: FlowStageMetrics, _historicalData: FlowStageMetrics[][]): number {
    let score = 0;

    // Base score from current metrics
    if (stage.p95Time > 240) score += 40;
    else if (stage.p95Time > 0) score += 25;
    else if (stage.medianTime > 0) score += 10;

    // Trend impact
    if (stage.trend === 'degrading') score += 30;
    else if (stage.trend === 'stable') score += 10;

    // Historical volatility
    if (_historicalData.length > 2) {
      const recentStages = _historicalData.slice(-5);
      const variance = this.calculateVariance(
        recentStages.map(s => s.find(st => st.stage === stage.stage)?.medianTime || 0)
      );
      if (variance > 50) score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Predict bottleneck
   */
  private predictBottleneck(
    currentConstraints: Constraint[],
    forecastedConstraints: ForecastedConstraint[],
    _historicalData: FlowStageMetrics[][]
  ): { stage?: string; probability: number; hoursUntilBottleneck: number } {
    if (currentConstraints.length === 0) {
      return { probability: 0, hoursUntilBottleneck: 0 };
    }

    // Find most severe forecasted constraint
    const mostSevere = forecastedConstraints.sort((a, b) => {
      const aScore = this.getSeverityScore(b.forecastedSeverity);
      const bScore = this.getSeverityScore(a.forecastedSeverity);
      return aScore - bScore;
    })[0];

    if (!mostSevere) {
      return { probability: 0, hoursUntilBottleneck: 0 };
    }

    // Calculate hours until bottleneck
    let hoursUntilBottleneck = 24; // default 24 hours
    if (mostSevere.timeframe === 'immediate') hoursUntilBottleneck = 1;
    else if (mostSevere.timeframe === 'today') hoursUntilBottleneck = 8;
    else if (mostSevere.timeframe === 'this_week') hoursUntilBottleneck = 72;

    return {
      stage: mostSevere.stage,
      probability: mostSevere.probability,
      hoursUntilBottleneck
    };
  }

  /**
   * Helper: Calculate trend direction
   */
  private calculateTrendDirection(
    stage: FlowStageMetrics,
    _historicalData: FlowStageMetrics[][]
  ): 'improving' | 'stable' | 'degrading' {
    return stage.trend;
  }

  /**
   * Helper: Forecast severity
   */
  private forecastSeverity(
    stage: FlowStageMetrics,
    trend: string
  ): 'critical' | 'high' | 'medium' | 'low' {
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';

    if (stage.p95Time > 240) severity = 'critical';
    else if (stage.p95Time > 0) severity = 'high';
    else if (stage.medianTime > 0) severity = 'medium';

    if (trend === 'degrading' && severity !== 'critical') {
      severity = (severity === 'low' ? 'medium' : 'high') as any;
    }

    return severity;
  }

  /**
   * Helper: Calculate constraint probability
   */
  private calculateConstraintProbability(
    stage: FlowStageMetrics,
    trend: string,
    _historicalData: FlowStageMetrics[][]
  ): number {
    let probability = 0.3;

    if (stage.p95Time > 240) probability += 0.4;
    else if (stage.p95Time > 0) probability += 0.2;

    if (trend === 'degrading') probability += 0.2;

    return Math.min(1, probability);
  }

  /**
   * Helper: Determine timeframe
   */
  private determineTimeframe(
    probability: number,
    _trend: string
  ): 'immediate' | 'today' | 'this_week' | 'this_month' {
    if (probability > 0.8) return 'immediate';
    if (probability > 0.6) return 'today';
    if (probability > 0.4) return 'this_week';
    return 'this_month';
  }

  /**
   * Helper: Identify risk factors
   */
  private identifyRiskFactors(stage: FlowStageMetrics, _historicalData: FlowStageMetrics[][]): string[] {
    const factors: string[] = [];

    if (stage.p95Time > 240) factors.push('High p95 latency');
    if (stage.trend === 'degrading') factors.push('Degrading trend');
    if (stage.trendPercentage > 20) factors.push('Rapid increase in duration');

    return factors;
  }

  /**
   * Helper: Generate mitigation strategies
   */
  private generateMitigationStrategies(stage: FlowStageMetrics, _riskFactors: string[]): string[] {
    const strategies: string[] = [];

    if (stage.stage === 'First Review') {
      strategies.push('Increase reviewer capacity');
      strategies.push('Implement review automation');
    } else if (stage.stage === 'Approval') {
      strategies.push('Streamline approval process');
      strategies.push('Reduce approval requirements');
    } else if (stage.stage === 'Merge') {
      strategies.push('Automate merge process');
      strategies.push('Improve CI/CD performance');
    }

    return strategies;
  }

  /**
   * Helper: Estimate impact
   */
  private estimateImpact(riskScore: number): string {
    if (riskScore > 75) return 'Critical - Immediate action required';
    if (riskScore > 50) return 'High - Action needed within 24 hours';
    if (riskScore > 30) return 'Medium - Monitor and plan mitigation';
    return 'Low - Continue monitoring';
  }

  /**
   * Helper: Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Helper: Get severity score
   */
  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'critical':
        return 4;
      case 'high':
        return 3;
      case 'medium':
        return 2;
      default:
        return 1;
    }
  }

  /**
   * Generate preventive actions
   */
  private generatePreventiveActions(
    forecastedConstraints: ForecastedConstraint[],
    atRiskStages: AtRiskStage[]
  ): string[] {
    const actions: string[] = [];

    // Add actions from at-risk stages
    for (const stage of atRiskStages) {
      actions.push(...stage.mitigationStrategies);
    }

    // Add actions from forecasted constraints
    for (const constraint of forecastedConstraints) {
      if (constraint.probability > 0.6) {
        actions.push(`Monitor ${constraint.stage} stage closely`);
      }
    }

    return [...new Set(actions)]; // Remove duplicates
  }
}

