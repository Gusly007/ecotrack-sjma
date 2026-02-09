/**
 * Tests Unitaires - ApiError
 * Tests de la classe d'erreur personnalisée
 */

const ApiError = require('../../src/utils/api-error');

describe('ApiError - Unit Tests', () => {
  describe('constructor', () => {
    it('devrait créer une erreur avec statusCode et message', () => {
      const error = new ApiError(404, 'Not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.name).toBe('ApiError');
      expect(error instanceof Error).toBe(true);
    });

    it('devrait capturer la stack trace', () => {
      const error = new ApiError(500, 'Internal error');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('devrait ajouter un timestamp', () => {
      const error = new ApiError(400, 'Bad request');

      expect(error.timestamp).toBeDefined();
      expect(typeof error.timestamp).toBe('string');
    });

    it('devrait accepter des détails optionnels', () => {
      const details = { field: 'email' };
      const error = new ApiError(400, 'Validation error', details);

      expect(error.details).toEqual(details);
    });

    it('devrait défaut les détails à null', () => {
      const error = new ApiError(500, 'Server error');

      expect(error.details).toBeNull();
    });
  });
});
