// Simple MockEventBus for tests that rely on factory helpers
import { EventBus } from "../../modules/communication/EventBus";

export const MockEventBusFactory = {
  create() {
    return new (EventBus as any)();
  },
};

