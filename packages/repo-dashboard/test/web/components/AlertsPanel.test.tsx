/**
 * Unit tests for AlertsPanel component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AlertsPanel } from '../../../src/web/components/AlertsPanel';

// Mock fetch
global.fetch = vi.fn();

describe('AlertsPanel', () => {
  const mockAlerts = [
    {
      id: 'alert-1',
      timestamp: new Date(),
      team: 'platform',
      repo: 'api-server',
      type: 'build-failure' as const,
      severity: 'critical' as const,
      title: 'Build Failed',
      description: 'Main branch build failed',
      status: 'active' as const,
      relatedIssues: [],
      recommendations: ['Check logs']
    },
    {
      id: 'alert-2',
      timestamp: new Date(),
      team: 'platform',
      repo: 'web-ui',
      type: 'test-failure' as const,
      severity: 'high' as const,
      title: 'Tests Failed',
      description: 'Unit tests failed',
      status: 'acknowledged' as const,
      relatedIssues: [],
      recommendations: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<AlertsPanel org="test-org" />);
    expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
  });

  it('should fetch and display alerts', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ alerts: mockAlerts })
    } as Response);

    render(<AlertsPanel org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('Build Failed')).toBeInTheDocument();
      expect(screen.getByText('Tests Failed')).toBeInTheDocument();
    });
  });

  it('should filter alerts by severity', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ alerts: mockAlerts })
    } as Response);

    render(<AlertsPanel org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('Build Failed')).toBeInTheDocument();
    });

    const severitySelect = screen.getByDisplayValue('All Severities');
    fireEvent.change(severitySelect, { target: { value: 'high' } });

    await waitFor(() => {
      expect(screen.getByText('Tests Failed')).toBeInTheDocument();
      expect(screen.queryByText('Build Failed')).not.toBeInTheDocument();
    });
  });

  it('should filter alerts by status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ alerts: mockAlerts })
    } as Response);

    render(<AlertsPanel org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('Build Failed')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'acknowledged' } });

    await waitFor(() => {
      expect(screen.getByText('Tests Failed')).toBeInTheDocument();
      expect(screen.queryByText('Build Failed')).not.toBeInTheDocument();
    });
  });

  it('should handle fetch errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    } as Response);

    render(<AlertsPanel org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should call onAlertClick when alert is clicked', async () => {
    const onAlertClick = vi.fn();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ alerts: mockAlerts })
    } as Response);

    render(<AlertsPanel org="test-org" onAlertClick={onAlertClick} />);

    await waitFor(() => {
      expect(screen.getByText('Build Failed')).toBeInTheDocument();
    });

    const alertElement = screen.getByText('Build Failed').closest('div');
    if (alertElement) {
      fireEvent.click(alertElement);
      expect(onAlertClick).toHaveBeenCalledWith('alert-1');
    }
  });

  it('should respect maxAlerts prop', async () => {
    const manyAlerts = Array.from({ length: 20 }, (_, i) => ({
      ...mockAlerts[0],
      id: `alert-${i}`,
      title: `Alert ${i}`
    }));

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ alerts: manyAlerts })
    } as Response);

    render(<AlertsPanel org="test-org" maxAlerts={5} />);

    await waitFor(() => {
      expect(screen.getByText('Alert 0')).toBeInTheDocument();
      expect(screen.getByText('Alert 4')).toBeInTheDocument();
      expect(screen.queryByText('Alert 5')).not.toBeInTheDocument();
    });
  });

  it('should display no alerts message when empty', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ alerts: [] })
    } as Response);

    render(<AlertsPanel org="test-org" />);

    await waitFor(() => {
      expect(screen.getByText('No alerts found')).toBeInTheDocument();
    });
  });
});

