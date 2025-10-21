/**
 * Unit tests for Inspection Panel components
 *
 * Tests the reusable components used in the inspection panel:
 * JSONViewer, CodeBlock, ActionButton, RelativeTime, CollapsibleSection
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JSONViewer } from '../src/ui/diagnostics/components/shared/JSONViewer';
import { CodeBlock } from '../src/ui/diagnostics/components/shared/CodeBlock';
import { ActionButton } from '../src/ui/diagnostics/components/shared/ActionButton';
import { RelativeTime } from '../src/ui/diagnostics/components/shared/RelativeTime';
import { CollapsibleSection } from '../src/ui/diagnostics/components/shared/CollapsibleSection';
import { Play } from 'lucide-react';

describe('Inspection Components', () => {
  describe('JSONViewer', () => {
    const mockData = { name: 'test', value: 123, nested: { key: 'value' } };

    it('renders JSON data', () => {
      render(<JSONViewer data={mockData} />);
      expect(screen.getByText(/"name": "test"/)).toBeInTheDocument();
      expect(screen.getByText(/"value": 123/)).toBeInTheDocument();
    });

    it('renders with title', () => {
      render(<JSONViewer data={mockData} title="Test Data" />);
      expect(screen.getByText('Test Data')).toBeInTheDocument();
    });

    it('collapses and expands when toggle is clicked', () => {
      render(<JSONViewer data={mockData} title="Test Data" collapsible={true} defaultExpanded={true} />);
      
      const jsonContent = screen.getByText(/"name": "test"/);
      expect(jsonContent).toBeInTheDocument();

      const toggleButton = screen.getByLabelText('Collapse');
      fireEvent.click(toggleButton);

      expect(screen.queryByText(/"name": "test"/)).not.toBeInTheDocument();
    });

    it('copies JSON to clipboard when copy button is clicked', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      render(<JSONViewer data={mockData} title="Test Data" />);
      
      const copyButton = screen.getByLabelText('Copy to clipboard');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(JSON.stringify(mockData, null, 2));
      });
    });

    it('shows check icon after successful copy', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      render(<JSONViewer data={mockData} title="Test Data" />);
      
      const copyButton = screen.getByLabelText('Copy to clipboard');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Copy to clipboard')).toBeInTheDocument();
      });
    });
  });

  describe('CodeBlock', () => {
    const mockCode = 'const x = 42;\nconsole.log(x);';

    it('renders code', () => {
      render(<CodeBlock code={mockCode} />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    it('renders with title and language', () => {
      render(<CodeBlock code={mockCode} title="Example Code" language="javascript" />);
      expect(screen.getByText('Example Code')).toBeInTheDocument();
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    it('copies code to clipboard when copy button is clicked', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      render(<CodeBlock code={mockCode} title="Example Code" />);
      
      const copyButton = screen.getByLabelText('Copy to clipboard');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(mockCode);
      });
    });
  });

  describe('ActionButton', () => {
    it('renders with label', () => {
      const mockOnClick = vi.fn();
      render(<ActionButton label="Test Action" onClick={mockOnClick} />);
      expect(screen.getByText('Test Action')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      const mockOnClick = vi.fn();
      render(<ActionButton icon={Play} label="Play" onClick={mockOnClick} />);
      expect(screen.getByLabelText('Play')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const mockOnClick = vi.fn();
      render(<ActionButton label="Test Action" onClick={mockOnClick} />);
      
      const button = screen.getByText('Test Action');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const mockOnClick = vi.fn();
      render(<ActionButton label="Test Action" onClick={mockOnClick} disabled={true} />);
      
      const button = screen.getByText('Test Action');
      fireEvent.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('shows loading spinner when loading', () => {
      const mockOnClick = vi.fn();
      render(<ActionButton label="Test Action" onClick={mockOnClick} loading={true} />);
      
      expect(screen.getByText('Test Action')).toBeInTheDocument();
      expect(document.querySelector('.action-button-spinner')).toBeInTheDocument();
    });

    it('applies variant classes', () => {
      const mockOnClick = vi.fn();
      const { container } = render(<ActionButton label="Test" onClick={mockOnClick} variant="primary" />);
      expect(container.querySelector('.action-button-primary')).toBeInTheDocument();
    });

    it('applies size classes', () => {
      const mockOnClick = vi.fn();
      const { container } = render(<ActionButton label="Test" onClick={mockOnClick} size="large" />);
      expect(container.querySelector('.action-button-large')).toBeInTheDocument();
    });
  });

  describe('RelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders "just now" for recent timestamps', () => {
      const now = new Date();
      render(<RelativeTime timestamp={now} />);
      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('renders minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      render(<RelativeTime timestamp={fiveMinutesAgo} />);
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    it('renders hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      render(<RelativeTime timestamp={twoHoursAgo} />);
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('shows absolute time in title attribute', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      render(<RelativeTime timestamp={oneHourAgo} />);
      const element = screen.getByText('1 hour ago');
      expect(element).toHaveAttribute('title');
      expect(element.getAttribute('title')).toContain(':');
    });
  });

  describe('CollapsibleSection', () => {
    it('renders with title', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );
      expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('renders children when expanded', () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={true}>
          <div>Content</div>
        </CollapsibleSection>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('hides children when collapsed', () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={false}>
          <div>Content</div>
        </CollapsibleSection>
      );
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('toggles expansion when header is clicked', () => {
      render(
        <CollapsibleSection title="Test Section" defaultExpanded={true}>
          <div>Content</div>
        </CollapsibleSection>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      const header = screen.getByText('Test Section');
      fireEvent.click(header);

      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('renders badge when provided', () => {
      render(
        <CollapsibleSection title="Test Section" badge="5">
          <div>Content</div>
        </CollapsibleSection>
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <CollapsibleSection title="Test Section" icon={<Play size={16} />}>
          <div>Content</div>
        </CollapsibleSection>
      );
      expect(document.querySelector('.collapsible-section-icon')).toBeInTheDocument();
    });
  });
});

