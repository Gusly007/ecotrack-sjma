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

  it('findUserByEmail conserve la correspondance exacte pour la connexion', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_utilisateur: 42, email: 'Camille.Dupont@example.org' }] });

    const row = await AuthRepository.findUserByEmail('Camille.Dupont@example.org');

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('WHERE email = $1 AND deleted_at IS NULL');
    expect(sql).not.toContain('LOWER');
    expect(params).toEqual(['Camille.Dupont@example.org']);
    expect(row).toEqual({ id_utilisateur: 42, email: 'Camille.Dupont@example.org' });
  });

  it('retrouve une unique adresse sans distinction de casse pour le reset', async () => {
    const account = { id_utilisateur: 42, email: 'Camille.Dupont@example.org' };
    pool.query.mockResolvedValue({ rows: [account] });

    await expect(AuthRepository.findUniqueUserByEmailIgnoreCase('camille.dupont@example.org'))
      .resolves.toEqual(account);

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('LOWER(email) = LOWER($1) AND deleted_at IS NULL');
    expect(sql).toContain('LIMIT 2');
    expect(params).toEqual(['camille.dupont@example.org']);
  });

  it.each([
    { rows: [] },
    { rows: [
      { id_utilisateur: 1, email: 'Camille.Dupont@example.org' },
      { id_utilisateur: 2, email: 'camille.dupont@example.org' },
    ] },
  ])('ne sélectionne aucun compte si la recherche est vide ou ambiguë (%j)', async ({ rows }) => {
    pool.query.mockResolvedValue({ rows });

    await expect(AuthRepository.findUniqueUserByEmailIgnoreCase('CAMILLE.DUPONT@EXAMPLE.ORG'))
      .resolves.toBeUndefined();
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
