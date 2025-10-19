/**
 * Unit tests for ADFViewer component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ADFViewer } from '../../../src/web/components/ADFViewer';

// Mock fetch
global.fetch = vi.fn();

describe('ADFViewer', () => {
  const mockADF = {
    version: '1.0.0',
    name: 'Test Architecture',
    description: 'Test ADF',
    c4Model: {
      level: 'container',
      containers: [
        {
          id: 'web-ui',
          name: 'Web UI',
          type: 'ui',
          description: 'React UI',
          metrics: {
            healthScore: 0.85,
            testCoverage: 0.80,
            buildStatus: 'success'
          }
        }
      ],
      relationships: [
        {
          from: 'web-ui',
          to: 'api-server',
          type: 'communicates_with',
          description: 'HTTP requests'
        }
      ]
    },
    metrics: {
      healthScore: 0.85,
      testCoverage: 0.80,
      buildStatus: 'success'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading spinner initially', () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<ADFViewer org="test-org" repo="test-repo" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should fetch and display ADF data', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADF
    } as Response);

    render(<ADFViewer org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Test Architecture')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/adf/test-org/test-repo?branch=main&path=adf.json'
    );
  });

  it('should display containers', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADF
    } as Response);

    render(<ADFViewer org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('Web UI')).toBeInTheDocument();
    });
  });

  it('should display relationships', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADF
    } as Response);

    render(<ADFViewer org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText('communicates_with')).toBeInTheDocument();
    });
  });

  it('should handle fetch errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    } as Response);

    render(<ADFViewer org="test-org" repo="test-repo" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch ADF/)).toBeInTheDocument();
    });
  });

  it('should use custom branch and path', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADF
    } as Response);

    render(
      <ADFViewer
        org="test-org"
        repo="test-repo"
        branch="develop"
        path="docs/adf.json"
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/adf/test-org/test-repo?branch=develop&path=docs/adf.json'
      );
    });
  });
});

