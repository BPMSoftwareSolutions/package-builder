/**
 * Unit tests for DeploymentStatusCard component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DeploymentStatusCard } from '../../../src/web/components/DeploymentStatusCard';

// Mock fetch
global.fetch = vi.fn();

describe('DeploymentStatusCard', () => {
  const mockDeploymentStatus = {
    status: 'success' as const,
    duration: 1800,
    successRate: 98.5,
    deploymentFrequency: 2.3,
    rollbackCount: 1,
    lastDeployment: new Date(),
    deploymentHistory: [
      { status: 'success' as const, duration: 1800, timestamp: new Date(), environment: 'production' },
      { status: 'success' as const, duration: 1650, timestamp: new Date(), environment: 'staging' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<DeploymentStatusCard org="test-org" repo="test-repo" />);
    expect(screen.getByText('Loading deployment status...')).toBeInTheDocument();
  });

  it('should fetch and display deployment status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deploymentStatus: mockDeploymentStatus })
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Deployment Status')).toBeInTheDocument();
      expect(screen.getByText('success')).toBeInTheDocument();
    });
  });

  it('should display success rate and deployment frequency', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deploymentStatus: mockDeploymentStatus })
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('98.5%')).toBeInTheDocument();
      expect(screen.getByText('Deployment Frequency')).toBeInTheDocument();
      expect(screen.getByText('2.3/day')).toBeInTheDocument();
    });
  });

  it('should display duration and rollback count', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deploymentStatus: mockDeploymentStatus })
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('30.0m')).toBeInTheDocument();
      expect(screen.getByText('Rollbacks')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should display recent deployments', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deploymentStatus: mockDeploymentStatus })
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Recent Deployments')).toBeInTheDocument();
      expect(screen.getByText('production')).toBeInTheDocument();
      expect(screen.getByText('staging')).toBeInTheDocument();
    });
  });

  it('should handle failed deployment status', async () => {
    const failedStatus = { ...mockDeploymentStatus, status: 'failed' as const };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deploymentStatus: failedStatus })
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('failed')).toBeInTheDocument();
    });
  });

  it('should handle in-progress deployment status', async () => {
    const inProgressStatus = { ...mockDeploymentStatus, status: 'in-progress' as const };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deploymentStatus: inProgressStatus })
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('in progress')).toBeInTheDocument();
    });
  });

  it('should call onStatusChange callback', async () => {
    const onStatusChange = vi.fn();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deploymentStatus: mockDeploymentStatus })
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" onStatusChange={onStatusChange} />);

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith(mockDeploymentStatus);
    });
  });

  it('should include environment parameter in URL when provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deploymentStatus: mockDeploymentStatus })
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" environment="production" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('environment=production')
      );
    });
  });

  it('should handle fetch errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should display no data message when response is empty', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    } as Response);

    render(<DeploymentStatusCard org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('No deployment data available')).toBeInTheDocument();
    });
  });
});

