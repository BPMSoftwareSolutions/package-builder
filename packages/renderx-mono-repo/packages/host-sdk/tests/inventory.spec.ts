import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listComponents,
  getComponentById,
  onInventoryChanged,
  Inventory,
  setMockInventory,
  setMockComponent,
  clearMockInventory
} from '../inventory';
import type { ComponentSummary, Component } from '../types';

describe('Inventory API', () => {
  beforeEach(() => {
    // Clean up global state
    delete (globalThis as any).window;
    clearMockInventory();
    vi.clearAllMocks();
  });

  describe('listComponents', () => {
    it('should return empty array by default in Node environment', async () => {
      const components = await listComponents();
      expect(components).toEqual([]);
    });

    it('should return mock inventory in Node environment', async () => {
      const mockComponents: ComponentSummary[] = [
        { id: 'comp1', name: 'Button', tags: ['ui', 'interactive'] },
        { id: 'comp2', name: 'Input', tags: ['form'] }
      ];
      
      setMockInventory(mockComponents);
      const components = await listComponents();
      expect(components).toEqual(mockComponents);
    });

    it('should delegate to host when available', async () => {
      const mockComponents: ComponentSummary[] = [
        { id: 'host-comp', name: 'Host Button' }
      ];
      
      const mockInventory = {
        listComponents: vi.fn().mockResolvedValue(mockComponents),
        getComponentById: vi.fn(),
        onInventoryChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { inventory: mockInventory },
      };

      const components = await listComponents();
      expect(components).toEqual(mockComponents);
      expect(mockInventory.listComponents).toHaveBeenCalled();
    });

    it('should handle host API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockInventory = {
        listComponents: vi.fn().mockRejectedValue(new Error('Host error')),
        getComponentById: vi.fn(),
        onInventoryChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { inventory: mockInventory },
      };

      const components = await listComponents();
      expect(components).toEqual([]);
      expect(mockInventory.listComponents).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should warn when host inventory not available', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      (globalThis as any).window = {
        RenderX: {},
      };

      const components = await listComponents();
      expect(components).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Host Inventory API not available. Using empty inventory.');
      
      consoleSpy.mockRestore();
    });
  });

  describe('getComponentById', () => {
    it('should return null for unknown component in Node environment', async () => {
      const component = await getComponentById('unknown');
      expect(component).toBeNull();
    });

    it('should return mock component in Node environment', async () => {
      const mockComponent: Component = {
        id: 'comp1',
        name: 'Button',
        json: { type: 'button' },
        tags: ['ui'],
        metadata: { version: '1.0' }
      };
      
      setMockComponent(mockComponent);
      const component = await getComponentById('comp1');
      expect(component).toEqual(mockComponent);
    });

    it('should delegate to host when available', async () => {
      const mockComponent: Component = {
        id: 'host-comp',
        name: 'Host Button',
        json: { type: 'button' }
      };
      
      const mockInventory = {
        listComponents: vi.fn(),
        getComponentById: vi.fn().mockResolvedValue(mockComponent),
        onInventoryChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { inventory: mockInventory },
      };

      const component = await getComponentById('host-comp');
      expect(component).toEqual(mockComponent);
      expect(mockInventory.getComponentById).toHaveBeenCalledWith('host-comp');
    });

    it('should handle host API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockInventory = {
        listComponents: vi.fn(),
        getComponentById: vi.fn().mockRejectedValue(new Error('Host error')),
        onInventoryChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { inventory: mockInventory },
      };

      const component = await getComponentById('test-id');
      expect(component).toBeNull();
      expect(mockInventory.getComponentById).toHaveBeenCalledWith('test-id');

      consoleSpy.mockRestore();
    });
  });

  describe('onInventoryChanged', () => {
    it('should work in Node environment', () => {
      const callback = vi.fn();
      const unsubscribe = onInventoryChanged(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Test that callback is called when inventory changes
      const mockComponents: ComponentSummary[] = [
        { id: 'comp1', name: 'Button' }
      ];
      setMockInventory(mockComponents);
      
      expect(callback).toHaveBeenCalledWith(mockComponents);
      
      // Test unsubscribe
      unsubscribe();
      setMockInventory([]);
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should delegate to host when available', () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      const mockInventory = {
        listComponents: vi.fn(),
        getComponentById: vi.fn(),
        onInventoryChanged: vi.fn().mockReturnValue(mockUnsubscribe),
      };

      (globalThis as any).window = {
        RenderX: { inventory: mockInventory },
      };

      const unsubscribe = onInventoryChanged(callback);
      expect(mockInventory.onInventoryChanged).toHaveBeenCalledWith(callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle observer callback errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const goodCallback = vi.fn();
      
      onInventoryChanged(errorCallback);
      onInventoryChanged(goodCallback);
      
      const mockComponents: ComponentSummary[] = [{ id: 'comp1', name: 'Button' }];
      setMockInventory(mockComponents);
      
      expect(errorCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalledWith(mockComponents);
      expect(consoleSpy).toHaveBeenCalledWith('Error in inventory observer callback:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return no-op unsubscribe when host not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      (globalThis as any).window = {
        RenderX: {},
      };

      const callback = vi.fn();
      const unsubscribe = onInventoryChanged(callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(consoleSpy).toHaveBeenCalledWith('Host Inventory API not available. Observer will not receive updates.');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Inventory object', () => {
    it('should export all methods', () => {
      expect(Inventory.listComponents).toBe(listComponents);
      expect(Inventory.getComponentById).toBe(getComponentById);
      expect(Inventory.onInventoryChanged).toBe(onInventoryChanged);
    });
  });

  describe('Test utilities', () => {
    it('should warn when using test utilities in browser environment', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      (globalThis as any).window = {};
      
      setMockInventory([]);
      setMockComponent({ id: 'test', name: 'Test', json: {} });
      clearMockInventory();
      
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith('setMockInventory should only be used in Node/SSR environments');
      expect(consoleSpy).toHaveBeenCalledWith('setMockComponent should only be used in Node/SSR environments');
      expect(consoleSpy).toHaveBeenCalledWith('clearMockInventory should only be used in Node/SSR environments');
      
      consoleSpy.mockRestore();
    });
  });
});
