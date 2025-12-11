// Windows Kernel32 API - System error handling
import koffi from 'koffi';

// Load Kernel32.dll (Windows Kernel API)
const kernel32 = koffi.load('kernel32.dll');

// GetLastError - Returns the last error code
export const GetLastError = kernel32.func('GetLastError', 'uint32', []);

// Global memory management functions
/**
 * Allocate global memory handle
 */
export const GlobalAlloc = kernel32.func('GlobalAlloc', 'void*', ['uint32', 'uintptr']);

/**
 * Free global memory handle
 */
export const GlobalFree = kernel32.func('GlobalFree', 'void*', ['void*']);

/**
 * Lock global memory handle
 */
export const GlobalLock = kernel32.func('GlobalLock', 'void*', ['void*']);

/**
 * Unlock global memory handle
 */
export const GlobalUnlock = kernel32.func('GlobalUnlock', 'bool', ['void*']);

// Global memory allocation flags
export const GMEM_MOVEABLE = 0x0002;
export const GMEM_ZEROINIT = 0x0040;
export const GHND = GMEM_MOVEABLE | GMEM_ZEROINIT;
