import * as os from 'os';

const isWindows = os.platform() === 'win32';

// Only run these tests on Windows - skip on Unix/Linux/macOS
const describeWindows = isWindows ? describe : describe.skip;

if (!isWindows) {
  console.log('⏭️  Skipping Windows Print API tests (not running on Windows)');
}

// Import winApi once at module level to avoid re-importing in each test suite
let winApi: typeof import('../src/adapters/windows/api/winspool.api');
if (isWindows) {
  // Use require to ensure single import (Jest caches require calls)
  winApi = require('../src/adapters/windows/api/winspool.api');
}

describeWindows('Windows Print API', () => {
  beforeAll(() => {
    // Double-check we're on Windows before running tests
    if (!isWindows) {
      throw new Error('Windows Print API tests should only run on Windows');
    }
  });

  describe('Library Loading', () => {
    it('should export Windows API functions', () => {
      expect(winApi.OpenPrinterW).toBeDefined();
      expect(winApi.ClosePrinter).toBeDefined();
    });
  });

  describe('Function Bindings', () => {
    it('should have OpenPrinterW function', () => {
      expect(winApi.OpenPrinterW).toBeDefined();
      expect(typeof winApi.OpenPrinterW).toBe('function');
    });

    it('should have ClosePrinter function', () => {
      expect(winApi.ClosePrinter).toBeDefined();
      expect(typeof winApi.ClosePrinter).toBe('function');
    });

    it('should have StartDocPrinterW function', () => {
      expect(winApi.StartDocPrinterW).toBeDefined();
      expect(typeof winApi.StartDocPrinterW).toBe('function');
    });

    it('should have EndDocPrinter function', () => {
      expect(winApi.EndDocPrinter).toBeDefined();
      expect(typeof winApi.EndDocPrinter).toBe('function');
    });

    it('should have StartPagePrinter function', () => {
      expect(winApi.StartPagePrinter).toBeDefined();
      expect(typeof winApi.StartPagePrinter).toBe('function');
    });

    it('should have EndPagePrinter function', () => {
      expect(winApi.EndPagePrinter).toBeDefined();
      expect(typeof winApi.EndPagePrinter).toBe('function');
    });

    it('should have WritePrinter function', () => {
      expect(winApi.WritePrinter).toBeDefined();
      expect(typeof winApi.WritePrinter).toBe('function');
    });

    it('should have GetLastError function', () => {
      expect(winApi.GetLastError).toBeDefined();
      expect(typeof winApi.GetLastError).toBe('function');
    });

    it('should have EnumPrintersW function', () => {
      expect(winApi.EnumPrintersW).toBeDefined();
      expect(typeof winApi.EnumPrintersW).toBe('function');
    });

    it('should have GetDefaultPrinterW function', () => {
      expect(winApi.GetDefaultPrinterW).toBeDefined();
      expect(typeof winApi.GetDefaultPrinterW).toBe('function');
    });
  });

  describe('Structure Definitions', () => {
    it('should have DOC_INFO_1W structure defined', () => {
      expect(winApi.DOC_INFO_1W).toBeDefined();
    });

    it('should have PRINTER_INFO_2W structure defined', () => {
      expect(winApi.PRINTER_INFO_2W).toBeDefined();
    });

    it('should have DEVMODEW structure defined', () => {
      expect(winApi.DEVMODEW).toBeDefined();
    });
  });

  describe('Constant Definitions', () => {
    it('should define printer enumeration flags', () => {
      expect(winApi.PRINTER_ENUM_LOCAL).toBeDefined();
      expect(winApi.PRINTER_ENUM_CONNECTIONS).toBeDefined();
      expect(typeof winApi.PRINTER_ENUM_LOCAL).toBe('number');
      expect(typeof winApi.PRINTER_ENUM_CONNECTIONS).toBe('number');
    });

    it('should define duplex modes', () => {
      expect(winApi.DUPLEX_SIMPLEX).toBeDefined();
      expect(winApi.DUPLEX_VERTICAL).toBeDefined();
      expect(winApi.DUPLEX_HORIZONTAL).toBeDefined();
      expect(typeof winApi.DUPLEX_SIMPLEX).toBe('number');
    });

    it('should define paper sizes', () => {
      expect(winApi.PAPER_A4).toBeDefined();
      expect(winApi.PAPER_LETTER).toBeDefined();
      expect(winApi.PAPER_A3).toBeDefined();
      expect(typeof winApi.PAPER_A4).toBe('number');
    });

    it('should define orientations', () => {
      expect(winApi.PORTRAIT).toBeDefined();
      expect(winApi.LANDSCAPE).toBeDefined();
      expect(typeof winApi.PORTRAIT).toBe('number');
    });

    it('should define color modes', () => {
      expect(winApi.MONOCHROME).toBeDefined();
      expect(winApi.COLOR).toBeDefined();
      expect(typeof winApi.MONOCHROME).toBe('number');
    });
  });
});
