/**
 * ConductorCore - Core singleton management and initialization
 * Handles the fundamental lifecycle of the MusicalConductor
 */
import { SPAValidator } from "../../SPAValidator.js";
import { isDevEnv } from "../environment/ConductorEnv.js";
export class ConductorCore {
    static instance = null;
    eventBus;
    spaValidator;
    eventSubscriptions = [];
    beatLoggingInitialized = false;
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.spaValidator = SPAValidator.getInstance();
        void this.initialize();
    }
    /**
     * Get singleton instance of ConductorCore
     * @param eventBus - Required for first initialization
     * @returns ConductorCore instance
     */
    static getInstance(eventBus) {
        if (!ConductorCore.instance) {
            if (!eventBus) {
                throw new Error("EventBus is required for first initialization");
            }
            ConductorCore.instance = new ConductorCore(eventBus);
        }
        return ConductorCore.instance;
    }
    /**
     * Reset the singleton instance (primarily for testing)
     */
    static resetInstance() {
        if (ConductorCore.instance) {
            ConductorCore.instance.cleanup();
            ConductorCore.instance = null;
        }
    }
    /**
     * Get the EventBus instance
     */
    getEventBus() {
        return this.eventBus;
    }
    /**
     * Get the SPAValidator instance
     */
    getSPAValidator() {
        return this.spaValidator;
    }
    /**
     * Initialize core functionality
     */
    async initialize() {
        this.setupBeatExecutionLogging();
        // Initialize nested logger in dev by default
        try {
            // Initialize logger only in development environments (safe across TS/Jest)
            const isDev = isDevEnv();
            if (isDev) {
                const { ConductorLogger } = await import("../monitoring/ConductorLogger.js");
                const logger = new ConductorLogger(this.eventBus, true);
                logger.init();
            }
        }
        catch (e) {
            console.warn("⚠️ ConductorLogger initialization skipped:", e?.message || e);
        }
        console.log("🎼 ConductorCore: Initialized successfully");
    }
    /**
     * Setup beat execution logging with hierarchical support
     */
    setupBeatExecutionLogging() {
        if (this.beatLoggingInitialized) {
            console.log("🎼 Beat execution logging already initialized, skipping...");
            return;
        }
        console.log("🎼 ConductorCore: Setting up beat execution logging...");
        // Subscribe to beat started events for hierarchical logging
        const beatStartedUnsubscribe = this.eventBus.subscribe("musical-conductor:beat:started", (data) => {
            if (this.shouldEnableHierarchicalLogging()) {
                this.logBeatStartedHierarchical(data);
            }
        });
        // Subscribe to beat completed events for hierarchical logging
        const beatCompletedUnsubscribe = this.eventBus.subscribe("musical-conductor:beat:completed", (data) => {
            if (this.shouldEnableHierarchicalLogging()) {
                this.logBeatCompletedHierarchical(data);
            }
        });
        // Subscribe to beat error events for non-hierarchical logging
        const beatErrorUnsubscribe = this.eventBus.subscribe("musical-conductor:beat:error", (data) => {
            if (!this.shouldEnableHierarchicalLogging()) {
                console.error("🎼 Beat execution error:", data);
            }
        });
        // Store unsubscribe functions for cleanup
        this.eventSubscriptions.push(beatStartedUnsubscribe, beatCompletedUnsubscribe, beatErrorUnsubscribe);
        this.beatLoggingInitialized = true;
        console.log("✅ Beat execution logging initialized");
    }
    /**
     * Log beat started event in hierarchical format
     */
    logBeatStartedHierarchical(data) {
        const { sequenceName, movementName, beatNumber, eventType, timing } = data;
        console.log(`🎼 ┌─ Beat ${beatNumber} Started`);
        console.log(`🎼 │  Sequence: ${sequenceName}`);
        console.log(`🎼 │  Movement: ${movementName}`);
        console.log(`🎼 │  Event: ${eventType}`);
        console.log(`🎼 │  Timing: ${timing}`);
        // Log the Data Baton - show payload contents at each beat
        if (data.payload) {
            console.log(`🎽 │  Data Baton:`, data.payload);
        }
    }
    /**
     * Log beat completed event in hierarchical format
     */
    logBeatCompletedHierarchical(data) {
        const { sequenceName, movementName, beatNumber, duration } = data;
        console.log(`🎼 └─ Beat ${beatNumber} Completed`);
        console.log(`🎼    Duration: ${duration}ms`);
        console.log(`🎼    Sequence: ${sequenceName}`);
        console.log(`🎼    Movement: ${movementName}`);
    }
    /**
     * Determine if hierarchical logging should be enabled
     * This can be configured based on environment or settings
     */
    shouldEnableHierarchicalLogging() {
        // For now, return true. This can be made configurable later
        return true;
    }
    /**
     * Cleanup resources and event subscriptions
     */
    cleanup() {
        console.log("🎼 ConductorCore: Cleaning up...");
        // Unsubscribe from all events
        this.eventSubscriptions.forEach((unsubscribe) => {
            try {
                unsubscribe();
            }
            catch (error) {
                console.warn("🎼 Error during event unsubscription:", error);
            }
        });
        this.eventSubscriptions = [];
        this.beatLoggingInitialized = false;
        console.log("✅ ConductorCore: Cleanup completed");
    }
    /**
     * Check if the core is properly initialized
     */
    isInitialized() {
        return (this.beatLoggingInitialized && !!this.eventBus && !!this.spaValidator);
    }
}
//# sourceMappingURL=ConductorCore.js.map