// Windows Printer Adapter - implements IPrinter interface using GDI for printing
import type { IPrinter } from '../../core/interfaces';
import { PrintQuality, type PrintOptions, type PrinterCapabilities } from '../../core/types';
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
  SetDIBitsToDevice,
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
  
  constructor(printerName?: string) {
    const manager = new WindowsPrinterManagerAdapter();
    
    if (printerName) {
      if (!manager.printerExists(printerName)) {
        throw new Error(`Printer not found: ${printerName}`);
      }
      this.printerName = printerName;
    } else {
      const defaultPrinter = manager.getDefaultPrinter();
      if (!defaultPrinter) {
        throw new Error('No default printer found');
      }
      this.printerName = defaultPrinter;
    }
    
    // Initialize services
    this.pdfRenderService = new PdfRenderService();
    this.devModeConfigService = new DevModeConfigService();
    this.printDialogService = new PrintDialogService();
  }
  
  async print(pdfPath: string, options?: PrintOptions): Promise<void> {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    const pdfData = fs.readFileSync(pdfPath);
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
    const startTime = performance.now();
    if (process.env.DEBUG) console.log(`[DEBUG] printWithRawData() started for printer: ${printerName}`);
    
    // Show print dialog if requested
    let finalPrinterName = printerName;
    let finalOptions = options;
    let dialogDC: any = null;
    let dialogDevMode: any = null;
    
    if (options?.showPrintDialog) {
      if (process.env.DEBUG) console.log(`[DEBUG] Showing print dialog...`);
      
      const dialogResult = this.printDialogService.showPrintDialog(printerName, options);
      
      if (dialogResult.cancelled) {
        if (process.env.DEBUG) console.log(`[DEBUG] Print dialog cancelled by user`);
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
      
      if (process.env.DEBUG) {
        console.log(`[DEBUG] Print dialog confirmed - using printer: ${finalPrinterName}`);
        if (dialogResult.pageRange && !dialogResult.pageRange.allPages) {
          console.log(`[DEBUG] Page range: ${dialogResult.pageRange.from} to ${dialogResult.pageRange.to}`);
        }
      }
    }
    
    // Initialize PDF rendering service
    const initStart = performance.now();
    await this.pdfRenderService.initialize();
    const initTime = performance.now() - initStart;
    if (process.env.DEBUG) console.log(`[DEBUG] PDF service initialized in ${initTime.toFixed(2)}ms`);
    
    try {
      // Load PDF document
      const loadDocStart = performance.now();
      const pdfDoc = this.pdfRenderService.loadDocument(data);
      const loadDocTime = performance.now() - loadDocStart;
      if (process.env.DEBUG) console.log(`[DEBUG] PDF document loaded in ${loadDocTime.toFixed(2)}ms`);
      
      try {
        // Get page count
        const pageCount = this.pdfRenderService.getPageCount(pdfDoc);
        if (process.env.DEBUG) console.log(`[DEBUG] PDF has ${pageCount} page(s)`);
        
        // Get DEVMODE settings (unless using dialog DC)
        let devMode = dialogDevMode;
        let hDC = dialogDC;
        
        if (!hDC) {
          // No dialog DC, create manually
          const devModeStart = performance.now();
          devMode = this.devModeConfigService.getDevModeWithSettings(finalPrinterName, finalOptions);
          const devModeTime = performance.now() - devModeStart;
          if (process.env.DEBUG) console.log(`[DEBUG] DEVMODE configured in ${devModeTime.toFixed(2)}ms`);
          
          // Create Device Context for the printer
          const dcStart = performance.now();
          hDC = CreateDCW(null, finalPrinterName, null, devMode);
          if (!hDC) {
            throw new Error(`Failed to create device context for printer: ${finalPrinterName}`);
          }
          const dcTime = performance.now() - dcStart;
          if (process.env.DEBUG) console.log(`[DEBUG] Device Context created in ${dcTime.toFixed(2)}ms`);
        } else {
          if (process.env.DEBUG) console.log(`[DEBUG] Using Device Context from print dialog`);
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
          const startDocBegin = performance.now();
          const jobId = StartDocW(hDC, docInfo);
          if (jobId <= 0) {
            throw new Error(`Failed to start document. Error: ${GetLastError()}`);
          }
          const startDocTime = performance.now() - startDocBegin;
          if (process.env.DEBUG) console.log(`[DEBUG] Document started (jobId: ${jobId}) in ${startDocTime.toFixed(2)}ms`);
          
          try {
            const copies = finalOptions?.copies || 1;
            
            // Get printer resolution
            const printerWidth = GetDeviceCaps(hDC, HORZRES);
            const printerHeight = GetDeviceCaps(hDC, VERTRES);
            const printerDpiX = GetDeviceCaps(hDC, LOGPIXELSX);
            const printerDpiY = GetDeviceCaps(hDC, LOGPIXELSY);
            
            // Use user-specified quality or default to 300 DPI (MEDIUM)
            const renderDpi = finalOptions?.quality || PrintQuality.MEDIUM;
            if (process.env.DEBUG) console.log(`[DEBUG] Using render quality: ${renderDpi} DPI (printer DPI: ${printerDpiX}x${printerDpiY})`);
            
            // Determine page range to print
            let startPage = 0;
            let endPage = pageCount - 1;
            
            if (finalOptions?.pageRange && !finalOptions.pageRange.allPages) {
              // User selected specific page range
              startPage = Math.max(0, finalOptions.pageRange.from - 1); // Convert to 0-based index
              endPage = Math.min(pageCount - 1, finalOptions.pageRange.to - 1); // Convert to 0-based index
              if (process.env.DEBUG) console.log(`[DEBUG] Printing pages ${startPage + 1} to ${endPage + 1}`);
            }
            
            // Print each copy
            for (let copy = 0; copy < copies; copy++) {
              const copyStart = performance.now();
              if (process.env.DEBUG) console.log(`[DEBUG] Starting copy ${copy + 1}/${copies}`);
              
              // Print each page in the range
              for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
                const pageStart = performance.now();
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
                const pageTime = performance.now() - pageStart;
                if (process.env.DEBUG) console.log(`[DEBUG] Page ${pageIndex + 1}/${pageCount} printed in ${pageTime.toFixed(2)}ms`);
              }
              
              const copyTime = performance.now() - copyStart;
              if (process.env.DEBUG) console.log(`[DEBUG] Copy ${copy + 1}/${copies} completed in ${copyTime.toFixed(2)}ms`);
            }
            
          } finally {
            // End the document
            const endDocStart = performance.now();
            const endDocResult = EndDoc(hDC);
            if (endDocResult <= 0) {
              throw new Error(`Failed to end document. Error: ${GetLastError()}`);
            }
            const endDocTime = performance.now() - endDocStart;
            if (process.env.DEBUG) console.log(`[DEBUG] Document ended in ${endDocTime.toFixed(2)}ms`);
          }
        } finally {
          // Clean up device context (only if we created it, not from dialog)
          if (!dialogDC) {
            DeleteDC(hDC);
          }
        }
      } finally {
        // Close PDF document
        const closeDocStart = performance.now();
        this.pdfRenderService.closeDocument(pdfDoc);
        const closeDocTime = performance.now() - closeDocStart;
        if (process.env.DEBUG) console.log(`[DEBUG] PDF document closed in ${closeDocTime.toFixed(2)}ms`);
      }
    } finally {
      // Cleanup PDFium
      const cleanupStart = performance.now();
      this.pdfRenderService.cleanup();
      const cleanupTime = performance.now() - cleanupStart;
      if (process.env.DEBUG) console.log(`[DEBUG] PDFium cleanup in ${cleanupTime.toFixed(2)}ms`);
      
      const totalTime = performance.now() - startTime;
      if (process.env.DEBUG) console.log(`[DEBUG] printWithRawData() TOTAL TIME: ${totalTime.toFixed(2)}ms`);
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
    const pageStart = performance.now();
    
    // Calculate render size based on DPI
    // A4 paper size in inches: 8.27 x 11.69
    const pageWidthInches = printerWidth / printerDpiX;
    const pageHeightInches = printerHeight / printerDpiY;
    const renderWidth = Math.floor(pageWidthInches * renderDpi);
    const renderHeight = Math.floor(pageHeightInches * renderDpi);
    
    if (process.env.DEBUG) console.log(`[DEBUG] Render size: ${renderWidth}x${renderHeight} at ${renderDpi} DPI (printer: ${printerWidth}x${printerHeight} at ${printerDpiX} DPI)`);
    
    // Render PDF page to bitmap using service
    const renderStart = performance.now();
    const renderedPage = this.pdfRenderService.renderPage(pdfDoc, pageIndex, {
      width: renderWidth,
      height: renderHeight,
      maintainAspectRatio: true,
      backgroundColor: 0xFFFFFFFF
    });
    const renderTime = performance.now() - renderStart;
    if (process.env.DEBUG) console.log(`[DEBUG] printPdfPage() - render completed in ${renderTime.toFixed(2)}ms`);
    
    try {
      // Start GDI page
      const startPageBegin = performance.now();
      const pageResult = StartPage(hDC);
      if (pageResult <= 0) {
        throw new Error(`Failed to start page. Error: ${GetLastError()}`);
      }
      const startPageTime = performance.now() - startPageBegin;
      if (process.env.DEBUG) console.log(`[DEBUG] StartPage() in ${startPageTime.toFixed(2)}ms`);
      
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
        const drawStart = performance.now();
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
        const drawTime = performance.now() - drawStart;
        if (process.env.DEBUG) console.log(`[DEBUG] StretchDIBits() in ${drawTime.toFixed(2)}ms (scaled ${renderWidth}x${renderHeight} to ${scaledWidth}x${scaledHeight})`);
        
        if (result === 0) {
          throw new Error(`Failed to draw bitmap to printer. Error: ${GetLastError()}`);
        }
        
      } finally {
        // End the page
        const endPageBegin = performance.now();
        const endResult = EndPage(hDC);
        if (endResult <= 0) {
          throw new Error(`Failed to end page. Error: ${GetLastError()}`);
        }
        const endPageTime = performance.now() - endPageBegin;
        if (process.env.DEBUG) console.log(`[DEBUG] EndPage() in ${endPageTime.toFixed(2)}ms`);
        
        const totalPageTime = performance.now() - pageStart;
        if (process.env.DEBUG) console.log(`[DEBUG] printPdfPage() TOTAL: ${totalPageTime.toFixed(2)}ms`);
      }
    } finally {
      // Cleanup rendered page bitmap
      this.pdfRenderService.cleanupRenderedPage(renderedPage);
    }
  }
  
  getPrinterName(): string {
    return this.printerName;
  }
  
  getCapabilities(): PrinterCapabilities | null {
    const manager = new WindowsPrinterManagerAdapter();
    return manager.getPrinterCapabilities(this.printerName);
  }
}
