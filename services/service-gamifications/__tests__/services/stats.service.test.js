import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: { query: mockQuery, on: jest.fn(), end: jest.fn() },
  ensureGamificationTables: jest.fn(),
  initGamificationDb: jest.fn()
}));

const { recupererStatsUtilisateur } = await import(
  '../../src/services/stats.service.js'
);

describe('stats.service', () => {
  afterEach(() => jest.clearAllMocks());

  it('retourne des statistiques cohérentes avec l\'historique', async () => {
    mockQuery
      // 1er appel : SELECT points
      .mockResolvedValueOnce({ rows: [{ points: 60 }] })
      // 2e appel : agrégation par jour
      .mockResolvedValueOnce({ rows: [{ periode: '2024-01-10', points: 60 }] })
      // 3e appel : agrégation par semaine
      .mockResolvedValueOnce({ rows: [{ periode: '2024-W02', points: 60 }] })
      // 4e appel : agrégation par mois
      .mockResolvedValueOnce({ rows: [{ periode: '2024-01', points: 60 }] });

    const stats = await recupererStatsUtilisateur({ idUtilisateur: 1 });

    expect(stats.totalPoints).toBe(60);
    expect(Number(stats.parJour[0].points)).toBe(60);
    expect(stats.impactCO2).toBe(1);
  });

  it('agrège correctement par semaine et par mois', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ points: 90 }] })
      .mockResolvedValueOnce({
        rows: [
          { periode: '2024-01-10', points: 20 },
          { periode: '2024-01-12', points: 30 }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          { periode: '2024-W02', points: 50 },
          { periode: '2024-W05', points: 40 }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          { periode: '2024-01', points: 50 },
          { periode: '2024-02', points: 40 }
        ]
      });

    const stats = await recupererStatsUtilisateur({ idUtilisateur: 2 });

    expect(stats.parSemaine.length).toBeGreaterThan(0);
    expect(stats.parMois.length).toBeGreaterThan(0);
    expect(Number(stats.parMois[0].points)).toBeGreaterThan(0);
  });
});
