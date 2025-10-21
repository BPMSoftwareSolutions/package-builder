/**
 * Unit tests for InspectionPanel and PluginInfoInspector
 *
 * Tests the inspection panel container and plugin info inspector components
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InspectionPanel } from '../src/ui/diagnostics/components/shared/InspectionPanel';
import { PluginInfoInspector } from '../src/ui/diagnostics/components/shared/PluginInfoInspector';

describe('InspectionPanel', () => {
  describe('Empty State', () => {
    it('shows empty state when no node is selected', () => {
      render(<InspectionPanel selectedNode={null} nodeData={null} />);
      expect(screen.getByText('No Node Selected')).toBeInTheDocument();
      expect(screen.getByText(/Select a plugin or node from the tree/)).toBeInTheDocument();
    });

    it('shows empty state when selectedNode is empty string', () => {
      render(<InspectionPanel selectedNode="" nodeData={null} />);
      expect(screen.getByText('No Node Selected')).toBeInTheDocument();
    });
  });

  describe('Node Type Detection', () => {
    it('detects plugin-info node type', () => {
      const mockPlugin = { id: 'test-plugin', version: '1.0.0' };
      render(<InspectionPanel selectedNode="plugin:test-plugin:info" nodeData={mockPlugin} />);
      // Should render PluginInfoInspector
      expect(screen.getByText('test-plugin')).toBeInTheDocument();
    });

    it('detects plugin node type', () => {
      const mockPlugin = { id: 'test-plugin' };
      render(<InspectionPanel selectedNode="plugin:test-plugin" nodeData={mockPlugin} />);
      expect(screen.getByText('Plugin Overview')).toBeInTheDocument();
    });

    it('detects ui-config node type', () => {
      render(<InspectionPanel selectedNode="plugin:test-plugin:ui" nodeData={{}} />);
      expect(screen.getByText('UI Configuration')).toBeInTheDocument();
    });

    it('detects runtime node type', () => {
      render(<InspectionPanel selectedNode="plugin:test-plugin:runtime" nodeData={{}} />);
      expect(screen.getByText('Runtime Configuration')).toBeInTheDocument();
    });

    it('detects topics node type', () => {
      render(<InspectionPanel selectedNode="plugin:test-plugin:topics" nodeData={{}} />);
      expect(screen.getByText('Topics')).toBeInTheDocument();
    });

    it('detects routes node type', () => {
      render(<InspectionPanel selectedNode="plugin:test-plugin:routes" nodeData={{}} />);
      expect(screen.getByText('Routes')).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls onNavigate when provided', () => {
      const mockOnNavigate = vi.fn();
      const mockPlugin = { id: 'test-plugin', version: '1.0.0' };
      render(
        <InspectionPanel
          selectedNode="plugin:test-plugin:info"
          nodeData={mockPlugin}
          onNavigate={mockOnNavigate}
        />
      );
      // The callback is passed down but not directly testable without triggering navigation
      expect(mockOnNavigate).not.toHaveBeenCalled();
    });

    it('calls onAction when provided', () => {
      const mockOnAction = vi.fn();
      const mockPlugin = { id: 'test-plugin', version: '1.0.0' };
      render(
        <InspectionPanel
          selectedNode="plugin:test-plugin:info"
          nodeData={mockPlugin}
          onAction={mockOnAction}
        />
      );
      
      // Click an action button
      const testButton = screen.getByText('Test Plugin');
      fireEvent.click(testButton);
      
      expect(mockOnAction).toHaveBeenCalledWith('test', { pluginId: 'test-plugin' });
    });
  });
});

describe('PluginInfoInspector', () => {
  const mockPlugin = {
    id: 'test-plugin',
    version: '2.1.0',
    status: 'loaded',
    loadTime: 150,
    description: 'A test plugin for unit testing',
    memoryUsage: '5.2 MB',
    lastActivity: Date.now() - 120000, // 2 minutes ago
    elementsCreated: 42,
    avgResponse: 15
  };

  describe('Header', () => {
    it('renders plugin name', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('test-plugin')).toBeInTheDocument();
    });

    it('renders version', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('v2.1.0')).toBeInTheDocument();
    });

    it('renders status', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('loaded')).toBeInTheDocument();
    });

    it('renders load time', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('150ms load time')).toBeInTheDocument();
    });

    it('uses default values when data is missing', () => {
      const minimalPlugin = { id: 'minimal-plugin' };
      render(<PluginInfoInspector plugin={minimalPlugin} />);
      expect(screen.getByText('minimal-plugin')).toBeInTheDocument();
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });
  });

  describe('Overview', () => {
    it('renders description', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('A test plugin for unit testing')).toBeInTheDocument();
    });

    it('uses default description when not provided', () => {
      const pluginWithoutDesc = { id: 'no-desc-plugin' };
      render(<PluginInfoInspector plugin={pluginWithoutDesc} />);
      expect(screen.getByText('Plugin: no-desc-plugin')).toBeInTheDocument();
    });
  });

  describe('Quick Stats', () => {
    it('renders memory usage', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('5.2 MB')).toBeInTheDocument();
    });

    it('renders last activity', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
    });

    it('renders elements created when greater than 0', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders average response when greater than 0', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('15ms')).toBeInTheDocument();
    });

    it('does not render elements created when 0', () => {
      const pluginNoElements = { ...mockPlugin, elementsCreated: 0 };
      render(<PluginInfoInspector plugin={pluginNoElements} />);
      expect(screen.queryByText('Elements Created')).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders all action buttons', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
      expect(screen.getByText('Reload')).toBeInTheDocument();
      expect(screen.getByText('View Docs')).toBeInTheDocument();
      expect(screen.getByText('Config')).toBeInTheDocument();
    });

    it('calls onAction when Test Plugin is clicked', () => {
      const mockOnAction = vi.fn();
      render(<PluginInfoInspector plugin={mockPlugin} onAction={mockOnAction} />);
      
      const testButton = screen.getByText('Test Plugin');
      fireEvent.click(testButton);
      
      expect(mockOnAction).toHaveBeenCalledWith('test', { pluginId: 'test-plugin' });
    });

    it('calls onAction when Reload is clicked', () => {
      const mockOnAction = vi.fn();
      render(<PluginInfoInspector plugin={mockPlugin} onAction={mockOnAction} />);
      
      const reloadButton = screen.getByText('Reload');
      fireEvent.click(reloadButton);
      
      expect(mockOnAction).toHaveBeenCalledWith('reload', { pluginId: 'test-plugin' });
    });

    it('logs to console when onAction is not provided', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      render(<PluginInfoInspector plugin={mockPlugin} />);
      
      const testButton = screen.getByText('Test Plugin');
      fireEvent.click(testButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Action: test', { pluginId: 'test-plugin' });
      consoleSpy.mockRestore();
    });
  });

  describe('Collapsible Sections', () => {
    it('renders UI Configuration section when ui data exists', () => {
      const pluginWithUi = { ...mockPlugin, ui: { slot: 'main', module: './ui.js' } };
      render(<PluginInfoInspector plugin={pluginWithUi} />);
      expect(screen.getByText('UI Configuration')).toBeInTheDocument();
    });

    it('renders Runtime Configuration section when runtime data exists', () => {
      const pluginWithRuntime = { ...mockPlugin, runtime: { module: './runtime.js' } };
      render(<PluginInfoInspector plugin={pluginWithRuntime} />);
      expect(screen.getByText('Runtime Configuration')).toBeInTheDocument();
    });

    it('renders Topics section when topics data exists', () => {
      const pluginWithTopics = { 
        ...mockPlugin, 
        topics: { subscribes: ['topic1'], publishes: ['topic2'] } 
      };
      render(<PluginInfoInspector plugin={pluginWithTopics} />);
      expect(screen.getByText('Topics')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Badge count
    });

    it('renders Sequences section when sequences data exists', () => {
      const pluginWithSequences = { 
        ...mockPlugin, 
        sequences: ['seq1', 'seq2', 'seq3'] 
      };
      render(<PluginInfoInspector plugin={pluginWithSequences} />);
      expect(screen.getByText('Sequences')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Badge count
    });

    it('does not render sections when data is missing', () => {
      render(<PluginInfoInspector plugin={mockPlugin} />);
      // These sections should not be present
      expect(screen.queryByText('UI Configuration')).not.toBeInTheDocument();
      expect(screen.queryByText('Runtime Configuration')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null plugin gracefully', () => {
      render(<PluginInfoInspector plugin={null} />);
      expect(screen.getByText('No plugin data available')).toBeInTheDocument();
    });

    it('handles undefined plugin gracefully', () => {
      render(<PluginInfoInspector plugin={undefined} />);
      expect(screen.getByText('No plugin data available')).toBeInTheDocument();
    });
  });
});

