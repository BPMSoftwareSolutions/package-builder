/**
 * Unit tests for BuildStatusService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildStatusService } from './build-status.js';

// Mock the GitHub fetch
vi.mock('../github.js', () => ({
  fetchGitHub: vi.fn()
}));

describe('BuildStatusService', () => {
  let service: BuildStatusService;

  beforeEach(() => {
    service = new BuildStatusService();
    vi.clearAllMocks();
  });

  it('should collect build status for a repository', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce({
      workflow_runs: [
        {
          id: 1,
          created_at: '2025-10-19T10:00:00Z',
          updated_at: '2025-10-19T10:05:00Z',
          conclusion: 'success'
        }
      ]
    });

    const statuses = await service.collectBuildStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].status).toBe('success');
    expect(statuses[0].duration).toBe(300);
  });

  it('should handle build failures', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce({
      workflow_runs: [
        {
          id: 1,
          created_at: '2025-10-19T10:00:00Z',
          updated_at: '2025-10-19T10:05:00Z',
          conclusion: 'failure'
        }
      ]
    });

    const statuses = await service.collectBuildStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses[0].status).toBe('failure');
    expect(statuses[0].failureReason).toBeDefined();
  });

  it('should calculate flakiness score', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce({
      workflow_runs: [
        {
          id: 1,
          created_at: '2025-10-19T10:00:00Z',
          updated_at: '2025-10-19T10:05:00Z',
          conclusion: 'failure'
        },
        {
          id: 2,
          created_at: '2025-10-19T09:00:00Z',
          updated_at: '2025-10-19T09:05:00Z',
          conclusion: 'failure'
        },
        {
          id: 3,
          created_at: '2025-10-19T08:00:00Z',
          updated_at: '2025-10-19T08:05:00Z',
          conclusion: 'success'
        }
      ]
    });

    const statuses = await service.collectBuildStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses[0].isFlaky).toBe(true);
    expect(statuses[0].flakinessScore).toBeGreaterThan(0.3);
  });

  it('should cache results', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce({
      workflow_runs: [
        {
          id: 1,
          created_at: '2025-10-19T10:00:00Z',
          updated_at: '2025-10-19T10:05:00Z',
          conclusion: 'success'
        }
      ]
    });

    const statuses1 = await service.collectBuildStatus('BPMSoftwareSolutions', 'test-repo');
    const statuses2 = await service.collectBuildStatus('BPMSoftwareSolutions', 'test-repo');

    expect(statuses1).toEqual(statuses2);
    expect(vi.mocked(fetchGitHub)).toHaveBeenCalledTimes(1);
  });

  it('should get latest build status', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce({
      workflow_runs: [
        {
          id: 1,
          created_at: '2025-10-19T10:00:00Z',
          updated_at: '2025-10-19T10:05:00Z',
          conclusion: 'success'
        }
      ]
    });

    const status = await service.getBuildStatus('BPMSoftwareSolutions', 'test-repo');
    expect(status).not.toBeNull();
    expect(status?.status).toBe('success');
  });

  it('should clear cache', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce({
      workflow_runs: [
        {
          id: 1,
          created_at: '2025-10-19T10:00:00Z',
          updated_at: '2025-10-19T10:05:00Z',
          conclusion: 'success'
        }
      ]
    });

    await service.collectBuildStatus('BPMSoftwareSolutions', 'test-repo');
    service.clearCache();

    vi.mocked(fetchGitHub).mockResolvedValueOnce({
      workflow_runs: [
        {
          id: 2,
          created_at: '2025-10-19T11:00:00Z',
          updated_at: '2025-10-19T11:05:00Z',
          conclusion: 'failure'
        }
      ]
    });

    const statuses = await service.collectBuildStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses[0].status).toBe('failure');
    expect(vi.mocked(fetchGitHub)).toHaveBeenCalledTimes(2);
  });
});

