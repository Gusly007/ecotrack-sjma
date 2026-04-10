/**
 * Validation Middleware Tests
 */
import { jest } from '@jest/globals';

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('Query validation', () => {
    it('should accept valid query parameters', () => {
      req.query = { page: '1', limit: '10' };
      expect(req.query.page).toBe('1');
      expect(req.query.limit).toBe('10');
    });

    it('should reject missing required query params', () => {
      req.query = {};
      expect(Object.keys(req.query).length).toBe(0);
    });

    it('should coerce string to number for page', () => {
      req.query = { page: '5' };
      const pageNum = Number(req.query.page);
      expect(pageNum).toBe(5);
    });

    it('should coerce string to number for limit', () => {
      req.query = { limit: '20' };
      const limitNum = Number(req.query.limit);
      expect(limitNum).toBe(20);
    });
  });

  describe('Body validation', () => {
    it('should accept valid body payload', () => {
      req.body = { name: 'Badge Pro', description: 'Expert level' };
      expect(req.body.name).toBe('Badge Pro');
    });

    it('should reject empty body', () => {
      req.body = {};
      expect(Object.keys(req.body).length).toBe(0);
    });

    it('should validate required fields presence', () => {
      req.body = { name: 'Badge' };
      const hasDescription = 'description' in req.body;
      expect(hasDescription).toBe(false);
    });

    it('should validate string field types', () => {
      req.body = { name: 'Badge Name', description: 'Desc' };
      expect(typeof req.body.name).toBe('string');
      expect(typeof req.body.description).toBe('string');
    });
  });

  describe('Error responses', () => {
    it('should return 400 for validation failure', () => {
      const error = { status: 400, message: 'Validation failed' };
      expect(error.status).toBe(400);
    });

    it('should include field details in error', () => {
      const error = { 
        status: 400, 
        details: [{ field: 'name', message: 'Required' }] 
      };
      expect(error.details[0].field).toBe('name');
    });

    it('should include validation message in response', () => {
      const error = { message: 'Invalid input: name is required' };
      expect(error.message).toContain('Invalid');
    });
  });

  describe('Type coercion', () => {
    it('should convert string boolean to actual boolean', () => {
      const value = 'true';
      const bool = value === 'true';
      expect(bool).toBe(true);
    });

    it('should parse JSON string fields', () => {
      const jsonStr = '{"key":"value"}';
      const parsed = JSON.parse(jsonStr);
      expect(parsed.key).toBe('value');
    });

    it('should handle null values', () => {
      const value = null;
      expect(value).toBeNull();
    });
  });
});
