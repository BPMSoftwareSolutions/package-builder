/**
 * Tests for GitHub API wrapper
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listRepos, listIssues, getWorkflowStatus, countStaleIssues } from './github.js';

// Mock fetch
global.fetch = vi.fn();

describe('GitHub API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = 'test-token';
  });

  describe('listRepos', () => {
    it('should list repositories for an organization', async () => {
      const mockRepos = [
        {
          name: 'repo1',
          owner: { login: 'org' },
          html_url: 'https://github.com/org/repo1',
          description: 'Test repo',
          private: false,
          topics: ['test'],
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRepos,
      });

      const repos = await listRepos({ org: 'test-org' });

      expect(repos).toHaveLength(1);
      expect(repos[0].name).toBe('repo1');
      expect(repos[0].owner).toBe('org');
    });

    it('should throw error when GITHUB_TOKEN is not set', async () => {
      delete process.env.GITHUB_TOKEN;
      delete process.env.GH_TOKEN;
      delete process.env.GH_PAT;

      await expect(listRepos({ org: 'test-org' })).rejects.toThrow(
        'GITHUB_TOKEN, GH_TOKEN, or GH_PAT environment variable is required'
      );
    });
  });

  describe('listIssues', () => {
    it('should list issues for a repository', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Test issue',
          state: 'open',
          pull_request: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          html_url: 'https://github.com/org/repo/issues/1',
          user: { login: 'user1' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues,
      });

      const issues = await listIssues({ repo: 'org/repo' });

      expect(issues).toHaveLength(1);
      expect(issues[0].number).toBe(1);
      expect(issues[0].isPullRequest).toBe(false);
    });

    it('should identify pull requests', async () => {
      const mockIssues = [
        {
          number: 2,
          title: 'Test PR',
          state: 'open',
          pull_request: { url: 'https://api.github.com/repos/org/repo/pulls/2' },
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          html_url: 'https://github.com/org/repo/pull/2',
          user: { login: 'user1' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues,
      });

      const issues = await listIssues({ repo: 'org/repo' });

      expect(issues[0].isPullRequest).toBe(true);
    });
  });

  describe('getWorkflowStatus', () => {
    it('should get the last workflow run status', async () => {
      const mockRuns = {
        workflow_runs: [
          {
            id: 123,
            name: 'CI',
            status: 'completed',
            conclusion: 'success',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            html_url: 'https://github.com/org/repo/actions/runs/123',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRuns,
      });

      const status = await getWorkflowStatus({ repo: 'org/repo' });

      expect(status).not.toBeNull();
      expect(status?.conclusion).toBe('success');
    });

    it('should return null when no workflow runs exist', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workflow_runs: [] }),
      });

      const status = await getWorkflowStatus({ repo: 'org/repo' });

      expect(status).toBeNull();
    });
  });

  describe('countStaleIssues', () => {
    it('should count issues older than threshold', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

      const mockIssues = [
        {
          number: 1,
          title: 'Old issue',
          state: 'open',
          pull_request: null,
          created_at: oldDate.toISOString(),
          updated_at: oldDate.toISOString(),
          html_url: 'https://github.com/org/repo/issues/1',
          user: { login: 'user1' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues,
      });

      const count = await countStaleIssues('org/repo', 30);

      expect(count).toBe(1);
    });
  });
});

