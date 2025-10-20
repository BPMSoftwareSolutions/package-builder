/**
 * Unit tests for ADF Fetcher Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ADFFetcher, ArchitectureDefinition } from '../../src/services/adf-fetcher.js';

// Mock GitHub API
vi.mock('../../src/github.js', () => ({
  fetchGitHub: vi.fn()
}));

import { fetchGitHub } from '../../src/github.js';

// Mock global fetch for local endpoint testing
global.fetch = vi.fn();

describe('ADFFetcher', () => {
  let fetcher: ADFFetcher;
  const mockADF: ArchitectureDefinition = {
    version: '1.0.0',
    name: 'Test Architecture',
    description: 'Test ADF',
    c4Model: {
      level: 'container',
      containers: [
        {
          id: 'web-ui',
          name: 'Web UI',
          type: 'ui',
          description: 'React UI'
        }
      ],
      relationships: []
    },
    metrics: {
      healthScore: 0.85,
      testCoverage: 0.80,
      buildStatus: 'success'
    }
  };

  beforeEach(() => {
    fetcher = new ADFFetcher();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchADF', () => {
    it('should fetch ADF from local endpoint first', async () => {
      // Mock local endpoint success
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockADF
      } as any);

      const result = await fetcher.fetchADF({
        org: 'BPMSoftwareSolutions',
        repo: 'renderx-plugins-demo',
        branch: 'main',
        path: 'renderx-plugins-demo-adf.json'
      });

      expect(result).toEqual(mockADF);
      expect(global.fetch).toHaveBeenCalledWith('/adf/renderx-plugins-demo-adf.json');
      // GitHub API should not be called
      expect(fetchGitHub).not.toHaveBeenCalled();
    });

    it('should fall back to GitHub API when local endpoint fails', async () => {
      // Mock local endpoint failure
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404
      } as any);

      // Mock GitHub API success
      const mockResponse = {
        content: Buffer.from(JSON.stringify(mockADF)).toString('base64')
      };
      vi.mocked(fetchGitHub).mockResolvedValueOnce(mockResponse);

      const result = await fetcher.fetchADF({
        org: 'BPMSoftwareSolutions',
        repo: 'test-repo',
        branch: 'main',
        path: 'adf.json'
      });

      expect(result).toEqual(mockADF);
      expect(fetchGitHub).toHaveBeenCalledWith(
        '/repos/BPMSoftwareSolutions/test-repo/contents/adf.json?ref=main'
      );
    });

    it('should fall back to mock data when both local and GitHub fail', async () => {
      // Mock local endpoint failure
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404
      } as any);

      // Mock GitHub API failure
      vi.mocked(fetchGitHub).mockRejectedValueOnce(new Error('GitHub API error'));

      const result = await fetcher.fetchADF({
        org: 'BPMSoftwareSolutions',
        repo: 'test-repo',
        branch: 'main',
        path: 'adf.json'
      });

      // Should return mock data with basic structure
      expect(result).toBeDefined();
      expect(result.version).toBe('1.0.0');
      expect(result.name).toContain('test-repo');
      expect(result.c4Model).toBeDefined();
    });

    it('should cache ADF results', async () => {
      // Mock local endpoint success
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockADF
      } as any);

      // First call
      await fetcher.fetchADF({
        org: 'BPMSoftwareSolutions',
        repo: 'test-repo'
      });

      // Second call should use cache
      await fetcher.fetchADF({
        org: 'BPMSoftwareSolutions',
        repo: 'test-repo'
      });

      // fetch should only be called once (for local endpoint)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateADF', () => {
    it('should validate valid ADF', async () => {
      const result = await fetcher.validateADF(mockADF);
      expect(result).toBe(true);
    });

    it('should reject ADF without version', async () => {
      const invalidADF = { ...mockADF, version: undefined };
      await expect(fetcher.validateADF(invalidADF)).rejects.toThrow('version');
    });

    it('should reject ADF without name', async () => {
      const invalidADF = { ...mockADF, name: undefined };
      await expect(fetcher.validateADF(invalidADF)).rejects.toThrow('name');
    });

    it('should reject non-object ADF', async () => {
      await expect(fetcher.validateADF(null)).rejects.toThrow('object');
    });
  });

  describe('listADFs', () => {
    it('should list ADFs in organization', async () => {
      const mockRepos = [
        { name: 'repo1', default_branch: 'main', updated_at: '2025-10-19' },
        { name: 'repo2', default_branch: 'main', updated_at: '2025-10-19' }
      ];

      vi.mocked(fetchGitHub)
        .mockResolvedValueOnce(mockRepos)
        .mockResolvedValueOnce({ content: Buffer.from(JSON.stringify(mockADF)).toString('base64') })
        .mockResolvedValueOnce({ content: Buffer.from(JSON.stringify(mockADF)).toString('base64') });

      const result = await fetcher.listADFs('BPMSoftwareSolutions');

      expect(result).toHaveLength(2);
      expect(result[0].org).toBe('BPMSoftwareSolutions');
      expect(result[0].repo).toBe('repo1');
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      const stats = fetcher.getCacheStats();
      expect(stats.size).toBe(0);

      fetcher.clearCache();
      expect(fetcher.getCacheStats().size).toBe(0);
    });

    it('should get cache statistics', () => {
      const stats = fetcher.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('entries');
      expect(Array.isArray(stats.entries)).toBe(true);
    });
  });
});

