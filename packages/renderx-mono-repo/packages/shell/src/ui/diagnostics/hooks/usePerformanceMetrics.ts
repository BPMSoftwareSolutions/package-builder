/**
 * usePerformanceMetrics Hook
 * 
 * Tracks performance metrics for operations.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 3 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/phase-3-implementation-guide.md
 */

import { useState, useCallback } from 'react';

/**
 * Hook for tracking performance metrics
 * 
 * @returns Object containing metrics and tracking functions
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<{[key: string]: number}>({});

  /**
   * Tracks a performance metric
   * 
   * @param key - Metric identifier
   * @param value - Metric value (typically in milliseconds)
   */
  const trackMetric = useCallback((key: string, value: number) => {
    setMetrics(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Clears all performance metrics
   */
  const clearMetrics = useCallback(() => {
    setMetrics({});
  }, []);

  /**
   * Gets a specific metric value
   * 
   * @param key - Metric identifier
   * @returns Metric value or undefined if not found
   */
  const getMetric = useCallback((key: string): number | undefined => {
    return metrics[key];
  }, [metrics]);

  return {
    metrics,
    trackMetric,
    clearMetrics,
    getMetric
  };
}

