import {
  initConfig,
  setConfigValue,
  removeConfigValue,
  getAllConfigKeys,
  clearConfig,
} from '../core/environment/config';

describe('Core Environment Config', () => {
  beforeEach(() => {
    // Reset window.RenderX before each test
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).window = (globalThis as any).window || {};
      if ((globalThis as any).window.RenderX) {
        delete (globalThis as any).window.RenderX.config;
      }
    }
    clearConfig();
    vi.clearAllMocks();
  });

  describe('initConfig', () => {
    it('should initialize empty config when no initial config provided', () => {
      const config = initConfig();

      expect(config).toBeDefined();
      expect(config.get('ANY_KEY')).toBeUndefined();
      expect(config.has('ANY_KEY')).toBe(false);
    });

    it('should initialize with provided config values', () => {
      const config = initConfig({
        API_KEY: 'test-key',
        API_URL: 'https://api.example.com',
      });

      expect(config.get('API_KEY')).toBe('test-key');
      expect(config.get('API_URL')).toBe('https://api.example.com');
      expect(config.has('API_KEY')).toBe(true);
      expect(config.has('API_URL')).toBe(true);
    });

    it('should filter out undefined values from initial config', () => {
      const config = initConfig({
        API_KEY: 'test-key',
        UNDEFINED_KEY: undefined,
        API_URL: 'https://api.example.com',
      });

      expect(config.get('API_KEY')).toBe('test-key');
      expect(config.get('API_URL')).toBe('https://api.example.com');
      expect(config.has('UNDEFINED_KEY')).toBe(false);
      expect(config.get('UNDEFINED_KEY')).toBeUndefined();
    });

    it('should attach config to window.RenderX.config', () => {
      (globalThis as any).window = {};
      
      initConfig({
        API_KEY: 'test-key',
      });

      expect((globalThis as any).window.RenderX).toBeDefined();
      expect((globalThis as any).window.RenderX.config).toBeDefined();
      expect((globalThis as any).window.RenderX.config.get('API_KEY')).toBe('test-key');
    });

    it('should clear existing config when re-initialized', () => {
      const config1 = initConfig({
        API_KEY: 'old-key',
        OLD_VALUE: 'should-be-removed',
      });

      expect(config1.get('API_KEY')).toBe('old-key');
      expect(config1.get('OLD_VALUE')).toBe('should-be-removed');

      const config2 = initConfig({
        API_KEY: 'new-key',
      });

      expect(config2.get('API_KEY')).toBe('new-key');
      expect(config2.has('OLD_VALUE')).toBe(false);
    });

    it('should handle empty string values', () => {
      const config = initConfig({
        EMPTY_KEY: '',
      });

      expect(config.get('EMPTY_KEY')).toBe('');
      expect(config.has('EMPTY_KEY')).toBe(true);
    });
  });

  describe('setConfigValue', () => {
    it('should set a new config value', () => {
      const config = initConfig();
      
      setConfigValue('NEW_KEY', 'new-value');
      
      expect(config.get('NEW_KEY')).toBe('new-value');
      expect(config.has('NEW_KEY')).toBe(true);
    });

    it('should update an existing config value', () => {
      const config = initConfig({
        API_KEY: 'old-key',
      });

      expect(config.get('API_KEY')).toBe('old-key');

      setConfigValue('API_KEY', 'new-key');

      expect(config.get('API_KEY')).toBe('new-key');
    });

    it('should work with window.RenderX.config', () => {
      (globalThis as any).window = {};
      initConfig({ API_KEY: 'initial' });

      setConfigValue('API_KEY', 'updated');

      expect((globalThis as any).window.RenderX.config.get('API_KEY')).toBe('updated');
    });
  });

  describe('removeConfigValue', () => {
    it('should remove an existing config value', () => {
      const config = initConfig({
        API_KEY: 'test-key',
        API_URL: 'https://api.example.com',
      });

      expect(config.has('API_KEY')).toBe(true);

      removeConfigValue('API_KEY');

      expect(config.has('API_KEY')).toBe(false);
      expect(config.get('API_KEY')).toBeUndefined();
      expect(config.has('API_URL')).toBe(true);
    });

    it('should not throw when removing non-existent key', () => {
      const config = initConfig();

      expect(() => {
        removeConfigValue('NON_EXISTENT');
      }).not.toThrow();

      expect(config.has('NON_EXISTENT')).toBe(false);
    });
  });

  describe('getAllConfigKeys', () => {
    it('should return empty array for empty config', () => {
      initConfig();
      
      const keys = getAllConfigKeys();
      
      expect(keys).toEqual([]);
    });

    it('should return all config keys', () => {
      initConfig({
        API_KEY: 'key1',
        API_URL: 'url1',
        DATABASE_URL: 'db1',
      });

      const keys = getAllConfigKeys();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('API_KEY');
      expect(keys).toContain('API_URL');
      expect(keys).toContain('DATABASE_URL');
    });

    it('should reflect changes after set and remove', () => {
      initConfig({ API_KEY: 'key1' });

      let keys = getAllConfigKeys();
      expect(keys).toEqual(['API_KEY']);

      setConfigValue('API_URL', 'url1');
      keys = getAllConfigKeys();
      expect(keys).toHaveLength(2);

      removeConfigValue('API_KEY');
      keys = getAllConfigKeys();
      expect(keys).toEqual(['API_URL']);
    });
  });

  describe('clearConfig', () => {
    it('should clear all config values', () => {
      const config = initConfig({
        API_KEY: 'key1',
        API_URL: 'url1',
        DATABASE_URL: 'db1',
      });

      expect(getAllConfigKeys()).toHaveLength(3);

      clearConfig();

      expect(getAllConfigKeys()).toEqual([]);
      expect(config.has('API_KEY')).toBe(false);
      expect(config.has('API_URL')).toBe(false);
      expect(config.has('DATABASE_URL')).toBe(false);
    });

    it('should work on empty config', () => {
      initConfig();

      expect(() => {
        clearConfig();
      }).not.toThrow();

      expect(getAllConfigKeys()).toEqual([]);
    });
  });

  describe('Integration scenarios', () => {
    it('should support environment variable pattern', () => {
      // Simulate Vite environment variables
      const envVars = {
        VITE_API_KEY: 'env-api-key',
        VITE_API_URL: 'https://env.api.com',
        VITE_FEATURE_FLAG: undefined, // Not set in environment
      };

      const config = initConfig({
        API_KEY: envVars.VITE_API_KEY,
        API_URL: envVars.VITE_API_URL,
        FEATURE_FLAG: envVars.VITE_FEATURE_FLAG,
      });

      expect(config.get('API_KEY')).toBe('env-api-key');
      expect(config.get('API_URL')).toBe('https://env.api.com');
      expect(config.has('FEATURE_FLAG')).toBe(false);
    });

    it('should support runtime configuration updates', () => {
      const config = initConfig({
        API_KEY: 'initial-key',
      });

      // Runtime update
      setConfigValue('API_KEY', 'runtime-key');
      setConfigValue('NEW_CONFIG', 'runtime-value');

      expect(config.get('API_KEY')).toBe('runtime-key');
      expect(config.get('NEW_CONFIG')).toBe('runtime-value');

      // Remove at runtime
      removeConfigValue('NEW_CONFIG');
      expect(config.has('NEW_CONFIG')).toBe(false);
    });

    it('should work with plugin SDK facade', () => {
      (globalThis as any).window = {};
      
      initConfig({
        API_KEY: 'test-key',
        API_URL: 'https://api.example.com',
      });

      // Simulate plugin using the SDK facade
      const pluginConfig = (globalThis as any).window.RenderX.config;
      
      expect(pluginConfig.get('API_KEY')).toBe('test-key');
      expect(pluginConfig.has('API_URL')).toBe(true);
      expect(pluginConfig.get('NON_EXISTENT')).toBeUndefined();
      expect(pluginConfig.has('NON_EXISTENT')).toBe(false);
    });
  });
});

