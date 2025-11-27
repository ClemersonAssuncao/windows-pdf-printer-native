// Core domain types - platform agnostic
export interface PrintOptions {
  printer?: string;
  copies?: number;
  duplex?: 'simplex' | 'horizontal' | 'vertical';
  paperSize?: number | string;
  paperSource?: number;
  orientation?: 'portrait' | 'landscape';
  color?: boolean;
  quality?: number;
  collate?: boolean;
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
  defaultPaperSize: number | string;
  availablePaperSizes: (number | string)[];
  availablePaperSources: number[];
}
