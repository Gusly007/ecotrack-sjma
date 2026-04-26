import { updateProfile, changePassword, getProfileWithStats } from '../../src/services/userService.js';
import cacheService from '../../src/services/cacheService.js';
import { UserRepository } from '../../src/repositories/user.repository.js';
import { hashPassword, comparePassword } from '../../src/utils/crypto.js';

jest.mock('../../src/repositories/user.repository.js', () => ({
  UserRepository: {
    updateProfile: jest.fn(),
    getPasswordHash: jest.fn(),
    updatePassword: jest.fn(),
    getProfileWithStats: jest.fn(),
  },
}));

jest.mock('../../src/services/cacheService.js', () => ({
  __esModule: true,
  default: {
    getOrSet: jest.fn(),
    invalidatePattern: jest.fn(),
  },
}));

jest.mock('../../src/services/sessionService.js', () => ({
  invalidateAllUserSessions: jest.fn(),
}));

jest.mock('../../src/services/emailService.js', () => ({
  sendAccountStatusEmail: jest.fn(),
  sendRoleChangeEmail: jest.fn(),
  sendAccountDeletedEmail: jest.fn(),
}));

jest.mock('../../src/utils/crypto.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

describe('User Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update and return the user profile', async () => {
      const updatedUser = { id_utilisateur: 1, email: 'new@example.com', prenom: 'newuser' };
      UserRepository.updateProfile.mockResolvedValue(updatedUser);

      const result = await updateProfile(1, { email: 'new@example.com', prenom: 'newuser' });

      expect(UserRepository.updateProfile).toHaveBeenCalledWith(1, { email: 'new@example.com', prenom: 'newuser' });
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('user:1:*');
      expect(result).toEqual(updatedUser);
    });

    it('should throw an error if user to update is not found', async () => {
      UserRepository.updateProfile.mockRejectedValue(new Error('User not found'));

      await expect(updateProfile(1, {})).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change the password successfully', async () => {
      UserRepository.getPasswordHash.mockResolvedValue('oldhashedpassword');
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('newhashedpassword');

      const result = await changePassword(1, 'oldpassword', 'newpassword');

      expect(UserRepository.getPasswordHash).toHaveBeenCalledWith(1);
      expect(comparePassword).toHaveBeenCalledWith('oldpassword', 'oldhashedpassword');
      expect(hashPassword).toHaveBeenCalledWith('newpassword');
      expect(UserRepository.updatePassword).toHaveBeenCalledWith(1, 'newhashedpassword');
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('user:1:*');
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw an error for incorrect current password', async () => {
      UserRepository.getPasswordHash.mockResolvedValue('oldhashedpassword');
      comparePassword.mockResolvedValue(false);

      await expect(changePassword(1, 'wrongoldpassword', 'newpassword')).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('getProfileWithStats', () => {
    it('should return user profile with stats', async () => {
        const userWithStats = { id_utilisateur: 1, email: 'test@example.com', badge_count: 5 };
        UserRepository.getProfileWithStats.mockResolvedValue(userWithStats);
        cacheService.getOrSet.mockImplementation(async (key, fetchFn, ttl) => ({
          data: await fetchFn(),
          fromCache: false,
        }));

        const result = await getProfileWithStats(1);

        expect(cacheService.getOrSet).toHaveBeenCalledWith(
          'user:1:stats',
          expect.any(Function),
          30
        );
        expect(result).toEqual(userWithStats);
    });

    it('should throw an error if user for stats is not found', async () => {
        UserRepository.getProfileWithStats.mockRejectedValue(new Error('User not found'));
        cacheService.getOrSet.mockImplementation(async (key, fetchFn, ttl) => ({
          data: await fetchFn(),
          fromCache: false,
        }));

        await expect(getProfileWithStats(1)).rejects.toThrow('User not found');
    });
  });
});
