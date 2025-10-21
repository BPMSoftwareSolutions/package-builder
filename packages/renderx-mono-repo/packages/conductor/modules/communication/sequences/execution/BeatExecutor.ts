/**
 * BeatExecutor - Executes individual beats within movements
 * Handles beat-level event emission and error handling
 */

import { EventBus } from "../../EventBus.js";
import { SPAValidator } from "../../SPAValidator.js";
import type {
  SequenceBeat,
  SequenceExecutionContext,
  MusicalSequence,
  SequenceMovement,
} from "../SequenceTypes.js";
import {
  MUSICAL_CONDUCTOR_EVENT_TYPES,
  MUSICAL_DYNAMICS,
  MUSICAL_TIMING,
} from "../SequenceTypes.js";
import { DataBaton } from "../monitoring/DataBaton.js";
import type { StatisticsManager } from "../monitoring/StatisticsManager.js";

export class BeatExecutor {
  private eventBus: EventBus;
  private spaValidator: SPAValidator;
  private statisticsManager?: StatisticsManager;

  // Beat execution state
  private isExecutingBeat: boolean = false;
  private beatExecutionQueue: Array<{
    beat: SequenceBeat;
    context: SequenceExecutionContext;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(
    eventBus: EventBus,
    spaValidator: SPAValidator,
    statisticsManager?: StatisticsManager
  ) {
    this.eventBus = eventBus;
    this.spaValidator = spaValidator;
  }

  /**
   * Execute a single beat
   * @param beat - The beat to execute
   * @param executionContext - The sequence execution context
   * @param sequence - The parent sequence
   * @param movement - The parent movement
   */
  async executeBeat(
    beat: SequenceBeat,
    executionContext: SequenceExecutionContext,
    sequence: MusicalSequence,
    movement: SequenceMovement
  ): Promise<void> {
    // Ensure sequential beat execution (no simultaneous beats)
    if (this.isExecutingBeat) {
      return new Promise((resolve, reject) => {
        this.beatExecutionQueue.push({
          beat,
          context: executionContext,
          resolve,
          reject,
        });
      });
    }

    this.isExecutingBeat = true;

    try {
      const startTime = Date.now();

      // Emit beat started event
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.BEAT_STARTED, {
        sequenceName: sequence.name,
        movementName: movement.name,
        beat: beat.beat,
        event: beat.event,
        title: beat.title,
        dynamics: beat.dynamics,
        timing: beat.timing,
        requestId: executionContext.id,
        payload: executionContext.data,
      });

      // Create contextual event data
      const contextualEventData = this.createContextualEventData(
        beat,
        executionContext,
        sequence,
        movement
      );

      // Baton logging + async emission: await subscribers before marking completion
      const prevSnap = DataBaton.snapshot(executionContext.payload);
      // Attach a shallow copy to payload for handlers to mutate
      (contextualEventData as any)._baton = executionContext.payload;
      await (this.eventBus as any).emitAsync(beat.event, contextualEventData);
      // After emit, log diff if payload changed
      const nextSnap = DataBaton.snapshot(executionContext.payload);
      DataBaton.log(
        {
          sequenceName: sequence.name,
          movementName: movement.name,
          beatEvent: beat.event,
          beatNumber: beat.beat,
          requestId: executionContext.id,
        },
        prevSnap,
        nextSnap
      );

      // Handle beat completion
      const executionTime = Date.now() - startTime;

      // Update statistics
      this.statisticsManager?.recordBeatExecution();

      // Emit beat completed event
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.BEAT_COMPLETED, {
        sequenceName: sequence.name,
        movementName: movement.name,
        beat: beat.beat,
        event: beat.event,
        executionTime,
        requestId: executionContext.id,
      });

      const depth = ((this.eventBus as any).__conductorLogger?.getDepth?.(
        executionContext.id
      ) ?? 0) as number;
      const indent = "  ".repeat(Math.max(0, depth));
      console.log(
        `${indent}✅ BeatExecutor: Beat ${beat.beat} (${beat.event}) completed in ${executionTime}ms`
      );
    } catch (error) {
      // Handle beat execution error
      console.error(
        `❌ BeatExecutor: Beat ${beat.beat} (${beat.event}) failed:`,
        error
      );

      // Add error to execution context
      executionContext.errors.push({
        beat: beat.beat,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });

      // Emit beat failed event
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.BEAT_FAILED, {
        sequenceName: sequence.name,
        movementName: movement.name,
        beat: beat.beat,
        event: beat.event,
        error: error instanceof Error ? error.message : String(error),
        requestId: executionContext.id,
      });

      // Handle error based on beat's error handling strategy
      if (
        beat.errorHandling === "abort-sequence" ||
        beat.errorHandling === ("abort" as any)
      ) {
        throw error;
      } else if (beat.errorHandling === "continue") {
        console.log(
          `⚠️ BeatExecutor: Continuing execution despite beat error (errorHandling: continue)`
        );
      }
    } finally {
      this.isExecutingBeat = false;

      // Process next beat in queue if any
      if (this.beatExecutionQueue.length > 0) {
        const nextBeat = this.beatExecutionQueue.shift()!;
        setImmediate(() => {
          this.executeBeat(nextBeat.beat, nextBeat.context, sequence, movement)
            .then(nextBeat.resolve)
            .catch(nextBeat.reject);
        });
      }
    }
  }

  /**
   * Create contextual event data for beat execution
   * @param beat - The beat being executed
   * @param executionContext - The sequence execution context
   * @param sequence - The parent sequence
   * @param movement - The parent movement
   * @returns Contextual event data
   */
  private createContextualEventData(
    beat: SequenceBeat,
    executionContext: SequenceExecutionContext,
    sequence: MusicalSequence,
    movement: SequenceMovement
  ): any {
    // Merge beat data with execution context data
    const contextualData = {
      ...executionContext.data,
      ...beat.data,
    };

    // Add musical context
    const musicalContext = {
      sequence: {
        name: sequence.name,
        tempo: sequence.tempo,
        key: sequence.key,
        timeSignature: sequence.timeSignature,
      },
      movement: {
        name: movement.name,
        description: movement.description,
      },
      beat: {
        number: beat.beat,
        event: beat.event,
        title: beat.title,
        description: beat.description,
        dynamics: beat.dynamics,
        timing: beat.timing,
      },
      execution: {
        requestId: executionContext.id,
        priority: executionContext.priority,
        currentMovement: executionContext.currentMovement,
        currentBeat: executionContext.currentBeat,
        completedBeats: executionContext.completedBeats.length,
        totalBeats: this.calculateTotalBeats(executionContext.sequence),
      },
    };

    return {
      ...contextualData,
      _musicalContext: musicalContext,
      _timestamp: Date.now(),
      _eventBus: this.eventBus,
    };
  }

  /**
   * Validate beat structure
   * @param beat - The beat to validate
   * @returns True if valid
   */
  validateBeat(beat: SequenceBeat): boolean {
    try {
      // Check required properties
      if (typeof beat.beat !== "number" || beat.beat < 1) {
        throw new Error("Beat must have a valid beat number (>= 1)");
      }

      if (!beat.event || typeof beat.event !== "string") {
        throw new Error("Beat must have a valid event name");
      }

      if (!beat.title || typeof beat.title !== "string") {
        throw new Error("Beat must have a valid title");
      }

      if (
        !beat.dynamics ||
        !Object.values(MUSICAL_DYNAMICS).includes(beat.dynamics as any)
      ) {
        throw new Error("Beat must have valid dynamics");
      }

      if (
        !beat.timing ||
        !Object.values(MUSICAL_TIMING).includes(beat.timing as any)
      ) {
        throw new Error("Beat must have valid timing");
      }

      if (
        !beat.errorHandling ||
        !["continue", "abort-sequence", "retry", "abort"].includes(
          beat.errorHandling as any
        )
      ) {
        throw new Error("Beat must have valid error handling strategy");
      }

      return true;
    } catch (error) {
      console.error(
        `❌ BeatExecutor: Beat validation failed for beat ${beat.beat}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get beat execution statistics
   * @param beat - The beat to analyze
   * @returns Beat statistics
   */
  getBeatStatistics(beat: SequenceBeat): {
    beatNumber: number;
    event: string;
    dynamics: string;
    timing: string;
    errorHandling: "continue" | "abort-sequence" | "retry" | "abort";
    hasData: boolean;
    dataKeys: string[];
  } {
    return {
      beatNumber: beat.beat,
      event: beat.event,
      dynamics: beat.dynamics || "unknown",
      timing: beat.timing || "unknown",
      errorHandling: beat.errorHandling || "continue",
      hasData: !!beat.data && Object.keys(beat.data).length > 0,
      dataKeys: beat.data ? Object.keys(beat.data) : [],
    };
  }

  /**
   * Estimate beat execution time based on dynamics and timing
   * @param beat - The beat to analyze
   * @param baseTempo - Base tempo in BPM
   * @returns Estimated execution time in milliseconds
   */
  estimateBeatExecutionTime(
    beat: SequenceBeat,
    baseTempo: number = 120
  ): number {
    const baseDuration = (60 / baseTempo) * 1000; // Base beat duration in ms

    // Adjust for dynamics (affects perceived execution time)
    let dynamicsMultiplier = 1;
    switch (beat.dynamics) {
      case MUSICAL_DYNAMICS.PIANISSIMO:
        dynamicsMultiplier = 0.8;
        break;
      case MUSICAL_DYNAMICS.PIANO:
        dynamicsMultiplier = 0.9;
        break;
      case MUSICAL_DYNAMICS.MEZZO_PIANO:
        dynamicsMultiplier = 0.95;
        break;
      case MUSICAL_DYNAMICS.MEZZO_FORTE:
        dynamicsMultiplier = 1.05;
        break;
      case MUSICAL_DYNAMICS.FORTE:
        dynamicsMultiplier = 1.1;
        break;
      case MUSICAL_DYNAMICS.FORTISSIMO:
        dynamicsMultiplier = 1.2;
        break;
      default:
        dynamicsMultiplier = 1;
    }

    // Adjust for timing
    let timingMultiplier = 1;
    switch (beat.timing) {
      case MUSICAL_TIMING.IMMEDIATE:
        timingMultiplier = 0;
        break;
      case MUSICAL_TIMING.AFTER_BEAT:
        timingMultiplier = 1;
        break;
      case MUSICAL_TIMING.SYNCHRONIZED:
        timingMultiplier = 0.5;
        break;
      case MUSICAL_TIMING.DELAYED:
        timingMultiplier = 1.5;
        break;
      default:
        timingMultiplier = 1;
    }

    return Math.round(baseDuration * dynamicsMultiplier * timingMultiplier);
  }

  /**
   * Clear the beat execution queue
   */
  clearBeatQueue(): void {
    this.beatExecutionQueue = [];
    console.log("🧹 BeatExecutor: Beat execution queue cleared");
  }

  /**
   * Get current beat execution status
   * @returns Execution status information
   */
  getExecutionStatus(): {
    isExecuting: boolean;
    queueLength: number;
  } {
    return {
      isExecuting: this.isExecutingBeat,
      queueLength: this.beatExecutionQueue.length,
    };
  }

  /**
   * Calculate total beats in a sequence
   * @param sequence - The sequence to analyze
   * @returns Total number of beats
   */
  private calculateTotalBeats(sequence: any): number {
    return sequence.movements.reduce(
      (total: number, movement: any) => total + movement.beats.length,
      0
    );
  }
}
