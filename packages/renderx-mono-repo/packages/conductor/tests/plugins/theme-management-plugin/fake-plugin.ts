export function emitStageCue(eventBus: any, cue: any) {
  // Simulate a plugin-bundled StageCrew or direct emit from plugin code
  eventBus.emit("stage:cue", cue);
}

