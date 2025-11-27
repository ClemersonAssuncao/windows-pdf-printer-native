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
│   ├── core/                          # 🎯 Domain layer (platform-agnostic)
│   │   ├── types/
│   │   │   └── index.ts               # PrintOptions, PrinterInfo, PrinterCapabilities
│   │   └── interfaces/
│   │       └── index.ts               # IPrinter, IPrinterManager (contracts)
│   │
│   ├── adapters/                      # 🔌 Platform-specific implementations
│   │   └── windows/
│   │       ├── api/
│   │       │   └── winspool.api.ts   # Windows API bindings (Koffi FFI)
│   │       └── windows-printer-manager.adapter.ts  # Windows IPrinterManager impl
│   │
│   ├── services/                      # 🛠️ Utility services
│   │   └── platform-detector.service.ts  # Platform detection (Windows/Unix)
│   │
│   ├── factories/                     # 🏭 Factory pattern
│   │   └── printer.factory.ts        # Creates platform-specific instances
│   │
│   ├── index.ts                       # 📦 Main entry point (public API)
│   ├── pdf-printer.ts                 # Windows PDF printer implementation
│   ├── printer-manager.ts             # Windows printer manager
│   └── unix-printer.ts                # Unix/Linux/macOS implementation
│
├── examples/
│   ├── simple-print.ts                # Basic printing example
│   ├── duplex-print.ts                # Duplex printing examples
│   ├── advanced-print.ts              # Advanced options example
│   ├── list-printers.ts               # List available printers
│   ├── test-devmode.ts                # Test DEVMODE configuration
│   ├── inspect-devmode.ts             # Inspect DEVMODE settings
│   └── unix-print.ts                  # Unix-specific example
│
├── tests/                             # 🧪 Test suite
│   ├── windows-print-api.test.ts      # Windows API tests
│   ├── printer-manager.test.ts        # Printer manager tests
│   ├── pdf-printer.test.ts            # PDF printer tests
│   ├── unix-printer.test.ts           # Unix printer tests
│   └── cross-platform.test.ts         # Cross-platform tests
│
├── docs/
│   ├── TESTING-DEVMODE.md             # DEVMODE testing guide
│   ├── CLEAN-ARCHITECTURE.md          # Architecture documentation
│   └── GET-PRINTJOB-VS-DEVMODE.md     # PowerShell vs DEVMODE explanation
│
├── lib/                               # Compiled JavaScript output
├── README.md                          # Main documentation
├── CONTRIBUTING.md                    # This file
├── CHANGELOG.md                       # Version history
└── package.json                       # Package configuration
```

### Architecture Overview

This project follows **Clean Architecture** principles:

**Core Layer** (`src/core/`)
- Platform-agnostic domain types and interfaces
- No external dependencies
- Defines contracts that all implementations must follow

**Adapters Layer** (`src/adapters/`)
- Platform-specific implementations (Windows, Unix)
- Windows: Uses Koffi FFI for native winspool.drv API calls
- Unix: Uses CUPS via child_process

**Services Layer** (`src/services/`)
- Utility services like platform detection
- Reusable across different adapters

**Factories Layer** (`src/factories/`)
- Factory pattern for creating platform-specific instances
- Implements dependency injection

**Public API** (`src/index.ts`)
- Simple, clean facade API
- Maintains backward compatibility
- Exports both legacy and new architecture APIs

See [CLEAN-ARCHITECTURE.md](CLEAN-ARCHITECTURE.md) for detailed architecture documentation.

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

### Automated Testing

This project includes a comprehensive test suite with 73+ tests:

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- windows-print-api.test.ts
```

**Test Coverage:**
- ✅ Windows API bindings (Koffi structures, constants, functions)
- ✅ Printer Manager (list printers, default printer, capabilities)
- ✅ PDF Printer (print, printRaw, options handling)
- ✅ Unix Printer (CUPS integration) - skipped on Windows
- ✅ Cross-platform compatibility
- ✅ Error handling and edge cases

### Manual Testing

Before submitting a PR, test on available platforms:

**1. Windows Testing**
```bash
# Build project
npm run build

# List printers
npm run example:list

# Test basic printing
npm run example:simple

# Test duplex printing
npm run example:duplex

# Test advanced options
npm run example:advanced

# Verify DEVMODE configuration
npm run example:inspect-devmode
npm run example:test-devmode
```

**2. Unix/Linux/macOS Testing**
```bash
# Ensure CUPS is running
systemctl status cups  # Linux
# or
open "http://localhost:631"  # macOS

# Run tests
npm run example:unix
npm run example:simple
npm run example:list
```

**3. DEVMODE Verification (Windows)**

To verify print settings are correctly applied:

```bash
# Method 1: Inspect DEVMODE directly (RECOMMENDED)
npm run example:inspect-devmode

# Method 2: Test with print job monitoring
npm run example:test-devmode

# Method 3: Monitor print spooler
npm run example:monitor
```

See [TESTING-DEVMODE.md](TESTING-DEVMODE.md) for detailed instructions.

**4. Cross-Platform Testing**
- Test with different printers (physical and virtual)
- Test with various PDF files (small, large, complex)
- Test with Microsoft Print to PDF (Windows)
- Test with CUPS-PDF (Linux)
- Verify error handling with:
  - Non-existent printers
  - Invalid file paths
  - Corrupted PDF files
  - Invalid print options

### Test Checklist

Before submitting a PR, ensure:

**Code Quality:**
- [ ] Code compiles without errors: `npm run build`
- [ ] No TypeScript type errors
- [ ] All automated tests pass: `npm test`
- [ ] Code follows existing style and patterns
- [ ] JSDoc comments added for public APIs

**Functionality:**
- [ ] All examples run successfully
- [ ] Works with default printer
- [ ] Works with named printer
- [ ] Print options are correctly applied (verify DEVMODE on Windows)
- [ ] Error messages are clear and helpful
- [ ] Handles edge cases gracefully

**Documentation:**
- [ ] README.md updated if adding features
- [ ] CHANGELOG.md updated with changes
- [ ] Code comments explain complex logic
- [ ] Examples added for new features

**Architecture:**
- [ ] Follows Clean Architecture principles
- [ ] Platform-specific code in appropriate adapters
- [ ] Interfaces used for contracts
- [ ] No breaking changes to public API (unless major version)
- [ ] Backward compatibility maintained

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
