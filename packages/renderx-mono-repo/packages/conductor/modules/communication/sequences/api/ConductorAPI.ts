/**
 * ConductorAPI - Public API surface for MusicalConductor
 * Handles validation compliance methods, statistics, and sequence management queries
 */

import type { SequenceOrchestrator } from "../orchestration/SequenceOrchestrator.js";
import type { SequenceExecutor } from "../execution/SequenceExecutor.js";
import type { ExecutionQueue } from "../execution/ExecutionQueue.js";
import type { StatisticsManager } from "../monitoring/StatisticsManager.js";
import type { PluginInterfaceFacade } from "../plugins/PluginInterfaceFacade.js";
import type { SequenceRegistry } from "../core/SequenceRegistry.js";
import type { EventBus } from "../../EventBus.js";
import type {
  SequencePriority,
  SequenceExecutionContext,
  ConductorStatistics,
} from "../SequenceTypes.js";
import { SEQUENCE_PRIORITIES } from "../SequenceTypes.js";

export interface ConductorStatus {
  statistics: ConductorStatistics & { mountedPlugins: number };
  eventBus: boolean;
  sequences: number;
  plugins: number;
}

export interface QueueStatus {
  size: number;
  isEmpty: boolean;
  isProcessing: boolean;
  nextSequence?: string;
}

export class ConductorAPI {
  private sequenceOrchestrator: SequenceOrchestrator;
  private sequenceExecutor: SequenceExecutor;
  private executionQueue: ExecutionQueue;
  private statisticsManager: StatisticsManager;
  private pluginInterface: PluginInterfaceFacade;
  private sequenceRegistry: SequenceRegistry;
  private eventBus: EventBus;

  constructor(
    sequenceOrchestrator: SequenceOrchestrator,
    sequenceExecutor: SequenceExecutor,
    executionQueue: ExecutionQueue,
    statisticsManager: StatisticsManager,
    pluginInterface: PluginInterfaceFacade,
    sequenceRegistry: SequenceRegistry,
    eventBus: EventBus
  ) {
    this.sequenceOrchestrator = sequenceOrchestrator;
    this.sequenceExecutor = sequenceExecutor;
    this.executionQueue = executionQueue;
    this.statisticsManager = statisticsManager;
    this.pluginInterface = pluginInterface;
    this.sequenceRegistry = sequenceRegistry;
    this.eventBus = eventBus;
  }

  /**
   * Queue a sequence for execution (validation compliance method)
   * @param sequenceId - ID of the sequence to queue
   * @param data - Data to pass to the sequence
   * @param priority - Priority level
   * @returns Request ID for tracking
   */
  queueSequence(
    sequenceId: string,
    data: Record<string, any> = {},
    priority: SequencePriority = SEQUENCE_PRIORITIES.NORMAL
  ): string {
    // This is an alias for startSequence to satisfy validation requirements
    const result = this.sequenceOrchestrator.startSequence(
      sequenceId,
      data,
      priority
    );

    if (!result.success) {
      if (result.isDuplicate) {
        return result.requestId; // Return duplicate request ID for tracking
      }
      throw new Error(result.reason || "Failed to queue sequence");
    }

    return result.requestId;
  }

  /**
   * Execute the next sequence in queue (validation compliance method)
   * @returns Success status
   */
  executeNextSequence(): boolean {
    if (this.executionQueue.isEmpty()) {
      return false;
    }

    if (this.sequenceExecutor.isSequenceRunning()) {
      return false; // Already executing a sequence
    }

    // Trigger queue processing
    this.sequenceOrchestrator.processSequenceQueue();
    return true;
  }

  /**
   * Check if a sequence is currently running (validation compliance method)
   * @param sequenceId - Optional sequence ID to check for specific sequence
   * @returns True if a sequence is executing (or specific sequence if ID provided)
   */
  isSequenceRunning(sequenceId?: string): boolean {
    return this.sequenceExecutor.isSequenceRunning(sequenceId);
  }

  /**
   * Get the currently executing sequence (validation compliance method)
   * @returns Current sequence execution context or null
   */
  getCurrentSequence(): SequenceExecutionContext | null {
    return this.sequenceExecutor.getCurrentSequence();
  }

  /**
   * Get queued sequences (validation compliance method)
   * @returns Array of queued sequence names
   */
  getQueuedSequences(): string[] {
    return this.executionQueue
      .getQueuedRequests()
      .map((request) => request.sequenceName);
  }

  /**
   * Clear the sequence queue (validation compliance method)
   * @returns Number of sequences that were cleared
   */
  clearSequenceQueue(): number {
    const clearedCount = this.executionQueue.size();
    this.executionQueue.clear();
    console.log(
      `🎼 ConductorAPI: Cleared ${clearedCount} sequences from queue`
    );
    return clearedCount;
  }

  /**
   * Get queue status information
   * @returns Queue status object
   */
  getQueueStatus(): QueueStatus {
    const nextRequest = this.executionQueue.peek();

    return {
      size: this.executionQueue.size(),
      isEmpty: this.executionQueue.isEmpty(),
      isProcessing: this.sequenceExecutor.isSequenceRunning(),
      nextSequence: nextRequest?.sequenceName,
    };
  }

  /**
   * Get current statistics (enhanced with CIA plugin information)
   * @returns Enhanced statistics object
   */
  getStatistics(): ConductorStatistics & { mountedPlugins: number } {
    return this.statisticsManager.getEnhancedStatistics(
      this.pluginInterface.getMountedPluginIds().length
    );
  }

  /**
   * Get conductor status including eventBus availability
   * @returns Conductor status object
   */
  getStatus(): ConductorStatus {
    return {
      statistics: this.getStatistics(),
      eventBus: !!this.eventBus,
      sequences: this.sequenceRegistry.getNames().length,
      plugins: this.pluginInterface.getMountedPluginIds().length,
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statisticsManager.reset();
    console.log("🎼 ConductorAPI: Statistics reset");
  }

  /**
   * Update the data baton payload for the currently executing sequence
   * This allows plugin handlers to pass data between beats
   * @param payloadData - Data to merge into the current payload
   * @returns Success status
   */
  updateDataBaton(payloadData: Record<string, any>): boolean {
    const currentSequence = this.sequenceExecutor.getCurrentSequence();
    if (!currentSequence) {
      console.warn("🎽 ConductorAPI: No active sequence to update data baton");
      return false;
    }

    try {
      // Merge the new payload data with existing payload
      Object.assign(currentSequence.payload, payloadData);

      console.log(
        `🎽 ConductorAPI: Updated data baton for sequence ${currentSequence.sequenceName}`,
        payloadData
      );

      return true;
    } catch (error) {
      console.error("🎽 ConductorAPI: Failed to update data baton:", error);
      return false;
    }
  }

  /**
   * Get the current data baton payload
   * @returns Current payload data or null if no active sequence
   */
  getDataBaton(): Record<string, any> | null {
    const currentSequence = this.sequenceExecutor.getCurrentSequence();
    if (!currentSequence) {
      return null;
    }

    return { ...currentSequence.payload }; // Return a copy to prevent external modification
  }

  /**
   * Clear the data baton payload
   * @returns Success status
   */
  clearDataBaton(): boolean {
    const currentSequence = this.sequenceExecutor.getCurrentSequence();
    if (!currentSequence) {
      console.warn("🎽 ConductorAPI: No active sequence to clear data baton");
      return false;
    }

    try {
      currentSequence.payload = {};
      console.log(
        `🎽 ConductorAPI: Cleared data baton for sequence ${currentSequence.sequenceName}`
      );
      return true;
    } catch (error) {
      console.error("🎽 ConductorAPI: Failed to clear data baton:", error);
      return false;
    }
  }

  /**
   * Get all registered sequence names
   * @returns Array of sequence names
   */
  getRegisteredSequences(): string[] {
    return this.sequenceRegistry.getNames();
  }

  /**
   * Check if a sequence is registered
   * @param sequenceId - ID of the sequence to check
   * @returns True if sequence is registered
   */
  isSequenceRegistered(sequenceId: string): boolean {
    return this.sequenceRegistry.has(sequenceId);
  }

  /**
   * Check if a sequence is registered by name (for backward compatibility)
   * @param sequenceName - Name of the sequence to check
   * @returns True if sequence is registered
   */
  isSequenceRegisteredByName(sequenceName: string): boolean {
    return this.sequenceRegistry.findByName(sequenceName) !== undefined;
  }

  /**
   * Get mounted plugin information
   * @returns Array of mounted plugin IDs
   */
  getMountedPlugins(): string[] {
    return this.pluginInterface.getMountedPluginIds();
  }

  /**
   * Check if a plugin is mounted
   * @param pluginId - ID of the plugin to check
   * @returns True if plugin is mounted
   */
  isPluginMounted(pluginId: string): boolean {
    return this.pluginInterface.getMountedPluginIds().includes(pluginId);
  }

  /**
   * Get comprehensive debug information
   * @returns Debug information object
   */
  getDebugInfo(): {
    api: {
      queueStatus: QueueStatus;
      statistics: ConductorStatistics & { mountedPlugins: number };
      registeredSequences: string[];
      mountedPlugins: string[];
    };
    orchestration: ReturnType<SequenceOrchestrator["getDebugInfo"]>;
  } {
    return {
      api: {
        queueStatus: this.getQueueStatus(),
        statistics: this.getStatistics(),
        registeredSequences: this.getRegisteredSequences(),
        mountedPlugins: this.getMountedPlugins(),
      },
      orchestration: this.sequenceOrchestrator.getDebugInfo(),
    };
  }
}
