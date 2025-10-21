/**
 * EventSubscriptionManager - Manages event subscriptions with SPA compliance
 * Handles authorized event subscriptions and prevents direct EventBus access violations
 */
export class EventSubscriptionManager {
    eventBus;
    spaValidator;
    constructor(eventBus, spaValidator) {
        this.eventBus = eventBus;
        this.spaValidator = spaValidator;
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
    subscribe(eventName, callback, context) {
        // Validate caller is allowed to subscribe
        const stack = new Error().stack || "";
        const callerInfo = this.spaValidator.analyzeCallStack(stack);
        if (!this.isAuthorizedSubscriber(callerInfo)) {
            const violation = this.spaValidator.createViolation("UNAUTHORIZED_CONDUCTOR_SUBSCRIBE", callerInfo.pluginId || "unknown", `Unauthorized conductor.subscribe() call from ${callerInfo.source}`, stack, "error");
            this.spaValidator.handleViolation(violation);
            if (this.spaValidator.config.strictMode) {
                throw new Error(`Unauthorized conductor.subscribe() call from ${callerInfo.source}`);
            }
        }
        // Internal eventBus.subscribe() call with conductor context
        return this.eventBus.subscribe(eventName, callback, {
            ...context,
            conductorManaged: true,
            subscribedVia: "conductor",
        });
    }
    /**
     * Unsubscribe from events through the conductor (SPA-compliant)
     * @param eventName - The event name to unsubscribe from
     * @param callback - The callback function to remove
     */
    unsubscribe(eventName, callback) {
        // Validate caller is allowed to unsubscribe
        const stack = new Error().stack || "";
        const callerInfo = this.spaValidator.analyzeCallStack(stack);
        if (!this.isAuthorizedSubscriber(callerInfo)) {
            const violation = this.spaValidator.createViolation("UNAUTHORIZED_CONDUCTOR_UNSUBSCRIBE", callerInfo.pluginId || "unknown", `Unauthorized conductor.unsubscribe() call from ${callerInfo.source}`, stack, "error");
            this.spaValidator.handleViolation(violation);
            if (this.spaValidator.config.strictMode) {
                throw new Error(`Unauthorized conductor.unsubscribe() call from ${callerInfo.source}`);
            }
        }
        // Internal eventBus.unsubscribe() call
        this.eventBus.unsubscribe(eventName, callback);
    }
    /**
     * Check if the caller is authorized to subscribe/unsubscribe
     * @param callerInfo - Information about the caller from stack analysis
     * @returns True if authorized
     */
    isAuthorizedSubscriber(callerInfo) {
        // Allow React components to use conductor.subscribe()
        if (callerInfo.isReactComponent) {
            return true;
        }
        // Allow plugins to use conductor.subscribe() within mount method
        if (callerInfo.isPlugin && callerInfo.isInMountMethod) {
            return true;
        }
        // Allow conductor internal usage
        if (callerInfo.source === "MusicalConductor") {
            return true;
        }
        // Allow conductor core components
        if (callerInfo.source?.includes("ConductorCore") ||
            callerInfo.source?.includes("SequenceExecutor") ||
            callerInfo.source?.includes("PluginManager")) {
            return true;
        }
        return false;
    }
    /**
     * Create a managed subscription that tracks the subscriber
     * @param eventName - The event name to subscribe to
     * @param callback - The callback function
     * @param subscriberId - Identifier for the subscriber
     * @param context - Optional context
     * @returns Unsubscribe function
     */
    createManagedSubscription(eventName, callback, subscriberId, context) {
        console.log(`🎼 EventSubscriptionManager: Creating managed subscription for ${subscriberId} -> ${eventName}`);
        const enhancedCallback = (data) => {
            try {
                callback(data);
            }
            catch (error) {
                console.error(`🎼 EventSubscriptionManager: Error in subscription callback for ${eventName}:`, error);
                console.error(`🎼 Subscriber: ${subscriberId}`);
            }
        };
        return this.eventBus.subscribe(eventName, enhancedCallback, {
            ...context,
            subscriberId,
            managedByEventSubscriptionManager: true,
        });
    }
    /**
     * Emit an event through the subscription manager
     * This provides a controlled way to emit events with validation
     * @param eventName - The event name to emit
     * @param data - The data to emit
     * @param emitterId - Identifier for the emitter
     */
    emit(eventName, data, emitterId) {
        if (emitterId) {
            console.log(`🎼 EventSubscriptionManager: ${emitterId} emitting ${eventName}`);
        }
        this.eventBus.emit(eventName, data);
    }
    /**
     * Get subscription statistics
     * @returns Statistics about current subscriptions
     */
    getSubscriptionStatistics() {
        const debugInfo = this.eventBus.getDebugInfo();
        return {
            totalSubscriptions: debugInfo.totalSubscriptions,
            subscriptionCounts: debugInfo.subscriptionCounts,
        };
    }
    /**
     * Validate that an event subscription is properly authorized
     * @param eventName - The event name being subscribed to
     * @param callerInfo - Information about the caller
     * @returns Validation result
     */
    validateSubscription(eventName, callerInfo) {
        // Check for direct EventBus access attempts
        if (callerInfo.isDirectEventBusAccess) {
            return {
                isValid: false,
                reason: "Direct EventBus access detected",
                recommendation: "Use conductor.subscribe() instead of eventBus.subscribe()",
            };
        }
        // Check for unauthorized plugin access
        if (callerInfo.isPlugin && !callerInfo.isInMountMethod) {
            return {
                isValid: false,
                reason: "Plugin subscribing outside of mount method",
                recommendation: "Move event subscriptions to the plugin's mount method",
            };
        }
        // Check for React component violations
        if (callerInfo.isReactComponent && callerInfo.isDirectEventBusAccess) {
            return {
                isValid: false,
                reason: "React component using direct EventBus access",
                recommendation: "Use conductor.subscribe() in React components",
            };
        }
        return { isValid: true };
    }
}
//# sourceMappingURL=EventSubscriptionManager.js.map