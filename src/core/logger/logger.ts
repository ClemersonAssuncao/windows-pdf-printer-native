/**
 * Logger class for structured logging with multiple log levels
 * 
 * Features:
 * - Multiple log levels: DEBUG, INFO, WARN, ERROR
 * - Configurable through environment variables
 * - Timestamp support
 * - Context/namespace support for better log organization
 * - Performance measurement utilities
 * - Colored output (optional)
 * - Silent mode for testing
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LoggerOptions {
  /** Minimum log level to display */
  level?: LogLevel;
  /** Enable/disable timestamps in log messages */
  timestamps?: boolean;
  /** Enable/disable colored output (when supported) */
  colors?: boolean;
  /** Context/namespace for this logger instance */
  context?: string;
  /** Prefix for all log messages */
  prefix?: string;
}

export interface PerformanceTimer {
  /** Start time in milliseconds */
  startTime: number;
  /** Label for the timer */
  label: string;
}

/**
 * Main Logger class
 */
export class Logger {
  private level: LogLevel;
  private timestamps: boolean;
  private colors: boolean;
  private context: string;
  private prefix: string;

  // ANSI color codes for terminal output
  private static readonly COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Foreground colors
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  };

  constructor(options: LoggerOptions = {}) {
    // Determine log level from options or environment
    this.level = options.level ?? this.getLogLevelFromEnv();
    this.timestamps = options.timestamps ?? true;
    this.colors = options.colors ?? this.shouldUseColors();
    this.context = options.context ?? '';
    this.prefix = options.prefix ?? '';
  }

  /**
   * Get log level from environment variables
   * Supports: LOG_LEVEL, DEBUG, NODE_ENV
   */
  private getLogLevelFromEnv(): LogLevel {
    const logLevelEnv = process.env.LOG_LEVEL?.toUpperCase();
    
    if (logLevelEnv) {
      switch (logLevelEnv) {
        case 'DEBUG': return LogLevel.DEBUG;
        case 'INFO': return LogLevel.INFO;
        case 'WARN': return LogLevel.WARN;
        case 'ERROR': return LogLevel.ERROR;
        case 'SILENT': return LogLevel.SILENT;
      }
    }

    // Supports: DEBUG=1, DEBUG=true, DEBUG=*, or any truthy value
    const debugEnv = process.env.DEBUG;
    if (debugEnv && debugEnv !== '0' && debugEnv !== 'false' && debugEnv !== '') {
      return LogLevel.DEBUG;
    }

    // Default based on NODE_ENV
    if (process.env.NODE_ENV === 'test') {
      return LogLevel.SILENT;
    }

    if (process.env.NODE_ENV === 'production') {
      return LogLevel.INFO;
    }

    // Development default
    return LogLevel.INFO;
  }

  /**
   * Determine if colored output should be used
   */
  private shouldUseColors(): boolean {
    // Disable colors in CI environments or when NO_COLOR is set
    if (process.env.NO_COLOR || process.env.CI) {
      return false;
    }

    // Check if stdout is a TTY
    return process.stdout.isTTY ?? false;
  }

  /**
   * Format timestamp for log messages
   */
  private getTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  /**
   * Apply color to text (if colors are enabled)
   */
  private colorize(text: string, color: keyof typeof Logger.COLORS): string {
    if (!this.colors) {
      return text;
    }
    return `${Logger.COLORS[color]}${text}${Logger.COLORS.reset}`;
  }

  /**
   * Format a log message with all metadata
   */
  private formatMessage(level: string, message: string, color: keyof typeof Logger.COLORS): string {
    const parts: string[] = [];

    // Timestamp
    if (this.timestamps) {
      parts.push(this.colorize(this.getTimestamp(), 'gray'));
    }

    // Level
    parts.push(this.colorize(`[${level}]`, color));

    // Context
    if (this.context) {
      parts.push(this.colorize(`[${this.context}]`, 'cyan'));
    }

    // Prefix
    if (this.prefix) {
      parts.push(this.prefix);
    }

    // Message
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, levelName: string, color: keyof typeof Logger.COLORS, message: string, ...args: any[]): void {
    if (this.level > level) {
      return; // Don't log if below minimum level
    }

    const formattedMessage = this.formatMessage(levelName, message, color);

    // Choose appropriate console method
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args);
        break;
      default:
        console.log(formattedMessage, ...args);
    }
  }

  /**
   * Log debug message (verbose/diagnostic information)
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', 'gray', message, ...args);
  }

  /**
   * Log info message (general information)
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, 'INFO', 'blue', message, ...args);
  }

  /**
   * Log warning message (potential issues)
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, 'WARN', 'yellow', message, ...args);
  }

  /**
   * Log error message (errors and exceptions)
   */
  error(message: string, error?: Error | any, ...args: any[]): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, 'ERROR', 'red', `${message}: ${error.message}`, ...args);
      
      // Log stack trace in debug mode
      if (this.level === LogLevel.DEBUG && error.stack) {
        console.error(this.colorize('Stack trace:', 'dim'));
        console.error(this.colorize(error.stack, 'dim'));
      }
    } else if (error) {
      this.log(LogLevel.ERROR, 'ERROR', 'red', message, error, ...args);
    } else {
      this.log(LogLevel.ERROR, 'ERROR', 'red', message, ...args);
    }
  }

  /**
   * Create a performance timer
   */
  startTimer(label: string): PerformanceTimer {
    return {
      startTime: performance.now(),
      label
    };
  }

  /**
   * End a performance timer and log the duration
   */
  endTimer(timer: PerformanceTimer, level: LogLevel = LogLevel.DEBUG): void {
    const duration = performance.now() - timer.startTime;
    const message = `${timer.label} completed in ${duration.toFixed(2)}ms`;
    
    switch (level) {
      case LogLevel.DEBUG:
        this.debug(message);
        break;
      case LogLevel.INFO:
        this.info(message);
        break;
      case LogLevel.WARN:
        this.warn(message);
        break;
      case LogLevel.ERROR:
        this.error(message);
        break;
    }
  }

  /**
   * Log a performance measurement directly
   */
  logPerformance(label: string, durationMs: number, metadata?: Record<string, any>): void {
    const message = `${label} completed in ${durationMs.toFixed(2)}ms`;
    
    if (metadata) {
      const metadataStr = Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      this.debug(`${message} (${metadataStr})`);
    } else {
      this.debug(message);
    }
  }

  /**
   * Create a child logger with additional context
   */
  createChild(context: string, options: Partial<LoggerOptions> = {}): Logger {
    return new Logger({
      level: options.level ?? this.level,
      timestamps: options.timestamps ?? this.timestamps,
      colors: options.colors ?? this.colors,
      context: this.context ? `${this.context}:${context}` : context,
      prefix: options.prefix ?? this.prefix
    });
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Enable or disable timestamps
   */
  setTimestamps(enabled: boolean): void {
    this.timestamps = enabled;
  }

  /**
   * Enable or disable colors
   */
  setColors(enabled: boolean): void {
    this.colors = enabled;
  }

  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return this.level <= level;
  }

  /**
   * Check if debug logging is enabled
   */
  isDebugEnabled(): boolean {
    return this.level <= LogLevel.DEBUG;
  }
}

/**
 * Create a default logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

/**
 * Global default logger instance
 */
export const defaultLogger = createLogger();
