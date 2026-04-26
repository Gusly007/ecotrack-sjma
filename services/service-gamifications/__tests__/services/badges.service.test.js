import { jest } from '@jest/globals';

describe('badges.service', () => {
  const loadService = async () => {
    jest.resetModules();

    const repo = {
      getAllBadges: jest.fn(),
      getUserBadges: jest.fn(),
      getKnownBadges: jest.fn(),
      getUserBadgeIds: jest.fn(),
      insertUserBadge: jest.fn()
    };

    jest.unstable_mockModule('../../src/repositories/badges.repository.js', () => ({
      BADGE_SEUILS: {
        DEBUTANT: 100,
        ECO_GUERRIER: 500,
        SUPER_HEROS: 1000
      },
      BadgeRepository: repo
    }));

    const svc = await import('../../src/services/badges.service.js');
    return { ...svc, repo };
  };

  it('listerBadges maps and sorts with thresholds', async () => {
    const { listerBadges, repo } = await loadService();
    repo.getAllBadges.mockResolvedValue([
      { id_badge: 3, code: 'SUPER_HEROS' },
      { id_badge: 1, code: 'DEBUTANT' }
    ]);

    const rows = await listerBadges();

    expect(rows[0].code).toBe('DEBUTANT');
    expect(rows[0].points_requis).toBe(100);
    expect(rows[1].points_requis).toBe(1000);
  });

  it('listerBadgesUtilisateur maps threshold', async () => {
    const { listerBadgesUtilisateur, repo } = await loadService();
    repo.getUserBadges.mockResolvedValue([{ code: 'ECO_GUERRIER' }]);

    const rows = await listerBadgesUtilisateur(8, { page: 2 });

    expect(repo.getUserBadges).toHaveBeenCalledWith(8, { page: 2 });
    expect(rows[0].points_requis).toBe(500);
  });

  it('attribuerBadgesSiEligibles returns empty when no eligible codes', async () => {
    const { attribuerBadgesSiEligibles, repo } = await loadService();
    repo.getKnownBadges.mockResolvedValue([]);

    const result = await attribuerBadgesSiEligibles(1, 999, {});

    expect(result).toEqual([]);
  });

  it('attribuerBadgesSiEligibles inserts only new eligible badges', async () => {
    const { attribuerBadgesSiEligibles, repo } = await loadService();
    repo.getKnownBadges.mockResolvedValue([
      { id_badge: 1, code: 'DEBUTANT', nom: 'Debutant' },
      { id_badge: 2, code: 'ECO_GUERRIER', nom: 'Eco' }
    ]);
    repo.getUserBadgeIds.mockResolvedValue([1]);
    repo.insertUserBadge.mockResolvedValue({ id_badge: 2 });

    const result = await attribuerBadgesSiEligibles(1, 600, {});

    expect(repo.insertUserBadge).toHaveBeenCalledTimes(1);
    expect(repo.insertUserBadge).toHaveBeenCalledWith(1, 2, {});
    expect(result).toEqual([{ id_badge: 2, code: 'ECO_GUERRIER', nom: 'Eco', points_requis: 500 }]);
  });
});
