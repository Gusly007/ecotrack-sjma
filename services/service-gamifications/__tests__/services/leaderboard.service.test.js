import { recupererClassement } from '../../src/services/leaderboard.service.js';
import pool, {
  prepareDatabase,
  resetDatabase,
  closeDatabase
} from '../helpers/testDatabase.js';

beforeAll(async () => {
  // Préparation du schéma pour les tests de classement.
  await prepareDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('leaderboard.service', () => {
  it('renvoie un classement trié par points décroissants', async () => {
    await pool.query(
      `UPDATE utilisateur
       SET points = CASE id_utilisateur
         WHEN 1 THEN 250
         WHEN 2 THEN 80
         WHEN 3 THEN 500
       END`
    );

    const resultat = await recupererClassement({ limite: 3 });

    expect(resultat.classement[0].points).toBe(500);
    expect(resultat.classement[1].points).toBe(250);
    expect(resultat.classement[2].points).toBe(80);
    expect(resultat.classement[0].niveau).toBe('Super-Héros');
  });

  it('respecte la limite et expose les badges', async () => {
    const { rows } = await pool.query(
      "SELECT id_badge FROM badge WHERE code = 'DEBUTANT'"
    );
    await pool.query(
      'INSERT INTO user_badge (id_utilisateur, id_badge) VALUES ($1, $2)',
      [1, rows[0].id_badge]
    );

    await pool.query(
      `UPDATE utilisateur
       SET points = CASE id_utilisateur
         WHEN 1 THEN 120
         WHEN 2 THEN 90
         WHEN 3 THEN 60
       END`
    );

    const resultat = await recupererClassement({ limite: 2 });

    expect(resultat.classement.length).toBe(2);
    expect(resultat.classement[0].badges.length).toBeGreaterThan(0);
  });
});
