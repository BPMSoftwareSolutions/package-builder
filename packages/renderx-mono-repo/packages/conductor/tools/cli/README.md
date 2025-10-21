# AI Knowledge Transfer CLI for MusicalConductor

A comprehensive command-line interface for transferring knowledge between AI agents working with the MusicalConductor system.

## Overview

This CLI enables AI agents to:

- Export system state, plugin configurations, and performance data
- Import knowledge from other agents with validation
- Merge knowledge from multiple agents with conflict resolution
- Validate knowledge files for compatibility
- Compare knowledge between different states
- **Quick access to documentation and resources via keyword shortcuts**
- **Data-driven knowledge management with searchable shortcuts**

## Architecture

The CLI is built with a modular architecture:

```
tools/cli/
├── knowledge-cli.ts          # Main CLI entry point
├── shortcut-demo.ts          # Standalone shortcut system demo
├── exporters/
│   └── KnowledgeExporter.ts  # Export system knowledge
├── importers/
│   └── KnowledgeImporter.ts  # Import and apply knowledge
├── mergers/
│   └── KnowledgeMerger.ts    # Merge multiple knowledge sources
├── validators/
│   └── KnowledgeValidator.ts # Validate knowledge compatibility
├── shortcuts/
│   └── ShortcutManager.ts    # Data-driven shortcut system
├── data/
│   └── shortcuts.json        # Shortcut database (auto-generated)
└── utils/
    └── CLILogger.ts          # Colored console logging
```

## Features

### 🚀 Export Commands

- **Full Export**: Complete system state, plugins, events, resources, and learning data
- **Partial Export**: Selective export of specific components
- **Filtered Export**: Export by time range, plugin, or event type
- **Performance Data**: Include detailed performance metrics and statistics

### 📥 Import Commands

- **Validation**: Validate knowledge files before importing
- **Dry Run**: Preview what would be imported without making changes
- **Merge Mode**: Merge with existing knowledge instead of replacing
- **Backup**: Automatic backup creation before importing
- **Force Import**: Override validation warnings

### 🔄 Merge Commands

- **Multiple Sources**: Merge knowledge from multiple agents
- **Conflict Resolution**: Automatic conflict resolution strategies
- **Merge Strategies**: Latest, priority-based, or consensus merging
- **Conflict Detection**: Identify and report potential conflicts

### 🔍 Validation Commands

- **Compatibility Check**: Ensure knowledge is compatible with current system
- **Strict Validation**: Enhanced validation with strict rules
- **Validation Reports**: Generate detailed validation reports
- **Version Compatibility**: Check MusicalConductor version compatibility

### 📊 Status Commands

- **System Status**: Current system knowledge status
- **Detailed View**: Comprehensive system information
- **JSON Output**: Machine-readable status information

### 🔍 Diff Commands

- **Knowledge Comparison**: Compare knowledge between files or current system
- **Multiple Formats**: Text, JSON, or HTML diff output
- **Change Detection**: Identify added, removed, and modified components

### 🔗 Shortcut Commands (NEW)

- **Keyword Access**: Quick access to documentation via keywords (e.g., `testing`, `architecture`)
- **Smart Search**: Fuzzy search across shortcuts with relevance scoring
- **Category Browsing**: Organize shortcuts by categories (testing, architecture, development, etc.)
- **Resource Types**: Support for documentation, code, examples, tests, APIs, and guides
- **Priority Ranking**: Resources ranked by importance and relevance
- **Data-Driven**: Easy to add/update shortcuts via JSON configuration

## Usage Examples

### Basic Export

```bash
# Export all knowledge
npm run knowledge:export

# Export specific components
npm run knowledge -- export --type=plugins,events --output=my-knowledge.json

# Export with performance data
npm run knowledge -- export --include-performance --time-range=1d
```

### Import Knowledge

```bash
# Validate before importing
npm run knowledge -- import --file=agent-knowledge.json --validate-only

# Dry run to see what would be imported
npm run knowledge -- import --file=agent-knowledge.json --dry-run

# Import with backup
npm run knowledge -- import --file=agent-knowledge.json --backup --merge
```

### Merge Multiple Agents

```bash
# Merge knowledge from multiple agents
npm run knowledge -- merge --files=agent1.json,agent2.json,agent3.json --output=merged.json

# Use priority-based merging
npm run knowledge -- merge --files=agent1.json,agent2.json --strategy=priority --resolve-conflicts
```

### Validation

```bash
# Validate knowledge file
npm run knowledge -- validate --file=knowledge.json

# Strict validation with report
npm run knowledge -- validate --file=knowledge.json --strict --report=validation-report.json
```

### System Status

```bash
# Basic status
npm run knowledge:status

# Detailed status in JSON format
npm run knowledge -- status --detailed --json
```

### Compare Knowledge

```bash
# Compare two knowledge files
npm run knowledge -- diff --file-a=before.json --file-b=after.json

# Compare with current system
npm run knowledge -- diff --file-a=exported.json --file-b=current --format=json
```

### Quick Documentation Access (NEW)

```bash
# Get all testing resources
npm run shortcut-demo -- shortcut testing

# Get architecture documentation
npm run shortcut-demo -- shortcut architecture

# Search for anything related to "sequence"
npm run shortcut-demo -- shortcut sequence --search

# Browse all shortcuts
npm run shortcut-demo -- shortcuts --list

# Browse by category
npm run shortcut-demo -- shortcuts --category testing

# List all categories
npm run shortcut-demo -- shortcuts --list-categories
```

## Knowledge Data Structure

The CLI works with a comprehensive knowledge structure:

```typescript
interface AgentKnowledge {
  metadata: {
    agentId: string;
    timestamp: number;
    version: string;
    musicalConductorVersion: string;
    exportType: "full" | "partial" | "incremental";
    description?: string;
  };
  systemState: {
    conductorStatistics: any;
    performanceMetrics: any;
    eventLogs: any[];
    queueState: any;
  };
  pluginKnowledge: {
    mountedPlugins: any[];
    pluginConfigurations: any[];
    pluginMetadata: any[];
    sequenceDefinitions: any[];
  };
  eventKnowledge: {
    eventSubscriptions: any[];
    eventHistory: any[];
    eventPatterns: any[];
    domainEvents: any[];
  };
  resourceKnowledge: {
    resourceOwnership: any[];
    resourceConflicts: any[];
    resourceDelegations: any[];
  };
  learningData: {
    successPatterns: any[];
    errorPatterns: any[];
    optimizationInsights: any[];
    bestPractices: string[];
  };
}
```

## Integration with MusicalConductor

The CLI integrates deeply with the MusicalConductor system:

- **System State**: Exports conductor statistics, queue state, and performance metrics
- **Plugin System**: Handles mounted plugins, configurations, and sequence definitions
- **Event System**: Captures event subscriptions, history, and patterns
- **Resource Management**: Tracks resource ownership and conflicts
- **Learning Data**: Preserves best practices and optimization insights

## Best Practices

### For AI Agents

1. **Regular Exports**: Export knowledge regularly to capture learning progress
2. **Validation First**: Always validate knowledge before importing
3. **Backup Strategy**: Use backup options when importing critical knowledge
4. **Merge Conflicts**: Review merge conflicts and choose appropriate resolution strategies
5. **Version Compatibility**: Ensure knowledge is compatible across different system versions

### For Knowledge Transfer

1. **Incremental Updates**: Use time-based filtering for incremental knowledge transfer
2. **Selective Import**: Import only relevant components to avoid conflicts
3. **Validation Reports**: Generate and review validation reports for complex imports
4. **Diff Analysis**: Use diff commands to understand changes before applying them

## Available Commands

All commands are available through npm scripts:

```bash
npm run knowledge:help      # Show help information
npm run knowledge:export    # Export knowledge
npm run knowledge:import    # Import knowledge
npm run knowledge:merge     # Merge multiple knowledge files
npm run knowledge:validate  # Validate knowledge files
npm run knowledge:status    # Show system status
npm run knowledge:diff      # Compare knowledge files

# NEW: Shortcut commands for quick documentation access
npm run shortcut-demo -- shortcut <keyword>     # Get resources for keyword
npm run shortcut-demo -- shortcuts --list       # List all shortcuts
npm run shortcut-demo -- shortcuts --category <name>  # Browse by category
```

## Dependencies

- **commander**: Command-line interface framework
- **ts-node**: TypeScript execution for Node.js
- **typescript**: TypeScript compiler and type definitions
