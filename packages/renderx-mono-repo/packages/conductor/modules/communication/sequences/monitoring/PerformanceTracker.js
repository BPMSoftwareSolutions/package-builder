/**
 * PerformanceTracker - Performance timing and beat execution tracking
 * Handles beat timing, execution duration tracking, and performance monitoring
 */
export class PerformanceTracker {
    beatStartTimes = new Map();
    sequenceTimings = new Map();
    completedBeats = [];
    maxHistorySize = 1000;
    /**
     * Start tracking a beat execution
     * @param sequenceName - Sequence name
     * @param beat - Beat number
     * @returns Beat key for tracking
     */
    startBeatTiming(sequenceName, beat) {
        const beatKey = `${sequenceName}-${beat}`;
        const startTime = performance.now();
        this.beatStartTimes.set(beatKey, startTime);
        console.log(`⏱️ PerformanceTracker: Started timing beat ${beat} for ${sequenceName}`);
        return beatKey;
    }
    /**
     * End tracking a beat execution
     * @param sequenceName - Sequence name
     * @param beat - Beat number
     * @returns Beat duration in milliseconds
     */
    endBeatTiming(sequenceName, beat) {
        const beatKey = `${sequenceName}-${beat}`;
        const startTime = this.beatStartTimes.get(beatKey);
        if (!startTime) {
            console.warn(`⏱️ PerformanceTracker: No start time found for beat ${beat} in ${sequenceName}`);
            return null;
        }
        const endTime = performance.now();
        const duration = endTime - startTime;
        // Record the completed beat
        const beatTiming = {
            sequenceName,
            beat,
            startTime,
            endTime,
            duration,
        };
        this.completedBeats.push(beatTiming);
        this.beatStartTimes.delete(beatKey);
        // Maintain history size limit
        if (this.completedBeats.length > this.maxHistorySize) {
            this.completedBeats = this.completedBeats.slice(-this.maxHistorySize / 2);
        }
        console.log(`⏱️ PerformanceTracker: Beat ${beat} completed in ${duration.toFixed(2)}ms`);
        return duration;
    }
    /**
     * Clean up timing data for a failed beat
     * @param sequenceName - Sequence name
     * @param beat - Beat number
     */
    cleanupFailedBeat(sequenceName, beat) {
        const beatKey = `${sequenceName}-${beat}`;
        this.beatStartTimes.delete(beatKey);
        console.warn(`⏱️ PerformanceTracker: Cleaned up failed beat ${beat} for ${sequenceName}`);
    }
    /**
     * Start tracking a sequence execution
     * @param sequenceName - Sequence name
     * @param executionId - Execution identifier
     */
    startSequenceTiming(sequenceName, executionId) {
        const startTime = performance.now();
        this.sequenceTimings.set(executionId, {
            sequenceName,
            startTime,
            beatCount: 0,
        });
        console.log(`⏱️ PerformanceTracker: Started timing sequence ${sequenceName} (${executionId})`);
    }
    /**
     * End tracking a sequence execution
     * @param executionId - Execution identifier
     * @returns Sequence duration in milliseconds
     */
    endSequenceTiming(executionId) {
        const timing = this.sequenceTimings.get(executionId);
        if (!timing) {
            console.warn(`⏱️ PerformanceTracker: No timing found for execution ${executionId}`);
            return null;
        }
        const endTime = performance.now();
        const duration = endTime - timing.startTime;
        timing.endTime = endTime;
        timing.duration = duration;
        console.log(`⏱️ PerformanceTracker: Sequence ${timing.sequenceName} completed in ${duration.toFixed(2)}ms`);
        // Clean up after recording
        this.sequenceTimings.delete(executionId);
        return duration;
    }
    /**
     * Increment beat count for a sequence
     * @param executionId - Execution identifier
     */
    incrementBeatCount(executionId) {
        const timing = this.sequenceTimings.get(executionId);
        if (timing) {
            timing.beatCount++;
        }
    }
    /**
     * Get current beat timing information
     * @param sequenceName - Sequence name
     * @param beat - Beat number
     * @returns Current timing info or null
     */
    getCurrentBeatTiming(sequenceName, beat) {
        const beatKey = `${sequenceName}-${beat}`;
        const startTime = this.beatStartTimes.get(beatKey);
        if (!startTime) {
            return null;
        }
        return {
            startTime,
            elapsed: performance.now() - startTime,
        };
    }
    /**
     * Get beat performance statistics
     * @param sequenceName - Optional sequence name filter
     * @returns Beat performance statistics
     */
    getBeatStatistics(sequenceName) {
        const filteredBeats = sequenceName
            ? this.completedBeats.filter(b => b.sequenceName === sequenceName)
            : this.completedBeats;
        if (filteredBeats.length === 0) {
            return {
                totalBeats: 0,
                averageDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                recentBeats: [],
            };
        }
        const durations = filteredBeats.map(b => b.duration).filter(d => d !== undefined);
        const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        return {
            totalBeats: filteredBeats.length,
            averageDuration,
            minDuration,
            maxDuration,
            recentBeats: filteredBeats.slice(-10), // Last 10 beats
        };
    }
    /**
     * Get active timing information
     * @returns Currently active timings
     */
    getActiveTimings() {
        const now = performance.now();
        const activeBeats = Array.from(this.beatStartTimes.entries()).map(([key, startTime]) => ({
            key,
            elapsed: now - startTime,
        }));
        const activeSequences = Array.from(this.sequenceTimings.entries()).map(([executionId, timing]) => ({
            executionId,
            sequenceName: timing.sequenceName,
            elapsed: now - timing.startTime,
        }));
        return {
            activeBeats,
            activeSequences,
        };
    }
    /**
     * Get performance warnings for long-running operations
     * @param beatThreshold - Beat duration threshold in ms (default: 5000)
     * @param sequenceThreshold - Sequence duration threshold in ms (default: 30000)
     * @returns Performance warnings
     */
    getPerformanceWarnings(beatThreshold = 5000, sequenceThreshold = 30000) {
        const warnings = [];
        const now = performance.now();
        // Check for long-running beats
        for (const [beatKey, startTime] of this.beatStartTimes.entries()) {
            const elapsed = now - startTime;
            if (elapsed > beatThreshold) {
                warnings.push(`Long-running beat: ${beatKey} (${elapsed.toFixed(0)}ms)`);
            }
        }
        // Check for long-running sequences
        for (const [executionId, timing] of this.sequenceTimings.entries()) {
            const elapsed = now - timing.startTime;
            if (elapsed > sequenceThreshold) {
                warnings.push(`Long-running sequence: ${timing.sequenceName} (${elapsed.toFixed(0)}ms)`);
            }
        }
        return warnings;
    }
    /**
     * Reset all performance tracking data
     */
    reset() {
        this.beatStartTimes.clear();
        this.sequenceTimings.clear();
        this.completedBeats = [];
        console.log("🧹 PerformanceTracker: All tracking data reset");
    }
    /**
     * Get debug information
     * @returns Debug performance information
     */
    getDebugInfo() {
        return {
            activeBeats: this.beatStartTimes.size,
            activeSequences: this.sequenceTimings.size,
            completedBeatsHistory: this.completedBeats.length,
            beatStatistics: this.getBeatStatistics(),
            warnings: this.getPerformanceWarnings(),
        };
    }
}
//# sourceMappingURL=PerformanceTracker.js.map