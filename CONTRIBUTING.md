# Contributing to Node PDF Printer

Thank you for your interest in contributing to node-pdf-printer! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please be respectful and constructive in all interactions. We're building this together!

## Development Setup

### Prerequisites

- Node.js 22.0.0 or higher
- Git
- Platform-specific requirements:
  - **Windows**: Visual Studio Build Tools (for Koffi compilation)
  - **Linux**: build-essential, CUPS
  - **macOS**: Xcode Command Line Tools, CUPS

### Setup Steps

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/node-pdf-printer.git
   cd node-pdf-printer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run examples to verify setup**
   ```bash
   npm run example:list
   npm run example:simple
   ```

## Project Structure

```
node-pdf-printer/
├── src/
│   ├── index.ts              # Main entry point with cross-platform logic
│   ├── windows-print-api.ts  # Windows native API bindings (Koffi)
│   ├── printer-manager.ts    # Windows printer management
│   ├── pdf-printer.ts        # Windows PDF printing implementation
│   └── unix-printer.ts       # Unix/Linux/macOS printing implementation
├── examples/
│   ├── simple-print.ts       # Basic printing example
│   ├── duplex-print.ts       # Duplex printing examples
│   ├── advanced-print.ts     # Advanced options example
│   ├── list-printers.ts      # List available printers
│   └── unix-print.ts         # Unix-specific example
├── lib/                      # Compiled JavaScript output (git-ignored)
├── README.md                 # Main documentation
├── CONTRIBUTING.md           # This file
├── CHANGELOG.md              # Version history
└── package.json              # Package configuration
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow existing code style and patterns
   - Update TypeScript types as needed

3. **Test your changes**
   ```bash
   npm run build
   npm run example:simple
   # Test on your target platform(s)
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format

Use conventional commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add support for custom paper sizes on Unix
fix: resolve duplex printing issue on Windows 11
docs: update API reference for PrintOptions
```

## Coding Guidelines

### TypeScript

- Use TypeScript for all source code
- Provide explicit types for public APIs
- Use interfaces for object shapes
- Export types alongside implementations

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add JSDoc comments for public methods
- Keep functions focused and small
- Prefer async/await over callbacks

### Example of well-documented code:

```typescript
/**
 * Print a PDF file with specified options
 * @param pdfPath - Absolute or relative path to PDF file
 * @param options - Print configuration options
 * @throws {Error} If PDF file not found or print job fails
 * @example
 * ```typescript
 * await printer.print('./document.pdf', {
 *   copies: 2,
 *   duplex: 'vertical'
 * });
 * ```
 */
async print(pdfPath: string, options: PrintOptions = {}): Promise<void> {
  // Implementation
}
```

### Platform-Specific Code

- Check platform at runtime: `os.platform() === 'win32'`
- Keep Windows and Unix code separated
- Provide unified APIs in `index.ts`
- Document platform-specific limitations

## Testing

### Manual Testing

Before submitting a PR, test on available platforms:

1. **Windows Testing**
   ```bash
   npm run example:simple
   npm run example:duplex
   npm run example:advanced
   ```

2. **Unix/Linux Testing**
   ```bash
   npm run example:unix
   npm run example:simple
   ```

3. **Cross-Platform Testing**
   - Test with different printers (physical and virtual)
   - Test with various PDF files
   - Verify error handling with invalid inputs

### Test Checklist

- [ ] Code compiles without errors: `npm run build`
- [ ] All examples run successfully
- [ ] No TypeScript type errors
- [ ] Documentation is updated
- [ ] Works with default printer
- [ ] Works with named printer
- [ ] Error messages are clear and helpful

## Submitting Changes

### Pull Request Process

1. **Update documentation**
   - Update README.md if adding features
   - Add entries to CHANGELOG.md
   - Update code comments

2. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Go to GitHub and create a PR
   - Fill in the PR template
   - Link any related issues
   - Request review from maintainers

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tested on Windows
- [ ] Tested on Linux
- [ ] Tested on macOS
- [ ] All examples run successfully

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation has been updated
- [ ] CHANGELOG.md has been updated
```

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - Node.js version: `node --version`
   - OS and version
   - Package version
   - Printer model and driver

2. **Steps to Reproduce**
   - Minimal code example
   - Clear step-by-step instructions
   - Expected behavior
   - Actual behavior

3. **Additional Context**
   - Error messages and stack traces
   - Screenshots if applicable
   - Relevant logs

### Feature Requests

For feature requests, describe:
- The problem you're trying to solve
- Proposed solution
- Alternative solutions considered
- Platform compatibility considerations

## Questions?

If you have questions about contributing:
- Open a GitHub Discussion
- Check existing issues for similar questions
- Review the README.md for API documentation

Thank you for contributing to node-pdf-printer! 🎉
