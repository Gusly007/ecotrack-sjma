import { AuthRepository } from '../../src/repositories/auth.repository.js';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

import pool from '../../src/config/database.js';

describe('AuthRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findUserByEmailOrPrenom returns rows', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_utilisateur: 1 }] });

    const rows = await AuthRepository.findUserByEmailOrPrenom('a@b.com', 'Alex');

    expect(rows).toEqual([{ id_utilisateur: 1 }]);
  });

  it('insertUser returns inserted row', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_utilisateur: 1, email: 'a@b.com' }] });

    const row = await AuthRepository.insertUser('a@b.com', 'Nom', 'Prenom', 'hash', 'CITOYEN');

    expect(row).toEqual({ id_utilisateur: 1, email: 'a@b.com' });
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

  it('updateMfaSettings n\'écrit que les colonnes fournies (backup_codes seul)', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_utilisateur: 5 }] });

    await AuthRepository.updateMfaSettings(5, { backup_codes: '["AAAA1111"]' });

    const [sql, params] = pool.query.mock.calls[0];
    // Ne doit pas écraser mfa_enabled/totp_secret à NULL.
    expect(sql).toContain('backup_codes = $1');
    expect(sql).not.toContain('mfa_enabled');
    expect(sql).not.toContain('totp_secret');
    expect(params).toEqual(['["AAAA1111"]', 5]);
  });

  it('updateMfaSettings écrit les trois colonnes quand elles sont toutes fournies', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_utilisateur: 5 }] });

    await AuthRepository.updateMfaSettings(5, { mfa_enabled: true, totp_secret: 'S', backup_codes: '[]' });

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('mfa_enabled = $1');
    expect(sql).toContain('totp_secret = $2');
    expect(sql).toContain('backup_codes = $3');
    expect(params).toEqual([true, 'S', '[]', 5]);
  });
});
