/**
 * DuplicationDetector - Duplicate sequence detection and StrictMode handling
 * Handles idempotency, duplicate detection, and React StrictMode protection
 */

export interface DuplicationConfig {
  idempotencyWindow: number; // Time window for duplicate detection (ms)
  maxHashSetSize: number; // Maximum size of executed hashes set
  strictModeThreshold: number; // Time threshold for StrictMode detection (ms)
}

export interface DuplicationResult {
  isDuplicate: boolean;
  timeSinceLastExecution: number;
  reason: string;
  isStrictMode?: boolean;
}

export class DuplicationDetector {
  private executedSequenceHashes: Set<string> = new Set();
  private recentExecutions: Map<string, number> = new Map();
  private config: DuplicationConfig;

  constructor(config?: Partial<DuplicationConfig>) {
    this.config = {
      idempotencyWindow: 5000, // 5 second window for duplicate detection
      maxHashSetSize: 1000, // Maximum size to prevent memory leaks
      strictModeThreshold: 100, // 100ms threshold for StrictMode detection
      ...config,
    };
  }

  /**
   * Check if a sequence request is a duplicate
   * @param sequenceHash - Hash of the sequence request
   * @returns Duplication analysis result
   */
  isDuplicateSequenceRequest(sequenceHash: string): DuplicationResult {
    const now = performance.now();
    const lastExecution = this.recentExecutions.get(sequenceHash);

    if (!lastExecution) {
      return {
        isDuplicate: false,
        timeSinceLastExecution: 0,
        reason: "First execution of this sequence",
      };
    }

    const timeSinceLastExecution = now - lastExecution;
    const isDuplicate = timeSinceLastExecution < this.config.idempotencyWindow;

    if (isDuplicate) {
      const isStrictMode = timeSinceLastExecution < this.config.strictModeThreshold;
      
      return {
        isDuplicate: true,
        timeSinceLastExecution,
        reason: isStrictMode 
          ? `React StrictMode duplicate detected (${timeSinceLastExecution.toFixed(0)}ms since last)`
          : `Duplicate within idempotency window (${timeSinceLastExecution.toFixed(0)}ms since last)`,
        isStrictMode,
      };
    }

    return {
      isDuplicate: false,
      timeSinceLastExecution,
      reason: `Outside idempotency window (${timeSinceLastExecution.toFixed(0)}ms since last)`,
    };
  }

  /**
   * Record a sequence execution
   * @param sequenceHash - Hash of the sequence request
   */
  recordSequenceExecution(sequenceHash: string): void {
    const now = performance.now();
    this.recentExecutions.set(sequenceHash, now);
    this.executedSequenceHashes.add(sequenceHash);

    // Clean up old entries to prevent memory leaks
    this.cleanupOldExecutionRecords();

    console.log(
      `🔍 DuplicationDetector: Recorded execution of sequence hash: ${sequenceHash.substring(0, 8)}...`
    );
  }

  /**
   * Check if data indicates a StrictMode duplicate
   * @param data - Sequence data to analyze
   * @returns True if likely StrictMode duplicate
   */
  isStrictModeDuplicate(data: any): boolean {
    // Check for rapid successive calls (common in StrictMode)
    const now = performance.now();
    if (data.timestamp && typeof data.timestamp === "number") {
      const timeDiff = now - data.timestamp;
      if (timeDiff < this.config.strictModeThreshold) {
        console.warn(
          `🔍 DuplicationDetector: StrictMode duplicate detected - rapid succession (${timeDiff.toFixed(0)}ms)`
        );
        return true;
      }
    }

    // Check for React development mode indicators
    if (data._reactInternalFiber || data._reactInternalInstance) {
      console.warn(
        "🔍 DuplicationDetector: StrictMode duplicate detected - React internal properties"
      );
      return true;
    }

    // Check for development mode environment
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
      // In development mode, be more lenient with duplicate detection
      return false;
    }

    return false;
  }

  /**
   * Generate a hash for sequence request data
   * @param sequenceName - Sequence name
   * @param data - Sequence data
   * @returns Hash string
   */
  generateSequenceHash(sequenceName: string, data: any): string {
    try {
      // Create a stable hash based on sequence name and data
      const dataString = JSON.stringify(data, Object.keys(data).sort());
      const combined = `${sequenceName}:${dataString}`;
      
      // Simple hash function (for production, consider using a proper hash library)
      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return hash.toString(36); // Convert to base36 for shorter string
    } catch (error) {
      console.warn("🔍 DuplicationDetector: Failed to generate hash, using fallback:", error);
      return `${sequenceName}-${Date.now()}-${Math.random()}`;
    }
  }

  /**
   * Clean up old execution records to prevent memory leaks
   */
  private cleanupOldExecutionRecords(): void {
    const now = performance.now();
    const cutoffTime = now - this.config.idempotencyWindow;

    // Remove old entries from recent executions
    for (const [hash, timestamp] of this.recentExecutions.entries()) {
      if (timestamp < cutoffTime) {
        this.recentExecutions.delete(hash);
      }
    }

    // Limit the size of executedSequenceHashes to prevent unbounded growth
    if (this.executedSequenceHashes.size > this.config.maxHashSetSize) {
      const hashArray = Array.from(this.executedSequenceHashes);
      const toKeep = hashArray.slice(-this.config.maxHashSetSize / 2); // Keep the most recent half
      this.executedSequenceHashes = new Set(toKeep);
      
      console.log(
        `🧹 DuplicationDetector: Cleaned up hash set, kept ${toKeep.length} most recent entries`
      );
    }
  }

  /**
   * Get duplication statistics
   * @returns Duplication detection statistics
   */
  getStatistics(): {
    totalHashesTracked: number;
    recentExecutionsTracked: number;
    oldestRecentExecution: number | null;
    newestRecentExecution: number | null;
    memoryUsageEstimate: number;
  } {
    const now = performance.now();
    const timestamps = Array.from(this.recentExecutions.values());
    
    return {
      totalHashesTracked: this.executedSequenceHashes.size,
      recentExecutionsTracked: this.recentExecutions.size,
      oldestRecentExecution: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestRecentExecution: timestamps.length > 0 ? Math.max(...timestamps) : null,
      memoryUsageEstimate: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage of the detector
   * @returns Estimated memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    const hashSetSize = this.executedSequenceHashes.size * 50; // ~50 bytes per hash
    const recentExecutionsSize = this.recentExecutions.size * 60; // ~60 bytes per entry
    return hashSetSize + recentExecutionsSize;
  }

  /**
   * Update configuration
   * @param newConfig - New configuration values
   */
  updateConfig(newConfig: Partial<DuplicationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔍 DuplicationDetector: Configuration updated:", this.config);
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): DuplicationConfig {
    return { ...this.config };
  }

  /**
   * Check if a hash has been executed before
   * @param sequenceHash - Hash to check
   * @returns True if hash has been executed
   */
  hasBeenExecuted(sequenceHash: string): boolean {
    return this.executedSequenceHashes.has(sequenceHash);
  }

  /**
   * Get recent execution history
   * @param limit - Maximum number of entries to return
   * @returns Recent execution history
   */
  getRecentExecutions(limit: number = 10): Array<{ hash: string; timestamp: number; age: number }> {
    const now = performance.now();
    return Array.from(this.recentExecutions.entries())
      .map(([hash, timestamp]) => ({
        hash: hash.substring(0, 8) + "...", // Truncate for privacy
        timestamp,
        age: now - timestamp,
      }))
      .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
      .slice(0, limit);
  }

  /**
   * Reset all duplication detection data
   */
  reset(): void {
    this.executedSequenceHashes.clear();
    this.recentExecutions.clear();
    console.log("🧹 DuplicationDetector: All detection data reset");
  }

  /**
   * Get debug information
   * @returns Debug information about duplication detection
   */
  getDebugInfo(): {
    config: DuplicationConfig;
    statistics: ReturnType<DuplicationDetector['getStatistics']>;
    recentExecutions: ReturnType<DuplicationDetector['getRecentExecutions']>;
  } {
    return {
      config: this.getConfig(),
      statistics: this.getStatistics(),
      recentExecutions: this.getRecentExecutions(20),
    };
  }
}
