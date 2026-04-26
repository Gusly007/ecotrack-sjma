import { jest } from '@jest/globals';

const mockPool = {
  query: jest.fn(),
  end: jest.fn(),
  on: jest.fn()
};

jest.unstable_mockModule('pg', () => ({
  default: {
    Pool: jest.fn(() => mockPool)
  },
  Pool: jest.fn(() => mockPool)
}));

const { recupererStatsUtilisateur } = await import('../../src/services/stats.service.js');

describe('stats.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retourne des statistiques cohérentes avec l\'historique', async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ points: 60 }]
      })
      .mockResolvedValueOnce({
        rows: [{ periode: '2024-01-10', points: 60 }]
      })
      .mockResolvedValueOnce({
        rows: []
      })
      .mockResolvedValueOnce({
        rows: []
      });

    const stats = await recupererStatsUtilisateur({ idUtilisateur: 1 });

    expect(stats.totalPoints).toBe(60);
    expect(Number(stats.parJour[0].points)).toBe(60);
    expect(stats.impactCO2).toBe(1);
  });

  it('agrège correctement par semaine et par mois', async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ points: 90 }]
      })
      .mockResolvedValueOnce({
        rows: [
          { periode: '2024-01-10', points: 50 },
          { periode: '2024-01-03', points: 40 }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          { periode: '2024-02-01', points: 40 },
          { periode: '2024-01-01', points: 50 }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          { periode: '2024-02-01', points: 40 },
          { periode: '2024-01-01', points: 50 }
        ]
      });

    const stats = await recupererStatsUtilisateur({ idUtilisateur: 2 });

    expect(stats.parSemaine.length).toBeGreaterThan(0);
    expect(stats.parMois.length).toBeGreaterThan(0);
    expect(Number(stats.parMois[0].points)).toBeGreaterThan(0);
  });
});
