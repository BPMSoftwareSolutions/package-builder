/**
 * MovementExecutor - Executes individual movements within a sequence
 * Handles movement-level orchestration and beat coordination
 */

import { EventBus } from "../../EventBus.js";
import { SPAValidator } from "../../SPAValidator.js";
import type {
  SequenceMovement,
  SequenceExecutionContext,
  MusicalSequence,
} from "../SequenceTypes.js";
import {
  MUSICAL_CONDUCTOR_EVENT_TYPES,
  MUSICAL_TIMING,
} from "../SequenceTypes.js";
import { BeatExecutor } from "./BeatExecutor.js";
import { getConductorEnv } from "../environment/ConductorEnv.js";

export class MovementExecutor {
  private eventBus: EventBus;
  private spaValidator: SPAValidator;
  private beatExecutor: BeatExecutor;

  constructor(
    eventBus: EventBus,
    spaValidator: SPAValidator,
    statisticsManager?: import("../monitoring/StatisticsManager.js").StatisticsManager
  ) {
    this.eventBus = eventBus;
    this.spaValidator = spaValidator;
    this.beatExecutor = new BeatExecutor(
      eventBus,
      spaValidator,
      statisticsManager
    );
  }

  /**
   * Execute a movement within a sequence
   * @param movement - The movement to execute
   * @param executionContext - The sequence execution context
   * @param sequence - The parent sequence
   */
  async executeMovement(
    movement: SequenceMovement,
    executionContext: SequenceExecutionContext,
    sequence: MusicalSequence
  ): Promise<void> {
    console.log(
      `🎵 MovementExecutor: Starting movement "${movement.name}" with ${movement.beats.length} beats`
    );

    // Emit movement started event
    this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.MOVEMENT_STARTED, {
      sequenceName: sequence.name,
      movementName: movement.name,
      requestId: executionContext.id,
      beatsCount: movement.beats.length,
    });

    try {
      // Execute beats in sequence
      for (let beatIndex = 0; beatIndex < movement.beats.length; beatIndex++) {
        const beat = movement.beats[beatIndex];
        executionContext.currentBeat = beat.beat;

        console.log(
          `🥁 MovementExecutor: Executing beat ${beat.beat} (${beatIndex + 1}/${
            movement.beats.length
          })`
        );

        // Handle timing before executing beat based on its timing
        await this.handleBeatTiming(beat, sequence);

        // Execute the beat
        await this.beatExecutor.executeBeat(
          beat,
          executionContext,
          sequence,
          movement
        );

        // Update execution context
        executionContext.completedBeats.push(beat.beat);
      }

      // Emit movement completed event
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.MOVEMENT_COMPLETED, {
        sequenceName: sequence.name,
        movementName: movement.name,
        requestId: executionContext.id,
        beatsExecuted: movement.beats.length,
      });

      console.log(
        `✅ MovementExecutor: Movement "${movement.name}" completed successfully`
      );
    } catch (error) {
      // Handle movement execution error
      console.error(
        `❌ MovementExecutor: Movement "${movement.name}" failed:`,
        error
      );

      // Add error to execution context
      executionContext.errors.push({
        beat: executionContext.currentBeat,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });

      // Emit movement failed event
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.MOVEMENT_FAILED, {
        sequenceName: sequence.name,
        movementName: movement.name,
        requestId: executionContext.id,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Handle timing between beats based on sequence tempo and beat timing
   * @param beat - The current beat
   * @param sequence - The parent sequence
   */
  private async handleBeatTiming(
    beat: any,
    sequence: MusicalSequence
  ): Promise<void> {
    // Skip timing only for immediate beats
    if (beat.timing === MUSICAL_TIMING.IMMEDIATE) {
      return;
    }

    // Calculate delay based on tempo. Prefer movement.tempo override when present.
    const effectiveTempo =
      typeof (beat as any)?.tempo === "number" && (beat as any).tempo > 0
        ? (beat as any).tempo
        : (typeof sequence.movements?.[sequence.movements.indexOf as any]
            ?.tempo === "number"
            ? (sequence as any).movements?.[0]?.tempo
            : sequence.tempo) || 120;

    const beatDuration = (60 / effectiveTempo) * 1000; // ms per beat

    let delay = 0;
    switch (beat.timing) {
      case MUSICAL_TIMING.AFTER_BEAT:
      case MUSICAL_TIMING.ON_BEAT:
        delay = beatDuration;
        break;
      case MUSICAL_TIMING.DELAYED:
        delay = beatDuration * 1.5;
        break;
      case MUSICAL_TIMING.SYNCHRONIZED:
        delay = beatDuration / 2;
        break;
      case MUSICAL_TIMING.IMMEDIATE:
      default:
        delay = 0;
    }

    // Optional global clamp via ConductorEnv flags: flags.timing?.maxDelayMs
    try {
      const ce = getConductorEnv?.();
      const maxDelay = ce?.flags?.timing?.maxDelayMs;
      if (typeof maxDelay === "number" && maxDelay >= 0) {
        delay = Math.min(delay, maxDelay);
      }
      const scale = ce?.flags?.timing?.scale;
      if (typeof scale === "number" && isFinite(scale) && scale > 0) {
        delay = Math.round(delay * scale);
      }
    } catch {}

    if (delay > 0) {
      console.log(
        `⏱️ MovementExecutor: Waiting ${delay}ms for beat timing (${beat.timing})`
      );
      await this.sleep(delay);
    }
  }

  /**
   * Sleep for a specified duration
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate movement structure
   * @param movement - The movement to validate
   * @returns True if valid
   */
  validateMovement(movement: SequenceMovement): boolean {
    try {
      // Check required properties
      if (!movement.name || typeof movement.name !== "string") {
        throw new Error("Movement must have a valid name");
      }

      if (!movement.beats || !Array.isArray(movement.beats)) {
        throw new Error("Movement must have a beats array");
      }

      if (movement.beats.length === 0) {
        throw new Error("Movement must have at least one beat");
      }

      // Validate each beat
      movement.beats.forEach((beat, index) => {
        if (typeof beat.beat !== "number" || beat.beat < 1) {
          throw new Error(`Beat ${index} must have a valid beat number (>= 1)`);
        }

        if (!beat.event || typeof beat.event !== "string") {
          throw new Error(`Beat ${index} must have a valid event name`);
        }

        if (!beat.dynamics) {
          throw new Error(`Beat ${index} must have dynamics specified`);
        }

        if (!beat.timing) {
          throw new Error(`Beat ${index} must have timing specified`);
        }
      });

      return true;
    } catch (error) {
      console.error(
        `❌ MovementExecutor: Movement validation failed for "${movement.name}":`,
        error
      );
      return false;
    }
  }

  /**
   * Get movement execution statistics
   * @param movement - The movement to analyze
   * @returns Movement statistics
   */
  getMovementStatistics(movement: SequenceMovement): {
    name: string;
    totalBeats: number;
    beatTypes: Record<string, number>;
    timingDistribution: Record<string, number>;
    dynamicsDistribution: Record<string, number>;
  } {
    const beatTypes: Record<string, number> = {};
    const timingDistribution: Record<string, number> = {};
    const dynamicsDistribution: Record<string, number> = {};

    movement.beats.forEach((beat) => {
      // Count beat types (events)
      beatTypes[beat.event] = (beatTypes[beat.event] || 0) + 1;

      // Count timing distribution
      const timing = beat.timing || "unknown";
      timingDistribution[timing] = (timingDistribution[timing] || 0) + 1;

      // Count dynamics distribution
      const dynamics = beat.dynamics || "unknown";
      dynamicsDistribution[dynamics] =
        (dynamicsDistribution[dynamics] || 0) + 1;
    });

    return {
      name: movement.name,
      totalBeats: movement.beats.length,
      beatTypes,
      timingDistribution,
      dynamicsDistribution,
    };
  }

  /**
   * Estimate movement execution time
   * @param movement - The movement to analyze
   * @param tempo - The sequence tempo (BPM)
   * @returns Estimated execution time in milliseconds
   */
  estimateExecutionTime(
    movement: SequenceMovement,
    tempo: number = 120
  ): number {
    const beatDuration = (60 / tempo) * 1000; // Base beat duration in ms
    let totalTime = 0;

    movement.beats.forEach((beat) => {
      switch (beat.timing) {
        case MUSICAL_TIMING.IMMEDIATE:
          totalTime += 0;
          break;
        case MUSICAL_TIMING.AFTER_BEAT:
          totalTime += beatDuration;
          break;
        case MUSICAL_TIMING.SYNCHRONIZED:
          totalTime += beatDuration / 2;
          break;
        case MUSICAL_TIMING.DELAYED:
          totalTime += beatDuration * 1.5;
          break;
        default:
          totalTime += beatDuration;
      }
    });

    return Math.round(totalTime);
  }
}
