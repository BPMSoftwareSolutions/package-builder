import { TestEnvironment } from "../../utils/test-helpers";

/**
 * TDD: Minimal StageCrew exposure in plugin handler context
 * Expectation: handler can begin a beat txn, schedule an update op, commit, and we observe a stage:cue event.
 */

describe("StageCrew in handler context (V1 minimal)", () => {
  afterEach(() => TestEnvironment.cleanup());

  test("handler emits a stage:cue on commit with pluginId and operations", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    const sequence: any = {
      id: "stage-crew-test-symphony",
      name: "Stage Crew Test Symphony",
      movements: [
        {
          id: "move-1",
          name: "Move 1",
          beats: [
            {
              beat: 1,
              event: "stage:test",
              title: "use-stage",
              handler: "useStage",
              dynamics: "mf",
              timing: "immediate",
            },
          ],
        },
      ],
      events: { triggers: ["stage:test"], emits: ["stage:test"] },
      category: "system",
    };

    const cues: any[] = [];
    const unsubCue = eventBus.subscribe("stage:cue", (cue: any) =>
      cues.push(cue)
    );

    const handlers: any = {
      useStage: (_data: any, ctx: any) => {
        expect(ctx?.stageCrew).toBeTruthy();
        const txn = ctx.stageCrew.beginBeat("corr-test-1", {
          handlerName: "useStage",
        });
        txn.update("#comp-1", { classes: { add: ["dragging"] } });
        txn.commit();
        return { ok: true };
      },
    };

    await conductor.mount(sequence, handlers, sequence.id);

    // Play the sequence to invoke the handler
    await conductor.play(sequence.id, sequence.id, { foo: "bar" });

    // Wait briefly for async emissions to settle
    await new Promise((r) => setTimeout(r, 10));
    try {
      unsubCue();
    } catch {}

    expect(cues.length).toBeGreaterThanOrEqual(1);
    const cue = cues[0];
    expect(cue).toBeTruthy();
    expect(cue.pluginId).toBe(sequence.id);
    expect(cue.correlationId).toBe("corr-test-1");
    expect(Array.isArray(cue.operations)).toBe(true);
    const op = cue.operations[0];
    expect(op.op).toBe("classes.add");
    expect(op.selector).toBe("#comp-1");
    expect(op.value).toBe("dragging");
  });
});
