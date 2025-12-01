// Factory pattern - creates printer implementations (Windows only)
import type { IPrinter, IPrinterManager } from '../core/interfaces';
import { WindowsPrinterManagerAdapter } from '../adapters/windows/windows-printer-manager.adapter';
import { WindowsPrinterAdapter } from '../adapters/windows/windows-printer.adapter';

export class PrinterFactory {
  /**
   * Create a printer instance
   */
  static createPrinter(printerName?: string): IPrinter {
    return new WindowsPrinterAdapter(printerName);
  }
  
  /**
   * Create a printer manager instance
   */
  static createPrinterManager(): IPrinterManager {
    return new WindowsPrinterManagerAdapter();
  }
}
