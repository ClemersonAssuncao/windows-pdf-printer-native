# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
