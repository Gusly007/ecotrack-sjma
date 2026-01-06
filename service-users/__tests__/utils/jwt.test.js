import { generateToken, generateRefreshToken, verifyToken } from '../../src/utils/jwt';
import jwt from 'jsonwebtoken';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('JWT Utils', () => {
  // Définir les variables d'environnement pour les tests
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  describe('generateToken', () => {
    it('devrait générer un token valide avec userId et role', () => {
      const userId = '123';
      const role = 'user';
      const token = generateToken(userId, role);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('devrait contenir userId et role dans le token', () => {
      const userId = '456';
      const role = 'admin';
      const token = generateToken(userId, role);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
    });
  });

  describe('generateRefreshToken', () => {
    it('devrait générer un refresh token valide', () => {
      const userId = '789';
      const token = generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('devrait contenir userId dans le refresh token', () => {
      const userId = '789';
      const token = generateRefreshToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      expect(decoded.userId).toBe(userId);
    });
  });

  describe('verifyToken', () => {
    it('devrait vérifier un token valide', () => {
      const userId = '111';
      const role = 'user';
      const token = generateToken(userId, role);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
    });

    it('devrait lancer une erreur pour un token invalide', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('devrait lancer une erreur pour un token vide', () => {
      expect(() => verifyToken('')).toThrow('Invalid or expired token');
    });
  });
});
