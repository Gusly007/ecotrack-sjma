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

const { recupererClassement } = await import('../../src/services/leaderboard.service.js');

describe('leaderboard.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renvoie un classement trié par points décroissants', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { rang: '3', id_utilisateur: 3, points: 500 },
        { rang: '2', id_utilisateur: 1, points: 250 },
        { rang: '1', id_utilisateur: 2, points: 80 }
      ]
    });

    const resultat = await recupererClassement({ limite: 3 });

    expect(resultat.classement[0].points).toBe(500);
    expect(resultat.classement[1].points).toBe(250);
    expect(resultat.classement[2].points).toBe(80);
    expect(resultat.classement[0].niveau).toBe('Super-Héros');
  });

  it('respecte la limite et expose les badges', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { rang: '2', id_utilisateur: 1, points: 120, badges: ['Débutant'] },
        { rang: '1', id_utilisateur: 2, points: 90, badges: [] }
      ]
    });

    const resultat = await recupererClassement({ limite: 2 });

    expect(resultat.classement.length).toBe(2);
    expect(resultat.classement[0].badges.length).toBeGreaterThan(0);
  });
});
