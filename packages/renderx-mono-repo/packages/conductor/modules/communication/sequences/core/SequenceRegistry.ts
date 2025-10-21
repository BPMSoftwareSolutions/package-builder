/**
 * SequenceRegistry - Manages registration and retrieval of musical sequences
 * Provides a centralized registry for all musical sequences
 */

import { EventBus } from "../../EventBus.js";
import type { MusicalSequence } from "../SequenceTypes.js";
import { MUSICAL_CONDUCTOR_EVENT_TYPES } from "../SequenceTypes.js";
import { EventSubscriptionManager } from "./EventSubscriptionManager.js";

export class SequenceRegistry {
  private sequences: Map<string, MusicalSequence> = new Map();
  private eventBus: EventBus;
  private eventSubscriptionManager: EventSubscriptionManager | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Set the EventSubscriptionManager for SPA-compliant event emission
   * @param eventSubscriptionManager - The EventSubscriptionManager instance
   */
  setEventSubscriptionManager(
    eventSubscriptionManager: EventSubscriptionManager
  ): void {
    this.eventSubscriptionManager = eventSubscriptionManager;
  }

  /**
   * Register a musical sequence
   * @param sequence - The sequence to register
   */
  register(sequence: MusicalSequence): void {
    if (!sequence) {
      throw new Error("Sequence cannot be null or undefined");
    }

    if (!sequence.id) {
      throw new Error("Sequence must have an id");
    }

    if (!sequence.name) {
      throw new Error("Sequence must have a name");
    }

    // Validate sequence structure
    this.validateSequence(sequence);

    this.sequences.set(sequence.id, sequence);
    console.log(
      `🎼 SequenceRegistry: Registered sequence "${sequence.name}" (id: ${sequence.id})`
    );

    // Emit registration event using EventSubscriptionManager for SPA compliance
    if (this.eventSubscriptionManager) {
      this.eventSubscriptionManager.emit(
        MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_REGISTERED,
        {
          sequenceId: sequence.id,
          sequenceName: sequence.name,
          category: sequence.category,
        },
        "SequenceRegistry"
      );
    } else {
      // Fallback to direct eventBus.emit() for backward compatibility
      // This should only happen during initialization before EventSubscriptionManager is set
      console.warn(
        "🎼 SequenceRegistry: EventSubscriptionManager not set, using direct eventBus.emit()"
      );
      this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_REGISTERED, {
        sequenceId: sequence.id,
        sequenceName: sequence.name,
        category: sequence.category,
      });
    }
  }

  /**
   * Unregister a sequence by id
   * @param sequenceId - ID of the sequence to unregister
   */
  unregister(sequenceId: string): void {
    if (!sequenceId) {
      throw new Error("Sequence ID is required");
    }

    const sequence = this.sequences.get(sequenceId);
    if (sequence) {
      this.sequences.delete(sequenceId);
      console.log(
        `🎼 SequenceRegistry: Unregistered sequence "${sequence.name}" (id: ${sequenceId})`
      );

      // Emit unregistration event using EventSubscriptionManager for SPA compliance
      if (this.eventSubscriptionManager) {
        this.eventSubscriptionManager.emit(
          MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_UNREGISTERED,
          {
            sequenceId,
            sequenceName: sequence.name,
          },
          "SequenceRegistry"
        );
      } else {
        // Fallback to direct eventBus.emit() for backward compatibility
        console.warn(
          "🎼 SequenceRegistry: EventSubscriptionManager not set, using direct eventBus.emit()"
        );
        this.eventBus.emit(
          MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_UNREGISTERED,
          {
            sequenceId,
            sequenceName: sequence.name,
          }
        );
      }
    } else {
      console.warn(
        `🎼 SequenceRegistry: Sequence with ID "${sequenceId}" not found for unregistration`
      );
    }
  }

  /**
   * Expose the underlying registry map for conductor integration
   * Note: Returned map is live; mutations occur through register/unregister
   */
  public getSequenceMap(): Map<string, MusicalSequence> {
    return this.sequences;
  }

  /**
   * Get a sequence by id
   * @param sequenceId - ID of the sequence to retrieve
   * @returns The sequence or undefined if not found
   */
  get(sequenceId: string): MusicalSequence | undefined {
    if (!sequenceId) {
      return undefined;
    }
    return this.sequences.get(sequenceId);
  }

  /**
   * Get all registered sequences
   * @returns Array of all registered sequences
   */
  getAll(): MusicalSequence[] {
    return Array.from(this.sequences.values());
  }

  /**
   * Get all sequence IDs
   * @returns Array of sequence IDs
   */
  getIds(): string[] {
    return Array.from(this.sequences.keys());
  }

  /**
   * Get all sequence names
   * @returns Array of sequence names
   */
  getNames(): string[] {
    return Array.from(this.sequences.values()).map((seq) => seq.name);
  }

  /**
   * Check if a sequence is registered
   * @param sequenceId - ID of the sequence to check
   * @returns True if the sequence is registered
   */
  has(sequenceId: string): boolean {
    if (!sequenceId) {
      return false;
    }
    return this.sequences.has(sequenceId);
  }

  /**
   * Get the number of registered sequences
   * @returns Number of registered sequences
   */
  size(): number {
    return this.sequences.size;
  }

  /**
   * Clear all registered sequences
   */
  clear(): void {
    const sequences = this.getAll();
    this.sequences.clear();

    console.log(`🎼 SequenceRegistry: Cleared ${sequences.length} sequences`);

    // Emit individual unregistration events for each cleared sequence using EventSubscriptionManager for SPA compliance
    sequences.forEach((sequence) => {
      if (this.eventSubscriptionManager) {
        this.eventSubscriptionManager.emit(
          MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_UNREGISTERED,
          {
            sequenceId: sequence.id,
            sequenceName: sequence.name,
          },
          "SequenceRegistry"
        );
      } else {
        // Fallback to direct eventBus.emit() for backward compatibility
        console.warn(
          "🎼 SequenceRegistry: EventSubscriptionManager not set, using direct eventBus.emit()"
        );
        this.eventBus.emit(
          MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_UNREGISTERED,
          {
            sequenceId: sequence.id,
            sequenceName: sequence.name,
          }
        );
      }
    });
  }

  /**
   * Get sequences by category
   * @param category - The category to filter by
   * @returns Array of sequences in the specified category
   */
  getByCategory(category: string): MusicalSequence[] {
    if (!category) {
      return [];
    }

    return this.getAll().filter((sequence) => sequence.category === category);
  }

  /**
   * Find a sequence by name (for backward compatibility)
   * @param sequenceName - Name of the sequence to find
   * @returns The sequence or undefined if not found
   */
  findByName(sequenceName: string): MusicalSequence | undefined {
    if (!sequenceName) {
      return undefined;
    }
    return this.getAll().find((sequence) => sequence.name === sequenceName);
  }

  /**
   * Validate sequence structure
   * @param sequence - The sequence to validate
   */
  private validateSequence(sequence: MusicalSequence): void {
    // Basic structure validation
    if (!sequence.movements || !Array.isArray(sequence.movements)) {
      throw new Error(
        `Sequence "${sequence.name}" (id: ${sequence.id}) must have a movements array`
      );
    }

    if (sequence.movements.length === 0) {
      throw new Error(
        `Sequence "${sequence.name}" (id: ${sequence.id}) must have at least one movement`
      );
    }

    // Validate each movement
    sequence.movements.forEach((movement, index) => {
      if (!movement.id) {
        throw new Error(
          `Movement ${index} in sequence "${sequence.name}" (id: ${sequence.id}) must have an id`
        );
      }

      if (!movement.name) {
        throw new Error(
          `Movement ${index} in sequence "${sequence.name}" (id: ${sequence.id}) must have a name`
        );
      }

      if (!movement.beats || !Array.isArray(movement.beats)) {
        throw new Error(
          `Movement "${movement.name}" in sequence "${sequence.name}" must have a beats array`
        );
      }

      if (movement.beats.length === 0) {
        throw new Error(
          `Movement "${movement.name}" in sequence "${sequence.name}" must have at least one beat`
        );
      }

      // Validate each beat
      movement.beats.forEach((beat, beatIndex) => {
        if (typeof beat.beat !== "number" || beat.beat < 1) {
          throw new Error(
            `Beat ${beatIndex} in movement "${movement.name}" must have a valid beat number (>= 1)`
          );
        }

        if (!beat.event || typeof beat.event !== "string") {
          throw new Error(
            `Beat ${beatIndex} in movement "${movement.name}" must have a valid event name`
          );
        }

        if (!beat.dynamics) {
          throw new Error(
            `Beat ${beatIndex} in movement "${movement.name}" must have dynamics specified`
          );
        }
      });
    });

    console.log(
      `✅ SequenceRegistry: Sequence "${sequence.name}" validation passed`
    );
  }

  /**
   * Get registry statistics
   * @returns Statistics about the registry
   */
  getStatistics(): {
    totalSequences: number;
    sequencesByCategory: Record<string, number>;
    totalMovements: number;
    totalBeats: number;
  } {
    const sequences = this.getAll();
    const sequencesByCategory: Record<string, number> = {};
    let totalMovements = 0;
    let totalBeats = 0;

    sequences.forEach((sequence) => {
      // Count by category
      const category = sequence.category || "uncategorized";
      sequencesByCategory[category] = (sequencesByCategory[category] || 0) + 1;

      // Count movements and beats
      totalMovements += sequence.movements.length;
      sequence.movements.forEach((movement) => {
        totalBeats += movement.beats.length;
      });
    });

    return {
      totalSequences: sequences.length,
      sequencesByCategory,
      totalMovements,
      totalBeats,
    };
  }
}
