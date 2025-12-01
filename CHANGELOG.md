# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-01

### 🚀 Major Changes

**Complete Architecture Overhaul: PDFium + GDI32**
- **BREAKING**: Migrated from WritePrinter (winspool) to pure GDI32 rendering
- Integrated Google PDFium for high-quality PDF rendering
- Now uses GDI32 API directly: CreateDCW, StartDocW, StartPage, StretchDIBits
- Winspool.drv now used ONLY for printer management (EnumPrinters, DocumentProperties)
- Zero dependencies on external tools (no Ghostscript required)

**Performance Improvements**
- 44% faster overall printing (9.8s → 5.5s for 4-page document)
- 72% faster per-page rendering (~1.15s → ~0.32s per page)
- Default 300 DPI rendering (optimized for document printing)
- Configurable quality: LOW (150 DPI), MEDIUM (300 DPI), HIGH (600 DPI), ULTRA (1200 DPI)
- Singleton PDFium instance with reference counting
- Page caching for multiple copies

**Type-Safe Enums (BREAKING)**
- `PrintQuality` enum: LOW, MEDIUM, HIGH, ULTRA (replaces `dpi` parameter)
- `PaperSize` enum: 95 standard paper sizes (A4=9, LETTER=1, LEGAL=5, etc.)
- `DuplexMode` enum: SIMPLEX, HORIZONTAL, VERTICAL (replaces string values)
- `PageOrientation` enum: PORTRAIT, LANDSCAPE (replaces string values)
- `ColorMode` enum: MONOCHROME, COLOR (replaces boolean)
- `PaperTray` enum: AUTO, UPPER, LOWER, MANUAL, etc. (replaces number)
- Old constants deprecated but maintained for backward compatibility

**Clean Architecture Services**
- `PdfRenderService`: Singleton PDF rendering with PDFium lifecycle management
- `DevModeConfigService`: Simplified DEVMODE configuration with direct enum support
- `PrinterConnectionService`: Manages printer handle lifecycle
- Specialized services with single responsibilities

**Windows-Only Focus**
- Removed Unix/Linux/macOS support code
- Package now explicitly targets Windows only (`"os": ["win32"]`)
- Updated documentation to reflect Windows-exclusive nature
- Recommendation to use `unix-print` for other platforms

**PDFium Distribution**
- PDFium library (pdfium.dll) now included in npm package
- No manual download required - ready to use after `npm install`
- Package size: 6.1 MB (includes 5.8 MB PDFium DLL)
- Located at `bin/pdfium.dll` in package

### 🔧 API Changes

**BREAKING: Parameter Changes**
```typescript
// Old (v1.x)
await printer.print(path, {
  dpi: 300,
  duplex: 'vertical',
  orientation: 'portrait',
  color: true,
  paperSource: 1
});

// New (v2.x)
await printer.print(path, {
  quality: PrintQuality.MEDIUM,
  duplex: DuplexMode.VERTICAL,
  orientation: PageOrientation.PORTRAIT,
  color: ColorMode.COLOR,
  paperTray: PaperTray.UPPER
});
```

**New Exports**
```typescript
export { PrintQuality, PaperSize, DuplexMode, PageOrientation, ColorMode, PaperTray }
```

**Deprecated (still functional)**
```typescript
// Old constants (use enums instead)
PAPER_A4, PAPER_LETTER, PAPER_LEGAL, ...
DUPLEX_SIMPLEX, DUPLEX_HORIZONTAL, DUPLEX_VERTICAL
PORTRAIT, LANDSCAPE
MONOCHROME, COLOR
```

### 🏗️ Architecture

**Service Layer**
- `src/adapters/windows/services/pdf-render.service.ts` - PDF rendering with PDFium
- `src/adapters/windows/services/devmode-config.service.ts` - DEVMODE configuration
- `src/adapters/windows/services/printer-connection.service.ts` - Printer lifecycle

**API Organization**
- `src/adapters/windows/api/gdi32.api.ts` - GDI32 functions
- `src/adapters/windows/api/winspool.api.ts` - Winspool functions
- `src/adapters/windows/api/kernel32.api.ts` - Kernel32 functions
- `src/adapters/windows/api/pdfium.api.ts` - PDFium bindings
- `src/adapters/windows/api/index.ts` - Barrel exports

**Type System**
- `src/core/types/index.ts` - All enums and domain types
- Direct enum value assignment in DEVMODE (no conversions)

### 📚 Documentation

- Complete README.md rewrite focusing on Windows + GDI + PDFium
- New CONTRIBUTING.md with architecture guide and best practices
- Updated test documentation (tests/README.md)
- Performance benchmarks and optimization guide
- Migration guide from v1.x to v2.x

### 🧪 Testing

- All tests updated for new enum-based API
- Comprehensive test coverage (65+ tests)
- Windows-only test suite
- Platform detection safety checks

### 📦 Package

- PDFium DLL included in npm package (`bin/**/*` in files)
- Package size: 6.1 MB unpacked
- Zero post-install setup required
- Windows-only: `"os": ["win32"]`

### ⚠️ Breaking Changes

1. **Printing Engine**: winspool WritePrinter → GDI32 + PDFium
2. **Parameter Names**: `dpi` → `quality`, `paperSource` → `paperTray`
3. **Type Safety**: String/number parameters → Type-safe enums
4. **Platform Support**: Cross-platform → Windows-only
5. **Dependencies**: Now includes PDFium DLL (5.8 MB)

### 🔄 Migration Guide

**Install v2.x**
```bash
npm install windows-pdf-printer-native@2
```

**Update Imports**
```typescript
import { 
  PDFPrinter, 
  PrintQuality, 
  PaperSize, 
  DuplexMode, 
  PageOrientation, 
  ColorMode, 
  PaperTray 
} from 'windows-pdf-printer-native';
```

**Update Print Options**
- Replace `dpi: number` with `quality: PrintQuality`
- Replace `duplex: string` with `duplex: DuplexMode`
- Replace `orientation: string` with `orientation: PageOrientation`
- Replace `color: boolean` with `color: ColorMode`
- Replace `paperSource: number` with `paperTray: PaperTray`

---

## [1.0.1] - 2025-11-27

### 🔧 Fixed

**Critical Windows DEVMODE Bug**
- Fixed DEVMODE configuration not being applied to print jobs
- Print settings (copies, duplex, paper size, orientation, color) now correctly applied
- Added `getAndConfigureDevMode()` method that:
  1. Gets printer's default DEVMODE via `DocumentPropertiesW`
  2. Modifies DEVMODE with user-provided options
  3. Validates changes with printer driver
  4. Opens printer with configured DEVMODE via `PRINTER_DEFAULTS`
- Now correctly passes DEVMODE structure when opening printer with `OpenPrinterW`

**Default Printer Detection**
- Fixed `GetDefaultPrinterW` API signature (changed from array to pointer: `'uint16*'`)
- Now correctly returns system default printer name
- Fixed UTF-16 buffer allocation and string decoding
- Resolved "Unexpected uint16_t[256] type" Koffi error

### 🏗️ Architecture

**Clean Architecture Refactoring**
- Restructured codebase following Clean Architecture principles
- Created `core/` layer with platform-agnostic types and interfaces
  - `core/types/` - Domain types (PrintOptions, PrinterInfo, PrinterCapabilities)
  - `core/interfaces/` - Contracts (IPrinter, IPrinterManager)
- Created `adapters/` layer for platform-specific implementations
  - `adapters/windows/api/` - Windows API bindings (graphics-device-interface.api.ts)
  - `adapters/windows/` - Windows printer manager adapter
- Created `services/` layer for utilities
  - `services/platform-detector.service.ts` - Platform detection
- Created `factories/` layer for instance creation
  - `factories/printer.factory.ts` - Factory pattern implementation
- Maintained 100% backward compatibility with existing API

**Code Organization**
- Separated concerns into distinct layers
- Implemented dependency inversion principle
- Applied SOLID principles throughout codebase
- Improved testability with interface-based design

### 📚 Documentation

**New Documentation**
- Added `CLEAN-ARCHITECTURE.md` - Comprehensive architecture guide
- Added `TESTING-DEVMODE.md` - DEVMODE testing and verification guide
- Added `GET-PRINTJOB-VS-DEVMODE.md` - Explains PowerShell limitations
- Updated README.md with new architecture information
- Updated CONTRIBUTING.md with new structure and testing guidelines

**Improved Clarity**
- Added architecture diagrams and explanations
- Documented all layers and their responsibilities
- Added examples for both legacy and new APIs
- Clarified DEVMODE testing methodology

### 🧪 Testing

**New Testing Tools**
- Added `examples/inspect-devmode.ts` - Directly inspect DEVMODE settings from printer
- Added `examples/test-devmode.ts` - Test DEVMODE application with various configurations
- Added `examples/monitor-spooler.ts` - Monitor print spooler and verify jobs
- Comprehensive testing guide for verifying print settings

**Test Improvements**
- All 73+ tests passing
- Coverage includes Windows API, printer management, and cross-platform functionality
- Platform-specific tests skip appropriately on other platforms

### 🎯 API Enhancements

**New Exports**
- Exported `PrinterFactory` for factory pattern usage
- Exported `PlatformDetector` service
- Exported all core types and interfaces
- Exported adapter implementations for advanced usage

**Backward Compatibility**
- All existing code continues to work without changes
- Both legacy and new architecture APIs available
- Gradual migration path for existing users

## [1.0.0] - 2025-11-25

### Added
- **Cross-Platform Support**: Windows, Linux, and macOS compatibility
- **Windows Implementation**: Native printing via winspool.drv and Koffi
  - Direct Windows Print Spooler API integration
  - Synchronous printer queries for immediate results
  - Support for all Windows printer features
- **Unix Implementation**: CUPS-based printing via `lp` command
  - Asynchronous printer operations
  - Standard CUPS feature support
- **Core Features**:
  - Print PDF documents with comprehensive options
  - Duplex printing modes (simplex, horizontal, vertical)
  - Paper size configuration (A4, A3, Letter, Legal, Tabloid, etc.)
  - Paper tray/source selection (Windows only)
  - Multiple copies with collation support
  - Color/monochrome printing modes
  - Page orientation control (portrait/landscape)
  - Print quality settings (Windows only)
- **Printer Management**:
  - List all available system printers
  - Query default printer
  - Get printer capabilities (Windows)
  - Check printer existence
- **Raw Data Printing**: Send PCL, PostScript, or raw data directly
- **TypeScript First**:
  - Full TypeScript implementation
  - Comprehensive type definitions
  - Separate types for Windows and Unix platforms
- **Developer Experience**:
  - Node.js 22+ with native TypeScript support
  - Cross-platform unified API
  - Platform detection and automatic implementation selection
  - Detailed error messages and logging
- **Examples**: Complete example suite for all features
  - Simple printing
  - Duplex printing
  - Advanced options
  - Printer listing
  - Unix-specific examples

### Technical Details
- Windows: Koffi FFI bindings to winspool.drv
- Unix: CUPS command-line interface integration
- Platform detection via `os.platform()`
- Unified API with platform-specific optimizations

## [Unreleased]

### Planned Features
- PDF pre-processing and validation
- Print job status tracking
- Print queue management
- Automated tests
- More comprehensive printer capabilities query on Unix
- Custom paper size support on Unix
