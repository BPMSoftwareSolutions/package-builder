/**
 * Diagnostics Hooks
 * 
 * Barrel export for all diagnostics custom hooks.
 * These hooks manage stateful logic for the diagnostics panel.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/phase-3-implementation-guide.md
 */

export { useDiagnosticsData } from './useDiagnosticsData';
export { useConductorIntrospection } from './useConductorIntrospection';
export { useEventMonitoring } from './useEventMonitoring';
export { usePerformanceMetrics } from './usePerformanceMetrics';
export { usePluginLoadingStats } from './usePluginLoadingStats';
export { useDiagnosticsLogs } from './useDiagnosticsLogs';
export { useLogParser } from './useLogParser';
export { useSequenceList } from './useSequenceList';
export { useSequenceExecution } from './useSequenceExecution';
export { useExecutionHistory } from './useExecutionHistory';

