/**
 * Unit tests for TestResultsService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestResultsService } from './test-results.js';

// Mock the GitHub fetch
vi.mock('../github.js', () => ({
  fetchGitHub: vi.fn()
}));

describe('TestResultsService', () => {
  let service: TestResultsService;

  beforeEach(() => {
    service = new TestResultsService();
    vi.clearAllMocks();
  });

  it('should collect test results for a repository', async () => {
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

    const results = await service.collectTestResults('BPMSoftwareSolutions', 'test-repo');
    expect(results).toHaveLength(1);
    expect(results[0].totalTests).toBeGreaterThan(0);
    expect(results[0].passedTests).toBeGreaterThan(0);
  });

  it('should calculate coverage metrics', async () => {
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

    const results = await service.collectTestResults('BPMSoftwareSolutions', 'test-repo');
    expect(results[0].coverage).toBeGreaterThanOrEqual(0.85);
    expect(results[0].coverage).toBeLessThanOrEqual(0.95);
  });

  it('should track failing tests', async () => {
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

    const results = await service.collectTestResults('BPMSoftwareSolutions', 'test-repo');
    expect(results[0].failingTests.length).toBeGreaterThan(0);
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

    const results1 = await service.collectTestResults('BPMSoftwareSolutions', 'test-repo');
    const results2 = await service.collectTestResults('BPMSoftwareSolutions', 'test-repo');

    expect(results1).toEqual(results2);
    expect(vi.mocked(fetchGitHub)).toHaveBeenCalledTimes(1);
  });

  it('should get latest test results', async () => {
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

    const results = await service.getLatestTestResults('BPMSoftwareSolutions', 'test-repo');
    expect(results).not.toBeNull();
    expect(results?.totalTests).toBeGreaterThan(0);
  });

  it('should calculate coverage trends', async () => {
    const { fetchGitHub } = await import('../github.js');
    vi.mocked(fetchGitHub).mockResolvedValueOnce({
      workflow_runs: [
        {
          id: 1,
          created_at: '2025-10-19T10:00:00Z',
          updated_at: '2025-10-19T10:05:00Z',
          conclusion: 'success'
        },
        {
          id: 2,
          created_at: '2025-10-19T09:00:00Z',
          updated_at: '2025-10-19T09:05:00Z',
          conclusion: 'success'
        }
      ]
    });

    const results = await service.collectTestResults('BPMSoftwareSolutions', 'test-repo');
    expect(results[0].coverageTrend).toBeDefined();
    expect(['improving', 'stable', 'degrading']).toContain(results[0].coverageTrend);
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

    await service.collectTestResults('BPMSoftwareSolutions', 'test-repo');
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

    const results = await service.collectTestResults('BPMSoftwareSolutions', 'test-repo');
    expect(results[0].failingTests.length).toBeGreaterThan(0);
    expect(vi.mocked(fetchGitHub)).toHaveBeenCalledTimes(2);
  });
});

