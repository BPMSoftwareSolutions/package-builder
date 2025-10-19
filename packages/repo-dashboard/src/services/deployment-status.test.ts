/**
 * Unit tests for DeploymentStatusService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeploymentStatusService } from './deployment-status.js';

// Mock the GitHub fetch
vi.mock('../github.js', () => ({
  fetchGitHub: vi.fn()
}));

describe('DeploymentStatusService', () => {
  let service: DeploymentStatusService;

  beforeEach(() => {
    service = new DeploymentStatusService();
    vi.clearAllMocks();
  });

  it('should collect deployment status for a repository', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce([
      {
        id: 1,
        created_at: '2025-10-19T10:00:00Z',
        updated_at: '2025-10-19T10:05:00Z',
        state: 'success',
        environment: 'production'
      }
    ]);

    const statuses = await service.collectDeploymentStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].status).toBe('success');
    expect(statuses[0].environment).toBe('production');
  });

  it('should handle deployment failures', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce([
      {
        id: 1,
        created_at: '2025-10-19T10:00:00Z',
        updated_at: '2025-10-19T10:05:00Z',
        state: 'failure',
        environment: 'production'
      }
    ]);

    const statuses = await service.collectDeploymentStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses[0].status).toBe('failure');
    expect(statuses[0].failureReason).toBeDefined();
  });

  it('should track rollbacks', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce([
      {
        id: 1,
        created_at: '2025-10-19T10:00:00Z',
        updated_at: '2025-10-19T10:05:00Z',
        state: 'success',
        environment: 'production',
        description: 'rollback to v1.0.0'
      }
    ]);

    const statuses = await service.collectDeploymentStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses[0].isRollback).toBe(true);
  });

  it('should calculate deployment duration', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce([
      {
        id: 1,
        created_at: '2025-10-19T10:00:00Z',
        updated_at: '2025-10-19T10:10:00Z',
        state: 'success',
        environment: 'production'
      }
    ]);

    const statuses = await service.collectDeploymentStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses[0].duration).toBe(600);
  });

  it('should cache results', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce([
      {
        id: 1,
        created_at: '2025-10-19T10:00:00Z',
        updated_at: '2025-10-19T10:05:00Z',
        state: 'success',
        environment: 'production'
      }
    ]);

    const statuses1 = await service.collectDeploymentStatus('BPMSoftwareSolutions', 'test-repo');
    const statuses2 = await service.collectDeploymentStatus('BPMSoftwareSolutions', 'test-repo');

    expect(statuses1).toEqual(statuses2);
    expect(vi.mocked(fetchGitHub)).toHaveBeenCalledTimes(1);
  });

  it('should get latest deployment status', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce([
      {
        id: 1,
        created_at: '2025-10-19T10:00:00Z',
        updated_at: '2025-10-19T10:05:00Z',
        state: 'success',
        environment: 'production'
      }
    ]);

    const status = await service.getLatestDeploymentStatus('BPMSoftwareSolutions', 'test-repo');
    expect(status).not.toBeNull();
    expect(status?.status).toBe('success');
  });

  it('should calculate deployment trends', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce([
      {
        id: 1,
        created_at: '2025-10-19T10:00:00Z',
        updated_at: '2025-10-19T10:05:00Z',
        state: 'success',
        environment: 'production'
      },
      {
        id: 2,
        created_at: '2025-10-19T09:00:00Z',
        updated_at: '2025-10-19T09:05:00Z',
        state: 'success',
        environment: 'production'
      }
    ]);

    const statuses = await service.collectDeploymentStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses[0].trend).toBeDefined();
    expect(['improving', 'stable', 'degrading']).toContain(statuses[0].trend);
  });

  it('should clear cache', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce([
      {
        id: 1,
        created_at: '2025-10-19T10:00:00Z',
        updated_at: '2025-10-19T10:05:00Z',
        state: 'success',
        environment: 'production'
      }
    ]);

    await service.collectDeploymentStatus('BPMSoftwareSolutions', 'test-repo');
    service.clearCache();

    vi.mocked(fetchGitHub).mockResolvedValueOnce([
      {
        id: 2,
        created_at: '2025-10-19T11:00:00Z',
        updated_at: '2025-10-19T11:05:00Z',
        state: 'failure',
        environment: 'production'
      }
    ]);

    const statuses = await service.collectDeploymentStatus('BPMSoftwareSolutions', 'test-repo');
    expect(statuses[0].status).toBe('failure');
    expect(vi.mocked(fetchGitHub)).toHaveBeenCalledTimes(2);
  });
});

