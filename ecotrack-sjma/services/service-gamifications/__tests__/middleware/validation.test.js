import { jest } from '@jest/globals';
import { z } from 'zod';
import { validateBody, validateQuery } from '../../src/middleware/validation.js';

describe('validation middleware', () => {
  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  });

  it('validateQuery parses valid query and calls next', () => {
    const schema = z.object({
      page: z.preprocess((v) => parseInt(v, 10), z.number().int().positive())
    });

    const req = { query: { page: '2' } };
    const res = makeRes();
    const next = jest.fn();

    validateQuery(schema)(req, res, next);

    expect(req.query.page).toBe(2);
    expect(next).toHaveBeenCalled();
  });

  it('validateQuery returns 400 on parse error', () => {
    const schema = z.object({ page: z.number().int().positive() });
    const req = { query: { page: 'x' } };
    const res = makeRes();
    const next = jest.fn();

    validateQuery(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Paramètres invalides' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('validateBody parses valid body and calls next', () => {
    const schema = z.object({
      titre: z.string().min(1),
      objectif: z.number().int().positive()
    });

    const req = { body: { titre: 'Tri', objectif: 3 } };
    const res = makeRes();
    const next = jest.fn();

    validateBody(schema)(req, res, next);

    expect(req.body.titre).toBe('Tri');
    expect(next).toHaveBeenCalled();
  });

  it('validateBody returns 400 on invalid payload', () => {
    const schema = z.object({ titre: z.string().min(1) });
    const req = { body: { titre: '' } };
    const res = makeRes();
    const next = jest.fn();

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Corps de requête invalide' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
