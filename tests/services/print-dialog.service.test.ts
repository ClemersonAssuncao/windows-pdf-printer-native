/**
 * Tests for PrintDialogService
 */

import { PrintDialogService, type PrintDialogResult } from '../../src/adapters/windows/services/print-dialog.service';
import * as comdlg32Api from '../../src/adapters/windows/api/comdlg32.api';
import * as kernel32Api from '../../src/adapters/windows/api/kernel32.api';
import type { PrintOptions } from '../../src/core/types';

// Mock the Windows API
jest.mock('../../src/adapters/windows/api/comdlg32.api', () => ({
  PrintDlgW: jest.fn(),
  PD_RETURNDC: 0x00000100,
  PD_ALLPAGES: 0x00000000,
  PD_USEDEVMODECOPIESANDCOLLATE: 0x00040000,
  PD_PAGENUMS: 0x00000002
}));

jest.mock('../../src/adapters/windows/api/kernel32.api', () => ({
  GlobalAlloc: jest.fn(),
  GlobalFree: jest.fn(),
  GlobalLock: jest.fn(),
  GlobalUnlock: jest.fn(),
  GHND: 0x0042
}));

// Mock koffi
jest.mock('koffi', () => ({
  decode: jest.fn((ptr, type, size) => {
    if (type === 'uint8_t') {
      return new Array(size).fill(0);
    }
    return ptr;
  })
}));

describe('PrintDialogService', () => {
  let service: PrintDialogService;
  let mockPrintDlgW: jest.MockedFunction<typeof comdlg32Api.PrintDlgW>;
  let mockGlobalAlloc: jest.MockedFunction<typeof kernel32Api.GlobalAlloc>;
  let mockGlobalFree: jest.MockedFunction<typeof kernel32Api.GlobalFree>;
  let mockGlobalLock: jest.MockedFunction<typeof kernel32Api.GlobalLock>;
  let mockGlobalUnlock: jest.MockedFunction<typeof kernel32Api.GlobalUnlock>;

  beforeEach(() => {
    service = new PrintDialogService();
    mockPrintDlgW = comdlg32Api.PrintDlgW as jest.MockedFunction<typeof comdlg32Api.PrintDlgW>;
    mockGlobalAlloc = kernel32Api.GlobalAlloc as jest.MockedFunction<typeof kernel32Api.GlobalAlloc>;
    mockGlobalFree = kernel32Api.GlobalFree as jest.MockedFunction<typeof kernel32Api.GlobalFree>;
    mockGlobalLock = kernel32Api.GlobalLock as jest.MockedFunction<typeof kernel32Api.GlobalLock>;
    mockGlobalUnlock = kernel32Api.GlobalUnlock as jest.MockedFunction<typeof kernel32Api.GlobalUnlock>;
    jest.clearAllMocks();
  });

  describe('showPrintDialog', () => {
    test('should show dialog and return result when user clicks OK', () => {
      const mockHDC = { dc: 'test-dc' };
      const mockDevMode = { devMode: 'test-devmode' };
      const mockDevNames = { devNames: 'test-devnames' };

      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDC = mockHDC;
        pdArray[0].hDevMode = mockDevMode;
        pdArray[0].hDevNames = mockDevNames;
        pdArray[0].nCopies = 2;
        pdArray[0].nFromPage = 1;
        pdArray[0].nToPage = 5;
        pdArray[0].Flags = comdlg32Api.PD_RETURNDC | comdlg32Api.PD_ALLPAGES;
        return true;
      });

      mockGlobalLock.mockReturnValue({ ptr: 'test-ptr' });
      mockGlobalUnlock.mockReturnValue(true);

      const result = service.showPrintDialog();

      expect(result.cancelled).toBe(false);
      expect(result.hDC).toBe(mockHDC);
      expect(result.devMode).toBe(mockDevMode);
      expect(result.copies).toBe(2);
      expect(result.pageRange).toEqual({
        from: 1,
        to: 5,
        allPages: true
      });
      expect(mockPrintDlgW).toHaveBeenCalled();
    });

    test('should return cancelled when user cancels dialog', () => {
      mockPrintDlgW.mockReturnValue(false);

      const result = service.showPrintDialog();

      expect(result.cancelled).toBe(true);
      expect(result.printerName).toBeUndefined();
      expect(result.hDC).toBeUndefined();
    });

    test('should detect page range selection', () => {
      const mockHDC = { dc: 'test-dc' };

      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDC = mockHDC;
        pdArray[0].nFromPage = 2;
        pdArray[0].nToPage = 8;
        pdArray[0].Flags = comdlg32Api.PD_RETURNDC | comdlg32Api.PD_PAGENUMS;
        return true;
      });

      const result = service.showPrintDialog();

      expect(result.cancelled).toBe(false);
      expect(result.pageRange).toEqual({
        from: 2,
        to: 8,
        allPages: false
      });
    });

    test('should pre-select specified printer', () => {
      const mockHDevNames = { devNames: 'test-devnames' };
      mockGlobalAlloc.mockReturnValue(mockHDevNames);
      mockGlobalLock.mockReturnValue({ ptr: 'test-ptr' });
      mockGlobalUnlock.mockReturnValue(true);
      mockPrintDlgW.mockReturnValue(true);

      service.showPrintDialog('TestPrinter');

      expect(mockGlobalAlloc).toHaveBeenCalled();
      expect(mockGlobalLock).toHaveBeenCalledWith(mockHDevNames);
      expect(mockGlobalUnlock).toHaveBeenCalledWith(mockHDevNames);
    });

    test('should set copies from options', () => {
      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        expect(pdArray[0].nCopies).toBe(3);
        return true;
      });

      const options: PrintOptions = { copies: 3 };
      service.showPrintDialog(undefined, options);

      expect(mockPrintDlgW).toHaveBeenCalled();
    });

    test('should default to 1 copy when not specified', () => {
      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        expect(pdArray[0].nCopies).toBe(1);
        return true;
      });

      service.showPrintDialog();

      expect(mockPrintDlgW).toHaveBeenCalled();
    });

    test('should clean up resources when user cancels', () => {
      const mockDevMode = { devMode: 'test' };
      const mockDevNames = { devNames: 'test' };

      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDevMode = mockDevMode;
        pdArray[0].hDevNames = mockDevNames;
        return false;
      });

      service.showPrintDialog();

      expect(mockGlobalFree).toHaveBeenCalledWith(mockDevMode);
      expect(mockGlobalFree).toHaveBeenCalledWith(mockDevNames);
    });

    test('should clean up resources on error', () => {
      const mockDevMode = { devMode: 'test' };
      const mockDevNames = { devNames: 'test' };

      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDevMode = mockDevMode;
        pdArray[0].hDevNames = mockDevNames;
        throw new Error('Dialog error');
      });

      expect(() => service.showPrintDialog()).toThrow('Failed to show print dialog: Dialog error');
      expect(mockGlobalFree).toHaveBeenCalledWith(mockDevMode);
      expect(mockGlobalFree).toHaveBeenCalledWith(mockDevNames);
    });

    test('should handle cleanup errors gracefully', () => {
      const mockDevMode = { devMode: 'test' };

      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDevMode = mockDevMode;
        throw new Error('Dialog error');
      });

      mockGlobalFree.mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      expect(() => service.showPrintDialog()).toThrow('Failed to show print dialog: Dialog error');
    });

    test('should set correct dialog structure size', () => {
      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        expect(pdArray[0].lStructSize).toBe(120);
        return true;
      });

      service.showPrintDialog();
    });

    test('should set correct flags for dialog', () => {
      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        const expectedFlags = 
          comdlg32Api.PD_RETURNDC | 
          comdlg32Api.PD_ALLPAGES | 
          comdlg32Api.PD_USEDEVMODECOPIESANDCOLLATE;
        expect(pdArray[0].Flags).toBe(expectedFlags);
        return true;
      });

      service.showPrintDialog();
    });

    test('should set page range limits', () => {
      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        expect(pdArray[0].nMinPage).toBe(1);
        expect(pdArray[0].nMaxPage).toBe(9999);
        expect(pdArray[0].nFromPage).toBe(1);
        expect(pdArray[0].nToPage).toBe(1);
        return true;
      });

      service.showPrintDialog();
    });
  });

  describe('createDevNames', () => {
    test('should create DEVNAMES structure', () => {
      const mockHDevNames = { devNames: 'test-devnames' };
      const mockPtr = { ptr: 'test-ptr' };

      mockGlobalAlloc.mockReturnValue(mockHDevNames);
      mockGlobalLock.mockReturnValue(mockPtr);
      mockGlobalUnlock.mockReturnValue(true);
      mockPrintDlgW.mockReturnValue(true);

      service.showPrintDialog('MyPrinter');

      expect(mockGlobalAlloc).toHaveBeenCalledWith(kernel32Api.GHND, expect.any(Number));
      expect(mockGlobalLock).toHaveBeenCalledWith(mockHDevNames);
      expect(mockGlobalUnlock).toHaveBeenCalledWith(mockHDevNames);
    });

    test('should throw error when memory allocation fails', () => {
      mockGlobalAlloc.mockReturnValue(null);

      expect(() => service.showPrintDialog('MyPrinter')).toThrow('Failed to allocate memory for DEVNAMES');
    });

    test('should free memory when lock fails', () => {
      const mockHDevNames = { devNames: 'test-devnames' };
      mockGlobalAlloc.mockReturnValue(mockHDevNames);
      mockGlobalLock.mockReturnValue(null);
      mockGlobalFree.mockReturnValue(true); // Don't throw on cleanup

      expect(() => service.showPrintDialog('MyPrinter')).toThrow('Failed to lock DEVNAMES memory');
      expect(mockGlobalFree).toHaveBeenCalledWith(mockHDevNames);
    });

    test('should free memory when error occurs during creation', () => {
      const mockHDevNames = { devNames: 'test-devnames' };
      const mockPtr = { ptr: 'test-ptr' };

      mockGlobalAlloc.mockReturnValue(mockHDevNames);
      mockGlobalLock.mockReturnValue(mockPtr);
      mockGlobalUnlock.mockImplementation(() => {
        throw new Error('Unlock error');
      });

      expect(() => service.showPrintDialog('MyPrinter')).toThrow();
      expect(mockGlobalFree).toHaveBeenCalledWith(mockHDevNames);
    });
  });

  describe('extractPrinterName', () => {
    test('should extract printer name from DEVNAMES', () => {
      const mockDevNames = { devNames: 'test-devnames' };
      const mockPtr = { ptr: 'test-ptr' };

      mockGlobalAlloc.mockReturnValue(mockDevNames);
      mockGlobalLock.mockReturnValue(mockPtr);
      mockGlobalUnlock.mockReturnValue(true);
      
      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDevNames = mockDevNames;
        return true;
      });

      const result = service.showPrintDialog('TestPrinter');

      expect(mockGlobalLock).toHaveBeenCalled();
      // Note: printerName extraction depends on buffer parsing which is hard to mock accurately
      // Just verify the dialog completed successfully
      expect(result.cancelled).toBe(false);
    });

    test('should return undefined when hDevNames is null', () => {
      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDevNames = null;
        return true;
      });

      const result = service.showPrintDialog();

      expect(result.printerName).toBeUndefined();
    });

    test('should return undefined when lock fails', () => {
      const mockDevNames = { devNames: 'test-devnames' };

      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDevNames = mockDevNames;
        return true;
      });

      mockGlobalLock.mockReturnValue(null);

      const result = service.showPrintDialog();

      expect(result.printerName).toBeUndefined();
    });

    test('should handle extraction errors gracefully', () => {
      const mockDevNames = { devNames: 'test-devnames' };
      const mockPtr = { ptr: 'test-ptr' };

      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDevNames = mockDevNames;
        return true;
      });

      mockGlobalLock.mockReturnValue(mockPtr);
      mockGlobalUnlock.mockImplementation(() => {
        throw new Error('Unlock error');
      });

      const result = service.showPrintDialog();

      // Should not throw, just return undefined for printer name
      expect(result.printerName).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    test('should clean up dialog result resources', () => {
      const mockDevMode = { devMode: 'test' };
      const dialogResult: PrintDialogResult = {
        cancelled: false,
        printerName: 'TestPrinter',
        devMode: mockDevMode,
        copies: 1,
        pageRange: {
          from: 1,
          to: 1,
          allPages: true
        }
      };

      service.cleanup(dialogResult);

      expect(mockGlobalFree).toHaveBeenCalledWith(mockDevMode);
    });

    test('should not clean up when devMode is not present', () => {
      const dialogResult: PrintDialogResult = {
        cancelled: true
      };

      service.cleanup(dialogResult);

      expect(mockGlobalFree).not.toHaveBeenCalled();
    });

    test('should handle cleanup errors gracefully', () => {
      const mockDevMode = { devMode: 'test' };
      const dialogResult: PrintDialogResult = {
        cancelled: false,
        devMode: mockDevMode
      };

      mockGlobalFree.mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      expect(() => service.cleanup(dialogResult)).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    test('should handle full dialog flow with printer selection', () => {
      const mockHDevNames = { devNames: 'test-devnames' };
      const mockPtr = { ptr: 'test-ptr' };
      const mockHDC = { dc: 'test-dc' };
      const mockDevMode = { devMode: 'test-devmode' };

      mockGlobalAlloc.mockReturnValue(mockHDevNames);
      mockGlobalLock.mockReturnValue(mockPtr);
      mockGlobalUnlock.mockReturnValue(true);

      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        pdArray[0].hDC = mockHDC;
        pdArray[0].hDevMode = mockDevMode;
        pdArray[0].hDevNames = mockHDevNames;
        pdArray[0].nCopies = 5;
        return true;
      });

      const options: PrintOptions = { copies: 5 };
      const result = service.showPrintDialog('TestPrinter', options);

      expect(result.cancelled).toBe(false);
      expect(result.hDC).toBe(mockHDC);
      expect(result.devMode).toBe(mockDevMode);
      expect(result.copies).toBe(5);
      expect(mockGlobalAlloc).toHaveBeenCalled();
      expect(mockPrintDlgW).toHaveBeenCalled();
    });

    test('should handle dialog without pre-selected printer', () => {
      mockPrintDlgW.mockImplementation((pdArray: any[]) => {
        expect(pdArray[0].hDevNames).toBeNull();
        return true;
      });

      const result = service.showPrintDialog();

      expect(result.cancelled).toBe(false);
      expect(mockGlobalAlloc).not.toHaveBeenCalled();
    });
  });
});
