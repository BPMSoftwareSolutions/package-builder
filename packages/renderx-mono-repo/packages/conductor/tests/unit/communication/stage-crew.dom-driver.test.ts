import { TestEnvironment } from "../../utils/test-helpers";

describe("StageCrew DOM driver V1 (jsdom)", () => {
  afterEach(() => TestEnvironment.cleanup());

  test("commit applies classes/attrs/styles and create/remove to DOM in jsdom", async () => {
    // Build a small DOM
    document.body.innerHTML = `
      <div id="container">
        <div id="comp-x"></div>
        <div id="old"></div>
      </div>
    `;

    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    const sequence: any = {
      id: "stage-crew-dom-symphony",
      name: "Stage Crew DOM Symphony",
      movements: [
        {
          id: "move-1",
          name: "DOM Move",
          beats: [
            {
              beat: 1,
              event: "stage:dom",
              title: "dom",
              handler: "domOps",
              dynamics: "mf",
              timing: "immediate",
            },
          ],
        },
      ],
      events: { triggers: ["stage:dom"], emits: ["stage:dom"] },
      category: "system",
    };

    const handlers: any = {
      domOps: (_data: any, ctx: any) => {
        const txn = ctx.stageCrew.beginBeat("corr-dom-1", { handlerName: "domOps" });
        txn.update("#comp-x", { classes: { add: ["dragging"] }, attrs: { role: "button" }, style: { left: "5px" } });
        txn.create("span", { classes: ["overlay"], attrs: { id: "ov-2" } }).appendTo("#container");
        txn.remove("#old");
        txn.commit();
        return { ok: true };
      },
    };

    await conductor.mount(sequence, handlers, sequence.id);
    await conductor.play(sequence.id, sequence.id, {});
    await new Promise((r) => setTimeout(r, 0));

    const comp = document.querySelector("#comp-x") as HTMLElement;
    expect(comp.classList.contains("dragging")).toBe(true);
    expect(comp.getAttribute("role")).toBe("button");
    expect((comp.style as any).left).toBe("5px");

    const ov = document.querySelector("#ov-2") as HTMLElement;
    expect(ov).toBeTruthy();
    expect(ov.parentElement?.id).toBe("container");
    expect(ov.classList.contains("overlay")).toBe(true);

    const old = document.querySelector("#old");
    expect(old).toBeNull();
  });
});

