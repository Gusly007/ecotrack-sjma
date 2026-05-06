import { UserRepository } from '../../src/repositories/user.repository.js';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

import pool from '../../src/config/database.js';

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getUserProfile returns row and throws when missing', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_utilisateur: 1 }] });
    await expect(UserRepository.getUserProfile(1)).resolves.toEqual({ id_utilisateur: 1 });

    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(UserRepository.getUserProfile(1)).rejects.toThrow('User not found');
  });

  it('updateProfile and getPasswordHash behaviors', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id_utilisateur: 1, prenom: 'A' }] })
      .mockResolvedValueOnce({ rows: [{ password_hash: 'hash' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(UserRepository.updateProfile(1, { prenom: 'A' })).resolves.toEqual({ id_utilisateur: 1, prenom: 'A' });
    await expect(UserRepository.getPasswordHash(1)).resolves.toBe('hash');
    await expect(UserRepository.getPasswordHash(2)).rejects.toThrow('User not found');
  });

  it('updatePassword executes update query', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await expect(UserRepository.updatePassword(1, 'new-hash')).resolves.toBeUndefined();
  });

  it('getProfileWithStats returns row and throws when missing', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id_utilisateur: 1, badge_count: 2 }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(UserRepository.getProfileWithStats(1)).resolves.toEqual({ id_utilisateur: 1, badge_count: 2 });
    await expect(UserRepository.getProfileWithStats(2)).rejects.toThrow('User not found');
  });

  it('getUserStats aggregates multiple queries and maps activity labels', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: 2, ouverts: 1, resolus: 1 }] })
      .mockResolvedValueOnce({ rows: [{ delta_points: 10, raison: 'bonus', date_creation: '2026-01-02T00:00:00.000Z' }] })
      .mockResolvedValueOnce({ rows: [{ id_signalement: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 3, termines: 2 }] })
      .mockResolvedValueOnce({ rows: [{ action: 'LOGIN_SUCCESS', type_entite: 'X', date_creation: '2026-01-03T00:00:00.000Z' }] })
      .mockResolvedValueOnce({ rows: [{ date_creation: '2026-01-04T00:00:00.000Z' }] });

    const result = await UserRepository.getUserStats(1);

    expect(result.signalements.total).toBe(2);
    expect(result.defis.total).toBe(3);
    expect(result.lastLogin).toBe('2026-01-04T00:00:00.000Z');
    expect(result.recentActivity.length).toBeGreaterThan(0);
    expect(result.recentActivity[0]).toEqual(expect.objectContaining({ type: expect.any(String) }));
  });

  it('getUserStats returns defaults when rows are empty', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await UserRepository.getUserStats(1);

    expect(result.signalements).toEqual({ total: 0, ouverts: 0, resolus: 0 });
    expect(result.defis).toEqual({ total: 0, termines: 0 });
    expect(result.lastLogin).toBeNull();
  });

  it('listUsers handles pagination and filters', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id_utilisateur: 1 }] });

    const result = await UserRepository.listUsers({
      page: '2',
      limit: '2',
      role: 'admin',
      search: 'abc',
      est_active: 'true',
    });

    expect(result.pagination).toEqual({ total: 5, page: 2, limit: 2, pages: 3 });
    expect(result.data).toEqual([{ id_utilisateur: 1 }]);

    spy.mockRestore();
  });

  it('updateUserByAdmin and deleteUser behaviors', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id_utilisateur: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id_utilisateur: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(UserRepository.updateUserByAdmin(1, { prenom: 'X' })).resolves.toEqual({ id_utilisateur: 1 });
    await expect(UserRepository.deleteUser(1)).resolves.toEqual({ message: 'User deleted successfully' });
    await expect(UserRepository.deleteUser(2)).rejects.toThrow('User not found');
  });
});
