/**
 * EventLogger - Event emission and hierarchical logging
 * Handles all event emission, beat logging, and hierarchical console output
 */

import type { EventBus } from "../../EventBus.js";
import type {
  SequenceExecutionContext,
  SequenceBeat,
  SequenceMovement,
} from "../SequenceTypes.js";
import { MUSICAL_CONDUCTOR_EVENT_TYPES } from "../SequenceTypes.js";
import type { PerformanceTracker } from "./PerformanceTracker.js";

export interface LoggingConfig {
  enableHierarchicalLogging: boolean;
  enableEventEmission: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

export class EventLogger {
  private eventBus: EventBus;
  private performanceTracker: PerformanceTracker;
  private config: LoggingConfig;
  private beatLoggingInitialized: boolean = false;
  private eventSubscriptions: Array<() => void> = [];

  constructor(
    eventBus: EventBus,
    performanceTracker: PerformanceTracker,
    config?: Partial<LoggingConfig>
  ) {
    this.eventBus = eventBus;
    this.performanceTracker = performanceTracker;
    this.config = {
      enableHierarchicalLogging: true,
      enableEventEmission: true,
      logLevel: "info",
      ...config,
    };
  }

  /**
   * Setup beat execution logging with hierarchical format
   */
  setupBeatExecutionLogging(): void {
    if (this.beatLoggingInitialized) {
      return;
    }

    if (!this.config.enableHierarchicalLogging) {
      console.log("🎼 EventLogger: Hierarchical logging disabled");
      return;
    }

    // Subscribe to beat started events
    const beatStartedUnsubscribe = this.eventBus.subscribe(
      MUSICAL_CONDUCTOR_EVENT_TYPES.BEAT_STARTED,
      (data: any) => this.logBeatStartedHierarchical(data),
      this
    );

    // Subscribe to beat completed events
    const beatCompletedUnsubscribe = this.eventBus.subscribe(
      MUSICAL_CONDUCTOR_EVENT_TYPES.BEAT_COMPLETED,
      (data: any) => this.logBeatCompletedHierarchical(data),
      this
    );

    // Store unsubscribe functions for cleanup
    this.eventSubscriptions.push(
      beatStartedUnsubscribe,
      beatCompletedUnsubscribe
    );
    this.beatLoggingInitialized = true;

    console.log("🎼 EventLogger: Hierarchical beat logging initialized");
  }

  /**
   * Log beat started event with hierarchical format
   * @param data - Beat started event data
   */
  private logBeatStartedHierarchical(data: any): void {
    // Use PerformanceTracker to track beat timing
    this.performanceTracker.startBeatTiming(data.sequenceName, data.beat);

    // Get movement information from active sequence
    const movementName = this.getMovementNameForBeat(
      data.sequenceName,
      data.beat
    );

    // Create hierarchical log group with enhanced styling
    const groupLabel = `🎵 Beat ${data.beat} Started: ${
      data.title || data.event
    } (${data.event})`;

    console.group(groupLabel);
    console.log(
      `%c🎼 Sequence: ${data.sequenceName}`,
      "color: #007BFF; font-weight: bold;"
    );
    console.log(
      `%c🎵 Movement: ${movementName}`,
      "color: #6F42C1; font-weight: bold;"
    );
    console.log(
      `%c📊 Beat: ${data.beat}`,
      "color: #FD7E14; font-weight: bold;"
    );
    console.log(
      `%c🎯 Event: ${data.event}`,
      "color: #20C997; font-weight: bold;"
    );

    // Log additional metadata
    console.log({
      sequence: data.sequenceName,
      movement: movementName,
      beat: data.beat,
      type: data.sequenceType || "UNKNOWN",
      timing: data.timing || "immediate",
      dynamics: data.dynamics || "mf",
    });

    // Note: Group will be closed by logBeatCompletedHierarchical
  }

  /**
   * Log beat completed event with hierarchical format
   * @param data - Beat completed event data
   */
  private logBeatCompletedHierarchical(data: any): void {
    // Use PerformanceTracker to end beat timing
    const duration = this.performanceTracker.endBeatTiming(
      data.sequenceName,
      data.beat
    );

    if (duration !== null) {
      console.log(
        `%c✅ Completed in ${duration.toFixed(2)}ms`,
        "color: #28A745; font-weight: bold;"
      );
    } else {
      console.log(`%c✅ Completed`, "color: #28A745; font-weight: bold;");
    }

    console.groupEnd();
  }

  /**
   * Get movement name for a specific beat in a sequence
   * @param sequenceName - Name of the sequence
   * @param beatNumber - Beat number
   * @returns Movement name or "Unknown Movement"
   */
  private getMovementNameForBeat(
    sequenceName: string,
    beatNumber: number
  ): string {
    // This would typically look up the movement from the sequence registry
    // For now, return a placeholder
    return `Movement ${Math.ceil(beatNumber / 4)}`;
  }

  /**
   * Handle beat execution error with proper logging
   * @param executionContext - Sequence execution context
   * @param beat - Beat that failed
   * @param error - Error that occurred
   */
  handleBeatError(
    executionContext: SequenceExecutionContext,
    beat: SequenceBeat,
    error: Error
  ): void {
    // Emit beat error event
    this.emitEvent(MUSICAL_CONDUCTOR_EVENT_TYPES.BEAT_FAILED, {
      sequenceName: executionContext.sequenceName,
      beat: beat.beat,
      error: error.message,
      success: false,
    });

    // Log error in hierarchical format if enabled
    if (this.config.enableHierarchicalLogging) {
      console.log(
        `%c❌ Error: ${error.message}`,
        "color: #DC3545; font-weight: bold;"
      );
      console.groupEnd(); // Close the beat group on error

      // Clean up timing data for failed beat
      this.performanceTracker.cleanupFailedBeat(
        executionContext.sequenceName,
        beat.beat
      );
    }
  }

  /**
   * Emit an event through the event bus
   * @param eventType - Type of event to emit
   * @param data - Event data
   */
  emitEvent(eventType: string, data: any): void {
    if (!this.config.enableEventEmission) {
      return;
    }

    try {
      this.eventBus.emit(eventType, data);

      if (this.config.logLevel === "debug") {
        console.log(`🎼 EventLogger: Emitted ${eventType}`, data);
      }
    } catch (error) {
      console.error(
        `🎼 EventLogger: Failed to emit event ${eventType}:`,
        error
      );
    }
  }

  /**
   * Log sequence execution start
   * @param sequenceName - Name of the sequence
   * @param executionId - Execution identifier
   * @param data - Sequence data
   */
  logSequenceStart(sequenceName: string, executionId: string, data: any): void {
    if (this.config.logLevel === "debug" || this.config.logLevel === "info") {
      console.log(
        `🎼 EventLogger: Starting sequence ${sequenceName} (${executionId})`,
        data
      );
    }

    this.emitEvent(MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_STARTED, {
      sequenceName,
      executionId,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Log sequence execution completion
   * @param sequenceName - Name of the sequence
   * @param executionId - Execution identifier
   * @param success - Whether execution was successful
   * @param duration - Execution duration in milliseconds
   */
  logSequenceComplete(
    sequenceName: string,
    executionId: string,
    success: boolean,
    duration?: number
  ): void {
    const status = success ? "✅ completed" : "❌ failed";
    const durationText = duration ? ` in ${duration.toFixed(2)}ms` : "";

    if (this.config.logLevel === "debug" || this.config.logLevel === "info") {
      console.log(
        `🎼 EventLogger: Sequence ${sequenceName} ${status}${durationText}`
      );
    }

    this.emitEvent(MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_COMPLETED, {
      sequenceName,
      executionId,
      success,
      duration,
      timestamp: Date.now(),
    });
  }

  /**
   * Log queue operations
   * @param operation - Queue operation type
   * @param sequenceName - Sequence name
   * @param queueLength - Current queue length
   */
  logQueueOperation(
    operation: "enqueue" | "dequeue" | "clear",
    sequenceName: string,
    queueLength: number
  ): void {
    if (this.config.logLevel === "debug") {
      console.log(
        `🎼 EventLogger: Queue ${operation} - ${sequenceName} (queue: ${queueLength})`
      );
    }

    this.emitEvent(MUSICAL_CONDUCTOR_EVENT_TYPES.QUEUE_PROCESSED, {
      operation,
      sequenceName,
      queueLength,
      timestamp: Date.now(),
    });
  }

  /**
   * Update logging configuration
   * @param newConfig - New configuration values
   */
  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🎼 EventLogger: Configuration updated:", this.config);
  }

  /**
   * Get current configuration
   * @returns Current logging configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Cleanup event subscriptions
   */
  cleanup(): void {
    if (this.eventSubscriptions.length > 0) {
      this.eventSubscriptions.forEach((unsubscribe) => unsubscribe());
      this.eventSubscriptions = [];
      this.beatLoggingInitialized = false;
      console.log("🧹 EventLogger: Event subscriptions cleaned up");
    }
  }

  /**
   * Get debug information
   * @returns Debug logging information
   */
  getDebugInfo(): {
    config: LoggingConfig;
    beatLoggingInitialized: boolean;
    activeSubscriptions: number;
  } {
    return {
      config: this.getConfig(),
      beatLoggingInitialized: this.beatLoggingInitialized,
      activeSubscriptions: this.eventSubscriptions.length,
    };
  }
}
