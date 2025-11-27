import * as fs from 'fs';
import * as path from 'path';
import {
  StartDocPrinterW,
  EndDocPrinter,
  StartPagePrinter,
  EndPagePrinter,
  WritePrinter,
  DocumentPropertiesW,
  DM_IN_BUFFER,
  DM_OUT_BUFFER,
  DM_ORIENTATION,
  DM_PAPERSIZE,
  DM_COPIES,
  DM_DUPLEX,
  DM_COLOR,
  DM_DEFAULTSOURCE,
  DUPLEX_SIMPLEX,
  DUPLEX_HORIZONTAL,
  DUPLEX_VERTICAL,
  PORTRAIT,
  LANDSCAPE,
  MONOCHROME,
  COLOR as COLOR_MODE,
  GetLastError
} from './adapters/windows/api/winspool.api';
import { PrinterManager } from './printer-manager';

export interface PrintOptions {
  printer?: string;           // Printer name (default: system default printer)
  copies?: number;            // Number of copies (default: 1)
  duplex?: 'simplex' | 'horizontal' | 'vertical'; // Duplex mode
  paperSize?: number;         // Paper size constant (default: A4)
  paperSource?: number;       // Paper tray/source
  orientation?: 'portrait' | 'landscape'; // Page orientation
  color?: boolean;            // Color mode (true: color, false: monochrome)
  quality?: number;           // Print quality
  collate?: boolean;          // Collate copies
}

export class PDFPrinter {
  private printerName: string;
  
  constructor(printerName?: string) {
    if (printerName) {
      if (!PrinterManager.printerExists(printerName)) {
        throw new Error(`Printer not found: ${printerName}`);
      }
      this.printerName = printerName;
    } else {
      const defaultPrinter = PrinterManager.getDefaultPrinter();
      if (!defaultPrinter) {
        // Try to get the first available printer
        const printers = PrinterManager.getAvailablePrinters();
        if (printers.length === 0) {
          throw new Error('No printers found on this system');
        }
        console.warn('No default printer found, using first available printer:', printers[0].name);
        this.printerName = printers[0].name;
      } else {
        this.printerName = defaultPrinter;
      }
    }
  }
  
  /**
   * Print a PDF file with specified options
   */
  async print(pdfPath: string, options: PrintOptions = {}): Promise<void> {
    // Validate PDF file
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    const stats = fs.statSync(pdfPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${pdfPath}`);
    }
    
    // Open printer
    const printerName = options.printer || this.printerName;
    
    // First, open printer temporarily to get DEVMODE
    const hPrinterTemp = PrinterManager.openPrinter(printerName);
    const devMode = this.getAndConfigureDevMode(hPrinterTemp, printerName, options);
    PrinterManager.closePrinter(hPrinterTemp);
    
    // Now open printer with configured DEVMODE if options were specified
    const hasOptions = Object.keys(options).some(key => 
      ['copies', 'duplex', 'paperSize', 'paperSource', 'orientation', 'color'].includes(key)
    );
    
    const hPrinter = hasOptions && devMode 
      ? PrinterManager.openPrinterWithDevMode(printerName, devMode)
      : PrinterManager.openPrinter(printerName);
    
    try {
      // Read PDF file first
      const pdfData = fs.readFileSync(pdfPath);
      
      // Prepare document info - DOC_INFO_1W has only 3 string fields
      const docName = path.basename(pdfPath);
      const docInfo = {
        pDocName: docName,
        pOutputFile: null,
        pDatatype: 'RAW'
      };
      
      // Start print job with level 1
      const jobId = StartDocPrinterW(hPrinter, 1, docInfo);
      
      if (!jobId || jobId === 0) {
        const lastError = this.getLastError();
        throw new Error(`Failed to start print job. Windows error code: ${lastError}`);
      }
      
      try {
        // Start page
        if (!StartPagePrinter(hPrinter)) {
          throw new Error('Failed to start page');
        }
        
        try {
          // Write PDF data to printer
          const bytesWritten = [0];
          if (!WritePrinter(hPrinter, pdfData, pdfData.length, bytesWritten)) {
            throw new Error('Failed to write data to printer');
          }
          
          console.log(`Successfully sent ${bytesWritten[0]} bytes to printer`);
        } finally {
          EndPagePrinter(hPrinter);
        }
      } finally {
        EndDocPrinter(hPrinter);
      }
    } finally {
      PrinterManager.closePrinter(hPrinter);
    }
  }
  
  /**
   * Print raw data directly
   */
  async printRaw(data: Buffer, documentName: string = 'Document', options: PrintOptions = {}): Promise<void> {
    const printerName = options.printer || this.printerName;
    
    // First, open printer temporarily to get DEVMODE
    const hPrinterTemp = PrinterManager.openPrinter(printerName);
    const devMode = this.getAndConfigureDevMode(hPrinterTemp, printerName, options);
    PrinterManager.closePrinter(hPrinterTemp);
    
    // Now open printer with configured DEVMODE if options were specified
    const hasOptions = Object.keys(options).some(key => 
      ['copies', 'duplex', 'paperSize', 'paperSource', 'orientation', 'color'].includes(key)
    );
    
    const hPrinter = hasOptions && devMode 
      ? PrinterManager.openPrinterWithDevMode(printerName, devMode)
      : PrinterManager.openPrinter(printerName);
    
    try {
      const docInfo = {
        pDocName: documentName,
        pOutputFile: null,
        pDatatype: 'RAW'
      };
      
      const jobId = StartDocPrinterW(hPrinter, 1, docInfo);
      if (jobId === 0 || jobId === undefined) {
        const lastError = this.getLastError();
        throw new Error(`Failed to start print job. Windows error code: ${lastError}`);
      }
      
      try {
        if (!StartPagePrinter(hPrinter)) {
          throw new Error('Failed to start page');
        }
        
        try {
          const bytesWritten = [0];
          if (!WritePrinter(hPrinter, data, data.length, bytesWritten)) {
            throw new Error('Failed to write data to printer');
          }
          
          console.log(`Successfully sent ${bytesWritten[0]} bytes to printer`);
        } finally {
          EndPagePrinter(hPrinter);
        }
      } finally {
        EndDocPrinter(hPrinter);
      }
    } finally {
      PrinterManager.closePrinter(hPrinter);
    }
  }
  
  /**
   * Get printer's DEVMODE and configure it with print options
   */
  private getAndConfigureDevMode(hPrinter: any, printerName: string, options: PrintOptions): any {
    // Get the size needed for DEVMODE
    const devModeOut = [null];
    const sizeNeeded = DocumentPropertiesW(null, hPrinter, printerName, devModeOut, null, 0);
    
    if (sizeNeeded < 0) {
      console.warn('Could not get DEVMODE size, printing with default settings');
      return null;
    }
    
    // Get the default DEVMODE from printer
    const result = DocumentPropertiesW(null, hPrinter, printerName, devModeOut, null, DM_OUT_BUFFER);
    
    if (result < 0 || !devModeOut[0]) {
      console.warn('Could not get DEVMODE from printer, printing with default settings');
      return null;
    }
    
    const devMode: any = devModeOut[0];
    
    // Apply custom options to the DEVMODE
    // Set copies
    if (options.copies && options.copies > 0) {
      devMode.dmCopies = options.copies;
      devMode.dmFields |= DM_COPIES;
    }
    
    // Set duplex mode
    if (options.duplex) {
      switch (options.duplex) {
        case 'simplex':
          devMode.dmDuplex = DUPLEX_SIMPLEX;
          break;
        case 'horizontal':
          devMode.dmDuplex = DUPLEX_HORIZONTAL;
          break;
        case 'vertical':
          devMode.dmDuplex = DUPLEX_VERTICAL;
          break;
      }
      devMode.dmFields |= DM_DUPLEX;
    }
    
    // Set paper size
    if (options.paperSize) {
      devMode.dmPaperSize = options.paperSize;
      devMode.dmFields |= DM_PAPERSIZE;
    }
    
    // Set paper source
    if (options.paperSource) {
      devMode.dmDefaultSource = options.paperSource;
      devMode.dmFields |= DM_DEFAULTSOURCE;
    }
    
    // Set orientation
    if (options.orientation) {
      devMode.dmOrientation = options.orientation === 'portrait' ? PORTRAIT : LANDSCAPE;
      devMode.dmFields |= DM_ORIENTATION;
    }
    
    // Set color mode
    if (options.color !== undefined) {
      devMode.dmColor = options.color ? COLOR_MODE : MONOCHROME;
      devMode.dmFields |= DM_COLOR;
    }
    
    // Validate the modified DEVMODE with the printer
    const validatedDevMode = [devMode];
    const validateResult = DocumentPropertiesW(null, hPrinter, printerName, validatedDevMode, devMode, DM_IN_BUFFER | DM_OUT_BUFFER);
    
    if (validateResult >= 0 && validatedDevMode[0]) {
      return validatedDevMode[0];
    }
    
    console.warn('DEVMODE validation failed, using unvalidated settings');
    return devMode;
  }
  
  /**
   * Get printer name being used
   */
  getPrinterName(): string {
    return this.printerName;
  }
  
  /**
   * Get printer capabilities
   */
  getCapabilities() {
    return PrinterManager.getPrinterCapabilities(this.printerName);
  }
  
  /**
   * Get last Windows error code
   */
  private getLastError(): number {
    try {
      return GetLastError();
    } catch {
      return 0;
    }
  }
}
