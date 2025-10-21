/**
 * Diagnostics Components
 *
 * Barrel export for all diagnostics UI components.
 * These components are extracted from DiagnosticsPanel.tsx for better modularity.
 *
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/diagnostics-before-after.md
 */

// Shared components (inspection)
export * from './shared';

// Stats Overview
export * from './StatsOverview';

// Content Panels
export * from './ContentPanels';

// Logs Panel
export * from './LogsPanel';

// Footer Panel
export * from './FooterPanel';

// Toolbar
export { DiagnosticsToolbar } from './DiagnosticsToolbar';
export type { DiagnosticsToolbarProps } from './DiagnosticsToolbar';

// Sequence Player
export * from './SequencePlayer';

// Log Converter
export * from './LogConverter';

