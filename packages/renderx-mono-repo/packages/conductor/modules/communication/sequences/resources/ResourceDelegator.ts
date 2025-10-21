/**
 * ResourceDelegator - Resource management delegation
 * Handles resource conflict checking, ownership management, and advanced conflict resolution
 */

import type { ResourceManager } from "./ResourceManager.js";

export interface ResourceConflictResult {
  hasConflict: boolean;
  conflictingResource?: string;
  conflictType?: "ownership" | "access" | "timing" | "dependency";
  resolution?: "queue" | "override" | "merge" | "reject";
  reason?: string;
}

export interface ResourceOwnershipResult {
  acquired: boolean;
  resourceId: string;
  ownerId: string;
  expiresAt?: number;
  reason?: string;
}

export interface AdvancedConflictResolution {
  strategy:
    | "priority-based"
    | "time-based"
    | "resource-sharing"
    | "queue-based";
  action: "allow" | "queue" | "reject" | "modify";
  details: {
    originalResourceId: string;
    resolvedResourceId?: string;
    queuePosition?: number;
    estimatedWaitTime?: number;
    alternativeResources?: string[];
  };
}

export class ResourceDelegator {
  private resourceManager: ResourceManager;

  constructor(resourceManager: ResourceManager) {
    this.resourceManager = resourceManager;
  }

  /**
   * Check for resource conflicts
   * @param resourceId - Resource ID to check
   * @param requesterId - ID of the requester
   * @param priority - Request priority
   * @returns Conflict check result
   */
  checkResourceConflict(
    resourceId: string,
    requesterId: string,
    priority: string = "NORMAL"
  ): ResourceConflictResult {
    try {
      // Use ResourceManager's existing conflict checking
      const result = this.resourceManager.checkResourceConflict(
        resourceId,
        requesterId,
        priority as any,
        requesterId
      );

      // Convert to our format
      return {
        hasConflict: result.hasConflict,
        conflictingResource: resourceId,
        conflictType: result.hasConflict ? "ownership" : undefined,
        resolution:
          result.resolution === "ALLOW"
            ? "override"
            : result.resolution === "REJECT"
            ? "reject"
            : result.resolution === "QUEUE"
            ? "queue"
            : "queue",
        reason: result.message,
      };
    } catch (error) {
      console.error(
        "🔴 ResourceDelegator: Error checking resource conflict:",
        error
      );
      return {
        hasConflict: true,
        conflictType: "access",
        resolution: "reject",
        reason: `Error checking resource conflict: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Determine the type of resource conflict
   * @param resourceId - Resource ID
   * @param currentOwner - Current owner ID
   * @param requesterId - Requester ID
   * @returns Conflict type
   */
  private determineConflictType(
    resourceId: string,
    currentOwner: string,
    requesterId: string
  ): "ownership" | "access" | "timing" | "dependency" {
    // Check for timing conflicts (rapid successive requests)
    if (this.hasTimingConflict(resourceId, requesterId)) {
      return "timing";
    }

    // Check for dependency conflicts
    if (this.hasDependencyConflict(resourceId, currentOwner, requesterId)) {
      return "dependency";
    }

    // Check for access level conflicts
    if (this.hasAccessConflict(resourceId, currentOwner, requesterId)) {
      return "access";
    }

    // Default to ownership conflict
    return "ownership";
  }

  /**
   * Check for timing conflicts
   * @param resourceId - Resource ID
   * @param requesterId - Requester ID
   * @returns True if timing conflict exists
   */
  private hasTimingConflict(resourceId: string, requesterId: string): boolean {
    // Simplified timing conflict check
    return false; // For now, assume no timing conflicts
  }

  /**
   * Check for dependency conflicts
   * @param resourceId - Resource ID
   * @param currentOwner - Current owner ID
   * @param requesterId - Requester ID
   * @returns True if dependency conflict exists
   */
  private hasDependencyConflict(
    resourceId: string,
    currentOwner: string,
    requesterId: string
  ): boolean {
    // Simplified dependency conflict check
    return false; // For now, assume no dependency conflicts
  }

  /**
   * Check for access level conflicts
   * @param resourceId - Resource ID
   * @param currentOwner - Current owner ID
   * @param requesterId - Requester ID
   * @returns True if access conflict exists
   */
  private hasAccessConflict(
    resourceId: string,
    currentOwner: string,
    requesterId: string
  ): boolean {
    // Simplified access conflict check
    return false; // For now, assume no access conflicts
  }

  /**
   * Determine resolution strategy for conflict
   * @param conflictType - Type of conflict
   * @param priority - Request priority
   * @returns Resolution strategy
   */
  private determineResolutionStrategy(
    conflictType: "ownership" | "access" | "timing" | "dependency",
    priority: string
  ): "queue" | "override" | "merge" | "reject" {
    switch (conflictType) {
      case "timing":
        return "queue"; // Queue rapid requests
      case "dependency":
        return "queue"; // Wait for dependencies to be released
      case "access":
        return "reject"; // Reject insufficient access
      case "ownership":
        return priority === "IMMEDIATE" ? "override" : "queue";
      default:
        return "queue";
    }
  }

  /**
   * Acquire resource ownership
   * @param resourceId - Resource ID to acquire
   * @param ownerId - ID of the owner
   * @param priority - Request priority
   * @returns Ownership result
   */
  acquireResourceOwnership(
    resourceId: string,
    ownerId: string,
    priority: string = "NORMAL"
  ): ResourceOwnershipResult {
    try {
      const conflictResult = this.checkResourceConflict(
        resourceId,
        ownerId,
        priority
      );

      if (
        conflictResult.hasConflict &&
        conflictResult.resolution === "reject"
      ) {
        return {
          acquired: false,
          resourceId,
          ownerId,
          reason: conflictResult.reason,
        };
      }

      // Attempt to acquire the resource using ResourceManager's method
      const acquired = this.resourceManager.acquireResourceOwnership(
        resourceId,
        ownerId,
        ownerId,
        priority as any,
        ownerId
      );

      if (acquired) {
        const expirationTime = this.calculateExpirationTime(priority);

        return {
          acquired: true,
          resourceId,
          ownerId,
          expiresAt: expirationTime,
          reason: "Resource acquired successfully",
        };
      } else {
        return {
          acquired: false,
          resourceId,
          ownerId,
          reason: "Failed to acquire resource",
        };
      }
    } catch (error) {
      console.error(
        "🔴 ResourceDelegator: Error acquiring resource ownership:",
        error
      );
      return {
        acquired: false,
        resourceId,
        ownerId,
        reason: `Error acquiring resource: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Calculate resource expiration time based on priority
   * @param priority - Request priority
   * @returns Expiration timestamp
   */
  private calculateExpirationTime(priority: string): number {
    const baseTime = Date.now();
    const expirationDelays: Record<string, number> = {
      IMMEDIATE: 30000, // 30 seconds
      HIGH: 60000, // 1 minute
      NORMAL: 300000, // 5 minutes
      LOW: 600000, // 10 minutes
      BACKGROUND: 1800000, // 30 minutes
    };

    const delay = expirationDelays[priority] || expirationDelays.NORMAL;
    return baseTime + delay;
  }

  /**
   * Release resource ownership
   * @param resourceId - Resource ID to release
   * @param ownerId - ID of the owner
   * @returns True if released successfully
   */
  releaseResourceOwnership(resourceId: string, ownerId: string): boolean {
    try {
      // Use ResourceManager's existing release method
      this.resourceManager.releaseResourceOwnership(resourceId, ownerId);
      console.log(
        `✅ ResourceDelegator: Released resource ${resourceId} from ${ownerId}`
      );
      return true;
    } catch (error) {
      console.error(
        "🔴 ResourceDelegator: Error releasing resource ownership:",
        error
      );
      return false;
    }
  }

  /**
   * Resolve advanced resource conflicts
   * @param resourceId - Resource ID with conflict
   * @param requesterId - ID of the requester
   * @param priority - Request priority
   * @returns Advanced conflict resolution
   */
  resolveResourceConflictAdvanced(
    resourceId: string,
    requesterId: string,
    priority: string = "NORMAL"
  ): AdvancedConflictResolution {
    const conflictResult = this.checkResourceConflict(
      resourceId,
      requesterId,
      priority
    );

    if (!conflictResult.hasConflict) {
      return {
        strategy: "priority-based",
        action: "allow",
        details: {
          originalResourceId: resourceId,
          resolvedResourceId: resourceId,
        },
      };
    }

    // Determine resolution strategy based on conflict type and priority
    switch (conflictResult.conflictType) {
      case "timing":
        return this.resolveTimingConflict(resourceId, requesterId, priority);
      case "dependency":
        return this.resolveDependencyConflict(
          resourceId,
          requesterId,
          priority
        );
      case "access":
        return this.resolveAccessConflict(resourceId, requesterId, priority);
      case "ownership":
      default:
        return this.resolveOwnershipConflict(resourceId, requesterId, priority);
    }
  }

  /**
   * Resolve timing conflicts
   */
  private resolveTimingConflict(
    resourceId: string,
    requesterId: string,
    priority: string
  ): AdvancedConflictResolution {
    return {
      strategy: "time-based",
      action: "queue",
      details: {
        originalResourceId: resourceId,
        queuePosition: 1, // Simplified queue position
        estimatedWaitTime: 1000, // 1 second for timing conflicts
      },
    };
  }

  /**
   * Resolve dependency conflicts
   */
  private resolveDependencyConflict(
    resourceId: string,
    requesterId: string,
    priority: string
  ): AdvancedConflictResolution {
    const alternativeResources: string[] = []; // Simplified - no alternatives

    return {
      strategy: "resource-sharing",
      action: alternativeResources.length > 0 ? "modify" : "queue",
      details: {
        originalResourceId: resourceId,
        alternativeResources,
        estimatedWaitTime: alternativeResources.length > 0 ? 0 : 5000,
      },
    };
  }

  /**
   * Resolve access conflicts
   */
  private resolveAccessConflict(
    resourceId: string,
    requesterId: string,
    priority: string
  ): AdvancedConflictResolution {
    return {
      strategy: "priority-based",
      action: "reject",
      details: {
        originalResourceId: resourceId,
      },
    };
  }

  /**
   * Resolve ownership conflicts
   */
  private resolveOwnershipConflict(
    resourceId: string,
    requesterId: string,
    priority: string
  ): AdvancedConflictResolution {
    const action = priority === "IMMEDIATE" ? "allow" : "queue";

    return {
      strategy: "priority-based",
      action,
      details: {
        originalResourceId: resourceId,
        resolvedResourceId: resourceId,
        queuePosition: action === "queue" ? 1 : undefined, // Simplified queue position
        estimatedWaitTime: action === "queue" ? 10000 : 0, // 10 seconds for ownership conflicts
      },
    };
  }

  /**
   * Get debug information
   * @returns Debug resource delegation information
   */
  getDebugInfo(): {
    conflictsResolved: number;
    resourcesAcquired: number;
    resourcesReleased: number;
    activeConflicts: number;
  } {
    return {
      conflictsResolved: 0,
      resourcesAcquired: 0,
      resourcesReleased: 0,
      activeConflicts: 0,
    };
  }
}
