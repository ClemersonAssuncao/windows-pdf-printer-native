// Windows Printer Adapter - implements IPrinter interface using GDI for printing
import type { IPrinter } from '../../core/interfaces';
import { PrintQuality, type PrintOptions } from '../../core/types';
import { createLogger, type Logger } from '../../core/logger';
import * as fs from 'fs';
import * as path from 'path';
import koffi from 'koffi';
import {
  // GDI functions for printing
  CreateDCW,
  DeleteDC,
  StartDocW,
  EndDoc,
  StartPage,
  EndPage,
  StretchDIBits,
  GetDeviceCaps,
  HORZRES,
  VERTRES,
  LOGPIXELSX,
  LOGPIXELSY,
  BITMAPINFOHEADER,
  BI_RGB,
  DIB_RGB_COLORS,
  SRCCOPY,
  GetLastError
} from './api';
import { WindowsPrinterManagerAdapter } from './windows-printer-manager.adapter';
import { PdfRenderService } from './services/pdf-render.service';
import { DevModeConfigService } from './services/devmode-config.service';
import { PrintDialogService } from './services/print-dialog.service';

export class WindowsPrinterAdapter implements IPrinter {
  private printerName: string;
  private pdfRenderService: PdfRenderService;
  private devModeConfigService: DevModeConfigService;
  private printDialogService: PrintDialogService;
  private logger: Logger;
  
  constructor(printerName?: string) {
    this.logger = createLogger({ context: 'WindowsPrinter' });
    const manager = new WindowsPrinterManagerAdapter();
    
    if (printerName) {
      if (!manager.printerExists(printerName)) {
        const error = new Error(`Printer not found: ${printerName}`);
        this.logger.error('Printer not found', error);
        throw error;
      }
      this.printerName = printerName;
      this.logger.info(`Using specified printer: ${printerName}`);
    } else {
      const defaultPrinter = manager.getDefaultPrinter();
      if (!defaultPrinter) {
        const error = new Error('No default printer found');
        this.logger.error('No default printer available', error);
        throw error;
      }
      this.printerName = defaultPrinter;
      this.logger.info(`Using default printer: ${defaultPrinter}`);
    }
    
    // Initialize services
    this.pdfRenderService = new PdfRenderService();
    this.devModeConfigService = new DevModeConfigService();
    this.printDialogService = new PrintDialogService();
  }
  
  async print(pdfPath: string, options?: PrintOptions): Promise<void> {
    this.logger.info(`Print request for: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      const error = new Error(`PDF file not found: ${pdfPath}`);
      this.logger.error('PDF file not found', error);
      throw error;
    }
    
    const pdfData = fs.readFileSync(pdfPath);
    this.logger.debug(`PDF file read: ${(pdfData.length / 1024).toFixed(2)}KB`);
    
    const documentName = options?.printer || path.basename(pdfPath);
    
    return this.printRaw(pdfData, documentName, options);
  }
  
  async printRaw(data: Buffer, documentName: string = 'Document', options?: PrintOptions): Promise<void> {
    const printerName = options?.printer || this.printerName;
    return this.printWithRawData(printerName, data, documentName, options);
  }
  
  /**
   * Print using GDI (Graphics Device Interface) with PDFium for PDF rendering
   */
  private async printWithRawData(
    printerName: string,
    data: Buffer,
    documentName: string,
    options?: PrintOptions
  ): Promise<void> {
    const timer = this.logger.startTimer('printWithRawData()');
    this.logger.debug(`Starting print job for printer: ${printerName}`);
    
    // Show print dialog if requested
    let finalPrinterName = printerName;
    let finalOptions = options;
    let dialogDC: any = null;
    let dialogDevMode: any = null;
    
    if (options?.showPrintDialog) {
      this.logger.debug('Showing print dialog...');
      
      const dialogResult = this.printDialogService.showPrintDialog(printerName, options);
      
      if (dialogResult.cancelled) {
        this.logger.info('Print dialog cancelled by user');
        return; // User cancelled, don't print
      }
      
      // Use settings from dialog
      if (dialogResult.printerName) {
        finalPrinterName = dialogResult.printerName;
      }
      
      // Store dialog DC and devMode for later use
      dialogDC = dialogResult.hDC;
      dialogDevMode = dialogResult.devMode;
      
      // Update options with user selections including page range
      finalOptions = {
        ...options,
        copies: dialogResult.copies || options?.copies,
        printer: finalPrinterName,
        pageRange: dialogResult.pageRange
      };
      
      this.logger.info(`Print dialog confirmed - using printer: ${finalPrinterName}`);
      if (dialogResult.pageRange && !dialogResult.pageRange.allPages) {
        this.logger.debug(`Page range: ${dialogResult.pageRange.from} to ${dialogResult.pageRange.to}`);
      }
    }
    
    // Initialize PDF rendering service
    await this.pdfRenderService.initialize();
    
    try {
      // Load PDF document
      const pdfDoc = this.pdfRenderService.loadDocument(data);
      
      try {
        // Get page count
        const pageCount = this.pdfRenderService.getPageCount(pdfDoc);
        
        // Get DEVMODE settings (unless using dialog DC)
        let devMode = dialogDevMode;
        let hDC = dialogDC;
        
        if (!hDC) {
          // No dialog DC, create manually
          devMode = this.devModeConfigService.getDevModeWithSettings(finalPrinterName, finalOptions);
          
          // Create Device Context for the printer
          const dcTimer = this.logger.startTimer('Device Context creation');
          hDC = CreateDCW(null, finalPrinterName, null, devMode);
          if (!hDC) {
            const error = new Error(`Failed to create device context for printer: ${finalPrinterName}`);
            this.logger.error('DC creation failed', error);
            throw error;
          }
          this.logger.endTimer(dcTimer);
        } else {
          this.logger.debug('Using Device Context from print dialog');
        }
        
        try {
          // Prepare document info
          const docInfo = {
            cbSize: 20,
            lpszDocName: documentName,
            lpszOutput: null,
            lpszDatatype: null,
            fwType: 0
          };
          
          // Start document
          const startDocTimer = this.logger.startTimer('Start document');
          const jobId = StartDocW(hDC, docInfo);
          if (jobId <= 0) {
            const error = new Error(`Failed to start document. Error: ${GetLastError()}`);
            this.logger.error('Document start failed', error);
            throw error;
          }
          this.logger.endTimer(startDocTimer);
          this.logger.info(`Print job started (jobId: ${jobId})`);
          
          try {
            const copies = finalOptions?.copies || 1;
            
            // Get printer resolution
            const printerWidth = GetDeviceCaps(hDC, HORZRES);
            const printerHeight = GetDeviceCaps(hDC, VERTRES);
            const printerDpiX = GetDeviceCaps(hDC, LOGPIXELSX);
            const printerDpiY = GetDeviceCaps(hDC, LOGPIXELSY);
            
            // Use user-specified quality or default to 300 DPI (MEDIUM)
            const renderDpi = finalOptions?.quality || PrintQuality.MEDIUM;
            this.logger.debug(`Render quality: ${renderDpi} DPI (printer DPI: ${printerDpiX}x${printerDpiY})`);
            
            // Determine page range to print
            let startPage = 0;
            let endPage = pageCount - 1;
            
            if (finalOptions?.pageRange && !finalOptions.pageRange.allPages) {
              // User selected specific page range
              startPage = Math.max(0, finalOptions.pageRange.from - 1); // Convert to 0-based index
              endPage = Math.min(pageCount - 1, finalOptions.pageRange.to - 1); // Convert to 0-based index
              this.logger.info(`Printing pages ${startPage + 1} to ${endPage + 1}`);
            }
            
            // Handle copies with respect to collate option
            const collate = finalOptions?.collate === true; // Default to false if not specified
            
            // Disable cache for multiple copies without collate to avoid buffer reuse issues
            // When collate is disabled, the same page is printed multiple times consecutively
            // and reusing the cached bitmap buffer can cause GDI corruption
            const originalCacheState = this.pdfRenderService.isCacheEnabled();
            if (copies > 1 && !collate) {
              this.logger.debug('Disabling cache for multiple copies without collate');
              this.pdfRenderService.setCacheEnabled(false);
            }
            
            try {
              if (collate) {
                // COLLATE = TRUE: Print complete sets (page1, page2, page3, page1, page2, page3)
                this.logger.debug(`Collate enabled: printing ${copies} complete set(s)`);
                for (let copy = 0; copy < copies; copy++) {
                  const copyTimer = this.logger.startTimer(`Copy ${copy + 1}/${copies}`);
                  this.logger.debug(`Starting copy ${copy + 1}/${copies}`);
                  
                  // Print each page in the range for this copy
                  for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
                    await this.printPdfPage(
                      hDC,
                      pdfDoc,
                      pageIndex,
                      printerWidth,
                      printerHeight,
                      renderDpi,
                      printerDpiX,
                      printerDpiY
                    );
                    this.logger.debug(`Page ${pageIndex + 1}/${pageCount} printed`);
                  }
                  
                  this.logger.endTimer(copyTimer);
                }
              } else {
                // COLLATE = FALSE: Print all copies of each page (page1, page1, page2, page2, page3, page3)
                this.logger.debug(`Collate disabled: printing ${copies} copy(ies) of each page`);
                for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
                  const pageTimer = this.logger.startTimer(`Page ${pageIndex + 1}/${pageCount}`);
                  this.logger.debug(`Printing ${copies} copy(ies) of page ${pageIndex + 1}`);
                  
                  // Print all copies of this page
                  for (let copy = 0; copy < copies; copy++) {
                    await this.printPdfPage(
                      hDC,
                      pdfDoc,
                      pageIndex,
                      printerWidth,
                      printerHeight,
                      renderDpi,
                      printerDpiX,
                      printerDpiY
                    );
                  }
                  
                  this.logger.debug(`Page ${pageIndex + 1}/${pageCount} completed (${copies} copies)`);
                  this.logger.endTimer(pageTimer);
                }
              }
            } finally {
              // Restore original cache state
              if (copies > 1 && !collate) {
                this.logger.debug('Restoring original cache state');
                this.pdfRenderService.setCacheEnabled(originalCacheState);
              }
            }
            
          } finally {
            // End the document
            const endDocTimer = this.logger.startTimer('End document');
            const endDocResult = EndDoc(hDC);
            if (endDocResult <= 0) {
              const error = new Error(`Failed to end document. Error: ${GetLastError()}`);
              this.logger.error('Document end failed', error);
              throw error;
            }
            this.logger.endTimer(endDocTimer);
            this.logger.info('Print job completed successfully');
          }
        } finally {
          // Clean up device context (only if we created it, not from dialog)
          if (!dialogDC) {
            this.logger.debug('Cleaning up Device Context');
            DeleteDC(hDC);
          }
        }
      } finally {
        // Close PDF document
        this.pdfRenderService.closeDocument(pdfDoc);
      }
    } finally {
      // Cleanup PDFium
      this.pdfRenderService.cleanup();
      this.logger.endTimer(timer);
    }
  }
  
  /**
   * Print a single PDF page using PDFium and GDI
   */
  private async printPdfPage(
    hDC: any,
    pdfDoc: any,
    pageIndex: number,
    printerWidth: number,
    printerHeight: number,
    renderDpi: number,
    printerDpiX: number,
    printerDpiY: number
  ): Promise<void> {
    const pageTimer = this.logger.startTimer(`printPdfPage(${pageIndex})`);
    
      // 1) largura física do papel em polegadas
      const pageWidthInches = printerWidth / printerDpiX;

      // 2) largura em pixels para o render (usa DPI de render)
      const renderWidth = Math.floor(pageWidthInches * renderDpi);

      // 3) pegar dimensões do PDF e calcular aspect ratio
      const { width: pdfW, height: pdfH } =
        this.pdfRenderService.getPageDimensions(pdfDoc, pageIndex);
      const aspectRatio = pdfW / pdfH;

      // 4) altura derivada da largura
      const renderHeight = Math.floor(renderWidth / aspectRatio);

      this.logger.debug(
        `Render size: ${renderWidth}x${renderHeight} at ${renderDpi} DPI ` +
        `(printer: ${printerWidth}x${printerHeight} at ${printerDpiX}x${printerDpiY} DPI)`
      );

      const renderedPage = this.pdfRenderService.renderPage(pdfDoc, pageIndex, {
        width: renderWidth,
        height: renderHeight,
        maintainAspectRatio: true,
        backgroundColor: 0xFFFFFFFF
      });
    
    try {
      // Start GDI page
      const startPageTimer = this.logger.startTimer('StartPage()');
      const pageResult = StartPage(hDC);
      if (pageResult <= 0) {
        const error = new Error(`Failed to start page. Error: ${GetLastError()}`);
        this.logger.error('StartPage failed', error);
        throw error;
      }
      this.logger.endTimer(startPageTimer);
      
      try {
        // Prepare BITMAPINFOHEADER
        const bmiData = {
          biSize: 40,
          biWidth: renderedPage.width,
          biHeight: -renderedPage.height,  // Negative for top-down bitmap
          biPlanes: 1,
          biBitCount: 32,  // BGRA = 32 bits
          biCompression: BI_RGB,
          biSizeImage: renderedPage.stride * renderedPage.height,
          biXPelsPerMeter: Math.floor(renderDpi * 39.37), // Convert DPI to pixels per meter
          biYPelsPerMeter: Math.floor(renderDpi * 39.37),
          biClrUsed: 0,
          biClrImportant: 0
        };
        
        // Convert to pointer
        const bmi = [bmiData];
        const bmiPtr = koffi.as(bmi, koffi.pointer(BITMAPINFOHEADER));
        
        // Scale rendered image to fit printer page maintaining aspect ratio
        const scaleX = printerWidth / renderWidth;
        const scaleY = printerHeight / renderHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = Math.floor(renderWidth * scale);
        const scaledHeight = Math.floor(renderHeight * scale);
        
        // Center the image on the page
        const offsetX = Math.floor((printerWidth - scaledWidth) / 2);
        const offsetY = Math.floor((printerHeight - scaledHeight) / 2);
        
        // Draw bitmap to printer DC using StretchDIBits for proper scaling
        const drawTimer = this.logger.startTimer(`StretchDIBits (${renderWidth}x${renderHeight} to ${scaledWidth}x${scaledHeight})`);
        const result = StretchDIBits(
          hDC,
          offsetX,                // xDest
          offsetY,                // yDest
          scaledWidth,            // DestWidth
          scaledHeight,           // DestHeight
          0,                      // xSrc
          0,                      // ySrc
          renderedPage.width,     // SrcWidth
          renderedPage.height,    // SrcHeight
          renderedPage.buffer,    // lpBits
          bmiPtr,                 // lpbmi
          DIB_RGB_COLORS,         // iUsage
          SRCCOPY                 // rop
        );
        this.logger.endTimer(drawTimer);
        
        if (result === 0) {
          const error = new Error(`Failed to draw bitmap to printer. Error: ${GetLastError()}`);
          this.logger.error('StretchDIBits failed', error);
          throw error;
        }
        
      } finally {
        // End the page
        const endPageTimer = this.logger.startTimer('EndPage()');
        const endResult = EndPage(hDC);
        if (endResult <= 0) {
          const error = new Error(`Failed to end page. Error: ${GetLastError()}`);
          this.logger.error('EndPage failed', error);
          throw error;
        }
        this.logger.endTimer(endPageTimer);
        this.logger.endTimer(pageTimer);
      }
    } finally {
      // Cleanup rendered page bitmap
      this.pdfRenderService.cleanupRenderedPage(renderedPage);
    }
  }
  
  getPrinterName(): string {
    return this.printerName;
  }

  /**
   * Enable or disable page caching for PDF rendering
   * Cache is enabled by default for better performance when printing multiple copies
   * 
   * @param enabled - true to enable cache, false to disable
   * 
   * @example
   * ```typescript
   * const printer = new PDFPrinter();
   * 
   * // Disable cache if printing many different PDFs
   * printer.setCacheEnabled(false);
   * 
   * // Re-enable cache for multiple copies of same PDF
   * printer.setCacheEnabled(true);
   * ```
   */
  setCacheEnabled(enabled: boolean): void {
    this.pdfRenderService.setCacheEnabled(enabled);
  }
}
