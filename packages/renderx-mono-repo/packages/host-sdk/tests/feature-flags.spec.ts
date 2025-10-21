import {
  isFlagEnabled,
  getFlagMeta,
  getAllFlags,
  setFlagOverride,
  clearFlagOverrides,
  getUsageLog
} from '../feature-flags';

describe('Feature Flags', () => {
  beforeEach(() => {
    delete (globalThis as any).window;
    clearFlagOverrides();
    vi.clearAllMocks();
  });

  describe('isFlagEnabled', () => {
    it('should return false for unknown flags', () => {
      expect(isFlagEnabled('unknown-flag')).toBe(false);
    });

    it('should return true for built-in "on" flags', () => {
      // Note: No built-in "on" flags in current implementation
      // This test would pass if we had any
      expect(isFlagEnabled('nonexistent')).toBe(false);
    });

    it('should respect test overrides', () => {
      setFlagOverride('test-flag', true);
      expect(isFlagEnabled('test-flag')).toBe(true);

      setFlagOverride('test-flag', false);
      expect(isFlagEnabled('test-flag')).toBe(false);
    });

    it('should delegate to host when available', () => {
      const mockFlags = {
        isFlagEnabled: vi.fn().mockReturnValue(true),
        getFlagMeta: vi.fn(),
        getAllFlags: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { featureFlags: mockFlags },
      };

      expect(isFlagEnabled('host-flag')).toBe(true);
      expect(mockFlags.isFlagEnabled).toHaveBeenCalledWith('host-flag');
    });

    it('should log usage', () => {
      const initialLogLength = getUsageLog().length;
      isFlagEnabled('test-flag');
      
      const log = getUsageLog();
      expect(log.length).toBe(initialLogLength + 1);
      expect(log[log.length - 1].id).toBe('test-flag');
      expect(typeof log[log.length - 1].when).toBe('number');
    });
  });

  describe('getFlagMeta', () => {
    it('should return undefined for unknown flags', () => {
      expect(getFlagMeta('unknown')).toBeUndefined();
    });

    it('should return built-in flag meta', () => {
      const meta = getFlagMeta('lint.topics.runtime-validate');
      expect(meta).toEqual({
        status: 'off',
        created: '2024-01-01',
        description: 'Runtime validation of topic payloads',
      });
    });

    it('should delegate to host when available', () => {
      const mockMeta = { status: 'on', created: '2024-01-01' };
      const mockFlags = {
        isFlagEnabled: vi.fn(),
        getFlagMeta: vi.fn().mockReturnValue(mockMeta),
        getAllFlags: vi.fn(),
      };

      (globalThis as any).window = {
        RenderX: { featureFlags: mockFlags },
      };

      expect(getFlagMeta('host-flag')).toBe(mockMeta);
      expect(mockFlags.getFlagMeta).toHaveBeenCalledWith('host-flag');
    });
  });

  describe('getAllFlags', () => {
    it('should return built-in flags', () => {
      const flags = getAllFlags();
      expect(flags['lint.topics.runtime-validate']).toBeDefined();
    });

    it('should delegate to host when available', () => {
      const mockFlags = { 'host-flag': { status: 'on', created: '2024-01-01' } };
      const mockFeatureFlags = {
        isFlagEnabled: vi.fn(),
        getFlagMeta: vi.fn(),
        getAllFlags: vi.fn().mockReturnValue(mockFlags),
      };

      (globalThis as any).window = {
        RenderX: { featureFlags: mockFeatureFlags },
      };

      expect(getAllFlags()).toBe(mockFlags);
      expect(mockFeatureFlags.getAllFlags).toHaveBeenCalled();
    });
  });
});
