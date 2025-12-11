# Documentation Index

Welcome to the Windows PDF Printer Native documentation! This page provides an overview of all available documentation resources.

## Quick Links

- 📦 [Main README](../README.md) - Getting started guide and API reference
- 🏗️ [Architecture Guide](./ARCHITECTURE.md) - Technical details and internal design
- ⚡ [Performance Guide](./PERFORMANCE.md) - Optimization strategies and benchmarks
- 🔧 [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions

## Documentation Overview

### For Users

If you're using this library in your project, start here:

1. **[Main README](../README.md)** - Start here!
   - Installation instructions
   - Quick start guide
   - API reference with examples
   - Basic usage patterns

2. **[Performance Guide](./PERFORMANCE.md)**
   - Benchmark results
   - Quality vs speed trade-offs
   - Memory management
   - Optimization strategies
   - Real-world scenarios

3. **[Troubleshooting Guide](./TROUBLESHOOTING.md)**
   - Common issues and solutions
   - Platform-specific notes
   - Debug mode instructions
   - Diagnostic tools

### For Contributors

If you're contributing to this library, read these:

1. **[CONTRIBUTING.md](../CONTRIBUTING.md)**
   - Development setup
   - Code style guidelines
   - Testing requirements
   - Pull request process

2. **[Architecture Guide](./ARCHITECTURE.md)**
   - System architecture overview
   - Windows API integration details
   - DEVMODE structure explanation
   - Design patterns used
   - Service layer documentation
   - Future enhancement plans

## Quick Reference

### Installation
```bash
npm install windows-pdf-printer-native
```

### Basic Usage
```typescript
import { PDFPrinter } from 'windows-pdf-printer-native';

const printer = new PDFPrinter();
await printer.print('./document.pdf');
```

### With Configuration
```typescript
import { PDFPrinter, PrintQuality, PaperSize } from 'windows-pdf-printer-native';

const printer = new PDFPrinter('HP LaserJet Pro');
await printer.print('./document.pdf', {
  quality: PrintQuality.HIGH,
  paperSize: PaperSize.A4,
  copies: 2
});
```

## Examples

The [`examples/`](../examples) directory contains complete working examples:

- `simple-print.ts` - Basic printing
- `advanced-print.ts` - Full configuration options
- `list-printers.ts` - Enumerate system printers
- `print-with-dialog.ts` - Interactive Windows dialog
- `test-performance.ts` - Performance benchmarking

## API Documentation

### Main Classes

- **PDFPrinter** - Main class for printing PDF documents
  - `print(path, options)` - Print from file path
  - `printRaw(buffer, name, options)` - Print from buffer
  - `getPrinterName()` - Get current printer name
  - `setCacheEnabled(enabled)` - Control page caching

- **PrinterManager** - Static class for printer management
  - `getAvailablePrinters()` - List all printers
  - `getDefaultPrinter()` - Get default printer name
  - `printerExists(name)` - Check if printer exists

### Enums

- **PrintQuality** - LOW (150), MEDIUM (300), HIGH (600)
- **PaperSize** - 95 standard paper sizes
- **DuplexMode** - SIMPLEX, HORIZONTAL, VERTICAL
- **PageOrientation** - PORTRAIT, LANDSCAPE
- **ColorMode** - MONOCHROME, COLOR
- **PaperTray** - AUTO, UPPER, LOWER, MANUAL, etc.

See [Main README](../README.md#api-reference) for complete API documentation.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/ClemersonAssuncao/windows-pdf-printer-native/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/ClemersonAssuncao/windows-pdf-printer-native/discussions)
- 📦 **npm Package**: [windows-pdf-printer-native](https://www.npmjs.com/package/windows-pdf-printer-native)

## Version History

See [CHANGELOG.md](../CHANGELOG.md) for version history and release notes.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

[Back to Main README](../README.md)
