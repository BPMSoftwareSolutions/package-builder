/**
 * ExecutionQueue - Manages sequential orchestration of musical sequences
 * Provides priority-based queue management for sequence execution
 */

import type { SequenceRequest, SequencePriority } from "../SequenceTypes.js";
import { SEQUENCE_PRIORITIES } from "../SequenceTypes.js";

export interface QueueStatus {
  pending: number;
  executing: number;
  completed: number;
  length: number;
  activeSequence: string | null;
}

export class ExecutionQueue {
  private queue: SequenceRequest[] = [];
  private priorities: Map<string, SequencePriority> = new Map();
  private completedCount: number = 0;
  private currentlyExecuting: SequenceRequest | null = null;

  /**
   * Add a sequence request to the queue
   * @param request - The sequence request to enqueue
   */
  enqueue(request: SequenceRequest): void {
    if (!request) {
      throw new Error("Request cannot be null or undefined");
    }

    // Set priority if specified
    if (request.priority) {
      this.priorities.set(request.requestId, request.priority);
    }

    // Insert based on priority
    this.insertByPriority(request);

    console.log(
      `🎼 ExecutionQueue: Enqueued "${request.sequenceName}" with priority ${
        request.priority || "NORMAL"
      } (Queue size: ${this.queue.length})`
    );
  }

  /**
   * Remove and return the next sequence request from the queue
   * @returns The next sequence request or null if queue is empty
   */
  dequeue(): SequenceRequest | null {
    if (this.queue.length === 0) {
      return null;
    }

    const request = this.queue.shift()!;
    console.log(`🎼 ExecutionQueue: Dequeued "${request.sequenceName}"`);

    return request;
  }

  /**
   * Peek at the next sequence request without removing it
   * @returns The next sequence request or null if queue is empty
   */
  peek(): SequenceRequest | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * Clear all requests from the queue
   * @returns Number of requests that were cleared
   */
  clear(): number {
    const clearedCount = this.queue.length;
    this.queue = [];
    this.priorities.clear();

    console.log(
      `🎼 ExecutionQueue: Cleared ${clearedCount} requests from queue`
    );
    return clearedCount;
  }

  /**
   * Get the current queue status
   * @returns Queue status information
   */
  getStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      executing: this.currentlyExecuting ? 1 : 0,
      completed: this.completedCount,
      length: this.queue.length,
      activeSequence: this.currentlyExecuting?.sequenceName || null,
    };
  }

  /**
   * Check if the queue is empty
   * @returns True if the queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get the current queue size
   * @returns Number of requests in the queue
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Set the currently executing request
   * @param request - The request that is now executing
   */
  setCurrentlyExecuting(request: SequenceRequest | null): void {
    this.currentlyExecuting = request;

    if (request) {
      console.log(`🎼 ExecutionQueue: Now executing "${request.sequenceName}"`);
    } else {
      console.log(`🎼 ExecutionQueue: No sequence currently executing`);
    }
  }

  /**
   * Mark a sequence as completed
   * @param request - The completed request
   */
  markCompleted(request: SequenceRequest): void {
    this.completedCount++;

    if (this.currentlyExecuting?.requestId === request.requestId) {
      this.currentlyExecuting = null;
    }

    console.log(
      `🎼 ExecutionQueue: Marked "${request.sequenceName}" as completed (Total completed: ${this.completedCount})`
    );
  }

  /**
   * Get all queued sequence requests
   * @returns Array of queued requests
   */
  getQueuedRequests(): SequenceRequest[] {
    return [...this.queue]; // Return a copy to prevent external modification
  }

  /**
   * Get the currently executing request
   * @returns The currently executing request or null
   */
  getCurrentlyExecuting(): SequenceRequest | null {
    return this.currentlyExecuting;
  }

  /**
   * Set priority for a specific event type
   * @param eventType - The event type
   * @param priority - The priority level
   */
  setPriority(eventType: string, priority: SequencePriority): void {
    this.priorities.set(eventType, priority);
    console.log(
      `🎼 ExecutionQueue: Set priority for "${eventType}" to ${priority}`
    );
  }

  /**
   * Get priority for a specific event type
   * @param eventType - The event type
   * @returns The priority level or NORMAL if not set
   */
  getPriority(eventType: string): SequencePriority {
    return this.priorities.get(eventType) || SEQUENCE_PRIORITIES.NORMAL;
  }

  /**
   * Insert a request into the queue based on priority
   * @param request - The request to insert
   */
  private insertByPriority(request: SequenceRequest): void {
    const priority = request.priority || SEQUENCE_PRIORITIES.NORMAL;

    // HIGH priority goes to the front
    if (priority === SEQUENCE_PRIORITIES.HIGH) {
      this.queue.unshift(request);
      return;
    }

    // CHAINED priority goes after HIGH but before NORMAL
    if (priority === SEQUENCE_PRIORITIES.CHAINED) {
      // Find the first non-HIGH priority item
      let insertIndex = 0;
      while (
        insertIndex < this.queue.length &&
        this.queue[insertIndex].priority === SEQUENCE_PRIORITIES.HIGH
      ) {
        insertIndex++;
      }
      this.queue.splice(insertIndex, 0, request);
      return;
    }

    // NORMAL priority goes to the end
    this.queue.push(request);
  }

  /**
   * Get queue statistics
   * @returns Statistics about the queue
   */
  getStatistics(): {
    totalEnqueued: number;
    totalCompleted: number;
    currentQueueLength: number;
    priorityDistribution: Record<string, number>;
  } {
    const priorityDistribution: Record<string, number> = {};

    this.queue.forEach((request) => {
      const priority = request.priority || SEQUENCE_PRIORITIES.NORMAL;
      priorityDistribution[priority] =
        (priorityDistribution[priority] || 0) + 1;
    });

    return {
      totalEnqueued:
        this.completedCount +
        this.queue.length +
        (this.currentlyExecuting ? 1 : 0),
      totalCompleted: this.completedCount,
      currentQueueLength: this.queue.length,
      priorityDistribution,
    };
  }

  /**
   * Find requests by sequence name
   * @param sequenceName - The sequence name to search for
   * @returns Array of matching requests
   */
  findBySequenceName(sequenceName: string): SequenceRequest[] {
    return this.queue.filter(
      (request) => request.sequenceName === sequenceName
    );
  }

  /**
   * Remove requests by sequence name
   * @param sequenceName - The sequence name to remove
   * @returns Number of requests removed
   */
  removeBySequenceName(sequenceName: string): number {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(
      (request) => request.sequenceName !== sequenceName
    );
    const removedCount = initialLength - this.queue.length;

    if (removedCount > 0) {
      console.log(
        `🎼 ExecutionQueue: Removed ${removedCount} requests for sequence "${sequenceName}"`
      );
    }

    return removedCount;
  }
}
