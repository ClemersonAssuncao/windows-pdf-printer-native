// Windows GDI32 API - Graphics Device Interface
import koffi from 'koffi';

// Load GDI32.dll (Windows Graphics Device Interface)
const gdi32 = koffi.load('gdi32.dll');

// Local cache to store Koffi structures (isolated per module)
const structCache = new Map<string, any>();

// Helper to create or reuse Koffi structures
function defineStruct(name: string, definition: any) {
  if (structCache.has(name)) {
    return structCache.get(name);
  }
  
  try {
    const struct = koffi.struct(name, definition);
    structCache.set(name, struct);
    return struct;
  } catch (error: any) {
    if (error  .message  .includes('Duplicate type name')) {
      // If Koffi already has this struct definition, use the name directly
      return name;
    }
    throw error;
  }
}

// DEVMODE structure (shared between GDI and Winspool)
export const DEVMODEW = defineStruct('DEVMODEW', {
  dmDeviceName: koffi.array('uint16', 32),
  dmSpecVersion: 'uint16',
  dmDriverVersion: 'uint16',
  dmSize: 'uint16',
  dmDriverExtra: 'uint16',
  dmFields: 'uint32',
  dmOrientation: 'int16',
  dmPaperSize: 'int16',
  dmPaperLength: 'int16',
  dmPaperWidth: 'int16',
  dmScale: 'int16',
  dmCopies: 'int16',
  dmDefaultSource: 'int16',
  dmPrintQuality: 'int16',
  dmColor: 'int16',
  dmDuplex: 'int16',
  dmYResolution: 'int16',
  dmTTOption: 'int16',
  dmCollate: 'int16',
  dmFormName: koffi.array('uint16', 32),
  dmLogPixels: 'uint16',
  dmBitsPerPel: 'uint32',
  dmPelsWidth: 'uint32',
  dmPelsHeight: 'uint32',
  dmDisplayFlags: 'uint32',
  dmDisplayFrequency: 'uint32',
  dmICMMethod: 'uint32',
  dmICMIntent: 'uint32',
  dmMediaType: 'uint32',
  dmDitherType: 'uint32',
  dmReserved1: 'uint32',
  dmReserved2: 'uint32',
  dmPanningWidth: 'uint32',
  dmPanningHeight: 'uint32'
});

// DEVMODE field flags
export const DM_ORIENTATION = 0x00000001;
export const DM_PAPERSIZE = 0x00000002;
export const DM_PAPERLENGTH = 0x00000004;
export const DM_PAPERWIDTH = 0x00000008;
export const DM_SCALE = 0x00000010;
export const DM_COPIES = 0x00000100;
export const DM_DEFAULTSOURCE = 0x00000200;
export const DM_PRINTQUALITY = 0x00000400;
export const DM_COLOR = 0x00000800;
export const DM_DUPLEX = 0x00001000;
export const DM_YRESOLUTION = 0x00002000;
export const DM_TTOPTION = 0x00004000;
export const DM_COLLATE = 0x00008000;

// Duplex modes - DEPRECATED: Use DuplexMode enum from core/types instead
// These constants are kept for backwards compatibility
export const DUPLEX_SIMPLEX = 1;
export const DUPLEX_HORIZONTAL = 2;
export const DUPLEX_VERTICAL = 3;

// Page orientation - DEPRECATED: Use PageOrientation enum from core/types instead
// These constants are kept for backwards compatibility
export const PORTRAIT = 1;
export const LANDSCAPE = 2;

// Color mode - DEPRECATED: Use ColorMode enum from core/types instead
// These constants are kept for backwards compatibility
export const MONOCHROME = 1;
export const COLOR = 2;

// Document info structure
export const GDI_DOCINFOW = defineStruct('GDI_DOCINFOW', {
  cbSize: 'int',
  lpszDocName: 'str16',
  lpszOutput: 'str16',
  lpszDatatype: 'str16',
  fwType: 'uint32'
});

// GDI Device Context functions
export const CreateDCW =
  gdi32.func('CreateDCW', 'void*', ['str16', 'str16', 'str16', koffi.pointer(DEVMODEW)])
;

export const DeleteDC =
  gdi32.func('DeleteDC', 'bool', ['void*'])
;

// GDI Printing functions
export const StartDocW =
  gdi32.func('StartDocW', 'int', ['void*', koffi.pointer(GDI_DOCINFOW)])
;

export const EndDoc =
  gdi32.func('EndDoc', 'int', ['void*'])
;

export const StartPage =
  gdi32.func('StartPage', 'int', ['void*'])
;

export const EndPage =
  gdi32.func('EndPage', 'int', ['void*'])
;

export const AbortDoc =
  gdi32.func('AbortDoc', 'int', ['void*'])
;

// Device Capabilities
export const GetDeviceCaps =
  gdi32.func('GetDeviceCaps', 'int', ['void*', 'int'])
;

// Device Capabilities constants
export const HORZRES = 8;          // Horizontal width in pixels
export const VERTRES = 10;         // Vertical height in pixels
export const HORZSIZE = 4;         // Horizontal width in millimeters
export const VERTSIZE = 6;         // Vertical height in millimeters
export const LOGPIXELSX = 88;      // Logical pixels/inch in X
export const LOGPIXELSY = 90;      // Logical pixels/inch in Y
export const PHYSICALWIDTH = 110;  // Physical Width in device units
export const PHYSICALHEIGHT = 111; // Physical Height in device units
export const PHYSICALOFFSETX = 112;// Physical Offset X
export const PHYSICALOFFSETY = 113;// Physical Offset Y

// BITMAPINFOHEADER structure
export const BITMAPINFOHEADER = defineStruct('BITMAPINFOHEADER', {
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

// Bitmap constants
export const BI_RGB = 0;
export const DIB_RGB_COLORS = 0;

// Bitmap transfer functions
export const SetDIBitsToDevice =
  gdi32.func('SetDIBitsToDevice', 'int', [
      'void*',   // hdc
      'int',     // xDest
      'int',     // yDest
      'int',     // w
      'int',     // h
      'int',     // xSrc
      'int',     // ySrc
      'uint32',  // StartScan
      'uint32',  // cLines
      'void*',   // lpvBits
      'void*',   // lpbmi
      'uint32'   // ColorUse
    ])
;

export const StretchDIBits =
  gdi32.func('StretchDIBits', 'int', [
      'void*',   // hdc
      'int',     // xDest
      'int',     // yDest
      'int',     // DestWidth
      'int',     // DestHeight
      'int',     // xSrc
      'int',     // ySrc
      'int',     // SrcWidth
      'int',     // SrcHeight
      'void*',   // lpBits
      'void*',   // lpbmi
      'uint32',  // iUsage (DIB_RGB_COLORS)
      'uint32'   // rop (SRCCOPY)
    ])
;

export const BitBlt =
  gdi32.func('BitBlt', 'bool', [
      'void*',   // hdcDest
      'int',     // x
      'int',     // y
      'int',     // cx
      'int',     // cy
      'void*',   // hdcSrc
      'int',     // x1
      'int',     // y1
      'uint32'   // rop
    ])
;

// Raster operation codes
export const SRCCOPY = 0x00CC0020;

// Enhanced Metafile structures and functions
export const ENHMETAHEADER = defineStruct('ENHMETAHEADER', {
  iType: 'uint32',
  nSize: 'uint32',
  rclBounds: koffi.array('int32', 4),
  rclFrame: koffi.array('int32', 4),
  dSignature: 'uint32',
  nVersion: 'uint32',
  nBytes: 'uint32',
  nRecords: 'uint32',
  nHandles: 'uint16',
  sReserved: 'uint16',
  nDescription: 'uint32',
  offDescription: 'uint32',
  nPalEntries: 'uint32',
  szlDevice: koffi.array('int32', 2),
  szlMillimeters: koffi.array('int32', 2),
  cbPixelFormat: 'uint32',
  offPixelFormat: 'uint32',
  bOpenGL: 'uint32',
  szlMicrometers: koffi.array('int32', 2)
});

export const GetEnhMetaFileW =
  gdi32.func('GetEnhMetaFileW', 'void*', ['str16'])
;

export const PlayEnhMetaFile =
  gdi32.func('PlayEnhMetaFile', 'bool', ['void*', 'void*', koffi.pointer(koffi.array('int32', 4))])
;

export const DeleteEnhMetaFile =
  gdi32.func('DeleteEnhMetaFile', 'bool', ['void*'])
;

export const GetEnhMetaFileHeader =
  gdi32.func('GetEnhMetaFileHeader', 'uint32', ['void*', 'uint32', koffi.out(koffi.pointer(ENHMETAHEADER))])
;

export const SetMapMode =
  gdi32.func('SetMapMode', 'int', ['void*', 'int'])
;

export const SetViewportOrgEx =
  gdi32.func('SetViewportOrgEx', 'bool', ['void*', 'int', 'int', 'void*'])
;

export const SetViewportExtEx =
  gdi32.func('SetViewportExtEx', 'bool', ['void*', 'int', 'int', 'void*'])
;

// Map modes for coordinate mapping
export const MM_TEXT = 1;
export const MM_LOMETRIC = 2;
export const MM_HIMETRIC = 3;
export const MM_LOENGLISH = 4;
export const MM_HIENGLISH = 5;
export const MM_TWIPS = 6;
export const MM_ISOTROPIC = 7;
export const MM_ANISOTROPIC = 8;
