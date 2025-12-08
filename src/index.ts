// Clean Architecture Entry Point
export * from './core/types';
export * from './core/interfaces';
export { PrinterFactory } from './factories/printer.factory';
export { PrintQuality, PaperSize, DuplexMode, PageOrientation, ColorMode, PaperTray } from './core/types';

// Re-export platform-specific implementations for backward compatibility
export { WindowsPrinterManagerAdapter } from './adapters/windows/windows-printer-manager.adapter';
export { WindowsPrinterAdapter } from './adapters/windows/windows-printer.adapter';

// Export unified types for backward compatibility
export type { PrintOptions as WindowsPrintOptions, PrinterInfo as WindowsPrinterInfo } from './core/types';

// Simple, clean facade API
import type { PrintOptions, PrinterCapabilitiesInfo, PrinterInfo } from './core/types';
import { PrinterFactory } from './factories/printer.factory';

/**
 * Windows PDFPrinter with GDI and PDFium rendering
 * 
 * @example
 * ```typescript
 * import { PDFPrinter, DuplexMode, PageOrientation, ColorMode, PaperSize, PrintQuality, PaperTray } from 'windows-pdf-printer-native';
 * 
 * const printer = new PDFPrinter();
 * await printer.print('./document.pdf', {
 *   copies: 2,
 *   duplex: DuplexMode.VERTICAL,
 *   orientation: PageOrientation.LANDSCAPE,
 *   color: ColorMode.COLOR,
 *   paperSize: PaperSize.A4,
 *   paperTray: PaperTray.AUTO,
 *   quality: PrintQuality.MEDIUM
 * });
 * 
 * // For validated creation:
 * const printer = await PDFPrinter.create('MyPrinter');
 * ```
 */
export class PDFPrinter {
  private printer: any;
  
  constructor(printerName?: string) {
    // Direct instantiation - validation happens in platform-specific implementations
    this.printer = PrinterFactory.createPrinter(printerName);
  }
  
  /**
   * Create a PDFPrinter with validation
   */
  static async create(printerName?: string): Promise<PDFPrinter> {
    // Validate printer exists if name provided
    if (printerName) {
      const manager = PrinterFactory.createPrinterManager();
      const exists = await manager.printerExists(printerName);
      if (!exists) {
        throw new Error(`Printer not found: ${printerName}`);
      }
    }
    return new PDFPrinter(printerName);
  }
  
  async print(pdfPath: string, options?: PrintOptions): Promise<void> {
    return this.printer.print(pdfPath, options);
  }
  
  async printRaw(data: Buffer, documentName?: string, options?: PrintOptions): Promise<void> {
    return this.printer.printRaw(data, documentName, options);
  }
  
  getPrinterName(): string {
    return this.printer.getPrinterName();
  }

  /**
   * Enable or disable page caching for PDF rendering
   * 
   * Cache is enabled by default for better performance when printing multiple copies.
   * Disable cache when printing many different PDFs to prevent memory buildup.
   * 
   * @param enabled - true to enable cache, false to disable
   * 
   * @example
   * ```typescript
   * const printer = new PDFPrinter();
   * 
   * // Disable cache when printing different PDFs sequentially
   * printer.setCacheEnabled(false);
   * await printer.print('./doc1.pdf');
   * await printer.print('./doc2.pdf');
   * await printer.print('./doc3.pdf');
   * 
   * // Enable cache when printing multiple copies of the same PDF
   * printer.setCacheEnabled(true);
   * await printer.print('./report.pdf', { copies: 10 });
   * ```
   */
  setCacheEnabled(enabled: boolean): void {
    if (this.printer.setCacheEnabled) {
      this.printer.setCacheEnabled(enabled);
    }
  }
}

/**
 * Windows PrinterManager
 * 
 * @example
 * ```typescript
 * const printers = await PrinterManager.getAvailablePrinters();
 * const defaultPrinter = await PrinterManager.getDefaultPrinter();
 * ```
 */
export class PrinterManager {
  private static manager = PrinterFactory.createPrinterManager();
  
  static async getAvailablePrinters(): Promise<PrinterInfo[]> {
    const result = this.manager.getAvailablePrinters();
    return result instanceof Promise ? await result : result;
  }
  
  static async getDefaultPrinter(): Promise<string | null> {
    const result = this.manager.getDefaultPrinter();
    return result instanceof Promise ? await result : result;
  }

  static async getPrinterCapabilities(printerName: string): Promise<PrinterCapabilitiesInfo> {
    const result = this.manager.getPrinterCapabilities(printerName);
    return result instanceof Promise ? await result : result;
  }
  
  static async printerExists(printerName: string): Promise<boolean> {
    const result = this.manager.printerExists(printerName);
    return result instanceof Promise ? await result : result;
  }
  
  // Alias method
  static listPrinters = PrinterManager.getAvailablePrinters;
}

// Helper functions
export async function listPrinters(): Promise<PrinterInfo[]> {
  return PrinterManager.getAvailablePrinters();
}

export async function getDefaultPrinter(): Promise<string | null> {
  return PrinterManager.getDefaultPrinter();
}

export async function printerExists(printerName: string): Promise<boolean> {
  return PrinterManager.printerExists(printerName);
}
