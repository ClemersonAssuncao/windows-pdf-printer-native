# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2025-12-10

### 🐛 Bug Fixes

**Multiple Copies Printing**
- Fixed critical bug where multiple copies would not print correctly
- Implemented intelligent cache disabling for uncollated multi-copy jobs
- Prevents GDI buffer corruption when printing multiple copies without collate
- Cache is automatically disabled for `copies > 1 && collate = false`
- Cache state is restored after print job completion

**Collate Parameter**
- Fixed collate option not being respected in print jobs
- Properly handles collated vs uncollated printing:
  - Collate enabled: Prints complete sets (page1, page2, page3, page1, page2, page3)
  - Collate disabled: Prints all copies of each page (page1, page1, page2, page2, page3, page3)
- Added proper logging for collate mode detection

**Koffi Cache Isolation**
- Fixed global koffi cache causing conflicts between modules
- Each API module now has its own isolated koffi instance
- Prevents function signature collisions across different DLLs
- Improved stability when loading multiple Windows API libraries

### 🔧 Improvements

**Code Quality & Clean Code**
- Removed unnecessary validations across all adapters
- Cleaned up redundant code in Windows adapters
- Improved error handling consistency
- Better separation of concerns in service classes
- Enhanced code readability with better variable naming

**Architecture Simplification**
- Removed `src/factories/printer.factory.ts` (no longer needed)
- Simplified dependency injection pattern
- Direct adapter instantiation for cleaner code flow

### 📚 Documentation

**Updated Documentation**
- Comprehensive update to `CONTRIBUTING.md` with current architecture
- Updated `ARCHITECTURE.md` with intelligent caching strategy
- Added detailed explanation of cache management
- Documented collate behavior and copy handling
- Updated project structure to reflect removed factory
- Added examples for testing print queues
- Improved logging configuration documentation

**Architecture Documentation**
- Documented GDI buffer corruption prevention strategy
- Added workflow diagrams for copy and collate handling
- Performance optimization strategies documented
- Memory management best practices updated

### 🧹 Removed

- Removed `src/factories/printer.factory.ts` (unused factory pattern)
- Removed redundant validation checks that were duplicating error handling

## [2.1.0] - 2025-12-08

### ✨ New Features

**Structured Logging System**
- Added comprehensive `Logger` class with multiple log levels (DEBUG, INFO, WARN, ERROR, SILENT)
- Configurable logging via environment variables:
  - `LOG_LEVEL`: Set specific level (DEBUG, INFO, WARN, ERROR, SILENT)
  - `DEBUG`: Enable debug mode (supports `DEBUG=*`, `DEBUG=1`, `DEBUG=true`)
  - `NODE_ENV`: Auto-configures level (test=SILENT, production=INFO)
- Performance timing utilities with `startTimer()` and `endTimer()`
- Colored terminal output with automatic TTY detection
- Context-based logging for better organization (e.g., `[PdfRender]`, `[DevModeConfig]`)
- Timestamps with millisecond precision
- Child logger support for hierarchical contexts

**Cache Management API**
- Exposed `setCacheEnabled(enabled: boolean)` method in `PDFPrinter` class
- Allows users to control page caching behavior:
  - Keep enabled (default) for multiple copies of same PDF
  - Disable for sequential printing of different PDFs to prevent memory buildup
- Automatic cache cleanup when PDF document is closed

**Enhanced Printer Capabilities**
- New `PrinterCapabilitiesService` for comprehensive printer information
- Added `getPrinterInfo()` method for detailed printer metadata:
  - Current paper size and orientation
  - Available paper sources (trays)
  - Print quality settings
  - Color capabilities
  - Duplex support and modes
  - Printer status and job counts
- Extended `PrinterCapabilities` interface with additional properties

### 🔧 Improvements

**Code Quality**
- Refactored all services to use structured Logger:
  - `PdfRenderService`: Performance metrics, cache operations, error tracking
  - `DevModeConfigService`: DEVMODE configuration steps, printer interactions
  - `WindowsPrinterAdapter`: Print job lifecycle, document processing
- Replaced manual `process.env.DEBUG` checks with logger methods
- Replaced `performance.now()` calculations with logger timers
- Enhanced error messages with contextual information

**Performance Monitoring**
- Detailed timing logs for all major operations:
  - PDFium initialization and module loading
  - PDF document loading and page counting
  - Page rendering and bitmap creation
  - Device context creation
  - Print job stages (StartDoc, StartPage, EndPage, EndDoc)
- Automatic cache hit/miss tracking with timing

**Memory Management**
- Automatic cache cleanup on document close (prevents memory leaks)
- Smart cache key management (page index + dimensions)
- Proper bitmap lifecycle tracking and cleanup

**API Documentation**
- Added comprehensive JSDoc comments for Logger class
- Documented cache management best practices in README
- Added usage examples for `setCacheEnabled()`
- Updated README with Kernel32.dll and Comdlg32.dll descriptions

### 🐛 Bug Fixes

**Cache Memory Leak**
- Fixed cache growing indefinitely when printing multiple different PDFs
- Cache now automatically clears when document is closed
- Added manual control via `setCacheEnabled(false)` for sequential printing

**Thermal Printer Support**
- Fixed document stretching issue on thermal printers
- Improved aspect ratio calculation for non-standard paper sizes
- Better handling of narrow paper formats (e.g., 80mm thermal rolls)
- Proper scaling and centering for thermal receipt printers

**Logging Consistency**
- Removed inconsistent debug log formatting
- Standardized all log messages across services
- Fixed missing context in error messages

### 📚 Documentation

**README Updates**
- Added explanation of Kernel32.dll usage (memory management, error handling)
- Added explanation of Comdlg32.dll usage (native print dialog support)
- Documented cache management strategies with code examples
- Added optimization tips for cache usage
- Updated Core Technology section with all system dependencies

**API Reference**
- Added `setCacheEnabled()` method documentation
- Enhanced `PrinterCapabilities` interface documentation
- Added Logger configuration examples

### 🏗️ Architecture

**New Components**
- `src/core/logger/logger.ts`: Main Logger implementation
- `src/core/logger/types.d.ts`: Global type definitions for Node.js
- `src/core/logger/index.ts`: Logger module exports
- `src/adapters/windows/services/printer-capabilities.service.ts`: Enhanced capabilities service

**Removed Components**
- `src/adapters/windows/services/printer-connection.service.ts`: Functionality merged into other services

### 🔄 Breaking Changes

None - All changes are backward compatible

## [2.0.2] - 2025-12-03

### 🔧 Fixed

**DEVMODE Configuration - Critical Print Settings Fix**
- Fixed `DocumentPropertiesW` workflow to properly apply print settings
- Implemented correct 3-step DEVMODE configuration process:
  1. Get DEVMODE size from printer driver
  2. Retrieve current printer DEVMODE configuration
  3. Apply modifications and validate with driver using `DM_IN_BUFFER | DM_OUT_BUFFER`
- Fixed duplex mode configuration not being applied (SIMPLEX, HORIZONTAL, VERTICAL)
- Fixed paper tray/source selection not being respected by printer driver
- Added driver validation step that ensures settings are compatible with printer
- Added automatic re-application of settings if driver modifies them during validation

**Debug and Diagnostics**
- Enhanced debug logging for DEVMODE configuration process
- Added before/after validation comparison for `dmDefaultSource`
- Added warning when driver changes requested settings
- Added detailed field-by-field debug output for troubleshooting
- Created `examples/test-paper-trays.ts` for discovering printer-specific tray codes
- Created `examples/test-duplex.ts` for testing duplex configurations

**HP Printer Compatibility**
- Documented that HP printers use custom tray codes (256-260+) instead of Windows standard codes
- Added support for printer-specific paper tray values
- HP Universal Printing PCL 6 tested values:
  - 256 = Tray 1
  - 257 = Tray 2
  - 258 = Tray 3
  - 259 = Tray 4 (Manual Feed)
  - 260 = Tray 5

**Developer Experience**
- Added npm scripts: `npm run example:trays` and `npm run example:duplex`
- Improved error messages for DEVMODE configuration failures
- Added validation warnings when driver doesn't support requested settings

### 📚 Documentation

**New Examples**
- `examples/test-paper-trays.ts` - Automated discovery of available paper trays
- `examples/test-duplex.ts` - Test different duplex printing modes
- Added detailed comments explaining HP printer tray codes

**Improved Documentation**
- Updated PaperTray enum documentation with HP-specific values
- Added troubleshooting section for print settings not being applied
- Documented the correct DocumentPropertiesW workflow

### 🏗️ Technical Changes

**DevModeConfigService Improvements**
- Refactored `getDevModeWithSettings()` method with proper error handling
- Moved paper tray configuration before other settings (some drivers require specific order)
- Added driver validation check and automatic re-application logic
- Improved null safety and fallback to printer defaults
- Better separation of concerns in DEVMODE configuration steps

### ⚠️ Breaking Changes

None - This is a bug fix release that maintains full API compatibility.

### 🔄 Migration Notes

No code changes required. If you were experiencing issues with duplex or paper tray settings not being applied, this release fixes those problems automatically.

For HP printers, you may need to use custom tray codes (256-260) instead of standard Windows codes (1-15). Use the new `test-paper-trays.ts` example to discover your printer's tray codes.

---

## [2.0.1] - 2025-12-01

### 🔧 Fixed

**Documentation and Dependencies**
- Fixed package-lock.json with outdated dependencies
- Corrected all references from `node-pdf-printer` to `windows-pdf-printer-native` in README
- Updated examples to use type-safe enums instead of deprecated constants
- Fixed imports: `listPrinters()` → `PrinterManager.getAvailablePrinters()`
- Updated GitHub repository URLs in documentation
- Removed placeholder email from support section

---

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
