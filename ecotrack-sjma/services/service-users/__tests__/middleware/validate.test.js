import { z } from 'zod';
import { validate } from '../../src/middleware/validate.js';

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds validated object and calls next for valid payload', () => {
    const schema = {
      body: z.object({ email: z.string().email() }),
      params: z.object({ id: z.string() }),
      query: z.object({ page: z.string().optional() })
    };
    const req = {
      body: { email: 'ok@example.com' },
      params: { id: '12' },
      query: { page: '1' }
    };
    const res = createRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(req.validated).toEqual({
      body: { email: 'ok@example.com' },
      params: { id: '12' },
      query: { page: '1' }
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 400 with details for zod validation errors', () => {
    const schema = {
      body: z.object({ email: z.string().email() })
    };
    const req = { body: { email: 'bad-email' }, params: {}, query: {} };
    const res = createRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({ path: 'email' })
        ])
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('passes non-zod errors to next', () => {
    const schema = {
      body: { parse: () => { throw new Error('boom'); } }
    };
    const req = { body: {}, params: {}, query: {} };
    const res = createRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
  });
});