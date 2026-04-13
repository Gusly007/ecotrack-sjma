/**
 * Unit tests for IoT validator functions
 */
const { validate, validateQuery, validateParamId } = require('../../../src/validators/iot.validator');

describe('IoT Validator Functions', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { body: {}, query: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('validateParamId', () => {
    it('should pass valid integer id', () => {
      mockReq.params.id = '5';

      validateParamId(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.params.id).toBe(5);
    });

    it('should reject non-integer id', () => {
      mockReq.params.id = 'abc';

      validateParamId(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject zero id', () => {
      mockReq.params.id = '0';

      validateParamId(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject negative id', () => {
      mockReq.params.id = '-1';

      validateParamId(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validate - simulate schema', () => {
    it('should accept valid body', () => {
      const Joi = require('joi');
      const { simulateSchema } = require('../../../src/validators/iot.validator');
      
      mockReq.body = {
        uid_capteur: 'CAP-001',
        fill_level: 75,
        battery: 90
      };

      const middleware = validate(simulateSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid body', () => {
      const { simulateSchema } = require('../../../src/validators/iot.validator');
      
      mockReq.body = {
        fill_level: 150
      };

      const middleware = validate(simulateSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateQuery - pagination schema', () => {
    it('should accept valid query params', () => {
      const { paginationSchema } = require('../../../src/validators/iot.validator');
      
      mockReq.query = { page: 1, limit: 50 };

      const middleware = validateQuery(paginationSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept query with filters', () => {
      const { paginationSchema } = require('../../../src/validators/iot.validator');
      
      mockReq.query = { 
        page: 2, 
        limit: 100, 
        type_alerte: 'DEBORDEMENT',
        statut: 'ACTIVE'
      };

      const middleware = validateQuery(paginationSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid page', () => {
      const { paginationSchema } = require('../../../src/validators/iot.validator');
      
      mockReq.query = { page: 0 };

      const middleware = validateQuery(paginationSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});