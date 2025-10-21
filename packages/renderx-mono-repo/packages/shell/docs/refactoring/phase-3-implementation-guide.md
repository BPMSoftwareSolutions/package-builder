# Phase 3 Implementation Guide: Custom Hooks Extraction

## Overview

This document provides detailed guidance for implementing Phase 3 of the Diagnostics Panel refactoring project (Issue #297).

## Current State (After Phase 2)

✅ **Phase 1 Complete**: Type system organized in `src/ui/diagnostics/types/`
✅ **Phase 2 Complete**: Service layer created in `src/ui/diagnostics/services/`

**Available Services**:
- `manifest.service.ts` - Plugin manifest operations
- `plugin-enrichment.service.ts` - Plugin data enrichment
- `conductor.service.ts` - Conductor introspection
- `stats.service.ts` - Statistics aggregation

## Phase 3 Goals

Extract stateful logic from DiagnosticsPanel.tsx into custom React hooks that use the services created in Phase 2.

**Expected Outcome**: Reduce DiagnosticsPanel.tsx by 200-300 lines

## Implementation Steps

### Step 1: Create Hooks Directory

```bash
mkdir -p src/ui/diagnostics/hooks
```

### Step 2: Extract useDiagnosticsData Hook

**Purpose**: Manages loading and state for all diagnostics data

**File**: `src/ui/diagnostics/hooks/useDiagnosticsData.ts`

**Responsibilities**:
- Load plugin manifest
- Enrich plugin data
- Aggregate statistics
- Handle loading states
- Handle errors

**Key Functions to Extract from DiagnosticsPanel.tsx**:
- Lines 273-306: Initialization logic in useEffect
- Uses services: `loadPluginManifest`, `enrichAllPlugins`, `aggregateAllStats`

**Hook Signature**:
```typescript
export function useDiagnosticsData(conductor: any) {
  return {
    manifest: ManifestData | null,
    interactionStats: any,
    topicsStats: any,
    pluginStats: any,
    components: ComponentDetail[],
    loading: boolean,
    error: Error | null,
    refresh: () => Promise<void>
  };
}
```

### Step 3: Extract useConductorIntrospection Hook

**Purpose**: Manages conductor introspection state

**File**: `src/ui/diagnostics/hooks/useConductorIntrospection.ts`

**Responsibilities**:
- Introspect conductor on mount and when conductor changes
- Provide conductor state data

**Key Functions to Extract**:
- Lines 198-215: introspectConductor callback
- Uses service: `introspectConductor`

**Hook Signature**:
```typescript
export function useConductorIntrospection(conductor: any) {
  return {
    introspection: ConductorIntrospection | null,
    refresh: () => void
  };
}
```

### Step 4: Extract useEventMonitoring Hook

**Purpose**: Subscribes to EventRouter topics for real-time logging

**File**: `src/ui/diagnostics/hooks/useEventMonitoring.ts`

**Responsibilities**:
- Subscribe to EventRouter topics
- Add log entries for events
- Clean up subscriptions on unmount

**Key Functions to Extract**:
- Lines 309-362: EventRouter subscription logic in useEffect

**Hook Signature**:
```typescript
export function useEventMonitoring(conductor: any, addLog: (level: string, message: string, data?: any) => void) {
  // Returns nothing, just manages subscriptions
}
```

### Step 5: Extract usePerformanceMetrics Hook

**Purpose**: Tracks performance metrics for operations

**File**: `src/ui/diagnostics/hooks/usePerformanceMetrics.ts`

**Responsibilities**:
- Track operation timings
- Calculate performance metrics
- Provide metric data

**Key State to Extract**:
- Line 197: performanceMetrics state

**Hook Signature**:
```typescript
export function usePerformanceMetrics() {
  return {
    metrics: {[key: string]: number},
    trackMetric: (key: string, value: number) => void,
    clearMetrics: () => void
  };
}
```

### Step 6: Extract usePluginLoadingStats Hook

**Purpose**: Manages plugin loading statistics

**File**: `src/ui/diagnostics/hooks/usePluginLoadingStats.ts`

**Responsibilities**:
- Track total plugins
- Track loaded/failed plugins
- Track loading time

**Key State to Extract**:
- Lines 187-192: loadingStats state

**Hook Signature**:
```typescript
export function usePluginLoadingStats() {
  return {
    stats: PluginLoadingStats,
    updateStats: (updates: Partial<PluginLoadingStats>) => void,
    resetStats: () => void
  };
}
```

### Step 7: Extract useDiagnosticsLogs Hook

**Purpose**: Manages log entries

**File**: `src/ui/diagnostics/hooks/useDiagnosticsLogs.ts`

**Responsibilities**:
- Maintain log entries
- Add new log entries
- Limit log history

**Key Functions to Extract**:
- Lines 58-66: addLog callback

**Hook Signature**:
```typescript
export function useDiagnosticsLogs() {
  return {
    logs: LogEntry[],
    addLog: (level: LogEntry['level'], message: string, data?: any) => void,
    clearLogs: () => void
  };
}
```

### Step 8: Create Barrel Export

**File**: `src/ui/diagnostics/hooks/index.ts`

```typescript
export { useDiagnosticsData } from './useDiagnosticsData';
export { useConductorIntrospection } from './useConductorIntrospection';
export { useEventMonitoring } from './useEventMonitoring';
export { usePerformanceMetrics } from './usePerformanceMetrics';
export { usePluginLoadingStats } from './usePluginLoadingStats';
export { useDiagnosticsLogs } from './useDiagnosticsLogs';
```

### Step 9: Refactor DiagnosticsPanel.tsx

Replace inline state management and callbacks with custom hooks:

**Before** (lines 26-66):
```typescript
const [manifest, setManifest] = useState<ManifestData | null>(null);
const [logs, setLogs] = useState<LogEntry[]>([]);
const [interactionStats, setInteractionStats] = useState<any>(null);
// ... many more useState calls
const addLog = useCallback((level, message, data) => { ... }, []);
```

**After**:
```typescript
const { logs, addLog, clearLogs } = useDiagnosticsLogs();
const { stats: loadingStats, updateStats: updateLoadingStats } = usePluginLoadingStats();
const { metrics: performanceMetrics, trackMetric } = usePerformanceMetrics();
const { introspection: conductorIntrospection, refresh: refreshConductor } = useConductorIntrospection(conductor);
const {
  manifest,
  interactionStats,
  topicsStats,
  pluginStats,
  components,
  loading,
  error,
  refresh: refreshData
} = useDiagnosticsData(conductor);

useEventMonitoring(conductor, addLog);
```

### Step 10: Add Tests for Hooks

Create test files in `tests/hooks/`:
- `useDiagnosticsData.spec.ts`
- `useConductorIntrospection.spec.ts`
- `useEventMonitoring.spec.ts`
- `usePerformanceMetrics.spec.ts`
- `usePluginLoadingStats.spec.ts`
- `useDiagnosticsLogs.spec.ts`

Use `@testing-library/react-hooks` for testing custom hooks.

### Step 11: Verify and Commit

1. Run tests: `npm test`
2. Run lint: `npm run lint`
3. Verify all 102 tests pass
4. Commit changes:
```bash
git add -A
git commit -m "feat(#297): Phase 3 - Extract custom hooks

- Created src/ui/diagnostics/hooks/ directory
- Extracted 6 custom hooks from DiagnosticsPanel.tsx
- Hooks use services from Phase 2
- Refactored DiagnosticsPanel to use hooks
- All tests passing
- No lint errors

Hooks provide clean separation of stateful logic from UI,
preparing for component decomposition in Phase 4."
```

5. Push and create PR:
```bash
git push -u origin refactor/diagnostics-phase3-hooks-297
```

## Expected Results

- DiagnosticsPanel.tsx: 1140 → ~850 lines (290 lines reduced)
- Created ~400-500 lines of reusable hook code
- Cleaner component code
- Easier to test stateful logic
- All tests passing

## Next Phase

After Phase 3 is complete and merged, proceed to Phase 4: Component Decomposition.

See `docs/refactoring/diagnostics-modularity-strategy.md` for the complete strategy.

