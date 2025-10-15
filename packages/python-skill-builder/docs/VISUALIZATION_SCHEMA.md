# Visualization Schema Documentation

## Overview
This document defines the JSON schema for data-driven visualizations in the Python Skill Builder. Visualizations allow workshops to define multiple UI rendering modes through configuration.

## Workshop Visualization Configuration

### Schema Structure

```json
{
  "id": "workshop_id",
  "title": "Workshop Title",
  "visualizations": [
    {
      "id": "unique_viz_id",
      "type": "cli|web|animation|agentic",
      "enabled": true,
      "config": {
        // Type-specific configuration
      }
    }
  ]
}
```

### Visualization Types

#### 1. CLI Dashboard (`type: "cli"`)

Text-based dashboard rendering using ASCII art and formatting.

**Configuration:**
```json
{
  "id": "cli_dashboard",
  "type": "cli",
  "enabled": true,
  "config": {
    "template": "╔═══════════════════════════════╗\n║   Title   ║\n╠═══════════════════════════════╣\n║  {variable_name}  ║\n╚═══════════════════════════════╝",
    "placeholders": {
      "variable_name": "execution.variables.var_name.value"
    }
  }
}
```

**Placeholder Syntax:**
- `execution.functions.{name}` - Access function info
- `execution.classes.{name}` - Access class info
- `execution.classes.{name}.methods` - Access class methods array
- `execution.variables.{name}.value` - Access variable value
- `execution.variables.{name}.type` - Access variable type

**Example:**
```json
{
  "id": "counter_cli",
  "type": "cli",
  "enabled": true,
  "config": {
    "template": "╔═══════════════════════════════╗\n║   🧮  Counter Class Results   ║\n╠═══════════════════════════════╣\n║  Class: {class_name}          ║\n║  Methods: {methods}           ║\n╚═══════════════════════════════╝",
    "placeholders": {
      "class_name": "Counter",
      "methods": "from_list, is_positive"
    }
  }
}
```

#### 2. Web Dashboard (`type: "web"`)

Interactive web-based visualization with split panels.

**Configuration:**
```json
{
  "id": "web_dashboard",
  "type": "web",
  "enabled": true,
  "config": {
    "layout": "split-horizontal|split-vertical|tabbed",
    "panels": [
      {
        "id": "code_panel",
        "type": "code-editor",
        "title": "Your Code"
      },
      {
        "id": "results_panel",
        "type": "results",
        "title": "Execution Results"
      }
    ]
  }
}
```

#### 3. Animation (`type: "animation"`)

SVG/Canvas-based animations for data flow visualization.

**Configuration:**
```json
{
  "id": "data_flow_animation",
  "type": "animation",
  "enabled": true,
  "config": {
    "animationType": "data-flow|state-machine|tree",
    "duration": 2000,
    "autoPlay": true
  }
}
```

#### 4. Agentic Interface (`type: "agentic"`)

AI-powered feedback and progress tracking.

**Configuration:**
```json
{
  "id": "ai_feedback",
  "type": "agentic",
  "enabled": true,
  "config": {
    "feedbackStyle": "conversational|technical|encouraging",
    "showProgress": true,
    "showBadges": true
  }
}
```

## API Response Format

When visualizations are configured, the `/api/grade` endpoint returns:

```json
{
  "ok": true,
  "score": 100,
  "max_score": 100,
  "feedback": "Great work!",
  "elapsed_ms": 5,
  "execution_results": {
    "functions": {
      "function_name": {
        "name": "function_name",
        "type": "function"
      }
    },
    "classes": {
      "ClassName": {
        "name": "ClassName",
        "type": "class",
        "methods": ["method1", "method2"]
      }
    },
    "variables": {
      "var_name": {
        "name": "var_name",
        "type": "int",
        "value": "42"
      }
    }
  },
  "visualizations": [
    {
      "id": "cli_dashboard",
      "type": "cli",
      "enabled": true,
      "config": { ... }
    }
  ]
}
```

## Backward Compatibility

- Workshops without `visualizations` field continue to work with simple text feedback
- Frontend gracefully handles missing visualization configurations
- Execution results are always captured but only used when visualizations are present

## Implementation Notes

### Phase 1 (MVP)
- CLI dashboard type only
- Basic template placeholder replacement
- Simple execution result capture

### Future Phases
- Web dashboard with Monaco editor
- SVG/Canvas animations
- AI-powered feedback generation

## Examples

See `modules/oop_fundamentals.json` for a complete example with CLI visualization configured.

