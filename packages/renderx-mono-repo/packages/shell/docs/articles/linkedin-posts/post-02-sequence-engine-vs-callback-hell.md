Title: Sequence Engine > Callback Hell

If your feature explanation starts with “First component A calls service B which then updates store C which triggers effect D…”, you’re leaking orchestration everywhere.

A lightweight sequence (array of named steps with clear inputs/outputs) creates:
- Traceability (logs: play → beat → result)
- Testability (run sequence with fake context)
- Predictability (no surprise side-effects from random hooks)

Simple mental model:
Play("Library.load") → [resolveData, normalize, publish]

Each beat:
({ ctx, baton }) => ({ baton: { ...baton, components } })

No implicit global mutations. No spooky action at a distance.

Good rule: When you write the 3rd chained async + conditional branch inside a UI effect, extract a named sequence.

Illustration idea (sequence-flow.svg): Horizontal row of labeled boxes Beat 1 → Beat 2 → Beat 3 with a baton icon passing along.
