/**
 * ResourceConflictResolver - Conflict resolution strategies
 * Handles different strategies for resolving resource conflicts between symphonies
 */

import type { SequencePriority, SequenceRequest } from "../SequenceTypes.js";
import { SEQUENCE_PRIORITIES } from "../SequenceTypes.js";
import type {
  ResourceOwner,
  ResourceConflictResult,
} from "../MusicalConductor.js";
import type { ResourceOwnershipTracker } from "./ResourceOwnershipTracker.js";

export class ResourceConflictResolver {
  private ownershipTracker: ResourceOwnershipTracker;

  constructor(ownershipTracker: ResourceOwnershipTracker) {
    this.ownershipTracker = ownershipTracker;
  }

  /**
   * Analyze priority-based conflicts
   * @param resourceId - Resource identifier
   * @param symphonyName - Requesting symphony name
   * @param priority - Requesting priority
   * @param currentOwner - Current resource owner
   * @returns Conflict analysis result
   */
  analyzePriorityConflict(
    resourceId: string,
    symphonyName: string,
    priority: SequencePriority,
    currentOwner: ResourceOwner
  ): ResourceConflictResult {
    // High priority can interrupt any other priority
    if (priority === SEQUENCE_PRIORITIES.HIGH) {
      return {
        hasConflict: true,
        conflictType: "PRIORITY_CONFLICT",
        currentOwner,
        resolution: "INTERRUPT",
        message: `HIGH priority ${symphonyName} can interrupt ${currentOwner.symphonyName} for resource ${resourceId}`,
      };
    }

    // Normal and chained priorities cannot interrupt
    return {
      hasConflict: true,
      conflictType: "SAME_RESOURCE",
      currentOwner,
      resolution: "REJECT",
      message: `Resource ${resourceId} is owned by ${currentOwner.symphonyName}, rejecting ${priority} priority request from ${symphonyName}`,
    };
  }

  /**
   * Resolve conflict by rejecting the request
   * @param resourceId - Resource identifier
   * @param requestingSymphony - Requesting symphony name
   * @param currentOwner - Current resource owner
   * @returns Resolution result
   */
  resolveConflict_Reject(
    resourceId: string,
    requestingSymphony: string,
    currentOwner: ResourceOwner
  ): { success: boolean; message: string } {
    console.warn(
      `🎼 ResourceConflictResolver: REJECT - Resource ${resourceId} is owned by ${currentOwner.symphonyName}, rejecting request from ${requestingSymphony}`
    );

    return {
      success: false,
      message: `Resource conflict: ${resourceId} owned by ${currentOwner.symphonyName}`,
    };
  }

  /**
   * Resolve conflict by queuing the request
   * @param sequenceRequest - Full sequence request
   * @param resourceId - Resource identifier
   * @param currentOwner - Current resource owner
   * @returns Resolution result
   */
  resolveConflict_Queue(
    sequenceRequest: SequenceRequest,
    resourceId: string,
    currentOwner: ResourceOwner
  ): { success: boolean; message: string } {
    // Add to queue with resource dependency metadata
    const queuedRequest = {
      ...sequenceRequest,
      data: {
        ...sequenceRequest.data,
        waitingForResource: resourceId,
        blockedBy: currentOwner.symphonyName,
        queuedAt: Date.now(),
      },
    };

    console.log(
      `🎼 ResourceConflictResolver: QUEUE - Adding ${sequenceRequest.sequenceName} to queue, waiting for resource ${resourceId} from ${currentOwner.symphonyName}`
    );

    // Note: In a real implementation, this would integrate with the ExecutionQueue
    // For now, we'll just log the queuing action

    return {
      success: true,
      message: `Request queued waiting for resource ${resourceId}`,
    };
  }

  /**
   * Resolve conflict by interrupting the current owner
   * @param resourceId - Resource identifier
   * @param requestingSymphony - Requesting symphony name
   * @param requestingInstanceId - Requesting instance ID
   * @param requestingPriority - Requesting priority
   * @param requestingExecutionId - Requesting execution ID
   * @param currentOwner - Current resource owner
   * @param resourceManager - Resource manager for ownership operations
   * @returns Resolution result
   */
  resolveConflict_Interrupt(
    resourceId: string,
    requestingSymphony: string,
    requestingInstanceId: string,
    requestingPriority: SequencePriority,
    requestingExecutionId: string,
    currentOwner: ResourceOwner,
    resourceManager: any // Avoiding circular dependency
  ): { success: boolean; message: string } {
    if (requestingPriority !== SEQUENCE_PRIORITIES.HIGH) {
      return {
        success: false,
        message: `Only HIGH priority requests can interrupt. Current priority: ${requestingPriority}`,
      };
    }

    console.log(
      `🎼 ResourceConflictResolver: INTERRUPT - HIGH priority ${requestingSymphony} interrupting ${currentOwner.symphonyName} for resource ${resourceId}`
    );

    // Notify current owner of interruption
    console.warn(
      `🎼 ResourceConflictResolver: Interrupting ${currentOwner.symphonyName} (${currentOwner.instanceId}) for HIGH priority request`
    );

    // Log interruption for monitoring
    console.log(
      `🎼 ResourceConflictResolver: Resource ${resourceId} forcibly transferred from ${currentOwner.symphonyName} to ${requestingSymphony}`
    );

    // Release the resource
    resourceManager.releaseResourceOwnership(
      resourceId,
      currentOwner.sequenceExecutionId
    );

    // Acquire for the new requester
    const acquired = resourceManager.acquireResourceOwnership(
      resourceId,
      requestingSymphony,
      requestingInstanceId,
      requestingPriority,
      requestingExecutionId
    );

    return {
      success: acquired,
      message: acquired
        ? `Resource ${resourceId} successfully transferred to ${requestingSymphony}`
        : `Failed to transfer resource ${resourceId} to ${requestingSymphony}`,
    };
  }

  /**
   * Determine optimal resolution strategy based on context
   * @param resourceId - Resource identifier
   * @param requestingPriority - Requesting priority
   * @param currentOwner - Current resource owner
   * @param queueLength - Current queue length
   * @returns Recommended resolution strategy
   */
  determineOptimalStrategy(
    resourceId: string,
    requestingPriority: SequencePriority,
    currentOwner: ResourceOwner,
    queueLength: number
  ): "REJECT" | "QUEUE" | "INTERRUPT" {
    // High priority always interrupts
    if (requestingPriority === SEQUENCE_PRIORITIES.HIGH) {
      return "INTERRUPT";
    }

    // If queue is getting long, start rejecting normal priority requests
    if (queueLength > 5 && requestingPriority === SEQUENCE_PRIORITIES.NORMAL) {
      return "REJECT";
    }

    // Check how long the current owner has held the resource
    const ownershipDuration = Date.now() - currentOwner.acquiredAt;
    const maxOwnershipTime = 30000; // 30 seconds

    // If current owner has held resource too long, allow queuing
    if (ownershipDuration > maxOwnershipTime) {
      return "QUEUE";
    }

    // Default to rejection for resource conflicts
    return "REJECT";
  }

  /**
   * Get conflict resolution statistics
   * @returns Resolution statistics
   */
  getResolutionStatistics(): {
    totalConflicts: number;
    rejectedRequests: number;
    queuedRequests: number;
    interruptedOwners: number;
    averageResolutionTime: number;
  } {
    // In a real implementation, this would track actual statistics
    return {
      totalConflicts: 0,
      rejectedRequests: 0,
      queuedRequests: 0,
      interruptedOwners: 0,
      averageResolutionTime: 0,
    };
  }

  /**
   * Check if a resource conflict can be resolved peacefully
   * @param resourceId - Resource identifier
   * @param requestingPriority - Requesting priority
   * @param currentOwner - Current resource owner
   * @returns True if peaceful resolution is possible
   */
  canResolvePeacefully(
    resourceId: string,
    requestingPriority: SequencePriority,
    currentOwner: ResourceOwner
  ): boolean {
    // High priority requests cannot be resolved peacefully (they interrupt)
    if (requestingPriority === SEQUENCE_PRIORITIES.HIGH) {
      return false;
    }

    // Check if current owner is close to finishing
    const ownershipDuration = Date.now() - currentOwner.acquiredAt;
    const estimatedRemainingTime = 10000; // 10 seconds estimate

    // If owner is likely to finish soon, queuing might be peaceful
    return ownershipDuration > estimatedRemainingTime;
  }
}
