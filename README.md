# Windows PDF Printer Native

A **high-performance**, **native Windows PDF printing library** for Node.js using **GDI32** and **PDFium**. Built with **Clean Architecture** principles for professional PDF printing applications.

**Key Highlights:**
- 🚀 **Pure GDI Rendering** - Direct GDI32 API integration for native Windows printing
- 📄 **PDFium Integration** - High-quality PDF rendering using Google's PDFium library
- ⚡ **Optimized Performance** - 44% faster than legacy approaches (300 DPI default, customizable)
- 🎯 **Type-Safe Enums** - PrintQuality, PaperSize, DuplexMode, PageOrientation, ColorMode, PaperTray
- 🏗️ **Clean Architecture** - SOLID principles, dependency injection, service-based design
- 📦 **TypeScript First** - Full type safety with comprehensive interfaces and enums
- 🔧 **Zero Dependencies** - Pure Windows API, no Ghostscript or external tools required
- 🎨 **Full Control** - Quality, paper size, duplex, orientation, color, tray selection

[![npm version](https://img.shields.io/npm/v/windows-pdf-printer-native.svg)](https://www.npmjs.com/package/windows-pdf-printer-native)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Performance](#performance)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Features

### 🚀 Core Technology
- **GDI32 API** - Native Windows Graphics Device Interface for direct printer control
- **PDFium** - Google's PDF rendering engine for high-quality bitmap generation
- **Koffi FFI** - Zero-overhead C library bindings for Node.js
- **Windows Only** - Optimized exclusively for Windows printing (7, 10, 11, Server)

### 🎯 Type-Safe Enums
- **PrintQuality** - `LOW` (150 DPI), `MEDIUM` (300 DPI), `HIGH` (600 DPI)
- **PaperSize** - 95 standard sizes (A4, Letter, Legal, A3, envelopes, etc.)
- **DuplexMode** - `SIMPLEX`, `HORIZONTAL`, `VERTICAL`
- **PageOrientation** - `PORTRAIT`, `LANDSCAPE`
- **ColorMode** - `MONOCHROME`, `COLOR`
- **PaperTray** - `AUTO`, `UPPER`, `LOWER`, `MANUAL`, etc.

### 🖨️ Printing Capabilities
- **High Performance** - 44% faster than legacy methods (5.5s vs 9.8s for 4 pages)
- **Quality Control** - Customizable DPI from 150 to 1200
- **Full Configuration** - Paper size, tray, duplex, orientation, color, copies
- **Memory Efficient** - Smart bitmap lifecycle management
- **Debug Logging** - Detailed performance metrics via `DEBUG` environment variable

### 📊 Printer Management
- **List Printers** - Enumerate all system printers with capabilities
- **Default Printer** - Automatic detection and usage
- **Capabilities Query** - Check duplex/color support, available paper sizes
- **DEVMODE Configuration** - Direct Windows printer settings control

## Architecture

This library follows **Clean Architecture** principles:

```
src/
├── core/
│   ├── types/         # Domain types, enums (PrintQuality, PaperSize, etc.)
│   └── interfaces/    # IPrinter, IPrinterManager contracts
├── adapters/
│   └── windows/
│       ├── api/       # Windows API bindings (gdi32, winspool, pdfium)
│       ├── services/  # PdfRenderService, DevModeConfigService
│       └── *.adapter.ts  # Platform implementations
└── factories/         # PrinterFactory for dependency injection
```

**Key Design Patterns:**
- **Dependency Injection** - Services injected into adapters
- **Factory Pattern** - Platform-specific instance creation
- **Service Layer** - Specialized services (PDF rendering, DEVMODE config)
- **Adapter Pattern** - Windows-specific implementations

## Requirements

## Requirements

- **Node.js 18.0.0 or higher**
- **Windows 7 or later** (Windows 10/11 recommended)
- **PDFium library** - ✅ **Included in the package** (`bin/pdfium.dll`)

## Installation

```bash
npm install windows-pdf-printer-native
```

> **Note:** The PDFium library (`pdfium.dll`) is automatically included in the npm package. No additional setup required!

## Quick Start

### Basic Usage

```typescript
import { PDFPrinter, PrinterManager } from 'windows-pdf-printer-native';

// List available printers
const printers = await PrinterManager.getAvailablePrinters();
console.log('Available printers:', printers);

// Get default printer
const defaultPrinter = await PrinterManager.getDefaultPrinter();
console.log('Default printer:', defaultPrinter);

// Create printer instance (uses default printer)
const printer = new PDFPrinter();

// Print with default settings (300 DPI, A4)
await printer.print('./document.pdf');

// Print to specific printer
const printer = new PDFPrinter('HP LaserJet Pro');
await printer.print('./invoice.pdf');
```

### Advanced Usage with Type-Safe Enums

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

const printer = new PDFPrinter();

await printer.print('./document.pdf', {
  copies: 2,
  quality: PrintQuality.HIGH,           // 600 DPI
  paperSize: PaperSize.A4,              // 210 x 297 mm
  duplex: DuplexMode.VERTICAL,          // Long-edge binding
  orientation: PageOrientation.LANDSCAPE, // Horizontal
  color: ColorMode.COLOR,               // Color printing
  paperTray: PaperTray.AUTO             // Auto-select tray
});
```

### Quality Settings

```typescript
import { PrintQuality } from 'windows-pdf-printer-native';

// Draft quality - fast, smaller files
await printer.print('./draft.pdf', { 
  quality: PrintQuality.LOW  // 150 DPI
});

// Standard quality - recommended
await printer.print('./document.pdf', { 
  quality: PrintQuality.MEDIUM  // 300 DPI (default)
});

// High quality - for images/photos
await printer.print('./photo.pdf', { 
  quality: PrintQuality.HIGH  // 600 DPI
});
```

## API Reference

### Classes

#### `PDFPrinter`

Main class for printing PDF documents.

## API Reference

### Enums

#### `PrintQuality`
```typescript
enum PrintQuality {
  LOW = 150,      // Draft quality - fast, smaller files
  MEDIUM = 300,   // Standard quality - recommended
  HIGH = 600      // High quality - best for images
}
```

#### `PaperSize`
```typescript
enum PaperSize {
  LETTER = 1,     // 8.5 x 11 inches
  LEGAL = 5,      // 8.5 x 14 inches
  A3 = 8,         // 297 x 420 mm
  A4 = 9,         // 210 x 297 mm
  A5 = 11,        // 148 x 210 mm
  TABLOID = 3,    // 11 x 17 inches
  // ... 95 total paper sizes
}
```

#### `DuplexMode`
```typescript
enum DuplexMode {
  SIMPLEX = 1,      // Single-sided
  HORIZONTAL = 2,   // Short-edge binding
  VERTICAL = 3      // Long-edge binding
}
```

#### `PageOrientation`
```typescript
enum PageOrientation {
  PORTRAIT = 1,     // Vertical
  LANDSCAPE = 2     // Horizontal
}
```

#### `ColorMode`
```typescript
enum ColorMode {
  MONOCHROME = 1,   // Black and white
  COLOR = 2         // Color printing
}
```

#### `PaperTray`
```typescript
enum PaperTray {
  AUTO = 7,         // Automatic selection
  UPPER = 1,        // Upper tray
  LOWER = 2,        // Lower tray
  MIDDLE = 3,       // Middle tray
  MANUAL = 4,       // Manual feed
  ENVELOPE = 5,     // Envelope feeder
  // ... more tray options
}
```

### Classes

#### `PDFPrinter`

**Constructor:**
```typescript
new PDFPrinter(printerName?: string)
```

**Methods:**

**`print(pdfPath: string, options?: PrintOptions): Promise<void>`**
```typescript
await printer.print('./document.pdf', {
  copies: 2,
  quality: PrintQuality.HIGH,
  paperSize: PaperSize.A4,
  duplex: DuplexMode.VERTICAL,
  orientation: PageOrientation.PORTRAIT,
  color: ColorMode.COLOR,
  paperTray: PaperTray.AUTO
});
```

**`printRaw(data: Buffer, documentName?: string, options?: PrintOptions): Promise<void>`**
```typescript
const pdfBuffer = fs.readFileSync('./doc.pdf');
await printer.printRaw(pdfBuffer, 'Document', options);
```

**`getPrinterName(): string`**
```typescript
const name = printer.getPrinterName();
```

**`getCapabilities(): PrinterCapabilities | null`**
```typescript
const caps = printer.getCapabilities();
console.log(caps.supportsDuplex, caps.supportsColor);
```

#### `PrinterManager`

**Static Methods:**

**`getAvailablePrinters(): Promise<PrinterInfo[]>`**
```typescript
const printers = await PrinterManager.getAvailablePrinters();
printers.forEach(p => console.log(p.name, p.driverName));
```

**`getDefaultPrinter(): Promise<string | null>`**
```typescript
const defaultPrinter = await PrinterManager.getDefaultPrinter();
```

**`printerExists(printerName: string): Promise<boolean>`**
```typescript
const exists = await PrinterManager.printerExists('HP LaserJet');
```

**`getPrinterCapabilities(printerName: string): PrinterCapabilities | null`**
```typescript
const caps = PrinterManager.getPrinterCapabilities('MyPrinter');
```

### Interfaces

#### `PrintOptions`

```typescript
interface PrintOptions {
  copies?: number;                      // Number of copies (1-9999)
  quality?: PrintQuality | number;      // Render quality in DPI
  paperSize?: PaperSize | number;       // Paper size
  duplex?: DuplexMode;                  // Duplex mode
  orientation?: PageOrientation;        // Page orientation
  color?: ColorMode;                    // Color mode
  paperTray?: PaperTray | number;       // Paper tray/source
  collate?: boolean;                    // Collate copies
}
```

#### `PrinterInfo`

```typescript
interface PrinterInfo {
  name: string;
  serverName?: string;
  portName?: string;
  driverName?: string;
  location?: string;
  comment?: string;
  status: number;
  isDefault?: boolean;
}
```

#### `PrinterInfo`

```typescript
interface PrinterInfo {
  name: string;
  serverName?: string;
  portName?: string;
  driverName?: string;
  location?: string;
  comment?: string;
  status: number;
  isDefault?: boolean;
}
```

#### `PrinterCapabilities`

```typescript
interface PrinterCapabilities {
  supportsDuplex: boolean;
  supportsColor: boolean;
  defaultPaperSize: PaperSize | number;
  availablePaperSizes: (PaperSize | number)[];
  availablePaperSources: number[];
}
```

## Performance

### Benchmark Results

**Test:** 4-page PDF document on Windows 10

| Quality | DPI | Total Time | Per Page | File Size |
|---------|-----|------------|----------|-----------|
| **LOW** | 150 | ~3.2s | ~0.8s | Small |
| **MEDIUM** (default) | 300 | ~5.5s | ~1.4s | Medium |
| **HIGH** | 600 | ~18.5s | ~4.6s | Large |

**Performance Improvements:**
- ✅ **44% faster** than legacy WritePrinter approach
- ✅ **72% faster per-page** rendering (300 DPI vs 706 DPI)
- ✅ Smart bitmap lifecycle management prevents memory leaks
- ✅ Page caching for multiple copies (render once, print many)

### Debug Logging

Enable detailed performance metrics:

```bash
# Windows (CMD)
set DEBUG=1 && node your-script.js

# Windows (PowerShell)
$env:DEBUG=1; node your-script.js

# Output example:
[DEBUG] PDF service initialized in 125.43ms
[DEBUG] PDF document loaded in 8.21ms
[DEBUG] Render size: 2480x3508 at 300 DPI
[DEBUG] Page 1/4 printed in 1387.52ms
[DEBUG] printWithRawData() TOTAL TIME: 5515.33ms
```

### Optimization Tips

1. **Use MEDIUM quality (300 DPI)** for documents - perfect balance
2. **Use LOW quality (150 DPI)** for drafts - 2x faster
3. **Use HIGH quality (600 DPI)** only for images/photos
4. **Enable page caching** for multiple copies (automatic)
5. **Batch printing** - reuse printer instance for multiple jobs

## Examples

### Simple Print

```typescript
import { PDFPrinter } from 'windows-pdf-printer-native';

const printer = new PDFPrinter();
await printer.print('./document.pdf');
```

### Print with Quality Control

```typescript
import { PDFPrinter, PrintQuality } from 'windows-pdf-printer-native';

const printer = new PDFPrinter();

// Fast draft printing
await printer.print('./draft.pdf', { 
  quality: PrintQuality.LOW 
});

// High-quality photo printing
await printer.print('./photo.pdf', { 
  quality: PrintQuality.HIGH 
});
```

### Duplex Printing

```typescript
import { PDFPrinter, DuplexMode, PaperSize } from 'windows-pdf-printer-native';

const printer = new PDFPrinter();

// Vertical duplex (flip on long edge)
await printer.print('./document.pdf', {
  duplex: 'vertical',
  paperSize: PAPER_A4
});
```

### Print to Specific Printer

```typescript
import { PDFPrinter } from 'node-pdf-printer';

const printer = new PDFPrinter('HP LaserJet Pro');
await printer.print('./document.pdf', {
  copies: 5,
  collate: true
});
```

### Advanced Configuration

```typescript
import { PDFPrinter, PAPER_A4, PRINT_QUALITY_HIGH } from 'node-pdf-printer';

const printer = new PDFPrinter();

await printer.print('./document.pdf', {
  copies: 3,
  duplex: 'vertical',
  paperSize: PAPER_A4,
  paperSource: 2,        // Lower tray
  orientation: 'portrait',
  color: true,
  quality: PRINT_QUALITY_HIGH,
  collate: true
});
```

### List All Printers

```typescript
import { listPrinters, PrinterManager } from 'node-pdf-printer';

const printers = listPrinters();

printers.forEach(printer => {
  console.log(`${printer.name}${printer.isDefault ? ' (DEFAULT)' : ''}`);
  
  const capabilities = PrinterManager.getPrinterCapabilities(printer.name);
  if (capabilities) {
    console.log(`  Duplex: ${capabilities.supportsDuplex}`);
    console.log(`  Color: ${capabilities.supportsColor}`);
  }
});
```

## Running Examples

```bash
# List all printers
node --experimental-strip-types examples/list-printers.ts

# Simple print
node --experimental-strip-types examples/simple-print.ts

# Duplex printing
node --experimental-strip-types examples/duplex-print.ts

# Advanced printing
node --experimental-strip-types examples/advanced-print.ts
```

Or use npm scripts:

```bash
npm run example:simple
npm run example:duplex
npm run example:advanced

# Test DEVMODE configuration
npm run example:test-devmode
npm run example:monitor
```

## Testing DEVMODE Configuration

To verify that print options (copies, duplex, paper size, etc.) are being applied correctly, see the comprehensive guide: **[TESTING-DEVMODE.md](TESTING-DEVMODE.md)**

Quick test:
```bash
# Test simple print 
npm run example:simple

# Test advanced print
npm run example:advanced

# Monitor print spooler with detailed instructions
npm run example:monitor
```

## Troubleshooting

### Common Issues

#### "Printer not found" error

Make sure the printer name is correct. Use `listPrinters()` to see all available printers:

```typescript
import { listPrinters } from 'windows-pdf-printer-native';
const printers = await listPrinters();
console.log(printers);
```

#### "Failed to start print job" error (Windows)

- Verify the printer is online and not paused
- Check you have sufficient permissions to print
- Ensure the printer driver is properly installed
- Try printing a test page from Windows Settings to confirm functionality
- Check Windows Event Viewer for detailed error messages

#### Duplex not working

Not all printers support duplex printing. Check capabilities:

```typescript
const printer = new PDFPrinter();
const capabilities = await printer.getCapabilities();
console.log('Duplex supported:', capabilities?.supportsDuplex);
```

#### PDF not rendering correctly

This library renders PDF to bitmap using PDFium and sends it via GDI:

- Ensure your printer is online and has the correct driver installed
- Verify the PDF file is valid and not corrupted
- For complex PDFs with advanced features, consider pre-processing
- Test with a simple single-page PDF first

### Platform-Specific Notes

#### Windows
- Requires the printer to be installed and configured in Windows
- Driver-specific features may vary between printer models
- Some printers may require specific data formats (RAW vs. PostScript)

## Platform Support

**This library supports Windows only.**

For Unix/Linux/macOS printing, we recommend using [unix-print](https://www.npmjs.com/package/unix-print).

### Windows Requirements
- **Windows 7 or later** (Windows 10/11 recommended)
- **GDI32.dll** (included with Windows)
- **Winspool.drv** (included with Windows)
- **PDFium library** (pdfium.dll)

### How It Works

This library uses a pure GDI approach with PDFium for PDF rendering:

1. **PDFium Rendering**
   - `FPDF_InitLibrary` - Initialize PDFium
   - `FPDF_LoadMemDocument` - Load PDF from memory
   - `FPDF_RenderPageBitmap` - Render page to bitmap (150-1200 DPI)
   - `FPDFBitmap_Destroy` - Clean up bitmap resources

2. **GDI Printing**
   - `CreateDCW` - Create Device Context with DEVMODE settings
   - `StartDocW` - Start print job
   - `StartPage` - Begin new page
   - `StretchDIBits` - Transfer bitmap to printer with scaling
   - `EndPage` - Finish page
   - `EndDoc` - Complete print job
   - `DeleteDC` - Release Device Context

3. **Configuration**
   - DEVMODE structure controls all printer settings
   - `DocumentPropertiesW` retrieves printer capabilities
   - Direct API calls, no intermediate files or processes

### Features
- ✅ **Printer Discovery** - List all system printers
- ✅ **Default Printer** - Automatic detection
- ✅ **Duplex Printing** - Simplex, horizontal, vertical
- ✅ **Paper Size** - 95 standard sizes via PaperSize enum
- ✅ **Paper Tray** - Upper, lower, manual feed, auto-select
- ✅ **Print Quality** - 150-1200 DPI via PrintQuality enum
- ✅ **Color Mode** - Color or monochrome
- ✅ **Orientation** - Portrait or landscape
- ✅ **Multiple Copies** - With collation support
- ✅ **Printer Capabilities** - Query duplex/color support

## Testing

This library includes a comprehensive test suite covering all major functionality:

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

### Test Coverage

The test suite includes:

- **Windows API Tests**: Validates Koffi bindings, structures, and constants
- **GDI32 Tests**: Tests GDI printing functions
- **PDFium Tests**: Tests PDF rendering with different DPI settings
- **PrinterManager Tests**: Tests printer discovery, default printer, and capabilities
- **PDFPrinter Tests**: Tests printing functionality with various options
- **DEVMODE Tests**: Tests printer configuration and settings

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:
- Development setup
- Code style guidelines
- Testing requirements
- Submitting pull requests

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes in each version.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 **Documentation**: Full API reference available in this README
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/node-pdf-printer/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/node-pdf-printer/discussions)
- 📧 **Email**: your.email@example.com

## Acknowledgments

- Built with [Koffi](https://github.com/Koromix/koffi) for native Windows API integration
- Inspired by the Node.js printing community

## Related Projects

- [unix-print](https://www.npmjs.com/package/unix-print) - For Unix/Linux/macOS printing
- [PDFium](https://pdfium.googlesource.com/pdfium/) - Google's PDF rendering library

---

Created with ❤️ for the Node.js community