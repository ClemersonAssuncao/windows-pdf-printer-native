# Test Suite Documentation

This directory contains the comprehensive test suite for **Windows PDF Printer Native**.

> **Note:** This library is **Windows-only**. All tests are designed to run exclusively on Windows.

## Test Structure

```
tests/
├── windows-print-api.test.ts    # Windows API bindings (GDI32, winspool.drv, Koffi)
├── printer-manager.test.ts      # PrinterManager functionality
├── pdf-printer.test.ts          # PDF printing with DEVMODE
└── README.md                    # This file
```

### Test Coverage

| Test File | Tests | Focus |
|-----------|-------|-------|
| `windows-print-api.test.ts` | 25+ | Koffi FFI, GDI32 structures, API functions |
| `printer-manager.test.ts` | 18+ | Printer enumeration, default printer, capabilities |
| `pdf-printer.test.ts` | 30+ | PDF printing, DEVMODE configuration, raw printing |

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

## Test Categories

### 1. Windows API Tests (`windows-print-api.test.ts`)

Tests the Koffi FFI bindings to Windows APIs:

- **Library Loading**: Validates GDI32.dll, winspool.drv, and kernel32.dll
- **GDI32 Functions**: Graphics Device Interface
  - CreateDCW, DeleteDC
  - StartDocW, EndDoc, StartPage, EndPage
  - StretchDIBits, GetDeviceCaps
- **Winspool Functions**: Print Spooler
  - OpenPrinterW, ClosePrinter
  - EnumPrintersW, GetDefaultPrinterW
  - DocumentPropertiesW
- **Structure Definitions**: DOCINFOW, DEVMODEW, BITMAPINFO, PRINTER_INFO_2W
- **Enum Definitions**: PrintQuality, PaperSize, DuplexMode, PageOrientation, ColorMode, PaperTray

### 2. PrinterManager Tests (`printer-manager.test.ts`)

Tests printer management functionality:

- **getAvailablePrinters**: Lists all system printers with properties
- **getDefaultPrinter**: Returns default printer name
- **printerExists**: Validates printer existence (case-insensitive)
- **getPrinterCapabilities**: Queries printer capabilities
  - Duplex support
  - Color support
  - Available paper sizes
- **Edge Cases**: Empty names, special characters, very long names

### 3. PDFPrinter Tests (`pdf-printer.test.ts`)

Tests PDF printing functionality with GDI32 + PDFium:

- **Constructor**: Instance creation with/without printer name
- **print()**: PDF file printing with error handling
- **printRaw()**: Raw buffer printing
- **getCapabilities()**: Printer capability queries
- **getCapabilities()**: Printer capability queries
- **Print Options**: Tests all print options with enums
  - PrintQuality (LOW, MEDIUM, HIGH)
  - PaperSize (95 standard sizes)
  - DuplexMode (SIMPLEX, HORIZONTAL, VERTICAL)
  - PageOrientation (PORTRAIT, LANDSCAPE)
  - ColorMode (MONOCHROME, COLOR)
  - PaperTray selection
  - Multiple copies with collation

**Note**: Actual printing tests are skipped to avoid unwanted printouts during testing.

## Test Configuration

Tests are configured via `jest.config.cjs`:

```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  testTimeout: 10000
}
```

## Coverage

Run coverage report to see detailed coverage information:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI/CD integration
- Terminal output shows summary

## Writing New Tests

When adding new tests:

1. **Platform Check**: Verify Windows before running tests
2. **Skip Actual Printing**: Use `.skip` for tests that would print
3. **Error Handling**: Test both success and failure scenarios
4. **Type Safety**: Include TypeScript type validation tests
5. **Documentation**: Add JSDoc comments for complex test scenarios

### Example Test Structure

```typescript
import * as os from 'os';

const isWindows = os.platform() === 'win32';

if (!isWindows) {
  console.log('⚠️  This library only supports Windows');
  process.exit(1);
}

describe('MyFeature', () => {
  let MyClass: typeof import('../src/my-feature').MyClass;

  beforeAll(async () => {
    if (!isWindows) {
      throw new Error('Tests can only run on Windows');
    }
    const module = await import('../src/my-feature');
    MyClass = module.MyClass;
  });

  describe('Method', () => {
    it('should do something', () => {
      // Test implementation
      expect(true).toBe(true);
    });
  });
});
```

## CI/CD Integration

Tests can be integrated into Windows CI/CD pipelines:

```yaml
# Example GitHub Actions (Windows runner)
jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Tests Timing Out

Increase timeout in `jest.config.cjs`:
```javascript
testTimeout: 30000 // 30 seconds
```

### Module Import Errors

Ensure TypeScript is compiled:
```bash
npm run build
```

### Platform Detection Issues

Verify Windows platform:
```typescript
console.log('Platform:', os.platform()); // Should be 'win32'
```

### PDFium Not Found

The PDFium library is included in the package at `bin/pdfium.dll`. If you're developing/contributing:
```powershell
# For development only - downloads latest PDFium
.\install-pdfium.ps1
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
