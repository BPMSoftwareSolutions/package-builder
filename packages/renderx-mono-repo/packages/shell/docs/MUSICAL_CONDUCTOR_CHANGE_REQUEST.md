# MusicalConductor Engine Fix: Allow Multiple Sequences Per Plugin

## Issue Summary

**Problem**: PluginManager.mount() rejects subsequent mount calls for the same plugin ID, preventing plugins from registering multiple sequences.

**Impact**: When a plugin needs to contribute multiple sequences (e.g., `drop` and `container.drop` under the same `LibraryComponentDropPlugin`), only the first sequence registers. Later sequences are ignored with "Plugin already mounted" warning.

**Root Cause**: In `modules/communication/sequences/plugins/PluginManager.ts`, the mount method returns early if a plugin ID is already mounted:

```typescript
if (this.mountedPlugins.has(id)) {
  console.warn(`🧠 Plugin already mounted: ${id}`);
  return { success: false, pluginId: id, message: "Plugin already mounted", reason: "already_mounted", warnings };
}
```

## Evidence from Browser Logs

```
🧠 PluginManager: Attempting to mount plugin: LibraryComponentDropPlugin
✅ Plugin mounted successfully: LibraryComponentDropPlugin
🎼 Sequence registered: Library Component Drop
🧠 PluginManager: Attempting to mount plugin: LibraryComponentDropPlugin
🧠 Plugin already mounted: LibraryComponentDropPlugin  // <- Second sequence ignored
...
❌ SequenceOrchestrator: Sequence with ID "library-component-container-drop-symphony" not found!
```

## Proposed Solution

**Option A (Recommended)**: Modify PluginManager.mount() to append sequences for already-mounted plugins.

Replace the early return with logic that:
1. Registers the new sequence via `sequenceRegistry.register(sequence)`
2. Wires any new handlers for the sequence's events
3. Returns success without rebuilding the plugin

**Pseudocode**:
```typescript
if (this.mountedPlugins.has(id)) {
  // Plugin exists: append sequence and wire handlers
  this.sequenceRegistry.register(sequence);
  
  if (handlers && typeof handlers === "object") {
    // Wire handlers similar to first-mount path
    // Subscribe to event bus per movement/beat
    this.wireHandlersForSequence(sequence, handlers);
  }
  
  console.log(`🎼 Appended sequence "${sequence.name}" to plugin ${id}`);
  return { success: true, pluginId: id, message: "Appended sequence", warnings };
}
```

## Test Cases

1. **Mount plugin with first sequence** → Should succeed and register sequence
2. **Mount same plugin with second sequence** → Should succeed and register additional sequence
3. **Verify both sequences are available** → `sequenceRegistry.has(seq1Id) && sequenceRegistry.has(seq2Id)` should be true
4. **Play both sequences** → Both should execute without "not found" errors

## Expected Behavior After Fix

- Multiple sequences can be registered under the same plugin ID
- Each sequence maintains its own handlers and event routing
- Backwards compatible with existing single-sequence plugins
- Data-driven catalog loading continues to work as designed

## Files to Modify

- `modules/communication/sequences/plugins/PluginManager.ts` (primary change)
- Add test cases in appropriate test files

## Alternative Solutions Considered

**Option B**: Add separate `addSequence(pluginId, sequence, handlers)` API
- More explicit but requires client code changes
- Less backwards compatible

**Option C**: Use distinct plugin IDs for each sequence
- Workaround that doesn't address the architectural limitation
- Creates unnecessary plugin proliferation

## Priority

**High** - This blocks multi-sequence plugins and forces workarounds in client applications.

## Backwards Compatibility

✅ **Fully backwards compatible** - existing single-sequence plugins continue to work unchanged.
