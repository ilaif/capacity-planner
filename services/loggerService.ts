// Log levels enum
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// ANSI color codes for different log levels
const LogColors = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m', // Green
  [LogLevel.WARN]: '\x1b[33m', // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  reset: '\x1b[0m',
} as const;

// Helper to parse log level from string
const parseLogLevel = (level: string): LogLevel => {
  const upperLevel = level.toUpperCase();
  const levelMap: Record<string, LogLevel> = {
    DEBUG: LogLevel.DEBUG,
    INFO: LogLevel.INFO,
    WARN: LogLevel.WARN,
    ERROR: LogLevel.ERROR,
  };
  return levelMap[upperLevel] ?? LogLevel.DEBUG;
};

// Logger configuration
const config = {
  minLevel: parseLogLevel(import.meta.env.VITE_LOG_LEVEL || 'DEBUG'),
  enableTimestamp: true,
  enableStackTrace: true,
  enableColors: true,
};

// Helper to format the timestamp
const getTimestamp = () => new Date().toISOString();

// Helper to format the message
const formatMessage = (level: LogLevel, message: string) => {
  const timestamp = config.enableTimestamp ? `[${getTimestamp()}]` : '';
  const levelName = LogLevel[level];
  const colorStart = config.enableColors ? LogColors[level] : '';
  const colorReset = config.enableColors ? LogColors.reset : '';

  return `${timestamp} ${colorStart}[${levelName}]${colorReset} ${message}`;
};

// Define a type for loggable data
type LoggableData = Record<string, unknown>;

// Main logger functions
export const logger = {
  debug: (message: string, data?: LoggableData) => {
    if (LogLevel.DEBUG >= config.minLevel) {
      const optionalParams = data ? [data] : [];
      console.debug(formatMessage(LogLevel.DEBUG, message), ...optionalParams);
    }
  },

  info: (message: string, data?: LoggableData) => {
    if (LogLevel.INFO >= config.minLevel) {
      const optionalParams = data ? [data] : [];
      console.info(formatMessage(LogLevel.INFO, message), ...optionalParams);
    }
  },

  warn: (message: string, data?: LoggableData) => {
    if (LogLevel.WARN >= config.minLevel) {
      const optionalParams = data ? [data] : [];
      console.warn(formatMessage(LogLevel.WARN, message), ...optionalParams);
    }
  },

  error: (message: string, error?: Error, data?: LoggableData) => {
    if (LogLevel.ERROR >= config.minLevel) {
      const errorData = error
        ? {
            message: error.message,
            stack: config.enableStackTrace ? error.stack : undefined,
            ...(data || {}),
          }
        : data;
      const optionalParams = errorData ? [errorData] : [];
      console.error(formatMessage(LogLevel.ERROR, message), ...optionalParams);
    }
  },
};
