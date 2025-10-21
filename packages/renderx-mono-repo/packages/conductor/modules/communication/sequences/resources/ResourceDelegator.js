/**
 * ResourceDelegator - Resource management delegation
 * Handles resource conflict checking, ownership management, and advanced conflict resolution
 */
export class ResourceDelegator {
    resourceManager;
    constructor(resourceManager) {
        this.resourceManager = resourceManager;
    }
    /**
     * Check for resource conflicts
     * @param resourceId - Resource ID to check
     * @param requesterId - ID of the requester
     * @param priority - Request priority
     * @returns Conflict check result
     */
    checkResourceConflict(resourceId, requesterId, priority = "NORMAL") {
        try {
            // Use ResourceManager's existing conflict checking
            const result = this.resourceManager.checkResourceConflict(resourceId, requesterId, priority, requesterId);
            // Convert to our format
            return {
                hasConflict: result.hasConflict,
                conflictingResource: resourceId,
                conflictType: result.hasConflict ? "ownership" : undefined,
                resolution: result.resolution === "ALLOW"
                    ? "override"
                    : result.resolution === "REJECT"
                        ? "reject"
                        : result.resolution === "QUEUE"
                            ? "queue"
                            : "queue",
                reason: result.message,
            };
        }
        catch (error) {
            console.error("🔴 ResourceDelegator: Error checking resource conflict:", error);
            return {
                hasConflict: true,
                conflictType: "access",
                resolution: "reject",
                reason: `Error checking resource conflict: ${error.message}`,
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
    determineConflictType(resourceId, currentOwner, requesterId) {
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
    hasTimingConflict(resourceId, requesterId) {
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
    hasDependencyConflict(resourceId, currentOwner, requesterId) {
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
    hasAccessConflict(resourceId, currentOwner, requesterId) {
        // Simplified access conflict check
        return false; // For now, assume no access conflicts
    }
    /**
     * Determine resolution strategy for conflict
     * @param conflictType - Type of conflict
     * @param priority - Request priority
     * @returns Resolution strategy
     */
    determineResolutionStrategy(conflictType, priority) {
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
    acquireResourceOwnership(resourceId, ownerId, priority = "NORMAL") {
        try {
            const conflictResult = this.checkResourceConflict(resourceId, ownerId, priority);
            if (conflictResult.hasConflict &&
                conflictResult.resolution === "reject") {
                return {
                    acquired: false,
                    resourceId,
                    ownerId,
                    reason: conflictResult.reason,
                };
            }
            // Attempt to acquire the resource using ResourceManager's method
            const acquired = this.resourceManager.acquireResourceOwnership(resourceId, ownerId, ownerId, priority, ownerId);
            if (acquired) {
                const expirationTime = this.calculateExpirationTime(priority);
                return {
                    acquired: true,
                    resourceId,
                    ownerId,
                    expiresAt: expirationTime,
                    reason: "Resource acquired successfully",
                };
            }
            else {
                return {
                    acquired: false,
                    resourceId,
                    ownerId,
                    reason: "Failed to acquire resource",
                };
            }
        }
        catch (error) {
            console.error("🔴 ResourceDelegator: Error acquiring resource ownership:", error);
            return {
                acquired: false,
                resourceId,
                ownerId,
                reason: `Error acquiring resource: ${error.message}`,
            };
        }
    }
    /**
     * Calculate resource expiration time based on priority
     * @param priority - Request priority
     * @returns Expiration timestamp
     */
    calculateExpirationTime(priority) {
        const baseTime = Date.now();
        const expirationDelays = {
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
    releaseResourceOwnership(resourceId, ownerId) {
        try {
            // Use ResourceManager's existing release method
            this.resourceManager.releaseResourceOwnership(resourceId, ownerId);
            console.log(`✅ ResourceDelegator: Released resource ${resourceId} from ${ownerId}`);
            return true;
        }
        catch (error) {
            console.error("🔴 ResourceDelegator: Error releasing resource ownership:", error);
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
    resolveResourceConflictAdvanced(resourceId, requesterId, priority = "NORMAL") {
        const conflictResult = this.checkResourceConflict(resourceId, requesterId, priority);
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
                return this.resolveDependencyConflict(resourceId, requesterId, priority);
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
    resolveTimingConflict(resourceId, requesterId, priority) {
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
    resolveDependencyConflict(resourceId, requesterId, priority) {
        const alternativeResources = []; // Simplified - no alternatives
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
    resolveAccessConflict(resourceId, requesterId, priority) {
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
    resolveOwnershipConflict(resourceId, requesterId, priority) {
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
    getDebugInfo() {
        return {
            conflictsResolved: 0,
            resourcesAcquired: 0,
            resourcesReleased: 0,
            activeConflicts: 0,
        };
    }
}
//# sourceMappingURL=ResourceDelegator.js.map