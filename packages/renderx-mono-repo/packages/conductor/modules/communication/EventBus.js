/**
 * EventBus - Component Communication System (TypeScript)
 *
 * Provides a robust pub/sub system for isolated component communication
 * following the RenderX component-driven architecture principles.
 *
 * Features:
 * - Event subscription and emission
 * - Automatic unsubscribe functions
 * - Error handling to prevent callback failures from breaking the system
 * - Event debugging and logging capabilities
 * - TypeScript support with proper typing
 */
/**
 * Base EventBus Class
 */
export class EventBus {
    events = {};
    debugMode = true; // Set to true for development debugging
    subscriptionCounter = 0;
    eventCounts = {};
    /**
     * Subscribe to an event
     * @param eventName - Name of the event to subscribe to
     * @param callback - Function to call when event is emitted
     * @param context - Optional context including pluginId for deduplication
     * @returns Unsubscribe function
     */
    subscribe(eventName, callback, context) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        // Check for duplicate subscription (same pluginId for same event)
        if (context?.pluginId) {
            const existingSubscription = this.events[eventName].find((sub) => sub.pluginId === context.pluginId);
            if (existingSubscription) {
                const pluginInfo = ` from plugin ${context.pluginId}`;
                console.warn(`🚫 EventBus: Duplicate subscription blocked for "${eventName}"${pluginInfo}`);
                // Return the existing unsubscribe function
                return () => {
                    this.unsubscribe(eventName, callback);
                };
            }
        }
        // Create subscription object
        const subscription = {
            id: `sub_${this.subscriptionCounter++}`,
            eventName,
            callback,
            subscribedAt: new Date(),
            pluginId: context?.pluginId,
            context,
        };
        this.events[eventName].push(subscription);
        if (this.debugMode) {
            const pluginInfo = context?.pluginId
                ? ` (plugin: ${context.pluginId})`
                : "";
            console.log(`📡 EventBus: Subscribed to "${eventName}" (${this.events[eventName].length} total subscribers)${pluginInfo}`);
        }
        // Return unsubscribe function
        return () => {
            this.unsubscribe(eventName, callback);
        };
    }
    /**
     * Unsubscribe from an event
     * @param eventName - Name of the event
     * @param callback - Callback function to remove
     */
    unsubscribe(eventName, callback) {
        if (!this.events[eventName]) {
            return;
        }
        const index = this.events[eventName].findIndex((sub) => sub.callback === callback);
        if (index > -1) {
            const removedSub = this.events[eventName][index];
            this.events[eventName].splice(index, 1);
            if (this.debugMode) {
                const pluginInfo = removedSub.pluginId
                    ? ` (plugin: ${removedSub.pluginId})`
                    : "";
                console.log(`📡 EventBus: Unsubscribed from "${eventName}" (${this.events[eventName].length} remaining subscribers)${pluginInfo}`);
            }
            // Clean up empty event arrays
            if (this.events[eventName].length === 0) {
                delete this.events[eventName];
            }
        }
    }
    /**
     * Emit an event to all subscribers
     * @param eventName - Name of the event to emit
     * @param data - Data to pass to subscribers
     */
    emit(eventName, data) {
        // Track event counts (total emissions)
        this.eventCounts[eventName] = (this.eventCounts[eventName] || 0) + 1;
        if (!this.events[eventName]) {
            return Promise.resolve();
        }
        const subscribers = [...this.events[eventName]];
        subscribers.forEach((subscription, index) => {
            try {
                const result = subscription.callback(data);
                // Swallow async rejections to prevent unhandled promise rejections in tests
                if (result && typeof result.catch === "function") {
                    result.catch((error) => {
                        const pluginInfo = subscription.pluginId
                            ? ` (plugin: ${subscription.pluginId})`
                            : "";
                        console.error(`📡 EventBus: Async error in subscriber ${index} for "${eventName}"${pluginInfo}:`, error);
                    });
                }
            }
            catch (error) {
                const pluginInfo = subscription.pluginId
                    ? ` (plugin: ${subscription.pluginId})`
                    : "";
                console.error(`📡 EventBus: Error in subscriber ${index} for "${eventName}"${pluginInfo}:`, error);
            }
        });
        return Promise.resolve();
    }
    /**
     * Emit an event and await all (possibly async) subscribers
     * Resolves when all subscriber callbacks have settled
     */
    async emitAsync(eventName, data) {
        // Track event counts
        this.eventCounts[eventName] = (this.eventCounts[eventName] || 0) + 1;
        if (!this.events[eventName]) {
            return;
        }
        const subscribers = [...this.events[eventName]];
        const tasks = subscribers.map((subscription, index) => {
            try {
                const ret = subscription.callback(data);
                return Promise.resolve(ret);
            }
            catch (error) {
                const pluginInfo = subscription.pluginId
                    ? ` (plugin: ${subscription.pluginId})`
                    : "";
                console.error(`📡 EventBus: Error in subscriber ${index} for "${eventName}"${pluginInfo}:`, error);
                return Promise.resolve();
            }
        });
        // Await all, but do not throw on individual failures
        await Promise.allSettled(tasks);
    }
    /**
     * Remove all subscribers for an event
     * @param eventName - Name of the event to clear
     */
    clearEvent(eventName) {
        if (this.events[eventName]) {
            delete this.events[eventName];
            if (this.debugMode) {
                console.log(`📡 EventBus: Cleared all subscribers for "${eventName}"`);
            }
        }
    }
    /**
     * Remove all subscribers for all events
     */
    clearAll() {
        this.events = {};
        this.eventCounts = {};
        if (this.debugMode) {
            console.log("📡 EventBus: Cleared all subscribers");
        }
    }
    /**
     * Get debug information about the EventBus
     */
    getDebugInfo() {
        const subscriptionCounts = {};
        let totalSubscriptions = 0;
        Object.keys(this.events).forEach((eventName) => {
            subscriptionCounts[eventName] = this.events[eventName].length;
            totalSubscriptions += this.events[eventName].length;
        });
        const totalEventsEmitted = Object.values(this.eventCounts).reduce((sum, count) => sum + count, 0);
        return {
            totalEvents: totalEventsEmitted,
            totalSubscriptions,
            eventCounts: { ...this.eventCounts },
            subscriptionCounts,
        };
    }
    /**
     * Check if an event has subscribers
     * @param eventName - Name of the event to check
     */
    hasSubscribers(eventName) {
        return !!(this.events[eventName] && this.events[eventName].length > 0);
    }
    /**
     * Get subscriber count for an event
     * @param eventName - Name of the event
     */
    getSubscriberCount(eventName) {
        return this.events[eventName]?.length || 0;
    }
    /**
     * Enable or disable debug mode
     * @param enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`📡 EventBus: Debug mode ${enabled ? "enabled" : "disabled"}`);
    }
}
// Import EVENT_TYPES from the dedicated event-types module
import { EVENT_TYPES } from "./event-types/index.js";
export { EVENT_TYPES };
/**
 * ConductorEventBus - Enhanced EventBus with Musical Sequencing
 * Extends the base EventBus with priority-based processing, dependency management,
 * and timing control to eliminate race conditions and provide proper event orchestration.
 */
export class ConductorEventBus extends EventBus {
    externalConductor = null;
    sequences = new Map();
    priorities = new Map();
    dependencies = new Map();
    currentSequences = new Map();
    completedEvents = new Set();
    // Performance monitoring
    metrics = {
        eventsProcessed: 0,
        sequencesExecuted: 0,
        averageLatency: 0,
        raceConditionsDetected: 0,
    };
    // Conductor state
    tempo = 120; // Default BPM for timing calculations
    constructor(externalConductor = null) {
        super();
        // Use external conductor if provided
        if (externalConductor) {
            console.log("🎼 EventBus: Using external conductor for unified sequence system");
            this.externalConductor = externalConductor;
            // Use external conductor's sequence registry for unified system
            this.sequences = externalConductor.sequences || new Map();
        }
        else {
            console.log("🎼 EventBus: Using internal conductor (legacy mode)");
            // Legacy mode: separate sequence system
            this.sequences = new Map();
        }
    }
    /**
     * Enhanced emit with conductor control
     * @param eventName - Event to emit
     * @param data - Event data
     * @param options - Conductor options
     */
    emit(eventName, data, options = {}) {
        const startTime = performance.now();
        // Check if this event is part of a sequence
        if (options.sequence) {
            this.emitInSequence(eventName, data, options);
            return Promise.resolve();
        }
        // Apply priority-based processing
        const priority = this.priorities.get(eventName) || "mp"; // mezzo-piano default
        const dependencies = this.dependencies.get(eventName) || [];
        // Check dependencies
        if (dependencies.length > 0 &&
            !this.dependenciesMet(dependencies, options.context)) {
            this.queueForDependencies(eventName, data, options, dependencies);
            return Promise.resolve();
        }
        // Execute with timing control
        this.executeWithTiming(eventName, data, options, priority);
        // Update metrics
        this.updateMetrics(eventName, startTime);
        return Promise.resolve();
    }
    /**
     * Execute event with musical timing
     * @param eventName - Event name
     * @param data - Event data
     * @param options - Timing options
     * @param priority - Event priority
     */
    executeWithTiming(eventName, data, options, priority) {
        const timing = options.timing || "immediate";
        switch (timing) {
            case "immediate":
                this.executeEvent(eventName, data, priority);
                break;
            case "after-beat":
                // Wait for previous beat to complete
                setTimeout(() => this.executeEvent(eventName, data, priority), 0);
                break;
            case "next-measure":
                // Wait for next event loop tick (browser-compatible)
                setTimeout(() => this.executeEvent(eventName, data, priority), 0);
                break;
            case "delayed":
                // Intentional delay based on tempo
                const delay = this.calculateDelay(options.beats || 1);
                setTimeout(() => this.executeEvent(eventName, data, priority), delay);
                break;
            case "wait-for-signal":
                // Queue until specific condition is met
                this.queueForSignal(eventName, data, options.signal, priority);
                break;
            default:
                this.executeEvent(eventName, data, priority);
        }
    }
    /**
     * Execute event with base EventBus emit
     * @param eventName - Event name
     * @param data - Event data
     * @param priority - Event priority
     */
    executeEvent(eventName, data, priority) {
        // Call parent emit method
        super.emit(eventName, data);
        this.completedEvents.add(eventName);
    }
    /**
     * Emit event in sequence context
     * @param eventName - Event name
     * @param data - Event data
     * @param options - Sequence options
     */
    emitInSequence(eventName, data, options) {
        // Delegate to external conductor if available
        if (this.externalConductor && this.externalConductor.startSequence) {
            console.log(`🎼 EventBus: Delegating to external conductor for sequence event "${eventName}"`);
            return this.externalConductor.startSequence(options.sequence, data, options.context);
        }
        // Fallback to regular emit
        super.emit(eventName, data);
    }
    /**
     * Check if dependencies are met
     * @param dependencies - Array of dependency event names
     * @param context - Execution context
     */
    dependenciesMet(dependencies, context) {
        return dependencies.every((dep) => this.completedEvents.has(dep));
    }
    /**
     * Queue event for dependencies
     * @param eventName - Event name
     * @param data - Event data
     * @param options - Options
     * @param dependencies - Dependencies
     */
    queueForDependencies(eventName, data, options, dependencies) {
        console.log(`🎼 EventBus: Queueing ${eventName} for dependencies:`, dependencies);
        // Simple implementation - could be enhanced with proper dependency resolution
        setTimeout(() => {
            if (this.dependenciesMet(dependencies, options.context)) {
                this.emit(eventName, data, { ...options, timing: "immediate" });
            }
        }, 50);
    }
    /**
     * Queue event for signal
     * @param eventName - Event name
     * @param data - Event data
     * @param signal - Signal to wait for
     * @param priority - Event priority
     */
    queueForSignal(eventName, data, signal, priority) {
        console.log(`🎼 EventBus: Queueing ${eventName} for signal: ${signal}`);
        // Simple implementation - could be enhanced with proper signal handling
        const checkSignal = () => {
            if (this.completedEvents.has(signal)) {
                this.executeEvent(eventName, data, priority);
            }
            else {
                setTimeout(checkSignal, 10);
            }
        };
        checkSignal();
    }
    /**
     * Calculate delay based on tempo
     * @param beats - Number of beats to delay
     */
    calculateDelay(beats) {
        // Convert BPM to milliseconds per beat
        const msPerBeat = (60 / this.tempo) * 1000;
        return beats * msPerBeat;
    }
    /**
     * Update performance metrics
     * @param eventName - Event name
     * @param startTime - Start time
     */
    updateMetrics(eventName, startTime) {
        const latency = performance.now() - startTime;
        this.metrics.eventsProcessed++;
        // Simple moving average for latency
        const alpha = 0.1;
        this.metrics.averageLatency =
            this.metrics.averageLatency * (1 - alpha) + latency * alpha;
    }
    /**
     * Connect to external conductor
     * @param conductor - The main conductor instance
     */
    connectToMainConductor(conductor) {
        console.log("🎼 EventBus: Connecting to main conductor for unified sequence system");
        this.externalConductor = conductor;
        // Use the main conductor's sequence registry for unified access
        if (conductor.sequences) {
            this.sequences = conductor.sequences;
            console.log(`🎼 EventBus: Connected to main conductor with ${this.sequences.size} sequences`);
        }
        else {
            console.warn("🚨 EventBus: Main conductor does not have sequences property");
        }
    }
    /**
     * Get basic performance metrics
     */
    getBasicMetrics() {
        return { ...this.metrics };
    }
    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.metrics = {
            eventsProcessed: 0,
            sequencesExecuted: 0,
            averageLatency: 0,
            raceConditionsDetected: 0,
        };
    }
    /**
     * Set musical tempo (BPM)
     */
    setTempo(bpm) {
        this.tempo = bpm;
    }
    /**
     * Get current musical tempo (BPM)
     */
    getTempo() {
        return this.tempo;
    }
    /**
     * Get beat duration in milliseconds based on current tempo
     */
    getBeatDuration() {
        return (60 / this.tempo) * 1000;
    }
    /**
     * Register a musical sequence
     */
    registerSequence(key, sequence) {
        this.sequences.set(key, sequence);
    }
    /**
     * Get all sequence names
     */
    getSequenceNames() {
        return Array.from(this.sequences.keys());
    }
    /**
     * Play a sequence through the conductor
     */
    async play(sequenceName, data) {
        this.metrics.sequencesExecuted++;
        if (this.externalConductor && this.externalConductor.startSequence) {
            try {
                return await this.externalConductor.startSequence(sequenceName, data);
            }
            catch (error) {
                console.error(`🎼 EventBus: Error playing sequence ${sequenceName}:`, error);
            }
        }
        else {
            // Fallback to event emission
            this.emit("sequence-start", { sequenceName, data });
        }
    }
    /**
     * Get comprehensive metrics including conductor stats
     */
    getMetrics() {
        const eventBusStats = this.getDebugInfo();
        const conductorStats = this.externalConductor?.getStatistics?.() || {};
        return {
            sequenceCount: this.sequences.size,
            sequenceExecutions: this.metrics.sequencesExecuted,
            eventBusStats,
            conductorStats,
            ...this.metrics,
        };
    }
}
// Create and export singleton instance using ConductorEventBus
export const eventBus = new ConductorEventBus();
// Debug mode disabled for cleaner logging output
// eventBus.setDebugMode(true);
//# sourceMappingURL=EventBus.js.map