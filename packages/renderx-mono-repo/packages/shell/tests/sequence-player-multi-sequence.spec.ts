/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogParser } from '../src/ui/diagnostics/hooks/useLogParser';

describe('Sequence Player - Multi-Sequence Support', () => {
  it('should parse JSON array with multiple sequences', () => {
    const { result } = renderHook(() => useLogParser());

    const multiSequenceJson = JSON.stringify([
      {
        sequenceId: 'seq-1',
        sequenceName: 'Sequence 1',
        pluginId: 'Plugin1',
        requestId: 'req-1',
        movements: [],
        totalDuration: 10,
        status: 'success'
      },
      {
        sequenceId: 'seq-2',
        sequenceName: 'Sequence 2',
        pluginId: 'Plugin2',
        requestId: 'req-2',
        movements: [],
        totalDuration: 20,
        status: 'success'
      },
      {
        sequenceId: 'seq-3',
        sequenceName: 'Sequence 3',
        pluginId: 'Plugin3',
        requestId: 'req-3',
        movements: [],
        totalDuration: 15,
        status: 'error'
      }
    ]);

    act(() => {
      result.current.parse({
        content: multiSequenceJson,
        format: 'json'
      });
    });

    expect(result.current.error).toBeNull();
    expect(result.current.totalSequences).toBe(3);
    expect(result.current.hasMultipleSequences).toBe(true);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.execution?.sequenceId).toBe('seq-1');
  });

  it('should navigate to next sequence', () => {
    const { result } = renderHook(() => useLogParser());

    const multiSequenceJson = JSON.stringify([
      {
        sequenceId: 'seq-1',
        sequenceName: 'Sequence 1',
        pluginId: 'Plugin1',
        requestId: 'req-1',
        movements: [],
        totalDuration: 10,
        status: 'success'
      },
      {
        sequenceId: 'seq-2',
        sequenceName: 'Sequence 2',
        pluginId: 'Plugin2',
        requestId: 'req-2',
        movements: [],
        totalDuration: 20,
        status: 'success'
      }
    ]);

    act(() => {
      result.current.parse({
        content: multiSequenceJson,
        format: 'json'
      });
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.execution?.sequenceId).toBe('seq-1');

    act(() => {
      result.current.nextSequence();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.execution?.sequenceId).toBe('seq-2');
  });

  it('should navigate to previous sequence', () => {
    const { result } = renderHook(() => useLogParser());

    const multiSequenceJson = JSON.stringify([
      {
        sequenceId: 'seq-1',
        sequenceName: 'Sequence 1',
        pluginId: 'Plugin1',
        requestId: 'req-1',
        movements: [],
        totalDuration: 10,
        status: 'success'
      },
      {
        sequenceId: 'seq-2',
        sequenceName: 'Sequence 2',
        pluginId: 'Plugin2',
        requestId: 'req-2',
        movements: [],
        totalDuration: 20,
        status: 'success'
      }
    ]);

    act(() => {
      result.current.parse({
        content: multiSequenceJson,
        format: 'json'
      });
    });

    act(() => {
      result.current.nextSequence();
    });

    expect(result.current.currentIndex).toBe(1);

    act(() => {
      result.current.prevSequence();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.execution?.sequenceId).toBe('seq-1');
  });

  it('should jump to specific sequence by index', () => {
    const { result } = renderHook(() => useLogParser());

    const multiSequenceJson = JSON.stringify([
      {
        sequenceId: 'seq-1',
        sequenceName: 'Sequence 1',
        pluginId: 'Plugin1',
        requestId: 'req-1',
        movements: [],
        totalDuration: 10,
        status: 'success'
      },
      {
        sequenceId: 'seq-2',
        sequenceName: 'Sequence 2',
        pluginId: 'Plugin2',
        requestId: 'req-2',
        movements: [],
        totalDuration: 20,
        status: 'success'
      },
      {
        sequenceId: 'seq-3',
        sequenceName: 'Sequence 3',
        pluginId: 'Plugin3',
        requestId: 'req-3',
        movements: [],
        totalDuration: 15,
        status: 'success'
      }
    ]);

    act(() => {
      result.current.parse({
        content: multiSequenceJson,
        format: 'json'
      });
    });

    act(() => {
      result.current.goToSequence(2);
    });

    expect(result.current.currentIndex).toBe(2);
    expect(result.current.execution?.sequenceId).toBe('seq-3');
  });

  it('should not navigate beyond bounds', () => {
    const { result } = renderHook(() => useLogParser());

    const multiSequenceJson = JSON.stringify([
      {
        sequenceId: 'seq-1',
        sequenceName: 'Sequence 1',
        pluginId: 'Plugin1',
        requestId: 'req-1',
        movements: [],
        totalDuration: 10,
        status: 'success'
      },
      {
        sequenceId: 'seq-2',
        sequenceName: 'Sequence 2',
        pluginId: 'Plugin2',
        requestId: 'req-2',
        movements: [],
        totalDuration: 20,
        status: 'success'
      }
    ]);

    act(() => {
      result.current.parse({
        content: multiSequenceJson,
        format: 'json'
      });
    });

    // Try to go previous from first sequence
    act(() => {
      result.current.prevSequence();
    });

    expect(result.current.currentIndex).toBe(0);

    // Go to last sequence
    act(() => {
      result.current.nextSequence();
    });

    expect(result.current.currentIndex).toBe(1);

    // Try to go next from last sequence
    act(() => {
      result.current.nextSequence();
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it('should handle single sequence (no multi-sequence UI)', () => {
    const { result } = renderHook(() => useLogParser());

    const singleSequenceJson = JSON.stringify({
      sequenceId: 'seq-1',
      sequenceName: 'Sequence 1',
      pluginId: 'Plugin1',
      requestId: 'req-1',
      movements: [],
      totalDuration: 10,
      status: 'success'
    });

    act(() => {
      result.current.parse({
        content: singleSequenceJson,
        format: 'json'
      });
    });

    expect(result.current.totalSequences).toBe(1);
    expect(result.current.hasMultipleSequences).toBe(false);
    expect(result.current.execution?.sequenceId).toBe('seq-1');
  });

  it('should provide all executions for aggregate stats', () => {
    const { result } = renderHook(() => useLogParser());

    const multiSequenceJson = JSON.stringify([
      {
        sequenceId: 'seq-1',
        sequenceName: 'Sequence 1',
        pluginId: 'Plugin1',
        requestId: 'req-1',
        movements: [],
        totalDuration: 10,
        status: 'success'
      },
      {
        sequenceId: 'seq-2',
        sequenceName: 'Sequence 2',
        pluginId: 'Plugin2',
        requestId: 'req-2',
        movements: [],
        totalDuration: 20,
        status: 'success'
      },
      {
        sequenceId: 'seq-3',
        sequenceName: 'Sequence 3',
        pluginId: 'Plugin3',
        requestId: 'req-3',
        movements: [],
        totalDuration: 15,
        status: 'error'
      }
    ]);

    act(() => {
      result.current.parse({
        content: multiSequenceJson,
        format: 'json'
      });
    });

    expect(result.current.allExecutions).toHaveLength(3);
    expect(result.current.allExecutions[0].sequenceId).toBe('seq-1');
    expect(result.current.allExecutions[1].sequenceId).toBe('seq-2');
    expect(result.current.allExecutions[2].sequenceId).toBe('seq-3');
  });
});

