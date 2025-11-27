// Core interfaces - define contracts for printer operations
import type { PrintOptions, PrinterInfo, PrinterCapabilities } from '../types';

/**
 * Interface for printer operations
 * All platform-specific implementations must implement this
 */
export interface IPrinter {
  /**
   * Print a PDF file
   */
  print(pdfPath: string, options?: PrintOptions): Promise<void>;
  
  /**
   * Print raw data (PCL, PostScript, etc)
   */
  printRaw(data: Buffer, documentName?: string, options?: PrintOptions): Promise<void>;
  
  /**
   * Get the printer name being used
   */
  getPrinterName(): string;
  
  /**
   * Get printer capabilities
   */
  getCapabilities(): PrinterCapabilities | null | Promise<PrinterCapabilities | null>;
}

/**
 * Interface for printer management operations
 */
export interface IPrinterManager {
  /**
   * Get list of all available printers
   */
  getAvailablePrinters(): PrinterInfo[] | Promise<PrinterInfo[]>;
  
  /**
   * Get the default printer name
   */
  getDefaultPrinter(): string | null | Promise<string | null>;
  
  /**
   * Check if a printer exists
   */
  printerExists(printerName: string): boolean | Promise<boolean>;
  
  /**
   * Get printer capabilities
   */
  getPrinterCapabilities(printerName: string): PrinterCapabilities | null | Promise<PrinterCapabilities | null>;
  
  /**
   * Open a printer handle (platform-specific)
   */
  openPrinter?(printerName: string): any;
  
  /**
   * Close a printer handle (platform-specific)
   */
  closePrinter?(handle: any): void;
}
