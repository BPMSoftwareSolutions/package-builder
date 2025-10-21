# Contributing to @renderx-plugins/host-sdk

Thank you for your interest in contributing to the RenderX Host SDK! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Getting Started
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/renderx-host-sdk.git
   cd renderx-host-sdk
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Red-Green-Refactor (TDD)
We follow Test-Driven Development practices:

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Clean up the code while keeping tests green

### Running Tests
```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Building
```bash
npm run build         # Build the project
npm run build:clean   # Clean build (removes dist first)
npm run type-check    # Type check without building
```

## Code Standards

### TypeScript
- Use strict TypeScript settings
- Provide comprehensive type definitions
- Export types from the main types.ts file
- Use JSDoc comments for public APIs

### Testing
- Write unit tests for all new functionality
- Aim for high test coverage
- Test both happy path and error scenarios
- Ensure tests work in Node.js environments (no DOM dependencies)
- Mock external dependencies appropriately

### Facade Pattern
When adding new facades, follow the established pattern:
1. Delegate to host implementation when available
2. Provide Node.js/SSR fallbacks
3. Include comprehensive error handling
4. Support observer patterns with proper unsubscribe
5. Add test utilities for mocking

## Commit Guidelines

### Commit Message Format
```
type(scope): description (#issue-number)

Detailed description of changes made.
- List specific changes
- Include breaking changes if any
- Reference related issues
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks

### Examples
```
feat(sdk): add new inventory search functionality (#42)

- Add searchComponents() method to InventoryAPI
- Support filtering by tags and metadata
- Include comprehensive unit tests
- Update documentation with examples
```

## Pull Request Process

1. **Create a branch** from `main` for your changes
2. **Write tests** for new functionality (TDD approach)
3. **Implement the feature** following existing patterns
4. **Update documentation** (README.md, CHANGELOG.md)
5. **Run all tests** and ensure they pass
6. **Submit a pull request** with a clear description

### PR Requirements
- [ ] All tests pass on both Linux and Windows
- [ ] Code follows established patterns
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (unless major version)
- [ ] Issue linked in PR description

## Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Steps
1. Update version in package.json
2. Update CHANGELOG.md
3. Create release commit
4. Tag the release
5. Push to trigger CI/CD
6. Publish to npm

## Architecture Guidelines

### Facade Pattern
All APIs should follow the established facade pattern:
- Delegate to `window.RenderX.*` when available
- Provide fallbacks for Node.js/SSR environments
- Include comprehensive error handling
- Support both individual functions and convenience objects

### Error Handling
- Use try-catch blocks for host API calls
- Log warnings for missing host implementations
- Provide meaningful fallback behavior
- Never throw errors that break the plugin

### Node.js Compatibility
- All APIs must work in Node.js environments
- Provide mock implementations for testing
- Use `typeof window === "undefined"` checks
- Include test utilities for Node.js environments

## Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check README.md and code comments

## Code of Conduct

Please be respectful and professional in all interactions. We're building tools to help developers create amazing experiences.

Thank you for contributing! 🚀
