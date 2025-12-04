// Print Dialog Service - Handles Windows Print Dialog interaction
import koffi from 'koffi';
import * as buffer from 'buffer';
import {
  PrintDlgW,
  PRINTDLGW,
  PD_RETURNDC,
  PD_ALLPAGES,
  PD_USEDEVMODECOPIESANDCOLLATE,
  PD_NOPAGENUMS,
  PD_NOSELECTION,
  GlobalAlloc,
  GlobalFree,
  GlobalLock,
  GlobalUnlock,
  GHND
} from '../api/comdlg32.api';
import type { PrintOptions } from '../../../core/types';

const Buffer = buffer.Buffer;

export interface PrintDialogResult {
  cancelled: boolean;
  printerName?: string;
  hDC?: any;
  devMode?: any;
  copies?: number;
}

export class PrintDialogService {
  /**
   * Show Windows Print Dialog and return user-selected settings
   */
  showPrintDialog(printerName?: string, options?: PrintOptions): PrintDialogResult {
    // Prepare PRINTDLGW structure
    const pd = {
      lStructSize: 120, // Size of PRINTDLGW structure (64-bit Windows)
      hwndOwner: null,
      hDevMode: null,
      hDevNames: null,
      hDC: null,
      Flags: PD_RETURNDC | PD_ALLPAGES | PD_USEDEVMODECOPIESANDCOLLATE | PD_NOPAGENUMS | PD_NOSELECTION,
      nFromPage: 0,
      nToPage: 0,
      nMinPage: 0,
      nMaxPage: 0,
      nCopies: options?.copies || 1,
      hInstance: null,
      lCustData: 0,
      lpfnPrintHook: null,
      lpfnSetupHook: null,
      lpPrintTemplateName: null,
      lpSetupTemplateName: null,
      hPrintTemplate: null,
      hSetupTemplate: null
    };

    // If a specific printer is requested, we need to set up hDevNames
    if (printerName) {
      pd.hDevNames = this.createDevNames(printerName);
    }

    // Convert to array for koffi
    const pdArray = [pd];
    const pdPtr = koffi.as(pdArray, koffi.pointer(PRINTDLGW));

    try {
      // Show the print dialog
      const result = PrintDlgW(pdPtr);

      if (!result) {
        // User cancelled or error occurred
        if (pd.hDevMode) GlobalFree(pd.hDevMode);
        if (pd.hDevNames) GlobalFree(pd.hDevNames);
        return { cancelled: true };
      }

      // User clicked OK - extract settings
      const selectedPrinterName = this.extractPrinterName(pd.hDevNames);
      
      return {
        cancelled: false,
        printerName: selectedPrinterName,
        hDC: pd.hDC,
        devMode: pd.hDevMode,
        copies: pd.nCopies
      };
    } catch (error: any) {
      // Clean up on error
      if (pd.hDevMode) {
        try {
          GlobalFree(pd.hDevMode);
        } catch {}
      }
      if (pd.hDevNames) {
        try {
          GlobalFree(pd.hDevNames);
        } catch {}
      }
      throw new Error(`Failed to show print dialog: ${error.message}`);
    }
  }

  /**
   * Create DEVNAMES structure for a specific printer
   */
  private createDevNames(printerName: string): any {
    // Calculate sizes
    const driverName = 'winspool'; // Standard Windows print driver
    const outputName = '';
    
    // DEVNAMES structure layout:
    // - wDriverOffset (2 bytes)
    // - wDeviceOffset (2 bytes)
    // - wOutputOffset (2 bytes)
    // - wDefault (2 bytes)
    // - followed by null-terminated wide strings: driver, device, output
    
    const headerSize = 8; // 4 uint16 fields
    const driverOffset = headerSize;
    const deviceOffset = driverOffset + (driverName.length + 1) * 2;
    const outputOffset = deviceOffset + (printerName.length + 1) * 2;
    const totalSize = outputOffset + (outputName.length + 1) * 2;
    
    // Allocate global memory
    const hDevNames = GlobalAlloc(GHND, totalSize);
    if (!hDevNames) {
      throw new Error('Failed to allocate memory for DEVNAMES');
    }
    
    try {
      const pDevNames = GlobalLock(hDevNames);
      if (!pDevNames) {
        GlobalFree(hDevNames);
        throw new Error('Failed to lock DEVNAMES memory');
      }
      
      try {
        // Create a buffer to write the structure
        const buffer = Buffer.alloc(totalSize);
        
        // Write offsets (in character units, not bytes)
        buffer.writeUInt16LE((driverOffset / 2), 0);  // wDriverOffset
        buffer.writeUInt16LE((deviceOffset / 2), 2);  // wDeviceOffset
        buffer.writeUInt16LE((outputOffset / 2), 4);  // wOutputOffset
        buffer.writeUInt16LE(0, 6);                   // wDefault
        
        // Write strings in UTF-16LE
        let offset = driverOffset;
        buffer.write(driverName, offset, 'utf16le');
        offset += (driverName.length + 1) * 2;
        
        buffer.write(printerName, offset, 'utf16le');
        offset += (printerName.length + 1) * 2;
        
        buffer.write(outputName, offset, 'utf16le');
        
        // Copy buffer to global memory
        buffer.copy(Buffer.from(koffi.decode(pDevNames, 'void*', totalSize) as any));
        
      } finally {
        GlobalUnlock(hDevNames);
      }
      
      return hDevNames;
    } catch (error) {
      GlobalFree(hDevNames);
      throw error;
    }
  }

  /**
   * Extract printer name from DEVNAMES handle
   */
  private extractPrinterName(hDevNames: any): string | undefined {
    if (!hDevNames) return undefined;
    
    try {
      const pDevNames = GlobalLock(hDevNames);
      if (!pDevNames) return undefined;
      
      try {
        // Read the structure
        const buffer = Buffer.from(koffi.decode(pDevNames, 'void*', 1024) as any);
        
        // Read wDeviceOffset (offset 2, in character units)
        const deviceOffset = buffer.readUInt16LE(2) * 2; // Convert to bytes
        
        // Read the device name (null-terminated UTF-16LE string)
        let nameLength = 0;
        for (let i = deviceOffset; i < buffer.length - 1; i += 2) {
          if (buffer.readUInt16LE(i) === 0) break;
          nameLength += 2;
        }
        
        if (nameLength > 0) {
          return buffer.toString('utf16le', deviceOffset, deviceOffset + nameLength);
        }
        
        return undefined;
      } finally {
        GlobalUnlock(hDevNames);
      }
    } catch {
      return undefined;
    }
  }

  /**
   * Clean up dialog resources
   */
  cleanup(dialogResult: PrintDialogResult): void {
    if (dialogResult.devMode) {
      try {
        GlobalFree(dialogResult.devMode);
      } catch {}
    }
  }
}
