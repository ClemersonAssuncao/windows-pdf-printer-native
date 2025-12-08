// PDFium API bindings using koffi
import koffi from 'koffi';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Only load PDFium on Windows platform
const isWindows = os.platform() === 'win32';
let pdfiumLib: any = null;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load PDFium from common locations
if (isWindows) {
  const possiblePaths = [
    path.join(process.cwd(), 'bin', 'pdfium.dll'),
    path.join(__dirname, '..', '..', '..', '..', 'bin', 'pdfium.dll')
  ];

  for (const dllPath of possiblePaths) {
    if (fs.existsSync(dllPath)) {
      try {
        pdfiumLib = koffi.load(dllPath);
        break;
      } catch (e) {
        // Try next path
      }
    }
  }

  if (!pdfiumLib) {
    console.warn('PDFium DLL not found. Please download pdfium.dll and place it in the bin/ directory.');
    console.warn('Download from: https://github.com/bblanchon/pdfium-binaries/releases');
  }
}

// PDFium data structures
export const FPDF_DOCUMENT = 'void*';
export const FPDF_PAGE = 'void*';
export const FPDF_BITMAP = 'void*';

// Bitmap formats
export const FPDFBitmap_Unknown = 0;
export const FPDFBitmap_Gray = 1;
export const FPDFBitmap_BGR = 2;
export const FPDFBitmap_BGRx = 3;
export const FPDFBitmap_BGRA = 4;

// Flags for rendering
export const FPDF_ANNOT = 0x01;
export const FPDF_LCD_TEXT = 0x02;
export const FPDF_NO_NATIVETEXT = 0x04;
export const FPDF_GRAYSCALE = 0x08;
export const FPDF_DEBUG_INFO = 0x80;
export const FPDF_NO_CATCH = 0x100;
export const FPDF_RENDER_LIMITEDIMAGECACHE = 0x200;
export const FPDF_RENDER_FORCEHALFTONE = 0x400;
export const FPDF_PRINTING = 0x800;
export const FPDF_REVERSE_BYTE_ORDER = 0x10;

// BITMAPINFOHEADER structure for Windows (PDFium version)
export const PDFIUM_BITMAPINFOHEADER = koffi.struct('PDFIUM_BITMAPINFOHEADER', {
  biSize: 'uint32',
  biWidth: 'int32',
  biHeight: 'int32',
  biPlanes: 'uint16',
  biBitCount: 'uint16',
  biCompression: 'uint32',
  biSizeImage: 'uint32',
  biXPelsPerMeter: 'int32',
  biYPelsPerMeter: 'int32',
  biClrUsed: 'uint32',
  biClrImportant: 'uint32'
});

// BI_RGB constant
export const BI_RGB = 0;
export const DIB_RGB_COLORS = 0;

// PDFium initialization and cleanup
export const FPDF_InitLibrary = pdfiumLib 
  ? pdfiumLib.func('FPDF_InitLibrary', 'void', [])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDF_DestroyLibrary = pdfiumLib
  ? pdfiumLib.func('FPDF_DestroyLibrary', 'void', [])
  : (() => { throw new Error('PDFium library not loaded'); });

// Document loading
export const FPDF_LoadMemDocument = pdfiumLib
  ? pdfiumLib.func('FPDF_LoadMemDocument', 'void*', ['void*', 'int', 'string'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDF_CloseDocument = pdfiumLib
  ? pdfiumLib.func('FPDF_CloseDocument', 'void', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDF_GetPageCount = pdfiumLib
  ? pdfiumLib.func('FPDF_GetPageCount', 'int', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

// Page operations
export const FPDF_LoadPage = pdfiumLib
  ? pdfiumLib.func('FPDF_LoadPage', 'void*', ['void*', 'int'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDF_ClosePage = pdfiumLib
  ? pdfiumLib.func('FPDF_ClosePage', 'void', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDF_GetPageWidth = pdfiumLib
  ? pdfiumLib.func('FPDF_GetPageWidth', 'double', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDF_GetPageHeight = pdfiumLib
  ? pdfiumLib.func('FPDF_GetPageHeight', 'double', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

// Bitmap operations
export const FPDFBitmap_Create = pdfiumLib
  ? pdfiumLib.func('FPDFBitmap_Create', 'void*', ['int', 'int', 'int'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDFBitmap_CreateEx = pdfiumLib
  ? pdfiumLib.func('FPDFBitmap_CreateEx', 'void*', ['int', 'int', 'int', 'void*', 'int'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDFBitmap_Destroy = pdfiumLib
  ? pdfiumLib.func('FPDFBitmap_Destroy', 'void', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDFBitmap_GetBuffer = pdfiumLib
  ? pdfiumLib.func('FPDFBitmap_GetBuffer', 'void*', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDFBitmap_GetWidth = pdfiumLib
  ? pdfiumLib.func('FPDFBitmap_GetWidth', 'int', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDFBitmap_GetHeight = pdfiumLib
  ? pdfiumLib.func('FPDFBitmap_GetHeight', 'int', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDFBitmap_GetStride = pdfiumLib
  ? pdfiumLib.func('FPDFBitmap_GetStride', 'int', ['void*'])
  : (() => { throw new Error('PDFium library not loaded'); });

export const FPDFBitmap_FillRect = pdfiumLib
  ? pdfiumLib.func('FPDFBitmap_FillRect', 'void', ['void*', 'int', 'int', 'int', 'int', 'uint32'])
  : (() => { throw new Error('PDFium library not loaded'); });

// Page rendering
export const FPDF_RenderPageBitmap = pdfiumLib
  ? pdfiumLib.func('FPDF_RenderPageBitmap', 'void', [
      'void*',   // bitmap
      'void*',   // page
      'int',     // start_x
      'int',     // start_y
      'int',     // size_x
      'int',     // size_y
      'int',     // rotate
      'int'      // flags
    ])
  : (() => { throw new Error('PDFium library not loaded'); });

// Error codes
export const FPDF_ERR_SUCCESS = 0;
export const FPDF_ERR_UNKNOWN = 1;
export const FPDF_ERR_FILE = 2;
export const FPDF_ERR_FORMAT = 3;
export const FPDF_ERR_PASSWORD = 4;
export const FPDF_ERR_SECURITY = 5;
export const FPDF_ERR_PAGE = 6;

export const FPDF_GetLastError = pdfiumLib
  ? pdfiumLib.func('FPDF_GetLastError', 'uint32', [])
  : (() => { throw new Error('PDFium library not loaded'); });

// Helper to check if PDFium is available
export function isPDFiumAvailable(): boolean {
  return pdfiumLib !== null;
}
