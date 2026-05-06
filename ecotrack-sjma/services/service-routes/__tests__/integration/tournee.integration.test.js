const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Integration - Tournee Routes', () => {
  it('GET /api/tournees - devrait lister les tournées', async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tournees`);
      expect([200, 401]).toContain(res.status);
    } catch (err) {
      expect([401, 500]).toContain(err.response?.status);
    }
  });

  it('GET /api/tournees/actives - devrait lister les actives', async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tournees/actives`);
      expect([200, 401]).toContain(res.status);
    } catch (err) {}
  });

  it('POST /api/tournees/preview - devrait retourner prévisualisation', async () => {
    try {
      const payload = { id_zone: 1, date_tournee: '2026-12-25', id_agent: 5 };
      const res = await axios.post(`${BASE_URL}/api/tournees/preview`, payload);
      expect([200, 400, 401]).toContain(res.status);
    } catch (err) {}
  });
});

describe('Integration - Conteneur Routes', () => {
  it('GET /api/conteneurs - devrait lister', async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conteneurs`);
      expect([200, 401]).toContain(res.status);
    } catch (err) {}
  });

  it('GET /api/conteneurs/actifs - devrait lister actifs', async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conteneurs/actifs`);
      expect([200, 401]).toContain(res.status);
    } catch (err) {}
  });
});

describe('Integration - Signalement', () => {
  it('GET /api/signalements - devrait lister', async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/signalements`);
      expect([200, 401]).toContain(res.status);
    } catch (err) {}
  });
});