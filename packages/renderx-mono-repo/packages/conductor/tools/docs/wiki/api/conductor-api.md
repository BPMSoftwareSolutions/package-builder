# Conductor API (Client Surface)

This page documents the supported client-facing API. For advanced/internal methods, see internal package docs (not intended for app use).

## Client API (ConductorClient)

- play(pluginId: string, sequenceId: string, context?: any, priority?): any
- subscribe(eventName: string, callback: (payload: any) => void, context?: any): () => void
- unsubscribe(eventName: string, callback: (payload: any) => void): void
- on(eventName: string, callback: (payload: any) => void, context?: any): () => void // alias of subscribe
- off(eventName: string, callback: (payload: any) => void): void // alias of unsubscribe
- registerCIAPlugins(): Promise<void>
- getStatistics(): ConductorStatistics & { mountedPlugins: number }
- getStatus(): { statistics, eventBus: boolean, sequences: number, plugins: number }
- getSequenceNames(): string[]
- getMountedPlugins(): string[]
- getMountedPluginIds(): string[]

Notes:

- Use play() for all orchestration from clients. Do not call startSequence/queueSequence directly.
- UI should prefer callbacks for direct outcomes; use subscribe() only for domain events emitted via beats.

## Examples

### Initialize and call a sequence

```ts
import {
  initializeCommunicationSystem,
  type ConductorClient,
} from "musical-conductor";

const { conductor } = initializeCommunicationSystem();

await conductor.registerCIAPlugins();

conductor.play(
  "Canvas.component-select-symphony",
  "Canvas.component-select-symphony",
  {
    elementId: "rx-comp-123",
    onSelectionChange: (id: string | null) => console.log("Selected:", id),
  }
);
```

### Subscribe to a domain event (optional)

```ts
const unsub = conductor.subscribe("canvas:element:moved", (e) => {
  console.log("Moved", e);
});
// later
unsub();
```
