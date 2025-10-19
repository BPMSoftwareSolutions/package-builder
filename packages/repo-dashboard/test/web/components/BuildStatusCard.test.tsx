/**
 * Unit tests for BuildStatusCard component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BuildStatusCard } from '../../../src/web/components/BuildStatusCard';

// Mock fetch
global.fetch = vi.fn();

describe('BuildStatusCard', () => {
  const mockBuildStatus = {
    status: 'passing' as const,
    lastBuildTime: 45000,
    successRate: 95.5,
    flakinessPercentage: 2.3,
    recentBuilds: [
      { status: 'success' as const, duration: 45000, timestamp: new Date() },
      { status: 'success' as const, duration: 42000, timestamp: new Date() }
    ],
    failureReasons: ['Timeout in integration tests', 'Memory leak detected']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<BuildStatusCard org="test-org" repo="test-repo" />);
    expect(screen.getByText('Loading build status...')).toBeInTheDocument();
  });

  it('should fetch and display build status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buildStatus: mockBuildStatus })
    } as Response);

    render(<BuildStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Build Status')).toBeInTheDocument();
      expect(screen.getByText('passing')).toBeInTheDocument();
      expect(screen.getByText('95.5%')).toBeInTheDocument();
    });
  });

  it('should display success rate and flakiness', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buildStatus: mockBuildStatus })
    } as Response);

    render(<BuildStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Flakiness')).toBeInTheDocument();
      expect(screen.getByText('2.3%')).toBeInTheDocument();
    });
  });

  it('should display failure reasons', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buildStatus: mockBuildStatus })
    } as Response);

    render(<BuildStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Recent Failure Reasons')).toBeInTheDocument();
      expect(screen.getByText('Timeout in integration tests')).toBeInTheDocument();
    });
  });

  it('should handle failing status', async () => {
    const failingStatus = { ...mockBuildStatus, status: 'failing' as const };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buildStatus: failingStatus })
    } as Response);

    render(<BuildStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('failing')).toBeInTheDocument();
    });
  });

  it('should handle flaky status', async () => {
    const flakyStatus = { ...mockBuildStatus, status: 'flaky' as const };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buildStatus: flakyStatus })
    } as Response);

    render(<BuildStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('flaky')).toBeInTheDocument();
    });
  });

  it('should call onStatusChange callback', async () => {
    const onStatusChange = vi.fn();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buildStatus: mockBuildStatus })
    } as Response);

    render(<BuildStatusCard org="test-org" repo="test-repo" onStatusChange={onStatusChange} />);

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith(mockBuildStatus);
    });
  });

  it('should handle fetch errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    } as Response);

    render(<BuildStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should display no data message when response is empty', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    } as Response);

    render(<BuildStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('No build data available')).toBeInTheDocument();
    });
  });

  it('should display last build time', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buildStatus: mockBuildStatus })
    } as Response);

    render(<BuildStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Last build: 45000ms')).toBeInTheDocument();
    });
  });
});

