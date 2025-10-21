/**
 * EventOrchestrator - Event management and emission system
 * Handles event emission with contextual data, debugging, and special event handling
 */

import type { EventBus } from "../../EventBus.js";
import type { SequenceExecutionContext } from "../SequenceTypes.js";

export interface EventEmissionResult {
  success: boolean;
  eventType: string;
  subscriberCount: number;
  error?: string;
}

export interface ContextualEventData {
  originalData: any;
  context: {
    payload: Record<string, any>;
    executionId: string;
    sequenceName: string;
  };
  metadata: {
    timestamp: number;
    beat: number;
    movement: number;
  };
}

export class EventOrchestrator {
  private eventBus: EventBus;
  private debugMode: boolean = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Emit an event with contextual data from sequence execution
   * @param eventType - Type of event to emit
   * @param data - Event data
   * @param executionContext - Current sequence execution context
   * @returns Event emission result
   */
  emitEvent(
    eventType: string,
    data: any,
    executionContext: SequenceExecutionContext
  ): EventEmissionResult {
    try {
      // Create contextual event data with execution context
      const contextualEventData = this.createContextualEventData(
        data,
        executionContext
      );

      // Handle special debugging for specific events
      this.handleSpecialEventDebugging(eventType, contextualEventData);

      // Get subscriber count for monitoring
      const subscriberCount = this.eventBus.getSubscriberCount(eventType);

      // Emit the event
      this.eventBus.emit(eventType, contextualEventData);

      // Log successful emission if debug mode is enabled
      if (this.debugMode) {
        console.log(
          `🎼 EventOrchestrator: Emitted ${eventType} to ${subscriberCount} subscribers`
        );
      }

      return {
        success: true,
        eventType,
        subscriberCount,
      };
    } catch (error) {
      console.error(
        `🎼 EventOrchestrator: Failed to emit event ${eventType}:`,
        error
      );

      return {
        success: false,
        eventType,
        subscriberCount: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Emit a simple event without execution context
   * @param eventType - Type of event to emit
   * @param data - Event data
   * @returns Event emission result
   */
  emitSimpleEvent(eventType: string, data: any): EventEmissionResult {
    try {
      const subscriberCount = this.eventBus.getSubscriberCount(eventType);
      this.eventBus.emit(eventType, data);

      if (this.debugMode) {
        console.log(
          `🎼 EventOrchestrator: Emitted simple event ${eventType} to ${subscriberCount} subscribers`
        );
      }

      return {
        success: true,
        eventType,
        subscriberCount,
      };
    } catch (error) {
      console.error(
        `🎼 EventOrchestrator: Failed to emit simple event ${eventType}:`,
        error
      );

      return {
        success: false,
        eventType,
        subscriberCount: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Create contextual event data with execution context
   * @param originalData - Original event data
   * @param executionContext - Current sequence execution context
   * @returns Contextual event data
   */
  private createContextualEventData(
    originalData: any,
    executionContext: SequenceExecutionContext
  ): ContextualEventData {
    return {
      ...originalData,
      // 🎽 Include the data baton in the event context
      context: {
        payload: executionContext.payload,
        executionId: executionContext.id,
        sequenceName: executionContext.sequenceName,
      },
      metadata: {
        timestamp: Date.now(),
        beat: executionContext.currentBeat,
        movement: executionContext.currentMovement,
      },
    };
  }

  /**
   * Handle special debugging for specific events
   * @param eventType - Type of event
   * @param contextualEventData - Contextual event data
   */
  private handleSpecialEventDebugging(
    eventType: string,
    contextualEventData: ContextualEventData
  ): void {
    // Special debugging for sequence events
    if (eventType.includes("sequence")) {
      if (this.debugMode) {
        console.log(
          `🔍 DEBUG: EventOrchestrator emitting sequence event: ${eventType}`,
          {
            sequenceName: contextualEventData.context.sequenceName,
            executionId: contextualEventData.context.executionId,
            beat: contextualEventData.metadata.beat,
          }
        );
      }
    }

    // Special debugging for beat events
    if (eventType.includes("beat")) {
      if (this.debugMode) {
        console.log(
          `🔍 DEBUG: EventOrchestrator emitting beat event: ${eventType}`,
          {
            beat: contextualEventData.metadata.beat,
            movement: contextualEventData.metadata.movement,
            sequenceName: contextualEventData.context.sequenceName,
          }
        );
      }
    }
  }

  /**
   * Get subscriber count for an event type
   * @param eventType - Type of event
   * @returns Number of subscribers
   */
  getSubscriberCount(eventType: string): number {
    return this.eventBus.getSubscriberCount(eventType);
  }

  /**
   * Check if an event type has subscribers
   * @param eventType - Type of event
   * @returns True if event has subscribers
   */
  hasSubscribers(eventType: string): boolean {
    return this.getSubscriberCount(eventType) > 0;
  }

  /**
   * Enable or disable debug mode
   * @param enabled - Whether to enable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(
      `🎼 EventOrchestrator: Debug mode ${enabled ? "enabled" : "disabled"}`
    );
  }

  /**
   * Get all event types with subscribers
   * @returns Array of event types that have subscribers
   */
  getActiveEventTypes(): string[] {
    // This would require EventBus to expose this information
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Emit multiple events in sequence
   * @param events - Array of events to emit
   * @param executionContext - Current sequence execution context
   * @returns Array of emission results
   */
  emitMultipleEvents(
    events: Array<{ eventType: string; data: any }>,
    executionContext: SequenceExecutionContext
  ): EventEmissionResult[] {
    const results: EventEmissionResult[] = [];

    for (const event of events) {
      const result = this.emitEvent(
        event.eventType,
        event.data,
        executionContext
      );
      results.push(result);

      // Stop on first failure if desired
      if (!result.success) {
        console.warn(
          `🎼 EventOrchestrator: Stopping multiple event emission due to failure: ${result.error}`
        );
        break;
      }
    }

    return results;
  }

  /**
   * Emit event with retry logic
   * @param eventType - Type of event to emit
   * @param data - Event data
   * @param executionContext - Current sequence execution context
   * @param maxRetries - Maximum number of retries
   * @returns Event emission result
   */
  emitEventWithRetry(
    eventType: string,
    data: any,
    executionContext: SequenceExecutionContext,
    maxRetries: number = 3
  ): EventEmissionResult {
    let lastResult: EventEmissionResult;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      lastResult = this.emitEvent(eventType, data, executionContext);

      if (lastResult.success) {
        if (attempt > 1) {
          console.log(
            `🎼 EventOrchestrator: Event ${eventType} succeeded on attempt ${attempt}`
          );
        }
        return lastResult;
      }

      if (attempt < maxRetries) {
        console.warn(
          `🎼 EventOrchestrator: Event ${eventType} failed on attempt ${attempt}, retrying...`
        );
        // Small delay before retry
        setTimeout(() => {}, 10);
      }
    }

    console.error(
      `🎼 EventOrchestrator: Event ${eventType} failed after ${maxRetries} attempts`
    );
    return lastResult!;
  }

  /**
   * Get debug information
   * @returns Debug event orchestration information
   */
  getDebugInfo(): {
    debugMode: boolean;
    totalEventTypes: number;
    activeEventTypes: string[];
    eventBusAvailable: boolean;
  } {
    return {
      debugMode: this.debugMode,
      totalEventTypes: this.getActiveEventTypes().length,
      activeEventTypes: this.getActiveEventTypes(),
      eventBusAvailable: !!this.eventBus,
    };
  }
}
