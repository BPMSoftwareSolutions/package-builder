/**
 * Musical Sequence Types and Constants (TypeScript)
 *
 * Defines the structure and types for musical sequences in the RenderX system.
 * Provides type safety and standardized interfaces for sequence orchestration.
 */

// Re-export EVENT_TYPES from the event-types module for convenience
export { EVENT_TYPES, type EventType } from "../event-types/index.js";

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
} as const;

export type MusicalDynamic =
  (typeof MUSICAL_DYNAMICS)[keyof typeof MUSICAL_DYNAMICS];

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
} as const;

export type MusicalTiming =
  (typeof MUSICAL_TIMING)[keyof typeof MUSICAL_TIMING];

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
} as const;

export type SequenceCategory =
  (typeof SEQUENCE_CATEGORIES)[keyof typeof SEQUENCE_CATEGORIES];

/**
 * Beat Definition Interface
 * Represents a single beat (event) within a musical sequence movement
 */
export interface SequenceBeat {
  beat: number; // Beat number (1-based)
  event: string; // Event type to emit
  title?: string; // Human-readable title for the beat
  description?: string; // Detailed description of what this beat does
  dynamics: MusicalDynamic; // Volume/priority level
  timing?: MusicalTiming; // When to execute this beat
  data?: Record<string, any>; // Data to pass with the event
  dependencies?: string[]; // Events this beat depends on
  errorHandling?: "continue" | "abort-sequence" | "retry" | "abort"; // Error handling strategy ("abort" alias supported)
}

/**
 * Movement Definition Interface
 * Represents a movement (group of related beats) within a musical sequence
 */
export interface SequenceMovement {
  id: string; // Unique movement identifier
  name: string; // Movement name
  description?: string; // Movement description
  beats: SequenceBeat[]; // Array of beats in this movement
  tempo?: number; // BPM override for this movement
  errorHandling?: "continue" | "abort-sequence"; // Movement-level error handling
}

/**
 * Musical Sequence Definition Interface
 * Complete definition of a musical sequence
 */
export interface MusicalSequence {
  id: string; // Unique sequence identifier
  name: string; // Unique sequence name
  description: string; // Purpose and behavior description
  key: string; // Musical key (organizational)
  tempo: number; // BPM (beats per minute)
  timeSignature?: string; // Time signature (organizational)
  category: SequenceCategory; // Sequence category
  movements: SequenceMovement[]; // Array of movements
  metadata?: {
    // Optional metadata
    version?: string;
    author?: string;
    created?: Date;
    tags?: string[];
  };
}

/**
 * Sequence Execution Context
 * Runtime context for executing a musical sequence
 */
export interface SequenceExecutionContext {
  id: string; // Unique execution ID
  sequenceId: string; // ID of the sequence being executed
  sequenceName: string; // Name of the sequence being executed (for display/logging)
  sequence: MusicalSequence; // The sequence definition
  data: Record<string, any>; // Execution data
  payload: Record<string, any>; // 🎽 Data Baton - shared payload passed between beats
  startTime: number; // Execution start timestamp
  currentMovement: number; // Current movement index
  currentBeat: number; // Current beat number
  completedBeats: number[]; // Array of completed beat numbers
  errors: Array<{
    // Array of execution errors
    beat: number;
    error: string;
    timestamp: number;
  }>;
  priority: "HIGH" | "NORMAL" | "CHAINED"; // Execution priority
  executionType: "IMMEDIATE" | "CONSECUTIVE"; // Whether this sequence executed immediately or was queued
  queuedAt?: number; // When this was queued (for queue management)
}

/**
 * Conductor Statistics Interface
 * Statistics and metrics for the musical conductor
 */
export interface ConductorStatistics {
  totalSequencesExecuted: number;
  totalBeatsExecuted: number;
  averageExecutionTime: number;
  errorCount: number;
  lastExecutionTime: number | null;
  totalSequencesQueued: number;
  maxQueueLength: number;
  currentQueueLength: number;
  averageQueueWaitTime: number;
  sequenceCompletionRate: number;
  chainedSequences: number;
  successRate: number;
}

/**
 * Sequence Request Interface
 * Request object for starting a sequence
 */
export interface SequenceRequest {
  sequenceId: string;
  sequenceName: string; // For display/logging purposes
  data: Record<string, any>;
  priority: "HIGH" | "NORMAL" | "CHAINED";
  requestId: string;
  queuedAt: number;
}

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
} as const;

export type MusicalConductorEventType =
  (typeof MUSICAL_CONDUCTOR_EVENT_TYPES)[keyof typeof MUSICAL_CONDUCTOR_EVENT_TYPES];

/**
 * Default Musical Sequence Template
 * Template for creating new musical sequences
 */
export const MUSICAL_SEQUENCE_TEMPLATE: MusicalSequence = {
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
          event:
            "template-event" /* handlers listen/subscribe to events/beats via the conductor */,
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
} as const;

export type SequencePriority =
  (typeof SEQUENCE_PRIORITIES)[keyof typeof SEQUENCE_PRIORITIES];
