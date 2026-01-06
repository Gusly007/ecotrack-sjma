import { updateProfile, changePassword, getProfileWithStats } from '../../src/services/userService';
import pool from '../../src/config/database.js';
import { hashPassword, comparePassword } from '../../src/utils/crypto';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

jest.mock('../../src/utils/crypto', () => ({
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
      pool.query.mockResolvedValue({ rows: [updatedUser] });

      const result = await updateProfile(1, { email: 'new@example.com', prenom: 'newuser' });

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['newuser', 'new@example.com', 1]);
      expect(result).toEqual(updatedUser);
    });

    it('should throw an error if user to update is not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await expect(updateProfile(1, {})).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change the password successfully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ password_hash: 'oldhashedpassword' }] }); // User lookup
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('newhashedpassword');
      pool.query.mockResolvedValueOnce({ rows: [] }); // Password update

      const result = await changePassword(1, 'oldpassword', 'newpassword');

      expect(comparePassword).toHaveBeenCalledWith('oldpassword', 'oldhashedpassword');
      expect(hashPassword).toHaveBeenCalledWith('newpassword');
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['newhashedpassword', 1]);
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw an error for incorrect current password', async () => {
      pool.query.mockResolvedValue({ rows: [{ password_hash: 'oldhashedpassword' }] });
      comparePassword.mockResolvedValue(false);

      await expect(changePassword(1, 'wrongoldpassword', 'newpassword')).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('getProfileWithStats', () => {
    it('should return user profile with stats', async () => {
        const userWithStats = { id_utilisateur: 1, email: 'test@example.com', badge_count: 5 };
        pool.query.mockResolvedValue({ rows: [userWithStats] });

        const result = await getProfileWithStats(1);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
        expect(result).toEqual(userWithStats);
    });

    it('should throw an error if user for stats is not found', async () => {
        pool.query.mockResolvedValue({ rows: [] });
        await expect(getProfileWithStats(1)).rejects.toThrow('User not found');
    });
  });
});
