/**
 * Musical Sequences Index
 *
 * Central registration point for all musical sequences in RenderX Evolution.
 * Follows the anti-pattern resolution strategy for proper sequence architecture.
 *
 * This file registers all sequences with the main conductor and provides
 * convenience functions following the established pattern.
 */

import { MusicalConductor } from "./MusicalConductor.js";
import { MusicalSequence } from "./SequenceTypes.js";

/**
 * All Musical Sequences Registry
 * Complete list of all sequences available in the system
 */
export const ALL_SEQUENCES: MusicalSequence[] = [
  // Canvas sequences now handled by dynamic symphony plugins
];

/**
 * Sequence Name Mapping
 * Maps sequence names to their definitions for easy lookup
 */
export const SEQUENCE_NAMES = {
  // Canvas sequences now handled by dynamic symphony plugins
} as const;

/**
 * Musical Sequences API
 * Convenience functions for starting sequences following the anti-pattern resolution strategy
 *
 * Usage Pattern (Replaces Direct Emissions):
 * Instead of: eventBus.emit('event-name', data);
 * Use: MusicalSequences.startEventFlow(eventBus, data);
 */
export const MusicalSequences = {
  // Canvas sequences now handled by dynamic symphony plugins

  /**
   * Generic sequence starter for custom sequences
   * @param conductorEventBus - The conductor event bus instance
   * @param sequenceName - Name of the sequence to start
   * @param data - Data to pass to the sequence
   * @param priority - Sequence priority level
   * @returns Sequence execution ID
   */
  startCustomSequence: (
    conductorEventBus: any,
    sequenceName: string,
    data: Record<string, any> = {},
    priority: "HIGH" | "NORMAL" | "CHAINED" = "NORMAL"
  ): string => {
    return conductorEventBus.startSequence(
      sequenceName,
      {
        ...data,
        timestamp: Date.now(),
        sequenceId: `custom-${sequenceName}-${Date.now()}`,
        context: {
          source: "custom-sequence",
          operation: "generic-start",
          phase: "initialization",
        },
      },
      priority
    );
  },
};

/**
 * Register All Sequences with Conductor
 * Registers all sequences with the main musical conductor
 *
 * @param conductor - The musical conductor instance
 */
export function registerAllSequences(conductor: MusicalConductor): void {
  console.log("🎼 Registering all musical sequences with conductor...");

  let registeredCount = 0;
  let failedCount = 0;

  for (const sequence of ALL_SEQUENCES) {
    try {
      conductor.registerSequence(sequence);
      registeredCount++;
      console.log(`✅ Registered sequence: ${sequence.name}`);
    } catch (error) {
      failedCount++;
      console.error(`❌ Failed to register sequence: ${sequence.name}`, error);
    }
  }

  console.log(
    `🎼 Sequence registration complete: ${registeredCount} registered, ${failedCount} failed`
  );

  // Log sequence categories for debugging
  const categories = new Set(ALL_SEQUENCES.map((seq) => seq.category));
  console.log(`📊 Sequence categories: ${Array.from(categories).join(", ")}`);
}

/**
 * Get Sequence by Name
 * Utility function to get a sequence definition by name
 *
 * @param sequenceName - Name of the sequence to find
 * @returns Sequence definition or undefined
 */
export function getSequenceByName(sequenceName: string) {
  return ALL_SEQUENCES.find((seq) => seq.name === sequenceName);
}

/**
 * Get Sequences by Category
 * Utility function to get all sequences in a specific category
 *
 * @param category - Sequence category to filter by
 * @returns Array of sequences in the category
 */
export function getSequencesByCategory(category: string) {
  return ALL_SEQUENCES.filter((seq) => seq.category === category);
}

/**
 * Validate All Sequences
 * Validates all sequence definitions for completeness and correctness
 *
 * @returns Validation results
 */
export function validateAllSequences(): {
  valid: string[];
  invalid: Array<{ name: string; errors: string[] }>;
} {
  const valid: string[] = [];
  const invalid: Array<{ name: string; errors: string[] }> = [];

  for (const sequence of ALL_SEQUENCES) {
    const errors: string[] = [];

    // Basic validation
    if (!sequence.name) errors.push("Missing sequence name");
    if (!sequence.description) errors.push("Missing sequence description");
    if (!sequence.movements || sequence.movements.length === 0) {
      errors.push("Missing movements");
    }

    // Movement validation
    sequence.movements?.forEach((movement, movementIndex) => {
      if (!movement.name)
        errors.push(`Movement ${movementIndex}: Missing name`);
      if (!movement.beats || movement.beats.length === 0) {
        errors.push(`Movement ${movementIndex}: Missing beats`);
      }

      // Beat validation
      movement.beats?.forEach((beat, beatIndex) => {
        if (!beat.event)
          errors.push(
            `Movement ${movementIndex}, Beat ${beatIndex}: Missing event`
          );
        if (!beat.dynamics)
          errors.push(
            `Movement ${movementIndex}, Beat ${beatIndex}: Missing dynamics`
          );
      });
    });

    if (errors.length === 0) {
      valid.push(sequence.name);
    } else {
      invalid.push({ name: sequence.name, errors });
    }
  }

  return { valid, invalid };
}

/**
 * Initialize Musical Sequences System
 * Complete initialization of the musical sequences system
 *
 * @param conductor - The musical conductor instance
 * @returns Initialization results
 */
export function initializeMusicalSequences(conductor: MusicalConductor): {
  success: boolean;
  registeredSequences: number;
  validationResults: ReturnType<typeof validateAllSequences>;
} {
  console.log("🎼 Initializing Musical Sequences System...");

  // Validate all sequences first
  const validationResults = validateAllSequences();

  if (validationResults.invalid.length > 0) {
    console.warn(
      "⚠️ Some sequences have validation errors:",
      validationResults.invalid
    );
  }

  // Register all valid sequences
  registerAllSequences(conductor);

  // Canvas handlers now registered by dynamic symphony plugins

  const registeredSequences = conductor.getSequenceNames().length;
  const success = registeredSequences > 0;

  console.log(
    `🎼 Musical Sequences System initialized: ${success ? "SUCCESS" : "FAILED"}`
  );
  console.log(`📊 Total sequences registered: ${registeredSequences}`);

  return {
    success,
    registeredSequences,
    validationResults,
  };
}
