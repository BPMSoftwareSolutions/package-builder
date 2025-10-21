/**
 * SequenceUtilities - Utility methods for sequence processing
 * Handles sequence name parsing, ID generation, and utility operations
 */

import type {
  SequencePriority,
  SequenceRequest,
  SequenceExecutionContext,
} from "../SequenceTypes";

export interface SequenceInstanceInfo {
  instanceId: string;
  symphonyName: string;
  resourceId: string;
}

export interface MovementInfo {
  name: string;
  number: number;
  description?: string;
}

export class SequenceUtilities {
  private static readonly SEQUENCE_ID_PREFIX = "seq";
  private static readonly INSTANCE_ID_PREFIX = "inst";

  /**
   * Create a unique sequence instance ID
   * @param sequenceName - Name of the sequence
   * @param data - Sequence data
   * @param priority - Sequence priority
   * @returns Unique instance ID
   */
  createSequenceInstanceId(
    sequenceName: string,
    data: any,
    priority: SequencePriority
  ): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const priorityCode = this.getPriorityCode(priority);

    return `${SequenceUtilities.INSTANCE_ID_PREFIX}_${priorityCode}_${timestamp}_${randomSuffix}`;
  }

  /**
   * Get priority code for ID generation
   * @param priority - Sequence priority
   * @returns Priority code
   */
  private getPriorityCode(priority: SequencePriority): string {
    switch (priority) {
      case "HIGH":
        return "HI";
      case "NORMAL":
        return "NOR";
      case "CHAINED":
        return "CH";
      default:
        return "UNK";
    }
  }

  /**
   * Extract symphony name from sequence name
   * @param sequenceName - Full sequence name
   * @returns Symphony name
   */
  extractSymphonyName(sequenceName: string): string {
    const parts = sequenceName.split(".");
    if (parts.length >= 2) {
      return parts[0].trim();
    }
    return "Default Symphony";
  }

  /**
   * Extract resource ID from sequence name and data
   * @param sequenceName - Name of the sequence
   * @param data - Sequence data
   * @returns Resource ID
   */
  extractResourceId(sequenceName: string, data: any): string {
    // Priority order for resource ID extraction
    if (data?.resourceId) {
      return data.resourceId;
    }

    if (data?.componentId) {
      return `component_${data.componentId}`;
    }

    if (data?.elementId) {
      return `element_${data.elementId}`;
    }

    if (data?.canvasId) {
      return `canvas_${data.canvasId}`;
    }

    // Fallback to sequence-based resource ID
    const symphonyName = this.extractSymphonyName(sequenceName);
    return `symphony_${symphonyName.toLowerCase().replace(/\s+/g, "_")}`;
  }

  /**
   * Get movement name for a specific beat in a sequence
   * @param sequenceName - Name of the sequence
   * @param beatNumber - Beat number
   * @returns Movement information
   */
  getMovementNameForBeat(
    sequenceName: string,
    beatNumber: number
  ): MovementInfo {
    // Calculate movement based on beat grouping (typically 4 beats per movement)
    const beatsPerMovement = 4;
    const movementNumber = Math.ceil(beatNumber / beatsPerMovement);

    // Generate movement name based on sequence type
    const movementName = this.generateMovementName(
      sequenceName,
      movementNumber
    );

    return {
      name: movementName,
      number: movementNumber,
      description: `Movement ${movementNumber} of ${sequenceName}`,
    };
  }

  /**
   * Generate movement name based on sequence name and movement number
   * @param sequenceName - Name of the sequence
   * @param movementNumber - Movement number
   * @returns Generated movement name
   */
  private generateMovementName(
    sequenceName: string,
    movementNumber: number
  ): string {
    // Extract sequence type for movement naming
    if (sequenceName.includes("Display")) {
      return `Display Movement ${movementNumber}`;
    }

    if (sequenceName.includes("Animation")) {
      return `Animation Movement ${movementNumber}`;
    }

    if (sequenceName.includes("Interaction")) {
      return `Interaction Movement ${movementNumber}`;
    }

    if (sequenceName.includes("Data")) {
      return `Data Movement ${movementNumber}`;
    }

    // Default movement naming
    return `Movement ${movementNumber}`;
  }

  /**
   * Create execution context for a sequence request
   * @param sequenceRequest - Sequence request
   * @returns Execution context
   */
  createExecutionContext(
    sequenceRequest: SequenceRequest
  ): SequenceExecutionContext {
    const instanceInfo = this.extractSequenceInstanceInfo(
      sequenceRequest.sequenceName,
      sequenceRequest.data,
      sequenceRequest.priority
    );

    return {
      id: instanceInfo.instanceId,
      sequenceId: sequenceRequest.sequenceId,
      sequenceName: sequenceRequest.sequenceName,
      sequence: {} as any, // Will be filled in by the caller
      data: sequenceRequest.data,
      payload: {},
      startTime: Date.now(),
      currentMovement: 1,
      currentBeat: 0,
      completedBeats: [],
      errors: [],
      executionType: this.determineExecutionType(sequenceRequest),
      priority: sequenceRequest.priority,
    };
  }

  /**
   * Extract sequence instance information
   * @param sequenceName - Name of the sequence
   * @param data - Sequence data
   * @param priority - Sequence priority
   * @returns Sequence instance information
   */
  extractSequenceInstanceInfo(
    sequenceName: string,
    data: any,
    priority: SequencePriority
  ): SequenceInstanceInfo {
    return {
      instanceId: this.createSequenceInstanceId(sequenceName, data, priority),
      symphonyName: this.extractSymphonyName(sequenceName),
      resourceId: this.extractResourceId(sequenceName, data),
    };
  }

  /**
   * Determine execution type based on sequence request
   * @param sequenceRequest - Sequence request
   * @returns Execution type
   */
  private determineExecutionType(
    sequenceRequest: SequenceRequest
  ): "IMMEDIATE" | "CONSECUTIVE" {
    // Determine execution type based on sequence characteristics
    if (sequenceRequest.priority === "HIGH") {
      return "IMMEDIATE";
    }

    return "CONSECUTIVE";
  }

  /**
   * Check if subscriber is authorized
   * @param callerInfo - Information about the caller
   * @returns True if authorized
   */
  isAuthorizedSubscriber(callerInfo: any): boolean {
    // Allow React components to use conductor.subscribe()
    if (callerInfo?.isReactComponent) {
      return true;
    }

    // Allow known system components
    const authorizedComponents = [
      "MusicalConductor",
      "SequenceExecutor",
      "EventLogger",
      "StatisticsManager",
      "PerformanceTracker",
    ];

    if (
      callerInfo?.componentName &&
      authorizedComponents.includes(callerInfo.componentName)
    ) {
      return true;
    }

    // Allow if caller has proper authorization token
    if (callerInfo?.authToken && this.validateAuthToken(callerInfo.authToken)) {
      return true;
    }

    // Default to allowing subscription (can be made more restrictive)
    return true;
  }

  /**
   * Validate authorization token
   * @param token - Authorization token
   * @returns True if valid
   */
  private validateAuthToken(token: string): boolean {
    // Simple token validation (in production, use proper JWT or similar)
    return token.startsWith("conductor_") && token.length > 20;
  }

  /**
   * Parse sequence name components
   * @param sequenceName - Full sequence name
   * @returns Parsed components
   */
  parseSequenceName(sequenceName: string): {
    symphony: string;
    movement?: string;
    number?: number;
    type?: string;
  } {
    // Parse patterns like "Symphony Name Movement No. X" or "Symphony Name No. X"
    const symphonyMatch = sequenceName.match(
      /^(.+?)\s+(?:Symphony|Sequence|Movement)\s+No\.\s+(\d+)$/i
    );
    if (symphonyMatch) {
      return {
        symphony: symphonyMatch[1].trim(),
        number: parseInt(symphonyMatch[2], 10),
        type: "numbered",
      };
    }

    // Parse patterns with movement names
    const movementMatch = sequenceName.match(
      /^(.+?)\s+(.+?)\s+Movement\s+(\d+)$/i
    );
    if (movementMatch) {
      return {
        symphony: movementMatch[1].trim(),
        movement: movementMatch[2].trim(),
        number: parseInt(movementMatch[3], 10),
        type: "movement",
      };
    }

    // Default parsing
    return {
      symphony: this.extractSymphonyName(sequenceName),
      type: "simple",
    };
  }

  /**
   * Generate sequence hash for caching/comparison
   * @param sequenceName - Name of the sequence
   * @param data - Sequence data
   * @returns Hash string
   */
  generateSequenceHash(sequenceName: string, data: any): string {
    const hashData = {
      name: sequenceName,
      resourceId: this.extractResourceId(sequenceName, data),
      symphonyName: this.extractSymphonyName(sequenceName),
    };

    // Simple hash generation
    const hashString = JSON.stringify(hashData);
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `${SequenceUtilities.SEQUENCE_ID_PREFIX}_${Math.abs(hash).toString(
      36
    )}`;
  }

  /**
   * Get debug information
   * @returns Debug utility information
   */
  getDebugInfo(): {
    generatedIds: number;
    parsedSequences: number;
    authorizedSubscribers: number;
  } {
    // In a real implementation, this would track actual statistics
    return {
      generatedIds: 0,
      parsedSequences: 0,
      authorizedSubscribers: 0,
    };
  }
}
