/**
 * StatisticsManager - Performance metrics and statistics tracking
 * Handles all conductor statistics, performance metrics, and queue analytics
 */

import type { ConductorStatistics } from "../SequenceTypes.js";

export class StatisticsManager {
  private statistics: ConductorStatistics;

  constructor() {
    this.statistics = {
      totalSequencesExecuted: 0,
      totalBeatsExecuted: 0,
      averageExecutionTime: 0,
      totalSequencesQueued: 0,
      currentQueueLength: 0,
      maxQueueLength: 0,
      averageQueueWaitTime: 0,
      errorCount: 0,
      successRate: 0,
      lastExecutionTime: null,
      sequenceCompletionRate: 0,
      chainedSequences: 0,
    };
  }

  /**
   * Record a sequence execution
   * @param executionTime - Execution time in milliseconds
   */
  recordSequenceExecution(executionTime: number): void {
    this.statistics.totalSequencesExecuted++;

    // Update average execution time using exponential moving average
    const alpha = 0.1; // Smoothing factor
    this.statistics.averageExecutionTime =
      this.statistics.averageExecutionTime * (1 - alpha) +
      executionTime * alpha;

    // Update success rate
    this.updateSuccessRate();

    console.log(
      `📊 StatisticsManager: Recorded sequence execution (${executionTime.toFixed(
        2
      )}ms)`
    );
  }

  /**
   * Record a beat execution
   */
  recordBeatExecution(): void {
    this.statistics.totalBeatsExecuted++;
  }

  /**
   * Record an error occurrence
   */
  recordError(): void {
    this.statistics.errorCount++;
    this.updateSuccessRate();

    console.warn("📊 StatisticsManager: Recorded error occurrence");
  }

  /**
   * Record a sequence being queued
   */
  recordSequenceQueued(): void {
    this.statistics.totalSequencesQueued++;
    this.statistics.currentQueueLength++;
    this.statistics.maxQueueLength = Math.max(
      this.statistics.maxQueueLength,
      this.statistics.currentQueueLength
    );
  }

  /**
   * Record a sequence being dequeued
   */
  recordSequenceDequeued(): void {
    if (this.statistics.currentQueueLength > 0) {
      this.statistics.currentQueueLength--;
    }
  }

  /**
   * Update queue wait time statistics
   * @param waitTime - Wait time in milliseconds
   */
  updateQueueWaitTime(waitTime: number): void {
    // Simple moving average calculation
    const alpha = 0.1; // Smoothing factor
    this.statistics.averageQueueWaitTime =
      this.statistics.averageQueueWaitTime * (1 - alpha) + waitTime * alpha;
  }

  /**
   * Update success rate calculation
   */
  private updateSuccessRate(): void {
    const totalAttempts =
      this.statistics.totalSequencesExecuted + this.statistics.errorCount;
    if (totalAttempts > 0) {
      this.statistics.successRate =
        (this.statistics.totalSequencesExecuted / totalAttempts) * 100;
    } else {
      this.statistics.successRate = 100; // No attempts yet, assume 100%
    }
  }

  /**
   * Get current statistics
   * @returns Current conductor statistics
   */
  getStatistics(): ConductorStatistics {
    return { ...this.statistics };
  }

  /**
   * Get enhanced statistics with additional metrics
   * @param mountedPlugins - Number of mounted plugins
   * @returns Enhanced statistics
   */
  getEnhancedStatistics(
    mountedPlugins: number
  ): ConductorStatistics & { mountedPlugins: number } {
    return {
      ...this.statistics,
      mountedPlugins,
    };
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.statistics = {
      totalSequencesExecuted: 0,
      totalBeatsExecuted: 0,
      averageExecutionTime: 0,
      totalSequencesQueued: 0,
      currentQueueLength: 0,
      maxQueueLength: 0,
      averageQueueWaitTime: 0,
      errorCount: 0,
      successRate: 0,
      lastExecutionTime: null,
      sequenceCompletionRate: 0,
      chainedSequences: 0,
    };

    console.log("🧹 StatisticsManager: All statistics reset");
  }

  /**
   * Get performance summary
   * @returns Performance summary object
   */
  getPerformanceSummary(): {
    executionEfficiency: number;
    queueEfficiency: number;
    errorRate: number;
    throughput: number;
  } {
    const totalAttempts =
      this.statistics.totalSequencesExecuted + this.statistics.errorCount;
    const errorRate =
      totalAttempts > 0
        ? (this.statistics.errorCount / totalAttempts) * 100
        : 0;

    return {
      executionEfficiency: this.statistics.successRate,
      queueEfficiency:
        this.statistics.averageQueueWaitTime > 0
          ? Math.max(0, 100 - this.statistics.averageQueueWaitTime / 1000)
          : 100,
      errorRate,
      throughput:
        this.statistics.averageExecutionTime > 0
          ? 1000 / this.statistics.averageExecutionTime
          : 0, // sequences per second
    };
  }

  /**
   * Get queue analytics
   * @returns Queue performance analytics
   */
  getQueueAnalytics(): {
    currentLoad: number;
    maxLoadReached: number;
    averageWaitTime: number;
    totalProcessed: number;
  } {
    return {
      currentLoad: this.statistics.currentQueueLength,
      maxLoadReached: this.statistics.maxQueueLength,
      averageWaitTime: this.statistics.averageQueueWaitTime,
      totalProcessed: this.statistics.totalSequencesQueued,
    };
  }

  /**
   * Check if performance thresholds are exceeded
   * @returns Performance warnings
   */
  getPerformanceWarnings(): string[] {
    const warnings: string[] = [];

    if (this.statistics.averageExecutionTime > 5000) {
      warnings.push("High average execution time (>5s)");
    }

    if (this.statistics.averageQueueWaitTime > 10000) {
      warnings.push("High average queue wait time (>10s)");
    }

    if (this.statistics.successRate < 95) {
      warnings.push("Low success rate (<95%)");
    }

    if (this.statistics.currentQueueLength > 10) {
      warnings.push("High current queue length (>10)");
    }

    if (this.statistics.errorCount > 100) {
      warnings.push("High error count (>100)");
    }

    return warnings;
  }

  /**
   * Export statistics for external monitoring
   * @returns Statistics in monitoring format
   */
  exportForMonitoring(): Record<string, number> {
    return {
      "conductor.sequences.executed": this.statistics.totalSequencesExecuted,
      "conductor.beats.executed": this.statistics.totalBeatsExecuted,
      "conductor.execution.avg_time_ms": this.statistics.averageExecutionTime,
      "conductor.queue.length": this.statistics.currentQueueLength,
      "conductor.queue.max_length": this.statistics.maxQueueLength,
      "conductor.queue.avg_wait_time_ms": this.statistics.averageQueueWaitTime,
      "conductor.errors.count": this.statistics.errorCount,
      "conductor.success.rate_percent": this.statistics.successRate,
    };
  }

  /**
   * Get debug information
   * @returns Debug statistics information
   */
  getDebugInfo(): {
    statistics: ConductorStatistics;
    performanceSummary: ReturnType<StatisticsManager["getPerformanceSummary"]>;
    queueAnalytics: ReturnType<StatisticsManager["getQueueAnalytics"]>;
    warnings: string[];
  } {
    return {
      statistics: this.getStatistics(),
      performanceSummary: this.getPerformanceSummary(),
      queueAnalytics: this.getQueueAnalytics(),
      warnings: this.getPerformanceWarnings(),
    };
  }
}
