import { MusicalConductor } from "../../../../modules/communication/sequences/MusicalConductor";
import { EventBus } from "../../../../modules/communication/EventBus";

describe("MusicalConductor on/off aliases", () => {
  let conductor: MusicalConductor;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    MusicalConductor.resetInstance();
    conductor = MusicalConductor.getInstance(eventBus);
  });

  afterEach(() => {
    MusicalConductor.resetInstance();
  });

  it("on() should delegate to subscribe() and return an unsubscribe function", () => {
    const cb = jest.fn();
    const unsub = conductor.on("test:event", cb);

    expect(typeof unsub).toBe("function");

    eventBus.emit("test:event", { a: 1 });
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
    eventBus.emit("test:event", { a: 2 });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("off() should delegate to unsubscribe() and remove the callback", () => {
    const cb = jest.fn();
    conductor.subscribe("test:event", cb);

    eventBus.emit("test:event");
    expect(cb).toHaveBeenCalledTimes(1);

    conductor.off("test:event", cb);
    eventBus.emit("test:event");
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

