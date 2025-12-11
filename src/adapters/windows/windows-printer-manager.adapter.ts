// Windows Printer Manager Adapter
import type { IPrinterManager } from '../../core/interfaces';
import {
  EnumPrintersW,
  GetDefaultPrinterW,
  PRINTER_ENUM_LOCAL,
  PRINTER_ENUM_CONNECTIONS,
  PRINTER_INFO_2W
} from './api';
import { PrinterCapabilitiesService } from './services/printer-capabilities.service';
import type { PrinterCapabilitiesInfo, PrinterInfo } from '../../core/types';
import koffi from 'koffi';

export class WindowsPrinterManagerAdapter implements IPrinterManager {
  private capabilitiesService: PrinterCapabilitiesService;
  
  constructor() {
    // Validate Windows platform early - fail fast
    if (process.platform !== 'win32') {
      throw new Error(
        `Windows PDF Printer Native only supports Windows platform. ` +
        `Current platform: ${process.platform}. ` +
        `For Unix/Linux/macOS printing, please use: https://www.npmjs.com/package/unix-print`
      );
    }
    
    this.capabilitiesService = new PrinterCapabilitiesService();
  }
  getAvailablePrinters(): PrinterInfo[] {
    const printers: PrinterInfo[] = [];
    const flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS;
    
    let needed = [0];
    let returned = [0];
    
    EnumPrintersW(flags, null, 2, null, 0, needed, returned);
    
    if (needed[0] === 0) {
      return printers;
    }
    
    const buffer = Buffer.alloc(needed[0]);
    const success = EnumPrintersW(flags, null, 2, buffer, needed[0], needed, returned);
    
    if (!success || returned[0] === 0) {
      return printers;
    }
    
    const structSize = koffi.sizeof(PRINTER_INFO_2W);
    const defaultPrinter = this.getDefaultPrinter();
    
    for (let i = 0; i < returned[0]; i++) {
      const offset = i * structSize;
      const printerInfo = koffi.decode(buffer.slice(offset, offset + structSize), PRINTER_INFO_2W);
      
      printers.push({
        name: printerInfo.pPrinterName || '',
        serverName: printerInfo.pServerName || undefined,
        portName: printerInfo.pPortName || undefined,
        driverName: printerInfo.pDriverName || undefined,
        location: printerInfo.pLocation || undefined,
        comment: printerInfo.pComment || undefined,
        status: printerInfo.Status,
        isDefault: printerInfo.pPrinterName === defaultPrinter
      });
    }
    
    return printers;
  }
  
  getDefaultPrinter(): string | null {
    const bufferSize = [256];
    const buffer = Buffer.alloc(256 * 2);
    
    const success = GetDefaultPrinterW(buffer, bufferSize);
    
    if (!success) {
      return null;
    }
    
    let printerName = '';
    for (let i = 0; i < bufferSize[0] * 2; i += 2) {
      const charCode = buffer.readUInt16LE(i);
      if (charCode === 0) break;
      printerName += String.fromCharCode(charCode);
    }
    
    return printerName || null;
  }
  
  printerExists(printerName: string): boolean {
    const printers = this.getAvailablePrinters();
    return printers.some(p => p.name.toLowerCase() === printerName.toLowerCase());
  }

  /**
   * Get detailed printer capabilities including paper sizes, bins, duplex support, etc.
   * @param printerName - Name of the printer to query
   * @returns Comprehensive printer capabilities information
   */
  getPrinterCapabilities(printerName: string): PrinterCapabilitiesInfo {
    return this.capabilitiesService.getCapabilities(printerName);
  }
}
