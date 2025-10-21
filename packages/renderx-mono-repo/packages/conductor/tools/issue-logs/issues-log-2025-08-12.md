# Issues Log — 2025-08-12

Context
- Task: Continue migrating Canvas.tsx and CanvasElement.tsx to Panel Slot Plugins; clean up unused code per ADR-0014 (#38).

Open Items
- [ ] Verify Canvas UI plugin parity:
  - Drop from Component Library creates nodes and renders via renderCanvasNode.
  - Move/Resize symphonies update positions/sizes; overlay is rendered as sibling (no inline styles on component root).
  - Selection symphony updates selection and overlay correctly.
  - Confirm behavior under StrictMode (no duplicate play calls).
- [ ] Consider deprecating/remove drag utility functions if fully superseded by plugin flows:
  - dragUtils: captureClickOffset, storeDragDataGlobally, getGlobalDragData, clearGlobalDragData, syncVisualToolsPosition.
  - cssUtils: generateAndInjectComponentCSS, injectSelectionStyles (if unused).
  - Action: search references and remove if dead, or move to plugin utils.
- [ ] E2E Playwright tests may reference legacy Canvas. Update tests to assert center slot plugin UI loads (CanvasPage), not app-level Canvas.
- [ ] Decide on fallback for center slot in AppContent: currently a neutral empty-state; confirm this meets UX expectations.

Resolved Items
- [x] Remove legacy Canvas-related components from app shell:
  - RenderX/src/components/Canvas.tsx (deleted)
  - RenderX/src/components/CanvasElement.tsx (deleted)
  - RenderX/src/components/DragPreview.tsx (deleted)
  - RenderX/src/components/VisualTools.tsx (deleted)
- [x] Update AppContent to use PanelSlot for center in all modes; remove legacy canvas drag handlers.
- [x] Remove Canvas types from AppTypes.ts.
- [x] Type-check and build pass for RenderX app.

Notes
- Manifest already contains Canvas UI Plugin at public/plugins/canvas-ui-plugin/index.js with export CanvasPage for slot "center".
- PanelSlot resolves plugin UIs via manifest.json in dev (lazy import), wrapped by Suspense and ErrorBoundary.

Next Steps
- Run `npm run dev` and perform manual smoke of center slot loading.
- With approval, run Playwright E2E (`npm run test:acceptance`) to validate flows after migration.

