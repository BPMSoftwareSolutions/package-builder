import { TestEnvironment } from "../../utils/test-helpers";

describe("Plugin handler context integrity (ADR-0008)", () => {
  test("handler context provides minimal conductor with play()", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    // Define a minimal test plugin
    const sequence = {
      id: "context-integrity-test-symphony",
      name: "Context Integrity Test Symphony",
      movements: [
        {
          id: "ctx-move",
          name: "Context Move",
          beats: [
            {
              beat: 1,
              event: "context:test",
              title: "ctx",
              handler: "checkCtx",
              dynamics: "forte",
              timing: "immediate",
            },
          ],
        },
      ],
      events: { triggers: ["context:test"], emits: ["context:test"] },
      category: "system",
    } as any;

    const results: any[] = [];
    const handlers = {
      checkCtx: (_data: any, ctx: any) => {
        results.push({
          hasConductor: !!ctx?.conductor,
          hasPlay: typeof ctx?.conductor?.play === "function",
          hasEmit: typeof ctx?.emit === "function",
        });
        return { ok: true };
      },
    } as any;

    await conductor.mount(sequence, handlers, sequence.id);

    // Wait for start and completion to ensure handler ran
    await new Promise<void>(async (resolve, reject) => {
      let started = false;
      const unsubStart = eventBus.subscribe("sequence-started", (_evt: any) => {
        started = true;
      });
      const unsubDone = eventBus.subscribe(
        "sequence-completed",
        (_evt: any) => {
          try {
            unsubStart();
            unsubDone();
            resolve();
          } catch {}
        }
      );
      const to = setTimeout(() => {
        try {
          unsubStart();
          unsubDone();
        } catch {}
        reject(
          new Error(
            `timeout waiting for sequence-completed (started=${started})`
          )
        );
      }, 5000);
      await conductor.play(sequence.id, sequence.id, { foo: "bar" });
    });

    expect(results.length).toBe(1);
    const r = results[0];
    expect(r.hasConductor).toBe(true);
    expect(r.hasPlay).toBe(true);
    // Optional: if ADR-0002 is enforced, emit should be removed; for now just record
    // expect(r.hasEmit).toBe(false);
  });
});
