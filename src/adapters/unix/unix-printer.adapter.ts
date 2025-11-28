// Unix Printer Adapter - implements IPrinter interface
import type { IPrinter } from '../../core/interfaces';
import type { PrintOptions, PrinterCapabilities } from '../../core/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { UnixPrinterManagerAdapter } from './unix-printer-manager.adapter';

const execAsync = promisify(exec);

export class UnixPrinterAdapter implements IPrinter {
  private printerName: string;
  
  constructor(printerName?: string) {
    // Note: Validation is async on Unix, so we just store the name
    // Validation should be done before instantiation using printerExists()
    if (printerName) {
      this.printerName = printerName;
    } else {
      // Will be resolved on first print call
      this.printerName = '';
    }
  }
  
  async print(pdfPath: string, options?: PrintOptions): Promise<void> {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    // Resolve printer name if not set
    if (!this.printerName) {
      const manager = new UnixPrinterManagerAdapter();
      const defaultPrinter = await manager.getDefaultPrinter();
      if (!defaultPrinter) {
        throw new Error('No default printer found');
      }
      this.printerName = defaultPrinter;
    }
    
    const printerName = options?.printer || this.printerName;
    
    // Validate printer exists
    const manager = new UnixPrinterManagerAdapter();
    const exists = await manager.printerExists(printerName);
    if (!exists) {
      throw new Error(`Printer not found: ${printerName}`);
    }
    
    // Build lp command with options
    const lpOptions = this.buildLpOptions(options);
    const command = `lp -d "${printerName}" ${lpOptions} "${pdfPath}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr && !stderr.includes('request id')) {
        console.warn('Print warning:', stderr);
      }
    } catch (error: any) {
      throw new Error(`Failed to print: ${error.message}`);
    }
  }
  
  async printRaw(data: Buffer, documentName: string = 'Document', options?: PrintOptions): Promise<void> {
    // Create temporary file for raw data
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `print-${Date.now()}-${documentName}.pdf`);
    
    try {
      fs.writeFileSync(tempFile, data);
      await this.print(tempFile, options);
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
  
  getPrinterName(): string {
    return this.printerName;
  }
  
  async getCapabilities(): Promise<PrinterCapabilities | null> {
    const manager = new UnixPrinterManagerAdapter();
    return manager.getPrinterCapabilities(this.printerName);
  }
  
  private buildLpOptions(options?: PrintOptions): string {
    if (!options) return '';
    
    const lpOptions: string[] = [];
    
    if (options.copies !== undefined && options.copies > 0) {
      lpOptions.push(`-n ${options.copies}`);
    }
    
    if (options.duplex !== undefined) {
      const duplexMap: Record<string, string> = {
        'simplex': 'one-sided',
        'horizontal': 'two-sided-short-edge',
        'vertical': 'two-sided-long-edge'
      };
      const duplexValue = duplexMap[options.duplex];
      if (duplexValue) {
        lpOptions.push(`-o sides=${duplexValue}`);
      }
    }
    
    if (options.paperSize !== undefined) {
      const paperSize = typeof options.paperSize === 'string' 
        ? options.paperSize 
        : this.paperSizeToString(options.paperSize);
      lpOptions.push(`-o media=${paperSize}`);
    }
    
    if (options.orientation !== undefined) {
      lpOptions.push(`-o orientation-requested=${options.orientation === 'landscape' ? '4' : '3'}`);
    }
    
    if (options.color !== undefined) {
      lpOptions.push(`-o print-color-mode=${options.color ? 'color' : 'monochrome'}`);
    }
    
    if (options.collate !== undefined) {
      lpOptions.push(`-o collate=${options.collate ? 'true' : 'false'}`);
    }
    
    return lpOptions.join(' ');
  }
  
  private paperSizeToString(paperSize: number): string {
    // Common paper size constants (matching Windows constants)
    const paperSizeMap: Record<number, string> = {
      1: 'Letter',
      5: 'Legal',
      9: 'A4',
      8: 'A3',
      11: 'Tabloid'
    };
    
    return paperSizeMap[paperSize] || 'A4';
  }
}
