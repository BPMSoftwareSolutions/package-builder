## Summary
Drag is smoother after recent coalescing and layout-only changes, but we still observe a noticeable delay on the first movement and non-trivial cost per Control Panel (CP) update. This issue documents current measurements, target UX, and a focused plan to bring performance at or above industry standards.

## Current behavior (from recent logs)
- During drag
  - Coalesced updates: control.panel.update runs in rAF-paced bursts (source="drag").
  - Drag move/forward beats: typically ~59–76 ms each; first move can spike 100–120 ms when cold.
  - CP update derive: typically ~57–66 ms (outliers 75–95 ms).
  - CP update notify: typically ~56–65 ms (outliers 70–100 ms).
  - Total per CP update (derive+notify): ~120–130 ms typical; up to ~150–170 ms with outliers.
- After drag
  - UI render sequence (3 beats) runs post-selection and costs ~180–200 ms total.
  - Occasional duplicate UI render back-to-back after selection (opportunity to dedupe/throttle).

## What we’ve already implemented
- Coalesced CP updates (rAF; latest wins).
- Gated UI render during drag; optional post-drag render delay via window.__cpPerf.postDragRenderDelayMs.
- Forwarded x/y from drag to CP; “layout-only” derive path avoids reflow-causing reads.
- Skipped width/height reads during drag by caching last known size.
- Memoized element type during drag to avoid repeated classList scans.
- Raised duplicate suppression threshold to LAYOUT_EPS=1.0.
- Cached DOM element, cached route resolution, guarded style writes; set will-change: left, top.
- First-move gating: skip first CP update until pointer delta exceeds a small threshold (default 3 px, configurable).
- Microtask-first scheduling for the first CP update burst (default ON at runtime, OFF in tests).

## User-experience targets
- Definition: time from the first mousemove after mousedown to the dragged element visually matching pointer location.
- 60 Hz displays
  - Ideal: 10–20 ms avg; P95 ≤ 33 ms (1–2 frames).
  - Good: 20–30 ms avg; P95 ≤ 50 ms (≤ 3 frames).
  - First movement (cold): P95 ≤ 80–100 ms (stretch ≤ 50 ms).
- 120 Hz displays
  - Ideal: 5–10 ms avg; P95 ≤ 16 ms.

## Gaps/opportunities
- First-move burst still stacks canvas move + CP derive/notify when cold (perceived ~0.5 s hesitation in some environments).
- Steady-state CP updates cost ~120–130 ms (derive+notify) per burst; we’ve reduced frequency but can further reduce cost.
- Occasional duplicate UI renders post-drag add ~180 ms.

## Proposed next steps (low-risk, incremental)
1) Transform-based dragging (opt-in flag)
   - Use CSS transform: translate3d(x,y,0) during drag; commit left/top once on drag end and clear transform.
   - Rationale: transforms avoid layout/reflow and run on the compositor, typically improving first-frame responsiveness and steady-state tracking.
   - Flag: window.__cpPerf.useTransformDuringDrag (default off) for A/B testing.
2) Render dedupe/throttle post-drag
   - Drop attempts within ~100–150 ms window after a render completes to avoid back-to-back UI render sequences.
3) Tune duplicate suppression
   - Optionally raise LAYOUT_EPS to 2.0 under window.__cpPerf.layoutEps to cut jitter-driven updates in noisy environments.
4) Instrumentation
   - Add input-to-visual latency probes: mousemove timestamp → style apply → rAF paint commit (Performance.now, PerformanceObserver) to track P50/P95 targets in dev logs.
5) Housekeeping
   - Clear drag-time caches (lastTypeById, lastSizeById, element refs) on drag end to avoid stale data.

## Acceptance criteria
- First movement: P95 ≤ 80–100 ms measured from first mousemove to visual alignment; stretch goal ≤ 50 ms.
- Steady-state: CP update P95 ≤ 50 ms per burst (derive+notify) or reduced frequency such that pointer tracking feels “tight”.
- Zero UI render during drag; single UI render post-drag (no duplicates).
- No regressions in existing tests (100/100 passing in CI).

## Notes / flags available for tuning (runtime)
- window.__cpPerf.firstMoveMinDeltaPx (default 3)
- window.__cpPerf.microtaskFirstUpdate (default ON; set false to disable)
- window.__cpPerf.postDragRenderDelayMs (default 0; try 75–100)
- window.__cpPerf.debug (default false; gates console logs)
- Proposed: window.__cpPerf.useTransformDuringDrag (for A/B), window.__cpPerf.layoutEps
