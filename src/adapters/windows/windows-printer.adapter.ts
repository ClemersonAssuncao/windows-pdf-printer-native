// Windows Printer Adapter - implements IPrinter interface
import type { IPrinter } from '../../core/interfaces';
import type { PrintOptions, PrinterCapabilities } from '../../core/types';
import * as fs from 'fs';
import * as path from 'path';
import {
  OpenPrinterW,
  ClosePrinter,
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
  GetLastError,
  PRINTER_ACCESS_USE,
  PRINTER_DEFAULTS,
  DOC_INFO_1W
} from './api/winspool.api';
import { WindowsPrinterManagerAdapter } from './windows-printer-manager.adapter';
import koffi from 'koffi';

export class WindowsPrinterAdapter implements IPrinter {
  private printerName: string;
  
  constructor(printerName?: string) {
    const manager = new WindowsPrinterManagerAdapter();
    
    if (printerName) {
      if (!manager.printerExists(printerName)) {
        throw new Error(`Printer not found: ${printerName}`);
      }
      this.printerName = printerName;
    } else {
      const defaultPrinter = manager.getDefaultPrinter();
      if (!defaultPrinter) {
        throw new Error('No default printer found');
      }
      this.printerName = defaultPrinter;
    }
  }
  
  async print(pdfPath: string, options?: PrintOptions): Promise<void> {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    const pdfData = fs.readFileSync(pdfPath);
    const documentName = options?.printer || path.basename(pdfPath);
    
    return this.printRaw(pdfData, documentName, options);
  }
  
  async printRaw(data: Buffer, documentName: string = 'Document', options?: PrintOptions): Promise<void> {
    const printerName = options?.printer || this.printerName;
    const hPrinter = this.openPrinter(printerName);
    
    if (!hPrinter) {
      throw new Error(`Failed to open printer: ${printerName}`);
    }
    
    try {
      // Apply print settings if options provided
      if (options && (options.copies || options.duplex || options.paperSize || 
                      options.orientation || options.color !== undefined || options.paperSource)) {
        this.applyPrintSettings(hPrinter, printerName, options);
      }
      
      // Start document
      const docInfo = {
        pDocName: documentName,
        pOutputFile: null,
        pDatatype: 'RAW'
      };
      
      const jobId = StartDocPrinterW(hPrinter, 1, docInfo);
      if (jobId === 0) {
        throw new Error(`Failed to start document. Error: ${GetLastError()}`);
      }
      
      try {
        // Start page
        if (!StartPagePrinter(hPrinter)) {
          throw new Error(`Failed to start page. Error: ${GetLastError()}`);
        }
        
        try {
          // Write data
          const bytesWritten = [0];
          if (!WritePrinter(hPrinter, data, data.length, bytesWritten)) {
            throw new Error(`Failed to write to printer. Error: ${GetLastError()}`);
          }
          
          if (bytesWritten[0] !== data.length) {
            throw new Error(`Incomplete write: ${bytesWritten[0]} of ${data.length} bytes written`);
          }
        } finally {
          EndPagePrinter(hPrinter);
        }
      } finally {
        EndDocPrinter(hPrinter);
      }
    } finally {
      ClosePrinter(hPrinter);
    }
  }
  
  getPrinterName(): string {
    return this.printerName;
  }
  
  getCapabilities(): PrinterCapabilities | null {
    const manager = new WindowsPrinterManagerAdapter();
    return manager.getPrinterCapabilities(this.printerName);
  }
  
  private openPrinter(printerName: string): any {
    const hPrinter = [null];
    const defaults = {
      pDatatype: null,
      pDevMode: null,
      DesiredAccess: PRINTER_ACCESS_USE
    };
    
    const success = OpenPrinterW(printerName, hPrinter, defaults);
    
    if (!success || !hPrinter[0]) {
      return null;
    }
    
    return hPrinter[0];
  }
  
  private applyPrintSettings(hPrinter: any, printerName: string, options: PrintOptions): void {
    const devMode = [{}];
    const result = DocumentPropertiesW(null, hPrinter, printerName, devMode, null, 0);
    
    if (result < 0) {
      console.warn('Failed to get DEVMODE, settings may not be applied');
      return;
    }
    
    const dm = devMode[0] as any;
    let fieldsChanged = 0;
    
    if (options.copies !== undefined) {
      dm.dmCopies = options.copies;
      fieldsChanged |= DM_COPIES;
    }
    
    if (options.duplex !== undefined) {
      const duplexMap = {
        'simplex': DUPLEX_SIMPLEX,
        'horizontal': DUPLEX_HORIZONTAL,
        'vertical': DUPLEX_VERTICAL
      };
      dm.dmDuplex = duplexMap[options.duplex];
      fieldsChanged |= DM_DUPLEX;
    }
    
    if (options.paperSize !== undefined && typeof options.paperSize === 'number') {
      dm.dmPaperSize = options.paperSize;
      fieldsChanged |= DM_PAPERSIZE;
    }
    
    if (options.orientation !== undefined) {
      dm.dmOrientation = options.orientation === 'landscape' ? LANDSCAPE : PORTRAIT;
      fieldsChanged |= DM_ORIENTATION;
    }
    
    if (options.color !== undefined) {
      dm.dmColor = options.color ? COLOR_MODE : MONOCHROME;
      fieldsChanged |= DM_COLOR;
    }
    
    if (options.paperSource !== undefined) {
      dm.dmDefaultSource = options.paperSource;
      fieldsChanged |= DM_DEFAULTSOURCE;
    }
    
    if (fieldsChanged > 0) {
      dm.dmFields = fieldsChanged;
      DocumentPropertiesW(null, hPrinter, printerName, devMode, devMode, DM_IN_BUFFER | DM_OUT_BUFFER);
    }
  }
}
