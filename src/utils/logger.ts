/**
 * Structured logging utility with sensitive data masking
 * Provides consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: string;
  stack?: string;
}

// Sensitive field patterns to mask
const SENSITIVE_PATTERNS = [
  'password',
  'apiKey',
  'api_key',
  'token',
  'secret',
  'authorization',
  'auth',
  'key',
];

// Email pattern for masking
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Phone pattern for masking
const PHONE_REGEX = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

export class Logger {
  private minLevel: LogLevel;
  private context: string;

  constructor(context: string, minLevel: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.minLevel = minLevel;
  }

  /**
   * Mask sensitive data in values
   */
  private maskSensitiveData(value: unknown): unknown {
    if (typeof value === 'string') {
      // Mask emails
      let masked = value.replace(EMAIL_REGEX, (email) => {
        const [local, domain] = email.split('@');
        return `${local.substring(0, 2)}***@${domain}`;
      });

      // Mask phone numbers
      masked = masked.replace(PHONE_REGEX, '***-***-****');

      return masked;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.maskSensitiveData(item));
    }

    if (value && typeof value === 'object') {
      const masked: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
          lowerKey.includes(pattern)
        );

        if (isSensitive && typeof val === 'string') {
          // Mask sensitive fields
          masked[key] = val.length > 0 ? '***' + val.slice(-4) : '***';
        } else {
          masked[key] = this.maskSensitiveData(val);
        }
      }
      return masked;
    }

    return value;
  }

  /**
   * Format log entry as structured JSON
   */
  private formatLogEntry(
    level: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `[${this.context}] ${message}`,
    };

    if (context) {
      entry.context = this.maskSensitiveData(context) as LogContext;
    }

    if (error) {
      entry.error = error.message;
      if (error.stack) {
        entry.stack = error.stack;
      }
    }

    return entry;
  }

  /**
   * Log a message if level is enabled
   */
  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (level < this.minLevel) {
      return;
    }

    const entry = this.formatLogEntry(levelName, message, context, error);
    const output = JSON.stringify(entry);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
        console.error(output);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, 'INFO', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, 'WARN', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, 'ERROR', message, context, error);
  }

  /**
   * Create a child logger with the same settings
   */
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`, this.minLevel);
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string, minLevel?: LogLevel): Logger {
  return new Logger(context, minLevel);
}

// Default logger for general use
export const logger = new Logger('App', LogLevel.INFO);
