## Snapshot of StageCrew API surface

StageCrew V1 supports only these write ops:
- classes.add / classes.remove
- attr.set
- style.set (via el.style[key] = value)
- create(tag).appendTo(parent)
- remove(selector)

Reference from the file you have open:
````ts path=modules/communication/sequences/stage/StageCrew.ts mode=EXCERPT
export type StageOp =
  | { op: "classes.add" ... } | { op: "classes.remove" ... }
  | { op: "attr.set" ... } | { op: "style.set" ... }
  | { op: "create" ... } | { op: "remove" ... };
````

This is intentionally small and great for first steps. As plugins grow, here are the main limitations you’ll likely hit, with suggested evolutions.

## 1) Content updates (text/html)

- Limitation: No way to set textContent or innerHTML (you’ve already run into this).
- Impact: Can’t update button labels, inline <style> content, dynamic content blocks.
- Suggestion: Add ops text.set and html.set; allow update({ text, html }); optionally allow create(..., { text?, html? }).

## 2) Moving/reordering nodes

- Limitation: No op to move an existing element relative to another (before/after/append).
- Impact: Reparenting, reordering lists, drag-and-drop, overlay re-stacking require remove+create (losing state, listeners).
- Suggestion: move(selector, { before | after | appendTo }) to avoid teardown and preserve order-specific styles.

## 3) Referencing and scoping

- Limitation: Ops are selector-only; no stable handles/refs to created elements; no automatic scoping to a plugin root.
- Impact: Selector collisions across plugins, brittle DOM queries, extra querySelector work per op.
- Suggestions:
  - Provide a pluginRoot scope so selectors are automatically prefixed (e.g., within #plugin-<id>).
  - Return a Ref from create() and allow update(ref, …), move(ref, …) to avoid repeated queries.

## 4) Reads and measurements

- Limitation: No “measure” phase helper; all API is writes.
- Impact: Layout thrash if plugins interleave reads (getBoundingClientRect) and writes; difficult to coordinate rAF ticks.
- Suggestion: stageCrew.measure(fn) to batch reads before writes; or a txn.batch(fn) that sequences read->write under the hood.

## 5) Styles and CSS specifics

- Limitation: style.set uses property assignment; not setProperty with priority; no CSS variable helpers; no stylesheet-level control.
- Impact: Can’t set !important; less ergonomic for CSS custom properties; can’t manage <style> sheets beyond attrs unless we add text.set.
- Suggestions:
  - style.setProperty op with optional priority.
  - Helpers for CSS variables: styleVar.set("--name", value[, priority]).
  - With text.set, inline <style> use cases are covered; link-based styles can remain out-of-scope.

## 6) Attributes vs properties (forms and stateful elements)

- Limitation: Only attr.set; no property.set (value, checked, disabled, selectedIndex, etc.).
- Impact: Form inputs or interactive components need property writes to reflect live state.
- Suggestion: prop.set op for common properties (value, checked, disabled, open, etc.).

## 7) Event listeners and behaviors

- Limitation: No event attachment API (by design; events should flow through sequences).
- Impact: UI widgets often need local DOM listeners.
- Options:
  - Keep events out of StageCrew and use framework/host to attach listeners.
  - If needed, a constrained event.add/remove limited to plugin root with automatic cleanup on plugin unmount.

## 8) Bulk operations and ergonomics

- Limitation: update() is single-target and granular; many ops produce lots of queue items.
- Impact: Verbose code and potential overhead for multi-target updates.
- Suggestions:
  - Allow selector lists or a select().forEach() style helper.
  - Support minimal “macro” ops (e.g., classes.toggle, attrs.merge).

## 9) Performance and batching

- Limitation: Each op does its own querySelector at apply; txn.commit({ batch }) only controls rAF scheduling.
- Impact: Many ops → many DOM queries; may affect frame time.
- Suggestions:
  - Cache element lookups per txn apply pass.
  - Group ops by selector, coalescing style/attrs updates.
  - Option to coalesce multiple update() calls on the same selector in one txn.

## 10) Shadow DOM, Web Components, and SVG

- Limitation: No explicit support for:
  - Shadow DOM host traversal (querySelector won’t find inside shadow roots).
  - SVG namespaced attributes or element creation nuances.
- Impact: Component libraries using Web Components or SVG heavy UIs may hit limits.
- Suggestions:
  - Optional root: Element parameter for txn/update/create targeting shadow roots.
  - Namespaced attr.setNS for SVG if needed.

## 11) Accessibility and focus/scroll control

- Limitation: No ops for focus(), blur(), scrollIntoView(), selection ranges.
- Impact: Usability flows that need to move focus or scroll cannot express this via StageCrew.
- Suggestions:
  - Add focus.set(selector, { focus: true }) or explicit focus(selector), blur(selector).
  - scrollTo/scrollIntoView ops with minimal parameters.

## 12) Error handling and rollback

- Limitation: No rollback or transactional guard if applying ops throws.
- Impact: Harder to reason about partial mutations during exceptions.
- Suggestions:
  - txn.rollback(err) hook (at least for logging), or internal try-catch per op with failure reporting.
  - Continue-on-error policy with an error array in the cue for observability.

## 13) Observability and testing

- Strength: Emits stage:cue with operations and meta and is allow-listed by SPAValidator.
- Limitation: No per-op result status; no timing/latency info; no IDs for created nodes unless attrs.id supplied.
- Suggestions:
  - Include apply results (counts, misses) in cue meta in dev.
  - Optionally auto-assign IDs for created nodes if not provided, returning a ref.

## 14) Security/escaping for HTML content

- Limitation: If/when html.set is added, responsibility for sanitization is not defined.
- Suggestion: Make html.set opt-in and document that plugin must sanitize or provide a sanitizedHtml flag.

## 15) API ergonomics for frequent patterns

- Limitation: Common plugin patterns (ensure <style> exists + update text) require multiple calls.
- Suggestion:
  - Thin StageDoc facade (wrapper) for getElementById/createElement/appendChild + updateText that emits StageCrew ops.
  - Helper: ensureStyleTag(id, { text }) to make “create if missing, update in place” atomic.

## What I’d prioritize next (minimal, high impact)

1) text.set (and optional html.set) in StageCrew
2) move() op for reparenting/reordering
3) prop.set for value/checked/disabled
4) style.setProperty with priority (enables !important and CSS vars)
5) Simple measure() helper to sequence reads/writes
6) StageDoc micro-wrapper for the limited DOM patterns your plugins use today

These cover the majority of scale-out pain without turning StageCrew into a second DOM.
