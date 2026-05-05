import { AuthRepository } from '../../src/repositories/auth.repository.js';

// Client mock pour les transactions (pool.connect)
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

import pool from '../../src/config/database.js';

describe('AuthRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pool.connect.mockResolvedValue(mockClient);
  });

  it('findUserByEmailOrPrenom returns rows', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_utilisateur: 1 }] });

    const rows = await AuthRepository.findUserByEmailOrPrenom('a@b.com', 'Alex');

    expect(rows).toEqual([{ id_utilisateur: 1 }]);
  });

  describe('insertUser', () => {
    it('inserts CITOYEN without zone update (BEGIN + INSERT + COMMIT)', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)                                             // BEGIN
        .mockResolvedValueOnce({ rows: [{ id_utilisateur: 1, email: 'a@b.com' }] }) // INSERT
        .mockResolvedValueOnce(undefined);                                            // COMMIT

      const row = await AuthRepository.insertUser('a@b.com', 'Nom', 'Prenom', 'hash', 'CITOYEN');

      expect(row).toEqual({ id_utilisateur: 1, email: 'a@b.com' });
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('inserts GESTIONNAIRE and updates id_gestionnaire when id_zone is provided', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)                                             // BEGIN
        .mockResolvedValueOnce({ rows: [{ id_utilisateur: 2, email: 'g@b.com' }] }) // INSERT
        .mockResolvedValueOnce(undefined)                                             // UPDATE zone SET id_gestionnaire
        .mockResolvedValueOnce(undefined);                                            // COMMIT

      const row = await AuthRepository.insertUser('g@b.com', 'Nom', 'Prenom', 'hash', 'GESTIONNAIRE', 3);

      expect(row).toEqual({ id_utilisateur: 2, email: 'g@b.com' });
      expect(mockClient.query).toHaveBeenCalledTimes(4);
      const updateCall = mockClient.query.mock.calls[2];
      expect(updateCall[0]).toContain('id_gestionnaire');
      expect(updateCall[1]).toEqual([2, 3]);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('inserts ADMIN and updates id_admin when id_zone is provided', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id_utilisateur: 3, email: 'admin@b.com' }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const row = await AuthRepository.insertUser('admin@b.com', 'Nom', 'Prenom', 'hash', 'ADMIN', 5);

      expect(row).toEqual({ id_utilisateur: 3, email: 'admin@b.com' });
      const updateCall = mockClient.query.mock.calls[2];
      expect(updateCall[0]).toContain('id_admin');
      expect(updateCall[1]).toEqual([3, 5]);
    });

    it('skips zone update when id_zone is null for GESTIONNAIRE', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id_utilisateur: 4, email: 'g@b.com' }] })
        .mockResolvedValueOnce(undefined);

      await AuthRepository.insertUser('g@b.com', 'Nom', 'Prenom', 'hash', 'GESTIONNAIRE', null);

      // Seulement BEGIN + INSERT + COMMIT, pas de UPDATE zone
      expect(mockClient.query).toHaveBeenCalledTimes(3);
    });

    it('rollbacks transaction and releases client on insert error', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)              // BEGIN
        .mockRejectedValueOnce(new Error('db error')) // INSERT échoue
        .mockResolvedValueOnce(undefined);             // ROLLBACK

      await expect(
        AuthRepository.insertUser('a@b.com', 'Nom', 'Prenom', 'hash', 'CITOYEN')
      ).rejects.toThrow('db error');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  it('findUserByEmail returns first row', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_utilisateur: 1 }] });

    await expect(AuthRepository.findUserByEmail('a@b.com')).resolves.toEqual({ id_utilisateur: 1 });
  });

  it('findUserByEmail rethrows db error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    pool.query.mockRejectedValue(new Error('db error'));

    await expect(AuthRepository.findUserByEmail('a@b.com')).rejects.toThrow('db error');

    spy.mockRestore();
  });

  it('findUserById returns first row', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_utilisateur: 9 }] });

    await expect(AuthRepository.findUserById(9)).resolves.toEqual({ id_utilisateur: 9 });
  });

  it('creates and finds password reset tokens', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ email: 'u@test.com' }] })
      .mockResolvedValueOnce({ rows: [{ email: 'u@test.com', expires_at: 'x' }] });

    await expect(AuthRepository.createPasswordResetToken('u@test.com', 'tok', 'date')).resolves.toEqual({ email: 'u@test.com' });
    await expect(AuthRepository.findPasswordResetToken('tok')).resolves.toEqual({ email: 'u@test.com', expires_at: 'x' });
  });

  it('updates password and deletes reset token', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id_utilisateur: 3 }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(AuthRepository.updatePassword('u@test.com', 'hash')).resolves.toEqual({ id_utilisateur: 3 });
    await expect(AuthRepository.deletePasswordResetToken('tok')).resolves.toBeUndefined();
  });
});
