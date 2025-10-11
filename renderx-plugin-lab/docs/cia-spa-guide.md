# CIA & SPA Guide

## Conductor Integration Architecture (CIA)

CIA is the orchestration layer that manages plugin lifecycle and communication.

### Key Concepts

- **Conductor**: Central orchestrator
- **Channels**: Communication pathways
- **Events**: Plugin lifecycle events

## Symphonic Plugin Architecture (SPA)

SPA defines the plugin structure and interfaces.

### Plugin Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "type": "panel",
  "exports": ["MyPanel"]
}
```

### Plugin Lifecycle

1. Registration
2. Initialization
3. Activation
4. Deactivation
5. Cleanup
