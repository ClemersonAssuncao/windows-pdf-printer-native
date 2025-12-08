// PDF Rendering Service using PDFium with performance optimizations
import type * as PdfiumAPI from '../api/pdfium.api';
import { createLogger, type Logger } from '../../../core/logger';

export interface RenderOptions {
  width: number;
  height: number;
  maintainAspectRatio?: boolean;
  backgroundColor?: number;
}

export interface RenderedPage {
  buffer: any;
  width: number;
  height: number;
  stride: number;
  _bitmap?: any;  // Internal: bitmap handle for cleanup
}

// Singleton instance for PDFium (expensive to init/destroy)
let globalPdfiumInstance: typeof PdfiumAPI | null = null;
let globalInitCount = 0;

export class PdfRenderService {
  private pdfium: typeof PdfiumAPI | null = null;
  private isInitialized = false;
  private pageCache: Map<string, RenderedPage> = new Map();
  private cacheEnabled = true;
  private logger: Logger;

  constructor() {
    this.logger = createLogger({ context: 'PdfRender' });
  }

  /**
   * Initialize PDFium library (using singleton for performance)
   */
  async initialize(): Promise<void> {
    const timer = this.logger.startTimer('PdfRenderService.initialize()');
    
    if (this.isInitialized) {
      this.logger.debug('PDFium already initialized');
      return;
    }

    // Use singleton PDFium instance
    if (!globalPdfiumInstance) {
      const loadTimer = this.logger.startTimer('PDFium module load');
      globalPdfiumInstance = await import('../api/pdfium.api');
      this.logger.endTimer(loadTimer);

      if (!globalPdfiumInstance.isPDFiumAvailable()) {
        const error = new Error(
          'PDFium library not found. Please download pdfium.dll from:\n' +
          'https://github.com/bblanchon/pdfium-binaries/releases\n' +
          'and place it in the bin/ directory of your project.'
        );
        this.logger.error('PDFium library not available', error);
        throw error;
      }

      // Initialize PDFium only once globally
      const initTimer = this.logger.startTimer('PDFium library initialization');
      globalPdfiumInstance.FPDF_InitLibrary();
      this.logger.endTimer(initTimer);
    }

    this.pdfium = globalPdfiumInstance;
    globalInitCount++;
    this.isInitialized = true;
    
    this.logger.endTimer(timer);
    this.logger.debug(`PDFium reference count: ${globalInitCount}`);
  }

  /**
   * Enable or disable page caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.logger.debug(`Page caching ${enabled ? 'enabled' : 'disabled'}`);
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Cleanup PDFium library (using reference counting for singleton)
   */
  cleanup(): void {
    if (this.isInitialized) {
      globalInitCount--;
      this.logger.debug(`Cleaning up PDFium instance (refCount: ${globalInitCount})`);
      
      // Clear this instance's cache
      this.clearCache();
      
      // Only destroy PDFium when no more instances are using it
      if (globalInitCount <= 0 && globalPdfiumInstance) {
        this.logger.debug('Destroying global PDFium instance');
        globalPdfiumInstance.FPDF_DestroyLibrary();
        globalPdfiumInstance = null;
        globalInitCount = 0;
      }
      
      this.isInitialized = false;
      this.pdfium = null;
    }
  }

  /**
   * Clear page cache
   */
  clearCache(): void {
    const cacheSize = this.pageCache.size;
    if (cacheSize > 0) {
      this.logger.debug(`Clearing page cache (${cacheSize} pages)`);
    }
    
    // Cleanup all cached bitmaps
    for (const page of this.pageCache.values()) {
      if (page._bitmap && this.pdfium) {
        this.pdfium.FPDFBitmap_Destroy(page._bitmap);
      }
    }
    this.pageCache.clear();
  }

  /**
   * Cleanup rendered page bitmap
   */
  cleanupRenderedPage(renderedPage: RenderedPage): void {
    if (renderedPage._bitmap && this.pdfium) {
      this.pdfium.FPDFBitmap_Destroy(renderedPage._bitmap);
      delete renderedPage._bitmap;
    }
  }

  /**
   * Load PDF document from buffer
   */
  loadDocument(pdfData: Buffer): any {
    const timer = this.logger.startTimer('PDF document load');
    
    if (!this.pdfium) {
      const error = new Error('PDFium not initialized. Call initialize() first.');
      this.logger.error('Cannot load document', error);
      throw error;
    }

    const pdfDoc = this.pdfium.FPDF_LoadMemDocument(pdfData, pdfData.length, null);
    if (!pdfDoc) {
      const errorCode = this.pdfium.FPDF_GetLastError();
      const error = new Error(`Failed to load PDF document. PDFium error code: ${errorCode}`);
      this.logger.error('PDF load failed', error);
      throw error;
    }

    this.logger.endTimer(timer);
    this.logger.debug(`PDF size: ${(pdfData.length / 1024).toFixed(2)}KB`);

    return pdfDoc;
  }

  /**
   * Close PDF document
   */
  closeDocument(pdfDoc: any): void {
    if (this.pdfium) {
      this.logger.debug('Closing PDF document');
      this.pdfium.FPDF_CloseDocument(pdfDoc);
    }
  }

  /**
   * Get page count from document
   */
  getPageCount(pdfDoc: any): number {
    if (!this.pdfium) {
      const error = new Error('PDFium not initialized');
      this.logger.error('Cannot get page count', error);
      throw error;
    }

    const pageCount = this.pdfium.FPDF_GetPageCount(pdfDoc);
    if (pageCount <= 0) {
      const error = new Error('PDF document has no pages');
      this.logger.error('Invalid PDF document', error);
      throw error;
    }

    this.logger.debug(`PDF has ${pageCount} page(s)`);
    return pageCount;
  }

  /**
   * Render a single PDF page to bitmap with caching
   */
  renderPage(
    pdfDoc: any,
    pageIndex: number,
    options: RenderOptions
  ): RenderedPage {
    const timer = this.logger.startTimer(`renderPage(${pageIndex})`);
    
    if (!this.pdfium) {
      const error = new Error('PDFium not initialized');
      this.logger.error('Cannot render page', error);
      throw error;
    }

    // Check cache if enabled
    const cacheKey = `${pageIndex}_${options.width}_${options.height}`;
    if (this.cacheEnabled && this.pageCache.has(cacheKey)) {
      this.logger.endTimer(timer);
      this.logger.debug(`Page ${pageIndex} retrieved from cache`);
      return this.pageCache.get(cacheKey)!;
    }

    // Load the page
    const pageLoadTimer = this.logger.startTimer(`Page ${pageIndex} load`);
    const page = this.pdfium.FPDF_LoadPage(pdfDoc, pageIndex);
    if (!page) {
      const error = new Error(`Failed to load page ${pageIndex + 1}`);
      this.logger.error('Page load failed', error);
      throw error;
    }
    this.logger.endTimer(pageLoadTimer);

    try {
      // Get page dimensions in points (1/72 inch)
      const pageWidth = this.pdfium.FPDF_GetPageWidth(page);
      const pageHeight = this.pdfium.FPDF_GetPageHeight(page);

      // Calculate render size
      let renderWidth = options.width;
      let renderHeight = options.height;

      if (options.maintainAspectRatio !== false) {
        const pageAspect = pageWidth / pageHeight;
        const targetAspect = options.width / options.height;

        if (pageAspect > targetAspect) {
          // Page is wider - fit to width
          renderHeight = Math.floor(options.width / pageAspect);
        } else {
          // Page is taller - fit to height
          renderWidth = Math.floor(options.height * pageAspect);
        }
      }

      // Create bitmap for rendering (BGRA format for Windows)
      const bitmapTimer = this.logger.startTimer(`Bitmap creation (${renderWidth}x${renderHeight})`);
      const bitmap = this.pdfium.FPDFBitmap_Create(
        renderWidth,
        renderHeight,
        this.pdfium.FPDFBitmap_BGRA
      );

      if (!bitmap) {
        const error = new Error('Failed to create bitmap');
        this.logger.error('Bitmap creation failed', error);
        throw error;
      }
      this.logger.endTimer(bitmapTimer);

      try {
        // Fill with background color (default white)
        const fillTimer = this.logger.startTimer('Bitmap fill');
        const bgColor = options.backgroundColor ?? 0xFFFFFFFF;
        this.pdfium.FPDFBitmap_FillRect(bitmap, 0, 0, renderWidth, renderHeight, bgColor);
        this.logger.endTimer(fillTimer);

        // Render PDF page to bitmap
        const renderTimer = this.logger.startTimer(`Page ${pageIndex} render to bitmap`);
        this.pdfium.FPDF_RenderPageBitmap(
          bitmap,
          page,
          0,              // start_x
          0,              // start_y
          renderWidth,    // size_x
          renderHeight,   // size_y
          0,              // rotate (0 = no rotation)
          this.pdfium.FPDF_PRINTING | this.pdfium.FPDF_ANNOT  // flags
        );
        this.logger.endTimer(renderTimer);

        // Get bitmap data - we need to keep the bitmap alive until after rendering
        const buffer = this.pdfium.FPDFBitmap_GetBuffer(bitmap);
        const stride = this.pdfium.FPDFBitmap_GetStride(bitmap);

        // Create rendered page
        const renderedPage: RenderedPage = {
          buffer,
          width: renderWidth,
          height: renderHeight,
          stride,
          _bitmap: bitmap  // Keep reference to destroy later
        };

        // Cache if enabled
        if (this.cacheEnabled) {
          const cacheKey = `${pageIndex}_${options.width}_${options.height}`;
          this.pageCache.set(cacheKey, renderedPage);
          this.logger.debug(`Page ${pageIndex} cached with key: ${cacheKey}`);
        }

        this.logger.endTimer(timer);
        return renderedPage;

      } catch (error) {
        // Destroy bitmap on error
        this.pdfium.FPDFBitmap_Destroy(bitmap);
        throw error;
      }
    } finally {
      // Close page
      this.pdfium.FPDF_ClosePage(page);
    }
  }

  /**
   * Pre-render multiple pages in parallel (performance optimization)
   */
  async preRenderPages(
    pdfDoc: any,
    pageIndices: number[],
    options: RenderOptions
  ): Promise<void> {
    if (!this.cacheEnabled) {
      this.logger.debug('Pre-rendering skipped: cache is disabled');
      return; // No point pre-rendering if cache is disabled
    }

    const pagesToRender = pageIndices.filter(pageIndex => {
      const cacheKey = `${pageIndex}_${options.width}_${options.height}`;
      return !this.pageCache.has(cacheKey);
    });

    if (pagesToRender.length === 0) {
      this.logger.debug('All pages already cached, no pre-rendering needed');
      return;
    }

    this.logger.debug(`Pre-rendering ${pagesToRender.length} page(s)`);
    const timer = this.logger.startTimer(`Pre-render ${pagesToRender.length} pages`);

    // Render pages that aren't already cached
    const renderPromises = pagesToRender.map(pageIndex => 
      Promise.resolve().then(() => this.renderPage(pdfDoc, pageIndex, options))
    );

    await Promise.all(renderPromises);
    this.logger.endTimer(timer);
  }
}
