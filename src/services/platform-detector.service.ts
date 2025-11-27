// Platform detection service
import * as os from 'os';

export type Platform = 'windows' | 'unix';

export class PlatformDetector {
  private static platform: Platform | null = null;
  
  /**
   * Detect current platform
   */
  static detect(): Platform {
    if (this.platform) {
      return this.platform;
    }
    
    this.platform = os.platform() === 'win32' ? 'windows' : 'unix';
    return this.platform;
  }
  
  /**
   * Check if running on Windows
   */
  static isWindows(): boolean {
    return this.detect() === 'windows';
  }
  
  /**
   * Check if running on Unix (Linux/macOS)
   */
  static isUnix(): boolean {
    return this.detect() === 'unix';
  }
  
  /**
   * Get platform name
   */
  static getPlatform(): Platform {
    return this.detect();
  }
}
