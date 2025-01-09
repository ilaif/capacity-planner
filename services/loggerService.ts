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
const formatMessage = (level: LogLevel, message: string, data?: any) => {
  const timestamp = config.enableTimestamp ? `[${getTimestamp()}]` : '';
  const dataString = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  return `${timestamp} [${level}] ${message}${dataString}`;
};

// Main logger functions
export const logger = {
  debug: (message: string, data?: any) => {
    if (config.minLevel === LogLevel.DEBUG) {
      console.debug(formatMessage(LogLevel.DEBUG, message, data));
    }
  },

  info: (message: string, data?: any) => {
    if (config.minLevel <= LogLevel.INFO) {
      console.info(formatMessage(LogLevel.INFO, message, data));
    }
  },

  warn: (message: string, data?: any) => {
    if (config.minLevel <= LogLevel.WARN) {
      console.warn(formatMessage(LogLevel.WARN, message, data));
    }
  },

  error: (message: string, error?: Error, data?: any) => {
    if (config.minLevel <= LogLevel.ERROR) {
      const errorData = error
        ? {
            message: error.message,
            stack: config.enableStackTrace ? error.stack : undefined,
            ...data,
          }
        : data;
      console.error(formatMessage(LogLevel.ERROR, message, errorData));
    }
  },
};
