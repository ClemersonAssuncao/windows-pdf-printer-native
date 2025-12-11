// Windows Winspool API - Print Spooler functions
import koffi from 'koffi';
import { DEVMODEW } from './gdi32.api';

// Load Winspool.drv (Windows Print Spooler)
const winspool = koffi.load('winspool.drv');

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
    if (error?.message?.includes('Duplicate type name')) {
      // If Koffi already has this struct definition, use the name directly
      return name;
    }
    throw error;
  }
}

// Printer access rights
export const PRINTER_ACCESS_ADMINISTER = 0x00000004;
export const PRINTER_ACCESS_USE = 0x00000008;
export const PRINTER_ALL_ACCESS = 0x000F000C;

// Enum flags
export const PRINTER_ENUM_LOCAL = 0x00000002;
export const PRINTER_ENUM_CONNECTIONS = 0x00000004;

// DocumentProperties flags
export const DM_IN_BUFFER = 8;
export const DM_OUT_BUFFER = 2;

// PRINTER_INFO_2W structure
export const PRINTER_INFO_2W = defineStruct('PRINTER_INFO_2W', {
  pServerName: 'str16',
  pPrinterName: 'str16',
  pShareName: 'str16',
  pPortName: 'str16',
  pDriverName: 'str16',
  pComment: 'str16',
  pLocation: 'str16',
  pDevMode: koffi.pointer(DEVMODEW),
  pSepFile: 'str16',
  pPrintProcessor: 'str16',
  pDatatype: 'str16',
  pParameters: 'str16',
  pSecurityDescriptor: 'void*',
  Attributes: 'uint32',
  Priority: 'uint32',
  DefaultPriority: 'uint32',
  StartTime: 'uint32',
  UntilTime: 'uint32',
  Status: 'uint32',
  cJobs: 'uint32',
  AveragePPM: 'uint32'
});

// PRINTER_DEFAULTS structure for OpenPrinter
export const PRINTER_DEFAULTS = defineStruct('PRINTER_DEFAULTS', {
  pDatatype: 'str16',
  pDevMode: koffi.pointer(DEVMODEW),
  DesiredAccess: 'uint32'
});

// DATATYPES_INFO_1W structure
export const DATATYPES_INFO_1W = defineStruct('DATATYPES_INFO_1W', {
  pName: 'str16'
});

// Winspool printer management functions
export const EnumPrintersW = winspool.func('EnumPrintersW', 'bool', [
  'uint32',                           // Flags
  'str16',                            // Name
  'uint32',                           // Level
  'void*',                            // pPrinterEnum
  'uint32',                           // cbBuf
  koffi.out(koffi.pointer('uint32')), // pcbNeeded
  koffi.out(koffi.pointer('uint32'))  // pcReturned
]);

export const GetDefaultPrinterW = winspool.func('GetDefaultPrinterW', 'bool', [
  'uint16*',                          // pszBuffer
  koffi.inout(koffi.pointer('uint32'))// pcchBuffer
]);

export const OpenPrinterW = winspool.func('OpenPrinterW', 'bool', [
  'str16',                            // pPrinterName
  koffi.out(koffi.pointer('void*')),  // phPrinter
  koffi.pointer(PRINTER_DEFAULTS)     // pDefault
]);

export const ClosePrinter = winspool.func('ClosePrinter', 'bool', ['void*']);

export const DocumentPropertiesW = winspool.func('DocumentPropertiesW', 'int32', [
  'void*',                           // hWnd
  'void*',                           // hPrinter
  'str16',                           // pDeviceName
  koffi.out(koffi.pointer(DEVMODEW)),// pDevModeOutput
  koffi.pointer(DEVMODEW),           // pDevModeInput
  'uint32'                           // fMode
]);

export const EnumPrintProcessorDatatypesW = winspool.func('EnumPrintProcessorDatatypesW', 'bool', [
  'str16',                           // pName
  'str16',                           // pPrintProcessorName
  'uint32',                          // Level
  'void*',                           // pDatatypes
  'uint32',                          // cbBuf
  koffi.out(koffi.pointer('uint32')),// pcbNeeded
  koffi.out(koffi.pointer('uint32')) // pcReturned
]);

// DeviceCapabilities constants
export const DC_PAPERS = 2;        // Supported paper sizes
export const DC_PAPERSIZE = 3;     // Physical dimensions of paper
export const DC_MINEXTENT = 4;     // Minimum paper size
export const DC_MAXEXTENT = 5;     // Maximum paper size
export const DC_BINS = 6;          // Available paper bins/trays
export const DC_DUPLEX = 7;        // Duplex support
export const DC_BINNAMES = 12;     // Names of bins/trays
export const DC_COPIES = 18;       // Maximum number of copies
export const DC_PAPERNAMES = 16;   // Names of paper forms
export const DC_MEDIAREADY = 29;   // Media loaded in printer
export const DC_MEDIATYPENAMES = 34; // Names of media types
export const DC_MEDIATYPES = 35;   // Media type IDs

// DeviceCapabilitiesW function
export const DeviceCapabilitiesW = winspool.func('DeviceCapabilitiesW', 'int32', [
  'str16',                           // pDevice (printer name)
  'str16',                           // pPort (can be null)
  'uint16',                          // fwCapability (DC_* constant)
  'void*',                           // pOutput (buffer for results)
  koffi.pointer(DEVMODEW)            // pDevMode (can be null)
]);
