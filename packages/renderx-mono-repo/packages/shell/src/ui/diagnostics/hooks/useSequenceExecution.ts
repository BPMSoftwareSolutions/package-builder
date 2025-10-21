/**
 * useSequenceExecution Hook
 * 
 * Manages sequence execution and live monitoring.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { executeSequence, generateRequestId } from '../services';
import type { LiveExecution, AvailableSequence } from '../types';

/**
 * Hook for managing sequence execution
 * 
 * @returns Object containing execution state and control functions
 */
export function useSequenceExecution() {
  const [liveExecution, setLiveExecution] = useState<LiveExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);

  /**
   * Executes a sequence with optional parameters
   */
  const execute = useCallback(async (
    sequence: AvailableSequence,
    parameters?: Record<string, any>
  ) => {
    setIsExecuting(true);
    setError(null);

    try {
      // Generate request ID
      const requestId = generateRequestId(sequence.sequenceId);
      currentRequestIdRef.current = requestId;

      // Initialize live execution state
      const execution: LiveExecution = {
        sequenceId: sequence.sequenceId,
        pluginId: sequence.pluginId,
        requestId,
        status: 'running',
        startTime: new Date().toISOString(),
        beats: [],
        parameters
      };

      setLiveExecution(execution);

      // Execute the sequence
      await executeSequence(sequence.pluginId, sequence.sequenceId, parameters);

      // Note: The actual execution completion will be handled by event listeners
      // For now, we'll mark it as success after a short delay
      // In a real implementation, this would be driven by events
      setTimeout(() => {
        if (currentRequestIdRef.current === requestId) {
          setLiveExecution(prev => prev ? {
            ...prev,
            status: 'success',
            endTime: new Date().toISOString(),
            totalDuration: prev.startTime 
              ? new Date().getTime() - new Date(prev.startTime).getTime()
              : 0
          } : null);
          setIsExecuting(false);
        }
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute sequence');
      setLiveExecution(prev => prev ? {
        ...prev,
        status: 'error',
        endTime: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error'
      } : null);
      setIsExecuting(false);
      console.error('Failed to execute sequence:', err);
    }
  }, []);

  /**
   * Clears the current execution
   */
  const clear = useCallback(() => {
    setLiveExecution(null);
    setError(null);
    setIsExecuting(false);
    currentRequestIdRef.current = null;
  }, []);

  /**
   * Cancels the current execution (if possible)
   */
  const cancel = useCallback(() => {
    if (isExecuting) {
      setLiveExecution(prev => prev ? {
        ...prev,
        status: 'error',
        endTime: new Date().toISOString(),
        error: 'Cancelled by user'
      } : null);
      setIsExecuting(false);
      currentRequestIdRef.current = null;
    }
  }, [isExecuting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      currentRequestIdRef.current = null;
    };
  }, []);

  return {
    liveExecution,
    isExecuting,
    error,
    execute,
    clear,
    cancel
  };
}

