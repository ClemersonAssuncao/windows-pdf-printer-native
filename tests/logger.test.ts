/**
 * Tests for Logger class
 */

import { Logger, LogLevel, createLogger, defaultLogger } from '../src/core/logger';

describe('Logger', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;

    // Restore console
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('LogLevel filtering', () => {
    test('should filter logs based on log level', () => {
      const logger = new Logger({ level: LogLevel.WARN, timestamps: false, colors: false });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    test('should log all messages when level is DEBUG', () => {
      const logger = new Logger({ level: LogLevel.DEBUG, timestamps: false, colors: false });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug + info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    test('should not log anything when level is SILENT', () => {
      const logger = new Logger({ level: LogLevel.SILENT, timestamps: false, colors: false });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Environment variable configuration', () => {
    test('should respect LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'ERROR';
      const logger = new Logger({ timestamps: false, colors: false });

      logger.info('info message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    test('should respect DEBUG environment variable', () => {
      process.env.DEBUG = 'true';
      const logger = new Logger({ timestamps: false, colors: false });

      logger.debug('debug message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('debug message'));
    });

    test('should default to SILENT in test environment', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.LOG_LEVEL;
      delete process.env.DEBUG;

      const logger = new Logger({ timestamps: false, colors: false });

      logger.info('info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    test('should default to INFO in production environment', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;
      delete process.env.DEBUG;

      const logger = new Logger({ timestamps: false, colors: false });

      logger.debug('debug message');
      logger.info('info message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('info message'));
    });
  });

  describe('Message formatting', () => {
    test('should include log level in message', () => {
      const logger = new Logger({ level: LogLevel.DEBUG, timestamps: false, colors: false });

      logger.debug('test message');
      logger.info('test message');
      logger.warn('test message');
      logger.error('test message');

      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('[DEBUG]'));
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('[INFO]'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    });

    test('should include context in message', () => {
      const logger = new Logger({
        level: LogLevel.INFO,
        context: 'TestService',
        timestamps: false,
        colors: false
      });

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[TestService]'));
    });

    test('should include prefix in message', () => {
      const logger = new Logger({
        level: LogLevel.INFO,
        prefix: 'PREFIX',
        timestamps: false,
        colors: false
      });

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('PREFIX'));
    });

    test('should include timestamp when enabled', () => {
      const logger = new Logger({ level: LogLevel.INFO, timestamps: true, colors: false });

      logger.info('test message');

      // Check for timestamp format HH:MM:SS.mmm
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/\d{2}:\d{2}:\d{2}\.\d{3}/));
    });

    test('should not include timestamp when disabled', () => {
      const logger = new Logger({ level: LogLevel.INFO, timestamps: false, colors: false });

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.not.stringMatching(/\d{2}:\d{2}:\d{2}\.\d{3}/));
    });
  });

  describe('Error logging', () => {
    test('should log error with message', () => {
      const logger = new Logger({ level: LogLevel.ERROR, timestamps: false, colors: false });
      const error = new Error('Test error');

      logger.error('Operation failed', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed: Test error')
      );
    });

    test('should log error without Error object', () => {
      const logger = new Logger({ level: LogLevel.ERROR, timestamps: false, colors: false });

      logger.error('Operation failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed')
      );
    });

    test('should log stack trace in debug mode', () => {
      const logger = new Logger({ level: LogLevel.DEBUG, timestamps: false, colors: false });
      const error = new Error('Test error');
      error.stack = 'Stack trace here';

      logger.error('Operation failed', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:')
      );
    });

    test('should not log stack trace in non-debug mode', () => {
      const logger = new Logger({ level: LogLevel.ERROR, timestamps: false, colors: false });
      const error = new Error('Test error');
      error.stack = 'Stack trace here';

      logger.error('Operation failed', error);

      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:')
      );
    });
  });

  describe('Performance measurement', () => {
    test('should measure and log performance', () => {
      const logger = new Logger({ level: LogLevel.DEBUG, timestamps: false, colors: false });

      const timer = logger.startTimer('test operation');
      logger.endTimer(timer);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/test operation completed in \d+\.\d{2}ms/)
      );
    });

    test('should log performance with metadata', () => {
      const logger = new Logger({ level: LogLevel.DEBUG, timestamps: false, colors: false });

      logger.logPerformance('test operation', 42.5, { size: '100KB', count: 5 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('test operation completed in 42.50ms (size: 100KB, count: 5)')
      );
    });

    test('should respect log level when ending timer', () => {
      const logger = new Logger({ level: LogLevel.INFO, timestamps: false, colors: false });

      const timer = logger.startTimer('test operation');
      logger.endTimer(timer, LogLevel.DEBUG);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Child logger', () => {
    test('should create child logger with nested context', () => {
      const parentLogger = new Logger({
        context: 'Parent',
        level: LogLevel.INFO,
        timestamps: false,
        colors: false
      });

      const childLogger = parentLogger.createChild('Child');
      childLogger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[Parent:Child]'));
    });

    test('should inherit parent settings', () => {
      const parentLogger = new Logger({
        level: LogLevel.WARN,
        timestamps: false,
        colors: false
      });

      const childLogger = parentLogger.createChild('Child');
      childLogger.info('info message');
      childLogger.warn('warn message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    test('should allow overriding parent settings', () => {
      const parentLogger = new Logger({
        level: LogLevel.WARN,
        timestamps: false,
        colors: false
      });

      const childLogger = parentLogger.createChild('Child', { level: LogLevel.DEBUG });
      childLogger.debug('debug message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Level management', () => {
    test('should allow changing log level dynamically', () => {
      const logger = new Logger({ level: LogLevel.WARN, timestamps: false, colors: false });

      logger.info('should not log');
      logger.setLevel(LogLevel.INFO);
      logger.info('should log');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    test('should return current log level', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });

      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });

    test('should check if level is enabled', () => {
      const logger = new Logger({ level: LogLevel.WARN });

      expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(false);
      expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(false);
      expect(logger.isLevelEnabled(LogLevel.WARN)).toBe(true);
      expect(logger.isLevelEnabled(LogLevel.ERROR)).toBe(true);
    });

    test('should check if debug is enabled', () => {
      const debugLogger = new Logger({ level: LogLevel.DEBUG });
      const infoLogger = new Logger({ level: LogLevel.INFO });

      expect(debugLogger.isDebugEnabled()).toBe(true);
      expect(infoLogger.isDebugEnabled()).toBe(false);
    });
  });

  describe('Utility functions', () => {
    test('createLogger should create a new logger instance', () => {
      const logger = createLogger({ context: 'Test' });

      expect(logger).toBeInstanceOf(Logger);
    });

    test('defaultLogger should be available', () => {
      expect(defaultLogger).toBeInstanceOf(Logger);
    });
  });

  describe('Color support', () => {
    test('should disable colors when NO_COLOR is set', () => {
      process.env.NO_COLOR = '1';
      const logger = new Logger({ level: LogLevel.INFO, timestamps: false });

      logger.info('test message');

      // Should not contain ANSI color codes
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.not.stringMatching(/\x1b\[\d+m/));
    });

    test('should disable colors in CI environment', () => {
      process.env.CI = 'true';
      const logger = new Logger({ level: LogLevel.INFO, timestamps: false });

      logger.info('test message');

      // Should not contain ANSI color codes
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.not.stringMatching(/\x1b\[\d+m/));
    });

    test('should allow manual color control', () => {
      const logger = new Logger({ level: LogLevel.INFO, timestamps: false, colors: false });

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.not.stringMatching(/\x1b\[\d+m/));

      consoleLogSpy.mockClear();
      logger.setColors(true);
      logger.info('test message');

      // After enabling colors, should contain ANSI codes
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/\x1b\[\d+m/));
    });
  });

  describe('Additional arguments', () => {
    test('should pass additional arguments to console', () => {
      const logger = new Logger({ level: LogLevel.INFO, timestamps: false, colors: false });
      const obj = { key: 'value' };

      logger.info('test message', obj, 'extra');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('test message'),
        obj,
        'extra'
      );
    });
  });
});
