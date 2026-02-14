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

const { attribuerBadgesAutomatique } = await import('../../src/services/badges.service.js');

describe('badges.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('attribue un badge dès que le seuil est atteint', async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [
          { id_badge: 1, code: 'DEBUTANT', nom: 'Débutant', points_requis: 100 }
        ]
      })
      .mockResolvedValueOnce({
        rows: []
      })
      .mockResolvedValueOnce({
        rows: []
      });

    const nouveaux = await attribuerBadgesAutomatique({
      client: mockPool,
      idUtilisateur: 1,
      totalPoints: 120
    });

    expect(nouveaux.length).toBe(1);
    expect(nouveaux[0].code).toBe('DEBUTANT');
  });

  it('ne réattribue pas deux fois le même badge', async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [
          { id_badge: 1, code: 'DEBUTANT', nom: 'Débutant', points_requis: 100 }
        ]
      })
      .mockResolvedValueOnce({
        rows: []
      })
      .mockResolvedValueOnce({
        rows: []
      });

    await attribuerBadgesAutomatique({
      client: mockPool,
      idUtilisateur: 1,
      totalPoints: 120
    });

    mockPool.query
      .mockResolvedValueOnce({
        rows: [
          { id_badge: 1, code: 'DEBUTANT', nom: 'Débutant', points_requis: 100 }
        ]
      })
      .mockResolvedValueOnce({
        rows: [{ id_badge: 1 }]
      });

    const nouveaux = await attribuerBadgesAutomatique({
      client: mockPool,
      idUtilisateur: 1,
      totalPoints: 120
    });

    expect(nouveaux.length).toBe(0);
  });
});
