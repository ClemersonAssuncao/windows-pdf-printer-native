// Printer Connection Service - centralized printer handle management
import {
  OpenPrinterW,
  ClosePrinter,
  PRINTER_ACCESS_USE,
  PRINTER_DEFAULTS
} from '../api';

export class PrinterConnectionService {
  /**
   * Open a connection to a printer
   */
  openPrinter(printerName: string): any {
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

  /**
   * Close a printer connection
   */
  closePrinter(hPrinter: any): boolean {
    if (!hPrinter) {
      return false;
    }

    return ClosePrinter(hPrinter);
  }

  /**
   * Execute an operation with auto-cleanup
   */
  withPrinter<T>(printerName: string, callback: (hPrinter: any) => T): T | null {
    const hPrinter = this.openPrinter(printerName);
    if (!hPrinter) {
      return null;
    }

    try {
      return callback(hPrinter);
    } finally {
      this.closePrinter(hPrinter);
    }
  }
}
