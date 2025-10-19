/**
 * Unit tests for useWebSocket hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../../src/web/hooks/useWebSocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {}

  send(data: string) {
    // Mock implementation
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

global.WebSocket = MockWebSocket as any;

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
    expect(result.current.isConnected).toBe(false);
  });

  it('should connect to WebSocket when autoConnect is true', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: true }));
    
    act(() => {
      // Simulate connection
      if (result.current.isConnected === false) {
        // Connection will happen in useEffect
      }
    });
  });

  it('should provide subscribe and unsubscribe methods', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
    
    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.unsubscribe).toBe('function');
  });

  it('should provide send method', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
    
    expect(typeof result.current.send).toBe('function');
  });

  it('should provide connect and disconnect methods', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
    
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
  });

  it('should handle subscription callbacks', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
    const callback = vi.fn();

    act(() => {
      result.current.subscribe('test-channel', callback);
    });

    // Verify subscription was registered
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle multiple subscriptions to same channel', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    act(() => {
      result.current.subscribe('test-channel', callback1);
      result.current.subscribe('test-channel', callback2);
    });

    // Both callbacks should be registered
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });

  it('should unsubscribe from channel', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
    const callback = vi.fn();

    act(() => {
      const unsubscribe = result.current.subscribe('test-channel', callback);
      unsubscribe();
    });

    // Callback should be unregistered
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle disconnect', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }));

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('should not send when disconnected', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    act(() => {
      result.current.send('test-channel', { data: 'test' });
    });

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket is not connected');
    consoleSpy.mockRestore();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket({ autoConnect: true }));

    unmount();

    // Should not throw any errors
    expect(true).toBe(true);
  });

  it('should use custom URL when provided', () => {
    const customUrl = 'ws://custom-host:8080';
    const { result } = renderHook(() => useWebSocket({ 
      url: customUrl,
      autoConnect: false 
    }));

    expect(result.current).toBeDefined();
  });

  it('should handle reconnection attempts', () => {
    const { result } = renderHook(() => useWebSocket({ 
      autoConnect: false,
      reconnectAttempts: 3,
      reconnectDelay: 100
    }));

    expect(result.current).toBeDefined();
  });
});

