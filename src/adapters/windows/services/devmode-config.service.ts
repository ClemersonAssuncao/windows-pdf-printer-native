// DEVMODE Configuration Service
import type { PrintOptions } from '../../../core/types';
import { createLogger, type Logger } from '../../../core/logger';
import {
  OpenPrinterW,
  ClosePrinter,
  DocumentPropertiesW,
  PRINTER_ACCESS_USE,
  DM_IN_BUFFER,
  DM_OUT_BUFFER,
  DM_ORIENTATION,
  DM_PAPERSIZE,
  DM_DUPLEX,
  DM_COLOR,
  DM_DEFAULTSOURCE
} from '../api';

export class DevModeConfigService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({ context: 'DevModeConfig' });
  }
  /**
   * Get DEVMODE structure with print settings applied
   */
  getDevModeWithSettings(printerName: string, options?: PrintOptions): any {
    if (!options) {
      return null;  // Use printer defaults
    }

    const hPrinter = this.openPrinter(printerName);
    if (!hPrinter) {
      this.logger.warn(`Failed to open printer '${printerName}' for DEVMODE configuration`);
      return null;
    }

    try {
      // STEP 1: Get the size of DEVMODE needed
      const sizeNeeded = DocumentPropertiesW(null, hPrinter, printerName, null, null, 0);
      
      if (sizeNeeded <= 0) {
        this.logger.warn(`Failed to get DEVMODE size for '${printerName}', using printer defaults`);
        return null;
      }
      
      this.logger.debug(`DEVMODE size needed: ${sizeNeeded} bytes`);

      // STEP 2: Get current DEVMODE from printer (this gives us printer's current configuration)
      const devModeOut = [{}];
      let result = DocumentPropertiesW(null, hPrinter, printerName, devModeOut, null, DM_OUT_BUFFER);
      
      if (result < 0) {
        this.logger.warn(`Failed to retrieve current DEVMODE for '${printerName}', using printer defaults`);
        return null;
      }
      
      this.logger.debug('Retrieved current DEVMODE from printer');

      const dm = devModeOut[0] as any;
      
      // STEP 3: Modify the DEVMODE with our settings
      // Initialize dmFields to track which fields we're modifying
      let fieldsToModify = dm.dmFields || 0;

      // Apply paper tray/source FIRST (some drivers require this order)
      if (options.paperTray !== undefined) {
        dm.dmDefaultSource = options.paperTray;
        fieldsToModify |= DM_DEFAULTSOURCE;
        this.logger.debug(`Setting dmDefaultSource = ${options.paperTray} (4=MANUAL, 1=UPPER, 2=LOWER, 7=AUTO)`);
      }

      // Apply duplex setting
      if (options.duplex !== undefined) {
        dm.dmDuplex = options.duplex;
        fieldsToModify |= DM_DUPLEX;
        this.logger.debug(`Setting dmDuplex = ${options.duplex} (1=SIMPLEX, 2=HORIZONTAL, 3=VERTICAL)`);
      }

      // Apply paper size
      if (options.paperSize !== undefined && typeof options.paperSize === 'number') {
        dm.dmPaperSize = options.paperSize;
        fieldsToModify |= DM_PAPERSIZE;
        this.logger.debug(`Setting dmPaperSize = ${options.paperSize}`);
      }

      // Apply orientation
      if (options.orientation !== undefined) {
        dm.dmOrientation = options.orientation;
        fieldsToModify |= DM_ORIENTATION;
        this.logger.debug(`Setting dmOrientation = ${options.orientation} (1=PORTRAIT, 2=LANDSCAPE)`);
      }

      // Apply color mode
      if (options.color !== undefined) {
        dm.dmColor = options.color;
        fieldsToModify |= DM_COLOR;
        this.logger.debug(`Setting dmColor = ${options.color} (1=MONOCHROME, 2=COLOR)`);
      }

      // STEP 4: Update dmFields to include all fields we want to modify
      dm.dmFields = fieldsToModify;
      
      this.logger.debug(`Before validation - dmDefaultSource = ${dm.dmDefaultSource}, dmFields = 0x${dm.dmFields.toString(16)}`);
      
      // STEP 5: Validate and merge the DEVMODE with printer driver
      // This is CRITICAL - the driver validates and applies the changes
      const devModeValidated = [{}];
      result = DocumentPropertiesW(null, hPrinter, printerName, devModeValidated, [dm], DM_IN_BUFFER | DM_OUT_BUFFER);
      
      if (result < 0) {
        this.logger.warn('Failed to validate DEVMODE with driver, changes may not be applied correctly');
        // Still return the modified DEVMODE, but it may not work
        return dm;
      }
      
      this.logger.debug('DEVMODE validated successfully with printer driver');

      const validatedDm = devModeValidated[0] as any;

      // If the driver rejected our dmDefaultSource, try setting it again after validation
      if (options.paperTray !== undefined && validatedDm.dmDefaultSource !== options.paperTray) {
        this.logger.debug(`Driver rejected dmDefaultSource, re-applying value = ${options.paperTray}`);
        validatedDm.dmDefaultSource = options.paperTray;
        validatedDm.dmFields |= DM_DEFAULTSOURCE;
      }

      this.logger.debug('DEVMODE configuration completed successfully');
      return validatedDm;
    } finally {
      ClosePrinter(hPrinter);
    }
  }

  /**
   * Open printer handle
   */
  private openPrinter(printerName: string): any {
    this.logger.debug(`Opening printer handle for '${printerName}'`);
    
    const hPrinter = [null];
    const defaults = {
      pDatatype: null,
      pDevMode: null,
      DesiredAccess: PRINTER_ACCESS_USE
    };

    const success = OpenPrinterW(printerName, hPrinter, defaults);

    if (!success || !hPrinter[0]) {
      this.logger.error(`Failed to open printer handle for '${printerName}'`);
      return null;
    }

    this.logger.debug(`Printer handle opened successfully for '${printerName}'`);
    return hPrinter[0];
  }
}
