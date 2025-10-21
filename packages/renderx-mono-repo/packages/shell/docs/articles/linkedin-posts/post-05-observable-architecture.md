Title: Observable Architecture Beats Clever Architecture

Great systems narrate themselves while running.

Make every orchestration path observable:
play:Library.load → beat:resolveData (12ms)
play:Library.load → beat:normalize (4ms)
play:Library.load → beat:publish (1ms)
play:Library.load ✔ success (17ms)

Why this matters:
- Debug at runtime without reproducing locally
- Performance tuning is obvious (slow beat stands out)
- Correlate user complaints with specific flows

Minimal Kit:
- Correlation ID generator
- Structured logger (no free-text soup)
- Sequence runner that emits lifecycle events
- Log viewer (even a simple panel)

If your logs read like a stream-of-consciousness novel, refactor. They should read like a screenplay.

Illustration idea (observable-arch.svg): Timeline with beats as vertical markers, durations annotated.
