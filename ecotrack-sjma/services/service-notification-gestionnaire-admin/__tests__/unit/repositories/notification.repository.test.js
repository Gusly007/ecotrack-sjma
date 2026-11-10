const mockQuery = jest.fn();

jest.mock('../../../src/db/connexion', () => ({
  pool: { query: (...args) => mockQuery(...args), connect: jest.fn() },
}));

const repository = require('../../../src/repositories/notification.repository');

const GAMIFICATION_EXCLUDED = /type\s+NOT IN\s*\('BADGE',\s*'DEFI'\)/i;
const ALLOWED_ROLES = /role_par_defaut\s+IN\s*\('CITOYEN',\s*'AGENT'\)/i;

const expectRoleGuard = (sql) => {
  expect(sql).toMatch(GAMIFICATION_EXCLUDED);
  expect(sql).toMatch(ALLOWED_ROLES);
};

describe('NotificationRepository read paths', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('excludes gamification rows from the unread count of a recipient outside the allowed roles', async () => {
    mockQuery.mockResolvedValue({ rows: [{ count: '4' }] });

    const count = await repository.getUnreadCount(7);

    expect(count).toBe(4);
    expectRoleGuard(mockQuery.mock.calls[0][0]);
    expect(mockQuery.mock.calls[0][1]).toEqual([7]);
  });

  it('applies the same guard to the list and to its total', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id_notification: 1, type: 'ALERTE' }] });

    const result = await repository.getNotificationsByUser(7, 2, 10);

    expect(result).toEqual({
      data: [{ id_notification: 1, type: 'ALERTE' }],
      total: 1,
      page: 2,
      limit: 10,
    });
    expectRoleGuard(mockQuery.mock.calls[0][0]);
    expectRoleGuard(mockQuery.mock.calls[1][0]);
    expect(mockQuery.mock.calls[1][1]).toEqual([7, 10, 10]);
  });

  it('applies the guard to the admin list even when a type filter asks for BADGE', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await repository.getAdminNotifications({ id_utilisateur: 3, type: 'BADGE', page: 1, limit: 20 });

    expectRoleGuard(mockQuery.mock.calls[0][0]);
    expectRoleGuard(mockQuery.mock.calls[1][0]);
    expect(mockQuery.mock.calls[0][1]).toEqual([3, 'BADGE']);
    expect(mockQuery.mock.calls[1][1]).toEqual([3, 'BADGE', 20, 0]);
  });
});
