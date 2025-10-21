/**
 * ResourceManager - Resource ownership and conflict management
 * Handles MCO/MSO resource ownership, conflicts, and resolution strategies
 */

import type { SequencePriority, SequenceRequest } from "../SequenceTypes.js";
import { ResourceConflictResolver } from "./ResourceConflictResolver.js";
import { ResourceOwnershipTracker } from "./ResourceOwnershipTracker.js";

// Import resource types from MusicalConductor (temporary until we move them to a shared location)
import type {
  ResourceOwner,
  ResourceConflictResult,
} from "../MusicalConductor.js";

export class ResourceManager {
  private conflictResolver: ResourceConflictResolver;
  private ownershipTracker: ResourceOwnershipTracker;

  constructor() {
    this.ownershipTracker = new ResourceOwnershipTracker();
    this.conflictResolver = new ResourceConflictResolver(this.ownershipTracker);
  }

  /**
   * Check for resource conflicts
   * @param resourceId - Resource identifier
   * @param symphonyName - Symphony name
   * @param priority - Sequence priority
   * @param instanceId - Instance identifier
   * @returns Conflict analysis result
   */
  checkResourceConflict(
    resourceId: string,
    symphonyName: string,
    priority: SequencePriority,
    instanceId: string
  ): ResourceConflictResult {
    const currentOwner = this.ownershipTracker.getResourceOwner(resourceId);

    if (!currentOwner) {
      return {
        hasConflict: false,
        conflictType: "NONE",
        resolution: "ALLOW",
        message: `Resource ${resourceId} is available`,
      };
    }

    // Check for same symphony attempting to re-acquire
    if (currentOwner.symphonyName === symphonyName) {
      if (currentOwner.instanceId === instanceId) {
        return {
          hasConflict: false,
          conflictType: "NONE",
          currentOwner,
          resolution: "ALLOW",
          message: `Resource ${resourceId} already owned by same instance`,
        };
      } else {
        return {
          hasConflict: true,
          conflictType: "INSTANCE_CONFLICT",
          currentOwner,
          resolution: "REJECT",
          message: `Resource ${resourceId} owned by different instance of ${symphonyName}`,
        };
      }
    }

    // Different symphony - check priority
    return this.conflictResolver.analyzePriorityConflict(
      resourceId,
      symphonyName,
      priority,
      currentOwner
    );
  }

  /**
   * Acquire resource ownership
   * @param resourceId - Resource identifier
   * @param symphonyName - Symphony name
   * @param instanceId - Instance identifier
   * @param priority - Sequence priority
   * @param sequenceExecutionId - Sequence execution ID
   * @returns Success status
   */
  acquireResourceOwnership(
    resourceId: string,
    symphonyName: string,
    instanceId: string,
    priority: SequencePriority,
    sequenceExecutionId: string
  ): boolean {
    const conflictResult = this.checkResourceConflict(
      resourceId,
      symphonyName,
      priority,
      instanceId
    );

    if (conflictResult.resolution === "REJECT") {
      console.warn(
        `🎼 ResourceManager: Resource acquisition rejected - ${conflictResult.message}`
      );
      return false;
    } else if (conflictResult.resolution === "INTERRUPT") {
      console.log(
        `🎼 ResourceManager: Interrupting current owner for HIGH priority request - ${conflictResult.message}`
      );
      this.releaseResourceOwnership(
        resourceId,
        conflictResult.currentOwner!.sequenceExecutionId
      );
    }

    // Acquire the resource
    const resourceOwner: ResourceOwner = {
      symphonyName,
      instanceId,
      resourceId,
      acquiredAt: Date.now(),
      priority,
      sequenceExecutionId,
    };

    return this.ownershipTracker.setResourceOwner(
      resourceId,
      resourceOwner,
      symphonyName
    );
  }

  /**
   * Release resource ownership
   * @param resourceId - Resource identifier
   * @param sequenceExecutionId - Sequence execution ID (for verification)
   */
  releaseResourceOwnership(
    resourceId: string,
    sequenceExecutionId?: string
  ): void {
    const currentOwner = this.ownershipTracker.getResourceOwner(resourceId);

    if (!currentOwner) {
      return; // Resource not owned
    }

    // Verify ownership if execution ID provided
    if (
      sequenceExecutionId &&
      currentOwner.sequenceExecutionId !== sequenceExecutionId
    ) {
      console.warn(
        `🎼 ResourceManager: Cannot release resource ${resourceId} - execution ID mismatch`
      );
      return;
    }

    this.ownershipTracker.releaseResource(
      resourceId,
      currentOwner.symphonyName
    );

    console.log(
      `🎼 ResourceManager: Released resource ${resourceId} from ${currentOwner.symphonyName}`
    );
  }

  /**
   * Resolve resource conflicts with advanced strategies
   * @param resourceId - Resource identifier
   * @param symphonyName - Symphony name
   * @param instanceId - Instance identifier
   * @param priority - Sequence priority
   * @param sequenceExecutionId - Sequence execution ID
   * @param sequenceRequest - Full sequence request (for queuing)
   * @returns Resolution result
   */
  resolveResourceConflictAdvanced(
    resourceId: string,
    symphonyName: string,
    instanceId: string,
    priority: SequencePriority,
    sequenceExecutionId: string,
    sequenceRequest: SequenceRequest
  ): { success: boolean; message: string; strategy: string } {
    const conflictResult = this.checkResourceConflict(
      resourceId,
      symphonyName,
      priority,
      instanceId
    );

    if (!conflictResult.hasConflict) {
      // No conflict - proceed normally
      const acquired = this.acquireResourceOwnership(
        resourceId,
        symphonyName,
        instanceId,
        priority,
        sequenceExecutionId
      );
      return {
        success: acquired,
        message: acquired
          ? `Resource ${resourceId} acquired successfully`
          : `Failed to acquire resource ${resourceId}`,
        strategy: "DIRECT_ACQUISITION",
      };
    }

    const currentOwner = conflictResult.currentOwner!;

    // Apply resolution strategy based on conflict analysis
    switch (conflictResult.resolution) {
      case "REJECT":
        const rejectResult = this.conflictResolver.resolveConflict_Reject(
          resourceId,
          symphonyName,
          currentOwner
        );
        return { ...rejectResult, strategy: "REJECT" };

      case "QUEUE":
        const queueResult = this.conflictResolver.resolveConflict_Queue(
          sequenceRequest,
          resourceId,
          currentOwner
        );
        return { ...queueResult, strategy: "QUEUE" };

      case "INTERRUPT":
        const interruptResult = this.conflictResolver.resolveConflict_Interrupt(
          resourceId,
          symphonyName,
          instanceId,
          priority,
          sequenceExecutionId,
          currentOwner,
          this
        );
        return { ...interruptResult, strategy: "INTERRUPT" };

      default:
        return {
          success: false,
          message: `Unknown resolution strategy: ${conflictResult.resolution}`,
          strategy: "UNKNOWN",
        };
    }
  }

  /**
   * Get resource ownership information
   * @returns Resource ownership map
   */
  getResourceOwnership(): Map<string, ResourceOwner> {
    return this.ownershipTracker.getAllResourceOwners();
  }

  /**
   * Get symphony resource mapping
   * @returns Symphony to resources mapping
   */
  getSymphonyResourceMap(): Map<string, Set<string>> {
    return this.ownershipTracker.getSymphonyResourceMap();
  }

  /**
   * Get sequence instances
   * @returns Sequence instances map
   */
  getSequenceInstances(): Map<string, any> {
    return this.ownershipTracker.getSequenceInstances();
  }

  /**
   * Get resource statistics
   * @returns Resource usage statistics
   */
  getResourceStatistics(): {
    totalResources: number;
    ownedResources: number;
    availableResources: number;
    symphoniesWithResources: number;
    averageOwnershipDuration: number;
  } {
    return this.ownershipTracker.getStatistics();
  }

  /**
   * Get resource ownership tracker (for internal use)
   * @returns ResourceOwnershipTracker instance
   */
  getResourceOwnershipTracker(): ResourceOwnershipTracker {
    return this.ownershipTracker;
  }

  /**
   * Reset all resource ownership (for testing)
   */
  reset(): void {
    this.ownershipTracker.reset();
    console.log("🧹 ResourceManager: All resource ownership reset");
  }
}
