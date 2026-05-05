import { registerUser, loginUser, getUserById } from '../../src/services/authService.js';
import { AuthRepository } from '../../src/repositories/auth.repository.js';
import { hashPassword, comparePassword } from '../../src/utils/crypto.js';
import { generateToken, generateRefreshToken } from '../../src/utils/jwt.js';
import * as auditService from '../../src/services/auditService.js';
import * as sessionService from '../../src/services/sessionService.js';

jest.mock('../../src/repositories/auth.repository.js', () => ({
  AuthRepository: {
    findUserByEmailOrPrenom: jest.fn(),
    insertUser: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createPasswordResetToken: jest.fn(),
    findPasswordResetToken: jest.fn(),
    updatePassword: jest.fn(),
    deletePasswordResetToken: jest.fn(),
  },
}));

jest.mock('../../src/utils/crypto.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  hashToken: jest.fn(() => 'hashed-refresh-token'),
}));

jest.mock('../../src/services/emailService.js', () => ({
  sendPasswordResetEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendAdminCreatedUserEmail: jest.fn(),
}));

jest.mock('../../src/utils/jwt.js', () => ({
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

jest.mock('../../src/services/auditService.js', () => ({
  logAction: jest.fn(),
  logLoginAttempt: jest.fn(),
}));

jest.mock('../../src/services/sessionService.js', () => ({
  limitConcurrentSessions: jest.fn(),
  storeRefreshToken: jest.fn(),
  invalidateAllUserSessions: jest.fn(),
}));

describe('Auth Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new CITOYEN without id_zone', async () => {
      AuthRepository.findUserByEmailOrPrenom.mockResolvedValue([]);
      AuthRepository.insertUser.mockResolvedValue({ id_utilisateur: 1, email: 'test@example.com', nom: 'Test', prenom: 'user', role_par_defaut: 'CITOYEN' });
      hashPassword.mockResolvedValue('hashedpassword');
      generateToken.mockReturnValue('accesstoken');
      generateRefreshToken.mockReturnValue('refreshtoken');

      const result = await registerUser('test@example.com', 'Test', 'user', 'password123');

      expect(AuthRepository.findUserByEmailOrPrenom).toHaveBeenCalledWith('test@example.com', 'user');
      expect(hashPassword).toHaveBeenCalledWith('password123');
      // id_zone vaut null par défaut
      expect(AuthRepository.insertUser).toHaveBeenCalledWith('test@example.com', 'Test', 'user', 'hashedpassword', 'CITOYEN', null);
      expect(generateToken).toHaveBeenCalled();
      expect(generateRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'accesstoken');
      expect(result).toHaveProperty('refreshToken', 'refreshtoken');
    });

    it('should register a GESTIONNAIRE and forward id_zone', async () => {
      AuthRepository.findUserByEmailOrPrenom.mockResolvedValue([]);
      AuthRepository.insertUser.mockResolvedValue({ id_utilisateur: 2, email: 'g@example.com', nom: 'G', prenom: 'Test', role_par_defaut: 'GESTIONNAIRE' });
      hashPassword.mockResolvedValue('hashedpassword');
      generateToken.mockReturnValue('accesstoken');
      generateRefreshToken.mockReturnValue('refreshtoken');

      const result = await registerUser('g@example.com', 'G', 'Test', 'password123', 'GESTIONNAIRE', 3);

      expect(AuthRepository.insertUser).toHaveBeenCalledWith('g@example.com', 'G', 'Test', 'hashedpassword', 'GESTIONNAIRE', 3);
      expect(result.user.id_utilisateur).toBe(2);
    });

    it('should register an ADMIN and forward id_zone', async () => {
      AuthRepository.findUserByEmailOrPrenom.mockResolvedValue([]);
      AuthRepository.insertUser.mockResolvedValue({ id_utilisateur: 3, email: 'a@example.com', nom: 'A', prenom: 'Test', role_par_defaut: 'ADMIN' });
      hashPassword.mockResolvedValue('hashedpassword');
      generateToken.mockReturnValue('accesstoken');
      generateRefreshToken.mockReturnValue('refreshtoken');

      await registerUser('a@example.com', 'A', 'Test', 'password123', 'ADMIN', 5);

      expect(AuthRepository.insertUser).toHaveBeenCalledWith('a@example.com', 'A', 'Test', 'hashedpassword', 'ADMIN', 5);
    });

    it('should throw an error if user already exists', async () => {
      AuthRepository.findUserByEmailOrPrenom.mockResolvedValue([{ id_utilisateur: 1 }]);
      await expect(registerUser('test@example.com', 'Test', 'user', 'password123')).rejects.toThrow('Email already in use');
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully', async () => {
        const user = { id_utilisateur: 1, email: 'test@example.com', prenom: 'testuser', password_hash: 'hashedpassword', role_par_defaut: 'CITOYEN', est_active: true };
        AuthRepository.findUserByEmail.mockResolvedValue(user);
        comparePassword.mockResolvedValue(true);
        generateToken.mockReturnValue('accesstoken');
        generateRefreshToken.mockReturnValue('refreshtoken');

        const result = await loginUser('test@example.com', 'password123');

        expect(AuthRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
        expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedpassword');
        expect(generateToken).toHaveBeenCalled();
        expect(generateRefreshToken).toHaveBeenCalled();
        expect(result).toHaveProperty('accessToken', 'accesstoken');
    });

    it('should throw an error for non-existing user', async () => {
        AuthRepository.findUserByEmail.mockResolvedValue(null);
        await expect(loginUser('test@example.com', 'password123')).rejects.toThrow('Invalid credentials');
    });

    it('should throw an error for invalid credentials', async () => {
        const user = { id_utilisateur: 1, password_hash: 'hashedpassword', est_active: true };
        AuthRepository.findUserByEmail.mockResolvedValue(user);
        comparePassword.mockResolvedValue(false);
        await expect(loginUser('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });
  });

    describe('getUserById', () => {
        it('should return a user if found', async () => {
            const user = { id_utilisateur: 1, email: 'test@example.com' };
            AuthRepository.findUserById.mockResolvedValue(user);

            const result = await getUserById(1);
            expect(result).toEqual(user);
            expect(AuthRepository.findUserById).toHaveBeenCalledWith(1);
        });

        it('should throw an error if user not found', async () => {
            AuthRepository.findUserById.mockResolvedValue(null);
            await expect(getUserById(1)).rejects.toThrow('User not found');
        });
    });
});
