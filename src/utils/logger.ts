import { envSchema } from '../config/validation.js';

const env = envSchema.parse(process.env);

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel;
  private requestId: string | null = null;

  constructor() {
    this.logLevel = LogLevel[env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel];
  }

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  clearRequestId(): void {
    this.requestId = null;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const requestId = this.requestId ? `[${this.requestId}]` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${requestId} ${message}${metaStr}`;
  }

  error(message: string, error?: Error | any, meta?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const errorInfo = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;
    
    console.error(this.formatMessage('ERROR', message, { ...meta, error: errorInfo }));
  }

  warn(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage('WARN', message, meta));
  }

  info(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(this.formatMessage('INFO', message, meta));
  }

  debug(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.log(this.formatMessage('DEBUG', message, meta));
  }

  // Security logging
  security(event: string, details: any): void {
    this.warn(`SECURITY: ${event}`, details);
  }

  // Performance logging
  performance(operation: string, duration: number, meta?: any): void {
    this.info(`PERF: ${operation} took ${duration}ms`, meta);
  }

  // Business logic logging
  business(event: string, details: any): void {
    this.info(`BUSINESS: ${event}`, details);
  }
}

export const logger = new Logger();
