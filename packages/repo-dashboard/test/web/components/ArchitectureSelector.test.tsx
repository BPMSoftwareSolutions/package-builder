/**
 * Unit tests for ArchitectureSelector component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArchitectureSelector } from '../../../src/web/components/ArchitectureSelector';

// Mock fetch
global.fetch = vi.fn();

describe('ArchitectureSelector', () => {
  const mockADFs = [
    {
      org: 'test-org',
      repo: 'repo1',
      path: 'adf.json',
      version: '1.0.0',
      name: 'Architecture 1',
      lastUpdated: '2025-10-19'
    },
    {
      org: 'test-org',
      repo: 'repo2',
      path: 'adf.json',
      version: '2.0.0',
      name: 'Architecture 2',
      lastUpdated: '2025-10-18'
    }
  ];

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render selector button', () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADFs
    } as Response);

    render(
      <ArchitectureSelector
        org="test-org"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Select Architecture')).toBeInTheDocument();
  });

  it('should fetch and display ADFs', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADFs
    } as Response);

    render(
      <ArchitectureSelector
        org="test-org"
        onSelect={mockOnSelect}
      />
    );

    // Click to open dropdown
    const button = screen.getByText('Select Architecture');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Architecture 1')).toBeInTheDocument();
      expect(screen.getByText('Architecture 2')).toBeInTheDocument();
    });
  });

  it('should call onSelect when ADF is selected', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADFs
    } as Response);

    render(
      <ArchitectureSelector
        org="test-org"
        onSelect={mockOnSelect}
      />
    );

    // Click to open dropdown
    const button = screen.getByText('Select Architecture');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Architecture 1')).toBeInTheDocument();
    });

    // Click on first ADF
    fireEvent.click(screen.getByText('Architecture 1'));

    expect(mockOnSelect).toHaveBeenCalledWith('test-org', 'repo1');
  });

  it('should filter ADFs by search term', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADFs
    } as Response);

    render(
      <ArchitectureSelector
        org="test-org"
        onSelect={mockOnSelect}
      />
    );

    // Click to open dropdown
    const button = screen.getByText('Select Architecture');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Architecture 1')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search architectures...');
    fireEvent.change(searchInput, { target: { value: 'repo2' } });

    await waitFor(() => {
      expect(screen.queryByText('Architecture 1')).not.toBeInTheDocument();
      expect(screen.getByText('Architecture 2')).toBeInTheDocument();
    });
  });

  it('should display selected repo', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADFs
    } as Response);

    render(
      <ArchitectureSelector
        org="test-org"
        onSelect={mockOnSelect}
        selectedRepo="repo1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Architecture 1')).toBeInTheDocument();
    });
  });

  it('should handle fetch errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    } as Response);

    render(
      <ArchitectureSelector
        org="test-org"
        onSelect={mockOnSelect}
      />
    );

    const button = screen.getByText('Select Architecture');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch ADFs/)).toBeInTheDocument();
    });
  });

  it('should close dropdown when clicking outside', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockADFs
    } as Response);

    const { container } = render(
      <ArchitectureSelector
        org="test-org"
        onSelect={mockOnSelect}
      />
    );

    // Click to open dropdown
    const button = screen.getByText('Select Architecture');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Architecture 1')).toBeInTheDocument();
    });

    // Click outside
    const backdrop = container.querySelector('[style*="position: fixed"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByText('Architecture 1')).not.toBeInTheDocument();
    });
  });
});

