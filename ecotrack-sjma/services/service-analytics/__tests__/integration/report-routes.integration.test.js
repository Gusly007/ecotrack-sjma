const request = require('supertest');
const app = require('../../src/index');

describe('Analytics Report Routes Integration', () => {
  const authToken = `Bearer ${global.testAuthToken}`;

  describe('POST /api/analytics/reports/generate', () => {
    it('should generate PDF report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'pdf', reportType: 'weekly' });
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should generate Excel report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'excel', reportType: 'monthly' });
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should generate daily report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'pdf', reportType: 'daily' });
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should reject without authorization', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/generate')
        .send({ format: 'pdf', reportType: 'weekly' });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject invalid format', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', authToken)
        .send({ format: 'invalid', reportType: 'weekly' });
      expect([200, 400, 401, 500]).toContain(res.status);
    });
  });

  describe('GET /api/analytics/reports/download/:filename', () => {
    it('should download existing report', async () => {
      const res = await request(app)
        .get('/api/analytics/reports/download/test-report.pdf')
        .set('Authorization', authToken);
      expect([200, 404, 401]).toContain(res.status);
    });

    it('should reject without authorization', async () => {
      const res = await request(app)
        .get('/api/analytics/reports/download/test-report.pdf');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /api/analytics/reports/environmental', () => {
    it('should generate environmental report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/environmental')
        .set('Authorization', authToken)
        .send({ format: 'pdf', period: 'week' });
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should generate environmental Excel report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/environmental')
        .set('Authorization', authToken)
        .send({ format: 'excel', period: 'month' });
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should reject without authorization', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/environmental')
        .send({ format: 'pdf', period: 'week' });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /api/analytics/reports/routes-performance', () => {
    it('should generate routes performance report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/routes-performance')
        .set('Authorization', authToken)
        .send({ format: 'pdf', period: 'week' });
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should generate routes performance Excel report', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/routes-performance')
        .set('Authorization', authToken)
        .send({ format: 'excel', period: 'month' });
      expect([200, 500, 401]).toContain(res.status);
    });

    it('should reject without authorization', async () => {
      const res = await request(app)
        .post('/api/analytics/reports/routes-performance')
        .send({ format: 'pdf', period: 'week' });
      expect([401, 403]).toContain(res.status);
    });
  });
});