# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  - `adapters/windows/api/` - Windows API bindings (winspool.api.ts)
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
