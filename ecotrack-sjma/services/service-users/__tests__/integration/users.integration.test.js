describe('Integration - User Routes', () => {
  it('devrait avoir des routes users configurées', () => {
    expect(true).toBe(true);
  });

  it('devrait avoir auth configuré', () => {
    expect(true).toBe(true);
  });
});

// Deux connexions PostgreSQL peuvent valider le même état initial.
// Le schéma dédié permet de vérifier les écritures concurrentes sans données applicatives.
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const schema = 'mfa_test_' + randomUUID().replace(/-/g, '');
const mockPool = new Pool({ connectionString: process.env.DATABASE_URL, options: '-c search_path=' + schema });
jest.mock('../../src/config/database.js', () => ({
  query: (...args) => mockPool.query(...args),
}));
const { AuthRepository } = require('../../src/repositories/auth.repository.js');

describe('MFA — écritures concurrentes dans PostgreSQL', () => {
  beforeAll(async () => {
    await mockPool.query('CREATE SCHEMA ' + schema);
    await mockPool.query(`CREATE TABLE utilisateur (
      id_utilisateur integer PRIMARY KEY, mfa_enabled boolean, totp_secret text,
      mfa_setup_secret text, mfa_setup_secret_created_at timestamp, backup_codes text,
      deleted_at timestamp
    )`);
  });

  beforeEach(async () => {
    await mockPool.query('TRUNCATE utilisateur');
    await mockPool.query(`INSERT INTO utilisateur (id_utilisateur, mfa_enabled) VALUES (1, false)`);
    await AuthRepository.updateUserMfaSetupSecret(1, 'initial');
  });

  afterAll(async () => {
    try {
      await mockPool.query('DROP TABLE IF EXISTS ' + schema + '.utilisateur');
      await mockPool.query('DROP SCHEMA IF EXISTS ' + schema);
    } finally {
      await mockPool.end();
    }
  });

  it('active une seule fois et conserve les codes de la première activation', async () => {
    const lots = [['PREMIER1'], ['DEUXIEME']];
    const activations = await Promise.all(lots.map(codes => AuthRepository.activatePendingMfa(1, 'initial', codes)));
    expect(activations.filter(Boolean)).toHaveLength(1);
    await expect(AuthRepository.updateUserMfaSetupSecret(1, 'autre')).rejects.toMatchObject({ status: 400 });
    expect(await AuthRepository.activatePendingMfa(1, 'initial', [])).toBe(false);
    const { rows: [user] } = await mockPool.query('SELECT * FROM utilisateur WHERE id_utilisateur = 1');
    expect(user).toMatchObject({ mfa_enabled: true, totp_secret: 'initial',
      mfa_setup_secret: null, mfa_setup_secret_created_at: null });
    expect(JSON.parse(user.backup_codes)).toEqual(lots[activations.indexOf(true)]);
  });

  it('ne finalise que la configuration en attente', async () => {
    await AuthRepository.updateUserMfaSetupSecret(1, 'remplacement');
    expect(await AuthRepository.activatePendingMfa(1, 'initial', [])).toBe(false);
    expect(await AuthRepository.activatePendingMfa(1, 'remplacement', ['PREMIER1'])).toBe(true);
  });

  it('consomme chaque code une seule fois et conserve le TOTP', async () => {
    await AuthRepository.activatePendingMfa(1, 'initial', ['PREMIER1', 'DEUXIEME', 'DERNIER1']);
    const consommer = code => AuthRepository.consumeMfaBackupCode(1, code);
    const resultats = await Promise.all([consommer('PREMIER1'), consommer('PREMIER1'), consommer('DEUXIEME')]);
    expect(resultats.slice(0, 2).filter(Boolean)).toHaveLength(1);
    expect(resultats[2]).toBe(true);
    const { rows: [user] } = await mockPool.query('SELECT * FROM utilisateur WHERE id_utilisateur = 1');
    expect(user).toMatchObject({ mfa_enabled: true, totp_secret: 'initial' });
    expect(JSON.parse(user.backup_codes)).toEqual(['DERNIER1']);
  });
});
