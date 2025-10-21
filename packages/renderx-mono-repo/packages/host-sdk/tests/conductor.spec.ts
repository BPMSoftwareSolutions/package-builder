import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConductor } from '../conductor';

describe('useConductor', () => {
  beforeEach(() => {
    // Clean up global state
    delete (globalThis as any).window;
    vi.clearAllMocks();
  });

  it('should throw error when conductor not initialized in browser', () => {
    // Simulate browser environment without conductor
    (globalThis as any).window = {
      renderxCommunicationSystem: undefined,
    };

    expect(() => useConductor()).toThrow('Conductor not initialized');
  });

  it('should return conductor when properly initialized', () => {
    const mockConductor = {
      play: vi.fn().mockResolvedValue({ success: true }),
    };

    (globalThis as any).window = {
      renderxCommunicationSystem: {
        conductor: mockConductor,
      },
    };

    const conductor = useConductor();
    expect(conductor).toBe(mockConductor);
  });

  it('should return mock conductor in SSR/Node environment', async () => {
    // No window object (Node.js/SSR)
    const conductor = useConductor();

    expect(typeof conductor.play).toBe('function');
    await expect(conductor.play()).resolves.toEqual({});
  });
});
