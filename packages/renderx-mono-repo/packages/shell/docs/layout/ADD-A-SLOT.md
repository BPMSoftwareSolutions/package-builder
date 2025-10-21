# Add a Slot (Layout Manifest Path)

This guide explains how to add a new panel slot to the host UI using the layout-manifest. With the manifest-enabled path, slots are fully data-driven: no host code edits are required.

## Prerequisites

- Feature flag `ui.layout-manifest` must be enabled (defaults to enabled in most dev/test setups)
- Your plugin(s) can register UI for a named slot

## TL;DR

1. In `public/layout-manifest.json`:
   - Add the slot name to the grid `layout.areas`
   - Add a matching entry to `slots[]` (set `constraints`, and optional `capabilities` like `droppable`)
2. Ensure a plugin registers UI for that slot name
3. Run the app — the host will render the new slot automatically via `LayoutEngine` + `SlotContainer`

## Step 1 — Update the layout manifest

Add a new slot named `inspector` to both the grid area map and the slot list.

Example (excerpt):

```json
{
  "layout": {
    "kind": "grid",
    "columns": ["320px", "1fr", "360px", "320px"],
    "rows": ["1fr"],
    "areas": [["library", "canvas", "controlPanel", "inspector"]]
  },
  "slots": [
    { "name": "library", "constraints": { "minWidth": 280 } },
    {
      "name": "canvas",
      "constraints": { "minWidth": 480 },
      "capabilities": { "droppable": true }
    },
    { "name": "controlPanel", "constraints": { "minWidth": 320 } },
    {
      "name": "inspector",
      "constraints": { "minWidth": 280 },
      "capabilities": { "droppable": false }
    }
  ]
}
```

Notes:

### How to register a plugin UI to a slot

- Internal plugins: follow the Host SDK guidelines to register a panel/widget targeting the exact slot name (e.g., "inspector"). See docs/host-sdk/USING_HOST_SDK.md.
- External plugins: see docs/host-sdk/EXTERNAL_PLUGIN_MIGRATION_CHECKLIST.md for migration and slot registration steps.
- Once registered, the host’s <PanelSlot> resolver will mount your plugin UI inside the SlotContainer for that slot.
- If no plugin is registered for a given slot name, the host will render the slot shell but warn: "No plugin UI found for slot <name>".

- `layout.areas` is a matrix of slot names forming the grid; each unique name produces a wrapper cell
- `slots[]` entries let the host read constraints and behaviors (e.g., `capabilities.droppable`)

## Step 2 — Provide plugin UI for the slot

Register a plugin component/UI that targets `slot: "inspector"`. If no plugin is registered for the new slot name, the host will render an empty SlotContainer and you’ll see a log/warning like “No plugin UI found for slot inspector”.

This keeps the host plugin-agnostic: it renders slots based solely on manifest data; plugins claim slots by name.

## Step 3 — Validate

- Start the app and verify a new panel appears in the grid for `inspector`
- If applicable, test drag/drop on the new slot:
  - If `capabilities.droppable` is true, `SlotContainer` normalizes dragover (prevents default and hints dropEffect)
  - If false/absent, no droppable behavior is attached

## Behavior and constraints

- The host renders each `[data-slot]` wrapper as `position: relative` and mounts a full-coverage `[data-slot-content]` inside it
- `SlotContainer` centralizes slot behavior and keeps `PanelSlot` usage error-proof
- Capabilities are data-driven; today `droppable` is supported. More can be added later without changing plugin code

## Legacy fallback (non-manifest path)

If the manifest fails to load or the `ui.layout-manifest` flag is disabled, the host uses a fixed 3-column legacy layout (library | canvas | controlPanel). New slots won’t appear in that fallback layout.

## Lint/quality guardrails

- ESLint rule `panelslot-inside-slotcontainer` enforces that `<PanelSlot>` is only used inside `<SlotContainer>` wrappers
- This prevents accidental bypass of the standardized slot behavior and layout contract

## Tips

- Use unique names per cell in `layout.areas`; the current engine renders one wrapper per cell and doesn’t merge repeated names into spanning regions
- Prefer driving behaviors from `slots[].capabilities` instead of ad-hoc conditionals in host code

## Troubleshooting

- “No plugin UI found for slot X” — ensure your plugin registers UI for that exact slot name
- Drag/drop doesn’t engage — confirm `capabilities.droppable` is set for that slot and that your plugin listens for drop events within its UI
- Layout looks off — verify `columns`, `rows`, and `areas` have consistent dimensions and that wrappers are visible in DevTools via `[data-slot]`

## Slots manifest schema (excerpt)

The host reads slots and layout from `public/layout-manifest.json`. Below is a concise, illustrative schema:

```json
{
  "version": "1.0.0",
  "layout": {
    "kind": "grid",
    "columns": ["<css-size>", "<css-size>", "..."],
    "rows": ["<css-size>", "..."],
    "areas": [["<slotName>", "<slotName>", "..."], ["..."]],
    "gap": { "column": "<css-size>", "row": "<css-size>" },
    "responsive": [
      {
        "media": "(max-width: 1024px)",
        "columns": ["..."],
        "rows": ["..."]
      }
    ]
  },
  "slots": [
    {
      "name": "<slotName>",
      "constraints": { "minWidth": 280 },
      "capabilities": {
        "droppable": true
      }
    }
  ]
}
```

Notes:

- `areas` defines the grid; each cell is rendered as a distinct `[data-slot]` wrapper
- `constraints` are host-hints (e.g., minWidth) that can be used by future responsive rules
- `capabilities` control standardized behaviors provided by `SlotContainer` (currently `droppable`)
