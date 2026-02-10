import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: { query: mockQuery, on: jest.fn(), end: jest.fn() },
  ensureGamificationTables: jest.fn(),
  initGamificationDb: jest.fn()
}));

const { recupererClassement } = await import(
  '../../src/services/leaderboard.service.js'
);

describe('leaderboard.service', () => {
  afterEach(() => jest.clearAllMocks());

  it('renvoie un classement trié par points décroissants', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { rang: '1', id_utilisateur: 3, points: 500, badges: [] },
        { rang: '2', id_utilisateur: 1, points: 250, badges: [] },
        { rang: '3', id_utilisateur: 2, points: 80, badges: [] }
      ]
    });

    const resultat = await recupererClassement({ limite: 3 });

    expect(resultat.classement[0].points).toBe(500);
    expect(resultat.classement[1].points).toBe(250);
    expect(resultat.classement[2].points).toBe(80);
    expect(resultat.classement[0].niveau).toBe('Super-Héros');
  });

  it('respecte la limite et expose les badges', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { rang: '1', id_utilisateur: 1, points: 120, badges: ['Débutant'] },
        { rang: '2', id_utilisateur: 2, points: 90, badges: [] }
      ]
    });

    const resultat = await recupererClassement({ limite: 2 });

    expect(resultat.classement.length).toBe(2);
    expect(resultat.classement[0].badges.length).toBeGreaterThan(0);
  });
});
