# Diagnostics Refactoring: Before & After

## Visual Comparison

### BEFORE (Current State)

```
src/ui/
├── diagnostics/
│   ├── DiagnosticsPanel.tsx        ❌ 1290 lines (BLOATED)
│   ├── DiagnosticsOverlay.tsx
│   ├── diagnostics.css
│   └── index.ts
├── inspection/                      ⚠️  Wrong location
│   ├── InspectionPanel.tsx
│   ├── PluginInfoInspector.tsx
│   ├── ActionButton.tsx
│   ├── CodeBlock.tsx
│   ├── CollapsibleSection.tsx
│   ├── JSONViewer.tsx
│   ├── RelativeTime.tsx
│   ├── inspection.css
│   └── index.ts
└── PluginTreeExplorer.tsx          ❌ 1006 lines (BLOATED)
```

**Problems:**
- 🔴 DiagnosticsPanel.tsx: 1290 lines with mixed concerns
- 🔴 PluginTreeExplorer.tsx: 1006 lines with duplicate types
- 🟡 Inspection components in wrong location
- 🔴 15+ useState hooks in one component
- 🔴 Type definitions scattered and duplicated
- 🔴 Data fetching mixed with UI rendering
- 🔴 Hard to test and maintain

---

### AFTER (Refactored State)

```
src/ui/diagnostics/
├── types/                           ✅ Centralized types
│   ├── index.ts
│   ├── plugin.types.ts
│   ├── manifest.types.ts
│   ├── runtime.types.ts
│   ├── ui-config.types.ts
│   ├── conductor.types.ts
│   ├── stats.types.ts
│   └── log.types.ts
│
├── services/                        ✅ Business logic
│   ├── index.ts
│   ├── manifest.service.ts
│   ├── stats.service.ts
│   ├── conductor.service.ts
│   ├── plugin-enrichment.service.ts
│   └── sequence-loader.service.ts
│
├── hooks/                           ✅ Reusable state logic
│   ├── index.ts
│   ├── useDiagnosticsData.ts
│   ├── usePluginStats.ts
│   ├── useConductorIntrospection.ts
│   ├── useEventMonitoring.ts
│   ├── usePerformanceMetrics.ts
│   └── useTreeNavigation.ts
│
├── components/                      ✅ Focused components
│   ├── index.ts
│   ├── DiagnosticsHeader.tsx
│   ├── DiagnosticsToolbar.tsx
│   │
│   ├── shared/                      ✅ Moved from src/ui/inspection/
│   │   ├── index.ts
│   │   ├── InspectionPanel.tsx
│   │   ├── PluginInfoInspector.tsx
│   │   ├── ActionButton.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── CollapsibleSection.tsx
│   │   ├── JSONViewer.tsx
│   │   ├── RelativeTime.tsx
│   │   └── inspection.css
│   │
│   ├── StatsOverview/
│   │   ├── index.ts
│   │   ├── StatsOverview.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── MetricCard.tsx
│   │   └── stats-overview.css
│   │
│   ├── ContentPanels/
│   │   ├── index.ts
│   │   ├── PluginsPanel.tsx
│   │   ├── TopicsPanel.tsx
│   │   ├── RoutesPanel.tsx
│   │   ├── ComponentsPanel.tsx
│   │   ├── ConductorPanel.tsx
│   │   └── PerformancePanel.tsx
│   │
│   ├── LogsPanel/
│   │   ├── index.ts
│   │   ├── LogsPanel.tsx
│   │   ├── LogEntry.tsx
│   │   └── logs-panel.css
│   │
│   └── FooterPanel/
│       ├── index.ts
│       ├── FooterPanel.tsx
│       └── footer-panel.css
│
├── tree/                            ✅ Tree explorer modularized
│   ├── index.ts
│   ├── PluginTreeExplorer.tsx       ✅ < 200 lines (orchestrator)
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
│
├── DiagnosticsPanel.tsx             ✅ < 200 lines (orchestrator)
├── DiagnosticsOverlay.tsx
├── diagnostics.css
└── index.ts
```

**Benefits:**
- ✅ DiagnosticsPanel.tsx: Reduced from 1290 to < 200 lines
- ✅ PluginTreeExplorer.tsx: Reduced from 1006 to < 200 lines
- ✅ All modules < 300 lines
- ✅ Clear separation of concerns
- ✅ Testable business logic
- ✅ Reusable components and hooks
- ✅ Self-contained diagnostics module
- ✅ Ready for package extraction

---

## Key Changes

### 1. Type System Organization
**Before:** Types scattered across multiple files, duplicated
**After:** Centralized in `types/` directory with logical grouping

### 2. Data Layer Separation
**Before:** Data fetching mixed with UI rendering
**After:** Isolated in `services/` directory, testable

### 3. State Management
**Before:** 15+ useState hooks in DiagnosticsPanel
**After:** Custom hooks in `hooks/` directory, reusable

### 4. Component Structure
**Before:** Monolithic 1290-line component
**After:** Focused components < 200 lines each

### 5. Inspection Components
**Before:** `src/ui/inspection/` (wrong location)
**After:** `src/ui/diagnostics/components/shared/` (consolidated)

### 6. Tree Explorer
**Before:** 1006-line monolithic file
**After:** Modular tree with node-specific components

---

## Migration Path

### Phase 1: Types (1-2 days)
Extract and organize all type definitions

### Phase 2: Services (2-3 days)
Extract data fetching and business logic

### Phase 3: Hooks (2-3 days)
Extract stateful logic into custom hooks

### Phase 4: Components (3-4 days)
**Move inspection components** and decompose panels

### Phase 5: Tree (2-3 days)
Modularize tree explorer

### Phase 6: Testing (2-3 days)
Comprehensive testing and documentation

**Total:** 12-18 days (2.5-3.5 weeks)

---

## Success Metrics

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| DiagnosticsPanel.tsx | 1290 lines | < 200 lines | 🎯 Target |
| PluginTreeExplorer.tsx | 1006 lines | < 200 lines | 🎯 Target |
| Max module size | 1290 lines | < 300 lines | 🎯 Target |
| Test coverage | Low | > 80% | 🎯 Target |
| Separation of concerns | Poor | Excellent | 🎯 Target |
| Inspection location | `src/ui/inspection/` | `src/ui/diagnostics/components/shared/` | 🎯 Target |

---

## Next Steps

1. ✅ Strategy document created
2. ✅ GitHub issue #297 created
3. ⏳ Get team approval
4. ⏳ Begin Phase 1: Type System Organization
5. ⏳ Continue through phases incrementally

---

## References

- **Strategy Document:** `docs/refactoring/diagnostics-modularity-strategy.md`
- **GitHub Issue:** #297
- **Parent Issue:** #283 (Deep Hierarchical Navigation)
- **Current Code:**
  - `src/ui/diagnostics/DiagnosticsPanel.tsx` (1290 lines)
  - `src/ui/PluginTreeExplorer.tsx` (1006 lines)
  - `src/ui/inspection/` (to be moved)

