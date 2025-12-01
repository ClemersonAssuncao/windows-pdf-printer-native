# Contributing to Windows PDF Printer Native

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project follows a simple code of conduct:
- Be respectful and professional
- Provide constructive feedback
- Focus on improving the codebase
- Help others learn and grow

## Getting Started

### Prerequisites

- **Node.js 18.0.0+**
- **Windows 10/11** (for development and testing)
- **Git**
- **Visual Studio Code** (recommended)
- **PDFium library** (pdfium.dll)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/windows-pdf-printer-native.git
cd windows-pdf-printer-native
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/ClemersonAssuncao/windows-pdf-printer-native.git
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### PDFium Setup (Development)

> **Note:** For end users, PDFium is already included in the npm package. This setup is only needed for contributors.

**Option 1: PowerShell Script**
```powershell
.\install-pdfium.ps1
```

**Option 2: Manual**
1. Download from [bblanchon/pdfium-binaries](https://github.com/bblanchon/pdfium-binaries/releases)
2. Extract `pdfium.dll` to `bin/` folder

### Build Project

```bash
npm run build
```

### Run Examples

```bash
# Simple example
npm run example:simple

# Advanced example
npm run example:advanced

# Quality example
npm run example:quality
```

### Enable Debug Logging

```bash
# Windows CMD
set DEBUG=1 && npm run example:simple

# PowerShell
$env:DEBUG=1; npm run example:simple
```

## Project Structure

```
windows-pdf-printer-native/
├── src/
│   ├── core/                    # Domain layer (platform-agnostic)
│   │   ├── types/               # Enums and interfaces
│   │   │   └── index.ts         # PrintQuality, PaperSize, DuplexMode, etc.
│   │   └── interfaces/          # Contracts (IPrinter, IPrinterManager)
│   │       └── index.ts
│   │
│   ├── adapters/                # Infrastructure layer (platform-specific)
│   │   └── windows/
│   │       ├── api/             # Windows API bindings
│   │       │   ├── gdi32.api.ts        # GDI32.dll functions
│   │       │   ├── winspool.api.ts     # Winspool.drv functions
│   │       │   ├── kernel32.api.ts     # Kernel32.dll functions
│   │       │   ├── pdfium.api.ts       # PDFium bindings
│   │       │   └── index.ts            # Barrel exports
│   │       │
│   │       ├── services/        # Specialized services
│   │       │   ├── pdf-render.service.ts        # PDFium rendering
│   │       │   ├── devmode-config.service.ts    # DEVMODE configuration
│   │       │   └── printer-connection.service.ts # Printer connection
│   │       │
│   │       ├── windows-printer.adapter.ts        # IPrinter implementation
│   │       └── windows-printer-manager.adapter.ts # IPrinterManager implementation
│   │
│   ├── factories/               # Factory pattern
│   │   └── printer.factory.ts   # Creates platform-specific instances
│   │
│   ├── services/                # Application services
│   │   └── platform-detector.service.ts
│   │
│   └── index.ts                 # Public API exports
│
├── bin/                         # Native binaries
│   └── pdfium.dll               # PDFium library (included in npm package)
├── examples/                    # Usage examples
├── tests/                       # Unit and integration tests
└── lib/                         # Compiled output (generated)
```

### Architecture Principles

This project follows **Clean Architecture** (Hexagonal Architecture):

1. **Core Layer (Domain)**
   - Contains business logic, types, and interfaces
   - No external dependencies
   - Platform-agnostic

2. **Adapters Layer (Infrastructure)**
   - Windows-specific implementations
   - API bindings (GDI32, Winspool, PDFium)
   - Service implementations

3. **Factories**
   - Creates platform-specific instances
   - Dependency injection

4. **Public API**
   - Clean, user-friendly facade
   - Backward compatibility

## Coding Standards

### TypeScript Guidelines

1. **Strict TypeScript**
   ```json
   {
     "strict": true,
     "noImplicitAny": true,
     "strictNullChecks": true
   }
   ```

2. **Naming Conventions**
   - Classes: `PascalCase` (e.g., `WindowsPrinterAdapter`)
   - Interfaces: `PascalCase` with `I` prefix (e.g., `IPrinter`)
   - Enums: `PascalCase` (e.g., `PrintQuality`)
   - Enum members: `UPPER_CASE` (e.g., `MEDIUM`)
   - Functions/Methods: `camelCase` (e.g., `printPdfPage()`)
   - Constants: `UPPER_CASE` (e.g., `DM_ORIENTATION`)
   - Private fields: prefix with `_` or use TypeScript `private`

3. **File Naming**
   - Services: `*.service.ts`
   - Adapters: `*.adapter.ts`
   - APIs: `*.api.ts`
   - Interfaces: `index.ts` in `interfaces/` folder
   - Types: `index.ts` in `types/` folder

4. **Code Organization**
   - One class per file
   - Related types in same file
   - Barrel exports (`index.ts`) for clean imports

### Code Style

- **Indentation:** 2 spaces
- **Line Length:** Max 120 characters
- **Quotes:** Single quotes for strings
- **Semicolons:** Always use
- **Trailing Commas:** Yes (for multiline)

### Documentation

1. **JSDoc Comments**
   ```typescript
   /**
    * Render a PDF page to bitmap using PDFium
    * @param pdfDoc - PDFium document handle
    * @param pageIndex - Zero-based page index
    * @param options - Rendering options
    * @returns Rendered page with buffer and metadata
    */
   renderPage(pdfDoc: any, pageIndex: number, options: RenderOptions): RenderedPage {
     // Implementation
   }
   ```

2. **Inline Comments**
   - Explain WHY, not WHAT
   - Focus on complex logic
   - Keep comments up-to-date

3. **README Updates**
   - Update docs for API changes
   - Add examples for new features
   - Update performance benchmarks

### Error Handling

```typescript
// ✅ Good: Specific error messages with context
if (!hDC) {
  throw new Error(`Failed to create device context for printer: ${printerName}`);
}

// ✅ Good: Check return values and provide diagnostics
const result = StartDocW(hDC, docInfo);
if (result <= 0) {
  throw new Error(`Failed to start document. Error: ${GetLastError()}`);
}

// ❌ Bad: Generic errors
throw new Error('Print failed');
```

### Performance Considerations

1. **Memory Management**
   - Clean up resources in `finally` blocks
   - Use reference counting for shared resources
   - Destroy PDFium bitmaps after use

2. **Caching**
   - Cache rendered pages for multiple copies
   - Reuse singleton PDFium instance
   - Clean cache when done

3. **Debug Logging**
   - Use `process.env.DEBUG` flag
   - Log performance metrics
   - Include timing information

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- windows-print-api.test.ts
```

### Writing Tests

1. **Unit Tests**
   ```typescript
   describe('PdfRenderService', () => {
     it('should initialize PDFium library', async () => {
       const service = new PdfRenderService();
       await service.initialize();
       expect(service.isInitialized()).toBe(true);
     });
   });
   ```

2. **Integration Tests**
   - Test real printer operations
   - Test with actual PDF files
   - Verify print job creation

3. **Test Coverage**
   - Aim for >80% coverage
   - Focus on critical paths
   - Test error scenarios

### Manual Testing

```bash
# Test with different quality levels
npm run example:quality

# Test with different paper sizes
npm run example:advanced

# Monitor performance
$env:DEBUG=1; npm run example:simple
```

## Submitting Changes

### Branching Strategy

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/bug-description
   ```

2. **Branch Naming**
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation updates
   - `refactor/` - Code refactoring
   - `perf/` - Performance improvements

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Examples:**
```bash
feat(api): add PaperTray enum for tray selection

fix(rendering): prevent memory leak in bitmap lifecycle

docs(readme): update installation instructions for PDFium

perf(rendering): optimize 300 DPI rendering (44% faster)

refactor(services): extract DevModeConfigService from adapter
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `perf` - Performance
- `test` - Tests
- `chore` - Maintenance

### Pull Request Process

1. **Update Your Branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run Tests**
   ```bash
   npm run build
   npm test
   ```

3. **Create Pull Request**
   - Clear title and description
   - Reference related issues
   - Include screenshots/logs if applicable
   - Update CHANGELOG.md

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Manual testing completed
   - [ ] Performance impact assessed

   ## Checklist
   - [ ] Code follows project style
   - [ ] Comments added for complex logic
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated
   ```

5. **Code Review**
   - Address feedback promptly
   - Be open to suggestions
   - Explain your decisions

## Reporting Issues

### Bug Reports

Include:
- **Environment:** Windows version, Node.js version
- **Steps to Reproduce:** Minimal reproducible example
- **Expected Behavior:** What should happen
- **Actual Behavior:** What actually happens
- **Logs:** Debug logs (`DEBUG=1`)
- **Code Sample:** Minimal code that reproduces issue

### Feature Requests

Include:
- **Use Case:** Why is this needed?
- **Proposed Solution:** How should it work?
- **Alternatives:** Other approaches considered?
- **Examples:** API design mockup

### Questions

- Check existing issues first
- Search documentation
- Provide context and code samples

## Development Tips

### Debugging

1. **Enable Debug Logs**
   ```bash
   $env:DEBUG=1; node your-script.js
   ```

2. **VS Code Launch Configuration**
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Example",
     "program": "${workspaceFolder}/examples/simple-print.ts",
     "env": { "DEBUG": "1" }
   }
   ```

3. **Inspect DEVMODE**
   ```bash
   node examples/test-devmode.ts
   ```

### Common Issues

1. **PDFium Not Found (Development)**
   - Ensure `pdfium.dll` is in `bin/` folder
   - Run `.\install-pdfium.ps1` to download it
   - For end users: DLL is included in the npm package

2. **Blank Pages**
   - Check PDF is valid
   - Verify printer is online
   - Check print queue

3. **Memory Issues**
   - Reduce quality (DPI)
   - Process large PDFs in batches
   - Monitor with `DEBUG=1`

## Release Process

Maintainers only:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. Build: `npm run build`
6. Publish: `npm publish`

## Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Windows GDI Documentation](https://learn.microsoft.com/en-us/windows/win32/gdi/windows-gdi)
- [PDFium Documentation](https://pdfium.googlesource.com/pdfium/)

## Questions?

- Open an issue with the `question` label
- Check existing documentation
- Review examples in `examples/` folder

Thank you for contributing! 🎉
