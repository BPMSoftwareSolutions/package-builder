/**
 * Unit tests for TestResultsPanel component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestResultsPanel } from '../../../src/web/components/TestResultsPanel';

// Mock fetch
global.fetch = vi.fn();

describe('TestResultsPanel', () => {
  const mockTestResults = {
    passCount: 95,
    failCount: 3,
    skipCount: 2,
    coverage: 82.5,
    coverageTrend: 'improving' as const,
    executionTime: 125000,
    failedTests: [
      { name: 'test_user_login', error: 'Timeout after 5000ms' },
      { name: 'test_api_response', error: 'Expected 200, got 500' }
    ],
    coverageByModule: {
      'auth': 85.2,
      'api': 80.1,
      'utils': 88.5
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<TestResultsPanel org="test-org" repo="test-repo" />);
    expect(screen.getByText('Loading test results...')).toBeInTheDocument();
  });

  it('should fetch and display test results', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testResults: mockTestResults })
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Test Results')).toBeInTheDocument();
      expect(screen.getByText('82.5%')).toBeInTheDocument();
    });
  });

  it('should calculate and display pass rate', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testResults: mockTestResults })
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" />);

    await waitFor(() => {
      // 95 / (95 + 3 + 2) = 95/100 = 95%
      expect(screen.getByText('95.0%')).toBeInTheDocument();
    });
  });

  it('should display test counts', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testResults: mockTestResults })
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('95 passed, 3 failed, 2 skipped')).toBeInTheDocument();
    });
  });

  it('should display coverage trend', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testResults: mockTestResults })
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Coverage')).toBeInTheDocument();
    });
  });

  it('should display execution time', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testResults: mockTestResults })
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Execution Time')).toBeInTheDocument();
      expect(screen.getByText('125.00s')).toBeInTheDocument();
    });
  });

  it('should display failed tests', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testResults: mockTestResults })
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Failed Tests (2)')).toBeInTheDocument();
      expect(screen.getByText('test_user_login')).toBeInTheDocument();
    });
  });

  it('should display coverage by module', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testResults: mockTestResults })
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Coverage by Module')).toBeInTheDocument();
      expect(screen.getByText('auth')).toBeInTheDocument();
      expect(screen.getByText('85.2%')).toBeInTheDocument();
    });
  });

  it('should call onCoverageChange callback', async () => {
    const onCoverageChange = vi.fn();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ testResults: mockTestResults })
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" onCoverageChange={onCoverageChange} />);

    await waitFor(() => {
      expect(onCoverageChange).toHaveBeenCalledWith(82.5);
    });
  });

  it('should handle fetch errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should display no data message when response is empty', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    } as Response);

    render(<TestResultsPanel org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('No test data available')).toBeInTheDocument();
    });
  });
});

