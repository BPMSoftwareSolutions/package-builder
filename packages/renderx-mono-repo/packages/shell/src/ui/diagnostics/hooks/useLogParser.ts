/**
 * useLogParser Hook
 * 
 * Manages state for parsing sequence execution logs.
 * Part of the Diagnostic Sequence Player MVP (Issue #305).
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 */

import { useState, useCallback } from 'react';
import { parseLog, calculateExecutionStats, exportAsJson, convertLogToJson } from '../services';
import type { ParsedExecution, LogInput, ExecutionStats } from '../types';

/**
 * Hook for managing log parsing state and operations
 * 
 * @returns Object containing parsed execution, stats, and parsing functions
 */
export function useLogParser() {
  const [execution, setExecution] = useState<ParsedExecution | null>(null);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoConverted, setAutoConverted] = useState(false);
  const [allExecutions, setAllExecutions] = useState<ParsedExecution[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Parses log input and updates state
   * Automatically detects and converts console log format if needed
   * Supports multiple sequences
   *
   * @param input - Log input containing content and format
   */
  const parse = useCallback((input: LogInput) => {
    setIsLoading(true);
    setError(null);
    setAutoConverted(false);
    setCurrentIndex(0);

    try {
      // First, try to parse as JSON array (from log converter)
      if (input.format === 'json') {
        try {
          const parsed = JSON.parse(input.content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // It's an array of executions - validate and use all
            const validExecutions: ParsedExecution[] = [];
            for (const item of parsed) {
              if (item.sequenceId && item.pluginId && item.requestId) {
                validExecutions.push(item as ParsedExecution);
              }
            }

            if (validExecutions.length > 0) {
              setAllExecutions(validExecutions);
              setExecution(validExecutions[0]);
              setStats(calculateExecutionStats(validExecutions[0]));
              setError(null);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Not a valid JSON array, continue with normal parsing
        }
      }

      // Normal single-execution parsing
      const result = parseLog(input);

      if (result.success && result.execution) {
        // Single execution from parseLog
        setAllExecutions([result.execution]);
        setExecution(result.execution);
        setStats(calculateExecutionStats(result.execution));
        setError(null);
      } else {
        // If parsing failed, try auto-converting from console log format
        try {
          const executions = convertLogToJson(input.content);
          if (executions.length > 0) {
            // Successfully converted from console log format
            setAllExecutions(executions);
            setExecution(executions[0]); // Show first execution
            setStats(calculateExecutionStats(executions[0]));
            setError(null);
            setAutoConverted(true);
            return;
          }
        } catch {
          // Conversion also failed, show original error
        }

        setAllExecutions([]);
        setExecution(null);
        setStats(null);
        setError(result.error || 'Unknown parsing error');
      }
    } catch (err) {
      setAllExecutions([]);
      setExecution(null);
      setStats(null);
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Parses JSON log content
   * 
   * @param content - JSON string containing execution data
   */
  const parseJson = useCallback((content: string) => {
    parse({ content, format: 'json' });
  }, [parse]);

  /**
   * Parses text log content
   * 
   * @param content - Text string containing execution data
   */
  const parseText = useCallback((content: string) => {
    parse({ content, format: 'text' });
  }, [parse]);

  /**
   * Navigates to a specific sequence by index
   */
  const goToSequence = useCallback((index: number) => {
    if (index >= 0 && index < allExecutions.length) {
      setCurrentIndex(index);
      setExecution(allExecutions[index]);
      setStats(calculateExecutionStats(allExecutions[index]));
    }
  }, [allExecutions]);

  /**
   * Navigates to the next sequence
   */
  const nextSequence = useCallback(() => {
    if (currentIndex < allExecutions.length - 1) {
      goToSequence(currentIndex + 1);
    }
  }, [currentIndex, allExecutions.length, goToSequence]);

  /**
   * Navigates to the previous sequence
   */
  const prevSequence = useCallback(() => {
    if (currentIndex > 0) {
      goToSequence(currentIndex - 1);
    }
  }, [currentIndex, goToSequence]);

  /**
   * Clears the current parsed execution and stats
   */
  const clear = useCallback(() => {
    setExecution(null);
    setStats(null);
    setError(null);
    setAutoConverted(false);
    setAllExecutions([]);
    setCurrentIndex(0);
  }, []);

  /**
   * Exports the current execution as JSON string
   * 
   * @returns JSON string or null if no execution
   */
  const exportJson = useCallback((): string | null => {
    if (!execution) return null;
    return exportAsJson(execution);
  }, [execution]);

  return {
    execution,
    stats,
    error,
    isLoading,
    autoConverted,
    allExecutions,
    currentIndex,
    totalSequences: allExecutions.length,
    hasMultipleSequences: allExecutions.length > 1,
    parse,
    parseJson,
    parseText,
    clear,
    exportJson,
    goToSequence,
    nextSequence,
    prevSequence
  };
}

