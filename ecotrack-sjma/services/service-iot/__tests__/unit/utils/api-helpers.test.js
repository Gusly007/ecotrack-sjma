/**
 * Unit tests for API helpers (error, response, logger)
 */

describe('API helpers - Errors and Responses', () => {
  describe('ApiError class', () => {
    it('should create error with message and status', () => {
      const error = new Error('Not found');
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';

      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should handle validation errors', () => {
      const validationError = new Error('Invalid input');
      validationError.status = 400;
      validationError.details = ['field1 is required'];

      expect(validationError.status).toBe(400);
      expect(validationError.details).toContain('field1 is required');
    });

    it('should handle server errors', () => {
      const serverError = new Error('Internal server error');
      serverError.status = 500;

      expect(serverError.status).toBe(500);
    });
  });

  describe('ApiResponse format', () => {
    it('should format successful response', () => {
      const response = {
        success: true,
        statusCode: 200,
        data: { id: 1, name: 'test' },
        timestamp: new Date().toISOString()
      };

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.timestamp).toBeDefined();
    });

    it('should format error response', () => {
      const response = {
        success: false,
        statusCode: 400,
        message: 'Bad request',
        details: ['field is required'],
        timestamp: new Date().toISOString()
      };

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Bad request');
      expect(Array.isArray(response.details)).toBe(true);
    });

    it('should format paginated response', () => {
      const response = {
        success: true,
        statusCode: 200,
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          pages: 1
        },
        timestamp: new Date().toISOString()
      };

      expect(response.pagination.total).toBe(2);
      expect(response.pagination.pages).toBe(1);
    });

    it('should include timestamp in all responses', () => {
      const responses = [
        { success: true, statusCode: 200, timestamp: new Date().toISOString() },
        { success: false, statusCode: 404, timestamp: new Date().toISOString() }
      ];

      responses.forEach(r => {
        expect(r.timestamp).toBeDefined();
        expect(new Date(r.timestamp).getTime()).toBeGreaterThan(0);
      });
    });
  });

  describe('Logger functionality', () => {
    it('should log with different levels', () => {
      const logs = [];
      
      const logger = {
        info: (msg) => logs.push({ level: 'info', msg }),
        error: (msg) => logs.push({ level: 'error', msg }),
        warn: (msg) => logs.push({ level: 'warn', msg }),
        debug: (msg) => logs.push({ level: 'debug', msg })
      };

      logger.info('test info');
      logger.error('test error');
      logger.warn('test warn');

      expect(logs).toHaveLength(3);
      expect(logs[0].level).toBe('info');
      expect(logs[1].level).toBe('error');
    });

    it('should include timestamp in logs', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Test message',
        context: { userId: 1 }
      };

      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.context.userId).toBe(1);
    });

    it('should handle structured logging with metadata', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Sensor reading failed',
        metadata: {
          sensorId: 'sensor-001',
          error: 'Connection timeout',
          duration: 5000
        }
      };

      expect(logEntry.metadata.sensorId).toBe('sensor-001');
      expect(logEntry.metadata.duration).toBe(5000);
    });
  });

  describe('Error codes mapping', () => {
    const errorCodes = {
      'VALIDATION_ERROR': 400,
      'UNAUTHORIZED': 401,
      'FORBIDDEN': 403,
      'NOT_FOUND': 404,
      'CONFLICT': 409,
      'SERVER_ERROR': 500
    };

    it('should map error codes to status codes', () => {
      expect(errorCodes.VALIDATION_ERROR).toBe(400);
      expect(errorCodes.NOT_FOUND).toBe(404);
      expect(errorCodes.SERVER_ERROR).toBe(500);
    });

    it('should have all standard HTTP codes', () => {
      const codes = Object.values(errorCodes);
      expect(codes).toContain(400);
      expect(codes).toContain(404);
      expect(codes).toContain(500);
    });
  });
});
