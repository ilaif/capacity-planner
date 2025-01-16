import { logger } from '../loggerService';

describe('loggerService', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup console spies
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console spies
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('debug', () => {
    it('should log debug messages with timestamp', () => {
      const message = 'Debug message';
      const data = { key: 'value' };

      logger.debug(message, data);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[DEBUG\] Debug message/
        ),
        data
      );
    });

    it('should handle undefined data', () => {
      const message = 'Debug message';

      logger.debug(message);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[DEBUG\] Debug message/
        )
      );
    });
  });

  describe('info', () => {
    it('should log info messages with timestamp', () => {
      const message = 'Info message';
      const data = { key: 'value' };

      logger.info(message, data);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[INFO\] Info message/
        ),
        data
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages with timestamp', () => {
      const message = 'Warning message';
      const data = { key: 'value' };

      logger.warn(message, data);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[WARN\] Warning message/
        ),
        data
      );
    });
  });

  describe('error', () => {
    it('should log error messages with timestamp and error details', () => {
      const message = 'Error message';
      const error = new Error('Test error');
      const data = { key: 'value' };

      logger.error(message, error, data);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[ERROR\] Error message/
        ),
        expect.objectContaining({
          message: 'Test error',
          stack: expect.any(String),
          key: 'value',
        })
      );
    });

    it('should handle error without additional data', () => {
      const message = 'Error message';
      const error = new Error('Test error');

      logger.error(message, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[ERROR\] Error message/
        ),
        expect.objectContaining({
          message: 'Test error',
          stack: expect.any(String),
        })
      );
    });

    it('should handle error message without error object', () => {
      const message = 'Error message';
      const data = { key: 'value' };

      logger.error(message, undefined, data);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[ERROR\] Error message/
        ),
        data
      );
    });
  });
});
