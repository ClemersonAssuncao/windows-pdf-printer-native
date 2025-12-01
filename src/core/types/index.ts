// Core domain types - Windows specific

/**
 * Print quality enumeration for PDF rendering
 */
export enum PrintQuality {
  /** Draft quality - 150 DPI (fast, smaller files) */
  LOW = 150,
  /** Standard quality - 300 DPI (recommended for documents) */
  MEDIUM = 300,
  /** High quality - 600 DPI (slow, larger files, best for images/photos) */
  HIGH = 600
}

/**
 * Paper size enumeration (Windows DEVMODE dmPaperSize values)
 * Reference: https://learn.microsoft.com/en-us/windows/win32/intl/paper-sizes
 */
export enum PaperSize {
  /** Letter 8.5 x 11 inches */
  LETTER = 1,
  /** Letter Small 8.5 x 11 inches */
  LETTER_SMALL = 2,
  /** Tabloid 11 x 17 inches */
  TABLOID = 3,
  /** Ledger 17 x 11 inches */
  LEDGER = 4,
  /** Legal 8.5 x 14 inches */
  LEGAL = 5,
  /** Statement 5.5 x 8.5 inches */
  STATEMENT = 6,
  /** Executive 7.25 x 10.5 inches */
  EXECUTIVE = 7,
  /** A3 297 x 420 mm */
  A3 = 8,
  /** A4 210 x 297 mm */
  A4 = 9,
  /** A4 Small 210 x 297 mm */
  A4_SMALL = 10,
  /** A5 148 x 210 mm */
  A5 = 11,
  /** B4 (JIS) 257 x 364 mm */
  B4 = 12,
  /** B5 (JIS) 182 x 257 mm */
  B5 = 13,
  /** Folio 8.5 x 13 inches */
  FOLIO = 14,
  /** Quarto 215 x 275 mm */
  QUARTO = 15,
  /** 10x14 inches */
  TEN_BY_FOURTEEN = 16,
  /** 11x17 inches */
  ELEVEN_BY_SEVENTEEN = 17,
  /** Note 8.5 x 11 inches */
  NOTE = 18,
  /** Envelope #9 3.875 x 8.875 inches */
  ENV_9 = 19,
  /** Envelope #10 4.125 x 9.5 inches */
  ENV_10 = 20,
  /** Envelope #11 4.5 x 10.375 inches */
  ENV_11 = 21,
  /** Envelope #12 4.75 x 11 inches */
  ENV_12 = 22,
  /** Envelope #14 5 x 11.5 inches */
  ENV_14 = 23,
  /** C size sheet 17 x 22 inches */
  C_SIZE = 24,
  /** D size sheet 22 x 34 inches */
  D_SIZE = 25,
  /** E size sheet 34 x 44 inches */
  E_SIZE = 26,
  /** Envelope DL 110 x 220 mm */
  ENV_DL = 27,
  /** Envelope C5 162 x 229 mm */
  ENV_C5 = 28,
  /** Envelope C3 324 x 458 mm */
  ENV_C3 = 29,
  /** Envelope C4 229 x 324 mm */
  ENV_C4 = 30,
  /** Envelope C6 114 x 162 mm */
  ENV_C6 = 31,
  /** Envelope C65 114 x 229 mm */
  ENV_C65 = 32,
  /** Envelope B4 250 x 353 mm */
  ENV_B4 = 33,
  /** Envelope B5 176 x 250 mm */
  ENV_B5 = 34,
  /** Envelope B6 176 x 125 mm */
  ENV_B6 = 35,
  /** Envelope 110 x 230 mm */
  ENV_ITALY = 36,
  /** Envelope Monarch 3.875 x 7.5 inches */
  ENV_MONARCH = 37,
  /** 6 3/4 Envelope 3.625 x 6.5 inches */
  ENV_PERSONAL = 38,
  /** US Std Fanfold 14.875 x 11 inches */
  FANFOLD_US = 39,
  /** German Std Fanfold 8.5 x 12 inches */
  FANFOLD_STD_GERMAN = 40,
  /** German Legal Fanfold 8.5 x 13 inches */
  FANFOLD_LGL_GERMAN = 41,
  /** B4 (ISO) 250 x 353 mm */
  ISO_B4 = 42,
  /** Japanese Postcard 100 x 148 mm */
  JAPANESE_POSTCARD = 43,
  /** 9 x 11 inches */
  NINE_BY_ELEVEN = 44,
  /** 10 x 11 inches */
  TEN_BY_ELEVEN = 45,
  /** 15 x 11 inches */
  FIFTEEN_BY_ELEVEN = 46,
  /** Envelope Invite 220 x 220 mm */
  ENV_INVITE = 47,
  /** Letter Extra 9.275 x 12 inches */
  LETTER_EXTRA = 50,
  /** Legal Extra 9.275 x 15 inches */
  LEGAL_EXTRA = 51,
  /** Tabloid Extra 11.69 x 18 inches */
  TABLOID_EXTRA = 52,
  /** A4 Extra 9.27 x 12.69 inches */
  A4_EXTRA = 53,
  /** Letter Transverse 8.275 x 11 inches */
  LETTER_TRANSVERSE = 54,
  /** A4 Transverse 210 x 297 mm */
  A4_TRANSVERSE = 55,
  /** Letter Extra Transverse 9.275 x 12 inches */
  LETTER_EXTRA_TRANSVERSE = 56,
  /** A Plus 227 x 356 mm */
  A_PLUS = 57,
  /** B Plus 305 x 487 mm */
  B_PLUS = 58,
  /** Letter Plus 8.5 x 12.69 inches */
  LETTER_PLUS = 59,
  /** A4 Plus 210 x 330 mm */
  A4_PLUS = 60,
  /** A5 Transverse 148 x 210 mm */
  A5_TRANSVERSE = 61,
  /** B5 (JIS) Transverse 182 x 257 mm */
  B5_TRANSVERSE = 62,
  /** A3 Extra 322 x 445 mm */
  A3_EXTRA = 63,
  /** A5 Extra 174 x 235 mm */
  A5_EXTRA = 64,
  /** B5 (ISO) Extra 201 x 276 mm */
  B5_EXTRA = 65,
  /** A2 420 x 594 mm */
  A2 = 66,
  /** A3 Transverse 297 x 420 mm */
  A3_TRANSVERSE = 67,
  /** A3 Extra Transverse 322 x 445 mm */
  A3_EXTRA_TRANSVERSE = 68,
  /** Japanese Double Postcard 200 x 148 mm */
  JAPANESE_DOUBLE_POSTCARD = 69,
  /** A6 105 x 148 mm */
  A6 = 70,
  /** B6 (JIS) 128 x 182 mm */
  B6_JIS = 88,
  /** 12 x 11 inches */
  TWELVE_BY_ELEVEN = 90
}

/**
 * Duplex printing mode enumeration (Windows DEVMODE dmDuplex values)
 */
export enum DuplexMode {
  /** Single-sided printing */
  SIMPLEX = 1,
  /** Double-sided printing with horizontal flip (short-edge binding) */
  HORIZONTAL = 2,
  /** Double-sided printing with vertical flip (long-edge binding) */
  VERTICAL = 3
}

/**
 * Page orientation enumeration (Windows DEVMODE dmOrientation values)
 */
export enum PageOrientation {
  /** Portrait orientation (vertical) */
  PORTRAIT = 1,
  /** Landscape orientation (horizontal) */
  LANDSCAPE = 2
}

/**
 * Color mode enumeration (Windows DEVMODE dmColor values)
 */
export enum ColorMode {
  /** Monochrome/black and white printing */
  MONOCHROME = 1,
  /** Color printing */
  COLOR = 2
}

/**
 * Paper tray/source enumeration (Windows DEVMODE dmDefaultSource values)
 * Reference: https://learn.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-devmodea
 */
export enum PaperTray {
  /** Automatically select the paper source */
  AUTO = 7,
  /** Upper paper tray/bin */
  UPPER = 1,
  /** Lower paper tray/bin */
  LOWER = 2,
  /** Middle paper tray/bin */
  MIDDLE = 3,
  /** Manual feed tray */
  MANUAL = 4,
  /** Envelope feeder */
  ENVELOPE = 5,
  /** Manual envelope feed */
  ENVELOPE_MANUAL = 6,
  /** Tractor feed */
  TRACTOR = 8,
  /** Small format paper source */
  SMALL_FORMAT = 9,
  /** Large format paper source */
  LARGE_FORMAT = 10,
  /** Large capacity bin */
  LARGE_CAPACITY = 11,
  /** Paper cassette */
  CASSETTE = 14,
  /** Form source */
  FORM_SOURCE = 15
}

export interface PrintOptions {
  printer?: string;
  copies?: number;
  /**
   * Duplex (double-sided) printing mode
   * - DuplexMode.SIMPLEX - Single-sided
   * - DuplexMode.HORIZONTAL - Double-sided, short-edge binding
   * - DuplexMode.VERTICAL - Double-sided, long-edge binding
   */
  duplex?: DuplexMode;
  /**
   * Paper size for printing
   * Can be:
   * - PaperSize enum value (e.g., PaperSize.A4, PaperSize.LETTER)
   * - Custom number (DEVMODE dmPaperSize value)
   * - String value for compatibility
   */
  paperSize?: PaperSize | number | string;
  /**
   * Paper tray/source for printing
   * - PaperTray.AUTO - Automatic selection
   * - PaperTray.UPPER - Upper tray
   * - PaperTray.LOWER - Lower tray
   * - PaperTray.MANUAL - Manual feed
   * - Or custom number for printer-specific trays
   */
  paperTray?: PaperTray | number;
  /**
   * Page orientation
   * - PageOrientation.PORTRAIT - Vertical
   * - PageOrientation.LANDSCAPE - Horizontal
   */
  orientation?: PageOrientation;
  /**
   * Color mode
   * - ColorMode.MONOCHROME - Black and white
   * - ColorMode.COLOR - Color printing
   */
  color?: ColorMode;
  collate?: boolean;
  /**
   * Print quality for PDF to bitmap rendering
   * @default PrintQuality.MEDIUM (300 DPI)
   * 
   * Can be:
   * - PrintQuality.LOW (150 DPI) - Draft quality, fast
   * - PrintQuality.MEDIUM (300 DPI) - Standard quality, recommended
   * - PrintQuality.HIGH (600 DPI) - High quality, slow
   * - Custom number (DPI value)
   */
  quality?: PrintQuality | number;
}

export interface PrinterInfo {
  name: string;
  serverName?: string;
  portName?: string;
  driverName?: string;
  location?: string;
  comment?: string;
  status: number;
  isDefault?: boolean;
}

export interface PrinterCapabilities {
  supportsDuplex: boolean;
  supportsColor: boolean;
  defaultPaperSize: PaperSize | number | string;
}
