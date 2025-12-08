/**
 * Type definitions for Node.js globals used in the logger
 */

declare global {
  interface ProcessEnv {
    LOG_LEVEL?: string;
    DEBUG?: string;
    NODE_ENV?: string;
    NO_COLOR?: string;
    CI?: string;
  }

  interface Process {
    env: ProcessEnv;
    stdout: {
      isTTY?: boolean;
    };
  }

  interface Console {
    log(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
  }

  interface Performance {
    now(): number;
  }

  const process: Process;
  const console: Console;
  const performance: Performance;
}

export {};
