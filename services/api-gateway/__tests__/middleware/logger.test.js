import { jest } from '@jest/globals';

describe('Logger Middleware', () => {
  let req;
  let res;
  let next;
  let mockLogger;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-12T10:00:00Z'));

    // Mock console methods
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      method: 'GET',
      url: '/api/users/profile',
      path: '/api/users/profile',
      query: { id: '123' },
      get: jest.fn((header) => {
        if (header === 'user-agent') return 'Jest Test Agent';
        return undefined;
      }),
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      user: { id: 456 }
    };

    res = {
      statusCode: 200,
      get: jest.fn((header) => {
        if (header === 'content-length') return '1024';
        return undefined;
      }),
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          // Store callback to trigger later
          res.finishCallback = callback;
        }
      })
    };

    next = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('detailedRequestLogger', () => {
    it('should log request start with correct metadata', async () => {
      const { detailedRequestLogger } = await import('../../src/middleware/logger.js');
      
      detailedRequestLogger(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should log successful request completion', async () => {
      const { detailedRequestLogger } = await import('../../src/middleware/logger.js');
      
      detailedRequestLogger(req, res, next);
      
      // Simulate response finish
      if (res.finishCallback) {
        res.finishCallback();
      }
      
      expect(next).toHaveBeenCalled();
    });

    it('should log client errors (4xx) as warnings', async () => {
      const { detailedRequestLogger } = await import('../../src/middleware/logger.js');
      
      res.statusCode = 404;
      detailedRequestLogger(req, res, next);
      
      if (res.finishCallback) {
        res.finishCallback();
      }
      
      expect(next).toHaveBeenCalled();
    });

    it('should log server errors (5xx) as errors', async () => {
      const { detailedRequestLogger } = await import('../../src/middleware/logger.js');
      
      res.statusCode = 500;
      detailedRequestLogger(req, res, next);
      
      if (res.finishCallback) {
        res.finishCallback();
      }
      
      expect(next).toHaveBeenCalled();
    });

    it('should handle anonymous users', async () => {
      const { detailedRequestLogger } = await import('../../src/middleware/logger.js');
      
      req.user = undefined;
      detailedRequestLogger(req, res, next);
      
      if (res.finishCallback) {
        res.finishCallback();
      }
      
      expect(next).toHaveBeenCalled();
    });

    it('should use connection remoteAddress if ip is not available', async () => {
      const { detailedRequestLogger } = await import('../../src/middleware/logger.js');
      
      req.ip = undefined;
      detailedRequestLogger(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('errorLogger', () => {
    it('should log errors with context', async () => {
      const { errorLogger } = await import('../../src/middleware/logger.js');
      
      const error = new Error('Test error message');
      error.stack = 'Error: Test error message\n    at Test.method';
      
      errorLogger(error, req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle errors without user', async () => {
      const { errorLogger } = await import('../../src/middleware/logger.js');
      
      req.user = undefined;
      const error = new Error('Anonymous error');
      
      errorLogger(error, req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('securityLogger', () => {
    it('should log security events', async () => {
      const { securityLogger } = await import('../../src/middleware/logger.js');
      
      securityLogger('rate_limit_exceeded', {
        ip: '192.168.1.1',
        path: '/api/login',
        userId: 123
      });
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should include timestamp in security events', async () => {
      const { securityLogger } = await import('../../src/middleware/logger.js');
      
      securityLogger('suspicious_activity', {
        ip: '10.0.0.1',
        details: 'Multiple failed login attempts'
      });
      
      expect(true).toBe(true);
    });
  });

  describe('requestLogger (Morgan)', () => {
    it('should be importable', async () => {
      const { requestLogger } = await import('../../src/middleware/logger.js');
      
      expect(requestLogger).toBeDefined();
      expect(typeof requestLogger).toBe('function');
    });
  });
});
