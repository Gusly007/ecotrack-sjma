import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/database.js', () => ({
  __esModule: true,
  default: { query: mockQuery, on: jest.fn() }
}));

describe('BadgeRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('getAllBadges should select all badges', async () => {
    const { BadgeRepository } = await import('../../src/repositories/badges.repository.js');
    const badge = { id_badge: 1, code: 'ECO', nom: 'Eco Badge' };
    mockQuery.mockResolvedValue({ rows: [badge] });
    const result = await BadgeRepository.getAllBadges();
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    expect(result).toEqual([badge]);
  });

  it('getUserBadges should select badges for user', async () => {
    const { BadgeRepository } = await import('../../src/repositories/badges.repository.js');
    const badge = { id_badge: 1, code: 'ECO', nom: 'Eco Badge' };
    mockQuery.mockResolvedValue({ rows: [badge] });
    const result = await BadgeRepository.getUserBadges(2);
    expect(mockQuery).toHaveBeenCalled();
    expect(result).toEqual([badge]);
  });

  it('getKnownBadges should select badges by codes', async () => {
    const { BadgeRepository } = await import('../../src/repositories/badges.repository.js');
    const badge = { id_badge: 1, code: 'ECO', nom: 'Eco Badge' };
    mockQuery.mockResolvedValue({ rows: [badge] });
    const result = await BadgeRepository.getKnownBadges(['ECO']);
    expect(mockQuery).toHaveBeenCalled();
    expect(result).toEqual([badge]);
  });

  it('getUserBadgeIds should select badge ids for user', async () => {
    const { BadgeRepository } = await import('../../src/repositories/badges.repository.js');
    mockQuery.mockResolvedValue({ rows: [{ id_badge: 1 }, { id_badge: 2 }] });
    const result = await BadgeRepository.getUserBadgeIds(3);
    expect(mockQuery).toHaveBeenCalled();
    expect(result).toEqual([1, 2]);
  });

  it('insertUserBadge should insert badge for user', async () => {
    const { BadgeRepository } = await import('../../src/repositories/badges.repository.js');
    mockQuery.mockResolvedValue({ rows: [{ id_badge: 1 }] });
    const result = await BadgeRepository.insertUserBadge(4, 1);
    expect(mockQuery).toHaveBeenCalled();
    expect(result).toEqual({ id_badge: 1 });
  });
});
