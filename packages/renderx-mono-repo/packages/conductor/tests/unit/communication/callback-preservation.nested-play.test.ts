import { TestEnvironment } from "../../utils/test-helpers";
import type { MusicalSequence } from "../../../modules/communication/sequences/SequenceTypes";

/**
 * Red test: callbacks should survive nested play() even if inner payload is JSON-cloned
 * Simulates PR-preview envs that strip functions across boundaries.
 */

describe("Callback preservation across nested play()", () => {
  afterEach(() => {
    TestEnvironment.cleanup();
  });

  test("downstream handler still receives and invokes callback when inner play JSON-clones context", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    // Downstream (Canvas) symphony that calls the callback when a component is created
    const canvasSequence: MusicalSequence = {
      id: "Canvas.component-create-symphony",
      name: "Canvas.component-create-symphony",
      description: "Create component on canvas",
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
              event: "canvas:component:create",
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
      handleCreate: (data: any, _ctx: any) => {
        // In real flow this would create and then call the callback
        if (typeof data?.onComponentCreated === "function") {
          data.onComponentCreated({ id: "node-1" });
        }
        return { created: true };
      },
    };

    await conductor.mount(canvasSequence as any, canvasHandlers, canvasSequence.id);

    // Upstream (Library) symphony that forwards to Canvas via nested play()
    const libSequence: MusicalSequence = {
      id: "Library.component-drop-symphony",
      name: "Library.component-drop-symphony",
      description: "Drop from library",
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
              event: "library:component:drop",
              title: "Drop",
              dynamics: "mf" as any,
              timing: "immediate" as any,
              data: {},
              errorHandling: "continue",
              handler: "forwardToCanvas",
            } as any,
          ],
        },
      ],
    };

    const libHandlers = {
      forwardToCanvas: async (data: any, ctx: any) => {
        // Simulate PR-preview/transport: inner payload is JSON cloned (functions stripped)
        const cloned = JSON.parse(JSON.stringify(data));
        await ctx.conductor.play(
          "Canvas.component-create-symphony",
          "Canvas.component-create-symphony",
          cloned,
          "CHAINED"
        );
        return { forwarded: true };
      },
    };

    await conductor.mount(libSequence as any, libHandlers, libSequence.id);

    const onCreated = jest.fn();

    // Kick off upstream, passing a function callback in the outer context
    await conductor.play(
      "Library.component-drop-symphony",
      "Library.component-drop-symphony",
      {
        elementId: "rx-1",
        onComponentCreated: onCreated,
      }
    );

    // Give async handlers a tick
    await new Promise((r) => setTimeout(r, 0));

    // Expectation: Even though inner play cloned the payload, callback should be preserved
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: "node-1" }));
  });
});

