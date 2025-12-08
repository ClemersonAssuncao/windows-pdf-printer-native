/**
 * Logger module exports
 * 
 * Provides structured logging with multiple log levels
 * 
 * @example
 * ```typescript
 * import { createLogger, LogLevel } from './core/logger';
 * 
 * const logger = createLogger({ context: 'MyService', level: LogLevel.DEBUG });
 * 
 * logger.debug('This is a debug message');
 * logger.info('Application started');
 * logger.warn('Low memory warning');
 * logger.error('Failed to connect', error);
 * 
 * // Performance measurement
 * const timer = logger.startTimer('operation');
 * // ... do work ...
 * logger.endTimer(timer);
 * 
 * // Create child logger
 * const childLogger = logger.createChild('SubModule');
 * ```
 */

export {
  Logger,
  LogLevel,
  createLogger,
  defaultLogger
} from './logger';

export type {
  LoggerOptions,
  PerformanceTimer
} from './logger';
