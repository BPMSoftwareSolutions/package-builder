# Diagnostics Panel Modularity Refactoring Strategy

## Executive Summary

The DiagnosticsPanel.tsx has grown to 1290 lines and needs refactoring for maintainability, scalability, and eventual extraction into a separate package. This document outlines a comprehensive strategy to modularize the diagnostics code while maintaining functionality and preparing for future enhancements (Issue #283).

## Current State Analysis

### File Structure (Current)
```
src/ui/diagnostics/
├── DiagnosticsPanel.tsx (1290 lines - BLOATED)
├── DiagnosticsOverlay.tsx
├── diagnostics.css
└── index.ts

src/ui/inspection/ (Already modularized - will be moved)
├── InspectionPanel.tsx
├── PluginInfoInspector.tsx
├── ActionButton.tsx
├── CodeBlock.tsx
├── CollapsibleSection.tsx
├── JSONViewer.tsx
├── RelativeTime.tsx
├── inspection.css
└── index.ts

src/ui/
└── PluginTreeExplorer.tsx (1006 lines - Also needs attention)
```

### File Structure (After Refactoring)
```
src/ui/diagnostics/
├── types/
│   ├── index.ts
│   ├── plugin.types.ts
│   ├── manifest.types.ts
│   ├── runtime.types.ts
│   ├── ui-config.types.ts
│   ├── conductor.types.ts
│   ├── stats.types.ts
│   └── log.types.ts
├── services/
│   ├── index.ts
│   ├── manifest.service.ts
│   ├── stats.service.ts
│   ├── conductor.service.ts
│   ├── plugin-enrichment.service.ts
│   └── sequence-loader.service.ts
├── hooks/
│   ├── index.ts
│   ├── useDiagnosticsData.ts
│   ├── usePluginStats.ts
│   ├── useConductorIntrospection.ts
│   ├── useEventMonitoring.ts
│   ├── usePerformanceMetrics.ts
│   └── useTreeNavigation.ts
├── components/
│   ├── index.ts
│   ├── DiagnosticsHeader.tsx
│   ├── DiagnosticsToolbar.tsx
│   ├── shared/                        # ← Moved from src/ui/inspection/
│   │   ├── index.ts
│   │   ├── InspectionPanel.tsx
│   │   ├── PluginInfoInspector.tsx
│   │   ├── ActionButton.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── CollapsibleSection.tsx
│   │   ├── JSONViewer.tsx
│   │   ├── RelativeTime.tsx
│   │   └── inspection.css
│   ├── StatsOverview/
│   │   ├── index.ts
│   │   ├── StatsOverview.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── MetricCard.tsx
│   │   └── stats-overview.css
│   ├── ContentPanels/
│   │   ├── index.ts
│   │   ├── PluginsPanel.tsx
│   │   ├── TopicsPanel.tsx
│   │   ├── RoutesPanel.tsx
│   │   ├── ComponentsPanel.tsx
│   │   ├── ConductorPanel.tsx
│   │   └── PerformancePanel.tsx
│   ├── LogsPanel/
│   │   ├── index.ts
│   │   ├── LogsPanel.tsx
│   │   ├── LogEntry.tsx
│   │   └── logs-panel.css
│   └── FooterPanel/
│       ├── index.ts
│       ├── FooterPanel.tsx
│       └── footer-panel.css
├── tree/
│   ├── index.ts
│   ├── PluginTreeExplorer.tsx (< 200 lines)
│   ├── TreeNode.tsx
│   ├── TreeSearch.tsx
│   ├── TreeFilters.tsx
│   ├── nodes/
│   │   ├── PluginNode.tsx
│   │   ├── TopicNode.tsx
│   │   ├── RouteNode.tsx
│   │   ├── SequenceNode.tsx
│   │   └── ComponentNode.tsx
│   └── tree.css
├── DiagnosticsPanel.tsx (< 200 lines - orchestrator)
├── DiagnosticsOverlay.tsx
├── diagnostics.css
└── index.ts
```

### Problems Identified

1. **Type Definitions Scattered**: 15+ interfaces defined inline in DiagnosticsPanel.tsx
2. **Mixed Concerns**: Data fetching, state management, and UI rendering all in one file
3. **Duplicate Types**: Same interfaces repeated in PluginTreeExplorer.tsx
4. **Complex State**: 15+ useState hooks in a single component
5. **Large Render Methods**: Multiple 100+ line conditional rendering blocks
6. **No Separation of Business Logic**: Data enrichment, introspection, and stats calculation mixed with UI
7. **Hard to Test**: Monolithic structure makes unit testing difficult
8. **Hard to Extract**: Tightly coupled to host-specific imports

## Refactoring Goals

1. **Modularity**: Break down into focused, single-responsibility modules
2. **Reusability**: Create composable components and hooks
3. **Testability**: Enable easy unit testing of business logic
4. **Maintainability**: Clear separation of concerns
5. **Scalability**: Support future features from Issue #283
6. **Extractability**: Prepare for eventual package extraction

## Proposed Architecture

### Phase 1: Type System Organization

**Goal**: Centralize and organize all type definitions

**Structure**:
```
src/ui/diagnostics/types/
├── index.ts (barrel export)
├── plugin.types.ts
├── manifest.types.ts
├── runtime.types.ts
├── ui-config.types.ts
├── conductor.types.ts
├── stats.types.ts
└── log.types.ts
```

**Benefits**:
- Single source of truth for types
- Easy to import and reuse
- Eliminates duplication between DiagnosticsPanel and PluginTreeExplorer
- Supports future type extensions for Issue #283 features

### Phase 2: Data Layer Separation

**Goal**: Extract all data fetching and transformation logic

**Structure**:
```
src/ui/diagnostics/services/
├── index.ts
├── manifest.service.ts
├── stats.service.ts
├── conductor.service.ts
├── plugin-enrichment.service.ts
└── sequence-loader.service.ts
```

**Responsibilities**:
- `manifest.service.ts`: Load and parse plugin manifests
- `stats.service.ts`: Aggregate statistics from various sources
- `conductor.service.ts`: Introspect conductor state
- `plugin-enrichment.service.ts`: Enrich plugin data with runtime info
- `sequence-loader.service.ts`: Load sequence catalogs from JSON

**Benefits**:
- Testable business logic
- Reusable across components
- Clear data flow
- Easy to mock for testing

### Phase 3: Custom Hooks Extraction

**Goal**: Extract stateful logic into reusable hooks

**Structure**:
```
src/ui/diagnostics/hooks/
├── index.ts
├── useDiagnosticsData.ts
├── usePluginStats.ts
├── useConductorIntrospection.ts
├── useEventMonitoring.ts
├── usePerformanceMetrics.ts
└── useTreeNavigation.ts
```

**Example Hook**:
```typescript
// useDiagnosticsData.ts
export function useDiagnosticsData(conductor: any) {
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Load and enrich data
  }, [conductor]);

  return { manifest, loading, error, refresh };
}
```

**Benefits**:
- Reusable state logic
- Easier testing
- Cleaner component code
- Follows React best practices

### Phase 4: Component Decomposition

**Goal**: Break DiagnosticsPanel into focused sub-components and consolidate inspection components

**Structure**:
```
src/ui/diagnostics/components/
├── index.ts
├── DiagnosticsHeader.tsx
├── DiagnosticsToolbar.tsx
├── shared/                        # ← Move from src/ui/inspection/
│   ├── index.ts
│   ├── InspectionPanel.tsx
│   ├── PluginInfoInspector.tsx
│   ├── ActionButton.tsx
│   ├── CodeBlock.tsx
│   ├── CollapsibleSection.tsx
│   ├── JSONViewer.tsx
│   ├── RelativeTime.tsx
│   └── inspection.css
├── StatsOverview/
│   ├── index.ts
│   ├── StatsOverview.tsx
│   ├── ProgressRing.tsx
│   ├── MetricCard.tsx
│   └── stats-overview.css
├── ContentPanels/
│   ├── index.ts
│   ├── PluginsPanel.tsx
│   ├── TopicsPanel.tsx
│   ├── RoutesPanel.tsx
│   ├── ComponentsPanel.tsx
│   ├── ConductorPanel.tsx
│   └── PerformancePanel.tsx
├── LogsPanel/
│   ├── index.ts
│   ├── LogsPanel.tsx
│   ├── LogEntry.tsx
│   └── logs-panel.css
└── FooterPanel/
    ├── index.ts
    ├── FooterPanel.tsx
    └── footer-panel.css
```

**Benefits**:
- Each component < 200 lines
- Clear responsibilities
- Easy to test individually
- Supports lazy loading
- Easier to add new panels for Issue #283
- All diagnostics-related components in one place
- Self-contained module ready for package extraction

### Phase 5: Tree Explorer Refactoring

**Goal**: Modularize PluginTreeExplorer.tsx (1006 lines)

**Structure**:
```
src/ui/diagnostics/tree/
├── index.ts
├── PluginTreeExplorer.tsx (orchestrator, < 200 lines)
├── TreeNode.tsx
├── TreeSearch.tsx
├── TreeFilters.tsx
├── nodes/
│   ├── PluginNode.tsx
│   ├── TopicNode.tsx
│   ├── RouteNode.tsx
│   ├── SequenceNode.tsx
│   └── ComponentNode.tsx
└── tree.css
```

**Benefits**:
- Supports deep hierarchical navigation (Issue #283)
- Easy to add new node types
- Testable node rendering logic
- Cleaner tree structure

## Implementation Plan

### Step 1: Create Type System (1-2 days)
- [ ] Create `types/` directory
- [ ] Extract all interfaces from DiagnosticsPanel.tsx
- [ ] Extract all interfaces from PluginTreeExplorer.tsx
- [ ] Organize into logical type files
- [ ] Create barrel exports
- [ ] Update imports in existing files

### Step 2: Extract Services (2-3 days)
- [ ] Create `services/` directory
- [ ] Extract data fetching logic
- [ ] Extract enrichment logic
- [ ] Extract introspection logic
- [ ] Add unit tests for each service
- [ ] Update DiagnosticsPanel to use services

### Step 3: Create Custom Hooks (2-3 days)
- [ ] Create `hooks/` directory
- [ ] Extract stateful logic into hooks
- [ ] Add tests for hooks
- [ ] Refactor DiagnosticsPanel to use hooks
- [ ] Reduce useState calls in main component

### Step 4: Decompose Components (3-4 days)
- [ ] Create `components/` directory structure
- [ ] Move `src/ui/inspection/` to `src/ui/diagnostics/components/shared/`
- [ ] Update all imports from `src/ui/inspection` to `src/ui/diagnostics/components/shared`
- [ ] Extract StatsOverview section
- [ ] Extract ContentPanels sections
- [ ] Extract LogsPanel
- [ ] Extract FooterPanel
- [ ] Extract DiagnosticsHeader and Toolbar
- [ ] Update main DiagnosticsPanel to orchestrate
- [ ] Verify all inspection components work after move

### Step 5: Refactor Tree Explorer (2-3 days)
- [ ] Create `tree/` directory
- [ ] Extract node components
- [ ] Extract search and filter logic
- [ ] Simplify main PluginTreeExplorer
- [ ] Add tests for tree components

### Step 6: Testing & Documentation (2-3 days)
- [ ] Add unit tests for all new modules
- [ ] Add integration tests
- [ ] Update documentation
- [ ] Create migration guide
- [ ] Performance testing

## Success Metrics

- DiagnosticsPanel.tsx reduced from 1290 to < 200 lines
- PluginTreeExplorer.tsx reduced from 1006 to < 200 lines
- All modules < 300 lines
- Test coverage > 80%
- No functionality regressions
- Clear separation of concerns
- Easy to add new features from Issue #283

## Future Extraction Preparation

To prepare for eventual package extraction:

1. **Minimize Host Dependencies**: Use dependency injection for host-specific imports
2. **Clear API Surface**: Define public exports in index.ts files
3. **Configuration-Driven**: Use props/config instead of hard-coded values
4. **Documentation**: Document all public APIs
5. **Versioning**: Prepare for semantic versioning

## Timeline

- **Phase 1**: 1-2 days
- **Phase 2**: 2-3 days
- **Phase 3**: 2-3 days
- **Phase 4**: 3-4 days
- **Phase 5**: 2-3 days
- **Phase 6**: 2-3 days

**Total**: 12-18 days (2.5-3.5 weeks)

## Risk Mitigation

1. **Incremental Approach**: Refactor one section at a time
2. **Feature Flags**: Use flags to toggle between old/new implementations
3. **Comprehensive Testing**: Test after each phase
4. **Code Reviews**: Review each phase before proceeding
5. **Rollback Plan**: Keep old code until new code is proven

## Next Steps

1. Get approval for this strategy
2. Create GitHub issue for the refactoring work
3. Break down into smaller sub-issues for each phase
4. Begin with Phase 1 (Type System)

