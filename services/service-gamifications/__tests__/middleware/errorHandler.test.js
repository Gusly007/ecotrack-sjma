import { jest } from '@jest/globals';

describe('errorHandler middleware', () => {
  const originalEnv = { ...process.env };

  const setup = async (nodeEnv = 'test', verbose = '0') => {
    jest.resetModules();
    process.env.NODE_ENV = nodeEnv;
    process.env.VERBOSE_ERRORS = verbose;

    const logger = {
      error: jest.fn(),
      info: jest.fn()
    };

    jest.unstable_mockModule('../../src/utils/logger.js', () => ({
      default: logger
    }));

    const mod = await import('../../src/middleware/errorHandler.js');

    const req = { path: '/x', method: 'POST' };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();

    return { ...mod, logger, req, res, next };
  };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('handles 23505 as conflict', async () => {
    const { errorHandler, res, req, next } = await setup();
    errorHandler({ code: '23505', message: 'dup' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('handles 23503 as bad request', async () => {
    const { errorHandler, res, req, next } = await setup();
    errorHandler({ code: '23503', message: 'fk' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles 23514 as bad request', async () => {
    const { errorHandler, res, req, next } = await setup();
    errorHandler({ code: '23514', message: 'check' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles not found by status', async () => {
    const { errorHandler, res, req, next } = await setup();
    errorHandler({ status: 404, message: 'missing' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('handles not found by message', async () => {
    const { errorHandler, res, req, next } = await setup();
    errorHandler({ message: 'resource not found' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('handles access denied', async () => {
    const { errorHandler, res, req, next } = await setup();
    errorHandler({ message: 'access denied' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('handles token errors', async () => {
    const { errorHandler, res, req, next } = await setup();
    errorHandler({ message: 'token expired' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('handles validation status with details', async () => {
    const { errorHandler, res, req, next } = await setup();
    const details = [{ field: 'x' }];
    errorHandler({ status: 400, message: 'validation failed', details }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Données invalides.', details });
  });

  it('handles ValidationError name branch', async () => {
    const { errorHandler, res, req, next } = await setup();
    const details = [{ field: 'x' }];
    errorHandler({ name: 'ValidationError', details }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles 429 status', async () => {
    const { errorHandler, res, req, next } = await setup();
    errorHandler({ status: 429, message: 'too many' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('returns verbose debug in non-prod when enabled', async () => {
    const { errorHandler, res, req, next } = await setup('development', '1');
    errorHandler({ code: 'X001', message: 'boom' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Erreur interne du serveur.',
        debug: { code: 'X001', error: 'boom' }
      })
    );
  });

  it('returns generic 500 in production', async () => {
    const { errorHandler, res, req, next } = await setup('production', '1');
    errorHandler({ code: 'X001', message: 'boom', stack: 'secret' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur interne du serveur.' });
  });

  it('logs with stack omitted in production', async () => {
    const { errorHandler, res, req, next, logger } = await setup('production', '0');
    errorHandler({ message: 'err', stack: 'hidden' }, req, res, next);
    const payload = logger.error.mock.calls[0][0];
    expect(payload.stack).toBeUndefined();
  });

  it('asyncHandler forwards rejection to next', async () => {
    const { asyncHandler, next } = await setup();
    const wrapped = asyncHandler(async () => {
      throw new Error('kaboom');
    });
    await wrapped({}, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('AppError sets metadata fields', async () => {
    const { AppError } = await setup();
    const err = new AppError('Bad input', 422, 'VALIDATION_X', [{ f: 'x' }]);
    expect(err.message).toBe('Bad input');
    expect(err.status).toBe(422);
    expect(err.code).toBe('VALIDATION_X');
    expect(err.name).toBe('AppError');
  });
});
