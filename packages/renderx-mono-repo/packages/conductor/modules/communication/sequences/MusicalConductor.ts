/**
 * Musical Conductor / Event Orchestrator
 * CIA-Compliant Musical Conductor Class (TypeScript)
 * Manages the execution and coordination of musical sequences with CIA compliance
 *
 * Features:
 * - SPA (Symphonic Plugin Architecture) compatibility
 * - CIA (Conductor Integration Architecture) compliance for safe symphonic plugin mounting (SPM)
 * - Sequential orchestration with queue-based system
 * - Priority-based sequence execution
 * - Comprehensive error handling
 * - Performance metrics and statistics
 * - TypeScript support with proper typing
 * - Runtime plugin shape validation
 * - Graceful failure handling for malformed plugins
 * - Movement-to-handler contract verification
 */

import { EventBus, EventCallback, UnsubscribeFunction } from "../EventBus.js";
import { SPAValidator } from "../SPAValidator.js";
import type {
  MusicalSequence,
  SequenceExecutionContext,
  ConductorStatistics,
  SequenceRequest,
  SequencePriority,
  SequenceBeat,
  SequenceMovement,
} from "./SequenceTypes.js";
import {
  MUSICAL_TIMING,
  MUSICAL_DYNAMICS,
  MUSICAL_CONDUCTOR_EVENT_TYPES,
  SEQUENCE_PRIORITIES,
} from "./SequenceTypes.js";

// Import new core components
import { ConductorCore } from "./core/ConductorCore.js";
import { SequenceRegistry } from "./core/SequenceRegistry.js";
import { EventSubscriptionManager } from "./core/EventSubscriptionManager.js";
import { ExecutionQueue, QueueStatus } from "./execution/ExecutionQueue.js";
import { SequenceExecutor } from "./execution/SequenceExecutor.js";
import { PluginManager } from "./plugins/PluginManager.js";
// Version import (ESM JSON import; supported in Node 18+/modern bundlers)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pkg from "../../../package.json" assert { type: "json" };

import {
  PluginInterfaceFacade,
  type SPAPlugin,
  type PluginMountResult,
} from "./plugins/PluginInterfaceFacade.js";
import { ResourceManager } from "./resources/ResourceManager.js";
import { ResourceDelegator } from "./resources/ResourceDelegator.js";
import { StatisticsManager } from "./monitoring/StatisticsManager.js";
import { PerformanceTracker } from "./monitoring/PerformanceTracker.js";
import { DuplicationDetector } from "./monitoring/DuplicationDetector.js";
import { EventLogger } from "./monitoring/EventLogger.js";
import { SequenceValidator } from "./validation/SequenceValidator.js";
import { SequenceUtilities } from "./utilities/SequenceUtilities.js";
import { SequenceOrchestrator } from "./orchestration/SequenceOrchestrator.js";
import { EventOrchestrator } from "./orchestration/EventOrchestrator.js";
import { ConductorAPI } from "./api/ConductorAPI.js";
import { StrictModeManager } from "./strictmode/StrictModeManager.js";
import { ResourceConflictManager } from "./resources/ResourceConflictManager.js";
import { CallbackRegistry } from "./orchestration/CallbackRegistry.js";

// CIA (Conductor Integration Architecture) interfaces moved to PluginInterfaceFacade

// MCO/MSO Resource Ownership and Instance Management Interfaces
export interface ResourceOwner {
  symphonyName: string;
  instanceId: string;
  resourceId: string;
  acquiredAt: number;
  priority: SequencePriority;
  sequenceExecutionId: string;
}

export interface SequenceInstance {
  instanceId: string;
  sequenceId: string;
  sequenceName: string; // For display/logging purposes
  symphonyName: string;
  createdAt: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "FAILED";
  resourcesOwned: string[];
}

export interface ResourceConflictResult {
  hasConflict: boolean;
  conflictType:
    | "NONE"
    | "SAME_RESOURCE"
    | "PRIORITY_CONFLICT"
    | "INSTANCE_CONFLICT";
  currentOwner?: ResourceOwner;
  resolution: "ALLOW" | "REJECT" | "QUEUE" | "INTERRUPT";
  message: string;
}

export class MusicalConductor {
  private static instance: MusicalConductor | null = null;

  // Core components
  private conductorCore: ConductorCore;
  private sequenceRegistry: SequenceRegistry;
  private eventSubscriptionManager: EventSubscriptionManager;
  private executionQueue: ExecutionQueue;
  private sequenceExecutor: SequenceExecutor;
  private pluginManager: PluginManager;
  private pluginInterface: PluginInterfaceFacade;
  private resourceManager: ResourceManager;
  private resourceDelegator: ResourceDelegator;

  // Monitoring components
  private statisticsManager: StatisticsManager;
  private performanceTracker: PerformanceTracker;
  private duplicationDetector: DuplicationDetector;
  private eventLogger: EventLogger;

  // Callback/correlation tracking for explicit cleanup
  private requestCorrelationMap: Map<string, string> = new Map();
  private correlationActiveCounts: Map<string, number> = new Map();
  private eventUnsubscribes: UnsubscribeFunction[] = [];

  // Validation components
  private sequenceValidator: SequenceValidator;

  // Utility components
  private sequenceUtilities: SequenceUtilities;

  // Orchestration components
  private sequenceOrchestrator: SequenceOrchestrator;
  private eventOrchestrator: EventOrchestrator;

  // API components
  private conductorAPI: ConductorAPI;

  // StrictMode components
  private strictModeManager: StrictModeManager;

  // Resource conflict components
  private resourceConflictManager: ResourceConflictManager;

  // Core component getters
  private get eventBus(): EventBus {
    return this.conductorCore.getEventBus();
  }

  /**
   * Expose the sequence registry map early for EventBus integration
   * Available immediately after construction (may be empty until registration)
   */
  public get sequences(): Map<string, MusicalSequence> {
    return this.sequenceRegistry.getSequenceMap();
  }

  private constructor(eventBus: EventBus) {
    // Initialize core components
    this.conductorCore = ConductorCore.getInstance(eventBus);
    this.sequenceRegistry = new SequenceRegistry(eventBus);
    this.eventSubscriptionManager = new EventSubscriptionManager(
      eventBus,
      this.conductorCore.getSPAValidator()
    );

    // Inject EventSubscriptionManager into SequenceRegistry for SPA compliance
    this.sequenceRegistry.setEventSubscriptionManager(
      this.eventSubscriptionManager
    );
    this.executionQueue = new ExecutionQueue();
    // Initialize monitoring components first
    this.statisticsManager = new StatisticsManager();
    this.performanceTracker = new PerformanceTracker();
    this.duplicationDetector = new DuplicationDetector();
    this.eventLogger = new EventLogger(eventBus, this.performanceTracker);

    // Initialize validation components
    this.sequenceValidator = new SequenceValidator(this.duplicationDetector);

    // Initialize utility components
    this.sequenceUtilities = new SequenceUtilities();

    this.sequenceExecutor = new SequenceExecutor(
      eventBus,
      this.conductorCore.getSPAValidator(),
      this.executionQueue,
      this.statisticsManager
    );
    this.pluginManager = new PluginManager(
      eventBus,
      this.conductorCore.getSPAValidator(),
      this.sequenceRegistry
    );
    this.pluginInterface = new PluginInterfaceFacade(
      this.pluginManager,
      this.conductorCore.getSPAValidator()
    );
    this.resourceManager = new ResourceManager();
    this.resourceDelegator = new ResourceDelegator(this.resourceManager);

    // Initialize orchestration components (after all dependencies are ready)
    this.sequenceOrchestrator = new SequenceOrchestrator(
      eventBus,
      this.sequenceRegistry,
      this.executionQueue,
      this.sequenceExecutor,
      this.statisticsManager,
      this.sequenceValidator,
      this.sequenceUtilities,
      this.resourceDelegator
    );
    this.eventOrchestrator = new EventOrchestrator(eventBus);

    // Initialize API components
    this.conductorAPI = new ConductorAPI(
      this.sequenceOrchestrator,
      this.sequenceExecutor,
      this.executionQueue,
      this.statisticsManager,
      this.pluginInterface,
      this.sequenceRegistry,
      eventBus
    );

    // Initialize StrictMode components
    this.strictModeManager = new StrictModeManager(this.duplicationDetector);

    // Initialize resource conflict components
    this.resourceConflictManager = new ResourceConflictManager(
      this.resourceManager,
      this.resourceDelegator,
      this.sequenceUtilities
    );

    try {
      const v = (pkg as any)?.version || "unknown";
      console.log(
        `🎼 MusicalConductor v${v}: Initialized with core components`
      );
    } catch {
      console.log("🎼 MusicalConductor: Initialized with core components");
    }
  }

  /**
   * Get the singleton instance of Musical Conductor
   * @param eventBus - The event bus instance (required for first initialization)
   * @returns The singleton Musical Conductor instance
   */
  public static getInstance(eventBus?: EventBus): MusicalConductor {
    if (!MusicalConductor.instance) {
      if (!eventBus) {
        throw new Error(
          "EventBus is required for first initialization of Musical Conductor"
        );
      }
      MusicalConductor.instance = new MusicalConductor(eventBus);
    } else if (eventBus && MusicalConductor.instance.eventBus !== eventBus) {
      console.warn(
        "🎼 MusicalConductor: Attempting to change eventBus on existing singleton instance - ignoring"
      );
    }
    return MusicalConductor.instance;
  }

  /**
   * Reset the singleton instance (for testing/cleanup)
   * This allows re-initialization if needed
   */
  public static resetInstance(): void {
    if (MusicalConductor.instance) {
      // Reset core components
      ConductorCore.resetInstance();
    }
    MusicalConductor.instance = null;
    console.log("🔄 MusicalConductor: Singleton instance reset");
  }

  /**
   * Handle beat execution error with hierarchical logging
   * @param executionContext - Execution context
   * @param beat - Beat that failed
   * @param error - Error that occurred
   */
  private handleBeatError(
    executionContext: SequenceExecutionContext,
    beat: SequenceBeat,
    error: Error
  ): void {
    this.eventLogger.handleBeatError(executionContext, beat, error);
  }

  /**
   * Register a musical sequence
   * @param sequence - The sequence to register
   */
  registerSequence(sequence: MusicalSequence): void {
    this.sequenceRegistry.register(sequence);
  }

  /**
   * Unregister a musical sequence
   * @param sequenceId - ID of the sequence to unregister
   */
  unregisterSequence(sequenceId: string): void {
    this.sequenceRegistry.unregister(sequenceId);
  }

  /**
   * Get a registered sequence by ID
   * @param sequenceId - ID of the sequence
   */
  getSequence(sequenceId: string): MusicalSequence | undefined {
    return this.sequenceRegistry.get(sequenceId);
  }

  /**
   * Get a registered sequence by name (for backward compatibility)
   * @param sequenceName - Name of the sequence
   */
  getSequenceByName(sequenceName: string): MusicalSequence | undefined {
    return this.sequenceRegistry.findByName(sequenceName);
  }

  /**
   * Get all registered sequence names
   */
  getSequenceNames(): string[] {
    return this.sequenceRegistry.getNames();
  }

  /**
   * Get all registered sequences with their details
   * @returns Array of registered sequences
   */
  getRegisteredSequences(): MusicalSequence[] {
    return this.sequenceRegistry.getAll();
  }

  /**
   * Get all mounted plugin names
   */
  getMountedPlugins(): string[] {
    return this.pluginInterface.getMountedPlugins();
  }

  // ===== CIA (Conductor Integration Architecture) Methods =====

  /**
   * Play a specific movement of a mounted SPA plugin (CIA-compliant)
   * @param pluginId - The plugin identifier
   * @param sequenceId - The sequence ID to execute
   * @param context - Context data to pass to the movement handler
   * @param priority - Sequence priority (NORMAL, HIGH, CHAINED)
   * @returns Execution result
   */
  play(
    pluginId: string,
    sequenceId: string,
    context: any = {},
    priority: SequencePriority = SEQUENCE_PRIORITIES.NORMAL
  ): any {
    try {
      // Preserve function-valued fields and attach correlation id for transport across nested play()
      const registry = CallbackRegistry.getInstance();
      const { correlationId, count } = registry.preserveInPlace(context);
      if (count > 0) {
        console.log(
          `🎼 MusicalConductor.play: preserved ${count} callback(s) for correlationId=${correlationId}`
        );
      }
      // Map correlationId to requestId after play() returns a requestId (via startSequence)
      // We'll capture this below in the startSequence callback wrapper
    } catch (e) {
      console.warn(
        "⚠️ MusicalConductor.play: callback preservation skipped:",
        (e as Error)?.message || e
      );
    }

    return this.pluginInterface.play(
      pluginId,
      sequenceId,
      context,
      priority,
      async (seqId, data, prio) => {
        // Wrap startSequence to record correlation id -> request id mapping
        const requestId = await this.startSequence(seqId, data, prio);
        try {
          const key = (await import("./orchestration/CallbackRegistry.js"))
            .__internal.CORRELATION_KEY as any;
          const corr = (data as any)?.[key];
          if (typeof corr === "string") {
            this.requestCorrelationMap.set(requestId, corr);
            const cur = this.correlationActiveCounts.get(corr) || 0;
            this.correlationActiveCounts.set(corr, cur + 1);
          }
          // Ensure event listeners to cleanup on completion/failure are installed once
          if (this.eventUnsubscribes.length === 0) {
            this.installCorrelationCleanupListeners();
          }
        } catch {}
        return requestId;
      }
    );
  }

  /**
   * Subscribe to events through the conductor (SPA-compliant)
   * This method ensures all event subscriptions go through the conductor
   * and prevents direct eventBus access violations
   * @param eventName - The event name to subscribe to
   * @param callback - The callback function to execute
   * @param context - Optional context for the subscription
   * @returns Unsubscribe function
   */
  subscribe(
    eventName: string,
    callback: EventCallback,
    context?: any
  ): UnsubscribeFunction {
    return this.eventSubscriptionManager.subscribe(
      eventName,
      callback,
      context
    );
  }

  /**
   * Friendly alias for subscribe() used by many client apps
   */
  on(
    eventName: string,
    callback: EventCallback,
    context?: any
  ): UnsubscribeFunction {
    return this.subscribe(eventName, callback, context);
  }

  /**
   * Unsubscribe from events through the conductor (SPA-compliant)
   * @param eventName - The event name to unsubscribe from
   * @param callback - The callback function to remove
   */
  unsubscribe(eventName: string, callback: EventCallback): void {
    this.eventSubscriptionManager.unsubscribe(eventName, callback);
  }

  /**
   * Friendly alias for unsubscribe() used by many client apps
   */
  off(eventName: string, callback: EventCallback): void {
    this.unsubscribe(eventName, callback);
  }

  /**
   * Mount an SPA plugin with comprehensive validation (CIA-compliant)
   * @param sequence - The sequence definition from the plugin
   * @param handlers - The handlers object from the plugin
   * @param pluginId - Optional plugin ID (defaults to sequence.name)
   * @returns Plugin mount result
   */
  async mount(
    sequence: any,
    handlers: any,
    pluginId?: string,
    metadata?: any
  ): Promise<PluginMountResult> {
    return this.pluginInterface.mount(sequence, handlers, pluginId, metadata);
  }

  /**
   * Register CIA-compliant plugins
   * Loads and mounts all plugins from the plugins directory
   */
  async registerCIAPlugins(): Promise<void> {
    return this.pluginInterface.registerCIAPlugins();
  }

  /**
   * Execute movement with handler validation (CIA-compliant)
   * @param sequenceId - Sequence ID identifier
   * @param movementName - Movement name
   * @param data - Data to pass to handler
   * @returns Handler execution result
   */
  executeMovementHandler(
    sequenceId: string,
    movementName: string,
    data: any
  ): any {
    return this.pluginInterface.executeMovementWithHandler(
      sequenceId,
      movementName,
      data
    );
  }

  /**
   * Load plugin from dynamic import with error handling (CIA-compliant)
   * @param pluginPath - Path to the plugin module
   * @returns Plugin load result
   */
  async loadPlugin(pluginPath: string): Promise<PluginMountResult> {
    return this.pluginInterface.loadPlugin(pluginPath);
  }

  /**
   * Validate plugin pre-compilation status
   * @param pluginId - Plugin identifier
   * @returns Validation result
   */

  /**
   * Unmount a plugin (CIA-compliant)
   * @param pluginId - Plugin identifier
   * @returns Success status
   */
  unmountPlugin(pluginId: string): boolean {
    return this.pluginInterface.unmountPlugin(pluginId);
  }

  /**
   * Get mounted plugin information
   * @param pluginId - Plugin identifier
   * @returns Plugin information or undefined
   */
  getPluginInfo(pluginId: string): SPAPlugin | undefined {
    return this.pluginInterface.getPluginInfo(pluginId);
  }

  /**
   * Get all mounted plugin IDs
   * @returns Array of plugin IDs
   */
  getMountedPluginIds(): string[] {
    return this.pluginInterface.getMountedPluginIds();
  }

  /**
   * Set priority for an event type
   * @param eventType - Event type
   * @param priority - Priority level (MUSICAL_DYNAMICS value)
   */
  setPriority(eventType: string, priority: string): void {
    console.log(
      `🎼 MusicalConductor: Set priority for ${eventType}: ${priority}`
    );
  }

  /**
   * Start a musical sequence with Sequential Orchestration and Resource Management
   * @param sequenceId - ID of the sequence to start
   * @param data - Data to pass to the sequence
   * @param priority - Priority level: 'HIGH', 'NORMAL', 'CHAINED'
   * @returns Request ID for tracking
   */
  async startSequence(
    sequenceIdOrName: string,
    data: Record<string, any> = {},
    priority: SequencePriority = SEQUENCE_PRIORITIES.NORMAL
  ): Promise<string> {
    // Allow starting by sequence name for backward-compatible tests
    let resolvedId = sequenceIdOrName;
    if (!this.sequenceRegistry.has(resolvedId)) {
      const byName = this.sequenceRegistry.findByName(sequenceIdOrName);
      if (byName) {
        resolvedId = byName.id;
      }
    }

    const result = this.sequenceOrchestrator.startSequence(
      resolvedId,
      data,
      priority
    );

    if (!result.success) {
      if (result.isDuplicate) {
        return result.requestId; // Return duplicate request ID for tracking
      }
      const reason = result.reason || "Failed to start sequence";
      if (/not found/i.test(reason)) {
        throw new Error("Sequence not found");
      }
      throw new Error(reason);
    }

    return result.requestId;
  }

  /**
   * Create execution context for a sequence
   * @param sequenceRequest - Sequence request
   */
  private createExecutionContext(
    sequenceRequest: SequenceRequest
  ): SequenceExecutionContext {
    return this.sequenceOrchestrator.createExecutionContext(sequenceRequest);
  }

  /**
   * Get current statistics (enhanced with CIA plugin information)
   */
  getStatistics(): ConductorStatistics & { mountedPlugins: number } {
    return this.conductorAPI.getStatistics();
  }

  /**
   * Get conductor status including eventBus availability
   * @returns Conductor status object
   */
  getStatus(): {
    statistics: ConductorStatistics & { mountedPlugins: number };
    eventBus: boolean;
    sequences: number;
    plugins: number;
  } {
    return this.conductorAPI.getStatus();
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.conductorAPI.resetStatistics();
    this.performanceTracker.reset();
    this.duplicationDetector.reset();
    console.log("🎼 MusicalConductor: All monitoring data reset");
  }

  /**
   * Get queue status
   */
  getQueueStatus(): QueueStatus {
    return this.executionQueue.getStatus();
  }

  /**
   * Emit an event through the event bus
   * @param eventType - Event type
   * @param eventData - Event data
   * @param executionContext - Execution context
   */
  private emitEvent(
    eventType: string,
    eventData: Record<string, any>,
    executionContext: SequenceExecutionContext
  ): void {
    const result = this.eventOrchestrator.emitEvent(
      eventType,
      eventData,
      executionContext
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to emit event");
    }
  }

  // ===== Orchestration Validation Compliance Methods =====

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
    return this.conductorAPI.queueSequence(sequenceId, data, priority);
  }

  /**
   * Execute the next sequence in queue (validation compliance method)
   * @returns Success status
   */
  executeNextSequence(): boolean {
    return this.conductorAPI.executeNextSequence();
  }

  /**
   * Check if a sequence is currently running (validation compliance method)
   * @param sequenceId - Optional sequence ID to check for specific sequence
   * @returns True if a sequence is executing (or specific sequence if ID provided)
   */
  isSequenceRunning(sequenceId?: string): boolean {
    return this.conductorAPI.isSequenceRunning(sequenceId);
  }

  /**
   * Get the currently executing sequence (validation compliance method)
   * @returns Current sequence execution context or null
   */
  getCurrentSequence(): SequenceExecutionContext | null {
    return this.conductorAPI.getCurrentSequence();
  }

  /**
   * 🎽 Update the data baton payload for the currently executing sequence
   * This allows plugin handlers to pass data between beats
   * @param payloadData - Data to merge into the current payload
   * @returns Success status
   */
  updatePayload(payloadData: Record<string, any>): boolean {
    return this.conductorAPI.updateDataBaton(payloadData);
  }

  /**
   * 🎽 Get the current data baton payload
   * @returns Current payload or null if no active sequence
   */
  getPayload(): Record<string, any> | null {
    return this.conductorAPI.getDataBaton();
  }

  /**
   * Get all queued sequences (validation compliance method)
   * @returns Array of queued sequence requests
   */
  getQueuedSequences(): string[] {
    return this.conductorAPI.getQueuedSequences();
  }

  /**
   * Install listeners to cleanup callback registry entries when sequences complete or fail
   */
  private installCorrelationCleanupListeners(): void {
    const bus = this.eventBus;
    const registry = CallbackRegistry.getInstance();

    const onDone = (evt: any) => {
      try {
        const requestId = evt?.requestId;
        const corr = requestId
          ? this.requestCorrelationMap.get(requestId)
          : undefined;
        if (typeof corr === "string") {
          const remaining = (this.correlationActiveCounts.get(corr) || 1) - 1;
          if (remaining <= 0) {
            registry.cleanup(corr);
            this.correlationActiveCounts.delete(corr);
            console.log(
              `🎼 MusicalConductor: cleaned callbacks for correlationId=${corr}`
            );
          } else {
            this.correlationActiveCounts.set(corr, remaining);
          }
          this.requestCorrelationMap.delete(requestId);
        }
      } catch {}
    };

    this.eventUnsubscribes.push(
      bus.subscribe("sequence-completed", onDone),
      bus.subscribe("sequence-failed", onDone),
      bus.subscribe("sequence-cancelled", onDone)
    );
  }

  /**
   * Clear the sequence queue (validation compliance method)
   * @returns Number of sequences that were cleared
   */
  clearSequenceQueue(): number {
    return this.conductorAPI.clearSequenceQueue();
  }

  /**
   * Get resource ownership information (MCO/MSO diagnostic method)
   * @returns Resource ownership map
   */
  getResourceOwnership(): Map<string, ResourceOwner> {
    return this.resourceConflictManager.getResourceOwnership();
  }

  /**
   * Get symphony resource mapping (MCO/MSO diagnostic method)
   * @returns Symphony to resources mapping
   */
  getSymphonyResourceMap(): Map<string, Set<string>> {
    return this.resourceConflictManager.getSymphonyResourceMap();
  }

  /**
   * Get sequence instances (MCO/MSO diagnostic method)
   * @returns Sequence instances map
   */
  getSequenceInstances(): Map<string, any> {
    return this.resourceManager.getSequenceInstances();
  }
}
