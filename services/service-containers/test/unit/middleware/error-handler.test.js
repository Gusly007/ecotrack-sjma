/**
 * Tests Unitaires - Error Handler Middleware
 * Tests du middleware de gestion d'erreurs
 */

const errorHandler = require('../../../src/middleware/error-handler');
const ApiError = require('../../../src/utils/api-error');
const ApiResponse = require('../../../src/utils/api-response');

jest.mock('../../../src/utils/api-response');

describe('Error Handler Middleware - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      path: '/api/test',
      method: 'GET'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    jest.spyOn(console, 'error').mockImplementation();
    
    ApiResponse.error.mockImplementation((statusCode, message, details) => ({
      success: false,
      statusCode,
      message,
      details: details || undefined
    }));
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('devrait gérer ApiError avec le bon code de statut', () => {
    const error = new ApiError(404, 'Not found');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(ApiResponse.error).toHaveBeenCalledWith(404, 'Not found', null);
  });

  it('devrait gérer les erreurs de contrainte unique (23505)', () => {
    const error = new Error('Duplicate key');
    error.code = '23505';
    error.detail = 'Key (code)=(OM) already exists.';

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(ApiResponse.error).toHaveBeenCalledWith(
      409,
      'Violation de contrainte unique',
      'Key (code)=(OM) already exists.'
    );
  });

  it('devrait gérer les erreurs de contrainte de clé étrangère (23503)', () => {
    const error = new Error('Foreign key violation');
    error.code = '23503';
    error.detail = 'Key (zone_id)=(999) is not present in table "zones".';

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(ApiResponse.error).toHaveBeenCalledWith(
      409,
      'Violation de contrainte de clé étrangère',
      'Key (zone_id)=(999) is not present in table "zones".'
    );
  });

  it('devrait gérer les erreurs génériques avec 500', () => {
    const error = new Error('Unexpected error');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(ApiResponse.error).toHaveBeenCalledWith(500, 'Unexpected error');
  });

  it('devrait logger l\'erreur avec tous les détails', () => {
    const error = new ApiError(400, 'Bad request', { field: 'email' });

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(console.error).toHaveBeenCalledWith(
      ' Error:',
      expect.objectContaining({
        message: 'Bad request',
        statusCode: 400,
        path: '/api/test',
        method: 'GET'
      })
    );
  });
});
