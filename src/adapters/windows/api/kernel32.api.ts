// Windows Kernel32 API - System error handling
import koffi from 'koffi';

// Load Kernel32.dll (Windows Kernel API)
const kernel32 = koffi.load('kernel32.dll');

// GetLastError - Returns the last error code
export const GetLastError = kernel32.func('GetLastError', 'uint32', []);
