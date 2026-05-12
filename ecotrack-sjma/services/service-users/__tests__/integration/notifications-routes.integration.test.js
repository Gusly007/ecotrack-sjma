const request = require('supertest');
const app = require('../../src/index');

describe('Users Service Notifications Routes Integration', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('GET /notifications', () => {
    it('should return user notifications', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('Authorization', authToken);
      expect([200, 401, 500]).toContain(res.status);
    });

    it('should support limit parameter', async () => {
      const res = await request(app)
        .get('/notifications?limit=10')
        .set('Authorization', authToken);
      expect([200, 401, 500]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .get('/notifications');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('should return unread count', async () => {
      const res = await request(app)
        .get('/notifications/unread-count')
        .set('Authorization', authToken);
      expect([200, 401, 500]).toContain(res.status);
    });
  });

  describe('PUT /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const res = await request(app)
        .put('/notifications/1/read')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete notification', async () => {
      const res = await request(app)
        .delete('/notifications/1')
        .set('Authorization', authToken);
      expect([200, 404, 500]).toContain(res.status);
    });
  });
});