export enum LogLevel {
  ERROR = 0,
  WARNING = 1,
  DEBUG = 2,
  INFO = 3,
}

export interface Logger {
  log(msg: string, level?: LogLevel): void;
  readonly ERROR: LogLevel.ERROR;
  readonly WARNING: LogLevel.WARNING;
  readonly DEBUG: LogLevel.DEBUG;
  readonly INFO: LogLevel.INFO;
}

const moduleFilter: Set<string> = new Set();
const levelFilter: LogLevel = LogLevel.INFO;

export function createLogger(module: string): Logger {
  return {
    log(msg: string, level: LogLevel = LogLevel.INFO): void {
      if (!moduleFilter.has(module) && level <= levelFilter) {
        const now = new Date();
        const timestamp = now.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const levelName = LogLevel[level];
        console.log(`${timestamp} ${levelName} ${msg}`);
      }
    },
    ERROR: LogLevel.ERROR,
    WARNING: LogLevel.WARNING,
    DEBUG: LogLevel.DEBUG,
    INFO: LogLevel.INFO,
  };
}
