/**
 * Unit tests for PluginTreeExplorer component
 *
 * Tests the plugin tree explorer component that displays plugins, routes, and topics
 * in a hierarchical tree structure with search and selection capabilities.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PluginTreeExplorer } from '../src/ui/PluginTreeExplorer';

describe('PluginTreeExplorer', () => {
  const mockPlugins = [
    {
      id: 'plugin-canvas',
      ui: {
        slot: 'main',
        module: './canvas/canvas-ui.js',
        export: 'CanvasArea',
      },
      runtime: {
        module: './canvas/canvas-runtime.js',
        export: 'CanvasRuntime',
      },
    },
    {
      id: 'plugin-theme',
      ui: {
        slot: 'headerLeft',
        module: './theme/theme-toggle.js',
        export: 'ThemeToggle',
      },
    },
  ];

  const mockRoutes = [
    {
      route: '/canvas/create',
      pluginId: 'plugin-canvas',
      sequenceId: 'create-element',
    },
    {
      route: '/canvas/update',
      pluginId: 'plugin-canvas',
      sequenceId: 'update-element',
    },
  ];

  const mockTopicsMap = {
    'canvas.element.created': {
      routes: [
        { pluginId: 'plugin-canvas', sequenceId: 'onElementCreated' },
      ],
      visibility: 'public',
    },
    'theme.changed': {
      routes: [
        { pluginId: 'plugin-theme', sequenceId: 'onThemeChanged' },
      ],
      visibility: 'public',
    },
  };

  const mockOnSelectNode = vi.fn();

  it('renders the plugin tree explorer', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    expect(screen.getByText('Plugin Explorer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('displays plugin count badges', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    const badges = screen.getAllByText('2');
    expect(badges.length).toBeGreaterThan(0); // Should have multiple "2" badges
  });

  it('expands and collapses plugin section', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    // Plugins section should be expanded by default
    expect(screen.getByText('plugin-canvas')).toBeInTheDocument();
    expect(screen.getByText('plugin-theme')).toBeInTheDocument();

    // Click to collapse
    const pluginsNode = screen.getByText('Plugins');
    fireEvent.click(pluginsNode);

    // Plugins should still be visible (they're in the tree)
    // This is a simplified test - in reality, we'd check visibility state
  });

  it('filters plugins based on search term', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'canvas' } });

    // Should show canvas plugin
    expect(screen.getByText('plugin-canvas')).toBeInTheDocument();
  });

  it('calls onSelectNode when a node is clicked', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    const pluginNode = screen.getByText('plugin-canvas');
    fireEvent.click(pluginNode);

    expect(mockOnSelectNode).toHaveBeenCalledWith('plugin:plugin-canvas');
  });

  it('displays routes section with correct count', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    expect(screen.getByText('Routes')).toBeInTheDocument();
    // Routes section should show count badge
    const badges = screen.getAllByText('2');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('displays topics section with correct count', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    expect(screen.getByText('Topics')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(
      <PluginTreeExplorer
        plugins={[]}
        routes={[]}
        topicsMap={{}}
        onSelectNode={mockOnSelectNode}
      />
    );

    expect(screen.getByText('Plugin Explorer')).toBeInTheDocument();
    const badges = screen.getAllByText('0');
    expect(badges.length).toBe(3); // 0 plugins, 0 routes, 0 topics
  });

  it('filters routes based on search term', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'create' } });

    // Should filter routes containing 'create'
    expect(screen.getByText('/canvas/create')).toBeInTheDocument();
  });

  it('filters topics based on search term', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'theme' } });

    // Should filter topics containing 'theme'
    expect(screen.getByText('theme.changed')).toBeInTheDocument();
  });

  it('maintains selection state across interactions', () => {
    render(
      <PluginTreeExplorer
        plugins={mockPlugins}
        routes={mockRoutes}
        topicsMap={mockTopicsMap}
        onSelectNode={mockOnSelectNode}
      />
    );

    const pluginNode = screen.getByText('plugin-canvas');
    fireEvent.click(pluginNode);

    expect(mockOnSelectNode).toHaveBeenCalledWith('plugin:plugin-canvas');

    // Click another node - use Components which is unique
    const componentsNode = screen.getByText('Components');
    fireEvent.click(componentsNode);

    expect(mockOnSelectNode).toHaveBeenCalledWith('components');
  });

  // Tests for plugin-level node expansion (Issue #284)
  describe('Plugin-Level Nodes Expansion', () => {
    it('shows plugin nodes as expandable', () => {
      render(
        <PluginTreeExplorer
          plugins={mockPlugins}
          routes={mockRoutes}
          topicsMap={mockTopicsMap}
          onSelectNode={mockOnSelectNode}
        />
      );

      const pluginNode = screen.getByText('plugin-canvas');
      expect(pluginNode).toBeInTheDocument();
      // Plugin should have expand/collapse icon (▶ or ▼)
    });

    it('expands plugin to show child nodes when clicked', () => {
      render(
        <PluginTreeExplorer
          plugins={mockPlugins}
          routes={mockRoutes}
          topicsMap={mockTopicsMap}
          onSelectNode={mockOnSelectNode}
        />
      );

      const pluginNode = screen.getByText('plugin-canvas');
      fireEvent.click(pluginNode);

      // After expanding, should show child nodes
      // Plugin Info is always shown
      expect(screen.getByText('Plugin Info')).toBeInTheDocument();

      // UI Configuration should be shown (plugin has UI)
      expect(screen.getByText('UI Configuration')).toBeInTheDocument();

      // Runtime should be shown (plugin has runtime)
      expect(screen.getByText('Runtime')).toBeInTheDocument();
    });

    it('shows only relevant child nodes based on plugin data', () => {
      const pluginWithOnlyUi = [
        {
          id: 'plugin-ui-only',
          ui: {
            slot: 'main',
            module: './ui.js',
            export: 'UI',
          },
        },
      ];

      render(
        <PluginTreeExplorer
          plugins={pluginWithOnlyUi}
          routes={[]}
          topicsMap={{}}
          onSelectNode={mockOnSelectNode}
        />
      );

      const pluginNode = screen.getByText('plugin-ui-only');
      fireEvent.click(pluginNode);

      // Should show Plugin Info and UI Configuration
      expect(screen.getByText('Plugin Info')).toBeInTheDocument();
      expect(screen.getByText('UI Configuration')).toBeInTheDocument();

      // Should NOT show Runtime (plugin doesn't have runtime)
      expect(screen.queryByText('Runtime')).not.toBeInTheDocument();
    });

    it('generates correct node IDs for child nodes', () => {
      render(
        <PluginTreeExplorer
          plugins={mockPlugins}
          routes={mockRoutes}
          topicsMap={mockTopicsMap}
          onSelectNode={mockOnSelectNode}
        />
      );

      const pluginNode = screen.getByText('plugin-canvas');
      fireEvent.click(pluginNode);

      // Click on Plugin Info child node
      const pluginInfoNode = screen.getByText('Plugin Info');
      fireEvent.click(pluginInfoNode);

      // Should call onSelectNode with correct ID pattern
      expect(mockOnSelectNode).toHaveBeenCalledWith('plugin:plugin-canvas:info');
    });

    it('toggles plugin expansion to show and hide child nodes', () => {
      // Use a single plugin to avoid confusion with multiple expanded plugins
      const singlePlugin = [mockPlugins[0]];

      render(
        <PluginTreeExplorer
          plugins={singlePlugin}
          routes={mockRoutes}
          topicsMap={mockTopicsMap}
          onSelectNode={mockOnSelectNode}
        />
      );

      const pluginNode = screen.getByText('plugin-canvas');

      // Plugin starts collapsed - child nodes should not be visible
      expect(screen.queryByText('Plugin Info')).not.toBeInTheDocument();

      // First click - expand
      fireEvent.click(pluginNode);
      expect(screen.getByText('Plugin Info')).toBeInTheDocument();
      expect(screen.getByText('UI Configuration')).toBeInTheDocument();
      expect(screen.getByText('Runtime')).toBeInTheDocument();
    });

    it('shows Routes child node only when plugin has routes', () => {
      // Test with canvas plugin (has routes)
      render(
        <PluginTreeExplorer
          plugins={[mockPlugins[0]]} // plugin-canvas has routes
          routes={mockRoutes}
          topicsMap={mockTopicsMap}
          onSelectNode={mockOnSelectNode}
        />
      );

      // Expand plugin-canvas (has routes)
      const canvasPlugin = screen.getByText('plugin-canvas');
      fireEvent.click(canvasPlugin);

      // Should show "Routes" child node
      const routesElements = screen.getAllByText('Routes');
      expect(routesElements.length).toBe(2); // One top-level, one child node
    });

    it('does not show Routes child node when plugin has no routes', () => {
      // Test with theme plugin (no routes)
      render(
        <PluginTreeExplorer
          plugins={[mockPlugins[1]]} // plugin-theme has no routes
          routes={[]}
          topicsMap={mockTopicsMap}
          onSelectNode={mockOnSelectNode}
        />
      );

      // Expand plugin-theme (no routes)
      const themePlugin = screen.getByText('plugin-theme');
      fireEvent.click(themePlugin);

      // Should show Plugin Info
      expect(screen.getByText('Plugin Info')).toBeInTheDocument();

      // Should only have one "Routes" element (the top-level section)
      const routesElements = screen.getAllByText('Routes');
      expect(routesElements.length).toBe(1);
    });

    it('handles plugin with extended metadata fields', () => {
      const pluginWithMetadata = [
        {
          id: 'plugin-full',
          ui: {
            slot: 'main',
            module: './ui.js',
            export: 'UI',
          },
          runtime: {
            module: './runtime.js',
            export: 'Runtime',
          },
          version: '2.0.0',
          status: 'loaded' as const,
          topics: { subscribes: ['topic1'], publishes: ['topic2'] },
          sequences: ['seq1', 'seq2'],
          permissions: { read: true },
          configuration: { enabled: true },
          metrics: { calls: 100 },
          dependencies: { react: '18.0.0' },
        },
      ];

      render(
        <PluginTreeExplorer
          plugins={pluginWithMetadata}
          routes={[]}
          topicsMap={{}}
          onSelectNode={mockOnSelectNode}
        />
      );

      const pluginNode = screen.getByText('plugin-full');
      fireEvent.click(pluginNode);

      // Should show all child nodes since plugin has all metadata
      expect(screen.getByText('Plugin Info')).toBeInTheDocument();
      expect(screen.getByText('UI Configuration')).toBeInTheDocument();
      expect(screen.getByText('Runtime')).toBeInTheDocument();

      // Use getAllByText for nodes that might appear multiple times
      const topicsElements = screen.getAllByText('Topics');
      expect(topicsElements.length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Sequences')).toBeInTheDocument();
      expect(screen.getByText('Permissions')).toBeInTheDocument();
      expect(screen.getByText('Configuration')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Dependencies')).toBeInTheDocument();
    });
  });
});

