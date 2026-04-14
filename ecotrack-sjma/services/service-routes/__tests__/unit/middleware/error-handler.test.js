const errorHandler = require('../../../src/middleware/error-handler');
const ApiError = require('../../../src/utils/api-error');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { path: '/test', method: 'GET' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('devrait gérer une ApiError avec le bon statut', () => {
    const err = new ApiError(404, 'Non trouvé');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Non trouvé' })
    );
  });

  it('devrait retourner 409 pour violation contrainte unique (code 23505)', () => {
    const err = { code: '23505', detail: 'Key already exists', stack: '' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('devrait retourner 409 pour violation de clé étrangère (code 23503)', () => {
    const err = { code: '23503', detail: 'FK violation', stack: '' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('devrait retourner 400 pour violation de contrainte CHECK (code 23514)', () => {
    const err = { code: '23514', detail: 'CHECK violation', stack: '' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('devrait retourner 500 pour une erreur générique', () => {
    const err = new Error('Erreur interne');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
