# ADR-0001 (update) — Beat Kind Taxonomy in Musical Conductor

**Change summary:** Add `kind: "io"` for local persistence/caching/FS/logging that does **not** leave the device/network.

## Beat kinds (final)

| kind         | Purpose                                           | Conductor-injected caps on `ctx`       |
| ------------ | ------------------------------------------------- | -------------------------------------- |
| `pure`       | Computation/orchestration only                    | `payload`, `util`, `conductor`         |
| `io`         | Local I/O (caching, KV, IndexedDB, Cache API, FS) | `io` (+ everything from `pure`)        |
| `api`        | Remote calls (HTTP/gRPC/WebSocket)                | `apiClient` (+ everything from `pure`) |
| `stage-crew` | DOM/CSS mutations via StageCrew                   | `stageCrew` (+ everything from `pure`) |

* `kind` defaults to `pure`.
* Conductor **injects only the capability of that kind**; others are guarded with throwing proxies (attempting to use `stageCrew` in a `pure/io/api` beat throws).
* CIA/SPA validators enforce the mapping and file locations.

## Ordering guidance (movement best practice)

* Prefer: **`pure` → (`api` and/or `io`) → `stage-crew` → `pure` (notify)**
* Only **one `stage-crew` beat per movement**, and it should be **last** before notify.
* Use `api` before `io` if you’re **fetching** then caching. Use `io` only if you’re **reading/writing local state** (cache, undo stack, snapshot log, KV, IndexedDB, file).

## Runtime injection (pseudo)

```ts
switch (beat.kind ?? "pure") {
  case "stage-crew": ctx.stageCrew = StageCrew.for(seq, beat); break;
  case "api":        ctx.apiClient = ApiClient.for(pluginId);  break;
  case "io":         ctx.io        = IOClient.for(pluginId);    break;
  default:           /* pure */                                  break;
}
// Guard everything else:
ctx.stageCrew ||= ThrowingProxy("StageCrew not available in this beat");
ctx.apiClient ||= ThrowingProxy("API not available in this beat");
ctx.io        ||= ThrowingProxy("IO not available in this beat");
```

## File conventions (recommended)

* `*.arrangement.ts` → `pure`
* `*.io.ts` → `io`
* `*.api.ts` → `api`
* `*.stage-crew.ts` → `stage-crew`
* `*.notify.ts` → final `pure` notify beat

## Telemetry

* Log `{sequenceId, movementId, beat, kind, durationMs}`.
* For `io`: `{op, key, size?, latencyMs}` (no sensitive payloads).
* For `api`: `{method, endpoint, status, latencyMs}`.
* For `stage-crew`: txn intent summary before commit.

## CIA/SPA rules (delta)

* If `beat.kind === "io"`, handler must live in `*.io.ts`; **must not** import StageCrew or DOM APIs.
* UI code remains banned from DOM, StageCrew, **and IO/APIs** (UI is view-only).
