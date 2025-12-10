// Print Dialog Service - Handles Windows Print Dialog interaction
import koffi from 'koffi';
import * as buffer from 'buffer';
import {
  PrintDlgW,
  PD_RETURNDC,
  PD_ALLPAGES,
  PD_USEDEVMODECOPIESANDCOLLATE,
  PD_PAGENUMS
} from '../api/comdlg32.api';
import {
  GlobalAlloc,
  GlobalFree,
  GlobalLock,
  GlobalUnlock,
  GHND
} from '../api/kernel32.api';
import type { PrintOptions } from '../../../core/types';

const Buffer = buffer.Buffer;

export interface PrintDialogResult {
  cancelled: boolean;
  printerName?: string;
  hDC?: any;
  devMode?: any;
  copies?: number;
  pageRange?: {
    from: number;
    to: number;
    allPages: boolean;
  };
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
      // PD_ALLPAGES: Default to "All Pages" selected
      // PD_RETURNDC: Return device context
      // PD_USEDEVMODECOPIESANDCOLLATE: Use DEVMODE for copies
      // Setting nMinPage and nMaxPage enables the page range option but keeps "All" selected
      Flags: PD_RETURNDC | PD_ALLPAGES | PD_USEDEVMODECOPIESANDCOLLATE,
      nFromPage: 1,
      nToPage: 1,
      nMinPage: 1,
      nMaxPage: 9999, // Maximum pages allowed - this enables the page range controls
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

    // If a specific printer is requested, pre-select it with DEVNAMES
    // The print dialog will automatically load the DEVMODE for the selected printer
    if (printerName) {
      pd.hDevNames = this.createDevNames(printerName);
    }

    // Use array syntax for output parameter
    const pdArray = [pd];

    try {
      // Show the print dialog - PrintDlgW will modify pdArray[0]
      const result = PrintDlgW(pdArray);

      if (!result) {
        // User cancelled or error occurred
        if (pdArray[0].hDevMode) GlobalFree(pdArray[0].hDevMode);
        if (pdArray[0].hDevNames) GlobalFree(pdArray[0].hDevNames);
        return { cancelled: true };
      }

      // User clicked OK - extract settings from the modified struct
      const selectedPrinterName = this.extractPrinterName(pdArray[0].hDevNames);
      
      // Extract page range information
      const pageRange = {
        from: pdArray[0].nFromPage,
        to: pdArray[0].nToPage,
        allPages: (pdArray[0].Flags & PD_PAGENUMS) === 0
      };
      
      return {
        cancelled: false,
        printerName: selectedPrinterName,
        hDC: pdArray[0].hDC,
        devMode: pdArray[0].hDevMode,
        copies: pdArray[0].nCopies,
        pageRange: pageRange
      };
    } catch (error: any) {
      // Clean up on error
      if (pdArray[0].hDevMode) {
        try {
          GlobalFree(pdArray[0].hDevMode);
        } catch {}
      }
      if (pdArray[0].hDevNames) {
        try {
          GlobalFree(pdArray[0].hDevNames);
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
        // Use koffi.decode to get a view of the native memory as a buffer
        const nativeBuffer = koffi.decode(pDevNames, 'uint8_t', totalSize);
        // Copy our buffer data into the native memory
        for (let i = 0; i < totalSize; i++) {
          nativeBuffer[i] = buffer[i];
        }
        
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
