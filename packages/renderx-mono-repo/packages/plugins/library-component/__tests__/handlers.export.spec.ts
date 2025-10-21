import { describe, it, expect } from 'vitest';

describe('handlers export', () => {
  it('exports merged handlers object with expected handler functions', async () => {
    // Import from the built dist to test the actual export
    const mod = await import('../dist/index.js');
    
    expect(mod.handlers).toBeDefined();
    expect(typeof mod.handlers).toBe('object');
    
    // Should have onDragStart from drag.symphony
    expect(typeof mod.handlers.onDragStart).toBe('function');
    
    // Should have publishCreateRequested from drop.symphony and drop.container.symphony
    // (both use the same handler name, so merging should work)
    expect(typeof mod.handlers.publishCreateRequested).toBe('function');
  });

  it('handlers object contains all expected keys', async () => {
    const mod = await import('../dist/index.js');
    
    const handlerKeys = Object.keys(mod.handlers);
    
    // Should have exactly these handlers
    expect(handlerKeys).toContain('onDragStart');
    expect(handlerKeys).toContain('publishCreateRequested');
    
    // Should have exactly 2 unique handlers (drag + drop/container-drop merged)
    expect(handlerKeys).toHaveLength(2);
  });

  it('onDragStart handler works without throwing', async () => {
    // Import from the built dist to test the actual export
    const mod = await import('../dist/index.js');

    const mockData = {
      domEvent: {
        dataTransfer: {
          setData: () => {},
          // No setDragImage to test fallback path
        }
      },
      component: { id: 'test-comp', name: 'Test Component' }
    };

    const result = mod.handlers.onDragStart(mockData);
    expect(result).toEqual({ started: true });
  });

  it('publishCreateRequested handler is async function', async () => {
    const mod = await import('../dist/index.js');
    
    // Should be an async function
    expect(mod.handlers.publishCreateRequested.constructor.name).toBe('AsyncFunction');
  });
});
