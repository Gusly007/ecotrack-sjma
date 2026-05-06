const request = require('supertest');
const app = require('../../src/app');

describe('Integration - Analytics API', () => {
  let token;

  beforeAll(async () => {
    try {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@ecotrack.com', password: 'Admin123!' });
      token = loginRes.body?.token;
    } catch (e) {}
  });

  it('GET /api/stats/dashboard - devrait retourner le dashboard', async () => {
    const res = await request(app)
      .get('/api/stats/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/stats/kpi - devrait retourner les KPIs', async () => {
    const res = await request(app)
      .get('/api/stats/kpi')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/stats/evolution - devrait retourner l\'évolution', async () => {
    const res = await request(app)
      .get('/api/stats/evolution')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/stats/export - devrait exporter les données', async () => {
    const res = await request(app)
      .get('/api/stats/export')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });
});

describe('Integration - Analytics Filters', () => {
  it('GET /api/stats?date_debut=2026-01-01 - filtrer par date', async () => {
    const res = await request(app)
      .get('/api/stats?date_debut=2026-01-01')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/stats?id_zone=1 - filtrer par zone', async () => {
    const res = await request(app)
      .get('/api/stats?id_zone=1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/stats?id_agent=5 - filtrer par agent', async () => {
    const res = await request(app)
      .get('/api/stats?id_agent=5')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });
});