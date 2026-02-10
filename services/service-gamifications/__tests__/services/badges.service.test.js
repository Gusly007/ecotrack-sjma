import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: { query: mockQuery, on: jest.fn(), end: jest.fn() },
  ensureGamificationTables: jest.fn(),
  initGamificationDb: jest.fn()
}));

const { attribuerBadgesAutomatique } = await import(
  '../../src/services/badges.service.js'
);

describe('badges.service', () => {
  afterEach(() => jest.clearAllMocks());

  it('attribue un badge dès que le seuil est atteint', async () => {
    const mockClient = {
      query: jest.fn()
        // 1er appel : SELECT badges éligibles du catalogue
        .mockResolvedValueOnce({
          rows: [{ id_badge: 1, code: 'DEBUTANT', nom: 'Débutant' }]
        })
        // 2e appel : SELECT badges déjà obtenus (aucun)
        .mockResolvedValueOnce({ rows: [] })
        // 3e appel : INSERT nouveau badge
        .mockResolvedValueOnce({ rows: [] })
    };

    const nouveaux = await attribuerBadgesAutomatique({
      client: mockClient,
      idUtilisateur: 1,
      totalPoints: 120
    });

    expect(nouveaux.length).toBe(1);
    expect(nouveaux[0].code).toBe('DEBUTANT');
  });

  it('ne réattribue pas deux fois le même badge', async () => {
    const mockClient = {
      query: jest.fn()
        // 1er appel : SELECT badges éligibles
        .mockResolvedValueOnce({
          rows: [{ id_badge: 1, code: 'DEBUTANT', nom: 'Débutant' }]
        })
        // 2e appel : SELECT badges déjà obtenus (déjà le badge)
        .mockResolvedValueOnce({ rows: [{ id_badge: 1 }] })
    };

    const nouveaux = await attribuerBadgesAutomatique({
      client: mockClient,
      idUtilisateur: 1,
      totalPoints: 120
    });

    expect(nouveaux.length).toBe(0);
  });
});
