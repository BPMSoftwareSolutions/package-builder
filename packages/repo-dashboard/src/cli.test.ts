/**
 * Tests for CLI handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleStatus, handleIssues, handlePackages, handlePack } from './cli.js';
import * as github from './github.js';
import * as local from './local.js';

// Mock modules
vi.mock('./github.js');
vi.mock('./local.js');

describe('CLI Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = 'test-token';
  });

  describe('handleStatus', () => {
    it('should display repository status', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (github.listRepos as any).mockResolvedValueOnce([
        {
          name: 'repo1',
          owner: 'org',
          url: 'https://github.com/org/repo1',
          description: 'Test repo',
          isPrivate: false,
          topics: [],
          lastUpdated: '2025-01-01T00:00:00Z',
        },
      ]);

      (github.listIssues as any).mockResolvedValueOnce([
        {
          number: 1,
          title: 'Issue 1',
          state: 'open',
          isPullRequest: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          url: 'https://github.com/org/repo1/issues/1',
          author: 'user1',
        },
      ]);

      (github.countStaleIssues as any).mockResolvedValueOnce(0);
      (github.getWorkflowStatus as any).mockResolvedValueOnce(null);

      await handleStatus(['--org', 'test-org']);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Repository Status');

      consoleSpy.mockRestore();
    });

    it('should throw error when org is not provided', async () => {
      await expect(handleStatus([])).rejects.toThrow('--org is required');
    });

    it('should output JSON when --json flag is provided', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (github.listRepos as any).mockResolvedValueOnce([
        {
          name: 'repo1',
          owner: 'org',
          url: 'https://github.com/org/repo1',
          description: 'Test repo',
          isPrivate: false,
          topics: [],
          lastUpdated: '2025-01-01T00:00:00Z',
        },
      ]);

      (github.listIssues as any).mockResolvedValueOnce([]);
      (github.countStaleIssues as any).mockResolvedValueOnce(0);
      (github.getWorkflowStatus as any).mockResolvedValueOnce(null);

      await handleStatus(['--org', 'test-org', '--json']);

      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0];
      expect(() => JSON.parse(lastCall)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('handleIssues', () => {
    it('should display issues for a repository', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (github.listIssues as any).mockResolvedValueOnce([
        {
          number: 1,
          title: 'Test issue',
          state: 'open',
          isPullRequest: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          url: 'https://github.com/org/repo/issues/1',
          author: 'user1',
        },
      ]);

      await handleIssues(['--repo', 'org/repo']);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Issues for org/repo');

      consoleSpy.mockRestore();
    });

    it('should throw error when repo is not provided', async () => {
      await expect(handleIssues([])).rejects.toThrow('--repo is required');
    });

    it('should filter stale issues', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const now = new Date();
      const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

      (github.listIssues as any).mockResolvedValueOnce([
        {
          number: 1,
          title: 'Old issue',
          state: 'open',
          isPullRequest: false,
          createdAt: oldDate.toISOString(),
          updatedAt: oldDate.toISOString(),
          url: 'https://github.com/org/repo/issues/1',
          author: 'user1',
        },
      ]);

      await handleIssues(['--repo', 'org/repo', '--filter', 'stale']);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('handlePackages', () => {
    it('should display local packages', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (local.getPackageReadiness as any).mockResolvedValueOnce({
        total: 2,
        ready: 1,
        packages: [
          {
            name: '@bpm/package1',
            path: './packages/package1',
            version: '1.0.0',
            private: false,
            description: 'Package 1',
            buildReady: true,
            packReady: true,
            distExists: true,
            artifactsExists: false,
          },
          {
            name: '@bpm/package2',
            path: './packages/package2',
            version: '2.0.0',
            private: false,
            description: 'Package 2',
            buildReady: false,
            packReady: false,
            distExists: false,
            artifactsExists: false,
          },
        ],
      });

      await handlePackages([]);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Local Packages');

      consoleSpy.mockRestore();
    });

    it('should filter ready packages', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (local.getPackageReadiness as any).mockResolvedValueOnce({
        total: 2,
        ready: 1,
        packages: [
          {
            name: '@bpm/package1',
            path: './packages/package1',
            version: '1.0.0',
            private: false,
            buildReady: true,
            packReady: true,
            distExists: true,
            artifactsExists: false,
          },
          {
            name: '@bpm/package2',
            path: './packages/package2',
            version: '2.0.0',
            private: false,
            buildReady: false,
            packReady: false,
            distExists: false,
            artifactsExists: false,
          },
        ],
      });

      await handlePackages(['--list-ready']);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('handlePack', () => {
    it('should show dry-run message', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await handlePack(['--package', 'packages/test', '--dry-run']);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Dry run');

      consoleSpy.mockRestore();
    });

    it('should throw error when package is not provided', async () => {
      await expect(handlePack([])).rejects.toThrow('--package is required');
    });
  });
});

