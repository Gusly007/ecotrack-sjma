const ApiError = require('../../../src/utils/api-error');

describe('ApiError', () => {
  it('devrait créer une erreur avec statusCode et message', () => {
    const err = new ApiError(400, 'Mauvaise requête');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Mauvaise requête');
    expect(err.details).toBeNull();
    expect(err).toBeInstanceOf(Error);
  });

  it('devrait créer une erreur 400 via badRequest()', () => {
    const err = ApiError.badRequest('Champ manquant', { field: 'id' });
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ field: 'id' });
  });

  it('devrait créer une erreur 404 via notFound()', () => {
    const err = ApiError.notFound('Tournée 99 introuvable');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Tournée 99 introuvable');
  });

  it('devrait créer une erreur 409 via conflict()', () => {
    const err = ApiError.conflict('Code déjà existant');
    expect(err.statusCode).toBe(409);
  });

  it('devrait créer une erreur 500 via internal()', () => {
    const err = ApiError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('Erreur serveur interne');
  });
});
