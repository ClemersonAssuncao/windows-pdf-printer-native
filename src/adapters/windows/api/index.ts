// Windows Graphics Device Interface API
// This file re-exports all Windows API functions for backwards compatibility
// The APIs are now organized into separate files:
// - gdi32.api.ts: GDI32 functions (Graphics Device Interface)
// - winspool.api.ts: Winspool functions (Print Spooler)
// - kernel32.api.ts: Kernel32 functions (System)
// - comdlg32.api.ts: Common Dialog functions (Print Dialog)

// Re-export GDI32 API
export * from './gdi32.api';

// Re-export Winspool API
export * from './winspool.api';

// Re-export Kernel32 API
export * from './kernel32.api';

// Re-export Comdlg32 API
export * from './comdlg32.api';
