# Data-Driven UI Visualizations for Python Skill Builder

## Summary
Implement a flexible, data-driven visualization system that allows workshops to define multiple UI rendering modes (CLI dashboard, web UI, animations, agentic interfaces) through JSON configuration, making the training experience more engaging and adaptable.

## Background
Currently, the Python skill builder displays results as simple text feedback. We want to create rich, interactive visualizations that bring exercises to life while maintaining data-driven configuration.

## Research & Analysis

### Current Architecture
- **Backend**: Flask API with JSON module definitions
- **Frontend**: Vanilla JavaScript, no frameworks
- **Styling**: Custom CSS with dark theme
- **Data Flow**: Code submission → grading → simple text feedback

### Required Changes

#### 1. Backend Extensions
**API Changes:**
- Extend `/api/grade` to return structured execution results
- Add visualization metadata to module JSON responses
- Support execution result capture for visualization consumption

**New Response Format:**
```json
{
  "ok": true,
  "score": 100,
  "max_score": 100,
  "feedback": "Great work!",
  "elapsed_ms": 5,
  "execution_results": {
    "method_calls": [
      {"method": "from_list", "args": [[1,2,3,4]], "result": 10},
      {"method": "is_positive", "args": [5], "result": true},
      {"method": "is_positive", "args": [-3], "result": false}
    ],
    "class_state": {"total": 10},
    "variables": {"c": "<Counter object>"}
  },
  "visualizations": ["cli_dashboard", "web_dashboard", "animated"]
}
```

#### 2. JSON Schema Extensions
**Workshop Structure:**
```json
{
  "id": "oop_02",
  "title": "classmethod vs staticmethod",
  "visualizations": [
    {
      "id": "cli_dashboard",
      "type": "cli",
      "enabled": true,
      "config": {
        "template": "╔═══════════════════════════════╗\\n║   🧮  Counter Class Results   ║\\n╠═══════════════════════════════╣\\n║  Input List: {input_list}     ║\\n║  from_list() → {from_list_result}             ║\\n║  total (class attr): {total}       ║\\n╟───────────────────────────────╢\\n║  is_positive(5)  → {positive_5}    ║\\n║  is_positive(-3) → {positive_neg3}   ║\\n╚═══════════════════════════════╝",
        "placeholders": {
          "input_list": "execution.input || [1,2,3,4]",
          "from_list_result": "execution.results.from_list",
          "total": "execution.results.total",
          "positive_5": "execution.results.is_positive_5 ? '✅ True' : '❌ False'",
          "positive_neg3": "execution.results.is_positive_neg3 ? '✅ True' : '❌ False'"
        }
      }
    }
  ]
}
```

#### 3. Frontend Architecture
**New Components Needed:**
- `VisualizationManager`: Orchestrates rendering based on config
- `CLIRenderer`: Text-based dashboard rendering
- `WebUIRenderer`: Split-panel with Monaco editor
- `AnimationRenderer`: SVG/Canvas animations
- `AgenticRenderer`: AI-powered feedback cards

**Progressive Enhancement:**
```javascript
class VisualizationManager {
  constructor(container) {
    this.container = container;
    this.renderers = {
      cli: new CLIRenderer(),
      web: new WebUIRenderer(),
      animation: new AnimationRenderer(),
      agentic: new AgenticRenderer()
    };
  }

  async render(visualizationConfig, executionResults) {
    const renderer = this.renderers[visualizationConfig.type];
    if (!renderer) return;
    
    const element = await renderer.render(visualizationConfig, executionResults);
    this.container.appendChild(element);
  }
}
```

#### 4. Technology Stack Additions

**Python Libraries (requirements.txt):**
```
rich>=13.0.0          # CLI dashboards and text formatting
textual>=0.50.0       # Terminal UI framework
plotly>=5.0.0         # Interactive charts (if needed)
```

**JavaScript Libraries (package.json):**
```json
{
  "dependencies": {
    "monaco-editor": "^0.45.0",
    "d3": "^7.8.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@monaco-editor/react": "^4.6.0"
  }
}
```

**CSS Framework Considerations:**
- Keep current custom CSS for core styling
- Add CSS Grid/Flexbox utilities for layout management
- Consider Tailwind CSS for rapid component styling

## Implementation Strategy

### Phase 1: Foundation (Week 1-2)
1. **Backend**: Extend grading API to capture execution results
2. **JSON Schema**: Add visualization config structure
3. **Frontend**: Create VisualizationManager and base renderer classes

### Phase 2: CLI Dashboard (Week 3)
1. Add `rich` dependency
2. Implement CLIRenderer with template system
3. Add CLI toggle in workshop UI

### Phase 3: Web UI Dashboard (Week 4-5)
1. Add Monaco Editor integration
2. Implement split-panel layout
3. Create results panel with dynamic content

### Phase 4: Animations (Week 6-7)
1. Add D3.js/SVG animation library
2. Implement data flow visualizations
3. Add interactive elements

### Phase 5: Agentic Interface (Week 8)
1. Integrate AI feedback generation
2. Add progress timeline
3. Implement badge system

## Testing Strategy

### Unit Tests
- Visualization config parsing
- Template placeholder replacement
- Renderer instantiation

### Integration Tests
- End-to-end grading with visualizations
- Cross-browser compatibility
- Mobile responsiveness

### Performance Tests
- Large result set rendering
- Animation frame rates
- Memory usage with complex visualizations

## Migration Plan

### Backward Compatibility
- Existing workshops continue to work without visualizations
- Default to simple text feedback when no visualizations configured
- Graceful degradation for unsupported visualization types

### Data Migration
- Add visualization configs to existing workshops incrementally
- Start with Counter workshop as proof of concept
- User progress and saved code remain compatible

## Success Metrics

### Technical
- ✅ All visualization types render correctly
- ✅ <100ms rendering time for typical results
- ✅ <50KB additional bundle size
- ✅ 95%+ test coverage

### User Experience
- ✅ Improved engagement (measured via time spent)
- ✅ Better learning outcomes (measured via completion rates)
- ✅ Positive user feedback on visualization clarity

## Risks & Mitigations

### Performance
- **Risk**: Complex animations slow down grading
- **Mitigation**: Lazy-load visualization libraries, provide fallback

### Browser Compatibility
- **Risk**: Animation libraries not supported in older browsers
- **Mitigation**: Progressive enhancement, feature detection

### Maintenance
- **Risk**: Multiple visualization systems become complex
- **Mitigation**: Shared utilities, comprehensive documentation

## Dependencies & Prerequisites

### Must Complete First
- None (can be implemented independently)

### Recommended Prep
- Review current grading pipeline for execution result capture
- Evaluate Monaco vs CodeMirror for web editor
- Research D3.js alternatives (Three.js, Anime.js) for animations

## Files to Modify

### Backend
- `app.py`: Extend `/api/grade` endpoint
- `modules/*.json`: Add visualization configs

### Frontend
- `app.js`: Integrate VisualizationManager
- `styles.css`: Add visualization-specific styles
- `index.html`: Add visualization containers

### Configuration
- `package.json`: Add visualization dependencies
- `requirements.txt`: Add Python visualization libraries

## Acceptance Criteria

1. **Functional**: All 4 visualization types work end-to-end
2. **Configurable**: Visualizations can be enabled/disabled per workshop
3. **Performant**: No degradation in grading response time
4. **Compatible**: Existing functionality unchanged
5. **Tested**: Comprehensive test coverage for new features
6. **Documented**: Clear usage examples and configuration guide

## Related Issues
- #24: Feature coverage testing
- #26: Multi-approach workshop support
- #31: Lambda function support (recently completed)

## Priority: High
## Effort: 8 weeks
## Risk: Medium</content>
<parameter name="filePath">data-driven-visualizations-issue.md