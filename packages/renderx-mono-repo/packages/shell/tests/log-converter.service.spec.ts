import { describe, it, expect } from 'vitest';
import { convertLogToJson } from '../src/ui/diagnostics/services/log-converter.service';

/**
 * Unit tests for Log Converter Service
 * 
 * Tests conversion of console log format to JSON.
 * Part of Issue #305.
 */

describe('Log Converter Service', () => {
  const sampleConsoleLog = `
PluginInterfaceFacade.ts:67 🎼 PluginInterfaceFacade.play(): CanvasComponentResizeMovePlugin -> canvas-component-resize-move-symphony
SequenceOrchestrator.ts:464 🎼 SequenceOrchestrator: Recording sequence execution: -2s79fo
ExecutionQueue.ts:40 🎼 ExecutionQueue: Enqueued "Canvas Component Resize Move" with priority NORMAL (Queue size: 1)
ExecutionQueue.ts:57 🎼 ExecutionQueue: Dequeued "Canvas Component Resize Move"
StatisticsManager.ts:44 📊 StatisticsManager: Recorded sequence execution (0.00ms)
ExecutionQueue.ts:123 🎼 ExecutionQueue: Now executing "Canvas Component Resize Move"
SequenceExecutor.ts:115 🎼 SequenceExecutor: Executing movement "Resize Move" (1/1)
MovementExecutor.ts:54 🎵 MovementExecutor: Starting movement "Resize Move" with 2 beats
PerformanceTracker.ts:134 ⏱️ PerformanceTracker: Started timing movement Resize Move for Canvas Component Resize Move
EventLogger.ts:201 🎵 Movement Started: Resize Move (2 beats)
EventLogger.ts:202 🎼 Sequence: Canvas Component Resize Move
EventLogger.ts:206 🆔 Request ID: canvas-component-resize-move-symphony-1759318585119-iu0kbu4as
EventLogger.ts:210 🥁 Beats Count: 2
MovementExecutor.ts:81 🥁 MovementExecutor: Executing beat 1 (1/2)
PerformanceTracker.ts:51 ⏱️ PerformanceTracker: Started timing beat 1 for Canvas Component Resize Move
EventLogger.ts:139 🎵 Beat 1 Started: Resize Move (canvas:component:resize:move)
PerformanceTracker.ts:95 ⏱️ PerformanceTracker: Beat 1 completed in 5.30ms
MovementExecutor.ts:81 🥁 MovementExecutor: Executing beat 2 (2/2)
PerformanceTracker.ts:51 ⏱️ PerformanceTracker: Started timing beat 2 for Canvas Component Resize Move
EventLogger.ts:139 🎵 Beat 2 Started: Update Component (canvas:component:update)
PerformanceTracker.ts:95 ⏱️ PerformanceTracker: Beat 2 completed in 3.20ms
PerformanceTracker.ts:189 ⏱️ PerformanceTracker: Movement completed in 8.50ms
SequenceExecutor.ts:145 ✅ SequenceExecutor: Sequence "Canvas Component Resize Move" completed in 9ms
  `;

  it('should convert console log to JSON format', () => {
    const result = convertLogToJson(sampleConsoleLog);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should extract sequence metadata', () => {
    const result = convertLogToJson(sampleConsoleLog);
    const execution = result[0];
    
    expect(execution.sequenceName).toBe('Canvas Component Resize Move');
    expect(execution.pluginId).toBe('CanvasComponentResizeMovePlugin');
    expect(execution.requestId).toBe('canvas-component-resize-move-symphony-1759318585119-iu0kbu4as');
  });

  it('should extract movements', () => {
    const result = convertLogToJson(sampleConsoleLog);
    const execution = result[0];
    
    expect(execution.movements).toBeDefined();
    expect(execution.movements.length).toBeGreaterThan(0);
    expect(execution.movements[0].name).toBe('Resize Move');
  });

  it('should extract beats', () => {
    const result = convertLogToJson(sampleConsoleLog);
    const execution = result[0];
    const movement = execution.movements[0];
    
    expect(movement.beats).toBeDefined();
    expect(movement.beats.length).toBe(2);
    expect(movement.beats[0].event).toBe('canvas:component:resize:move');
    expect(movement.beats[1].event).toBe('canvas:component:update');
  });

  it('should extract beat timing', () => {
    const result = convertLogToJson(sampleConsoleLog);
    const execution = result[0];
    const movement = execution.movements[0];
    
    expect(movement.beats[0].duration).toBe(5.3);
    expect(movement.beats[1].duration).toBe(3.2);
  });

  it('should calculate movement duration', () => {
    const result = convertLogToJson(sampleConsoleLog);
    const execution = result[0];
    const movement = execution.movements[0];
    
    expect(movement.duration).toBe(8.5);
  });

  it('should set beat status to success when completed', () => {
    const result = convertLogToJson(sampleConsoleLog);
    const execution = result[0];
    const movement = execution.movements[0];
    
    expect(movement.beats[0].status).toBe('success');
    expect(movement.beats[1].status).toBe('success');
  });

  it('should handle empty log content', () => {
    const result = convertLogToJson('');
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should handle multiple sequences in one log', () => {
    const multiSequenceLog = `
PluginInterfaceFacade.ts:67 🎼 PluginInterfaceFacade.play(): Plugin1 -> sequence1
SequenceOrchestrator.ts:464 🎼 SequenceOrchestrator: Recording sequence execution: exec1
EventLogger.ts:202 🎼 Sequence: Sequence One
EventLogger.ts:201 🎵 Movement Started: Move1 (1 beats)
EventLogger.ts:139 🎵 Beat 1 Started: Beat One (event:one)
PerformanceTracker.ts:95 ⏱️ PerformanceTracker: Beat 1 completed in 5.00ms

PluginInterfaceFacade.ts:67 🎼 PluginInterfaceFacade.play(): Plugin2 -> sequence2
SequenceOrchestrator.ts:464 🎼 SequenceOrchestrator: Recording sequence execution: exec2
EventLogger.ts:202 🎼 Sequence: Sequence Two
EventLogger.ts:201 🎵 Movement Started: Move2 (1 beats)
EventLogger.ts:139 🎵 Beat 1 Started: Beat Two (event:two)
PerformanceTracker.ts:95 ⏱️ PerformanceTracker: Beat 1 completed in 3.00ms
    `;

    const result = convertLogToJson(multiSequenceLog);
    
    expect(result.length).toBe(2);
    expect(result[0].sequenceName).toBe('Sequence One');
    expect(result[1].sequenceName).toBe('Sequence Two');
  });
});

