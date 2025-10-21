# Integration Analysis: Test Harness → Diagnostics Page

## Summary

This issue proposes integrating the existing test harness (`src/test-plugin-loader.tsx`) as a diagnostics page within the RenderX host application. The test harness currently operates as a standalone React app for plugin introspection and diagnostics. Integration would improve discoverability, enable real-time diagnostics, and streamline developer workflows.

## Current State
- Test harness is a standalone React app with its own root element and conductor instance
- Loads manifests independently
- Provides plugin introspection via 6 tabs
- Has a dedicated HTML entry point (`public/test-plugin-loading.html`)

## Integration Options

### Option 1: Route-Based Integration (Recommended)
- Add a routing library (e.g., React Router)
- Wrap main App in a Router, define diagnostics route
- Extract `SophisticatedPluginLoader` as a reusable route component
- Share the global conductor instance
- Add navigation UI (link, menu, or keyboard shortcut)
- **Effort**: Medium (2-4 hours)

### Option 2: Modal/Overlay Integration (**Preferred**)
- Create a diagnostics modal/overlay using React Portal
- Add global keyboard shortcut (e.g., Ctrl+Shift+D)
- Share conductor instance
- **Effort**: Low-Medium (1-3 hours)
- **Pros**: Minimal changes, quick to implement, non-invasive, developer-friendly

### Option 3: Slot-Based Integration
- Add diagnostics slot to layout manifest
- Package diagnostics as a plugin
- Mount in diagnostics slot, add toggle/collapse
- **Effort**: Medium-High (3-5 hours)
- **Pros**: Architecturally consistent

### Option 4: Keep Separate (Current State)
- No integration required
- **Cons**: Not discoverable, separate initialization, not available in production

## Key Integration Challenges
- Sharing conductor instance
- Manifest synchronization
- Styling conflicts
- Performance impact (should be lazy-loaded)
- Feature flag integration

## Recommended Approach
**Option 2 (Modal/Overlay Integration)**
- Minimal infrastructure changes
- Quick to implement
- Non-invasive
- Developer-friendly
- Production-safe (feature-flagged)

## Implementation Checklist
- [ ] Extract `SophisticatedPluginLoader` into `src/ui/diagnostics/DiagnosticsPanel.tsx`
- [ ] Remove standalone initialization, accept conductor as prop
- [ ] Create `src/ui/diagnostics/DiagnosticsOverlay.tsx` wrapper with modal/portal
- [ ] Add global keyboard listener in `src/index.tsx` or `src/ui/App/App.tsx`
- [ ] Add feature flag `diagnostics.enabled` to control availability
- [ ] Add visual indicator (badge/icon) for diagnostics
- [ ] Test shared conductor instance
- [ ] Verify manifest data synchronization

---
**Effort Estimate:** 1-3 hours
**Priority:** Medium
**Labels:** diagnostics, enhancement, architecture
