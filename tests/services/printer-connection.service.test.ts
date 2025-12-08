/**
 * Tests for PrinterConnectionService
 */

import { PrinterConnectionService } from '../../src/adapters/windows/services/printer-connection.service';
import * as winspoolApi from '../../src/adapters/windows/api/winspool.api';

// Mock the Windows API
jest.mock('../../src/adapters/windows/api/winspool.api', () => ({
  OpenPrinterW: jest.fn(),
  ClosePrinter: jest.fn(),
  PRINTER_ACCESS_USE: 0x00000008
}));

describe('PrinterConnectionService', () => {
  let service: PrinterConnectionService;
  let mockOpenPrinterW: jest.MockedFunction<typeof winspoolApi.OpenPrinterW>;
  let mockClosePrinter: jest.MockedFunction<typeof winspoolApi.ClosePrinter>;

  beforeEach(() => {
    service = new PrinterConnectionService();
    mockOpenPrinterW = winspoolApi.OpenPrinterW as jest.MockedFunction<typeof winspoolApi.OpenPrinterW>;
    mockClosePrinter = winspoolApi.ClosePrinter as jest.MockedFunction<typeof winspoolApi.ClosePrinter>;
    jest.clearAllMocks();
  });

  describe('openPrinter', () => {
    test('should open printer successfully', () => {
      const mockHandle = { handle: 'test-handle' };
      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[], defaults: any) => {
        hPrinter[0] = mockHandle;
        return true;
      });

      const result = service.openPrinter('TestPrinter');

      expect(result).toBe(mockHandle);
      expect(mockOpenPrinterW).toHaveBeenCalledWith(
        'TestPrinter',
        expect.any(Array),
        expect.objectContaining({
          pDatatype: null,
          pDevMode: null,
          DesiredAccess: winspoolApi.PRINTER_ACCESS_USE
        })
      );
    });

    test('should return null when OpenPrinterW fails', () => {
      mockOpenPrinterW.mockReturnValue(false);

      const result = service.openPrinter('NonExistentPrinter');

      expect(result).toBeNull();
      expect(mockOpenPrinterW).toHaveBeenCalledWith(
        'NonExistentPrinter',
        expect.any(Array),
        expect.any(Object)
      );
    });

    test('should return null when hPrinter is null', () => {
      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = null;
        return true;
      });

      const result = service.openPrinter('TestPrinter');

      expect(result).toBeNull();
    });
  });

  describe('closePrinter', () => {
    test('should close printer successfully', () => {
      const mockHandle = { handle: 'test-handle' };
      mockClosePrinter.mockReturnValue(true);

      const result = service.closePrinter(mockHandle);

      expect(result).toBe(true);
      expect(mockClosePrinter).toHaveBeenCalledWith(mockHandle);
    });

    test('should return false when hPrinter is null', () => {
      const result = service.closePrinter(null);

      expect(result).toBe(false);
      expect(mockClosePrinter).not.toHaveBeenCalled();
    });

    test('should return false when ClosePrinter fails', () => {
      const mockHandle = { handle: 'test-handle' };
      mockClosePrinter.mockReturnValue(false);

      const result = service.closePrinter(mockHandle);

      expect(result).toBe(false);
      expect(mockClosePrinter).toHaveBeenCalledWith(mockHandle);
    });
  });

  describe('withPrinter', () => {
    test('should execute callback with valid printer handle', () => {
      const mockHandle = { handle: 'test-handle' };
      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      mockClosePrinter.mockReturnValue(true);

      const callback = jest.fn((handle) => {
        expect(handle).toBe(mockHandle);
        return 'test-result';
      });

      const result = service.withPrinter('TestPrinter', callback);

      expect(result).toBe('test-result');
      expect(callback).toHaveBeenCalledWith(mockHandle);
      expect(mockOpenPrinterW).toHaveBeenCalledWith(
        'TestPrinter',
        expect.any(Array),
        expect.any(Object)
      );
      expect(mockClosePrinter).toHaveBeenCalledWith(mockHandle);
    });

    test('should return null when printer cannot be opened', () => {
      mockOpenPrinterW.mockReturnValue(false);
      const callback = jest.fn();

      const result = service.withPrinter('NonExistentPrinter', callback);

      expect(result).toBeNull();
      expect(callback).not.toHaveBeenCalled();
      expect(mockClosePrinter).not.toHaveBeenCalled();
    });

    test('should close printer even if callback throws error', () => {
      const mockHandle = { handle: 'test-handle' };
      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      mockClosePrinter.mockReturnValue(true);

      const callback = jest.fn(() => {
        throw new Error('Test error');
      });

      expect(() => {
        service.withPrinter('TestPrinter', callback);
      }).toThrow('Test error');

      expect(callback).toHaveBeenCalledWith(mockHandle);
      expect(mockClosePrinter).toHaveBeenCalledWith(mockHandle);
    });

    test('should handle callback returning different types', () => {
      const mockHandle = { handle: 'test-handle' };
      mockOpenPrinterW.mockImplementation((name: string, hPrinter: any[]) => {
        hPrinter[0] = mockHandle;
        return true;
      });
      mockClosePrinter.mockReturnValue(true);

      // Test with number
      const result1 = service.withPrinter('TestPrinter', () => 42);
      expect(result1).toBe(42);

      // Test with object
      const testObj = { key: 'value' };
      const result2 = service.withPrinter('TestPrinter', () => testObj);
      expect(result2).toBe(testObj);

      // Test with undefined
      const result3 = service.withPrinter('TestPrinter', () => undefined);
      expect(result3).toBeUndefined();

      expect(mockClosePrinter).toHaveBeenCalledTimes(3);
    });
  });

  describe('multiple operations', () => {
    test('should handle multiple open/close cycles', () => {
      const mockHandle1 = { handle: 'handle-1' };
      const mockHandle2 = { handle: 'handle-2' };
      
      mockOpenPrinterW
        .mockImplementationOnce((name: string, hPrinter: any[]) => {
          hPrinter[0] = mockHandle1;
          return true;
        })
        .mockImplementationOnce((name: string, hPrinter: any[]) => {
          hPrinter[0] = mockHandle2;
          return true;
        });
      
      mockClosePrinter.mockReturnValue(true);

      const handle1 = service.openPrinter('Printer1');
      const handle2 = service.openPrinter('Printer2');

      expect(handle1).toBe(mockHandle1);
      expect(handle2).toBe(mockHandle2);

      const closed1 = service.closePrinter(handle1);
      const closed2 = service.closePrinter(handle2);

      expect(closed1).toBe(true);
      expect(closed2).toBe(true);
      expect(mockOpenPrinterW).toHaveBeenCalledTimes(2);
      expect(mockClosePrinter).toHaveBeenCalledTimes(2);
    });
  });
});
