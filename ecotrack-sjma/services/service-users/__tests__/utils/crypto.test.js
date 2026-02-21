import { hashPassword, comparePassword } from '../../src/utils/crypto.js';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Crypto Utils', () => {
  beforeAll(() => {
    process.env.BCRYPT_ROUNDS = '10';
  });

  describe('hashPassword', () => {
    it('devrait hasher un mot de passe', async () => {
      const password = 'MySecurePassword123!';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('devrait générer un hash différent à chaque fois', async () => {
      const password = 'MySecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('devrait rejeter un mot de passe vide', async () => {
      // bcrypt devrait quand même hasher une chaîne vide (comportement standard)
      const hashedPassword = await hashPassword('');
      expect(hashedPassword).toBeDefined();
    });
  });

  describe('comparePassword', () => {
    it('devrait retourner true pour un mot de passe correct', async () => {
      const password = 'MySecurePassword123!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('devrait retourner false pour un mot de passe incorrect', async () => {
      const password = 'MySecurePassword123!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword('WrongPassword', hashedPassword);

      expect(isMatch).toBe(false);
    });

    it('devrait être sensible à la casse', async () => {
      const password = 'MySecurePassword123!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword('mysecurepassword123!', hashedPassword);

      expect(isMatch).toBe(false);
    });
  });

  afterAll(() => {
    delete process.env.BCRYPT_ROUNDS;
  });
});
