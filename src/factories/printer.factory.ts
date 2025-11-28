// Factory pattern - creates the correct printer implementation based on platform
import type { IPrinter, IPrinterManager } from '../core/interfaces';
import { PlatformDetector } from '../services/platform-detector.service';
import { WindowsPrinterManagerAdapter } from '../adapters/windows/windows-printer-manager.adapter';
import { UnixPrinterManagerAdapter } from '../adapters/unix/unix-printer-manager.adapter';
import { WindowsPrinterAdapter } from '../adapters/windows/windows-printer.adapter';
import { UnixPrinterAdapter } from '../adapters/unix/unix-printer.adapter';

export class PrinterFactory {
  /**
   * Create a printer instance for the current platform
   */
  static createPrinter(printerName?: string): IPrinter {
    if (PlatformDetector.isWindows()) {
      return new WindowsPrinterAdapter(printerName);
    } else {
      return new UnixPrinterAdapter(printerName);
    }
  }
  
  /**
   * Create a printer manager instance for the current platform
   */
  static createPrinterManager(): IPrinterManager {
    if (PlatformDetector.isWindows()) {
      return new WindowsPrinterManagerAdapter();
    } else {
      return new UnixPrinterManagerAdapter();
    }
  }
}
