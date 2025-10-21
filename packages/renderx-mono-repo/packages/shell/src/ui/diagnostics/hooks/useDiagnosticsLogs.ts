/**
 * useDiagnosticsLogs Hook
 * 
 * Manages log entries for the diagnostics panel.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 3 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/phase-3-implementation-guide.md
 */

import { useState, useCallback } from 'react';
import type { LogEntry } from '../types';

/**
 * Hook for managing diagnostics log entries
 * 
 * @returns Object containing logs array and log management functions
 */
export function useDiagnosticsLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  /**
   * Adds a new log entry
   * Keeps only the last 100 log entries
   * 
   * @param level - Log level (info, warn, error)
   * @param message - Log message
   * @param data - Optional additional data
   */
  const addLog = useCallback((level: LogEntry['level'], message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    };
    setLogs(prev => [...prev.slice(-99), entry]); // Keep last 100 logs
  }, []);

  /**
   * Clears all log entries
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs
  };
}

