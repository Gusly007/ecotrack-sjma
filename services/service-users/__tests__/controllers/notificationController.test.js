import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification
} from '../../src/controllers/notificationController.js';
import * as notificationService from '../../src/services/notificationService.js';

jest.mock('../../src/services/notificationService.js');

const mockRequest = ({ user = { id: 1 }, body = {}, params = {}, query = {} } = {}) => ({
  user,
  body,
  params,
  query
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Notification Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('returns notifications for the authenticated user', async () => {
      const notifications = [{ id_notification: 1 }];
      notificationService.getUserNotifications.mockResolvedValue(notifications);
      const req = mockRequest({ query: { limit: '10' } });
      const res = mockResponse();

      await getNotifications(req, res, mockNext);

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(1, 10);
      expect(res.json).toHaveBeenCalledWith({ count: notifications.length, data: notifications });
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread notifications count', async () => {
      notificationService.getUnreadCount.mockResolvedValue(3);
      const req = mockRequest();
      const res = mockResponse();

      await getUnreadCount(req, res, mockNext);

      expect(notificationService.getUnreadCount).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ unreadCount: 3 });
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read and returns it', async () => {
      const updated = { id_notification: 4, est_lu: true };
      notificationService.markAsRead.mockResolvedValue(updated);
      const req = mockRequest({ params: { id: '4' } });
      const res = mockResponse();

      await markAsRead(req, res, mockNext);

      expect(notificationService.markAsRead).toHaveBeenCalledWith(4);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification marked as read', data: updated });
    });
  });

  describe('deleteNotification', () => {
    it('removes a notification and acknowledges', async () => {
      const req = mockRequest({ params: { id: '7' } });
      const res = mockResponse();

      await deleteNotification(req, res, mockNext);

      expect(notificationService.deleteNotification).toHaveBeenCalledWith(7);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification deleted' });
    });
  });
});
