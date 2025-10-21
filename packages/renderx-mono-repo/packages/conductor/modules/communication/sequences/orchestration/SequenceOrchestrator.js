/**
 * SequenceOrchestrator - Core sequence orchestration engine
 * Handles sequence startup, queue processing, and execution coordination
 */
import { SEQUENCE_PRIORITIES, MUSICAL_CONDUCTOR_EVENT_TYPES, } from "../SequenceTypes.js";
export class SequenceOrchestrator {
    eventBus;
    sequenceRegistry;
    executionQueue;
    sequenceExecutor;
    statisticsManager;
    sequenceValidator;
    sequenceUtilities;
    resourceDelegator;
    constructor(eventBus, sequenceRegistry, executionQueue, sequenceExecutor, statisticsManager, sequenceValidator, sequenceUtilities, resourceDelegator) {
        this.eventBus = eventBus;
        this.sequenceRegistry = sequenceRegistry;
        this.executionQueue = executionQueue;
        this.sequenceExecutor = sequenceExecutor;
        this.statisticsManager = statisticsManager;
        this.sequenceValidator = sequenceValidator;
        this.sequenceUtilities = sequenceUtilities;
        this.resourceDelegator = resourceDelegator;
    }
    /**
     * Start a musical sequence with Sequential Orchestration and Resource Management
     * @param sequenceId - ID of the sequence to start
     * @param data - Data to pass to the sequence
     * @param priority - Priority level: 'HIGH', 'NORMAL', 'CHAINED'
     * @returns Sequence start result
     */
    startSequence(sequenceId, data = {}, priority = SEQUENCE_PRIORITIES.NORMAL) {
        const requestId = this.generateRequestId(sequenceId);
        try {
            // Phase 1: Validate sequence exists
            const sequence = this.sequenceRegistry.get(sequenceId);
            if (!sequence) {
                this.logSequenceNotFound(sequenceId);
                throw new Error(`Sequence with ID "${sequenceId}" not found`);
            }
            // Phase 2: StrictMode Protection & Idempotency Check
            const deduplicationResult = this.sequenceValidator.deduplicateSequenceRequest(sequenceId, sequence.name, data, priority);
            if (deduplicationResult.isDuplicate) {
                return this.handleDuplicateSequence(sequenceId, sequence.name, deduplicationResult);
            }
            // Phase 3: Record sequence execution IMMEDIATELY to prevent race conditions
            this.recordSequenceExecution(deduplicationResult.hash);
            // Phase 4: Extract symphony and resource information
            const orchestrationMetadata = this.extractOrchestrationMetadata(sequenceId, sequence.name, data);
            // Phase 5: Check for resource conflicts
            const conflictResult = this.checkResourceConflicts(orchestrationMetadata, priority);
            if (conflictResult.resolution === "REJECT") {
                console.warn(`🎼 SequenceOrchestrator: Sequence request rejected - ${conflictResult.message}`);
                throw new Error(`Resource conflict: ${conflictResult.message}`);
            }
            // Phase 6: Create and queue sequence request
            const sequenceRequest = this.createSequenceRequest(sequenceId, sequence.name, data, priority, requestId, orchestrationMetadata, conflictResult, deduplicationResult.hash);
            // Phase 7: Update statistics and queue the sequence
            this.statisticsManager.recordSequenceQueued();
            this.executionQueue.enqueue(sequenceRequest);
            // Phase 8: Process queue if not currently executing
            this.processQueueIfIdle();
            // Phase 9: Emit queued event
            this.emitSequenceQueuedEvent(sequenceId, sequence.name, requestId, priority);
            console.log(`🎼 SequenceOrchestrator: Sequence "${sequence.name}" (id: ${sequenceId}) queued successfully`);
            return {
                requestId,
                success: true,
            };
        }
        catch (error) {
            console.error(`🎼 SequenceOrchestrator: Failed to start sequence: ${sequenceId}`, error);
            this.statisticsManager.recordError();
            return {
                requestId,
                success: false,
                reason: error.message,
            };
        }
    }
    /**
     * Process the sequence queue
     * @returns Queue processing result
     */
    async processSequenceQueue() {
        if (this.executionQueue.isEmpty() ||
            this.sequenceExecutor.isSequenceRunning()) {
            return { processed: false };
        }
        const nextRequest = this.executionQueue.dequeue();
        if (!nextRequest) {
            return { processed: false };
        }
        const waitTime = performance.now() - nextRequest.queuedAt;
        this.statisticsManager.updateQueueWaitTime(waitTime);
        const sequence = this.sequenceRegistry.get(nextRequest.sequenceId);
        if (!sequence) {
            console.error(`❌ SequenceOrchestrator: Sequence ${nextRequest.sequenceId} not found in registry`);
            // Continue processing queue
            this.processSequenceQueue();
            return {
                processed: true,
                sequenceName: nextRequest.sequenceName,
                success: false,
                error: "Sequence not found in registry",
            };
        }
        try {
            // Update statistics: dequeued and execution started
            this.statisticsManager.recordSequenceDequeued();
            this.statisticsManager.recordSequenceExecution(0);
            await this.sequenceExecutor.executeSequence(nextRequest, sequence);
            // Process next sequence in queue
            this.processSequenceQueue();
            return {
                processed: true,
                sequenceName: nextRequest.sequenceName,
                success: true,
            };
        }
        catch (error) {
            console.error(`❌ SequenceOrchestrator: Failed to execute sequence ${nextRequest.sequenceName}:`, error);
            // Continue processing queue even if one sequence fails
            this.processSequenceQueue();
            return {
                processed: true,
                sequenceName: nextRequest.sequenceName,
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Create execution context for a sequence
     * @param sequenceRequest - Sequence request
     * @returns Execution context
     */
    createExecutionContext(sequenceRequest) {
        const baseContext = this.sequenceUtilities.createExecutionContext(sequenceRequest);
        // Get the actual sequence for the context
        const sequence = this.sequenceRegistry.get(sequenceRequest.sequenceId);
        if (!sequence) {
            throw new Error(`Sequence ${sequenceRequest.sequenceId} not found`);
        }
        return {
            ...baseContext,
            sequence,
            executionType: sequenceRequest.priority === "HIGH" ? "IMMEDIATE" : "CONSECUTIVE",
            priority: sequenceRequest.priority,
        };
    }
    /**
     * Generate a unique request ID
     * @param sequenceId - ID of the sequence
     * @returns Unique request ID
     */
    generateRequestId(sequenceId) {
        return `${sequenceId}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
    }
    /**
     * Log sequence not found error with helpful information
     * @param sequenceId - ID of the sequence that wasn't found
     * @param sequenceName - Name of the sequence (if available)
     */
    logSequenceNotFound(sequenceId, sequenceName) {
        console.error(`❌ SequenceOrchestrator: Sequence with ID "${sequenceId}" not found!`);
        if (sequenceName) {
            console.error(`❌ Sequence name: "${sequenceName}"`);
        }
        console.error(`❌ This means the plugin for this sequence is not loaded or registered.`);
        console.error(`❌ Available sequences:`, this.sequenceRegistry.getNames());
        if (sequenceId === "ElementLibrary.library-drop-symphony" ||
            sequenceName === "ElementLibrary.library-drop-symphony") {
            console.error(`❌ CRITICAL: ElementLibrary.library-drop-symphony not available - drag-and-drop will not work!`);
            console.error(`❌ Check plugin loading logs above for ElementLibrary.library-drop-symphony errors.`);
        }
    }
    /**
     * Handle duplicate sequence detection
     * @param sequenceId - ID of the sequence
     * @param sequenceName - Name of the sequence
     * @param deduplicationResult - Deduplication result
     * @returns Sequence start result for duplicate
     */
    handleDuplicateSequence(sequenceId, sequenceName, deduplicationResult) {
        console.warn(`🎼 SequenceOrchestrator: ${deduplicationResult.reason}`);
        // For StrictMode duplicates, return a duplicate request ID but don't execute
        const duplicateRequestId = `${sequenceId}-duplicate-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        // Emit a duplicate event for monitoring
        this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_CANCELLED, {
            sequenceId,
            sequenceName,
            requestId: duplicateRequestId,
            reason: "duplicate-request",
            hash: deduplicationResult.hash,
        });
        return {
            requestId: duplicateRequestId,
            success: false,
            isDuplicate: true,
            reason: deduplicationResult.reason,
        };
    }
    /**
     * Extract orchestration metadata from sequence request
     * @param sequenceId - ID of the sequence
     * @param sequenceName - Name of the sequence
     * @param data - Sequence data
     * @returns Orchestration metadata
     */
    extractOrchestrationMetadata(sequenceId, sequenceName, data) {
        return {
            symphonyName: this.sequenceUtilities.extractSymphonyName(sequenceName),
            resourceId: this.sequenceUtilities.extractResourceId(sequenceName, data),
            instanceId: this.sequenceUtilities.createSequenceInstanceId(sequenceName, data, "NORMAL"),
        };
    }
    /**
     * Check for resource conflicts
     * @param metadata - Orchestration metadata
     * @param priority - Sequence priority
     * @returns Resource conflict result
     */
    checkResourceConflicts(metadata, priority) {
        const delegatorResult = this.resourceDelegator.checkResourceConflict(metadata.resourceId, metadata.instanceId, priority);
        // Convert ResourceDelegator result to MusicalConductor result format
        return {
            hasConflict: delegatorResult.hasConflict,
            conflictType: delegatorResult.hasConflict ? "SAME_RESOURCE" : "NONE",
            resolution: delegatorResult.resolution === "override"
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
     * Create a sequence request object
     * @param sequenceId - ID of the sequence
     * @param sequenceName - Name of the sequence
     * @param data - Sequence data
     * @param priority - Sequence priority
     * @param requestId - Request ID
     * @param metadata - Orchestration metadata
     * @param conflictResult - Resource conflict result
     * @param sequenceHash - Sequence hash for idempotency
     * @returns Sequence request
     */
    createSequenceRequest(sequenceId, sequenceName, data, priority, requestId, metadata, conflictResult, sequenceHash) {
        return {
            sequenceId,
            sequenceName,
            data: {
                ...data,
                // MCO/MSO: Add instance and resource tracking
                instanceId: metadata.instanceId,
                symphonyName: metadata.symphonyName,
                resourceId: metadata.resourceId,
                conflictResult,
                // Phase 3: Add idempotency hash
                sequenceHash,
            },
            priority,
            requestId,
            queuedAt: performance.now(),
        };
    }
    /**
     * Record sequence execution to prevent duplicates
     * @param sequenceHash - Hash of the sequence
     */
    recordSequenceExecution(sequenceHash) {
        // This would typically be handled by the DuplicationDetector
        // For now, we'll delegate to the validator
        console.log(`🎼 SequenceOrchestrator: Recording sequence execution: ${sequenceHash}`);
    }
    /**
     * Process queue if currently idle
     */
    processQueueIfIdle() {
        if (!this.sequenceExecutor.isSequenceRunning()) {
            this.processSequenceQueue();
        }
    }
    /**
     * Emit sequence queued event
     * @param sequenceId - ID of the sequence
     * @param sequenceName - Name of the sequence
     * @param requestId - Request ID
     * @param priority - Sequence priority
     */
    emitSequenceQueuedEvent(sequenceId, sequenceName, requestId, priority) {
        this.eventBus.emit(MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_QUEUED, {
            sequenceId,
            sequenceName,
            requestId,
            priority,
            queueLength: this.executionQueue.size(),
        });
    }
    /**
     * Get debug information
     * @returns Debug orchestration information
     */
    getDebugInfo() {
        return {
            queueSize: this.executionQueue.size(),
            isExecuting: this.sequenceExecutor.isSequenceRunning(),
            currentSequence: this.sequenceExecutor.getCurrentSequence()?.sequenceName || null,
            processedSequences: 0, // Would track this in a real implementation
        };
    }
}
//# sourceMappingURL=SequenceOrchestrator.js.map