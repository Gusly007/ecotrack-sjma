const ApiResponse = require('../../../src/utils/api-response');

describe('ApiResponse', () => {
  describe('success()', () => {
    it('devrait retourner une réponse de succès standard', () => {
      const result = ApiResponse.success({ id: 1 }, 'OK', 200);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('OK');
      expect(result.data).toEqual({ id: 1 });
      expect(result.timestamp).toBeDefined();
    });

    it('devrait utiliser les valeurs par défaut', () => {
      const result = ApiResponse.success({ x: 1 });
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Succès');
    });
  });

  describe('error()', () => {
    it('devrait retourner une réponse d\'erreur', () => {
      const result = ApiResponse.error(404, 'Non trouvé');
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Non trouvé');
      expect(result.details).toBeNull();
    });

    it('devrait inclure les détails si fournis', () => {
      const result = ApiResponse.error(400, 'Invalide', { field: 'code' });
      expect(result.details).toEqual({ field: 'code' });
    });
  });

  describe('paginated()', () => {
    it('devrait calculer correctement la pagination', () => {
      const result = ApiResponse.paginated([1, 2], 1, 2, 10);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2]);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.pages).toBe(5);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('hasMore doit être false sur la dernière page', () => {
      const result = ApiResponse.paginated([], 5, 2, 10);
      expect(result.pagination.hasMore).toBe(false);
    });
  });
});
