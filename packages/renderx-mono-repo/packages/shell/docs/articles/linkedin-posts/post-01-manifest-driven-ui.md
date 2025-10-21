Title: Stop Hard‑Coding Wiring: Manifest-Driven UI

The fastest way to tame front-end sprawl? Move fragile wiring (what loads where, what reacts to what) into a manifest.

Why it works:
- Single source of truth (slots, modules, exports)
- AI assistants can edit safely without touching runtime code
- Review diffs shrink from 300 lines → 15 JSON lines
- Dynamic experimentation (swap panels, A/B variants) becomes data, not surgery

Mini-Playbook:
1. Define plugin manifest (id, slot, module, export)
2. Build a generic SlotLoader that reads it
3. Emit structured load + error events
4. Track correlation IDs in logs

Smell it replaces: scattered dynamic imports + conditional trees.

Try this question in your codebase: “Can I list every UI surface + its source module in one file?” If not—it’s time.

Illustration idea (manifest-orbit.svg): Central manifest node with orbiting plugin nodes labeled library / canvas / control-panel, arrows flowing into generic SlotLoader.
