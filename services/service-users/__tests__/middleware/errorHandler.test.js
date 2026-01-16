import { errorHandler, asyncHandler } from '../../src/middleware/errorHandler';

describe('errorHandler', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;
  let consoleErrorSpy;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle error with code 23005 and return status 409', () => {
    const error = new Error('Conflict');
    error.code = '23005';
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Conflit : Ressource déjà existante.' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle "not found" errors and return status 404', () => {
    const error = new Error('Resource not found');
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Resource not found' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle "token" errors and return status 401', () => {
    const error = new Error('Invalid token');
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Token invalide ou expiré.' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle "validation" errors and return status 400', () => {
    const error = new Error('some Validation error');
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Données invalides.' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle other errors and return status 500', () => {
    const error = new Error('Some other error');
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Erreur interne du serveur.' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe('asyncHandler', () => {
  it('should call next with error if promise is rejected', async () => {
    const error = new Error('Async error');
    const asyncFn = jest.fn().mockRejectedValue(error);
    const nextFunction = jest.fn();

    await asyncHandler(asyncFn)({}, {}, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(error);
  });

  it('should not call next with error if promise is resolved', async () => {
    const asyncFn = jest.fn().mockResolvedValue('Success');
    const nextFunction = jest.fn();

    await asyncHandler(asyncFn)({}, {}, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
  });
});
