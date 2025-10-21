/**
 * StrictModeManager - React StrictMode handling and duplication detection
 * Handles React StrictMode duplicate detection, pattern recognition, and execution recording
 */
export class StrictModeManager {
    duplicationDetector;
    strictModePatterns = new Set([
        "double-render",
        "strict-mode",
        "development-only",
        "react-strict",
        "duplicate-effect",
        "double-execution",
    ]);
    constructor(duplicationDetector) {
        this.duplicationDetector = duplicationDetector;
    }
    /**
     * Check if a sequence request is a duplicate, considering StrictMode patterns
     * @param sequenceName - Name of the sequence
     * @param data - Sequence data
     * @param priority - Sequence priority
     * @returns Duplication check result
     */
    checkForDuplication(sequenceName, data, priority) {
        // Generate hash for the sequence request
        const hash = this.generateSequenceHash(sequenceName, data, priority);
        // Check if this is a duplicate request
        const isDuplicate = this.duplicationDetector.isDuplicateSequenceRequest(hash);
        if (!isDuplicate) {
            return {
                isDuplicate: false,
                hash,
            };
        }
        // Check if this is a StrictMode duplicate
        const strictModeResult = this.isStrictModeDuplicate(data);
        return {
            isDuplicate: true,
            hash,
            reason: strictModeResult.isStrictModeDuplicate
                ? `StrictMode duplicate detected: ${strictModeResult.patterns.join(", ")}`
                : "Duplicate sequence request detected",
            isStrictMode: strictModeResult.isStrictModeDuplicate,
        };
    }
    /**
     * Record a sequence execution to prevent future duplicates
     * @param hash - Hash of the sequence
     */
    recordSequenceExecution(hash) {
        this.duplicationDetector.recordSequenceExecution(hash);
        console.log(`🎼 StrictModeManager: Recorded sequence execution: ${hash.substring(0, 8)}...`);
    }
    /**
     * Check if data contains StrictMode patterns
     * @param data - Data to check for StrictMode patterns
     * @returns StrictMode detection result
     */
    isStrictModeDuplicate(data) {
        const detectedPatterns = [];
        // Check for common StrictMode patterns in data
        const dataString = JSON.stringify(data).toLowerCase();
        for (const pattern of this.strictModePatterns) {
            if (dataString.includes(pattern)) {
                detectedPatterns.push(pattern);
            }
        }
        // Check for React development mode indicators
        if (this.hasReactDevModeIndicators(data)) {
            detectedPatterns.push("react-dev-mode");
        }
        // Check for double execution patterns
        if (this.hasDoubleExecutionPatterns(data)) {
            detectedPatterns.push("double-execution-pattern");
        }
        // Check for timing-based duplicates (very close timestamps)
        if (this.hasTimingBasedDuplicatePattern(data)) {
            detectedPatterns.push("timing-duplicate");
        }
        const isStrictModeDuplicate = detectedPatterns.length > 0;
        return {
            isStrictModeDuplicate,
            patterns: detectedPatterns,
            reason: isStrictModeDuplicate
                ? `StrictMode patterns detected: ${detectedPatterns.join(", ")}`
                : undefined,
        };
    }
    /**
     * Generate a hash for a sequence request
     * @param sequenceName - Name of the sequence
     * @param data - Sequence data
     * @param priority - Sequence priority
     * @returns Hash string
     */
    generateSequenceHash(sequenceName, data, priority) {
        // Create a stable hash by sorting keys and stringifying
        const sortedData = this.sortObjectKeys(data);
        const hashInput = `${sequenceName}:${JSON.stringify(sortedData)}:${priority}`;
        // Simple hash function (in production, use a proper hash library)
        let hash = 0;
        for (let i = 0; i < hashInput.length; i++) {
            const char = hashInput.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    /**
     * Sort object keys recursively for consistent hashing
     * @param obj - Object to sort
     * @returns Sorted object
     */
    sortObjectKeys(obj) {
        if (obj === null || typeof obj !== "object") {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.sortObjectKeys(item));
        }
        const sortedObj = {};
        const keys = Object.keys(obj).sort();
        for (const key of keys) {
            sortedObj[key] = this.sortObjectKeys(obj[key]);
        }
        return sortedObj;
    }
    /**
     * Check for React development mode indicators
     * @param data - Data to check
     * @returns True if React dev mode indicators found
     */
    hasReactDevModeIndicators(data) {
        // Check for React development mode specific properties
        const reactDevIndicators = [
            "__reactInternalInstance",
            "_reactInternalFiber",
            "__reactInternalMemoizedUnmaskedChildContext",
            "NODE_ENV",
        ];
        const dataString = JSON.stringify(data);
        return reactDevIndicators.some((indicator) => dataString.includes(indicator));
    }
    /**
     * Check for double execution patterns
     * @param data - Data to check
     * @returns True if double execution patterns found
     */
    hasDoubleExecutionPatterns(data) {
        // Check for patterns that indicate double execution
        if (data.executionCount && data.executionCount > 1) {
            return true;
        }
        if (data.renderCount && data.renderCount > 1) {
            return true;
        }
        if (data.effectCount && data.effectCount > 1) {
            return true;
        }
        return false;
    }
    /**
     * Check for timing-based duplicate patterns
     * @param data - Data to check
     * @returns True if timing-based duplicates detected
     */
    hasTimingBasedDuplicatePattern(data) {
        if (!data.timestamp) {
            return false;
        }
        const now = Date.now();
        const timestamp = typeof data.timestamp === "number"
            ? data.timestamp
            : parseInt(data.timestamp);
        // If the timestamp is very recent (within 10ms), it might be a StrictMode duplicate
        const timeDiff = Math.abs(now - timestamp);
        return timeDiff < 10;
    }
    /**
     * Add a custom StrictMode pattern
     * @param pattern - Pattern to add
     */
    addStrictModePattern(pattern) {
        this.strictModePatterns.add(pattern.toLowerCase());
        console.log(`🎼 StrictModeManager: Added StrictMode pattern: ${pattern}`);
    }
    /**
     * Remove a StrictMode pattern
     * @param pattern - Pattern to remove
     */
    removeStrictModePattern(pattern) {
        this.strictModePatterns.delete(pattern.toLowerCase());
        console.log(`🎼 StrictModeManager: Removed StrictMode pattern: ${pattern}`);
    }
    /**
     * Get all registered StrictMode patterns
     * @returns Array of patterns
     */
    getStrictModePatterns() {
        return Array.from(this.strictModePatterns);
    }
    /**
     * Clear all recorded sequence executions
     */
    clearExecutionHistory() {
        this.duplicationDetector.reset();
        console.log("🎼 StrictModeManager: Cleared execution history");
    }
    /**
     * Get statistics about StrictMode detection
     * @returns StrictMode statistics
     */
    getStrictModeStatistics() {
        return {
            totalPatterns: this.strictModePatterns.size,
            patterns: this.getStrictModePatterns(),
            detectionEnabled: true,
        };
    }
    /**
     * Enable or disable StrictMode detection
     * @param enabled - Whether to enable StrictMode detection
     */
    setStrictModeDetection(enabled) {
        if (enabled) {
            // Re-add default patterns if they were cleared
            const defaultPatterns = [
                "double-render",
                "strict-mode",
                "development-only",
                "react-strict",
                "duplicate-effect",
                "double-execution",
            ];
            for (const pattern of defaultPatterns) {
                this.strictModePatterns.add(pattern);
            }
        }
        else {
            this.strictModePatterns.clear();
        }
        console.log(`🎼 StrictModeManager: StrictMode detection ${enabled ? "enabled" : "disabled"}`);
    }
    /**
     * Get debug information
     * @returns Debug StrictMode information
     */
    getDebugInfo() {
        return {
            strictModePatterns: this.getStrictModePatterns(),
            totalPatterns: this.strictModePatterns.size,
            detectionEnabled: this.strictModePatterns.size > 0,
            duplicationDetectorStats: {
                // Would get stats from duplicationDetector if available
                recordedExecutions: 0, // Placeholder
            },
        };
    }
}
//# sourceMappingURL=StrictModeManager.js.map