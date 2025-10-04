# Implement OpenAI Integration for LLM-Driven Pipeline

## Summary
Replace the current placeholder LLM steps in the package-builder pipeline with actual OpenAI API integration to enable fully automated package generation from feature requests.

## Problem
Currently, the package-builder has a well-designed architecture for an "LLM-Driven Pipeline" but uses placeholder echo statements instead of actual LLM calls. The 5 agent system (Planner, Implementer, Tester, Packager, Verifier) exists only as prompt templates without implementation.

## Proposed Solution
Integrate OpenAI's API to power the 5-agent pipeline using the existing prompt templates in the `agents/` folder.

## Implementation Tasks

### 1. Core Infrastructure
- [ ] Add OpenAI SDK dependency (`openai` package)
- [ ] Create shared LLM client utility (`src/llm-client.ts`)
- [ ] Add environment variable validation for `OPENAI_API_KEY`
- [ ] Configure model selection (GPT-4, GPT-3.5-turbo, etc.)

### 2. Agent Implementation
Replace placeholder scripts with actual LLM-powered implementations:

#### Planner Agent (`scripts/pb-plan.ts`)
- [ ] Read feature request input (name, description, requirements)
- [ ] Use `agents/planner.prompt.md` template
- [ ] Call OpenAI API to generate package specification JSON
- [ ] Validate and save plan output

#### Implementer Agent (`scripts/pb-implement.ts`)
- [ ] Read planner JSON output
- [ ] Use `agents/implementer.prompt.md` template
- [ ] Generate TypeScript code, tests, and documentation
- [ ] Write files to working directory

#### Tester Agent (`scripts/pb-test.ts`)
- [ ] Run unit tests and E2E tests
- [ ] On failures, use `agents/tester.prompt.md` to generate fixes
- [ ] Iterate until tests pass or max attempts reached

#### Packager Agent (enhance existing `pb-move.ts` and `pb-build-tgz.ts`)
- [ ] Use `agents/packager.prompt.md` for validation
- [ ] Ensure proper package.json generation
- [ ] Verify exports and TypeScript declarations

#### Verifier Agent (enhance existing `pb-spinup-integration.ts`)
- [ ] Use `agents/verifier.prompt.md` for smoke test generation
- [ ] Validate external installation works correctly

### 3. GitHub Actions Integration
- [ ] Update `.github/workflows/package-builder.yml` to use real LLM agents
- [ ] Add `OPENAI_API_KEY` as repository secret
- [ ] Replace placeholder echo statements with actual script calls
- [ ] Add proper error handling and retry logic

### 4. CLI Interface
- [ ] Create main entry point (`scripts/pb-generate.ts`)
- [ ] Accept feature requests via CLI arguments or file input
- [ ] Orchestrate the full 5-agent pipeline
- [ ] Provide progress feedback and error reporting

### 5. Configuration & Error Handling
- [ ] Add model configuration options (temperature, max tokens, etc.)
- [ ] Implement retry logic for API failures
- [ ] Add cost tracking and usage monitoring
- [ ] Create validation for LLM outputs

## Example Usage

```bash
# Generate a new package using LLM pipeline
npm run generate -- svg-editor \
  --description "Tiny SVG DOM manipulation helpers for UI" \
  --keywords "svg,dom,ui" \
  --runtime "browser"

# Or from a feature request file
npm run generate -- --from-file feature-request.md
```

## Technical Considerations

### Environment Variables
- `OPENAI_API_KEY` - Required for API access
- `OPENAI_MODEL` - Optional, defaults to "gpt-4"
- `OPENAI_MAX_TOKENS` - Optional, defaults to 4000
- `OPENAI_TEMPERATURE` - Optional, defaults to 0.1 (for consistency)

### Dependencies to Add
```json
{
  "dependencies": {
    "openai": "^4.0.0"
  }
}
```

### File Structure Changes
```
scripts/
├── llm/
│   ├── client.ts           # OpenAI client wrapper
│   ├── prompt-builder.ts   # Template processing
│   └── validators.ts       # Output validation
├── pb-generate.ts          # Main orchestrator
├── pb-plan.ts             # Planner agent
├── pb-implement.ts        # Implementer agent
├── pb-test.ts             # Tester agent
└── (existing files...)
```

## Acceptance Criteria
- [ ] Can generate a complete, working package from a simple feature description
- [ ] All 5 agents successfully integrate with OpenAI API
- [ ] GitHub Actions workflow runs end-to-end with real LLM calls
- [ ] Generated packages pass all quality gates (tests, types, exports)
- [ ] Proper error handling and retry logic for API failures
- [ ] Cost-effective usage with appropriate token limits

## Testing Strategy
1. **Unit Tests**: Mock OpenAI responses to test agent logic
2. **Integration Tests**: Use real API calls with simple test cases
3. **E2E Tests**: Generate actual packages and verify they work
4. **Cost Testing**: Monitor token usage and optimize prompts

## Success Metrics
- Successfully generate at least 3 different types of packages (DOM utilities, data helpers, UI components)
- 90%+ success rate on package generation
- Generated packages pass all existing quality gates
- Average generation time under 5 minutes

## Related Files
- `agents/planner.prompt.md` - Existing prompt template
- `agents/implementer.prompt.md` - Existing prompt template  
- `agents/tester.prompt.md` - Existing prompt template
- `agents/packager.prompt.md` - Existing prompt template
- `agents/verifier.prompt.md` - Existing prompt template
- `.github/workflows/package-builder.yml` - GitHub Actions workflow

## Priority
High - This is the core missing piece to make the package-builder fully functional as intended.

---

*Note: The existing architecture and prompt templates are already well-designed for this integration. This issue focuses on connecting the OpenAI API to the existing framework.*