/**
 * Printer Capabilities Service
 * 
 * Provides methods to query printer device capabilities using Windows DeviceCapabilitiesW API
 */
import { 
  DeviceCapabilitiesW, 
  DC_PAPERS, 
  DC_PAPERSIZE, 
  DC_MINEXTENT, 
  DC_MAXEXTENT, 
  DC_BINS, 
  DC_BINNAMES,
  DC_DUPLEX, 
  DC_COPIES, 
  DC_PAPERNAMES,
  DC_MEDIAREADY,
  DC_MEDIATYPENAMES 
} from '../api/winspool.api';
import type { PaperSizeInfo, PrinterCapabilitiesInfo, BinInfo, TrayFormAssignment } from '../../../core/types';

export class PrinterCapabilitiesService {
  /**
   * Get all capabilities for a printer
   */
  getCapabilities(printerName: string): PrinterCapabilitiesInfo {
    const bins = this.getSupportedBins(printerName);
    const binNames = this.getBinNames(printerName);
    const paperNames = this.getPaperNames(printerName);
    
    return {
      paperSizes: this.getSupportedPaperSizes(printerName),
      minPaperSize: this.getMinPaperSize(printerName),
      maxPaperSize: this.getMaxPaperSize(printerName),
      bins: bins,
      binNames: binNames,
      paperNames: paperNames,
      trayFormAssignments: this.getTrayFormAssignments(bins, paperNames),
      supportsDuplex: this.supportsDuplex(printerName),
      maxCopies: this.getMaxCopies(printerName),
      mediaReady: this.getMediaReady(printerName),
      mediaTypeNames: this.getMediaTypeNames(printerName)
    };
  }

  /**
   * Get supported paper sizes
   */
  getSupportedPaperSizes(printerName: string): PaperSizeInfo[] {
    const paperSizes: PaperSizeInfo[] = [];

    // Get number of supported paper sizes
    const count = DeviceCapabilitiesW(printerName, null, DC_PAPERS, null, null);
    if (count <= 0) return paperSizes;

    // Get paper IDs
    const paperIds = Buffer.alloc(count * 2); // WORD array
    const result = DeviceCapabilitiesW(printerName, null, DC_PAPERS, paperIds, null);
    if (result <= 0) return paperSizes;

    // Get paper dimensions (in tenths of millimeter)
    const paperSizesBuffer = Buffer.alloc(count * 8); // POINT array (2 LONGs)
    const sizeResult = DeviceCapabilitiesW(printerName, null, DC_PAPERSIZE, paperSizesBuffer, null);
    if (sizeResult <= 0) return paperSizes;

    // Parse paper sizes
    for (let i = 0; i < count; i++) {
      const paperId = paperIds.readUInt16LE(i * 2);
      const width = paperSizesBuffer.readInt32LE(i * 8) / 10; // Convert to mm
      const height = paperSizesBuffer.readInt32LE(i * 8 + 4) / 10; // Convert to mm

      paperSizes.push({
        id: paperId,
        name: this.getPaperName(paperId),
        width: Math.round(width),
        height: Math.round(height)
      });
    }

    return paperSizes;
  }

  /**
   * Get minimum paper size
   */
  getMinPaperSize(printerName: string): { width: number; height: number } | null {
    const buffer = Buffer.alloc(8); // POINT structure
    const result = DeviceCapabilitiesW(printerName, null, DC_MINEXTENT, buffer, null);
    
    if (result > 0) {
      return {
        width: Math.round(buffer.readInt32LE(0) / 10), // Convert to mm
        height: Math.round(buffer.readInt32LE(4) / 10)
      };
    }
    
    return null;
  }

  /**
   * Get maximum paper size
   */
  getMaxPaperSize(printerName: string): { width: number; height: number } | null {
    const buffer = Buffer.alloc(8); // POINT structure
    const result = DeviceCapabilitiesW(printerName, null, DC_MAXEXTENT, buffer, null);
    
    if (result > 0) {
      return {
        width: Math.round(buffer.readInt32LE(0) / 10), // Convert to mm
        height: Math.round(buffer.readInt32LE(4) / 10)
      };
    }
    
    return null;
  }

  /**
   * Get supported bins/trays
   */
  getSupportedBins(printerName: string): BinInfo[] {
    const count = DeviceCapabilitiesW(printerName, null, DC_BINS, null, null);
    if (count <= 0) return [];

    const binsBuffer = Buffer.alloc(count * 2); // WORD array
    const result = DeviceCapabilitiesW(printerName, null, DC_BINS, binsBuffer, null);
    if (result <= 0) return [];

    const bins: BinInfo[] = [];
    for (let i = 0; i < count; i++) {
      const binId = binsBuffer.readUInt16LE(i * 2);
      bins.push({
        id: binId,
        name: this.getBinName(binId)
      });
    }

    return bins;
  }

  /**
   * Get bin/tray names
   */
  getBinNames(printerName: string): string[] {
    const count = DeviceCapabilitiesW(printerName, null, DC_BINNAMES, null, null);
    if (count <= 0) return [];

    const bufferSize = count * 24 * 2; // 24 wide chars per name
    const buffer = Buffer.alloc(bufferSize);
    const result = DeviceCapabilitiesW(printerName, null, DC_BINNAMES, buffer, null);
    if (result <= 0) return [];

    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const offset = i * 24 * 2;
      let str = '';
      for (let j = 0; j < 24; j++) {
        const char = buffer.readUInt16LE(offset + j * 2);
        if (char === 0) break;
        str += String.fromCharCode(char);
      }
      if (str.trim()) {
        names.push(str.trim());
      }
    }

    return names;
  }

  /**
   * Get paper form names
   */
  getPaperNames(printerName: string): string[] {
    const count = DeviceCapabilitiesW(printerName, null, DC_PAPERNAMES, null, null);
    if (count <= 0) return [];

    const bufferSize = count * 64 * 2; // 64 wide chars per name
    const buffer = Buffer.alloc(bufferSize);
    const result = DeviceCapabilitiesW(printerName, null, DC_PAPERNAMES, buffer, null);
    if (result <= 0) return [];

    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const offset = i * 64 * 2;
      let str = '';
      for (let j = 0; j < 64; j++) {
        const char = buffer.readUInt16LE(offset + j * 2);
        if (char === 0) break;
        str += String.fromCharCode(char);
      }
      if (str.trim()) {
        names.push(str.trim());
      }
    }

    return names;
  }

  /**
   * Get tray form assignments (which paper form is assigned to each tray)
   */
  getTrayFormAssignments(bins: BinInfo[], paperNames: string[]): TrayFormAssignment[] {
    const assignments: TrayFormAssignment[] = [];
    
    // Match bins with paper forms (1:1 mapping)
    const maxLen = Math.min(bins.length, paperNames.length);
    for (let i = 0; i < maxLen; i++) {
      assignments.push({
        trayId: bins[i].id,
        trayName: bins[i].name,
        paperFormName: paperNames[i]
      });
    }

    return assignments;
  }

  /**
   * Check if duplex is supported
   */
  supportsDuplex(printerName: string): boolean {
    const result = DeviceCapabilitiesW(printerName, null, DC_DUPLEX, null, null);
    return result === 1;
  }

  /**
   * Get maximum number of copies
   */
  getMaxCopies(printerName: string): number {
    const result = DeviceCapabilitiesW(printerName, null, DC_COPIES, null, null);
    return result > 0 ? result : 1;
  }

  /**
   * Get media ready (loaded paper)
   */
  getMediaReady(printerName: string): string[] {
    const count = DeviceCapabilitiesW(printerName, null, DC_MEDIAREADY, null, null);
    if (count <= 0) return [];

    const bufferSize = count * 64 * 2; // 64 wide chars per string
    const buffer = Buffer.alloc(bufferSize);
    const result = DeviceCapabilitiesW(printerName, null, DC_MEDIAREADY, buffer, null);
    if (result <= 0) return [];

    const media: string[] = [];
    for (let i = 0; i < count; i++) {
      const offset = i * 64 * 2;
      let str = '';
      for (let j = 0; j < 64; j++) {
        const char = buffer.readUInt16LE(offset + j * 2);
        if (char === 0) break;
        str += String.fromCharCode(char);
      }
      if (str.trim()) {
        media.push(str.trim());
      }
    }

    return media;
  }

  /**
   * Get media type names
   */
  getMediaTypeNames(printerName: string): string[] {
    const count = DeviceCapabilitiesW(printerName, null, DC_MEDIATYPENAMES, null, null);
    if (count <= 0) return [];

    const bufferSize = count * 64 * 2; // 64 wide chars per string
    const buffer = Buffer.alloc(bufferSize);
    const result = DeviceCapabilitiesW(printerName, null, DC_MEDIATYPENAMES, buffer, null);
    if (result <= 0) return [];

    const mediaTypes: string[] = [];
    for (let i = 0; i < count; i++) {
      const offset = i * 64 * 2;
      let str = '';
      for (let j = 0; j < 64; j++) {
        const char = buffer.readUInt16LE(offset + j * 2);
        if (char === 0) break;
        str += String.fromCharCode(char);
      }
      if (str.trim()) {
        mediaTypes.push(str.trim());
      }
    }

    return mediaTypes;
  }

  /**
   * Get paper name from paper ID
   */
  private getPaperName(paperId: number): string {
    const paperNames: { [key: number]: string } = {
      1: 'Letter',
      2: 'Letter Small',
      3: 'Tabloid',
      4: 'Ledger',
      5: 'Legal',
      6: 'Statement',
      7: 'Executive',
      8: 'A3',
      9: 'A4',
      10: 'A4 Small',
      11: 'A5',
      12: 'B4 (JIS)',
      13: 'B5 (JIS)',
      14: 'Folio',
      15: 'Quarto',
      16: '10x14',
      17: '11x17',
      18: 'Note',
      19: 'Envelope #9',
      20: 'Envelope #10',
      21: 'Envelope #11',
      22: 'Envelope #12',
      23: 'Envelope #14',
      24: 'C',
      25: 'D',
      26: 'E',
      27: 'Envelope DL',
      28: 'Envelope C5',
      29: 'Envelope C3',
      30: 'Envelope C4',
      31: 'Envelope C6',
      32: 'Envelope C65',
      33: 'Envelope B4',
      34: 'Envelope B5',
      35: 'Envelope B6',
      36: 'Envelope Italy',
      37: 'Envelope Monarch',
      38: 'Envelope Personal',
      39: 'US Std Fanfold',
      40: 'German Std Fanfold',
      41: 'German Legal Fanfold'
    };

    return paperNames[paperId] || `Paper ${paperId}`;
  }

  /**
   * Get bin name from bin ID
   */
  private getBinName(binId: number): string {
    const binNames: { [key: number]: string } = {
      1: 'Upper',
      2: 'Lower',
      3: 'Middle',
      4: 'Manual',
      5: 'Envelope',
      6: 'Envelope Manual',
      7: 'Auto',
      8: 'Tractor',
      9: 'Small Format',
      10: 'Large Format',
      11: 'Large Capacity',
      14: 'Cassette',
      15: 'Form Source'
    };

    return binNames[binId] || `Bin ${binId}`;
  }
}
