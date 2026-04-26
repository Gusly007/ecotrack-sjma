import { logLoginAttempt, logAction, getRecentLoginAttempts } from '../../src/services/auditService.js';
import pool from '../../src/config/database.js';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

describe('Audit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logLoginAttempt', () => {
    it('records a successful login attempt', async () => {
      await logLoginAttempt('user@example.com', true, '127.0.0.1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO JOURNAL_AUDIT'),
        ['user@example.com', 'LOGIN_SUCCESS']
      );
    });

    it('records a failed login attempt', async () => {
      await logLoginAttempt('user@example.com', false, '127.0.0.1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO JOURNAL_AUDIT'),
        ['user@example.com', 'LOGIN_FAILED']
      );
    });
  });

  describe('logAction', () => {
    it('stores sensitive action entries with optional entity id', async () => {
      await logAction(42, 'USER_UPDATED', 'USER', 99);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO JOURNAL_AUDIT'),
        [42, 'USER_UPDATED', 'USER', 99]
      );
    });

    it('defaults entityId to null when not provided', async () => {
      await logAction(7, 'LOGIN_SUCCESS', 'AUTH');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO JOURNAL_AUDIT'),
        [7, 'LOGIN_SUCCESS', 'AUTH', null]
      );
    });
  });

  describe('getRecentLoginAttempts', () => {
    it('returns rows fetched from the database', async () => {
      const rows = [{ id_audit: 1, action: 'LOGIN_FAILED' }];
      pool.query.mockResolvedValue({ rows });

      const result = await getRecentLoginAttempts(10);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id_audit'),
        [10]
      );
      expect(result).toEqual(rows);
    });
  });
});
