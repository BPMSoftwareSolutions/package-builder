# Source Structure Refactor (Issue #171)

This repository was reorganized to a layered, domain-first structure.

## Layers

```
src/
	core/            # Orchestration: conductor, events, manifests, startup, environment
	domain/          # Domain feature modules: layout, components, mapping, css, plugins (future)
	ui/              # React view layer (App + shared components)
	infrastructure/  # Low-level helpers (handlers path, future validation/security)
	vendor/          # Vendor shims and external UI adapters
	index.tsx        # Application entry (was main.tsx)
	global.css       # Global styles
```

### Dependency Direction

```
infrastructure → core → domain → ui
```

Cross-domain interactions occur only via topics/events (EventRouter) or manifest lookups.

## Mapping (Old → New)

| Old                        | New                                                                       |
| -------------------------- | ------------------------------------------------------------------------- |
| `main.tsx`                 | `index.tsx`                                                               |
| `App.tsx`                  | `ui/App/App.tsx`                                                          |
| `conductor.ts`             | `core/conductor/` (plus `sequence-registration.ts`, `runtime-loaders.ts`) |
| `EventRouter.ts`           | `core/events/EventRouter.ts`                                              |
| `env.ts`                   | `core/environment/env.ts`                                                 |
| `feature-flags/flags.ts`   | `core/environment/feature-flags.ts`                                       |
| `interactionManifest.ts`   | `core/manifests/interactionManifest.ts`                                   |
| `topicsManifest.ts`        | `core/manifests/topicsManifest.ts`                                        |
| `startupValidation.ts`     | `core/startup/startupValidation.ts`                                       |
| `layout/*`                 | `domain/layout/*`                                                         |
| `component-mapper/*`       | `domain/mapping/component-mapper/*`                                       |
| `jsonComponent.mapper.ts`  | `domain/components/json/jsonComponent.mapper.ts`                          |
| `inventory/index.ts`       | `domain/components/inventory/inventory.service.ts`                        |
| `cssRegistry/facade.ts`    | `domain/css/cssRegistry.facade.ts`                                        |
| `sanitizeHtml.ts`          | `domain/css/sanitizeHtml.ts` (may move to `infrastructure/security`)      |
| `components/PanelSlot.tsx` | `ui/shared/PanelSlot.tsx`                                                 |

Thin re-export shims exist temporarily; original files will be physically moved or removed after validation.

## Barrels

`core/conductor/index.ts` re-exports the conductor API + split modules. Add more barrels where external consumers benefit.

## Follow Ups

1. Remove legacy root files once all imports updated.
2. Introduce a `@/` path alias in `tsconfig.json` to reduce deep relative paths (optional).
3. Consider relocating `sanitizeHtml.ts` under `infrastructure/security/` if treated as a security boundary.
4. Co-locate tests next to implementations (incremental).
5. Evaluate extracting `core/` into a reusable host SDK package.

## Runtime Flow

```
[index.tsx]
	→ core/environment
	→ core/startup
	→ core/manifests
	→ core/conductor.init() + sequence registration
	→ core/events/EventRouter.init()
	→ React root render(App)
```

## Guardrails

- One-way dependency flow enforced by lint rules.
- EventRouter centralizes cross-feature dispatch.
- Reentrancy guard prevents feedback loops.

---

Generated as part of implementing #171.
