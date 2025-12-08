/**
 * Tests for PdfRenderService
 */

import { PdfRenderService, type RenderOptions, type RenderedPage } from '../../src/adapters/windows/services/pdf-render.service';

// Mock the PDFium API module
const mockPdfiumAPI = {
  isPDFiumAvailable: jest.fn(),
  FPDF_InitLibrary: jest.fn(),
  FPDF_DestroyLibrary: jest.fn(),
  FPDF_LoadMemDocument: jest.fn(),
  FPDF_CloseDocument: jest.fn(),
  FPDF_GetPageCount: jest.fn(),
  FPDF_GetLastError: jest.fn(),
  FPDF_LoadPage: jest.fn(),
  FPDF_ClosePage: jest.fn(),
  FPDF_GetPageWidth: jest.fn(),
  FPDF_GetPageHeight: jest.fn(),
  FPDFBitmap_Create: jest.fn(),
  FPDFBitmap_Destroy: jest.fn(),
  FPDFBitmap_FillRect: jest.fn(),
  FPDFBitmap_GetBuffer: jest.fn(),
  FPDFBitmap_GetStride: jest.fn(),
  FPDF_RenderPageBitmap: jest.fn(),
  FPDFBitmap_BGRA: 4,
  FPDF_PRINTING: 0x800,
  FPDF_ANNOT: 0x01
};

jest.mock('../../src/adapters/windows/api/pdfium.api', () => mockPdfiumAPI, { virtual: true });

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

describe('PdfRenderService', () => {
  let service: PdfRenderService;

  beforeEach(() => {
    service = new PdfRenderService();
    jest.clearAllMocks();
    mockPdfiumAPI.isPDFiumAvailable.mockReturnValue(true);
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('initialize', () => {
    test('should initialize PDFium library successfully', async () => {
      await service.initialize();

      expect(mockPdfiumAPI.isPDFiumAvailable).toHaveBeenCalled();
      expect(mockPdfiumAPI.FPDF_InitLibrary).toHaveBeenCalled();
    });

    test('should throw error when PDFium is not available', async () => {
      mockPdfiumAPI.isPDFiumAvailable.mockReturnValue(false);

      await expect(service.initialize()).rejects.toThrow('PDFium library not found');
      expect(mockPdfiumAPI.FPDF_InitLibrary).not.toHaveBeenCalled();
    });

    test('should not reinitialize if already initialized', async () => {
      const callsBefore = mockPdfiumAPI.FPDF_InitLibrary.mock.calls.length;
      await service.initialize();
      await service.initialize();
      const callsAfter = mockPdfiumAPI.FPDF_InitLibrary.mock.calls.length;

      // Should only call init once more (not twice)
      expect(callsAfter - callsBefore).toBeLessThanOrEqual(1);
    });

    test('should use singleton instance for multiple services', async () => {
      const service2 = new PdfRenderService();

      await service.initialize();
      await service2.initialize();

      expect(mockPdfiumAPI.FPDF_InitLibrary).toHaveBeenCalledTimes(1);

      service2.cleanup();
    });
  });

  describe('cleanup', () => {
    test('should cleanup and destroy PDFium when last instance is cleaned up', async () => {
      await service.initialize();
      service.cleanup();

      expect(mockPdfiumAPI.FPDF_DestroyLibrary).toHaveBeenCalled();
    });

    test('should not destroy PDFium if other instances are still using it', async () => {
      const service2 = new PdfRenderService();

      await service.initialize();
      await service2.initialize();

      service.cleanup();

      expect(mockPdfiumAPI.FPDF_DestroyLibrary).not.toHaveBeenCalled();

      service2.cleanup();
      expect(mockPdfiumAPI.FPDF_DestroyLibrary).toHaveBeenCalled();
    });

    test('should clear page cache on cleanup', async () => {
      await service.initialize();
      
      const mockBitmap = { bitmap: 'test' };
      mockPdfiumAPI.FPDFBitmap_Destroy.mockReturnValue(true);

      // Manually add to cache for testing
      const renderedPage: RenderedPage = {
        buffer: Buffer.from('test'),
        width: 100,
        height: 100,
        stride: 400,
        _bitmap: mockBitmap
      };
      (service as any).pageCache.set('test-key', renderedPage);

      service.cleanup();

      expect(mockPdfiumAPI.FPDFBitmap_Destroy).toHaveBeenCalledWith(mockBitmap);
    });
  });

  describe('setCacheEnabled', () => {
    test('should enable caching', () => {
      service.setCacheEnabled(true);
      expect((service as any).cacheEnabled).toBe(true);
    });

    test('should disable caching and clear cache', async () => {
      await service.initialize();
      service.setCacheEnabled(true);
      
      const mockBitmap = { bitmap: 'test' };
      const renderedPage: RenderedPage = {
        buffer: Buffer.from('test'),
        width: 100,
        height: 100,
        stride: 400,
        _bitmap: mockBitmap
      };
      (service as any).pageCache.set('test-key', renderedPage);

      service.setCacheEnabled(false);

      expect((service as any).cacheEnabled).toBe(false);
      expect((service as any).pageCache.size).toBe(0);
      expect(mockPdfiumAPI.FPDFBitmap_Destroy).toHaveBeenCalledWith(mockBitmap);
    });
  });

  describe('loadDocument', () => {
    test('should load PDF document successfully', async () => {
      await service.initialize();

      const mockDoc = { doc: 'test-doc' };
      const pdfData = Buffer.from('test-pdf-data');
      mockPdfiumAPI.FPDF_LoadMemDocument.mockReturnValue(mockDoc);

      const result = service.loadDocument(pdfData);

      expect(result).toBe(mockDoc);
      expect(mockPdfiumAPI.FPDF_LoadMemDocument).toHaveBeenCalledWith(pdfData, pdfData.length, null);
    });

    test('should throw error when PDFium not initialized', () => {
      const pdfData = Buffer.from('test-pdf-data');

      expect(() => service.loadDocument(pdfData)).toThrow('PDFium not initialized');
    });

    test('should throw error when PDF loading fails', async () => {
      await service.initialize();

      const pdfData = Buffer.from('test-pdf-data');
      mockPdfiumAPI.FPDF_LoadMemDocument.mockReturnValue(null);
      mockPdfiumAPI.FPDF_GetLastError.mockReturnValue(1);

      expect(() => service.loadDocument(pdfData)).toThrow('Failed to load PDF document');
    });
  });

  describe('closeDocument', () => {
    test('should close PDF document and clear cache', async () => {
      await service.initialize();

      const mockDoc = { doc: 'test-doc' };
      const mockBitmap = { bitmap: 'test' };
      
      const renderedPage: RenderedPage = {
        buffer: Buffer.from('test'),
        width: 100,
        height: 100,
        stride: 400,
        _bitmap: mockBitmap
      };
      (service as any).pageCache.set('test-key', renderedPage);

      service.closeDocument(mockDoc);

      expect(mockPdfiumAPI.FPDF_CloseDocument).toHaveBeenCalledWith(mockDoc);
      expect((service as any).pageCache.size).toBe(0);
    });
  });

  describe('getPageCount', () => {
    test('should return page count', async () => {
      await service.initialize();

      const mockDoc = { doc: 'test-doc' };
      mockPdfiumAPI.FPDF_GetPageCount.mockReturnValue(5);

      const result = service.getPageCount(mockDoc);

      expect(result).toBe(5);
      expect(mockPdfiumAPI.FPDF_GetPageCount).toHaveBeenCalledWith(mockDoc);
    });

    test('should throw error when PDFium not initialized', () => {
      const mockDoc = { doc: 'test-doc' };

      expect(() => service.getPageCount(mockDoc)).toThrow('PDFium not initialized');
    });

    test('should throw error when page count is zero or negative', async () => {
      await service.initialize();

      const mockDoc = { doc: 'test-doc' };
      mockPdfiumAPI.FPDF_GetPageCount.mockReturnValue(0);

      expect(() => service.getPageCount(mockDoc)).toThrow('PDF document has no pages');
    });
  });

  const setupMocksForRender = () => {
    const mockDoc = { doc: 'test-doc' };
    const mockPage = { page: 'test-page' };
    const mockBitmap = { bitmap: 'test-bitmap' };
    const mockBuffer = Buffer.from('test-buffer');

    mockPdfiumAPI.FPDF_LoadPage.mockReturnValue(mockPage);
    mockPdfiumAPI.FPDF_GetPageWidth.mockReturnValue(612); // 8.5 inches at 72 DPI
    mockPdfiumAPI.FPDF_GetPageHeight.mockReturnValue(792); // 11 inches at 72 DPI
    mockPdfiumAPI.FPDFBitmap_Create.mockReturnValue(mockBitmap);
    mockPdfiumAPI.FPDFBitmap_GetBuffer.mockReturnValue(mockBuffer);
    mockPdfiumAPI.FPDFBitmap_GetStride.mockReturnValue(400);

    return { mockDoc, mockPage, mockBitmap, mockBuffer };
  };

  describe('renderPage', () => {

    test('should render page successfully', async () => {
      await service.initialize();
      const { mockDoc } = setupMocksForRender();

      const options: RenderOptions = {
        width: 100,
        height: 100
      };

      const result = service.renderPage(mockDoc, 0, options);

      expect(result).toMatchObject({
        width: expect.any(Number),
        height: expect.any(Number),
        stride: 400,
        buffer: expect.any(Buffer)
      });
      expect(mockPdfiumAPI.FPDF_LoadPage).toHaveBeenCalledWith(mockDoc, 0);
      expect(mockPdfiumAPI.FPDF_RenderPageBitmap).toHaveBeenCalled();
      expect(mockPdfiumAPI.FPDF_ClosePage).toHaveBeenCalled();
    });

    test('should throw error when PDFium not initialized', () => {
      const mockDoc = { doc: 'test-doc' };
      const options: RenderOptions = { width: 100, height: 100 };

      expect(() => service.renderPage(mockDoc, 0, options)).toThrow('PDFium not initialized');
    });

    test('should throw error when page loading fails', async () => {
      await service.initialize();
      const mockDoc = { doc: 'test-doc' };
      mockPdfiumAPI.FPDF_LoadPage.mockReturnValue(null);

      const options: RenderOptions = { width: 100, height: 100 };

      expect(() => service.renderPage(mockDoc, 0, options)).toThrow('Failed to load page 1');
    });

    test('should maintain aspect ratio by default', async () => {
      await service.initialize();
      const { mockDoc } = setupMocksForRender();

      const options: RenderOptions = {
        width: 200,
        height: 200
      };

      service.renderPage(mockDoc, 0, options);

      // Page is 612x792 (portrait), aspect ratio ~0.77
      // Should fit to width and adjust height
      expect(mockPdfiumAPI.FPDFBitmap_Create).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        mockPdfiumAPI.FPDFBitmap_BGRA
      );
    });

    test('should disable aspect ratio when specified', async () => {
      await service.initialize();
      const { mockDoc } = setupMocksForRender();

      const options: RenderOptions = {
        width: 200,
        height: 150,
        maintainAspectRatio: false
      };

      service.renderPage(mockDoc, 0, options);

      expect(mockPdfiumAPI.FPDFBitmap_Create).toHaveBeenCalledWith(
        200,
        150,
        mockPdfiumAPI.FPDFBitmap_BGRA
      );
    });

    test('should use custom background color', async () => {
      await service.initialize();
      const { mockDoc } = setupMocksForRender();

      const options: RenderOptions = {
        width: 100,
        height: 100,
        backgroundColor: 0xFF0000FF // Red
      };

      service.renderPage(mockDoc, 0, options);

      expect(mockPdfiumAPI.FPDFBitmap_FillRect).toHaveBeenCalledWith(
        expect.anything(),
        0,
        0,
        expect.any(Number),
        expect.any(Number),
        0xFF0000FF
      );
    });

    test('should cache rendered page when caching is enabled', async () => {
      await service.initialize();
      service.setCacheEnabled(true);
      const { mockDoc } = setupMocksForRender();

      const options: RenderOptions = { width: 100, height: 100 };

      const result1 = service.renderPage(mockDoc, 0, options);
      const result2 = service.renderPage(mockDoc, 0, options);

      expect(result1).toBe(result2);
      expect(mockPdfiumAPI.FPDF_LoadPage).toHaveBeenCalledTimes(1);
    });

    test('should not cache when caching is disabled', async () => {
      await service.initialize();
      service.setCacheEnabled(false);
      const { mockDoc } = setupMocksForRender();

      const options: RenderOptions = { width: 100, height: 100 };

      service.renderPage(mockDoc, 0, options);
      service.renderPage(mockDoc, 0, options);

      expect(mockPdfiumAPI.FPDF_LoadPage).toHaveBeenCalledTimes(2);
    });

    test('should destroy bitmap on rendering error', async () => {
      await service.initialize();
      const mockDoc = { doc: 'test-doc' };
      const mockPage = { page: 'test-page' };
      const mockBitmap = { bitmap: 'test-bitmap' };

      mockPdfiumAPI.FPDF_LoadPage.mockReturnValue(mockPage);
      mockPdfiumAPI.FPDF_GetPageWidth.mockReturnValue(612);
      mockPdfiumAPI.FPDF_GetPageHeight.mockReturnValue(792);
      mockPdfiumAPI.FPDFBitmap_Create.mockReturnValue(mockBitmap);
      mockPdfiumAPI.FPDFBitmap_FillRect.mockImplementation(() => {
        throw new Error('Render error');
      });

      const options: RenderOptions = { width: 100, height: 100 };

      expect(() => service.renderPage(mockDoc, 0, options)).toThrow('Render error');
      expect(mockPdfiumAPI.FPDFBitmap_Destroy).toHaveBeenCalledWith(mockBitmap);
      expect(mockPdfiumAPI.FPDF_ClosePage).toHaveBeenCalledWith(mockPage);
    });
  });

  describe('cleanupRenderedPage', () => {
    test('should cleanup rendered page bitmap', async () => {
      await service.initialize();
      
      const mockBitmap = { bitmap: 'test' };
      const renderedPage: RenderedPage = {
        buffer: Buffer.from('test'),
        width: 100,
        height: 100,
        stride: 400,
        _bitmap: mockBitmap
      };

      service.cleanupRenderedPage(renderedPage);

      expect(mockPdfiumAPI.FPDFBitmap_Destroy).toHaveBeenCalledWith(mockBitmap);
      expect(renderedPage._bitmap).toBeUndefined();
    });

    test('should handle cleanup when no bitmap present', async () => {
      await service.initialize();
      
      const renderedPage: RenderedPage = {
        buffer: Buffer.from('test'),
        width: 100,
        height: 100,
        stride: 400
      };

      expect(() => service.cleanupRenderedPage(renderedPage)).not.toThrow();
    });
  });

  describe('getCacheKey', () => {
    test('should generate cache key from page index and dimensions', () => {
      const key = service.getCacheKey(5, 800, 600);
      expect(key).toBe('5_800_600');
    });
  });

  describe('preRenderPages', () => {
    test('should pre-render multiple pages', async () => {
      await service.initialize();
      service.setCacheEnabled(true);
      
      const mockDoc = { doc: 'test-doc' };
      const mockPage = { page: 'test-page' };
      const mockBitmap = { bitmap: 'test-bitmap' };
      const mockBuffer = Buffer.from('test-buffer');

      mockPdfiumAPI.FPDF_LoadPage.mockReturnValue(mockPage);
      mockPdfiumAPI.FPDF_GetPageWidth.mockReturnValue(612);
      mockPdfiumAPI.FPDF_GetPageHeight.mockReturnValue(792);
      mockPdfiumAPI.FPDFBitmap_Create.mockReturnValue(mockBitmap);
      mockPdfiumAPI.FPDFBitmap_FillRect.mockReturnValue(undefined);
      mockPdfiumAPI.FPDFBitmap_GetBuffer.mockReturnValue(mockBuffer);
      mockPdfiumAPI.FPDFBitmap_GetStride.mockReturnValue(400);
      mockPdfiumAPI.FPDF_RenderPageBitmap.mockReturnValue(undefined);

      const options: RenderOptions = { width: 100, height: 100 };
      const loadPageCallsBefore = mockPdfiumAPI.FPDF_LoadPage.mock.calls.length;

      await service.preRenderPages(mockDoc, [0, 1, 2], options);

      expect(mockPdfiumAPI.FPDF_LoadPage.mock.calls.length - loadPageCallsBefore).toBe(3);
    });

    test('should skip pre-rendering when cache is disabled', async () => {
      await service.initialize();
      service.setCacheEnabled(false);
      const mockDoc = { doc: 'test-doc' };

      const options: RenderOptions = { width: 100, height: 100 };

      await service.preRenderPages(mockDoc, [0, 1, 2], options);

      expect(mockPdfiumAPI.FPDF_LoadPage).not.toHaveBeenCalled();
    });

    test('should skip already cached pages', async () => {
      await service.initialize();
      service.setCacheEnabled(true);
      
      const mockDoc = { doc: 'test-doc' };
      const mockPage = { page: 'test-page' };
      const mockBitmap = { bitmap: 'test-bitmap' };
      const mockBuffer = Buffer.from('test-buffer');

      mockPdfiumAPI.FPDF_LoadPage.mockReturnValue(mockPage);
      mockPdfiumAPI.FPDF_GetPageWidth.mockReturnValue(612);
      mockPdfiumAPI.FPDF_GetPageHeight.mockReturnValue(792);
      mockPdfiumAPI.FPDFBitmap_Create.mockReturnValue(mockBitmap);
      mockPdfiumAPI.FPDFBitmap_FillRect.mockReturnValue(undefined);
      mockPdfiumAPI.FPDFBitmap_GetBuffer.mockReturnValue(mockBuffer);
      mockPdfiumAPI.FPDFBitmap_GetStride.mockReturnValue(400);
      mockPdfiumAPI.FPDF_RenderPageBitmap.mockReturnValue(undefined);

      const options: RenderOptions = { width: 100, height: 100 };

      // Pre-render page 0
      service.renderPage(mockDoc, 0, options);
      const loadPageCallsBefore = mockPdfiumAPI.FPDF_LoadPage.mock.calls.length;

      // Pre-render pages 0, 1, 2 (0 is already cached)
      await service.preRenderPages(mockDoc, [0, 1, 2], options);

      expect(mockPdfiumAPI.FPDF_LoadPage.mock.calls.length - loadPageCallsBefore).toBe(2); // Only pages 1 and 2
    });

    test('should handle empty page array', async () => {
      await service.initialize();
      const mockDoc = { doc: 'test-doc' };
      const options: RenderOptions = { width: 100, height: 100 };

      await expect(service.preRenderPages(mockDoc, [], options)).resolves.not.toThrow();
    });
  });

  describe('clearCache', () => {
    test('should clear all cached pages', async () => {
      await service.initialize();
      service.setCacheEnabled(true);
      
      const mockBitmap1 = { bitmap: 'test1' };
      const mockBitmap2 = { bitmap: 'test2' };
      
      (service as any).pageCache.set('key1', { 
        buffer: Buffer.from('test1'), width: 100, height: 100, stride: 400, _bitmap: mockBitmap1 
      });
      (service as any).pageCache.set('key2', { 
        buffer: Buffer.from('test2'), width: 100, height: 100, stride: 400, _bitmap: mockBitmap2 
      });

      service.clearCache();

      expect((service as any).pageCache.size).toBe(0);
      expect(mockPdfiumAPI.FPDFBitmap_Destroy).toHaveBeenCalledWith(mockBitmap1);
      expect(mockPdfiumAPI.FPDFBitmap_Destroy).toHaveBeenCalledWith(mockBitmap2);
    });
  });
});
