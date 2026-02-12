import { recupererStatsUtilisateur } from '../../src/services/stats.service.js';
import {
  prepareDatabase,
  resetDatabase,
  closeDatabase,
  seedHistoriquePoints
} from '../helpers/testDatabase.js';
import pool from '../helpers/testDatabase.js';

beforeAll(async () => {
  // Préparation du schéma pour les statistiques.
  await prepareDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('stats.service', () => {
  it('retourne des statistiques cohérentes avec l\'historique', async () => {
    await pool.query('UPDATE utilisateur SET points = 60 WHERE id_utilisateur = 1');

    await seedHistoriquePoints({
      idUtilisateur: 1,
      entries: [
        { points: 30, date: '2024-01-10T10:00:00Z' },
        { points: 30, date: '2024-01-10T14:00:00Z' }
      ]
    });

    const stats = await recupererStatsUtilisateur({ idUtilisateur: 1 });

    expect(stats.totalPoints).toBe(60);
    expect(Number(stats.parJour[0].points)).toBe(60);
    expect(stats.impactCO2).toBe(1);
  });

  it('agrège correctement par semaine et par mois', async () => {
    await pool.query('UPDATE utilisateur SET points = 90 WHERE id_utilisateur = 2');

    await seedHistoriquePoints({
      idUtilisateur: 2,
      entries: [
        { points: 20, date: '2024-01-10T10:00:00Z' },
        { points: 30, date: '2024-01-12T10:00:00Z' },
        { points: 40, date: '2024-02-05T10:00:00Z' }
      ]
    });

    const stats = await recupererStatsUtilisateur({ idUtilisateur: 2 });

    expect(stats.parSemaine.length).toBeGreaterThan(0);
    expect(stats.parMois.length).toBeGreaterThan(0);
    expect(Number(stats.parMois[0].points)).toBeGreaterThan(0);
  });
});
