# Add Refactoring Zone Markers for AI Agent Guidance

## Issue Type
🔧 Refactoring / Documentation

## Related Issues
- Parent: #297 - Refactor Diagnostics Panel for Modularity and Scalability
- Context: #283 - Deep Hierarchical Navigation (Diagnostics Tree View)

## Problem Statement

We're in the middle of a multi-phase refactoring effort (#297) to modularize the diagnostics codebase. As we shift focus to implement MMF features, we need to ensure that AI agents (and human developers) working in these refactoring zones understand:

1. What refactoring work is in progress
2. Which patterns to follow and avoid
3. Where completed work exists (types, services)
4. What's coming next (hooks, components)

Without clear markers, there's a risk of:
- Adding anti-patterns that counter our refactoring efforts
- Duplicating work that will be extracted later
- Making changes that increase technical debt
- Missing opportunities to use the new modular structure

## Proposed Solution

Implement a comprehensive "refactoring zone marker" system using **5 recommended components**:

### 1. File-Level Banner Comments 🚧
Add highly visible banner comments at the top of files under active refactoring.

### 2. Module-Level REFACTORING.md 📖
Create a `REFACTORING.md` file in the diagnostics module with detailed guidance.

### 3. Inline Section Markers 📍
Add section-level markers showing extraction targets for upcoming phases.

### 4. JSDoc Annotations with AI-Specific Tags 🏷️
Use structured JSDoc comments with custom tags for machine-readable guidance.

### 5. README.md Section 📋
Add a "Active Refactoring Zones" section to the main README.

## Files to Update

### Primary Refactoring Zones

```
src/ui/diagnostics/
├── DiagnosticsPanel.tsx         ⚠️ 1140 lines (target: <200)
├── REFACTORING.md               ✨ NEW - Module guidance
└── types/                       ✅ Phase 1 Complete
    └── (already organized)

src/ui/
└── PluginTreeExplorer.tsx       ⚠️ 870 lines (target: <200)

docs/refactoring/
└── (existing strategy docs)     ✅ Already exists

README.md                         📝 Add refactoring section
```

## Implementation Details

### 1. File-Level Banner Comment Template

Add to top of `DiagnosticsPanel.tsx` and `PluginTreeExplorer.tsx`:

```typescript
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  🚧 REFACTORING IN PROGRESS - Issue #297                                ║
// ║  Strategy: docs/refactoring/diagnostics-modularity-strategy.md          ║
// ║  Status: Phase 2 Complete ✅ | Phase 3 Pending ⏳                       ║
// ║                                                                          ║
// ║  ⚠️  FOR AI AGENTS: This file is being modularized                      ║
// ║                                                                          ║
// ║  DO NOT:                                                                ║
// ║    • Add new inline types (use src/ui/diagnostics/types/)              ║
// ║    • Add data fetching logic here (use services/)                       ║
// ║    • Add new useState hooks (Phase 3 will extract to custom hooks)     ║
// ║    • Break up components yet (Phase 4 will handle decomposition)       ║
// ║                                                                          ║
// ║  DO:                                                                    ║
// ║    • Import types from src/ui/diagnostics/types/                        ║
// ║    • Use existing services from src/ui/diagnostics/services/            ║
// ║    • Keep changes minimal and follow existing patterns                  ║
// ║    • Read src/ui/diagnostics/REFACTORING.md for full guidance          ║
// ║                                                                          ║
// ║  Current: 1140 lines → Target: <200 lines                              ║
// ║  Next Phase: Extract custom hooks (Phase 3)                             ║
// ╚══════════════════════════════════════════════════════════════════════════╝
```

### 2. Create `src/ui/diagnostics/REFACTORING.md`

```markdown
# 🚧 Diagnostics Module - Refactoring in Progress

**Issue**: [#297](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/297)  
**Status**: Phase 2 Complete ✅ | Phase 3-6 Pending ⏳

## For AI Agents & Developers Working in This Module

### Current State
- ✅ **Phase 1 Complete**: Types centralized in `types/`
- ✅ **Phase 2 Complete**: Services extracted to `services/`
- ⏳ **Phase 3 Pending**: Custom hooks extraction
- ⏳ **Phase 4 Pending**: Component decomposition
- ⏳ **Phase 5 Pending**: Tree explorer modularization
- ⏳ **Phase 6 Pending**: Testing & documentation

### Module Structure

```
diagnostics/
├── types/          ✅ Phase 1 - USE THESE for type definitions
├── services/       ✅ Phase 2 - USE THESE for data/business logic
├── hooks/          ⏳ Phase 3 - Not ready yet (coming soon)
├── components/     ⏳ Phase 4 - Not ready yet
├── tree/           ⏳ Phase 5 - Not ready yet
└── DiagnosticsPanel.tsx  ⚠️ Being refactored (1140→<200 lines)
```

### Do's and Don'ts

#### ✅ DO
- **Import types** from `./types/` (e.g., `import type { ManifestData } from './types'`)
- **Use services** from `./services/` (e.g., `import { loadPluginManifest } from './services'`)
- **Follow existing patterns** in the codebase
- **Keep changes minimal** when adding features
- **Check progress** in `docs/refactoring/diagnostics-refactoring-progress.md`

#### ❌ DO NOT
- **Add inline type definitions** → Use `types/` directory instead
- **Add data fetching logic** → Use `services/` directory instead
- **Add complex state management** → Phase 3 will extract custom hooks
- **Break up components** → Phase 4 will handle decomposition
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

3. **UI Changes**
   - For now, add to existing components minimally
   - Avoid adding complex nested structures
   - **Wait for Phase 4** before creating new sub-components

4. **State Management**
   - Use existing useState hooks where possible
   - **Don't create new useState** - Phase 3 will provide custom hooks
   - Keep state logic simple until hooks are extracted

### Reference Documents
- **Strategy**: `docs/refactoring/diagnostics-modularity-strategy.md`
- **Progress**: `docs/refactoring/diagnostics-refactoring-progress.md`
- **Before/After**: `docs/refactoring/diagnostics-before-after.md`
- **Parent Issue**: [#297](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/297)

### Questions?
See strategy document for full refactoring plan and timeline.

---

**Last Updated**: [Current Date]  
**Next Phase Start**: TBD (waiting for MMF features to complete)
```

### 3. Inline Section Markers

Add throughout `DiagnosticsPanel.tsx`:

```typescript
// ┌─────────────────────────────────────────────────────────────────┐
// │ 🚧 REFACTORING ZONE: State Management                           │
// │ Phase 3 Target: Extract to useDiagnosticsData() hook            │
// │ DO NOT: Add new useState hooks here                             │
// │ DO: Use existing state, keep changes minimal                    │
// └─────────────────────────────────────────────────────────────────┘
const [conductor, setConductor] = useState<any>(null);
const [manifest, setManifest] = useState<ManifestData | null>(null);
// ... existing state

// ┌─────────────────────────────────────────────────────────────────┐
// │ 🚧 REFACTORING ZONE: Stats Overview UI                          │
// │ Phase 4 Target: Extract to components/StatsOverview/            │
// │ DO NOT: Add complex logic here - keep as presentation           │
// │ DO: Use existing patterns for display                           │
// └─────────────────────────────────────────────────────────────────┘
<div className="control-panel">
  <h2>Plugin Statistics</h2>
  {/* This section will become <StatsOverview /> in Phase 4 */}
  <div className="stats-grid">
    {/* ... */}
  </div>
</div>

// ┌─────────────────────────────────────────────────────────────────┐
// │ 🚧 REFACTORING ZONE: Content Panels                             │
// │ Phase 4 Target: Extract to components/ContentPanels/            │
// │ DO NOT: Add new panel types here                                │
// │ DO: Extend existing panels minimally                            │
// └─────────────────────────────────────────────────────────────────┘
{selectedTab === 'plugins' && (
  <div className="panel">
    {/* PluginsPanel.tsx in Phase 4 */}
  </div>
)}

// ┌─────────────────────────────────────────────────────────────────┐
// │ 🚧 REFACTORING ZONE: Logs Panel                                 │
// │ Phase 4 Target: Extract to components/LogsPanel/                │
// │ DO NOT: Add complex log filtering here                          │
// │ DO: Keep log display simple                                     │
// └─────────────────────────────────────────────────────────────────┘
<div className="logs-panel">
  {/* LogsPanel component in Phase 4 */}
</div>
```

Add to `PluginTreeExplorer.tsx`:

```typescript
// ┌─────────────────────────────────────────────────────────────────┐
// │ 🚧 REFACTORING ZONE: Tree Navigation                            │
// │ Phase 5 Target: Extract to tree/PluginTreeExplorer.tsx          │
// │ Current: 870 lines → Target: <200 lines                         │
// │ DO NOT: Add complex tree logic here                             │
// │ DO: Use existing patterns, wait for Phase 5 modularization      │
// └─────────────────────────────────────────────────────────────────┘
```

### 4. JSDoc Annotations

Add to component exports:

```typescript
/**
 * DiagnosticsPanel - Main diagnostics interface
 * 
 * @refactoring-status phase-2-complete
 * @refactoring-issue #297
 * @refactoring-current-phase 2
 * @refactoring-next-phase 3-extract-hooks
 * @refactoring-target <200 lines (currently 1140)
 * 
 * @ai-guidance
 * This component is under active refactoring per diagnostics-modularity-strategy.md
 * 
 * **Phase Status:**
 * - ✅ Phase 1: Types centralized in src/ui/diagnostics/types/
 * - ✅ Phase 2: Services extracted to src/ui/diagnostics/services/
 * - ⏳ Phase 3: Custom hooks (pending)
 * - ⏳ Phase 4: Component decomposition (pending)
 * 
 * **When modifying this file:**
 * - Import types from src/ui/diagnostics/types/
 * - Use services from src/ui/diagnostics/services/
 * - DO NOT add inline types or data fetching logic
 * - DO NOT add new useState hooks (Phase 3 will extract these)
 * - DO NOT break up into sub-components yet (Phase 4 will handle this)
 * - Read src/ui/diagnostics/REFACTORING.md for detailed guidance
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/diagnostics-refactoring-progress.md
 * @see src/ui/diagnostics/REFACTORING.md
 */
export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = () => {
  // ...
};
```

### 5. README.md Section

Add to main `README.md` (after project description, before Getting Started):

```markdown
## 🚧 Active Refactoring Zones

Some parts of the codebase are under active refactoring for improved modularity, scalability, and maintainability. These zones have special markers and guidance for contributors.

### Diagnostics Module (Issue #297)

**Status**: Phase 2 Complete ✅ | Phases 3-6 Pending ⏳

**Files Under Refactoring**:
- `src/ui/diagnostics/DiagnosticsPanel.tsx` (1140 lines → target: <200 lines)
- `src/ui/PluginTreeExplorer.tsx` (870 lines → target: <200 lines)

**What's Complete**:
- ✅ Phase 1: Type system centralized in `src/ui/diagnostics/types/`
- ✅ Phase 2: Business logic extracted to `src/ui/diagnostics/services/`

**What's Coming**:
- ⏳ Phase 3: Custom hooks extraction
- ⏳ Phase 4: Component decomposition  
- ⏳ Phase 5: Tree explorer modularization
- ⏳ Phase 6: Testing & documentation

**For Contributors & AI Agents**:

When working in these refactoring zones:

1. **Read First**: `src/ui/diagnostics/REFACTORING.md` - Contains detailed guidance
2. **Use Existing Structure**:
   - ✅ Import types from `src/ui/diagnostics/types/`
   - ✅ Use services from `src/ui/diagnostics/services/`
3. **Avoid Anti-Patterns**:
   - ❌ Don't add inline type definitions
   - ❌ Don't add data fetching logic to components
   - ❌ Don't add new useState hooks (Phase 3 will extract to custom hooks)
   - ❌ Don't break up components yet (Phase 4 will handle decomposition)

**Reference Documents**:
- [Refactoring Strategy](docs/refactoring/diagnostics-modularity-strategy.md)
- [Refactoring Progress](docs/refactoring/diagnostics-refactoring-progress.md)
- [Before & After Comparison](docs/refactoring/diagnostics-before-after.md)
- [Module-Specific Guidance](src/ui/diagnostics/REFACTORING.md)

**Related Issues**:
- [#297 - Refactor Diagnostics Panel](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/297)
- [#283 - Deep Hierarchical Navigation](https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/283)

---
```

## Acceptance Criteria

- [ ] File-level banner comments added to:
  - [ ] `src/ui/diagnostics/DiagnosticsPanel.tsx`
  - [ ] `src/ui/PluginTreeExplorer.tsx`
- [ ] `src/ui/diagnostics/REFACTORING.md` created with full guidance
- [ ] Inline section markers added throughout both files marking extraction targets
- [ ] JSDoc annotations added to main component exports
- [ ] README.md updated with "Active Refactoring Zones" section
- [ ] All existing tests still pass (102/102)
- [ ] No lint errors introduced
- [ ] Documentation references are accurate

## Testing Notes

This is a documentation/marker task with no functional changes:
- Run `npm test` to verify no tests broken
- Run `npm run lint` to verify no lint errors
- Verify all file paths and issue references are correct
- Check that markers are visible and clearly formatted

## Implementation Notes

### Marker Consistency

Use these exact emoji/symbols for consistency:
- 🚧 - Refactoring in progress
- ✅ - Phase complete
- ⏳ - Phase pending
- ❌ - Don't do this
- ✅ - Do this
- 📖 - Read documentation
- 📍 - Location marker
- 🏷️ - Tag/label

### Section Marker Template

Use this exact template for inline section markers:

```typescript
// ┌─────────────────────────────────────────────────────────────────┐
// │ 🚧 REFACTORING ZONE: [Section Name]                             │
// │ Phase [N] Target: [Extraction target]                           │
// │ DO NOT: [Specific guidance]                                     │
// │ DO: [Specific guidance]                                         │
// └─────────────────────────────────────────────────────────────────┘
```

### Update Date

When creating `REFACTORING.md`, set "Last Updated" to the current date.

## Related Work

This issue prepares the codebase for parallel work:
1. **Refactoring continuation** (Issue #297) - Can resume after MMF
2. **MMF feature development** - Can proceed with clear guidance
3. **Future AI agent work** - Will have context to make aligned decisions

## Priority

**Medium** - Not blocking MMF work, but provides valuable guidance to prevent anti-patterns.

## Estimated Effort

**2-3 hours** - Mostly documentation and marker placement, no complex logic changes.

## Labels

- `refactoring`
- `documentation`
- `good-first-issue`
- `ai-agent-friendly`

---

**Issue created as preparation for Issue #297 refactoring continuation**