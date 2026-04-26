const errorHandler = require('../../../src/middleware/error-handler');
const ApiError = require('../../../src/utils/api-error');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('error-handler middleware', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('handles ApiError with status and details', () => {
    const req = { path: '/iot/test', method: 'GET' };
    const res = createRes();
    const err = new ApiError(422, 'Validation failed', { field: 'battery' });

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 422,
        message: 'Validation failed',
        details: { field: 'battery' }
      })
    );
  });

  test('maps postgres constraint errors to 409', () => {
    const req = { path: '/iot/test', method: 'POST' };

    const duplicateRes = createRes();
    errorHandler({ code: '23505', detail: 'duplicate key' }, req, duplicateRes, jest.fn());
    expect(duplicateRes.status).toHaveBeenCalledWith(409);
    expect(duplicateRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 409,
        message: 'Violation de contrainte unique',
        details: 'duplicate key'
      })
    );

    const fkRes = createRes();
    errorHandler({ code: '23503', detail: 'fk violation' }, req, fkRes, jest.fn());
    expect(fkRes.status).toHaveBeenCalledWith(409);
    expect(fkRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 409,
        message: 'Violation de contrainte de clé étrangère',
        details: 'fk violation'
      })
    );
  });

  test('falls back to generic status/message handling', () => {
    const req = { path: '/iot/test', method: 'PATCH' };

    const withStatus = createRes();
    errorHandler({ statusCode: 400, message: 'Bad request' }, req, withStatus, jest.fn());
    expect(withStatus.status).toHaveBeenCalledWith(400);
    expect(withStatus.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        message: 'Bad request'
      })
    );

    const fallback = createRes();
    errorHandler({}, req, fallback, jest.fn());
    expect(fallback.status).toHaveBeenCalledWith(500);
    expect(fallback.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: 'Erreur serveur interne'
      })
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});