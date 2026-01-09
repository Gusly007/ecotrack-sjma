import { registerUser, loginUser, getUserById } from '../../src/services/authService';
import pool from '../../src/config/database.js';
import { hashPassword, comparePassword } from '../../src/utils/crypto';
import { generateToken, generateRefreshToken } from '../../src/utils/jwt';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

jest.mock('../../src/utils/crypto', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  hashToken: jest.fn(() => 'hashed-refresh-token'),
}));

jest.mock('../../src/utils/jwt', () => ({
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

describe('Auth Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // No existing user
      pool.query.mockResolvedValueOnce({ rows: [{ id_utilisateur: 1, email: 'test@example.com', prenom: 'testuser', role_par_defaut: 'CITOYEN' }] });
      hashPassword.mockResolvedValue('hashedpassword');
      generateToken.mockReturnValue('accesstoken');
      generateRefreshToken.mockReturnValue('refreshtoken');

      const result = await registerUser('test@example.com', 'testuser', 'password123');

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['test@example.com', 'testuser']);
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['test@example.com', 'testuser', 'testuser', 'hashedpassword', 'CITOYEN']);
      expect(generateToken).toHaveBeenCalled();
      expect(generateRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'accesstoken');
      expect(result).toHaveProperty('refreshToken', 'refreshtoken');
    });

    it('should throw an error if user already exists', async () => {
      pool.query.mockResolvedValue({ rows: [{ id_utilisateur: 1 }] });
      await expect(registerUser('test@example.com', 'testuser', 'password123')).rejects.toThrow('Utilisateur déjà existant');
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully', async () => {
        const user = { id_utilisateur: 1, email: 'test@example.com', prenom: 'testuser', password_hash: 'hashedpassword', role_par_defaut: 'CITOYEN', est_active: true };
        pool.query.mockResolvedValue({ rows: [user] });
        comparePassword.mockResolvedValue(true);
        generateToken.mockReturnValue('accesstoken');
        generateRefreshToken.mockReturnValue('refreshtoken');

        const result = await loginUser('test@example.com', 'password123');

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['test@example.com']);
        expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedpassword');
        expect(generateToken).toHaveBeenCalled();
        expect(generateRefreshToken).toHaveBeenCalled();
        expect(result).toHaveProperty('accessToken', 'accesstoken');
    });

    it('should throw an error for non-existing user', async () => {
        pool.query.mockResolvedValue({ rows: [] });
        await expect(loginUser('test@example.com', 'password123')).rejects.toThrow('Utilisateur non trouvé');
    });

    it('should throw an error for invalid credentials', async () => {
        const user = { id_utilisateur: 1, password_hash: 'hashedpassword', est_active: true };
        pool.query.mockResolvedValue({ rows: [user] });
        comparePassword.mockResolvedValue(false);
        await expect(loginUser('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });
  });

    describe('getUserById', () => {
        it('should return a user if found', async () => {
            const user = { id_utilisateur: 1, email: 'test@example.com' };
            pool.query.mockResolvedValue({ rows: [user] });

            const result = await getUserById(1);
            expect(result).toEqual(user);
            expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
        });

        it('should throw an error if user not found', async () => {
            pool.query.mockResolvedValue({ rows: [] });
            await expect(getUserById(1)).rejects.toThrow('User not found');
        });
    });
});
