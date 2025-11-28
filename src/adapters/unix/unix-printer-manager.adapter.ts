// Unix Printer Manager Adapter - implements IPrinterManager interface
import type { IPrinterManager } from '../../core/interfaces';
import type { PrinterInfo, PrinterCapabilities } from '../../core/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Unix Printer Manager using lpstat and lp commands
 */
export class UnixPrinterManagerAdapter implements IPrinterManager {
  async getAvailablePrinters(): Promise<PrinterInfo[]> {
    try {
      const { stdout } = await execAsync('lpstat -p -d 2>/dev/null || lpstat -p');
      const printers: PrinterInfo[] = [];
      const defaultPrinter = await this.getDefaultPrinter();
      
      const lines = stdout.split('\n').filter(line => line.startsWith('printer'));
      
      for (const line of lines) {
        // Format: "printer PrinterName is idle. enabled since ..."
        const match = line.match(/printer\s+(\S+)\s+(.*)/);
        if (match) {
          const name = match[1];
          const statusText = match[2];
          
          printers.push({
            name,
            status: 0, // Unix doesn't provide numeric status codes
            isDefault: name === defaultPrinter,
            comment: statusText
          });
        }
      }
      
      return printers;
    } catch (error) {
      return [];
    }
  }
  
  async getDefaultPrinter(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('lpstat -d 2>/dev/null');
      // Format: "system default destination: PrinterName"
      const match = stdout.match(/default destination:\s*(\S+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }
  
  async printerExists(printerName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`lpstat -p "${printerName}" 2>/dev/null`);
      return stdout.includes(`printer ${printerName}`);
    } catch (error) {
      return false;
    }
  }
  
  async getPrinterCapabilities(printerName: string): Promise<PrinterCapabilities | null> {
    // Unix doesn't have a built-in way to get detailed capabilities
    // Return basic capabilities based on printer existence
    const exists = await this.printerExists(printerName);
    if (!exists) {
      return null;
    }
    
    return {
      supportsDuplex: true, // Most modern Unix printers support duplex
      supportsColor: true,
      availablePaperSizes: ['A4', 'Letter', 'Legal'], // Common paper sizes
      defaultPaperSize: 'A4',
      availablePaperSources: [] // Unix doesn't provide paper source info
    };
  }
}
