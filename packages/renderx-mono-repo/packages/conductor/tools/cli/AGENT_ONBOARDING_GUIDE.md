# 🤖 AI Agent Onboarding Guide - MusicalConductor CLI

## 🎯 Quick Start for New Agents

Welcome! This guide will get you up and running with the MusicalConductor CLI system for knowledge transfer and documentation access.

## 📚 What You Need to Know

### 1. **Two Main CLI Systems**

- **Knowledge Transfer CLI**: For sharing knowledge between agents
- **Shortcut System**: For quick access to documentation and resources

### 2. **Essential Commands to Remember**

```bash
# 🔍 DISCOVERY - Start here to understand what's available
npm run shortcut-demo -- shortcuts                    # Overview of shortcuts
npm run shortcut-demo -- shortcuts --list            # List all shortcuts
npm run shortcut-demo -- shortcuts --list-categories # Browse categories

# 📖 QUICK ACCESS - Get documentation fast
npm run shortcut-demo -- shortcut testing           # Testing docs
npm run shortcut-demo -- shortcut architecture      # Architecture docs
npm run shortcut-demo -- shortcut sequences         # Sequence system docs
npm run shortcut-demo -- shortcut plugins           # Plugin development
npm run shortcut-demo -- shortcut events            # Event system docs

# 🔄 KNOWLEDGE TRANSFER - Share knowledge with other agents
npm run knowledge -- export --output=my-knowledge.json    # Export your knowledge
npm run knowledge -- import --file=other-agent.json --merge  # Import from others
```

## 🚀 Step-by-Step Onboarding

### Step 1: Explore Available Resources
```bash
# See what shortcuts are available
npm run shortcut-demo -- shortcuts

# This shows you:
# - Total shortcuts available
# - Categories of documentation
# - Popular shortcuts to try
```

### Step 2: Access Documentation by Topic
```bash
# Need testing help?
npm run shortcut-demo -- shortcut testing

# Want to understand the architecture?
npm run shortcut-demo -- shortcut architecture

# Working with sequences?
npm run shortcut-demo -- shortcut sequences
```

### Step 3: Search When You're Not Sure
```bash
# Search for anything related to "test"
npm run shortcut-demo -- shortcut test --search

# Search for "event" related resources
npm run shortcut-demo -- shortcut event --search
```

### Step 4: Export Your Knowledge (After Working)
```bash
# Export everything you've learned
npm run knowledge -- export --type=all --output=agent-$(date +%Y%m%d).json

# Export just specific areas
npm run knowledge -- export --type=plugins,events --output=my-plugin-knowledge.json
```

### Step 5: Import Knowledge from Other Agents
```bash
# Always validate first
npm run knowledge -- import --file=senior-agent-knowledge.json --validate-only

# Import with backup (safe)
npm run knowledge -- import --file=senior-agent-knowledge.json --merge --backup

# Preview what would be imported
npm run knowledge -- import --file=senior-agent-knowledge.json --dry-run
```

## 🎯 Available Shortcuts (Current)

| Keyword | Aliases | Description |
|---------|---------|-------------|
| `testing` | test, tests, unit-test | Testing documentation and examples |
| `architecture` | arch, design, structure | System architecture and design docs |
| `sequences` | sequence, beats, movements | Musical sequence system docs |
| `plugins` | plugin, extensions, mounting | Plugin system development |
| `events` | event, eventbus, messaging | Event system and communication |
| `cli` | command-line, knowledge-cli | CLI tools and usage |

## 💡 Pro Tips for Agents

### 🔍 **Discovery Patterns**
```bash
# When you don't know the exact keyword
npm run shortcut-demo -- shortcut <partial-word> --search

# Browse by category when exploring
npm run shortcut-demo -- shortcuts --category development
npm run shortcut-demo -- shortcuts --category testing
```

### 🔄 **Knowledge Sharing Patterns**
```bash
# Regular export (daily/weekly)
npm run knowledge -- export --include-performance --output=daily-$(date +%Y%m%d).json

# Merge multiple agent knowledge
npm run knowledge -- merge --files=agent1.json,agent2.json --output=team-knowledge.json

# Compare your knowledge with another agent
npm run knowledge -- diff --file-a=my-export.json --file-b=other-agent.json
```

### 🛡️ **Safety Patterns**
```bash
# Always validate before importing
npm run knowledge -- validate --file=knowledge.json --strict

# Use dry-run to preview changes
npm run knowledge -- import --file=knowledge.json --dry-run

# Create backups before major imports
npm run knowledge -- import --file=knowledge.json --backup --merge
```

## 🆘 Common Scenarios

### "I need to understand how testing works"
```bash
npm run shortcut-demo -- shortcut testing
# This gives you:
# - Testing guide documentation
# - Unit test examples
# - Test utilities and helpers
```

### "I'm working on a plugin and need examples"
```bash
npm run shortcut-demo -- shortcut plugins
# This provides:
# - Plugin development guide
# - Example implementations
# - Plugin API documentation
```

### "Another agent shared knowledge with me"
```bash
# Step 1: Validate it
npm run knowledge -- validate --file=shared-knowledge.json

# Step 2: Preview what it contains
npm run knowledge -- import --file=shared-knowledge.json --dry-run

# Step 3: Import safely
npm run knowledge -- import --file=shared-knowledge.json --merge --backup
```

### "I want to share my learning with the team"
```bash
# Export your knowledge
npm run knowledge -- export --include-performance --output=my-insights-$(date +%Y%m%d).json

# Share the file with other agents
# They can import it using the import commands above
```

## 🔧 Customization

### Adding New Shortcuts
The shortcut system is data-driven. To add new shortcuts:

1. **Edit the shortcuts database**: `tools/cli/data/shortcuts.json`
2. **Or modify defaults in**: `tools/cli/shortcuts/ShortcutManager.ts`

Example shortcut structure:
```json
{
  "keyword": "debugging",
  "aliases": ["debug", "troubleshoot"],
  "description": "Debugging guides and tools",
  "category": "development",
  "resources": [
    {
      "type": "documentation",
      "title": "Debugging Guide",
      "description": "Step-by-step debugging instructions",
      "filePath": "docs/debugging/README.md",
      "priority": 10,
      "tags": ["debugging", "troubleshooting"]
    }
  ]
}
```

## 📞 Getting Help

### Built-in Help
```bash
npm run knowledge -- --help          # Knowledge transfer help
npm run shortcut-demo -- --help       # Shortcut system help
```

### Quick Reference
```bash
# Most common commands
npm run shortcut-demo -- shortcuts                    # See all shortcuts
npm run shortcut-demo -- shortcut <keyword>          # Get specific docs
npm run knowledge -- export --output=my-knowledge.json  # Export knowledge
npm run knowledge -- import --file=other.json --merge   # Import knowledge
```

## 🎉 You're Ready!

Start with:
1. `npm run shortcut-demo -- shortcuts` to see what's available
2. Pick a topic you're working on and use `npm run shortcut-demo -- shortcut <topic>`
3. Export your knowledge regularly with `npm run knowledge -- export`
4. Import knowledge from other agents to learn faster

Happy coding! 🎼
