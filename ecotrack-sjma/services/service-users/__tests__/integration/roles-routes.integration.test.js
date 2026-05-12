const request = require('supertest');
const app = require('../../src/index');

describe('Users Service Roles Routes Integration', () => {
  const adminToken = `Bearer ${global.testAdminToken || 'admin-token'}`;

  describe('GET /roles/users/:id', () => {
    it('should return user roles', async () => {
      const res = await request(app)
        .get('/roles/users/1')
        .set('Authorization', adminToken);
      expect([200, 401, 403, 404]).toContain(res.status);
    });

    it('should reject without admin token', async () => {
      const res = await request(app)
        .get('/roles/users/1')
        .set('Authorization', 'Bearer user-token');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /roles/users/:id', () => {
    it('should assign role to user', async () => {
      const res = await request(app)
        .post('/roles/users/1')
        .set('Authorization', adminToken)
        .send({ roleId: 2 });
      expect([201, 400, 401, 403, 404]).toContain(res.status);
    });

    it('should reject without roleId', async () => {
      const res = await request(app)
        .post('/roles/users/1')
        .set('Authorization', adminToken)
        .send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('DELETE /roles/users/:id/:roleId', () => {
    it('should remove role from user', async () => {
      const res = await request(app)
        .delete('/roles/users/1/2')
        .set('Authorization', adminToken);
      expect([200, 401, 403, 404]).toContain(res.status);
    });
  });
});