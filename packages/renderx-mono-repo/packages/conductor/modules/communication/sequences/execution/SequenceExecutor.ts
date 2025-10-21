/**
 * SequenceExecutor - Main sequence execution orchestration
 * Handles the execution of musical sequences with proper timing and error handling
 */

import { EventBus } from "../../EventBus.js";
import { SPAValidator } from "../../SPAValidator.js";
import type {
  MusicalSequence,
  SequenceExecutionContext,
  SequenceRequest,
} from "../SequenceTypes.js";
import {
  MUSICAL_CONDUCTOR_EVENT_TYPES,
  SEQUENCE_PRIORITIES,
} from "../SequenceTypes.js";
import { ExecutionQueue } from "./ExecutionQueue.js";
import { MovementExecutor } from "./MovementExecutor.js";
import type { StatisticsManager } from "../monitoring/StatisticsManager.js";

export class SequenceExecutor {
  private eventBus: EventBus;
  private spaValidator: SPAValidator;
  private executionQueue: ExecutionQueue;
  private movementExecutor: MovementExecutor;

  // Current execution state
  private activeSequence: SequenceExecutionContext | null = null;
  private sequenceHistory: SequenceExecutionContext[] = [];
  private statisticsManager: StatisticsManager;

  // Beat-level orchestration: Ensure no simultaneous beat execution
  private isExecutingBeat: boolean = false;
  private beatExecutionQueue: Array<{
    beat: any;
    context: SequenceExecutionContext;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(
    eventBus: EventBus,
    spaValidator: SPAValidator,
    executionQueue: ExecutionQueue,
    statisticsManager: StatisticsManager
  ) {
    this.eventBus = eventBus;
    this.spaValidator = spaValidator;
    this.executionQueue = executionQueue;
    this.statisticsManager = statisticsManager;
    this.movementExecutor = new MovementExecutor(
      eventBus,
      spaValidator,
      statisticsManager
    );
  }

  /**
   * Execute a sequence with proper orchestration
   * @param sequenceRequest - The sequence request to execute
   * @param sequence - The musical sequence to execute
   * @returns Promise that resolves when sequence completes
   */
  async executeSequence(
    sequenceRequest: SequenceRequest,
    sequence: MusicalSequence
  ): Promise<string> {
    const startTime = Date.now();
    const executionId = sequenceRequest.requestId;

    // Create execution context
    const executionContext: SequenceExecutionContext = {
      id: executionId,
      sequenceId: sequence.id,
      sequenceName: sequence.name,
      sequence: sequence,
      data: sequenceRequest.data || {},
      payload: {},
      startTime,
      currentMovement: 0,
      currentBeat: 0,
      completedBeats: [],
      errors: [],
      priority: (sequenceRequest.priority || SEQUENCE_PRIORITIES.NORMAL) as
        | "HIGH"
        | "NORMAL"
        | "CHAINED",
      executionType: "IMMEDIATE",
    };

    // Set as active sequence
    this.activeSequence = executionContext;
    this.executionQueue.setCurrentlyExecuting(sequenceRequest);

    try {
      // Emit sequence started event
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_STARTED, {
        sequenceName: sequence.name,
        requestId: executionId,
        priority: sequenceRequest.priority,
        data: sequenceRequest.data,
      });

      // Execute all movements in sequence
      for (let i = 0; i < sequence.movements.length; i++) {
        const movement = sequence.movements[i];
        executionContext.currentMovement = i;
        executionContext.currentBeat = 0;

        console.log(
          `🎼 SequenceExecutor: Executing movement "${movement.name}" (${
            i + 1
          }/${sequence.movements.length})`
        );

        await this.movementExecutor.executeMovement(
          movement,
          executionContext,
          sequence
        );
      }

      // Mark sequence as completed
      const executionTime = Date.now() - startTime;

      // Emit sequence completed event
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_COMPLETED, {
        sequenceName: sequence.name,
        requestId: executionId,
        executionTime,
        beatsExecuted: executionContext.completedBeats.length,
        errors: executionContext.errors.length,
      });

      // Add to history and clear active sequence
      this.sequenceHistory.push(executionContext);
      this.activeSequence = null;
      this.executionQueue.markCompleted(sequenceRequest);

      console.log(
        `✅ SequenceExecutor: Sequence "${sequence.name}" completed in ${executionTime}ms`
      );

      return executionId;
    } catch (error) {
      // Handle sequence execution error
      const executionTime = Date.now() - startTime;
      executionContext.errors.push({
        beat: executionContext.currentBeat,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });

      // Emit sequence failed event
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_FAILED, {
        sequenceName: sequence.name,
        requestId: executionId,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      });

      // Add to history and clear active sequence
      this.sequenceHistory.push(executionContext);
      this.activeSequence = null;
      this.executionQueue.markCompleted(sequenceRequest);

      console.error(
        `❌ SequenceExecutor: Sequence "${sequence.name}" failed:`,
        error
      );

      throw error;
    }
  }

  /**
   * Check if a sequence is currently executing
   * @param sequenceName - Optional sequence name to check
   * @returns True if executing
   */
  isSequenceRunning(sequenceName?: string): boolean {
    if (!this.activeSequence) {
      return false;
    }

    if (sequenceName) {
      return this.activeSequence.sequenceName === sequenceName;
    }

    return true;
  }

  /**
   * Get the currently executing sequence
   * @returns Current sequence context or null
   */
  getCurrentSequence(): SequenceExecutionContext | null {
    return this.activeSequence;
  }

  /**
   * Stop the current sequence execution
   */
  stopExecution(): void {
    if (this.activeSequence) {
      console.log(
        `🛑 SequenceExecutor: Stopping execution of "${this.activeSequence.sequenceName}"`
      );

      // Add cancellation error to track the cancellation
      this.activeSequence.errors.push({
        beat: this.activeSequence.currentBeat,
        error: "Sequence execution cancelled",
        timestamp: Date.now(),
      });

      // Emit sequence cancelled event
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_CANCELLED, {
        sequenceName: this.activeSequence.sequenceName,
        requestId: this.activeSequence.id,
      });

      // Add to history and clear active sequence
      this.sequenceHistory.push(this.activeSequence);
      this.activeSequence = null;
    }
  }

  /**
   * Get execution history
   * @returns Array of completed sequence executions
   */
  getExecutionHistory(): SequenceExecutionContext[] {
    return [...this.sequenceHistory];
  }

  /**
   * Clear execution history
   */
  clearExecutionHistory(): void {
    this.sequenceHistory = [];
    console.log("🧹 SequenceExecutor: Execution history cleared");
  }

  /**
   * Calculate total beats in a sequence
   * @param sequence - The sequence to analyze
   * @returns Total number of beats
   */
  private calculateTotalBeats(sequence: MusicalSequence): number {
    return sequence.movements.reduce(
      (total, movement) => total + movement.beats.length,
      0
    );
  }

  /**
   * Update execution statistics
   * @param context - The completed execution context
   * @param executionTime - The execution time in milliseconds
   */
  // Note: Statistics are now managed centrally in StatisticsManager

  /**
   * Get execution statistics
   * @returns Current execution statistics
   */
  getStatistics(): {
    totalSequencesExecuted: number;
    totalBeatsExecuted: number;
    averageExecutionTime: number;
    sequenceCompletionRate: number;
    currentlyExecuting: boolean;
    executionHistorySize: number;
  } {
    const stats = this.statisticsManager.getStatistics();
    return {
      totalSequencesExecuted: stats.totalSequencesExecuted,
      totalBeatsExecuted: stats.totalBeatsExecuted,
      averageExecutionTime: stats.averageExecutionTime,
      sequenceCompletionRate: stats.sequenceCompletionRate,
      currentlyExecuting: !!this.activeSequence,
      executionHistorySize: this.sequenceHistory.length,
    };
  }
}
