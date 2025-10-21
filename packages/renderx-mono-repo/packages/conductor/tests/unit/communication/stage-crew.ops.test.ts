import { TestEnvironment } from "../../utils/test-helpers";

describe("StageCrew V1 ops (attr/style/create/remove)", () => {
  afterEach(() => TestEnvironment.cleanup());

  test("emits stage:cue with attr.set, style.set, create, remove ops", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    const sequence: any = {
      id: "stage-crew-ops-symphony",
      name: "Stage Crew Ops Symphony",
      movements: [
        {
          id: "move-1",
          name: "Ops Move",
          beats: [
            {
              beat: 1,
              event: "stage:ops",
              title: "ops",
              handler: "doOps",
              dynamics: "mf",
              timing: "immediate",
            },
          ],
        },
      ],
      events: { triggers: ["stage:ops"], emits: ["stage:ops"] },
      category: "system",
    };

    const cues: any[] = [];
    const unsubCue = eventBus.subscribe("stage:cue", (cue: any) => cues.push(cue));

    const handlers: any = {
      doOps: (_data: any, ctx: any) => {
        const txn = ctx.stageCrew.beginBeat("corr-ops-1", { handlerName: "doOps" });
        txn.update("#comp-2", { attrs: { role: "button" } });
        txn.update("#comp-2", { style: { left: "10px", top: "20px" } });
        txn.create("div", { classes: ["overlay"], attrs: { id: "ov-1" } }).appendTo("#container");
        txn.remove("#old-comp");
        txn.commit();
        return { done: true };
      },
    };

    await conductor.mount(sequence, handlers, sequence.id);
    await conductor.play(sequence.id, sequence.id, {});

    await new Promise((r) => setTimeout(r, 10));
    try { unsubCue(); } catch {}

    expect(cues.length).toBeGreaterThanOrEqual(1);
    const ops = cues[0].operations;

    // attr.set
    expect(ops).toEqual(expect.arrayContaining([
      expect.objectContaining({ op: "attr.set", selector: "#comp-2", key: "role", value: "button" })
    ]));

    // style.set (two entries)
    expect(ops).toEqual(expect.arrayContaining([
      expect.objectContaining({ op: "style.set", selector: "#comp-2", key: "left", value: "10px" }),
      expect.objectContaining({ op: "style.set", selector: "#comp-2", key: "top", value: "20px" })
    ]));

    // create
    expect(ops).toEqual(expect.arrayContaining([
      expect.objectContaining({ op: "create", tag: "div", parent: "#container" })
    ]));

    // remove
    expect(ops).toEqual(expect.arrayContaining([
      expect.objectContaining({ op: "remove", selector: "#old-comp" })
    ]));
  });
});

