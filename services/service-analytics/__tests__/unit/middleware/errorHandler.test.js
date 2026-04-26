jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

const logger = require('../../../src/utils/logger');
const { errorHandler, asyncHandler, AppError } = require('../../../src/middleware/errorHandler');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.VERBOSE_ERRORS;
    process.env.NODE_ENV = 'test';
  });

  test('logs request metadata and maps postgres error codes', () => {
    const req = { path: '/items', method: 'POST', body: { name: 'x' } };
    const res = createRes();

    errorHandler({ code: '23505', message: 'duplicate key', stack: 'stack' }, req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Conflit : Ressource déjà existante.' });

    errorHandler({ code: '23503', message: 'fk', stack: 'stack' }, req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    errorHandler({ code: '23514', message: 'check', stack: 'stack' }, req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    expect(logger.error).toHaveBeenCalled();
  });

  test('maps status and message-based branches', () => {
    const req = { path: '/items', method: 'GET', body: {} };
    const res = createRes();

    errorHandler({ status: 404, message: 'not found' }, req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    errorHandler({ status: 403, message: 'access denied' }, req, res);
    expect(res.status).toHaveBeenCalledWith(403);

    errorHandler({ status: 401, message: 'token expired' }, req, res);
    expect(res.status).toHaveBeenCalledWith(401);

    errorHandler({ status: 400, message: 'validation failed', details: { field: 'a' } }, req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Données invalides.', details: { field: 'a' } });

    errorHandler({ name: 'ValidationError', details: ['x'] }, req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Validation échouée.', details: ['x'] });

    errorHandler({ status: 429, message: 'too many requests' }, req, res);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('supports verbose internal errors outside production', () => {
    process.env.VERBOSE_ERRORS = '1';
    process.env.NODE_ENV = 'development';
    const req = { path: '/items', method: 'GET', body: { foo: 'bar' } };
    const res = createRes();

    errorHandler({ message: 'boom', code: 'XX', stack: 'line1\nline2\nline3\nline4\nline5\nline6' }, req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erreur interne du serveur.',
      debug: {
        code: 'XX',
        error: 'boom',
        stack: ['line1', 'line2', 'line3', 'line4', 'line5']
      }
    });
  });

  test('falls back to generic 500 in production mode', () => {
    process.env.NODE_ENV = 'production';
    const req = { path: '/items', method: 'GET', body: { foo: 'bar' } };
    const res = createRes();

    errorHandler({ message: 'boom' }, req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur interne du serveur.' });
  });

  test('asyncHandler forwards rejected promises', async () => {
    const next = jest.fn();
    const handler = asyncHandler(async () => {
      throw new Error('fail');
    });

    handler({}, {}, next);
    await new Promise(resolve => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('AppError stores metadata', () => {
    const err = new AppError('bad', 418, 'X', { field: 'name' });

    expect(err.message).toBe('bad');
    expect(err.status).toBe(418);
    expect(err.code).toBe('X');
    expect(err.details).toEqual({ field: 'name' });
    expect(err.name).toBe('AppError');
  });
});



