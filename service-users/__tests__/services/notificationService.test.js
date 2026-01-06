import {
  createNotification,
  getUserNotifications,
  markAsRead,
  getUnreadCount,
  deleteNotification
} from '../../src/services/notificationService.js';
import pool from '../../src/config/database.js';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('inserts a notification and returns it', async () => {
      const row = { id_notification: 1 };
      pool.query.mockResolvedValue({ rows: [row] });

      const result = await createNotification(2, 'Titre', 'Message', 'SYSTEME');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO NOTIFICATION'),
        [2, 'SYSTEME', 'Titre', 'Message']
      );
      expect(result).toEqual(row);
    });
  });

  describe('getUserNotifications', () => {
    it('returns notifications ordered by date', async () => {
      const rows = [{ id_notification: 3 }];
      pool.query.mockResolvedValue({ rows });

      const result = await getUserNotifications(4, 25);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM NOTIFICATION'),
        [4, 25]
      );
      expect(result).toEqual(rows);
    });
  });

  describe('markAsRead', () => {
    it('updates the read flag', async () => {
      const updated = { id_notification: 5, est_lu: true };
      pool.query.mockResolvedValue({ rows: [updated] });

      const result = await markAsRead(5);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE NOTIFICATION SET est_lu = true WHERE id_notification = $1 RETURNING *',
        [5]
      );
      expect(result).toEqual(updated);
    });
  });

  describe('getUnreadCount', () => {
    it('returns parsed unread count', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '7' }] });

      const result = await getUnreadCount(9);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM NOTIFICATION WHERE id_utilisateur = $1 AND est_lu = false',
        [9]
      );
      expect(result).toBe(7);
    });
  });

  describe('deleteNotification', () => {
    it('deletes the notification by id', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await deleteNotification(15);

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM NOTIFICATION WHERE id_notification = $1',
        [15]
      );
    });
  });
});
