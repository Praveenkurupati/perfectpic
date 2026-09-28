// apps/backend/src/utils/logger.ts
import fs from 'fs';
import path from 'path';

export type LogLevel = 'DEBUG' | 'INFO' | 'HTTP' | 'WARN' | 'ERROR';

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  HTTP: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

// ANSI Color Codes for terminal
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: COLORS.magenta,
  HTTP: COLORS.cyan,
  INFO: COLORS.green,
  WARN: COLORS.yellow,
  ERROR: COLORS.red,
};

class Logger {
  private currentLevel: LogLevel;
  private logDir: string;
  private logFile: string;
  private errorFile: string;

  constructor() {
    const envLevel = (process.env.LOG_LEVEL?.toUpperCase() as LogLevel) || 'INFO';
    this.currentLevel = LOG_LEVELS[envLevel] !== undefined ? envLevel : 'INFO';

    this.logDir = path.resolve(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'combined.log');
    this.errorFile = path.join(this.logDir, 'error.log');

    // Ensure logs directory exists safely
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch {
      // Ignore if filesystem is read-only in sandbox
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  private writeToFile(filePath: string, text: string) {
    try {
      if (fs.existsSync(this.logDir)) {
        fs.appendFile(filePath, text + '\n', () => {});
      }
    } catch {
      // Ignore disk write errors
    }
  }

  private log(level: LogLevel, message: string, meta?: any) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const color = LEVEL_COLORS[level] || COLORS.reset;
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
      const levelBadge = `${color}${COLORS.bold}[${level.padEnd(5)}]${COLORS.reset}`;
      const timeStr = `${COLORS.dim}${timestamp}${COLORS.reset}`;
      const metaFormatted = meta ? `\n  ${COLORS.dim}${JSON.stringify(meta, null, 2)}${COLORS.reset}` : '';
      console.log(`${timeStr} ${levelBadge} ${message}${metaFormatted}`);
    } else {
      // Production JSON output for cloud log aggregators (Datadog, CloudWatch, GCP)
      console.log(JSON.stringify({ timestamp, level, message, ...meta }));
    }

    // Persist to file
    const logText = this.formatMessage(level, message, meta);
    this.writeToFile(this.logFile, logText);
    if (level === 'ERROR') {
      this.writeToFile(this.errorFile, logText);
    }
  }

  public debug(message: string, meta?: any) {
    this.log('DEBUG', message, meta);
  }

  public http(message: string, meta?: any) {
    this.log('HTTP', message, meta);
  }

  public info(message: string, meta?: any) {
    this.log('INFO', message, meta);
  }

  public warn(message: string, meta?: any) {
    this.log('WARN', message, meta);
  }

  public error(message: string, meta?: any) {
    this.log('ERROR', message, meta);
  }
}

export const logger = new Logger();
export default logger;
