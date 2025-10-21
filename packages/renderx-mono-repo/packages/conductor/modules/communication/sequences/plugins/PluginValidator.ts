/**
 * PluginValidator - Plugin structure validation
 * Validates plugin structure, sequences, and handlers for CIA compliance
 */

import type {
  MusicalSequence,
  SequenceMovement,
  SequenceBeat,
} from "../SequenceTypes.js";

export interface PluginValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PluginValidator {
  /**
   * Validate plugin structure for CIA compliance
   * @param sequence - Musical sequence definition
   * @param handlers - Event handlers
   * @param pluginId - Plugin identifier
   * @returns Validation result
   */
  validatePluginStructure(
    sequence: any,
    handlers: any,
    pluginId: string
  ): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate plugin ID
      if (!pluginId || typeof pluginId !== "string" || pluginId.trim() === "") {
        errors.push("Plugin ID must be a non-empty string");
      }

      // Validate sequence
      const sequenceValidation = this.validateSequence(sequence);
      errors.push(...sequenceValidation.errors);
      warnings.push(...sequenceValidation.warnings);

      // Validate handlers (optional but recommended)
      const handlersValidation = this.validateHandlers(handlers);
      errors.push(...handlersValidation.errors);
      warnings.push(...handlersValidation.warnings);

      // CIA-specific validations
      const ciaValidation = this.validateCIACompliance(sequence, handlers);
      errors.push(...ciaValidation.errors);
      warnings.push(...ciaValidation.warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Validation error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        isValid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Validate musical sequence structure
   * @param sequence - Sequence to validate
   * @returns Validation result
   */
  private validateSequence(sequence: any): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!sequence) {
      errors.push("Sequence is required");
      return { isValid: false, errors, warnings };
    }

    if (typeof sequence !== "object") {
      errors.push("Sequence must be an object");
      return { isValid: false, errors, warnings };
    }

    // Validate required sequence properties
    if (!sequence.name || typeof sequence.name !== "string") {
      errors.push("Sequence must have a valid name (string)");
    }

    if (!sequence.movements || !Array.isArray(sequence.movements)) {
      errors.push("Sequence must have movements array");
    } else if (sequence.movements.length === 0) {
      warnings.push("Sequence has no movements");
    } else {
      // Validate each movement
      sequence.movements.forEach((movement: any, index: number) => {
        const movementValidation = this.validateMovement(movement, index);
        errors.push(...movementValidation.errors);
        warnings.push(...movementValidation.warnings);
      });
    }

    // Optional properties validation
    if (sequence.description && typeof sequence.description !== "string") {
      warnings.push("Sequence description should be a string");
    }

    if (
      sequence.tempo &&
      (typeof sequence.tempo !== "number" || sequence.tempo <= 0)
    ) {
      warnings.push("Sequence tempo should be a positive number");
    }

    if (sequence.key && typeof sequence.key !== "string") {
      warnings.push("Sequence key should be a string");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate movement structure
   * @param movement - Movement to validate
   * @param index - Movement index for error reporting
   * @returns Validation result
   */
  private validateMovement(
    movement: any,
    index: number
  ): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!movement || typeof movement !== "object") {
      errors.push(`Movement ${index} must be an object`);
      return { isValid: false, errors, warnings };
    }

    // Validate required movement properties
    if (!movement.name || typeof movement.name !== "string") {
      errors.push(`Movement ${index} must have a valid name (string)`);
    }

    if (!movement.beats || !Array.isArray(movement.beats)) {
      errors.push(`Movement ${index} must have beats array`);
    } else if (movement.beats.length === 0) {
      warnings.push(`Movement ${index} has no beats`);
    } else {
      // Validate each beat
      movement.beats.forEach((beat: any, beatIndex: number) => {
        const beatValidation = this.validateBeat(beat, index, beatIndex);
        errors.push(...beatValidation.errors);
        warnings.push(...beatValidation.warnings);
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate beat structure
   * @param beat - Beat to validate
   * @param movementIndex - Movement index for error reporting
   * @param beatIndex - Beat index for error reporting
   * @returns Validation result
   */
  private validateBeat(
    beat: any,
    movementIndex: number,
    beatIndex: number
  ): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!beat || typeof beat !== "object") {
      errors.push(
        `Movement ${movementIndex}, Beat ${beatIndex} must be an object`
      );
      return { isValid: false, errors, warnings };
    }

    const beatRef = `Movement ${movementIndex}, Beat ${beatIndex}`;

    // Validate required beat properties
    if (typeof beat.beat !== "number" || beat.beat < 1) {
      errors.push(`${beatRef} must have a valid beat number (>= 1)`);
    }

    if (!beat.event || typeof beat.event !== "string") {
      errors.push(`${beatRef} must have a valid event name (string)`);
    }

    if (!beat.title || typeof beat.title !== "string") {
      errors.push(`${beatRef} must have a valid title (string)`);
    }

    // Validate optional but recommended properties
    if (!beat.dynamics) {
      warnings.push(`${beatRef} missing dynamics property`);
    }

    if (!beat.timing) {
      warnings.push(`${beatRef} missing timing property`);
    }

    if (!beat.errorHandling) {
      warnings.push(`${beatRef} missing errorHandling property`);
    } else if (
      !["continue", "abort-sequence", "retry"].includes(beat.errorHandling)
    ) {
      warnings.push(
        `${beatRef} has invalid errorHandling value: ${beat.errorHandling}`
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate event handlers
   * @param handlers - Handlers to validate
   * @returns Validation result
   */
  private validateHandlers(handlers: any): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!handlers) {
      warnings.push("No handlers provided - plugin may be event-bus driven");
      return { isValid: true, errors, warnings };
    }

    if (typeof handlers !== "object") {
      errors.push("Handlers must be an object");
      return { isValid: false, errors, warnings };
    }

    // Validate handler functions
    Object.entries(handlers).forEach(([eventName, handler]) => {
      if (typeof handler !== "function") {
        errors.push(`Handler for event '${eventName}' must be a function`);
      }
    });

    if (Object.keys(handlers).length === 0) {
      warnings.push("Handlers object is empty");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate CIA (Conductor Integration Architecture) compliance
   * @param sequence - Sequence to validate
   * @param handlers - Handlers to validate
   * @returns Validation result
   */
  private validateCIACompliance(
    sequence: any,
    handlers: any
  ): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // CIA-specific validations
    if (sequence) {
      // Check for CIA-recommended properties
      if (!sequence.description) {
        warnings.push("CIA recommendation: Sequence should have a description");
      }

      if (!sequence.version) {
        warnings.push("CIA recommendation: Sequence should have a version");
      }

      // Validate event naming conventions
      if (sequence.movements) {
        sequence.movements.forEach((movement: any, movementIndex: number) => {
          if (movement.beats) {
            movement.beats.forEach((beat: any, beatIndex: number) => {
              if (beat.event) {
                // Check for CIA event naming conventions
                if (!beat.event.includes("-") && !beat.event.includes(".")) {
                  warnings.push(
                    `CIA recommendation: Event '${beat.event}' should use kebab-case or dot notation`
                  );
                }
              }
            });
          }
        });
      }
    }

    // Validate SPA compliance
    if (handlers) {
      const handlerNames = Object.keys(handlers);
      if (handlerNames.length > 0) {
        // Check for potential memory leaks
        handlerNames.forEach((eventName) => {
          if (
            eventName.toLowerCase().includes("window") ||
            eventName.toLowerCase().includes("document")
          ) {
            warnings.push(
              `CIA warning: Handler '${eventName}' may cause memory leaks in SPA environment`
            );
          }
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate plugin metadata
   * @param metadata - Plugin metadata to validate
   * @returns Validation result
   */
  validateMetadata(metadata: any): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!metadata) {
      warnings.push("No metadata provided");
      return { isValid: true, errors, warnings };
    }

    if (typeof metadata !== "object") {
      errors.push("Metadata must be an object");
      return { isValid: false, errors, warnings };
    }

    // Validate recommended metadata properties
    if (!metadata.version) {
      warnings.push("Metadata should include version");
    } else if (typeof metadata.version !== "string") {
      warnings.push("Metadata version should be a string");
    }

    if (!metadata.description) {
      warnings.push("Metadata should include description");
    } else if (typeof metadata.description !== "string") {
      warnings.push("Metadata description should be a string");
    }

    if (metadata.author && typeof metadata.author !== "string") {
      warnings.push("Metadata author should be a string");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}
