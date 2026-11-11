import { NotificationRepository } from '../../src/repositories/notification.repository.js';
import pool from '../../src/config/database.js';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

const GAMIFICATION_EXCLUDED = /type\s+NOT IN\s*\('BADGE',\s*'DEFI'\)/i;
const ALLOWED_ROLES = /role_par_defaut\s+IN\s*\('CITOYEN',\s*'AGENT'\)/i;

describe('NotificationRepository read paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides gamification rows from the list of a recipient outside the allowed roles', async () => {
    const rows = [{ id_notification: 1, type: 'ALERTE' }];
    pool.query.mockResolvedValue({ rows });

    const result = await NotificationRepository.getUserNotifications(7, 5);

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(GAMIFICATION_EXCLUDED);
    expect(sql).toMatch(ALLOWED_ROLES);
    expect(params).toEqual([7, 5]);
    expect(result).toEqual(rows);
  });

  it('applies the same guard to the unread count', async () => {
    pool.query.mockResolvedValue({ rows: [{ count: '4' }] });

    const count = await NotificationRepository.getUnreadCount(7);

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(GAMIFICATION_EXCLUDED);
    expect(sql).toMatch(ALLOWED_ROLES);
    expect(params).toEqual([7]);
    expect(count).toBe(4);
  });
});
