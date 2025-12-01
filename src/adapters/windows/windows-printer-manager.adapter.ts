// Windows Printer Manager Adapter
import type { IPrinterManager } from '../../core/interfaces';
import { type PrinterInfo, type PrinterCapabilities, PaperSize } from '../../core/types';
import {
  EnumPrintersW,
  GetDefaultPrinterW,
  DocumentPropertiesW,
  PRINTER_ENUM_LOCAL,
  PRINTER_ENUM_CONNECTIONS,
  PRINTER_INFO_2W,
  DM_IN_BUFFER,
  DM_OUT_BUFFER
} from './api';
import { PrinterConnectionService } from './services/printer-connection.service';
import koffi from 'koffi';

export class WindowsPrinterManagerAdapter implements IPrinterManager {
  private connectionService: PrinterConnectionService;
  
  constructor() {
    this.connectionService = new PrinterConnectionService();
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
  
  getPrinterCapabilities(printerName: string): PrinterCapabilities | null {
    return this.connectionService.withPrinter(printerName, (hPrinter) => {
      const devMode = [{}];
      const result = DocumentPropertiesW(null, hPrinter, printerName, devMode, null, 0);
      
      if (result < 0) {
        return null;
      }
      
      const dm = devMode[0] as any;
      
      return {
        supportsDuplex: dm.dmDuplex !== undefined && dm.dmDuplex > 0,
        supportsColor: dm.dmColor !== undefined && dm.dmColor > 1,
        defaultPaperSize: dm.dmPaperSize || PaperSize.A4
      };
    });
  }
}
