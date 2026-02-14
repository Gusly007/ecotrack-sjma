import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/database.js', () => ({
  __esModule: true,
  default: { query: mockQuery }
}));

describe('LeaderboardRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getClassement should query with limit', async () => {
    jest.resetModules();
    const { LeaderboardRepository } = await import('../../src/repositories/leaderboard.repository.js');
    mockQuery.mockResolvedValue({ rows: [{ id_utilisateur: 1, points: 100 }] });
    const rows = await LeaderboardRepository.getClassement({ limite: 5 });
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('LIMIT $1'), [5]);
    expect(rows).toEqual([{ id_utilisateur: 1, points: 100 }]);
  });

  it('getUtilisateurClassement should query with idUtilisateur', async () => {
    jest.resetModules();
    const { LeaderboardRepository } = await import('../../src/repositories/leaderboard.repository.js');
    mockQuery.mockResolvedValue({ rows: [{ id_utilisateur: 2, points: 200 }] });
    const rows = await LeaderboardRepository.getUtilisateurClassement(2);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE id_utilisateur = $1'), [2]);
    expect(rows).toEqual([{ id_utilisateur: 2, points: 200 }]);
  });
});
