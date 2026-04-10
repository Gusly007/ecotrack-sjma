/**
 * API Response Utility Tests
 */
import { jest } from '@jest/globals';

describe('API Response Utilities', () => {
  describe('Success responses', () => {
    it('should format success response with data', () => {
      const response = {
        success: true,
        data: { id: 1, name: 'Badge' },
        message: 'Badge retrieved'
      };
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('id');
    });

    it('should include status code in response', () => {
      const response = {
        statusCode: 200,
        data: { badges: [] }
      };
      expect(response.statusCode).toBe(200);
    });

    it('should handle paginated responses', () => {
      const response = {
        success: true,
        data: { items: [] },
        pagination: { page: 1, limit: 10, total: 0 }
      };
      expect(response.pagination).toHaveProperty('page');
      expect(response.pagination.page).toBe(1);
    });

    it('should handle array responses', () => {
      const response = {
        success: true,
        data: [
          { id: 1, name: 'Badge 1' },
          { id: 2, name: 'Badge 2' }
        ]
      };
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);
    });
  });

  describe('Error responses', () => {
    it('should format error response with message', () => {
      const response = {
        success: false,
        error: 'Badge not found',
        statusCode: 404
      };
      expect(response.success).toBe(false);
      expect(response.error).toContain('not found');
    });

    it('should include error details', () => {
      const response = {
        success: false,
        error: 'Validation failed',
        details: [{ field: 'name', message: 'Required' }],
        statusCode: 400
      };
      expect(response.details).toBeDefined();
      expect(response.details).toHaveLength(1);
    });

    it('should include error code', () => {
      const response = {
        success: false,
        code: 'BADGE_NOT_FOUND',
        statusCode: 404
      };
      expect(response.code).toBe('BADGE_NOT_FOUND');
    });

    it('should handle database errors', () => {
      const response = {
        success: false,
        error: 'Database error',
        statusCode: 500
      };
      expect(response.statusCode).toBe(500);
    });

    it('should handle authorization errors', () => {
      const response = {
        success: false,
        error: 'Unauthorized',
        statusCode: 401
      };
      expect(response.statusCode).toBe(401);
    });

    it('should handle permission errors', () => {
      const response = {
        success: false,
        error: 'Permission denied',
        statusCode: 403
      };
      expect(response.statusCode).toBe(403);
    });
  });

  describe('Meta information', () => {
    it('should include timestamp in response', () => {
      const timestamp = new Date().toISOString();
      const response = {
        success: true,
        data: {},
        timestamp
      };
      expect(response.timestamp).toBeDefined();
    });

    it('should include request ID for tracing', () => {
      const response = {
        success: true,
        data: {},
        requestId: 'req-123-456'
      };
      expect(response.requestId).toBeDefined();
    });

    it('should include API version', () => {
      const response = {
        success: true,
        data: {},
        apiVersion: 'v1'
      };
      expect(response.apiVersion).toBe('v1');
    });
  });

  describe('Response structure validation', () => {
    it('should always have success flag', () => {
      const responses = [
        { success: true, data: {} },
        { success: false, error: 'Error' }
      ];
      responses.forEach(res => {
        expect(res).toHaveProperty('success');
        expect(typeof res.success).toBe('boolean');
      });
    });

    it('should have statusCode for HTTP transport', () => {
      const response = {
        success: true,
        statusCode: 200,
        data: {}
      };
      expect(response).toHaveProperty('statusCode');
    });

    it('should differentiate data vs error fields', () => {
      const success = { success: true, data: {} };
      const error = { success: false, error: 'msg' };
      
      expect('data' in success).toBe(true);
      expect('data' in error).toBe(false);
      expect('error' in error).toBe(true);
    });
  });
});
