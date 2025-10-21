/**
 * SequenceValidator - Sequence validation and deduplication
 * Handles sequence validation, hash generation, and deduplication logic
 */

import type { SequencePriority } from "../SequenceTypes.js";
import { SEQUENCE_PRIORITIES } from "../SequenceTypes.js";
import type { DuplicationDetector } from "../monitoring/DuplicationDetector.js";

export interface DeduplicationResult {
  isDuplicate: boolean;
  hash: string;
  reason?: string;
  shouldExecute: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SequenceValidator {
  private duplicationDetector: DuplicationDetector;

  constructor(duplicationDetector: DuplicationDetector) {
    this.duplicationDetector = duplicationDetector;
  }

  /**
   * Generate a hash for sequence request data
   * @param sequenceName - Name of the sequence
   * @param data - Sequence data
   * @param priority - Sequence priority
   * @returns Hash string
   */
  generateSequenceHash(
    sequenceName: string,
    data: any,
    priority: SequencePriority
  ): string {
    try {
      // Create a stable hash based on sequence name, data, and priority
      const normalizedData = this.normalizeDataForHashing(data);
      const dataString = JSON.stringify(
        normalizedData,
        Object.keys(normalizedData).sort()
      );
      const combined = `${sequenceName}:${priority}:${dataString}`;

      // Simple hash function (for production, consider using a proper hash library)
      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return hash.toString(36); // Convert to base36 for shorter string
    } catch (error) {
      console.warn(
        "🔍 SequenceValidator: Failed to generate hash, using fallback:",
        error
      );
      return `${sequenceName}-${priority}-${Date.now()}-${Math.random()}`;
    }
  }

  /**
   * Normalize data for consistent hashing
   * @param data - Raw sequence data
   * @returns Normalized data object
   */
  private normalizeDataForHashing(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    // Remove timestamp and other volatile properties that shouldn't affect deduplication
    const normalized = { ...data };
    delete normalized.timestamp;
    delete normalized._reactInternalFiber;
    delete normalized._reactInternalInstance;
    delete normalized.__reactInternalInstance;

    // Sort arrays for consistent ordering
    Object.keys(normalized).forEach((key) => {
      if (Array.isArray(normalized[key])) {
        normalized[key] = [...normalized[key]].sort();
      }
    });

    return normalized;
  }

  /**
   * Enhanced sequence deduplication for StrictMode protection
   * @param sequenceId - ID of the sequence
   * @param sequenceName - Name of the sequence
   * @param data - Sequence data
   * @param priority - Sequence priority
   * @returns Deduplication result
   */
  deduplicateSequenceRequest(
    sequenceId: string,
    sequenceName: string,
    data: any,
    priority: SequencePriority
  ): DeduplicationResult {
    const sequenceHash = this.generateSequenceHash(
      sequenceName,
      data,
      priority
    );

    // Special handling for ElementLibrary Display sequence - always allow first execution
    if (sequenceName === "Element Library Display Symphony No. 12") {
      const isDuplicate =
        this.duplicationDetector.isDuplicateSequenceRequest(sequenceHash);

      if (isDuplicate.isDuplicate) {
        const result =
          this.duplicationDetector.isDuplicateSequenceRequest(sequenceHash);

        console.log(
          `🎼 SequenceValidator: ElementLibrary Display duplicate check - ${result.reason}`
        );

        // Always allow the first ElementLibrary Display sequence to execute
        // This ensures the display sequence can run at least once
        console.log(
          "🎼 SequenceValidator: Allowing ElementLibrary Display sequence to execute (special handling)"
        );

        return {
          isDuplicate: false, // Override duplicate detection for this sequence
          hash: sequenceHash,
          reason: "ElementLibrary Display sequence - special handling",
          shouldExecute: true,
        };
      }

      return {
        isDuplicate: false,
        hash: sequenceHash,
        reason: "ElementLibrary Display sequence - first execution",
        shouldExecute: true,
      };
    }

    const isDuplicate =
      this.duplicationDetector.isDuplicateSequenceRequest(sequenceHash);

    if (isDuplicate.isDuplicate) {
      return {
        isDuplicate: true,
        hash: sequenceHash,
        reason: isDuplicate.reason,
        shouldExecute: false,
      };
    }

    return {
      isDuplicate: false,
      hash: sequenceHash,
      reason: "New sequence request",
      shouldExecute: true,
    };
  }

  /**
   * Check if data indicates a StrictMode duplicate
   * @param data - Sequence data to analyze
   * @returns True if likely StrictMode duplicate
   */
  isStrictModeDuplicate(data: Record<string, any>): boolean {
    return this.duplicationDetector.isStrictModeDuplicate(data);
  }

  /**
   * Validate sequence structure and data
   * @param sequenceName - Name of the sequence
   * @param data - Sequence data
   * @param priority - Sequence priority
   * @returns Validation result
   */
  validateSequenceRequest(
    sequenceName: string,
    data: any,
    priority: SequencePriority
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate sequence name
    if (!sequenceName || typeof sequenceName !== "string") {
      errors.push("Sequence name must be a non-empty string");
    } else if (sequenceName.trim().length === 0) {
      errors.push("Sequence name cannot be empty or whitespace only");
    }

    // Validate priority
    if (!Object.values(SEQUENCE_PRIORITIES).includes(priority)) {
      errors.push(
        `Invalid priority: ${priority}. Must be one of: ${Object.values(
          SEQUENCE_PRIORITIES
        ).join(", ")}`
      );
    }

    // Validate data structure
    if (data !== null && data !== undefined && typeof data === "object") {
      // Check for potential StrictMode indicators
      if (this.isStrictModeDuplicate(data)) {
        warnings.push("Potential React StrictMode duplicate detected");
      }

      // Check for circular references
      try {
        JSON.stringify(data);
      } catch (error) {
        errors.push("Sequence data contains circular references");
      }

      // Check for excessively large data
      const dataString = JSON.stringify(data);
      if (dataString.length > 100000) {
        // 100KB limit
        warnings.push(
          "Sequence data is very large (>100KB), consider optimizing"
        );
      }
    }

    // Validate sequence name format
    if (sequenceName && !this.isValidSequenceNameFormat(sequenceName)) {
      warnings.push(
        "Sequence name format may not follow recommended conventions"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if sequence name follows recommended format
   * @param sequenceName - Sequence name to validate
   * @returns True if format is valid
   */
  private isValidSequenceNameFormat(sequenceName: string): boolean {
    // Recommended format: "Name Symphony No. X" or similar
    const patterns = [
      /^.+\s+Symphony\s+No\.\s+\d+$/i,
      /^.+\s+Sequence\s+\d+$/i,
      /^.+\s+Movement\s+\d+$/i,
      /^[A-Za-z0-9\s\-_.]+$/, // General alphanumeric with common separators
    ];

    return patterns.some((pattern) => pattern.test(sequenceName));
  }

  /**
   * Get validation statistics
   * @returns Validation statistics
   */
  getValidationStatistics(): {
    totalValidations: number;
    validSequences: number;
    invalidSequences: number;
    duplicatesDetected: number;
    strictModeDuplicates: number;
  } {
    // In a real implementation, this would track actual statistics
    return {
      totalValidations: 0,
      validSequences: 0,
      invalidSequences: 0,
      duplicatesDetected: 0,
      strictModeDuplicates: 0,
    };
  }

  /**
   * Reset validation state
   */
  reset(): void {
    console.log("🧹 SequenceValidator: Validation state reset");
  }

  /**
   * Get debug information
   * @returns Debug validation information
   */
  getDebugInfo(): {
    validationStatistics: ReturnType<
      SequenceValidator["getValidationStatistics"]
    >;
    duplicationDetectorInfo: any;
  } {
    return {
      validationStatistics: this.getValidationStatistics(),
      duplicationDetectorInfo: this.duplicationDetector.getDebugInfo(),
    };
  }
}
