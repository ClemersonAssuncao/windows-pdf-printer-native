# Architecture & Technical Details

## Overview

This library is built with **Clean Architecture** principles, using SOLID design patterns and dependency injection for maintainability and testability.

## Architecture Layers

### 1. Core Layer (Platform-Agnostic)
- **Interfaces**: Defines contracts (`IPrinter`, `IPrinterManager`)
- **Types**: Enums and type definitions (PrintQuality, PaperSize, DuplexMode, etc.)
- **Logger**: Structured logging system with multiple levels and performance timers
  - Log levels: DEBUG, INFO, WARN, ERROR, SILENT
  - Context-based logging for better traceability
  - Automatic environment detection (test/production)
  - Performance measurement with `startTimer()` / `endTimer()`

### 2. Adapters Layer (Platform-Specific)
- **Windows Adapter**: Windows GDI implementation
- **Services**: Specialized services for different printing aspects
  - `PdfRenderService` - PDF rendering with PDFium + intelligent caching
  - `DevModeConfigService` - DEVMODE structure configuration and validation
  - `PrintDialogService` - Native Windows print dialog integration
  - `PrinterCapabilitiesService` - Query printer features and capabilities

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
   ├─> OpenPrinterW (open printer handle)
   ├─> DocumentPropertiesW (get default DEVMODE size)
   ├─> DocumentPropertiesW (get current DEVMODE)
   ├─> Apply print options:
   │   ├─> Quality (DPI)
   │   ├─> Duplex mode
   │   ├─> Paper size
   │   ├─> Orientation
   │   ├─> Paper tray
   │   └─> Copies/Collate
   ├─> DocumentPropertiesW (validate with driver)
   └─> CreateDCW with configured DEVMODE
   ```

4. **Rendering & Printing**
   ```
   Print Dialog (optional):
   └─> PrintDlgW (shows native dialog, returns DC if confirmed)
   
   Cache Strategy:
   ├─> If copies > 1 && !collate: disable cache (prevent GDI corruption)
   └─> Otherwise: use cache for performance
   
   For each copy (respecting collate setting):
     For each page:
     ├─> PdfRenderService.renderPage
     │   ├─> Check cache (if enabled)
     │   ├─> FPDF_LoadPage
     │   ├─> FPDFBitmap_Create (BGRA format)
     │   ├─> FPDFBitmap_FillRect (white background)
     │   ├─> FPDF_RenderPageBitmap (with FPDF_PRINTING flag)
     │   ├─> Cache bitmap (if enabled)
     │   └─> Return bitmap data + metadata
     ├─> StartPage
     ├─> StretchDIBits (scale & transfer bitmap)
     ├─> EndPage
     └─> Cleanup rendered page (destroy bitmap if not cached)
   
   Restore cache state
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

### 1. Intelligent Page Caching
The library implements smart caching to optimize performance while avoiding GDI issues:

```typescript
class PdfRenderService {
  private pageCache = new Map<string, RenderedPage>();
  private cacheEnabled = true;
  
  renderPage(pageIndex: number, options: RenderOptions): RenderedPage {
    const cacheKey = `${pageIndex}_${options.width}_${options.height}`;
    
    // Check cache if enabled
    if (this.cacheEnabled && this.pageCache.has(cacheKey)) {
      return this.pageCache.get(cacheKey)!;
    }
    
    // Render page
    const renderedPage = this.renderPageInternal(pageIndex, options);
    
    // Cache if enabled
    if (this.cacheEnabled) {
      this.pageCache.set(cacheKey, renderedPage);
    }
    
    return renderedPage;
  }
}
```

**Cache Strategy:**
- **Enabled by default** for collated printing and single copies
- **Automatically disabled** for multiple copies without collate
  - Prevents GDI buffer corruption when same bitmap is reused consecutively
  - Each copy gets a fresh bitmap render
- **Manual control** via `printer.setCacheEnabled(false)` for batch printing different PDFs
- **Automatic cleanup** when PDF document is closed

**Benefits:**
- Up to 3x faster for multiple collated copies
- Prevents memory buildup in sequential printing
- Avoids GDI corruption with uncollated multi-copy jobs
- Consistent print quality

### 2. Memory Management
- **Bitmap lifecycle**: Created, used, destroyed immediately (or cached)
- **PDFium singleton**: Reference counting for shared library instance
- **Resource cleanup**: All resources freed in `finally` blocks
  - `FPDFBitmap_Destroy` - Free bitmap memory
  - `FPDF_ClosePage` - Close page handle
  - `FPDF_CloseDocument` - Close document
  - `DeleteDC` - Release Device Context
  - `ClosePrinter` - Close printer handle
- **Cache management**: Cleared when document closes or manually disabled
- **No memory leaks**: Comprehensive cleanup even on errors

### 3. DPI Optimization
The library uses optimized DPI defaults based on use case:
- **150 DPI (LOW)**: Draft quality, ~2x faster than medium
- **300 DPI (MEDIUM)**: Optimal balance for documents (default)
- **600 DPI (HIGH)**: High quality for images, ~3.3x slower than medium

**Performance Impact:**
- Rendering time scales quadratically with DPI (4x pixels = 4x time)
- Memory usage scales quadratically with DPI
- Printer DPI is independent (handled by driver)
- Use aspect-ratio-aware scaling to avoid distortion

### 4. Structured Logging & Performance Monitoring
```typescript
const logger = createLogger({ context: 'PdfRender' });
const timer = logger.startTimer('renderPage');

// ... operation ...

logger.endTimer(timer); // Automatically logs duration
```

**Features:**
- Zero-cost when disabled (SILENT level in production)
- Automatic timing measurements
- Context-based filtering
- Color-coded console output with timestamps

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

### 2. Service Pattern
Specialized services handle specific concerns:
- `DevModeConfigService` - Configuration
- `PdfRenderService` - Rendering
- `PrintDialogService` - User interaction
- `PrinterCapabilitiesService` - Feature detection

### 3. Interface Segregation
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
