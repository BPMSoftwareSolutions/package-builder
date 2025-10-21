import { TestEnvironment } from "../../utils/test-helpers";
import type { MusicalSequence } from "../../../modules/communication/sequences/SequenceTypes";

/**
 * Hardening tests for callback preservation
 * - multiple callbacks at various nested paths (including arrays)
 * - sibling nested plays sharing the same correlation id (cleanup once)
 */

describe("Callback preservation hardening", () => {
  afterEach(() => {
    TestEnvironment.cleanup();
    jest.restoreAllMocks();
  });

  test("rehydrates multiple callbacks at deep paths and inside arrays across nested play", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    // Downstream Canvas sequence that calls all provided callbacks
    const canvasSequence: MusicalSequence = {
      id: "Canvas.multiple-create",
      name: "Canvas.multiple-create",
      description: "Create multiple",
      key: "C Major",
      tempo: 120,
      category: "system" as any,
      movements: [
        {
          id: "mv1",
          name: "Create",
          beats: [
            {
              beat: 1,
              event: "canvas:multiple:create",
              title: "Create",
              dynamics: "mf" as any,
              timing: "immediate" as any,
              data: {},
              errorHandling: "continue",
              handler: "handleCreate",
            } as any,
          ],
        },
      ],
    };

    const canvasHandlers = {
      handleCreate: (data: any) => {
        if (typeof data?.onTop === "function") data.onTop("top");
        if (typeof data?.nested?.ui?.onInner === "function")
          data.nested.ui.onInner({ ok: true });
        if (Array.isArray(data?.list) && typeof data.list[0]?.onItem === "function")
          data.list[0].onItem(0);
        return { created: true };
      },
    };

    await conductor.mount(canvasSequence as any, canvasHandlers, canvasSequence.id);

    // Upstream Library sequence that forwards via nested play with JSON-cloned payload
    const libSequence: MusicalSequence = {
      id: "Library.forward-to-canvas-multi",
      name: "Library.forward-to-canvas-multi",
      description: "Forward",
      key: "C Major",
      tempo: 120,
      category: "system" as any,
      movements: [
        {
          id: "mv1",
          name: "Drop",
          beats: [
            {
              beat: 1,
              event: "library:forward:multi",
              title: "Drop",
              dynamics: "mf" as any,
              timing: "immediate" as any,
              data: {},
              errorHandling: "continue",
              handler: "forward",
            } as any,
          ],
        },
      ],
    };

    const libHandlers = {
      forward: async (data: any, ctx: any) => {
        const cloned = JSON.parse(JSON.stringify(data));
        await ctx.conductor.play(
          "Canvas.multiple-create",
          "Canvas.multiple-create",
          cloned,
          "CHAINED"
        );
        return { forwarded: true };
      },
    };

    await conductor.mount(libSequence as any, libHandlers, libSequence.id);

    const onTop = jest.fn();
    const onInner = jest.fn();
    const onItem = jest.fn();

    await conductor.play(
      "Library.forward-to-canvas-multi",
      "Library.forward-to-canvas-multi",
      {
        onTop,
        nested: { ui: { onInner } },
        list: [{ onItem }],
      }
    );

    await new Promise((r) => setTimeout(r, 0));

    expect(onTop).toHaveBeenCalledTimes(1);
    expect(onTop).toHaveBeenCalledWith("top");
    expect(onInner).toHaveBeenCalledTimes(1);
    expect(onInner).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    expect(onItem).toHaveBeenCalledTimes(1);
    expect(onItem).toHaveBeenCalledWith(0);
  });

  test("single cleanup when two sibling nested plays share correlation id and both complete", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    // One downstream sequence reused twice
    const canvasSequence: MusicalSequence = {
      id: "Canvas.double-create",
      name: "Canvas.double-create",
      description: "Create twice",
      key: "C Major",
      tempo: 120,
      category: "system" as any,
      movements: [
        {
          id: "mv1",
          name: "Create",
          beats: [
            {
              beat: 1,
              event: "canvas:double:create",
              title: "Create",
              dynamics: "mf" as any,
              timing: "immediate" as any,
              data: {},
              errorHandling: "continue",
              handler: "handleCreate",
            } as any,
          ],
        },
      ],
    };

    const onCreated = jest.fn();
    const canvasHandlers = {
      handleCreate: (data: any) => {
        if (typeof data?.onCreated === "function") data.onCreated({ id: Math.random() });
        return {};
      },
    };
    await conductor.mount(canvasSequence as any, canvasHandlers, canvasSequence.id);

    // Upstream that triggers two nested plays
    const libSequence: MusicalSequence = {
      id: "Library.double-forward",
      name: "Library.double-forward",
      description: "Forward twice",
      key: "C Major",
      tempo: 120,
      category: "system" as any,
      movements: [
        {
          id: "mv1",
          name: "Drop",
          beats: [
            {
              beat: 1,
              event: "library:double:forward",
              title: "Drop",
              dynamics: "mf" as any,
              timing: "immediate" as any,
              data: {},
              errorHandling: "continue",
              handler: "forwardTwice",
            } as any,
          ],
        },
      ],
    };

    const libHandlers = {
      forwardTwice: async (data: any, ctx: any) => {
        const cloned = JSON.parse(JSON.stringify(data));
        // Start two sibling nested plays; they share correlation id propagated by PluginManager
        await ctx.conductor.play("Canvas.double-create", "Canvas.double-create", cloned, "CHAINED");
        await ctx.conductor.play("Canvas.double-create", "Canvas.double-create", cloned, "CHAINED");
        return {};
      },
    };

    await conductor.mount(libSequence as any, libHandlers, libSequence.id);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    await conductor.play(
      "Library.double-forward",
      "Library.double-forward",
      { onCreated }
    );

    await new Promise((r) => setTimeout(r, 0));

    // Callback should fire twice (two nested plays)
    expect(onCreated).toHaveBeenCalledTimes(2);

    // Exactly one cleanup for the correlation id (MusicalConductor logs one line when cleaning by correlationId)
    const cleanupLogs = logSpy.mock.calls
      .map((args) => args.join(" "))
      .filter((s) => s.includes("cleaned callbacks for correlationId="));
    expect(cleanupLogs.length).toBe(1);
  });
});

