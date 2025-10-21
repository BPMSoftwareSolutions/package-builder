/**
 * Musical Sequence Types and Constants (TypeScript)
 *
 * Defines the structure and types for musical sequences in the RenderX system.
 * Provides type safety and standardized interfaces for sequence orchestration.
 */
// Re-export EVENT_TYPES from the event-types module for convenience
export { EVENT_TYPES } from "../event-types/index.js";
/**
 * Musical Dynamics - Volume/Intensity levels for sequence events
 * Used to indicate the priority and intensity of sequence events
 */
export const MUSICAL_DYNAMICS = {
    PIANISSIMO: "pp", // Very soft - lowest priority
    PIANO: "p", // Soft - low priority
    MEZZO_PIANO: "mp", // Medium soft - medium-low priority
    MEZZO_FORTE: "mf", // Medium loud - medium priority
    FORTE: "f", // Loud - high priority
    FORTISSIMO: "ff", // Very loud - highest priority
};
/**
 * Musical Timing - When events should be executed in the sequence
 * Controls the timing and coordination of sequence events
 */
export const MUSICAL_TIMING = {
    IMMEDIATE: "immediate", // Execute immediately when beat is reached
    AFTER_BEAT: "after-beat", // Execute after dependencies complete
    DELAYED: "delayed", // Execute with intentional delay
    SYNCHRONIZED: "synchronized", // Execute synchronized with other events
    ON_BEAT: "on-beat", // Execute exactly on the next musical beat
};
/**
 * Sequence Categories - Organizational categories for sequences
 */
export const SEQUENCE_CATEGORIES = {
    COMPONENT_UI: "component-ui", // UI component interactions
    CANVAS_OPERATIONS: "canvas-operations", // Canvas manipulation
    DATA_FLOW: "data-flow", // Data processing and flow
    SYSTEM: "system", // System sequences (alias for tests)
    SYSTEM_EVENTS: "system-events", // System-level events
    USER_INTERACTIONS: "user-interactions", // User input handling
    INTEGRATION: "integration", // External integrations
    PERFORMANCE: "performance", // Performance testing sequences
    LAYOUT: "layout", // Layout-related sequences
};
/**
 * Musical Conductor Event Types
 * Events related to musical sequence conductor and orchestration
 */
export const MUSICAL_CONDUCTOR_EVENT_TYPES = {
    // Conductor Lifecycle
    CONDUCTOR_INITIALIZED: "conductor-initialized",
    CONDUCTOR_DESTROYED: "conductor-destroyed",
    CONDUCTOR_RESET: "conductor-reset",
    // Sequence Management
    SEQUENCE_DEFINED: "sequence-defined",
    SEQUENCE_UNDEFINED: "sequence-undefined",
    SEQUENCE_REGISTERED: "sequence-registered",
    SEQUENCE_UNREGISTERED: "sequence-unregistered",
    // Sequence Execution
    SEQUENCE_STARTED: "sequence-started",
    SEQUENCE_COMPLETED: "sequence-completed",
    SEQUENCE_FAILED: "sequence-failed",
    SEQUENCE_CANCELLED: "sequence-cancelled",
    SEQUENCE_PAUSED: "sequence-paused",
    SEQUENCE_RESUMED: "sequence-resumed",
    // Beat Execution
    BEAT_STARTED: "beat-started",
    BEAT_COMPLETED: "beat-completed",
    BEAT_FAILED: "beat-failed",
    // Movement Execution
    MOVEMENT_STARTED: "movement-started",
    MOVEMENT_COMPLETED: "movement-completed",
    MOVEMENT_FAILED: "movement-failed",
    // Queue Management
    SEQUENCE_QUEUED: "sequence-queued",
    SEQUENCE_DEQUEUED: "sequence-dequeued",
    QUEUE_PROCESSED: "queue-processed",
    // Statistics
    STATISTICS_UPDATED: "statistics-updated",
};
/**
 * Default Musical Sequence Template
 * Template for creating new musical sequences
 */
export const MUSICAL_SEQUENCE_TEMPLATE = {
    id: "template-sequence",
    name: "Template Sequence",
    description: "Template for creating new musical sequences",
    key: "C Major",
    tempo: 120,
    timeSignature: "4/4",
    category: SEQUENCE_CATEGORIES.COMPONENT_UI,
    movements: [
        {
            id: "template-movement",
            name: "Template Movement",
            description: "Template movement with example beats",
            beats: [
                {
                    beat: 1,
                    event: "template-event" /* handlers listen/subscribe to events/beats via the conductor */,
                    title: "Template Beat",
                    description: "Example beat for template",
                    dynamics: MUSICAL_DYNAMICS.MEZZO_FORTE,
                    timing: MUSICAL_TIMING.IMMEDIATE,
                    data: {},
                    errorHandling: "continue",
                },
            ],
        },
    ],
    metadata: {
        version: "1.0.0",
        author: "RenderX System",
        created: new Date(),
        tags: ["template", "example"],
    },
};
/**
 * Priority Levels for Sequence Execution
 */
export const SEQUENCE_PRIORITIES = {
    HIGH: "HIGH", // Execute immediately, bypass queue
    NORMAL: "NORMAL", // Normal queue processing
    CHAINED: "CHAINED", // Execute after current sequence completes
};
//# sourceMappingURL=SequenceTypes.js.map