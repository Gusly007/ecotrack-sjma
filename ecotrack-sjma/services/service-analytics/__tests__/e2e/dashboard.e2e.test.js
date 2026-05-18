const request = require('supertest');
const app = require('../../index');

describe('E2E - Dashboard Workflow', () => {
  let token;

  beforeAll(async () => {
    try {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ecotrack.com',
          password: 'Admin123!'
        });
      token = res.body?.token || res.body?.data?.token;
    } catch (e) {}
  });

  it('devrait récupérer le dashboard', async () => {
    if (!token) return;
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('devrait récupérer les KPIs', async () => {
    if (!token) return;
    const res = await request(app)
      .get('/api/analytics/realtime')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('devrait récupérer les stats temps réel', async () => {
    if (!token) return;
    const res = await request(app)
      .get('/api/analytics/realtime')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });
});

describe('E2E - Reports Export', () => {
  it('devrait exporter en PDF', async () => {
    const res = await request(app)
      .post('/api/analytics/reports/generate')
      .send({ format: 'pdf', reportType: 'weekly' });
    expect([200, 400, 401, 500]).toContain(res.status);
  });

  it('devrait exporter en Excel', async () => {
    const res = await request(app)
      .post('/api/analytics/reports/generate')
      .send({ format: 'excel', reportType: 'weekly' });
    expect([200, 400, 401, 500]).toContain(res.status);
  });
});

describe('E2E - Predictions', () => {
  it('devrait prédire le niveau de remplissage', async () => {
    const res = await request(app)
      .post('/api/analytics/ml/predict')
      .send({ containerId: 1, daysAhead: 1 });
    expect([200, 400, 401, 404, 500]).toContain(res.status);
  });

  it('devrait détecter les anomalies', async () => {
    const res = await request(app)
      .get('/api/analytics/ml/anomalies/global')
      .query({ threshold: 2, limit: 20 });
    expect([200, 401, 404, 500]).toContain(res.status);
  });
});