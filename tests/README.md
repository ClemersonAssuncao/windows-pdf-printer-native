# Test Suite Documentation

This directory contains the comprehensive test suite for **Windows PDF Printer Native**.

> **Note:** This library is **Windows-only**. All tests are designed to run exclusively on Windows.

## Running Tests

### All Tests
```bash
npm test
```

**Output:**
- ✅ Runs: windows-print-api.test.ts (25 tests)
- ✅ Runs: printer-manager.test.ts (18 tests)
- ✅ Runs: pdf-printer.test.ts (30 tests)

### Watch Mode (auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Verbose Output
```bash
npm run test:verbose
```

## Safety Mechanisms

### Platform Detection

Each test checks the platform before running to prevent accidental execution on non-Windows systems:

```typescript
const isWindows = os.platform() === 'win32';

if (!isWindows) {
  console.log('⚠️  This library only supports Windows');
  process.exit(1);
}

describe('Windows Printing Tests', () => {
  // Tests only run on Windows
});
```

### Safety Check in beforeAll

Each test has a safety check before importing Windows modules:

```typescript
beforeAll(async () => {
  if (!isWindows) {
    throw new Error('Tests can only run on Windows');
  }
  // Safe to import Windows modules
  winApi = await import('../src/adapters/windows/api');
});
```

### Dynamic Imports

Tests use dynamic imports to avoid loading Windows modules on incompatible systems:

```typescript
// ✅ Good: Dynamic import (only loaded when needed)
const winApi = await import('../src/adapters/windows/api');

// ❌ Bad: Static import (would fail on non-Windows systems)
import * as winApi from '../src/adapters/windows/api';
```

## Test Maintenance

- Update tests when adding new features
- Keep test fixtures minimal and focused
- Mock external dependencies when possible
- Document expected behavior in test names
- Run full test suite before committing changes

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Windows GDI Documentation](https://learn.microsoft.com/en-us/windows/win32/gdi/windows-gdi)
- [PDFium Documentation](https://pdfium.googlesource.com/pdfium/)
