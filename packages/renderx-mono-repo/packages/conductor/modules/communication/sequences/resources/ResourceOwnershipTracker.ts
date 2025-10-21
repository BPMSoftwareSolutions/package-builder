/**
 * ResourceOwnershipTracker - Ownership tracking
 * Tracks resource ownership, symphony mappings, and sequence instances
 */

import type { ResourceOwner } from "../MusicalConductor.js";

export interface SequenceInstance {
  instanceId: string;
  symphonyName: string;
  sequenceExecutionId: string;
  createdAt: number;
  resourcesOwned: string[];
}

export class ResourceOwnershipTracker {
  private resourceOwnership: Map<string, ResourceOwner> = new Map();
  private sequenceInstances: Map<string, SequenceInstance> = new Map();
  private symphonyResourceMap: Map<string, Set<string>> = new Map(); // symphonyName -> resourceIds
  private instanceCounter: number = 0;

  /**
   * Get resource owner
   * @param resourceId - Resource identifier
   * @returns Resource owner or undefined
   */
  getResourceOwner(resourceId: string): ResourceOwner | undefined {
    return this.resourceOwnership.get(resourceId);
  }

  /**
   * Set resource owner
   * @param resourceId - Resource identifier
   * @param owner - Resource owner
   * @param symphonyName - Symphony name
   * @returns Success status
   */
  setResourceOwner(
    resourceId: string,
    owner: ResourceOwner,
    symphonyName: string
  ): boolean {
    try {
      this.resourceOwnership.set(resourceId, owner);

      // Update symphony resource mapping
      if (!this.symphonyResourceMap.has(symphonyName)) {
        this.symphonyResourceMap.set(symphonyName, new Set());
      }
      this.symphonyResourceMap.get(symphonyName)!.add(resourceId);

      console.log(
        `🎼 ResourceOwnershipTracker: Resource ${resourceId} acquired by ${symphonyName} (${owner.instanceId})`
      );

      return true;
    } catch (error) {
      console.error(
        `🎼 ResourceOwnershipTracker: Failed to set resource owner for ${resourceId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Release resource
   * @param resourceId - Resource identifier
   * @param symphonyName - Symphony name
   */
  releaseResource(resourceId: string, symphonyName: string): void {
    this.resourceOwnership.delete(resourceId);

    // Update symphony resource mapping
    const symphonyResources = this.symphonyResourceMap.get(symphonyName);
    if (symphonyResources) {
      symphonyResources.delete(resourceId);
      if (symphonyResources.size === 0) {
        this.symphonyResourceMap.delete(symphonyName);
      }
    }

    console.log(
      `🎼 ResourceOwnershipTracker: Resource ${resourceId} released from ${symphonyName}`
    );
  }

  /**
   * Create sequence instance
   * @param symphonyName - Symphony name
   * @param sequenceExecutionId - Sequence execution ID
   * @returns Instance ID
   */
  createSequenceInstance(
    symphonyName: string,
    sequenceExecutionId: string
  ): string {
    const instanceId = `${symphonyName}-${++this
      .instanceCounter}-${Date.now()}`;

    const instance: SequenceInstance = {
      instanceId,
      symphonyName,
      sequenceExecutionId,
      createdAt: Date.now(),
      resourcesOwned: [],
    };

    this.sequenceInstances.set(instanceId, instance);

    console.log(
      `🎼 ResourceOwnershipTracker: Created sequence instance ${instanceId} for ${symphonyName}`
    );

    return instanceId;
  }

  /**
   * Update sequence instance resources
   * @param instanceId - Instance identifier
   * @param resourceIds - Resource identifiers
   */
  updateInstanceResources(instanceId: string, resourceIds: string[]): void {
    const instance = this.sequenceInstances.get(instanceId);
    if (instance) {
      instance.resourcesOwned = [...resourceIds];
    }
  }

  /**
   * Remove sequence instance
   * @param instanceId - Instance identifier
   */
  removeSequenceInstance(instanceId: string): void {
    const instance = this.sequenceInstances.get(instanceId);
    if (instance) {
      // Release all resources owned by this instance
      instance.resourcesOwned.forEach((resourceId) => {
        this.releaseResource(resourceId, instance.symphonyName);
      });

      this.sequenceInstances.delete(instanceId);
      console.log(
        `🎼 ResourceOwnershipTracker: Removed sequence instance ${instanceId}`
      );
    }
  }

  /**
   * Get all resource owners
   * @returns Resource ownership map
   */
  getAllResourceOwners(): Map<string, ResourceOwner> {
    return new Map(this.resourceOwnership);
  }

  /**
   * Get symphony resource mapping
   * @returns Symphony to resources mapping
   */
  getSymphonyResourceMap(): Map<string, Set<string>> {
    return new Map(this.symphonyResourceMap);
  }

  /**
   * Get sequence instances
   * @returns Sequence instances map
   */
  getSequenceInstances(): Map<string, SequenceInstance> {
    return new Map(this.sequenceInstances);
  }

  /**
   * Get resources owned by symphony
   * @param symphonyName - Symphony name
   * @returns Set of resource IDs
   */
  getResourcesOwnedBySymphony(symphonyName: string): Set<string> {
    return this.symphonyResourceMap.get(symphonyName) || new Set();
  }

  /**
   * Get active instances for symphony
   * @param symphonyName - Symphony name
   * @returns Array of sequence instances
   */
  getActiveInstancesForSymphony(symphonyName: string): SequenceInstance[] {
    return Array.from(this.sequenceInstances.values()).filter(
      (instance) => instance.symphonyName === symphonyName
    );
  }

  /**
   * Check if resource is owned
   * @param resourceId - Resource identifier
   * @returns True if resource is owned
   */
  isResourceOwned(resourceId: string): boolean {
    return this.resourceOwnership.has(resourceId);
  }

  /**
   * Get ownership duration
   * @param resourceId - Resource identifier
   * @returns Ownership duration in milliseconds, or 0 if not owned
   */
  getOwnershipDuration(resourceId: string): number {
    const owner = this.resourceOwnership.get(resourceId);
    return owner ? Date.now() - owner.acquiredAt : 0;
  }

  /**
   * Get resource statistics
   * @returns Resource usage statistics
   */
  getStatistics(): {
    totalResources: number;
    ownedResources: number;
    availableResources: number;
    symphoniesWithResources: number;
    averageOwnershipDuration: number;
  } {
    const ownedResources = this.resourceOwnership.size;
    const symphoniesWithResources = this.symphonyResourceMap.size;

    // Calculate average ownership duration
    let totalDuration = 0;
    let resourceCount = 0;

    for (const owner of this.resourceOwnership.values()) {
      totalDuration += Date.now() - owner.acquiredAt;
      resourceCount++;
    }

    const averageOwnershipDuration =
      resourceCount > 0 ? totalDuration / resourceCount : 0;

    return {
      totalResources: ownedResources, // In a real system, this would be total available resources
      ownedResources,
      availableResources: 0, // Would be calculated as totalResources - ownedResources
      symphoniesWithResources,
      averageOwnershipDuration,
    };
  }

  /**
   * Clean up expired instances
   * @param maxAge - Maximum age in milliseconds
   * @returns Number of cleaned up instances
   */
  cleanupExpiredInstances(maxAge: number = 300000): number {
    // 5 minutes default
    const now = Date.now();
    let cleanedUp = 0;

    for (const [instanceId, instance] of this.sequenceInstances.entries()) {
      if (now - instance.createdAt > maxAge) {
        this.removeSequenceInstance(instanceId);
        cleanedUp++;
      }
    }

    if (cleanedUp > 0) {
      console.log(
        `🧹 ResourceOwnershipTracker: Cleaned up ${cleanedUp} expired instances`
      );
    }

    return cleanedUp;
  }

  /**
   * Reset all tracking data (for testing)
   */
  reset(): void {
    this.resourceOwnership.clear();
    this.sequenceInstances.clear();
    this.symphonyResourceMap.clear();
    this.instanceCounter = 0;
    console.log("🧹 ResourceOwnershipTracker: All tracking data reset");
  }

  /**
   * Get debug information
   * @returns Debug information object
   */
  getDebugInfo(): {
    resourceOwnership: Record<string, ResourceOwner>;
    sequenceInstances: Record<string, SequenceInstance>;
    symphonyResourceMap: Record<string, string[]>;
    instanceCounter: number;
  } {
    return {
      resourceOwnership: Object.fromEntries(this.resourceOwnership),
      sequenceInstances: Object.fromEntries(this.sequenceInstances),
      symphonyResourceMap: Object.fromEntries(
        Array.from(this.symphonyResourceMap.entries()).map(([key, value]) => [
          key,
          Array.from(value),
        ])
      ),
      instanceCounter: this.instanceCounter,
    };
  }
}
