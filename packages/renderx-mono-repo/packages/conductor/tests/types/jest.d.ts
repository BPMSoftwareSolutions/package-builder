// Type augmentation for custom Jest matchers used in core tests
// Ensures TypeScript knows about toHaveEventSubscription and toHaveSequenceRegistered

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveEventSubscription(eventName: string): R;
      toHaveSequenceRegistered(sequenceName: string): R;
    }
  }
}

export {};

