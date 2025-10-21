/**
 * ResourceConflictManager - Advanced resource conflict resolution and management
 * Handles resource ownership, conflict resolution strategies, and diagnostic methods
 */

import type { ResourceManager } from "./ResourceManager.js";
import type { ResourceDelegator } from "./ResourceDelegator.js";
import type { SequenceUtilities } from "../utilities/SequenceUtilities.js";
import type { SequencePriority, SequenceRequest } from "../SequenceTypes.js";
import type { ResourceOwner } from "../MusicalConductor.js";

export interface ResourceConflictResolution {
  success: boolean;
  message: string;
  strategy: string;
}

export interface ResourceDiagnostics {
  ownership: Map<string, ResourceOwner>;
  symphonyResourceMap: Map<string, Set<string>>;
  activeConflicts: number;
  resolvedConflicts: number;
}

export class ResourceConflictManager {
  private resourceManager: ResourceManager;
  private resourceDelegator: ResourceDelegator;
  private sequenceUtilities: SequenceUtilities;

  constructor(
    resourceManager: ResourceManager,
    resourceDelegator: ResourceDelegator,
    sequenceUtilities: SequenceUtilities
  ) {
    this.resourceManager = resourceManager;
    this.resourceDelegator = resourceDelegator;
    this.sequenceUtilities = sequenceUtilities;
  }

  /**
   * Create a sequence instance ID
   * @param sequenceName - Name of the sequence
   * @param instanceId - Optional instance ID
   * @returns Generated instance ID
   */
  createSequenceInstanceId(sequenceName: string, instanceId?: string): string {
    return this.sequenceUtilities.createSequenceInstanceId(
      sequenceName,
      { instanceId },
      "NORMAL"
    );
  }

  /**
   * Extract symphony name from sequence name
   * @param sequenceName - Full sequence name
   * @returns Symphony name
   */
  extractSymphonyName(sequenceName: string): string {
    return this.sequenceUtilities.extractSymphonyName(sequenceName);
  }

  /**
   * Extract resource ID from sequence name and data
   * @param sequenceName - Name of the sequence
   * @param data - Sequence data
   * @returns Resource ID
   */
  extractResourceId(sequenceName: string, data: Record<string, any>): string {
    return this.sequenceUtilities.extractResourceId(sequenceName, data);
  }

  /**
   * Check for resource conflicts
   * @param resourceId - Resource ID to check
   * @param symphonyName - Symphony name
   * @param priority - Sequence priority
   * @param instanceId - Instance ID
   * @returns Conflict result
   */
  checkResourceConflict(
    resourceId: string,
    symphonyName: string,
    priority: SequencePriority,
    instanceId: string
  ): any {
    const delegatorResult = this.resourceDelegator.checkResourceConflict(
      resourceId,
      instanceId,
      priority
    );

    // Convert ResourceDelegator result to MusicalConductor result format
    return {
      hasConflict: delegatorResult.hasConflict,
      conflictType: delegatorResult.hasConflict ? "SAME_RESOURCE" : "NONE",
      resolution:
        delegatorResult.resolution === "override"
          ? "ALLOW"
          : delegatorResult.resolution === "reject"
          ? "REJECT"
          : delegatorResult.resolution === "queue"
          ? "QUEUE"
          : "ALLOW",
      message: delegatorResult.reason || "No conflict detected",
    };
  }

  /**
   * Acquire resource ownership
   * @param resourceId - Resource ID
   * @param symphonyName - Symphony name
   * @param instanceId - Instance ID
   * @param sequenceExecutionId - Execution ID
   */
  acquireResourceOwnership(
    resourceId: string,
    symphonyName: string,
    instanceId: string,
    sequenceExecutionId: string
  ): void {
    this.resourceDelegator.acquireResourceOwnership(
      resourceId,
      sequenceExecutionId
    );
  }

  /**
   * Release resource ownership
   * @param resourceId - Resource ID
   * @param sequenceExecutionId - Execution ID
   */
  releaseResourceOwnership(
    resourceId: string,
    sequenceExecutionId?: string
  ): void {
    this.resourceDelegator.releaseResourceOwnership(
      resourceId,
      sequenceExecutionId || "unknown"
    );
  }

  /**
   * Get resource ownership information
   * @returns Resource ownership map
   */
  getResourceOwnership(): Map<string, ResourceOwner> {
    return this.resourceManager.getResourceOwnership();
  }

  /**
   * Get symphony resource mapping
   * @returns Symphony to resources mapping
   */
  getSymphonyResourceMap(): Map<string, Set<string>> {
    return this.resourceManager.getSymphonyResourceMap();
  }

  /**
   * Enhanced resource conflict resolution with strategy selection
   * @param resourceId - Resource ID
   * @param symphonyName - Symphony name
   * @param instanceId - Instance ID
   * @param priority - Sequence priority
   * @param sequenceExecutionId - Execution ID
   * @param sequenceRequest - Full sequence request
   * @returns Resolution result
   */
  resolveResourceConflictAdvanced(
    resourceId: string,
    symphonyName: string,
    instanceId: string,
    priority: SequencePriority,
    sequenceExecutionId: string,
    sequenceRequest: SequenceRequest
  ): ResourceConflictResolution {
    return this.resourceManager.resolveResourceConflictAdvanced(
      resourceId,
      symphonyName,
      instanceId,
      priority,
      sequenceExecutionId,
      sequenceRequest
    );
  }

  /**
   * Get comprehensive resource diagnostics
   * @returns Resource diagnostics information
   */
  getResourceDiagnostics(): ResourceDiagnostics {
    return {
      ownership: this.getResourceOwnership(),
      symphonyResourceMap: this.getSymphonyResourceMap(),
      activeConflicts: 0, // Would be tracked in a real implementation
      resolvedConflicts: 0, // Would be tracked in a real implementation
    };
  }

  /**
   * Clear all resource ownership
   */
  clearAllResourceOwnership(): void {
    // This would clear all resource ownership
    console.log("🎼 ResourceConflictManager: Clearing all resource ownership");
  }

  /**
   * Get resource conflict statistics
   * @returns Conflict statistics
   */
  getConflictStatistics(): {
    totalConflicts: number;
    resolvedConflicts: number;
    activeConflicts: number;
    conflictResolutionStrategies: Record<string, number>;
  } {
    return {
      totalConflicts: 0,
      resolvedConflicts: 0,
      activeConflicts: 0,
      conflictResolutionStrategies: {
        ALLOW: 0,
        REJECT: 0,
        QUEUE: 0,
        INTERRUPT: 0,
      },
    };
  }

  /**
   * Check if a resource is currently owned
   * @param resourceId - Resource ID to check
   * @returns True if resource is owned
   */
  isResourceOwned(resourceId: string): boolean {
    const ownership = this.getResourceOwnership();
    return ownership.has(resourceId);
  }

  /**
   * Get the owner of a resource
   * @param resourceId - Resource ID
   * @returns Resource owner or null if not owned
   */
  getResourceOwner(resourceId: string): ResourceOwner | null {
    const ownership = this.getResourceOwnership();
    return ownership.get(resourceId) || null;
  }

  /**
   * Get all resources owned by a specific sequence
   * @param sequenceExecutionId - Execution ID
   * @returns Array of resource IDs owned by the sequence
   */
  getResourcesOwnedBySequence(sequenceExecutionId: string): string[] {
    const ownership = this.getResourceOwnership();
    const ownedResources: string[] = [];

    for (const [resourceId, owner] of ownership.entries()) {
      if (owner.sequenceExecutionId === sequenceExecutionId) {
        ownedResources.push(resourceId);
      }
    }

    return ownedResources;
  }

  /**
   * Get debug information
   * @returns Debug resource conflict information
   */
  getDebugInfo(): {
    resourceManager: boolean;
    resourceDelegator: boolean;
    sequenceUtilities: boolean;
    diagnostics: ResourceDiagnostics;
    statistics: ReturnType<ResourceConflictManager["getConflictStatistics"]>;
  } {
    return {
      resourceManager: !!this.resourceManager,
      resourceDelegator: !!this.resourceDelegator,
      sequenceUtilities: !!this.sequenceUtilities,
      diagnostics: this.getResourceDiagnostics(),
      statistics: this.getConflictStatistics(),
    };
  }
}
