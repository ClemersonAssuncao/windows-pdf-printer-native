// PDF Rendering Service using PDFium with performance optimizations
import type * as PdfiumAPI from '../api/pdfium.api';

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

  /**
   * Initialize PDFium library (using singleton for performance)
   */
  async initialize(): Promise<void> {
    const startTime = performance.now();
    if (this.isInitialized) {
      if (process.env.DEBUG) console.log('[DEBUG] PDFium already initialized');
      return;
    }

    // Use singleton PDFium instance
    if (!globalPdfiumInstance) {
      const loadStart = performance.now();
      globalPdfiumInstance = await import('../api/pdfium.api');
      const loadTime = performance.now() - loadStart;
      if (process.env.DEBUG) console.log(`[DEBUG] PDFium module loaded in ${loadTime.toFixed(2)}ms`);

      if (!globalPdfiumInstance.isPDFiumAvailable()) {
        throw new Error(
          'PDFium library not found. Please download pdfium.dll from:\n' +
          'https://github.com/bblanchon/pdfium-binaries/releases\n' +
          'and place it in the bin/ directory of your project.'
        );
      }

      // Initialize PDFium only once globally
      const initStart = performance.now();
      globalPdfiumInstance.FPDF_InitLibrary();
      const initTime = performance.now() - initStart;
      if (process.env.DEBUG) console.log(`[DEBUG] PDFium library initialized in ${initTime.toFixed(2)}ms`);
    }

    this.pdfium = globalPdfiumInstance;
    globalInitCount++;
    this.isInitialized = true;
    
    const totalTime = performance.now() - startTime;
    if (process.env.DEBUG) console.log(`[DEBUG] PdfRenderService.initialize() completed in ${totalTime.toFixed(2)}ms (refCount: ${globalInitCount})`);
  }

  /**
   * Enable or disable page caching
   */
  setCacheEnabled(enabled: boolean): void {
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
      
      // Clear this instance's cache
      this.clearCache();
      
      // Only destroy PDFium when no more instances are using it
      if (globalInitCount <= 0 && globalPdfiumInstance) {
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
    const startTime = performance.now();
    if (!this.pdfium) {
      throw new Error('PDFium not initialized. Call initialize() first.');
    }

    const pdfDoc = this.pdfium.FPDF_LoadMemDocument(pdfData, pdfData.length, null);
    if (!pdfDoc) {
      const error = this.pdfium.FPDF_GetLastError();
      throw new Error(`Failed to load PDF document. PDFium error code: ${error}`);
    }

    const loadTime = performance.now() - startTime;
    if (process.env.DEBUG) console.log(`[DEBUG] PDF document loaded in ${loadTime.toFixed(2)}ms (size: ${(pdfData.length / 1024).toFixed(2)}KB)`);

    return pdfDoc;
  }

  /**
   * Close PDF document
   */
  closeDocument(pdfDoc: any): void {
    if (this.pdfium) {
      this.pdfium.FPDF_CloseDocument(pdfDoc);
    }
  }

  /**
   * Get page count from document
   */
  getPageCount(pdfDoc: any): number {
    if (!this.pdfium) {
      throw new Error('PDFium not initialized');
    }

    const pageCount = this.pdfium.FPDF_GetPageCount(pdfDoc);
    if (pageCount <= 0) {
      throw new Error('PDF document has no pages');
    }

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
    const startTime = performance.now();
    if (!this.pdfium) {
      throw new Error('PDFium not initialized');
    }

    // Check cache if enabled
    const cacheKey = `${pageIndex}_${options.width}_${options.height}`;
    if (this.cacheEnabled && this.pageCache.has(cacheKey)) {
      const cacheTime = performance.now() - startTime;
      if (process.env.DEBUG) console.log(`[DEBUG] Page ${pageIndex} retrieved from cache in ${cacheTime.toFixed(2)}ms`);
      return this.pageCache.get(cacheKey)!;
    }

    // Load the page
    const pageLoadStart = performance.now();
    const page = this.pdfium.FPDF_LoadPage(pdfDoc, pageIndex);
    if (!page) {
      throw new Error(`Failed to load page ${pageIndex + 1}`);
    }
    const pageLoadTime = performance.now() - pageLoadStart;
    if (process.env.DEBUG) console.log(`[DEBUG] Page ${pageIndex} loaded in ${pageLoadTime.toFixed(2)}ms`);

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
      const bitmapCreateStart = performance.now();
      const bitmap = this.pdfium.FPDFBitmap_Create(
        renderWidth,
        renderHeight,
        this.pdfium.FPDFBitmap_BGRA
      );

      if (!bitmap) {
        throw new Error('Failed to create bitmap');
      }
      const bitmapCreateTime = performance.now() - bitmapCreateStart;
      if (process.env.DEBUG) console.log(`[DEBUG] Bitmap created (${renderWidth}x${renderHeight}) in ${bitmapCreateTime.toFixed(2)}ms`);

      try {
        // Fill with background color (default white)
        const fillStart = performance.now();
        const bgColor = options.backgroundColor ?? 0xFFFFFFFF;
        this.pdfium.FPDFBitmap_FillRect(bitmap, 0, 0, renderWidth, renderHeight, bgColor);
        const fillTime = performance.now() - fillStart;
        if (process.env.DEBUG) console.log(`[DEBUG] Bitmap filled in ${fillTime.toFixed(2)}ms`);

        // Render PDF page to bitmap
        const renderStart = performance.now();
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
        const renderTime = performance.now() - renderStart;
        if (process.env.DEBUG) console.log(`[DEBUG] Page ${pageIndex} rendered to bitmap in ${renderTime.toFixed(2)}ms`);

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
          if (process.env.DEBUG) console.log(`[DEBUG] Page ${pageIndex} cached with key: ${cacheKey}`);
        }

        const totalTime = performance.now() - startTime;
        if (process.env.DEBUG) console.log(`[DEBUG] renderPage() completed for page ${pageIndex} in ${totalTime.toFixed(2)}ms`);

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
      return; // No point pre-rendering if cache is disabled
    }

    // Render pages that aren't already cached
    const renderPromises = pageIndices.map(pageIndex => {
      const cacheKey = `${pageIndex}_${options.width}_${options.height}`;
      if (!this.pageCache.has(cacheKey)) {
        return Promise.resolve().then(() => this.renderPage(pdfDoc, pageIndex, options));
      }
      return Promise.resolve();
    });

    await Promise.all(renderPromises);
  }
}
