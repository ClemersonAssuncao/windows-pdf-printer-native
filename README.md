# Windows PDF Printer Native

A high-performance PDF printing library for Node.js on Windows. Print PDFs directly to Windows printers using native GDI32 API and Google's PDFium rendering engine.

[![npm version](https://img.shields.io/npm/v/windows-pdf-printer-native.svg)](https://www.npmjs.com/package/windows-pdf-printer-native)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Performance](#performance)
- [More Examples](#more-examples)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🖨️ **Windows Native** - Direct integration with Windows printing system (GDI32 + PDFium)
- ⚡ **High Performance** - 44% faster than legacy approaches
- 📄 **Quality Control** - Print at 150, 300, or 600 DPI
- 🎯 **Full Configuration** - Paper size, duplex, orientation, color mode, paper tray
- 📦 **TypeScript Support** - Full type definitions included
- 🔧 **No Setup Required** - PDFium library included in the package

## Requirements

- **Node.js** 22.0.0 or higher
- **Windows** 7 or later (Windows 10/11 recommended)

## Installation

```bash
npm install windows-pdf-printer-native
```

> **Note:** All required dependencies (including PDFium) are included. No additional setup needed!



## Quick Start

```typescript
import { PDFPrinter } from 'windows-pdf-printer-native';

// Print to default printer
const printer = new PDFPrinter();
await printer.print('./document.pdf');

// Print to specific printer
const printer = new PDFPrinter('HP LaserJet Pro');
await printer.print('./invoice.pdf');
```

## Usage Examples

### Basic Printing

```typescript
import { PDFPrinter, PrinterManager } from 'windows-pdf-printer-native';

// List available printers
const printers = await PrinterManager.getAvailablePrinters();
printers.forEach(p => console.log(p.name));

// Get default printer
const defaultPrinter = await PrinterManager.getDefaultPrinter();

// Print with default settings (300 DPI)
const printer = new PDFPrinter();
await printer.print('./document.pdf');
```

### Advanced Configuration

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
  quality: PrintQuality.HIGH,              // 600 DPI
  paperSize: PaperSize.A4,                 // 210 x 297 mm
  duplex: DuplexMode.VERTICAL,             // Long-edge binding
  orientation: PageOrientation.LANDSCAPE,  // Horizontal
  color: ColorMode.COLOR,                  // Color printing
  paperTray: PaperTray.AUTO                // Auto-select tray
});
```

### Print Quality Options

```typescript
import { PrintQuality } from 'windows-pdf-printer-native';

// Low quality - fast (150 DPI)
await printer.print('./draft.pdf', { 
  quality: PrintQuality.LOW
});

// Medium quality - default (300 DPI)
await printer.print('./document.pdf', { 
  quality: PrintQuality.MEDIUM
});

// High quality - best for images (600 DPI)
await printer.print('./photo.pdf', { 
  quality: PrintQuality.HIGH
});
```

### Interactive Print Dialog

```typescript
// Show Windows print dialog
await printer.print('./document.pdf', {
  showPrintDialog: true
});

// Pre-populate dialog settings
await printer.print('./document.pdf', {
  showPrintDialog: true,
  copies: 2,
  duplex: DuplexMode.VERTICAL,
  paperSize: PaperSize.A4
});
```

## API Reference

### Classes

#### `PDFPrinter`

Main class for printing PDF documents.

## API Reference

### PDFPrinter

Main class for printing PDF documents.

#### Constructor
```typescript
new PDFPrinter(printerName?: string)
```

**Parameters:**
- `printerName` (optional): Name of the printer. If not provided, uses the system default printer.

#### Methods

##### `print(pdfPath: string, options?: PrintOptions): Promise<void>`

Print a PDF file.

```typescript
await printer.print('./document.pdf', {
  copies: 2,
  quality: PrintQuality.HIGH,
  paperSize: PaperSize.A4,
  duplex: DuplexMode.VERTICAL
});
```

**Parameters:**
- `pdfPath`: Absolute or relative path to the PDF file
- `options`: Print configuration options (see PrintOptions below)

##### `printRaw(data: Buffer, documentName?: string, options?: PrintOptions): Promise<void>`

Print from a PDF buffer.

```typescript
const pdfBuffer = fs.readFileSync('./doc.pdf');
await printer.printRaw(pdfBuffer, 'MyDocument', options);
```

**Parameters:**
- `data`: PDF file as Buffer
- `documentName` (optional): Name for the print job
- `options`: Print configuration options

##### `getPrinterName(): string`

Get the name of the printer being used.

```typescript
const name = printer.getPrinterName();
console.log('Using printer:', name);
```

##### `setCacheEnabled(enabled: boolean): void`

Enable or disable page caching. Caching improves performance when printing multiple copies but uses more memory.

```typescript
// Disable cache for batch processing
printer.setCacheEnabled(false);
```

### PrinterManager

Static class for managing printers.

#### Methods

##### `getAvailablePrinters(): Promise<PrinterInfo[]>`

List all available printers.

```typescript
const printers = await PrinterManager.getAvailablePrinters();
printers.forEach(p => console.log(p.name));
```

##### `getDefaultPrinter(): Promise<string | null>`

Get the default printer name.

```typescript
const defaultPrinter = await PrinterManager.getDefaultPrinter();
```

##### `printerExists(printerName: string): Promise<boolean>`

Check if a printer exists.

```typescript
const exists = await PrinterManager.printerExists('HP LaserJet');
```

### PrintOptions

Configuration options for printing.

```typescript
interface PrintOptions {
  copies?: number;                 // Number of copies (default: 1)
  quality?: PrintQuality;          // Print quality (default: MEDIUM)
  paperSize?: PaperSize;           // Paper size (default: printer default)
  duplex?: DuplexMode;             // Duplex mode (default: SIMPLEX)
  orientation?: PageOrientation;   // Page orientation (default: PORTRAIT)
  color?: ColorMode;               // Color mode (default: COLOR)
  paperTray?: PaperTray;           // Paper tray (default: AUTO)
  collate?: boolean;               // Collate copies (default: false)
  showPrintDialog?: boolean;       // Show print dialog (default: false)
}
```

### Enums

#### PrintQuality
```typescript
enum PrintQuality {
  LOW = 150,      // Fast, lower quality
  MEDIUM = 300,   // Balanced (default)
  HIGH = 600      // Best quality, slower
}
```

#### PaperSize
```typescript
enum PaperSize {
  LETTER = 1,     // 8.5 x 11 inches
  LEGAL = 5,      // 8.5 x 14 inches
  A3 = 8,         // 297 x 420 mm
  A4 = 9,         // 210 x 297 mm
  A5 = 11,        // 148 x 210 mm
  TABLOID = 3,    // 11 x 17 inches
  // ... 95 total sizes available
}
```

#### DuplexMode
```typescript
enum DuplexMode {
  SIMPLEX = 1,      // Single-sided
  HORIZONTAL = 2,   // Flip on short edge
  VERTICAL = 3      // Flip on long edge
}
```

#### PageOrientation
```typescript
enum PageOrientation {
  PORTRAIT = 1,     // Vertical
  LANDSCAPE = 2     // Horizontal
}
```

#### ColorMode
```typescript
enum ColorMode {
  MONOCHROME = 1,   // Black and white
  COLOR = 2         // Color
}
```

#### PaperTray
```typescript
enum PaperTray {
  AUTO = 7,         // Automatic selection
  UPPER = 1,        // Upper tray
  LOWER = 2,        // Lower tray
  MIDDLE = 3,       // Middle tray
  MANUAL = 4,       // Manual feed
  ENVELOPE = 5,     // Envelope feeder
  // ... more options available
}
```

### PrinterInfo

Information about a printer.

```typescript
interface PrinterInfo {
  name: string;           // Printer name
  serverName?: string;    // Server name (for network printers)
  portName?: string;      // Port name
  driverName?: string;    // Driver name
  location?: string;      // Physical location
  comment?: string;       // Description
  status: number;         // Status code
  isDefault?: boolean;    // Is default printer
}
```

## Performance

This library is optimized for high performance:

- ⚡ **44% faster** than legacy approaches
- 🔥 **Page caching** - Render once, print multiple copies instantly
- 💾 **Memory efficient** - Smart bitmap lifecycle management

### Quality vs Speed

| Quality | DPI | Speed | Best For |
|---------|-----|-------|----------|
| LOW | 150 | Fast | Draft documents |
| MEDIUM | 300 | Balanced ⭐ | Standard documents |
| HIGH | 600 | Slower | Photos, presentations |

### Optimization Tips

```typescript
// For multiple copies - use cache (enabled by default)
await printer.print('./report.pdf', { copies: 10 });

// For batch processing - disable cache
printer.setCacheEnabled(false);
for (const file of files) {
  await printer.print(file);
}
```

📖 **See detailed benchmarks and optimization strategies in [Performance Guide](./docs/PERFORMANCE.md)**

## More Examples

Check the [`examples/`](./examples) directory for complete working examples:

- [`simple-print.ts`](./examples/simple-print.ts) - Basic printing
- [`advanced-print.ts`](./examples/advanced-print.ts) - Full configuration
- [`list-printers.ts`](./examples/list-printers.ts) - Enumerate printers
- [`print-with-dialog.ts`](./examples/print-with-dialog.ts) - Interactive dialog
- [`test-performance.ts`](./examples/test-performance.ts) - Performance testing

## Troubleshooting

### Common Issues

**Printer not found?**
```typescript
// List all available printers
const printers = await PrinterManager.getAvailablePrinters();
console.log(printers);
```

**Print job fails?**
- Verify printer is online and not paused
- Check printer permissions
- Ensure printer driver is installed
- Try printing a test page from Windows Settings

**PDF not rendering correctly?**
- Verify the PDF file is valid
- Test with a simple PDF first
- Try increasing print quality

📖 **For detailed troubleshooting, see [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)**

## Platform Support

**Windows Only** - This library is designed exclusively for Windows (7, 10, 11, Server).

For Unix/Linux/macOS, use [unix-print](https://www.npmjs.com/package/unix-print).

### How It Works

This library uses Windows native APIs:
- **PDFium** - Renders PDF pages to bitmaps at specified DPI
- **GDI32** - Transfers bitmaps to printer via Windows Graphics Device Interface
- **Winspool** - Manages printer configuration and job control

📖 **For technical details, see [Architecture Guide](./docs/ARCHITECTURE.md)**

## Documentation

- 📖 [Architecture & Technical Details](./docs/ARCHITECTURE.md)
- ⚡ [Performance Guide](./docs/PERFORMANCE.md)
- 🔧 [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Links

- � [npm Package](https://www.npmjs.com/package/windows-pdf-printer-native)
- 🐛 [Report Issues](https://github.com/ClemersonAssuncao/windows-pdf-printer-native/issues)
- 💬 [Discussions](https://github.com/ClemersonAssuncao/windows-pdf-printer-native/discussions)
- 🔗 [unix-print](https://www.npmjs.com/package/unix-print) - For Unix/Linux/macOS

---

Made with ❤️ for the Node.js community
