import { TestEnvironment } from "../../../utils/test-helpers";

/**
 * Issue #60: Allow Multiple Sequences Per Plugin
 *
 * Test that mounting multiple sequences under the same pluginId succeeds,
 * registers both sequences, and allows playing either sequence via conductor.play(pluginId, sequenceId,...).
 */
describe("Plugins: multiple sequences per plugin (issue #60)", () => {
  afterEach(() => TestEnvironment.cleanup());

  test("mounting two sequences under the same pluginId succeeds and both can be played", async () => {
    const bus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(bus as any);

    // Initialize ConductorLogger so ctx.logger.* gets routed to console for assertions
    const { ConductorLogger } = await import(
      "../../../../modules/communication/sequences/monitoring/ConductorLogger"
    );
    const logger = new ConductorLogger(bus as any, true);
    logger.init();

    const seq1: any = {
      id: "plug-multi-s1",
      name: "plug-multi-s1",
      movements: [
        {
          id: "m1",
          name: "m1",
          beats: [
            {
              beat: 1,
              event: "s1-go",
              title: "S1 Go",
              handler: "h1",
              timing: "immediate",
              errorHandling: "continue",
              dynamics: "mf",
            },
          ],
        },
      ],
      events: { triggers: ["s1-go"], emits: ["s1-go"] },
      category: "system",
    };

    const seq2: any = {
      id: "plug-multi-s2",
      name: "plug-multi-s2",
      movements: [
        {
          id: "m2",
          name: "m2",
          beats: [
            {
              beat: 1,
              event: "s2-go",
              title: "S2 Go",
              handler: "h2",
              timing: "immediate",
              errorHandling: "continue",
              dynamics: "mf",
            },
          ],
        },
      ],
      events: { triggers: ["s2-go"], emits: ["s2-go"] },
      category: "system",
    };

    const handlers: any = {
      h1: (_d: any, ctx: any) => {
        ctx.logger.info("seq1 ran");
      },
      h2: (_d: any, ctx: any) => {
        ctx.logger.info("seq2 ran");
      },
    };

    const logs: string[] = [];
    const spy = jest.spyOn(console, "log").mockImplementation((...args: any[]) => {
      logs.push(args.join(" "));
    });
    const spyInfo = jest.spyOn(console, "info").mockImplementation((...args: any[]) => {
      logs.push(args.join(" "));
    });

    // Mount first sequence under plugin id "plug-multi"
    const r1 = await (conductor as any).mount(seq1, handlers, "plug-multi");
    expect(r1?.success).toBe(true);

    // Mount second sequence under the SAME plugin id (should succeed)
    const r2 = await (conductor as any).mount(seq2, handlers, "plug-multi");
    expect(r2?.success).toBe(true);

    // Both sequences should be registered
    expect(conductor.getSequence(seq1.id)).toBeTruthy();
    expect(conductor.getSequence(seq2.id)).toBeTruthy();

    // Playing each sequence by id under the same plugin should reach its handler
    await conductor.play("plug-multi", seq1.id, {});
    await conductor.play("plug-multi", seq2.id, {});

    // Wait a bit for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    spy.mockRestore();
    spyInfo.mockRestore();

    // Verify ConductorLogger formatted messages included plugin + handler identifiers
    // e.g., "🧩 plug-multi.h1" and "🧩 plug-multi.h2" present in console output
    const sawH1 = logs.some((l: string) => /🧩\s*plug-multi\.h1/.test(l));
    const sawH2 = logs.some((l: string) => /🧩\s*plug-multi\.h2/.test(l));

    expect(sawH1).toBe(true);
    expect(sawH2).toBe(true);
  });
});

