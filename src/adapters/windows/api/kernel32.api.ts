// Windows Kernel32 API - System functions
import koffi from 'koffi';
import * as os from 'os';

// Only load Windows DLLs on Windows platform
const isWindows = os.platform() === 'win32';
const kernel32 = isWindows ? koffi.load('kernel32.dll') : null as any;

// GetLastError - Returns the last error code
export const GetLastError = isWindows 
  ? kernel32.func('GetLastError', 'uint32', [])
  : (() => 0) as any;
