/**
 * Logger utility for debugging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix = '[CLNCH]';

  debug(message: string, data?: unknown): void {
    console.log(`${this.prefix} ${message}`, data);
  }

  info(message: string, data?: unknown): void {
    console.log(`${this.prefix} ${message}`, data);
  }

  warn(message: string, data?: unknown): void {
    console.warn(`${this.prefix} ${message}`, data);
  }

  error(message: string, data?: unknown): void {
    console.error(`${this.prefix} ${message}`, data);
  }
}

export const logger = new Logger();
