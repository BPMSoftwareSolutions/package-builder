/**
 * Unit tests for FeedbackSummaryCard component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FeedbackSummaryCard } from '../../../src/web/components/FeedbackSummaryCard';

// Mock fetch
global.fetch = vi.fn();

describe('FeedbackSummaryCard', () => {
  const mockFeedbackSummary = {
    healthScore: 85,
    trend: 'improving' as const,
    alertCount: 2,
    buildStatus: 'passing' as const,
    testCoverage: 82.5,
    deploymentStatus: 'success' as const,
    lastUpdated: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<FeedbackSummaryCard org="test-org" />);
    expect(screen.getByText('Loading feedback summary...')).toBeInTheDocument();
  });

  it('should fetch and display feedback summary', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: mockFeedbackSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('Feedback Summary')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  it('should display health score', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: mockFeedbackSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('Health Score')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  it('should display trend indicator', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: mockFeedbackSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('improving')).toBeInTheDocument();
    });
  });

  it('should display alert count', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: mockFeedbackSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should display test coverage', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: mockFeedbackSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('Test Coverage')).toBeInTheDocument();
      expect(screen.getByText('82.5%')).toBeInTheDocument();
    });
  });

  it('should display build and deployment status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: mockFeedbackSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('Build Status')).toBeInTheDocument();
      expect(screen.getByText('passing')).toBeInTheDocument();
      expect(screen.getByText('Deployment Status')).toBeInTheDocument();
      expect(screen.getByText('success')).toBeInTheDocument();
    });
  });

  it('should handle degrading trend', async () => {
    const degradingSummary = { ...mockFeedbackSummary, trend: 'degrading' as const };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: degradingSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('degrading')).toBeInTheDocument();
    });
  });

  it('should handle stable trend', async () => {
    const stableSummary = { ...mockFeedbackSummary, trend: 'stable' as const };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: stableSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('stable')).toBeInTheDocument();
    });
  });

  it('should call onHealthChange callback', async () => {
    const onHealthChange = vi.fn();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: mockFeedbackSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" onHealthChange={onHealthChange} />);

    await waitFor(() => {
      expect(onHealthChange).toHaveBeenCalledWith(85);
    });
  });

  it('should include team parameter when provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: mockFeedbackSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" team="platform" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('team=platform')
      );
    });
  });

  it('should handle fetch errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should display no data message when response is empty', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('No feedback data available')).toBeInTheDocument();
    });
  });

  it('should display last updated time', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: mockFeedbackSummary })
    } as Response);

    render(<FeedbackSummaryCard org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });
});

