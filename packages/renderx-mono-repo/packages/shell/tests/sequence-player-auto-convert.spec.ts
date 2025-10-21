// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogParser } from '../src/ui/diagnostics/hooks/useLogParser';

/**
 * Integration tests for Sequence Player auto-conversion feature
 * 
 * Tests that console logs are automatically converted when JSON/text parsing fails.
 * Part of Issue #305.
 */

describe('Sequence Player Auto-Conversion', () => {
  const sampleConsoleLog = `
PluginInterfaceFacade.ts:67 🎼 PluginInterfaceFacade.play(): TestPlugin -> test-sequence
SequenceOrchestrator.ts:464 🎼 SequenceOrchestrator: Recording sequence execution: exec-123
EventLogger.ts:202 🎼 Sequence: Test Sequence
EventLogger.ts:206 🆔 Request ID: test-request-123
EventLogger.ts:201 🎵 Movement Started: Test Movement (2 beats)
EventLogger.ts:210 🥁 Beats Count: 2
EventLogger.ts:139 🎵 Beat 1 Started: First Beat (test:beat:one)
PerformanceTracker.ts:95 ⏱️ PerformanceTracker: Beat 1 completed in 5.00ms
EventLogger.ts:139 🎵 Beat 2 Started: Second Beat (test:beat:two)
PerformanceTracker.ts:95 ⏱️ PerformanceTracker: Beat 2 completed in 3.00ms
PerformanceTracker.ts:189 ⏱️ PerformanceTracker: Movement completed in 8.00ms
SequenceExecutor.ts:145 ✅ SequenceExecutor: Sequence "Test Sequence" completed in 9ms
  `;

  it('should auto-convert console logs when JSON parsing fails', () => {
    const { result } = renderHook(() => useLogParser());

    act(() => {
      result.current.parse({
        content: sampleConsoleLog,
        format: 'json' // Try to parse as JSON first
      });
    });

    // Should successfully parse via auto-conversion
    expect(result.current.execution).toBeDefined();
    expect(result.current.execution?.sequenceName).toBe('Test Sequence');
    expect(result.current.execution?.pluginId).toBe('TestPlugin');
    expect(result.current.autoConverted).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should auto-convert console logs when text parsing fails', () => {
    const { result } = renderHook(() => useLogParser());

    act(() => {
      result.current.parse({
        content: sampleConsoleLog,
        format: 'text' // Try to parse as text first
      });
    });

    // Should successfully parse via auto-conversion
    expect(result.current.execution).toBeDefined();
    expect(result.current.execution?.sequenceName).toBe('Test Sequence');
    expect(result.current.autoConverted).toBe(true);
  });

  it('should set autoConverted flag to true when conversion happens', () => {
    const { result } = renderHook(() => useLogParser());

    act(() => {
      result.current.parse({
        content: sampleConsoleLog,
        format: 'json'
      });
    });

    expect(result.current.autoConverted).toBe(true);
  });

  it('should not set autoConverted flag for valid JSON', () => {
    const { result } = renderHook(() => useLogParser());

    const validJson = JSON.stringify({
      sequenceId: 'test-seq',
      sequenceName: 'Test Sequence',
      pluginId: 'TestPlugin',
      requestId: 'req-123',
      movements: [
        {
          name: 'Movement 1',
          beats: [
            {
              number: 1,
              event: 'test.event',
              duration: 5,
              status: 'success'
            }
          ],
          duration: 5,
          status: 'success'
        }
      ],
      totalDuration: 5,
      status: 'success'
    });

    act(() => {
      result.current.parse({
        content: validJson,
        format: 'json'
      });
    });

    expect(result.current.execution).toBeDefined();
    expect(result.current.autoConverted).toBe(false);
  });

  it('should extract movements and beats from auto-converted logs', () => {
    const { result } = renderHook(() => useLogParser());

    act(() => {
      result.current.parse({
        content: sampleConsoleLog,
        format: 'json'
      });
    });

    expect(result.current.execution?.movements).toBeDefined();
    expect(result.current.execution?.movements.length).toBeGreaterThan(0);
    
    const movement = result.current.execution?.movements[0];
    expect(movement?.name).toBe('Test Movement');
    expect(movement?.beats.length).toBe(2);
    expect(movement?.beats[0].event).toBe('test:beat:one');
    expect(movement?.beats[1].event).toBe('test:beat:two');
  });

  it('should calculate stats for auto-converted logs', () => {
    const { result } = renderHook(() => useLogParser());

    act(() => {
      result.current.parse({
        content: sampleConsoleLog,
        format: 'json'
      });
    });

    expect(result.current.stats).toBeDefined();
    expect(result.current.stats?.totalMovements).toBeGreaterThan(0);
    expect(result.current.stats?.totalBeats).toBeGreaterThan(0);
  });

  it('should reset autoConverted flag when clearing', () => {
    const { result } = renderHook(() => useLogParser());

    act(() => {
      result.current.parse({
        content: sampleConsoleLog,
        format: 'json'
      });
    });

    expect(result.current.autoConverted).toBe(true);

    act(() => {
      result.current.clear();
    });

    expect(result.current.autoConverted).toBe(false);
    expect(result.current.execution).toBeNull();
  });

  it('should show error if both parsing and conversion fail', () => {
    const { result } = renderHook(() => useLogParser());

    const invalidContent = 'This is completely invalid content that cannot be parsed';

    act(() => {
      result.current.parse({
        content: invalidContent,
        format: 'json'
      });
    });

    expect(result.current.execution).toBeNull();
    expect(result.current.error).toBeDefined();
    expect(result.current.autoConverted).toBe(false);
  });

  it('should handle multiple sequences in auto-converted logs', () => {
    const { result } = renderHook(() => useLogParser());

    const multiSequenceLog = `
PluginInterfaceFacade.ts:67 🎼 PluginInterfaceFacade.play(): Plugin1 -> seq1
SequenceOrchestrator.ts:464 🎼 SequenceOrchestrator: Recording sequence execution: exec1
EventLogger.ts:202 🎼 Sequence: First Sequence
EventLogger.ts:201 🎵 Movement Started: Move1 (1 beats)
EventLogger.ts:139 🎵 Beat 1 Started: Beat One (event:one)
PerformanceTracker.ts:95 ⏱️ PerformanceTracker: Beat 1 completed in 5.00ms

PluginInterfaceFacade.ts:67 🎼 PluginInterfaceFacade.play(): Plugin2 -> seq2
SequenceOrchestrator.ts:464 🎼 SequenceOrchestrator: Recording sequence execution: exec2
EventLogger.ts:202 🎼 Sequence: Second Sequence
EventLogger.ts:201 🎵 Movement Started: Move2 (1 beats)
EventLogger.ts:139 🎵 Beat 1 Started: Beat Two (event:two)
PerformanceTracker.ts:95 ⏱️ PerformanceTracker: Beat 1 completed in 3.00ms
    `;

    act(() => {
      result.current.parse({
        content: multiSequenceLog,
        format: 'json'
      });
    });

    // Should use the first sequence
    expect(result.current.execution).toBeDefined();
    expect(result.current.execution?.sequenceName).toBe('First Sequence');
    expect(result.current.autoConverted).toBe(true);
  });
});

