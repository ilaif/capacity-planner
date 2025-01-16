// Log levels enum
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Logger configuration
const config = {
  minLevel: LogLevel.DEBUG,
  enableTimestamp: true,
  enableStackTrace: true,
};

// Helper to format the timestamp
const getTimestamp = () => new Date().toISOString();

// Helper to format the message
const formatMessage = (level: LogLevel, message: string) => {
  const timestamp = config.enableTimestamp ? `[${getTimestamp()}]` : '';
  return `${timestamp} [${level}] ${message}`;
};

// Define a type for loggable data
type LoggableData = Record<string, unknown>;

// Main logger functions
export const logger = {
  debug: (message: string, data?: LoggableData) => {
    if (config.minLevel === LogLevel.DEBUG) {
      const optionalParams = data ? [data] : [];
      console.debug(formatMessage(LogLevel.DEBUG, message), ...optionalParams);
    }
  },

  info: (message: string, data?: LoggableData) => {
    if (config.minLevel <= LogLevel.INFO) {
      const optionalParams = data ? [data] : [];
      console.info(formatMessage(LogLevel.INFO, message), ...optionalParams);
    }
  },

  warn: (message: string, data?: LoggableData) => {
    if (config.minLevel <= LogLevel.WARN) {
      const optionalParams = data ? [data] : [];
      console.warn(formatMessage(LogLevel.WARN, message), ...optionalParams);
    }
  },

  error: (message: string, error?: Error, data?: LoggableData) => {
    if (config.minLevel <= LogLevel.ERROR) {
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
