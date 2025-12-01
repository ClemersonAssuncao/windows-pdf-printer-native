// DEVMODE Configuration Service
import type { PrintOptions } from '../../../core/types';
import { DuplexMode, PageOrientation, ColorMode } from '../../../core/types';
import {
  OpenPrinterW,
  ClosePrinter,
  DocumentPropertiesW,
  PRINTER_ACCESS_USE,
  PRINTER_DEFAULTS,
  DM_IN_BUFFER,
  DM_OUT_BUFFER,
  DM_ORIENTATION,
  DM_PAPERSIZE,
  DM_DUPLEX,
  DM_COLOR,
  DM_DEFAULTSOURCE
} from '../api';

export class DevModeConfigService {
  /**
   * Get DEVMODE structure with print settings applied
   */
  getDevModeWithSettings(printerName: string, options?: PrintOptions): any {
    if (!options) {
      return null;  // Use printer defaults
    }

    const hPrinter = this.openPrinter(printerName);
    if (!hPrinter) {
      return null;
    }

    try {
      // Get size of DEVMODE
      const devMode = [{}];
      const result = DocumentPropertiesW(null, hPrinter, printerName, devMode, null, 0);

      if (result < 0) {
        console.warn('Failed to get DEVMODE, using printer defaults');
        return null;
      }

      const dm = devMode[0] as any;
      let fieldsChanged = 0;

      // Apply duplex setting
      if (options.duplex !== undefined) {
        dm.dmDuplex = options.duplex;
        fieldsChanged |= DM_DUPLEX;
      }

      // Apply paper size
      if (options.paperSize !== undefined && typeof options.paperSize === 'number') {
        dm.dmPaperSize = options.paperSize;
        fieldsChanged |= DM_PAPERSIZE;
      }

      // Apply orientation
      if (options.orientation !== undefined) {
        dm.dmOrientation = options.orientation;
        fieldsChanged |= DM_ORIENTATION;
      }

      // Apply color mode
      if (options.color !== undefined) {
        dm.dmColor = options.color;
        fieldsChanged |= DM_COLOR;
      }

      // Apply paper tray/source
      if (options.paperTray !== undefined) {
        dm.dmDefaultSource = options.paperTray;
        fieldsChanged |= DM_DEFAULTSOURCE;
      }

      // Apply changes if any field was modified
      if (fieldsChanged > 0) {
        dm.dmFields = fieldsChanged;
        DocumentPropertiesW(null, hPrinter, printerName, devMode, devMode, DM_IN_BUFFER | DM_OUT_BUFFER);
      }

      return dm;
    } finally {
      ClosePrinter(hPrinter);
    }
  }

  /**
   * Open printer handle
   */
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
}
