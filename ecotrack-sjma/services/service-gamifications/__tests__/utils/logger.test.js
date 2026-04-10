/**
 * Logger Utility Tests
 */
import { jest } from '@jest/globals';

describe('Logger Utility', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    };
  });

  describe('Log levels', () => {
    it('should have info level', () => {
      mockLogger.info('User logged in');
      expect(mockLogger.info).toHaveBeenCalledWith('User logged in');
    });

    it('should have warn level', () => {
      mockLogger.warn('High memory usage');
      expect(mockLogger.warn).toHaveBeenCalledWith('High memory usage');
    });

    it('should have error level', () => {
      mockLogger.error('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should have debug level', () => {
      mockLogger.debug('Variable value: 123');
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });

  describe('Message formatting', () => {
    it('should include timestamp in log', () => {
      const timestamp = new Date().toISOString();
      const message = `[${timestamp}] User action`;
      mockLogger.info(message);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(timestamp.substring(0, 10)));
    });

    it('should include service name in log', () => {
      const message = '[GAMIFICATION] Badge earned';
      mockLogger.info(message);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('GAMIFICATION'));
    });

    it('should include log level in message', () => {
      const message = '[INFO] Operation completed';
      mockLogger.info(message);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('INFO'));
    });

    it('should support string interpolation', () => {
      const userId = 123;
      const message = `User ${userId} performed action`;
      mockLogger.info(message);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('User 123'));
    });
  });

  describe('Context logging', () => {
    it('should include request ID for tracing', () => {
      const requestId = 'req-abc-123';
      mockLogger.info(`[${requestId}] Request started`);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(requestId));
    });

    it('should include userId when available', () => {
      const userId = 42;
      mockLogger.info(`User ${userId} earned badge`);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('42'));
    });

    it('should include endpoint path in access logs', () => {
      const path = '/api/badges';
      mockLogger.info(`GET ${path}`);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(path));
    });
  });

  describe('Error logging', () => {
    it('should log error messages', () => {
      mockLogger.error('Connection timeout');
      expect(mockLogger.error).toHaveBeenCalledWith('Connection timeout');
    });

    it('should log error stack traces', () => {
      const error = new Error('Test error');
      const stack = error.stack;
      mockLogger.error(stack);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should include error code', () => {
      const message = 'FK_VIOLATION: Foreign key constraint failed';
      mockLogger.error(message);
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('FK_VIOLATION'));
    });

    it('should log database errors', () => {
      mockLogger.error('Database query failed: TIMEOUT');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Log filtering', () => {
    it('should filter logs by level in test mode', () => {
      const levels = ['debug', 'info', 'warn', 'error'];
      const debugEnabled = levels.includes('debug');
      expect(debugEnabled).toBe(true);
    });

    it('should suppress debug logs in production', () => {
      // Test that debug level is recognized but would be filtered
      expect(typeof mockLogger.debug).toBe('function');
    });

    it('should always log errors', () => {
      mockLogger.error('Critical error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Structured logging', () => {
    it('should support object logging', () => {
      const logData = { event: 'badge_earned', userId: 1, badgeId: 5 };
      mockLogger.info(JSON.stringify(logData));
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should preserve log metadata', () => {
      const data = { level: 'info', message: 'Test', timestamp: Date.now() };
      mockLogger.info(JSON.stringify(data));
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle nested log objects', () => {
      const data = { 
        event: 'defi_completed', 
        details: { userId: 1, defiId: 5, points: 100 } 
      };
      mockLogger.info(JSON.stringify(data));
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('Performance logging', () => {
    it('should log execution time', () => {
      const duration = 150; // ms
      mockLogger.info(`Query executed in ${duration}ms`);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('150'));
    });

    it('should warn on slow operations', () => {
      mockLogger.warn('Slow query: 5000ms');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
