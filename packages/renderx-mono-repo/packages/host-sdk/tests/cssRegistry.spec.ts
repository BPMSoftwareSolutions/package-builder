import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hasClass,
  createClass,
  updateClass,
  onCssChanged,
  CssRegistry,
  setMockCssClass,
  clearMockCssRegistry
} from '../cssRegistry';
import type { CssClassDef } from '../types';

describe('CSS Registry API', () => {
  beforeEach(() => {
    // Clean up global state
    delete (globalThis as any).window;
    clearMockCssRegistry();
    vi.clearAllMocks();
  });

  describe('hasClass', () => {
    it('should return false for unknown class in Node environment', async () => {
      const exists = await hasClass('unknown-class');
      expect(exists).toBe(false);
    });

    it('should return true for mock class in Node environment', async () => {
      const mockClass: CssClassDef = {
        name: 'test-class',
        rules: '.test-class { color: red; }'
      };
      
      setMockCssClass(mockClass);
      const exists = await hasClass('test-class');
      expect(exists).toBe(true);
    });

    it('should delegate to host when available', async () => {
      const mockCssRegistry = {
        hasClass: vi.fn().mockResolvedValue(true),
        createClass: vi.fn(),
        updateClass: vi.fn(),
        onCssChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { cssRegistry: mockCssRegistry },
      };

      const exists = await hasClass('host-class');
      expect(exists).toBe(true);
      expect(mockCssRegistry.hasClass).toHaveBeenCalledWith('host-class');
    });

    it('should handle host API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockCssRegistry = {
        hasClass: vi.fn().mockRejectedValue(new Error('Host error')),
        createClass: vi.fn(),
        updateClass: vi.fn(),
        onCssChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { cssRegistry: mockCssRegistry },
      };

      const exists = await hasClass('error-class');
      expect(exists).toBe(false);
      expect(mockCssRegistry.hasClass).toHaveBeenCalledWith('error-class');

      consoleSpy.mockRestore();
    });
  });

  describe('createClass', () => {
    it('should create class in Node environment', async () => {
      const mockClass: CssClassDef = {
        name: 'new-class',
        rules: '.new-class { background: blue; }',
        source: 'test',
        metadata: { version: '1.0' }
      };
      
      await createClass(mockClass);
      const exists = await hasClass('new-class');
      expect(exists).toBe(true);
    });

    it('should delegate to host when available', async () => {
      const mockClass: CssClassDef = {
        name: 'host-class',
        rules: '.host-class { color: green; }'
      };
      
      const mockCssRegistry = {
        hasClass: vi.fn(),
        createClass: vi.fn().mockResolvedValue(undefined),
        updateClass: vi.fn(),
        onCssChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { cssRegistry: mockCssRegistry },
      };

      await createClass(mockClass);
      expect(mockCssRegistry.createClass).toHaveBeenCalledWith(mockClass);
    });

    it('should handle host API errors by rethrowing', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockClass: CssClassDef = {
        name: 'error-class',
        rules: '.error-class { color: red; }'
      };

      const mockCssRegistry = {
        hasClass: vi.fn(),
        createClass: vi.fn().mockRejectedValue(new Error('Creation failed')),
        updateClass: vi.fn(),
        onCssChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { cssRegistry: mockCssRegistry },
      };

      await expect(createClass(mockClass)).rejects.toThrow('Creation failed');
      expect(mockCssRegistry.createClass).toHaveBeenCalledWith(mockClass);

      consoleSpy.mockRestore();
    });

    it('should warn when host not available', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      (globalThis as any).window = {
        RenderX: {},
      };

      const mockClass: CssClassDef = {
        name: 'test-class',
        rules: '.test-class { color: blue; }'
      };

      await createClass(mockClass);
      expect(consoleSpy).toHaveBeenCalledWith('Host CSS Registry API not available. Class will not be created.');
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateClass', () => {
    it('should update existing class in Node environment', async () => {
      const originalClass: CssClassDef = {
        name: 'update-class',
        rules: '.update-class { color: red; }'
      };
      
      const updatedClass: CssClassDef = {
        name: 'update-class',
        rules: '.update-class { color: blue; }'
      };
      
      await createClass(originalClass);
      await updateClass('update-class', updatedClass);
      
      // Verify the class still exists (we can't directly check the content in this mock)
      const exists = await hasClass('update-class');
      expect(exists).toBe(true);
    });

    it('should throw error for non-existent class in Node environment', async () => {
      const updatedClass: CssClassDef = {
        name: 'non-existent',
        rules: '.non-existent { color: blue; }'
      };
      
      await expect(updateClass('non-existent', updatedClass)).rejects.toThrow("CSS class 'non-existent' not found");
    });

    it('should delegate to host when available', async () => {
      const updatedClass: CssClassDef = {
        name: 'host-class',
        rules: '.host-class { color: purple; }'
      };
      
      const mockCssRegistry = {
        hasClass: vi.fn(),
        createClass: vi.fn(),
        updateClass: vi.fn().mockResolvedValue(undefined),
        onCssChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { cssRegistry: mockCssRegistry },
      };

      await updateClass('host-class', updatedClass);
      expect(mockCssRegistry.updateClass).toHaveBeenCalledWith('host-class', updatedClass);
    });

    it('should handle host API errors by rethrowing', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const updatedClass: CssClassDef = {
        name: 'error-class',
        rules: '.error-class { color: red; }'
      };

      const mockCssRegistry = {
        hasClass: vi.fn(),
        createClass: vi.fn(),
        updateClass: vi.fn().mockRejectedValue(new Error('Update failed')),
        onCssChanged: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { cssRegistry: mockCssRegistry },
      };

      await expect(updateClass('error-class', updatedClass)).rejects.toThrow('Update failed');
      expect(mockCssRegistry.updateClass).toHaveBeenCalledWith('error-class', updatedClass);

      consoleSpy.mockRestore();
    });
  });

  describe('onCssChanged', () => {
    it('should work in Node environment', async () => {
      const callback = vi.fn();
      const unsubscribe = onCssChanged(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Test that callback is called when CSS changes
      const mockClass: CssClassDef = {
        name: 'test-class',
        rules: '.test-class { color: red; }'
      };
      
      await createClass(mockClass);
      expect(callback).toHaveBeenCalledWith([mockClass]);
      
      // Test unsubscribe
      unsubscribe();
      await createClass({ name: 'another-class', rules: '.another-class { color: blue; }' });
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should delegate to host when available', () => {
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      const mockCssRegistry = {
        hasClass: vi.fn(),
        createClass: vi.fn(),
        updateClass: vi.fn(),
        onCssChanged: vi.fn().mockReturnValue(mockUnsubscribe),
      };

      (globalThis as any).window = {
        RenderX: { cssRegistry: mockCssRegistry },
      };

      const unsubscribe = onCssChanged(callback);
      expect(mockCssRegistry.onCssChanged).toHaveBeenCalledWith(callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle observer callback errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const goodCallback = vi.fn();
      
      onCssChanged(errorCallback);
      onCssChanged(goodCallback);
      
      const mockClass: CssClassDef = {
        name: 'test-class',
        rules: '.test-class { color: red; }'
      };
      
      await createClass(mockClass);
      
      expect(errorCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalledWith([mockClass]);
      expect(consoleSpy).toHaveBeenCalledWith('Error in CSS registry observer callback:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return no-op unsubscribe when host not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      (globalThis as any).window = {
        RenderX: {},
      };

      const callback = vi.fn();
      const unsubscribe = onCssChanged(callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(consoleSpy).toHaveBeenCalledWith('Host CSS Registry API not available. Observer will not receive updates.');
      
      consoleSpy.mockRestore();
    });
  });

  describe('CssRegistry object', () => {
    it('should export all methods', () => {
      expect(CssRegistry.hasClass).toBe(hasClass);
      expect(CssRegistry.createClass).toBe(createClass);
      expect(CssRegistry.updateClass).toBe(updateClass);
      expect(CssRegistry.onCssChanged).toBe(onCssChanged);
    });
  });

  describe('Test utilities', () => {
    it('should warn when using test utilities in browser environment', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      (globalThis as any).window = {};
      
      setMockCssClass({ name: 'test', rules: '.test { color: red; }' });
      clearMockCssRegistry();
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith('setMockCssClass should only be used in Node/SSR environments');
      expect(consoleSpy).toHaveBeenCalledWith('clearMockCssRegistry should only be used in Node/SSR environments');
      
      consoleSpy.mockRestore();
    });
  });
});
