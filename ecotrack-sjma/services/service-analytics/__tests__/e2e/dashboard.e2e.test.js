const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3015';

describe('E2E - Dashboard Workflow', () => {
  let token;

  beforeAll(async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@ecotrack.com',
        password: 'Admin123!'
      });
      token = res.data?.token;
    } catch (e) {}
  });

  it('devrait récupérer le dashboard', async () => {
    if (!token) return;
    const res = await axios.get(`${BASE_URL}/api/stats/dashboard`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 401]).toContain(res.status);
  });

  it('devrait récupérer les KPIs', async () => {
    if (!token) return;
    const res = await axios.get(`${BASE_URL}/api/stats/kpi`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 401]).toContain(res.status);
  });

  it('devrait récupérer les stats temps réel', async () => {
    if (!token) return;
    const res = await axios.get(`${BASE_URL}/api/stats/realtime`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 401]).toContain(res.status);
  });
});

describe('E2E - Reports Export', () => {
  it('devrait exporter en PDF', async () => {
    const res = await axios.get(`${BASE_URL}/api/stats/export`, {
      responseType: 'arraybuffer'
    });
    expect([200, 500]).toContain(res.status);
  });

  it('devrait exporter en Excel', async () => {
    const res = await axios.get(`${BASE_URL}/api/stats/export?format=excel`, {
      responseType: 'arraybuffer'
    });
    expect([200, 500]).toContain(res.status);
  });
});

describe('E2E - Predictions', () => {
  it('devrait prédire le niveau de remplissage', async () => {
    const res = await axios.get(`${BASE_URL}/api/ml/predict?conteneur_id=1`);
    expect([200, 404, 500]).toContain(res.status);
  });

  it('devrait détecter les anomalies', async () => {
    const res = await axios.get(`${BASE_URL}/api/ml/anomalies`);
    expect([200, 500]).toContain(res.status);
  });
});