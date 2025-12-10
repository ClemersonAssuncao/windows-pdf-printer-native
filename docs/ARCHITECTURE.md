# Architecture & Technical Details

## Overview

This library is built with **Clean Architecture** principles, using SOLID design patterns and dependency injection for maintainability and testability.

## Architecture Layers

### 1. Core Layer
- **Interfaces**: Defines contracts for printers, adapters, and services
- **Types**: Enums and type definitions (PrintQuality, PaperSize, etc.)
- **Logger**: Centralized logging system

### 2. Adapters Layer
- **Windows Adapter**: Platform-specific implementation for Windows
- **Services**: Specialized services for different printing aspects
  - `DevModeConfigService` - Printer configuration management
  - `PdfRenderService` - PDF to bitmap rendering
  - `PrintDialogService` - Native Windows print dialog
  - `PrinterCapabilitiesService` - Query printer features

### 3. Factory Layer
- **PrinterFactory**: Creates appropriate printer instances based on platform

## Windows Implementation

### Core Technologies

#### GDI32.dll - Graphics Device Interface
The Graphics Device Interface (GDI) is the core Windows API for rendering graphics and managing printing.

**Key Functions:**
- `CreateDCW` - Create Device Context with printer settings
- `StartDocW` - Initialize print job
- `StartPage` - Begin new page
- `StretchDIBits` - Transfer bitmap to printer with scaling
- `EndPage` - Complete page
- `EndDoc` - Finalize print job
- `DeleteDC` - Release Device Context

#### Winspool.drv - Windows Spooler
Windows Print Spooler manages print jobs and printer configuration.

**Key Functions:**
- `EnumPrintersW` - List all system printers
- `GetDefaultPrinterW` - Get default printer name
- `OpenPrinterW` - Open printer for configuration
- `DocumentPropertiesW` - Get/set DEVMODE settings
- `ClosePrinter` - Close printer handle

#### Kernel32.dll - Error Handling
System-level error reporting and memory management.

**Key Functions:**
- `GetLastError` - Retrieve last error code
- `FormatMessageW` - Convert error codes to human-readable messages
- `GlobalLock` / `GlobalUnlock` - Memory management for DEVMODE

#### Comdlg32.dll - Common Dialogs
Windows common dialogs library for native UI.

**Key Functions:**
- `PrintDlgW` - Display native Windows print dialog
- `PageSetupDlgW` - Display page setup dialog (future feature)

#### PDFium - PDF Rendering Engine
Google's high-performance PDF rendering library.

**Key Functions:**
- `FPDF_InitLibrary` - Initialize PDFium library
- `FPDF_LoadMemDocument` - Load PDF from memory buffer
- `FPDF_GetPageCount` - Get number of pages
- `FPDF_LoadPage` - Load specific page
- `FPDF_RenderPageBitmap` - Render page to bitmap at specified DPI
- `FPDFBitmap_Create` - Create bitmap buffer
- `FPDFBitmap_Destroy` - Free bitmap memory
- `FPDF_ClosePage` - Close page handle
- `FPDF_CloseDocument` - Close PDF document

### Printing Workflow

1. **Initialization**
   ```
   PDFPrinter constructor
   ├─> Get/validate printer name
   └─> Initialize WindowsPrinterAdapter
   ```

2. **PDF Loading**
   ```
   print(pdfPath, options)
   ├─> Read PDF file to Buffer
   ├─> FPDF_LoadMemDocument
   └─> FPDF_GetPageCount
   ```

3. **Configuration**
   ```
   DevModeConfigService
   ├─> OpenPrinterW
   ├─> DocumentPropertiesW (get default DEVMODE)
   ├─> Apply print options (quality, duplex, paper size, etc.)
   └─> Create Device Context with configured DEVMODE
   ```

4. **Rendering & Printing**
   ```
   For each page:
   ├─> PdfRenderService.renderPage
   │   ├─> FPDF_LoadPage
   │   ├─> FPDFBitmap_Create (allocate buffer)
   │   ├─> FPDF_RenderPageBitmap (render at target DPI)
   │   └─> Return bitmap data
   ├─> StartPage
   ├─> StretchDIBits (transfer bitmap to printer)
   ├─> EndPage
   └─> FPDFBitmap_Destroy (free memory)
   ```

5. **Cleanup**
   ```
   ├─> EndDoc
   ├─> DeleteDC
   ├─> ClosePrinter
   └─> FPDF_CloseDocument
   ```

### DEVMODE Structure

The DEVMODE structure is the heart of Windows printer configuration. It's a complex binary structure that controls all printer settings.

**Key Fields:**
- `dmFields` - Bitmask indicating which fields are valid
- `dmOrientation` - DMORIENT_PORTRAIT (1) or DMORIENT_LANDSCAPE (2)
- `dmPaperSize` - Paper size constant (e.g., DMPAPER_A4 = 9)
- `dmPrintQuality` - DPI for X resolution
- `dmYResolution` - DPI for Y resolution
- `dmColor` - DMCOLOR_MONOCHROME (1) or DMCOLOR_COLOR (2)
- `dmDuplex` - DMDUP_SIMPLEX (1), DMDUP_HORIZONTAL (2), DMDUP_VERTICAL (3)
- `dmCopies` - Number of copies (1-9999)
- `dmDefaultSource` - Paper tray/source
- `dmCollate` - DMCOLLATE_FALSE (0) or DMCOLLATE_TRUE (1)

## Performance Optimizations

### 1. Page Caching
When printing multiple copies, pages are rendered once and cached:
```typescript
const renderedBitmaps = new Map<number, Buffer>();

// First copy: render and cache
for (let pageNum = 0; pageNum < pageCount; pageNum++) {
  const bitmap = await renderPage(pageNum, dpi);
  renderedBitmaps.set(pageNum, bitmap);
  await printBitmap(bitmap);
}

// Subsequent copies: reuse cached bitmaps
for (let copy = 2; copy <= copies; copy++) {
  for (const [pageNum, bitmap] of renderedBitmaps) {
    await printBitmap(bitmap);
  }
}
```

**Benefits:**
- Renders pages only once regardless of copy count
- Reduces CPU usage for multiple copies
- Maintains print quality consistency

### 2. Memory Management
- Bitmaps are explicitly freed with `FPDFBitmap_Destroy`
- Device Contexts are cleaned up with `DeleteDC`
- Printer handles are closed with `ClosePrinter`
- Cache can be disabled for sequential batch printing

### 3. DPI Optimization
The library uses optimized DPI defaults:
- **150 DPI (LOW)**: Draft quality, ~2x faster than medium
- **300 DPI (MEDIUM)**: Optimal balance for documents (default)
- **600 DPI (HIGH)**: High quality for images, ~3.3x slower than medium

## Error Handling

Errors are captured at multiple levels:

1. **Windows API Errors**
   ```typescript
   const result = gdi32.StartDocW(hdc, docInfo);
   if (result <= 0) {
     const error = kernel32.GetLastError();
     const message = formatWindowsError(error);
     throw new Error(`StartDocW failed: ${message}`);
   }
   ```

2. **PDFium Errors**
   ```typescript
   const doc = pdfium.FPDF_LoadMemDocument(buffer, buffer.length, null);
   if (doc === null) {
     throw new Error('Failed to load PDF document');
   }
   ```

3. **Service-Level Validation**
   ```typescript
   if (!printerExists(printerName)) {
     throw new Error(`Printer "${printerName}" not found`);
   }
   ```

## Testing Strategy

### Unit Tests
- Service classes with mocked dependencies
- Isolated testing of each service component
- Test coverage for error conditions

### Integration Tests
- Real printer interaction (requires configured printer)
- Full printing workflow validation
- Cross-service integration testing

### Performance Tests
- Benchmark different quality settings
- Memory leak detection
- Comparison with baseline results

## Design Patterns

### 1. Dependency Injection
Services receive dependencies through constructors:
```typescript
class WindowsPrinterAdapter {
  constructor(
    private devModeService: DevModeConfigService,
    private pdfRenderService: PdfRenderService,
    private capabilitiesService: PrinterCapabilitiesService
  ) {}
}
```

### 2. Factory Pattern
Platform-specific implementations are created by factory:
```typescript
class PrinterFactory {
  static createPrinter(printerName?: string): IPrinter {
    if (process.platform === 'win32') {
      return new WindowsPrinterAdapter(printerName);
    }
    throw new Error('Unsupported platform');
  }
}
```

### 3. Service Pattern
Specialized services handle specific concerns:
- `DevModeConfigService` - Configuration
- `PdfRenderService` - Rendering
- `PrintDialogService` - User interaction
- `PrinterCapabilitiesService` - Feature detection

### 4. Interface Segregation
Clean interfaces define contracts:
- `IPrinter` - Core printing operations
- `IPrinterManager` - Printer discovery
- `PrintOptions` - Configuration options

## Future Enhancements

- [ ] Page range selection (programmatic)
- [ ] Print preview generation
- [ ] Printer status monitoring
- [ ] Job queue management

---

For more information, see the main [README](../README.md).
