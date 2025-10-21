# 🚧 Diagnostics Module - Refactoring in Progress

**Issue**: [#297](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/297)  
**Status**: Phase 4 Complete ✅ | Phase 5-6 Pending ⏳

## For AI Agents & Developers Working in This Module

### Current State
- ✅ **Phase 1 Complete**: Types centralized in `types/`
- ✅ **Phase 2 Complete**: Services extracted to `services/`
- ✅ **Phase 3 Complete**: Custom hooks extraction
- ✅ **Phase 4 Complete**: Component decomposition
- ⏳ **Phase 5 Pending**: Tree explorer modularization
- ⏳ **Phase 6 Pending**: Testing & documentation

### Module Structure

```
diagnostics/
├── types/          ✅ Phase 1 - USE THESE for type definitions
├── services/       ✅ Phase 2 - USE THESE for data/business logic
├── hooks/          ✅ Phase 3 - USE THESE for state management
├── components/     ✅ Phase 4 - USE THESE for UI components
│   ├── shared/           - Inspection components
│   ├── StatsOverview/    - Statistics display
│   ├── ContentPanels/    - Plugin, Topic, Route, Component, Conductor, Performance panels
│   ├── LogsPanel/        - Log display
│   └── FooterPanel/      - Footer
├── tree/           ⏳ Phase 5 - Not ready yet (coming soon)
└── DiagnosticsPanel.tsx  ⚠️ Being refactored (383→<200 lines)

../PluginTreeExplorer.tsx  ⚠️ Phase 5 target (810→<200 lines)
```

### Do's and Don'ts

#### ✅ DO
- **Import types** from `./types/` (e.g., `import type { ManifestData } from './types'`)
- **Use services** from `./services/` (e.g., `import { loadPluginManifest } from './services'`)
- **Use hooks** from `./hooks/` (e.g., `import { useDiagnosticsData } from './hooks'`)
- **Use components** from `./components/` (e.g., `import { StatsOverview } from './components'`)
- **Follow existing patterns** in the codebase
- **Keep changes minimal** when adding features
- **Check progress** in `docs/refactoring/PROGRESS-SUMMARY.md`

#### ❌ DO NOT
- **Add inline type definitions** → Use `types/` directory instead
- **Add data fetching logic** → Use `services/` directory instead
- **Add new useState hooks** → Use existing custom hooks from `hooks/` directory
- **Add complex nested components** → Extract to `components/` directory
- **Modify tree structure** → Phase 5 will handle tree refactoring

### Adding New Features

If you need to add a feature to this module:

1. **New Types**
   - Add to appropriate file in `types/` directory
   - Follow existing naming conventions
   - Export from `types/index.ts`

2. **Data/Business Logic**
   - Add to appropriate service in `services/` directory
   - Keep functions pure and testable
   - Export from `services/index.ts`

3. **State Management**
   - Use existing hooks from `hooks/` directory
   - If new state logic is needed, create a new hook in `hooks/`
   - Follow the pattern of existing hooks
   - Export from `hooks/index.ts`

4. **UI Components**
   - Add to appropriate component directory in `components/`
   - Keep components focused and < 200 lines
   - Use existing hooks for state management
   - Export from component's `index.ts`

5. **Tree Explorer Changes**
   - **Wait for Phase 5** before making significant changes
   - Keep changes minimal until tree is modularized
   - Tree will be extracted to `tree/` directory

### Reference Documents
- **Strategy**: `docs/refactoring/diagnostics-modularity-strategy.md`
- **Progress**: `docs/refactoring/PROGRESS-SUMMARY.md`
- **Before/After**: `docs/refactoring/diagnostics-before-after.md`
- **Phase 3 Guide**: `docs/refactoring/phase-3-implementation-guide.md`
- **Parent Issue**: [#297](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/297)

### Questions?
See strategy document for full refactoring plan and timeline.

---

**Last Updated**: 2025-10-01  
**Next Phase Start**: TBD (Phase 5: Tree Explorer Modularization)

