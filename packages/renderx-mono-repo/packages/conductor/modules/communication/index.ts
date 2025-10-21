/**
 * Communication System Exports
 *
 * Central export point for all communication-related components
 * including EventBus, Musical Conductor, and sequence types.
 */

// EventBus exports
export {
  EventBus,
  ConductorEventBus,
  eventBus,
  type EventCallback,
  type UnsubscribeFunction,
  type EventSubscription,
  type EventDebugInfo,
} from "./EventBus.js";

// Event Types exports
export {
  EVENT_TYPES,
  EVENT_CATEGORIES,
  CORE_EVENT_TYPES,
  getEventCategory,
  getEventsByCategory,
  type EventType,
  type EventCategory,
  type CoreEventType,
} from "./event-types/index.js";

// Musical Conductor exports
export { MusicalConductor } from "./sequences/MusicalConductor.js";
export type { ConductorClient } from "./sequences/api/ConductorClient.js";

// Import MusicalConductor and sequences for internal use
import { MusicalConductor } from "./sequences/MusicalConductor.js";
import type { ConductorClient } from "./sequences/api/ConductorClient.js";
import { initializeMusicalSequences } from "./sequences/index.js";
import { eventBus as internalEventBus, ConductorEventBus } from "./EventBus.js";

// Musical Sequences exports
export {
  MusicalSequences,
  ALL_SEQUENCES,
  SEQUENCE_NAMES,
  registerAllSequences,
  initializeMusicalSequences,
  getSequenceByName,
  getSequencesByCategory,
  validateAllSequences,
} from "./sequences/index.js";

// Sequence Types imports for internal use
import { MUSICAL_CONDUCTOR_EVENT_TYPES } from "./sequences/SequenceTypes.js";

// Sequence Types exports
export {
  MUSICAL_DYNAMICS,
  MUSICAL_TIMING,
  SEQUENCE_CATEGORIES,
  MUSICAL_CONDUCTOR_EVENT_TYPES,
  MUSICAL_SEQUENCE_TEMPLATE,
  SEQUENCE_PRIORITIES,
  type MusicalDynamic,
  type MusicalTiming,
  type SequenceCategory,
  type SequenceBeat,
  type SequenceMovement,
  type MusicalSequence,
  type SequenceExecutionContext,
  type ConductorStatistics,
  type SequenceRequest,
  type SequencePriority,
  type MusicalConductorEventType,
} from "./sequences/SequenceTypes.js";

// Track if communication system has been initialized to prevent duplicate initialization
let communicationSystemInitialized = false;
let communicationSystemInstance: {
  eventBus: ConductorEventBus;
  conductor: ConductorClient;
  sequenceResults: ReturnType<typeof initializeMusicalSequences>;
} | null = null;

/**
 * Reset communication system state (for testing/cleanup)
 * This allows re-initialization if needed
 */
export function resetCommunicationSystem(): void {
  communicationSystemInitialized = false;
  communicationSystemInstance = null;
  MusicalConductor.resetInstance();
  console.log("🔄 Communication system state reset");
}

/**
 * Initialize Communication System
 * Sets up the EventBus and Musical Conductor integration with all sequences
 * Protected against duplicate initialization for React StrictMode compatibility
 */
export function initializeCommunicationSystem(): {
  eventBus: ConductorEventBus;
  conductor: ConductorClient;
  sequenceResults: ReturnType<typeof initializeMusicalSequences>;
} {
  // Return existing instance if already initialized (React StrictMode protection)
  if (communicationSystemInitialized && communicationSystemInstance) {
    console.log(
      "🎼 Communication System already initialized, returning existing instance..."
    );
    return communicationSystemInstance;
  }

  console.log("🎼 Initializing RenderX Evolution Communication System...");

  // Get singleton musical conductor instance with the internal eventBus
  const conductor = MusicalConductor.getInstance(internalEventBus);

  // Connect eventBus to the conductor for unified sequence system
  (internalEventBus as ConductorEventBus).connectToMainConductor(conductor);

  // Beat execution logging is now handled by the Musical Conductor singleton

  // Initialize and register all musical sequences
  const sequenceResults = initializeMusicalSequences(conductor);

  console.log("✅ Communication System initialized successfully");
  console.log(
    `🎼 Registered ${sequenceResults.registeredSequences} musical sequences`
  );

  if (sequenceResults.validationResults.invalid.length > 0) {
    console.warn(
      "⚠️ Some sequences have validation issues:",
      sequenceResults.validationResults.invalid
    );
  }

  // Store instance and mark as initialized
  communicationSystemInstance = {
    eventBus: internalEventBus as ConductorEventBus,
    conductor: conductor as unknown as ConductorClient,
    sequenceResults,
  };
  communicationSystemInitialized = true;

  return communicationSystemInstance;
}

/**
 * Communication System Status
 * Provides status information about the communication system
 */
export function getCommunicationSystemStatus(): {
  eventBus: {
    debugInfo: any;
    metrics: any;
  };
  conductor: {
    statistics: any;
    queueStatus: any;
    sequenceCount: number;
  };
} {
  // Use singleton instance if available, otherwise create temporary instance for status
  const conductor = MusicalConductor.getInstance(internalEventBus);

  return {
    eventBus: {
      debugInfo: internalEventBus.getDebugInfo(),
      metrics: (internalEventBus as ConductorEventBus).getMetrics(),
    },
    conductor: {
      statistics: conductor.getStatistics(),
      queueStatus: conductor.getQueueStatus(),
      sequenceCount: conductor.getSequenceNames().length,
    },
  };
}
