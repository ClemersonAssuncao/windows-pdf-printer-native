/**
 * Tests for DevModeConfigService
 */

import { DevModeConfigService } from '../../src/adapters/windows/services/devmode-config.service';
import type { PrintOptions } from '../../src/core/types';

// Mock the Windows API
jest.mock('../../src/adapters/windows/api/winspool.api', () => ({
  OpenPrinterW: jest.fn(),
  ClosePrinter: jest.fn(),
  DocumentPropertiesW: jest.fn(),
  PRINTER_ACCESS_USE: 0x00000008,
  DM_IN_BUFFER: 0x00000008,
  DM_OUT_BUFFER: 0x00000002,
  DM_ORIENTATION: 0x00000001,
  DM_PAPERSIZE: 0x00000002,
  DM_DUPLEX: 0x00001000,
  DM_COLOR: 0x00000800,
  DM_DEFAULTSOURCE: 0x00000200
}));

const mockWinspoolApi = require('../../src/adapters/windows/api/winspool.api');

// Mock logger
jest.mock('../../src/core/logger', () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startTimer: jest.fn(() => 'timer'),
    endTimer: jest.fn()
  }))
}));

describe('DevModeConfigService', () => {
  let service: DevModeConfigService;
  let mockOpenPrinterW: jest.MockedFunction<typeof mockWinspoolApi.OpenPrinterW>;
  let mockClosePrinter: jest.MockedFunction<typeof mockWinspoolApi.ClosePrinter>;
  let mockDocumentPropertiesW: jest.MockedFunction<typeof mockWinspoolApi.DocumentPropertiesW>;

  beforeEach(() => {
    service = new DevModeConfigService();
    mockOpenPrinterW = mockWinspoolApi.OpenPrinterW as any;
    mockClosePrinter = mockWinspoolApi.ClosePrinter as any;
    mockDocumentPropertiesW = mockWinspoolApi.DocumentPropertiesW as any;
    jest.clearAllMocks();
  });

  describe('getDevModeWithSettings', () => {
    test('should return null when no options provided', () => {
      const result = service.getDevModeWithSettings('TestPrinter', undefined);

      expect(result).toBeNull();
      expect(mockOpenPrinterW).not.toHaveBeenCalled();
    });

    test('should return null when printer cannot be opened', () => {
      mockOpenPrinterW.mockReturnValue(false);

      const options: PrintOptions = { copies: 1 };
      const result = service.getDevModeWithSettings('NonExistentPrinter', options);

      expect(result).toBeNull();
      expect(mockOpenPrinterW).toHaveBeenCalled();
    });

    test('should return null when DocumentPropertiesW fails to get size', () => {
      const mockHandle = { handle: 'test-handle' };
      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      mockDocumentPropertiesW.mockReturnValue(-1); // Error
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { copies: 1 };
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).toBeNull();
      expect(mockDocumentPropertiesW).toHaveBeenCalledWith(null, mockHandle, 'TestPrinter', null, null, 0);
      expect(mockClosePrinter).toHaveBeenCalledWith(mockHandle);
    });

    test('should return null when fails to retrieve current DEVMODE', () => {
      const mockHandle = { handle: 'test-handle' };
      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      mockDocumentPropertiesW
        .mockReturnValueOnce(256) // Size needed
        .mockReturnValueOnce(-1); // Fail to get DEVMODE
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { copies: 1 };
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).toBeNull();
      expect(mockClosePrinter).toHaveBeenCalledWith(mockHandle);
    });

    test('should configure duplex setting', () => {
      const mockHandle = { handle: 'test-handle' };
      const mockDevMode = {
        dmFields: 0,
        dmDuplex: 0
      };

      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      
      mockDocumentPropertiesW
        .mockReturnValueOnce(256) // Size needed
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any) => {
          devModeOut[0] = { ...mockDevMode };
          return 0;
        })
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any, devModeIn: any) => {
          devModeOut[0] = { ...devModeIn[0] };
          return 0;
        });
      
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { duplex: 2 }; // HORIZONTAL
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).not.toBeNull();
      expect(result.dmDuplex).toBe(2);
      expect(result.dmFields & mockWinspoolApi.DM_DUPLEX).toBeTruthy();
      expect(mockClosePrinter).toHaveBeenCalledWith(mockHandle);
    });

    test('should configure paper size setting', () => {
      const mockHandle = { handle: 'test-handle' };
      const mockDevMode = {
        dmFields: 0,
        dmPaperSize: 0
      };

      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      
      mockDocumentPropertiesW
        .mockReturnValueOnce(256)
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any) => {
          devModeOut[0] = { ...mockDevMode };
          return 0;
        })
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any, devModeIn: any) => {
          devModeOut[0] = { ...devModeIn[0] };
          return 0;
        });
      
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { paperSize: 9 }; // A4
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).not.toBeNull();
      expect(result.dmPaperSize).toBe(9);
      expect(result.dmFields & mockWinspoolApi.DM_PAPERSIZE).toBeTruthy();
    });

    test('should configure orientation setting', () => {
      const mockHandle = { handle: 'test-handle' };
      const mockDevMode = {
        dmFields: 0,
        dmOrientation: 0
      };

      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      
      mockDocumentPropertiesW
        .mockReturnValueOnce(256)
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any) => {
          devModeOut[0] = { ...mockDevMode };
          return 0;
        })
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any, devModeIn: any) => {
          devModeOut[0] = { ...devModeIn[0] };
          return 0;
        });
      
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { orientation: 2 }; // LANDSCAPE
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).not.toBeNull();
      expect(result.dmOrientation).toBe(2);
      expect(result.dmFields & mockWinspoolApi.DM_ORIENTATION).toBeTruthy();
    });

    test('should configure color mode setting', () => {
      const mockHandle = { handle: 'test-handle' };
      const mockDevMode = {
        dmFields: 0,
        dmColor: 0
      };

      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      
      mockDocumentPropertiesW
        .mockReturnValueOnce(256)
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any) => {
          devModeOut[0] = { ...mockDevMode };
          return 0;
        })
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any, devModeIn: any) => {
          devModeOut[0] = { ...devModeIn[0] };
          return 0;
        });
      
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { color: 1 }; // MONOCHROME
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).not.toBeNull();
      expect(result.dmColor).toBe(1);
      expect(result.dmFields & mockWinspoolApi.DM_COLOR).toBeTruthy();
    });

    test('should configure paper tray setting', () => {
      const mockHandle = { handle: 'test-handle' };
      const mockDevMode = {
        dmFields: 0,
        dmDefaultSource: 0
      };

      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      
      mockDocumentPropertiesW
        .mockReturnValueOnce(256)
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any) => {
          devModeOut[0] = { ...mockDevMode };
          return 0;
        })
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any, devModeIn: any) => {
          devModeOut[0] = { ...devModeIn[0] };
          return 0;
        });
      
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { paperTray: 4 }; // MANUAL
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).not.toBeNull();
      expect(result.dmDefaultSource).toBe(4);
      expect(result.dmFields & mockWinspoolApi.DM_DEFAULTSOURCE).toBeTruthy();
    });

    test('should configure multiple settings simultaneously', () => {
      const mockHandle = { handle: 'test-handle' };
      const mockDevMode = {
        dmFields: 0,
        dmDuplex: 0,
        dmOrientation: 0,
        dmPaperSize: 0,
        dmColor: 0,
        dmDefaultSource: 0
      };

      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      
      mockDocumentPropertiesW
        .mockReturnValueOnce(256)
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any) => {
          devModeOut[0] = { ...mockDevMode };
          return 0;
        })
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any, devModeIn: any) => {
          devModeOut[0] = { ...devModeIn[0] };
          return 0;
        });
      
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = {
        duplex: 2,
        orientation: 2,
        paperSize: 9,
        color: 2,
        paperTray: 7
      };
      
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).not.toBeNull();
      expect(result.dmDuplex).toBe(2);
      expect(result.dmOrientation).toBe(2);
      expect(result.dmPaperSize).toBe(9);
      expect(result.dmColor).toBe(2);
      expect(result.dmDefaultSource).toBe(7);
      
      const expectedFields = 
        mockWinspoolApi.DM_DUPLEX | 
        mockWinspoolApi.DM_ORIENTATION | 
        mockWinspoolApi.DM_PAPERSIZE | 
        mockWinspoolApi.DM_COLOR | 
        mockWinspoolApi.DM_DEFAULTSOURCE;
      
      expect(result.dmFields & expectedFields).toBe(expectedFields);
    });

    test('should handle validation failure and still return modified DEVMODE', () => {
      const mockHandle = { handle: 'test-handle' };
      const mockDevMode = {
        dmFields: 0,
        dmDuplex: 0
      };

      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      
      mockDocumentPropertiesW
        .mockReturnValueOnce(256)
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any) => {
          devModeOut[0] = { ...mockDevMode };
          return 0;
        })
        .mockReturnValueOnce(-1); // Validation fails
      
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { duplex: 2 };
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).not.toBeNull();
      expect(result.dmDuplex).toBe(2);
      expect(mockClosePrinter).toHaveBeenCalledWith(mockHandle);
    });

    test('should re-apply paper tray if driver rejects it', () => {
      const mockHandle = { handle: 'test-handle' };
      const mockDevMode = {
        dmFields: 0,
        dmDefaultSource: 0
      };

      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      
      mockDocumentPropertiesW
        .mockReturnValueOnce(256)
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any) => {
          devModeOut[0] = { ...mockDevMode };
          return 0;
        })
        .mockImplementationOnce((hwnd: any, hPrinter: any, printerName: any, devModeOut: any, devModeIn: any) => {
          // Driver rejects paperTray value
          devModeOut[0] = { ...devModeIn[0], dmDefaultSource: 1 }; // Different value
          return 0;
        });
      
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { paperTray: 4 };
      const result = service.getDevModeWithSettings('TestPrinter', options);

      expect(result).not.toBeNull();
      expect(result.dmDefaultSource).toBe(4); // Re-applied
      expect(result.dmFields & mockWinspoolApi.DM_DEFAULTSOURCE).toBeTruthy();
    });

    test('should always close printer handle', () => {
      const mockHandle = { handle: 'test-handle' };
      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      
      mockDocumentPropertiesW.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      mockClosePrinter.mockReturnValue(true);

      const options: PrintOptions = { duplex: 2 };

      expect(() => {
        service.getDevModeWithSettings('TestPrinter', options);
      }).toThrow('Unexpected error');

      expect(mockClosePrinter).toHaveBeenCalledWith(mockHandle);
    });
  });
});
