# Files to Migrate from renderx-plugins-demo

**Source Repository**: https://github.com/BPMSoftwareSolutions/renderx-plugins-demo
**Target**: `packages/renderx-mono-repo/`

---

## PHASE 1: BUILD SYSTEM & CONFIGURATION

### From Root Directory
```
renderx-plugins-demo/
├── vite.config.ts                    → packages/renderx-mono-repo/vite.config.ts
├── index.html                        → packages/renderx-mono-repo/index.html
├── tsconfig.json                     → packages/renderx-mono-repo/tsconfig.json (MERGE)
├── eslint.config.js                  → packages/renderx-mono-repo/eslint.config.js (MERGE)
└── package.json                      → packages/renderx-mono-repo/package.json (MERGE)
```

---

## PHASE 2: APPLICATION CODE

### React Application Files
```
renderx-plugins-demo/src/
├── index.tsx                         → packages/renderx-mono-repo/src/index.tsx (UPDATE)
├── global.css                        → packages/renderx-mono-repo/src/global.css
├── ui/
│   ├── App.tsx                       → packages/renderx-mono-repo/src/ui/App.tsx
│   ├── App.css                       → packages/renderx-mono-repo/src/ui/App.css
│   ├── diagnostics/
│   │   └── DiagnosticsPanel.tsx      → packages/renderx-mono-repo/src/ui/diagnostics/
│   ├── PluginTreeExplorer.tsx        → packages/renderx-mono-repo/src/ui/
│   └── components/                   → packages/renderx-mono-repo/src/ui/components/
├── domain/
│   ├── components/                   → packages/renderx-mono-repo/src/domain/components/
│   ├── css/                          → packages/renderx-mono-repo/src/domain/css/
│   └── plugins/                      → packages/renderx-mono-repo/src/domain/plugins/
├── core/
│   ├── conductor/                    → packages/renderx-mono-repo/src/core/conductor/
│   ├── manifests/                    → packages/renderx-mono-repo/src/core/manifests/
│   ├── events/                       → packages/renderx-mono-repo/src/core/events/
│   └── environment/                  → packages/renderx-mono-repo/src/core/environment/
├── infrastructure/                   → packages/renderx-mono-repo/src/infrastructure/
└── vendor/                           → packages/renderx-mono-repo/src/vendor/
```

---

## PHASE 3: MANIFEST & BUILD SCRIPTS

### Scripts Directory
```
renderx-plugins-demo/scripts/
├── sync-json-sources.js              → packages/renderx-mono-repo/scripts/
├── sync-json-components.js           → packages/renderx-mono-repo/scripts/
├── sync-json-sequences.js            → packages/renderx-mono-repo/scripts/
├── generate-interaction-manifest.js  → packages/renderx-mono-repo/scripts/
├── generate-topics-manifest.js       → packages/renderx-mono-repo/scripts/
├── generate-layout-manifest.js       → packages/renderx-mono-repo/scripts/
├── generate-json-interactions-from-plugins.js → packages/renderx-mono-repo/scripts/
├── aggregate-plugins.js              → packages/renderx-mono-repo/scripts/
├── sync-plugins.js                   → packages/renderx-mono-repo/scripts/
├── sync-control-panel-config.js      → packages/renderx-mono-repo/scripts/
├── build-artifacts.js                → packages/renderx-mono-repo/scripts/
├── validate-artifacts.js             → packages/renderx-mono-repo/scripts/
├── hash-artifacts.js                 → packages/renderx-mono-repo/scripts/
├── pack-artifacts.js                 → packages/renderx-mono-repo/scripts/
├── validate-public-api.js            → packages/renderx-mono-repo/scripts/
└── hash-public-api.js                → packages/renderx-mono-repo/scripts/
```

### JSON Catalogs
```
renderx-plugins-demo/catalog/
├── json-components/                  → packages/renderx-mono-repo/catalog/json-components/
├── json-sequences/                   → packages/renderx-mono-repo/catalog/json-sequences/
├── json-interactions/                → packages/renderx-mono-repo/catalog/json-interactions/
└── json-topics/                      → packages/renderx-mono-repo/catalog/json-topics/
```

### Public Assets
```
renderx-plugins-demo/public/
├── json-components/                  → packages/renderx-mono-repo/public/json-components/
├── json-sequences/                   → packages/renderx-mono-repo/public/json-sequences/
├── json-interactions/                → packages/renderx-mono-repo/public/json-interactions/
├── json-topics/                      → packages/renderx-mono-repo/public/json-topics/
└── plugins/                          → packages/renderx-mono-repo/public/plugins/
```

---

## PHASE 4: E2E TESTS

### Cypress Configuration & Tests
```
renderx-plugins-demo/
├── cypress.config.ts                 → packages/renderx-mono-repo/cypress.config.ts (MERGE)
├── cypress/
│   ├── support/
│   │   ├── commands.ts               → packages/renderx-mono-repo/cypress/support/
│   │   └── e2e.ts                    → packages/renderx-mono-repo/cypress/support/
│   └── e2e/
│       ├── plugin-loading.cy.ts      → packages/renderx-mono-repo/cypress/e2e/
│       ├── orchestration.cy.ts       → packages/renderx-mono-repo/cypress/e2e/
│       ├── ui-interaction.cy.ts      → packages/renderx-mono-repo/cypress/e2e/
│       └── manifest-validation.cy.ts → packages/renderx-mono-repo/cypress/e2e/
```

---

## PHASE 5: DOCUMENTATION

### Documentation Files
```
renderx-plugins-demo/
├── README.md                         → packages/renderx-mono-repo/README.md (UPDATE)
├── docs/
│   ├── ARCHITECTURE.md               → packages/renderx-mono-repo/docs/
│   ├── PLUGIN_SYSTEM.md              → packages/renderx-mono-repo/docs/
│   ├── MANIFEST_SCHEMA.md            → packages/renderx-mono-repo/docs/
│   └── DEVELOPMENT.md                → packages/renderx-mono-repo/docs/
```

---

## MIGRATION NOTES

### Files That Need Updates
1. **package.json** - Merge dependencies, update scripts
2. **tsconfig.json** - Merge with existing, add JSX support
3. **eslint.config.js** - Merge with existing, add React rules
4. **src/index.tsx** - Update imports to use local packages
5. **All scripts** - Update paths for new structure
6. **README.md** - Update for mono-repo structure

### Path Adjustments Needed
- Change imports from `@renderx-plugins/*` to `@renderx/*`
- Update relative paths for scripts
- Update manifest generation paths
- Update artifact output paths

### Dependencies to Add
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "musical-conductor": "^1.4.5",
    "lucide-react": "^0.544.0",
    "gif.js.optimized": "^1.0.1"
  },
  "devDependencies": {
    "vite": "^7.1.3",
    "@vitejs/plugin-react": "^5.0.3"
  }
}
```

---

## VERIFICATION CHECKLIST

After migration:
- [ ] `pnpm install` succeeds
- [ ] `pnpm run dev` starts Vite on port 5173
- [ ] `pnpm run build` completes successfully
- [ ] `pnpm run lint` passes
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run test` passes
- [ ] `pnpm run test:e2e` passes
- [ ] Plugins load in browser
- [ ] UI renders correctly
- [ ] Manifests generate correctly

---

**Status**: Ready for Phase 1 migration
**Estimated Effort**: 2-3 days for complete migration

