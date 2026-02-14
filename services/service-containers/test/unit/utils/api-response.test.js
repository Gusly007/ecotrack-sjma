/**
 * Tests Unitaires - ApiResponse
 * Tests de la classe de réponse standardisée
 */

const ApiResponse = require('../../../src/utils/api-response');

describe('ApiResponse - Unit Tests', () => {
  describe('success', () => {
    it('devrait créer une réponse de succès avec données', () => {
      const data = { id: 1, name: 'Test' };
      const response = ApiResponse.success(data);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Succès');
      expect(response.timestamp).toBeDefined();
    });

    it('devrait accepter un message personnalisé', () => {
      const data = { id: 1 };
      const message = 'Operation successful';
      const response = ApiResponse.success(data, message);

      expect(response.message).toBe(message);
      expect(response.success).toBe(true);
    });

    it('devrait accepter un code de statut personnalisé', () => {
      const response = ApiResponse.success({ id: 1 }, 'Created', 201);

      expect(response.statusCode).toBe(201);
    });
  });

  describe('error', () => {
    it('devrait créer une réponse d\'erreur', () => {
      const response = ApiResponse.error(400, 'Bad request');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Bad request');
      expect(response.details).toBeNull();
      expect(response.timestamp).toBeDefined();
    });

    it('devrait accepter des détails d\'erreur', () => {
      const details = { field: 'email' };
      const response = ApiResponse.error(422, 'Validation failed', details);

      expect(response.details).toEqual(details);
    });
  });
});
