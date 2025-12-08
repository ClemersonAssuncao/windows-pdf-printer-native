// Windows Common Dialog API - Print Dialog functions
import koffi from 'koffi';
import * as os from 'os';

// Only load Windows DLLs on Windows platform
const isWindows = os.platform() === 'win32';
const comdlg32 = isWindows ? koffi.load('comdlg32.dll') : null as any;

// Global cache to store Koffi structures
const structCache = (globalThis as any).__koffi_struct_cache__ || {};
if (!(globalThis as any).__koffi_struct_cache__) {
  (globalThis as any).__koffi_struct_cache__ = structCache;
}

// Helper to create or reuse Koffi structures
function defineStruct(name: string, definition: any) {
  if (structCache[name]) {
    return structCache[name];
  }
  
  try {
    const struct = koffi.struct(name, definition);
    structCache[name] = struct;
    return struct;
  } catch (error: any) {
    if (error?.message?.includes('Duplicate type name')) {
      structCache[name] = name;
      return name;
    }
    throw error;
  }
}

// PrintDlg flags
export const PD_ALLPAGES = 0x00000000;
export const PD_SELECTION = 0x00000001;
export const PD_PAGENUMS = 0x00000002;
export const PD_NOSELECTION = 0x00000004;
export const PD_NOPAGENUMS = 0x00000008;
export const PD_COLLATE = 0x00000010;
export const PD_PRINTTOFILE = 0x00000020;
export const PD_PRINTSETUP = 0x00000040;
export const PD_NOWARNING = 0x00000080;
export const PD_RETURNDC = 0x00000100;
export const PD_RETURNIC = 0x00000200;
export const PD_RETURNDEFAULT = 0x00000400;
export const PD_SHOWHELP = 0x00000800;
export const PD_ENABLEPRINTHOOK = 0x00001000;
export const PD_ENABLESETUPHOOK = 0x00002000;
export const PD_ENABLEPRINTTEMPLATE = 0x00004000;
export const PD_ENABLESETUPTEMPLATE = 0x00008000;
export const PD_ENABLEPRINTTEMPLATEHANDLE = 0x00010000;
export const PD_ENABLESETUPTEMPLATEHANDLE = 0x00020000;
export const PD_USEDEVMODECOPIES = 0x00040000;
export const PD_USEDEVMODECOPIESANDCOLLATE = 0x00040000;
export const PD_DISABLEPRINTTOFILE = 0x00080000;
export const PD_HIDEPRINTTOFILE = 0x00100000;
export const PD_NONETWORKBUTTON = 0x00200000;
export const PD_CURRENTPAGE = 0x00400000;
export const PD_NOCURRENTPAGE = 0x00800000;
export const PD_EXCLUSIONFLAGS = 0x01000000;
export const PD_USELARGETEMPLATE = 0x10000000;

// PRINTDLGW structure for PrintDlgW
export const PRINTDLGW = defineStruct('PRINTDLGW', {
  lStructSize: 'uint32',
  hwndOwner: 'void*',
  hDevMode: 'void*',
  hDevNames: 'void*',
  hDC: 'void*',
  Flags: 'uint32',
  nFromPage: 'uint16',
  nToPage: 'uint16',
  nMinPage: 'uint16',
  nMaxPage: 'uint16',
  nCopies: 'uint16',
  hInstance: 'void*',
  lCustData: 'intptr',
  lpfnPrintHook: 'void*',
  lpfnSetupHook: 'void*',
  lpPrintTemplateName: 'str16',
  lpSetupTemplateName: 'str16',
  hPrintTemplate: 'void*',
  hSetupTemplate: 'void*'
});

// DEVNAMES structure
export const DEVNAMES = defineStruct('DEVNAMES', {
  wDriverOffset: 'uint16',
  wDeviceOffset: 'uint16',
  wOutputOffset: 'uint16',
  wDefault: 'uint16'
});

/**
 * Display Windows Print Dialog
 * Returns true if user clicked OK, false if user clicked Cancel
 */
export const PrintDlgW = isWindows 
  ? comdlg32.func('PrintDlgW', 'bool', [
      koffi.inout(koffi.pointer(PRINTDLGW))  // lppd
    ])
  : (() => { throw new Error('Windows API not available on this platform'); }) as any;

/**
 * Allocate global memory handle
 */
export const GlobalAlloc = isWindows
  ? koffi.load('kernel32.dll').func('GlobalAlloc', 'void*', ['uint32', 'uintptr'])
  : (() => { throw new Error('Windows API not available on this platform'); }) as any;

/**
 * Free global memory handle
 */
export const GlobalFree = isWindows
  ? koffi.load('kernel32.dll').func('GlobalFree', 'void*', ['void*'])
  : (() => { throw new Error('Windows API not available on this platform'); }) as any;

/**
 * Lock global memory handle
 */
export const GlobalLock = isWindows
  ? koffi.load('kernel32.dll').func('GlobalLock', 'void*', ['void*'])
  : (() => { throw new Error('Windows API not available on this platform'); }) as any;

/**
 * Unlock global memory handle
 */
export const GlobalUnlock = isWindows
  ? koffi.load('kernel32.dll').func('GlobalUnlock', 'bool', ['void*'])
  : (() => { throw new Error('Windows API not available on this platform'); }) as any;

// Global memory flags
export const GMEM_MOVEABLE = 0x0002;
export const GMEM_ZEROINIT = 0x0040;
export const GHND = GMEM_MOVEABLE | GMEM_ZEROINIT;
