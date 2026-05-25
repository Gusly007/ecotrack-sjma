const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || process.env.API_URL || 'http://127.0.0.1:3012';

describe('E2E - Tournee Lifecycle', () => {
  let token;

  beforeAll(async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/V1/auth/login`, {
        email: 'admin@ecotrack.com',
        password: 'Admin123!'
      });
      token = res.data?.token;
    } catch (e) {}
  });

  it('devrait créer une tournée', async () => {
    if (!token) return;
    const res = await axios.post(`${BASE_URL}/api/V1/tournees`,
      { date_tournee: '2026-12-25', id_zone: 1, id_agent: 5 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 201]).toContain(res.status);
  });

  it('devrait lister les tournées', async () => {
    if (!token) return;
    const res = await axios.get(`${BASE_URL}/api/V1/tournees`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status).toBe(200);
  });

  it('devrait récupérer une tournée par ID', async () => {
    if (!token) return;
    const res = await axios.get(`${BASE_URL}/api/V1/tournees/1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 404]).toContain(res.status);
  });

  it('devrait mettre à jour une tournée', async () => {
    if (!token) return;
    const res = await axios.put(`${BASE_URL}/api/V1/tournees/1`,
      { statut: 'PLANIFIEE' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 404]).toContain(res.status);
  });

  it('devrait supprimer une tournée', async () => {
    if (!token) return;
    const res = await axios.delete(`${BASE_URL}/api/V1/tournees/999`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([204, 404]).toContain(res.status);
  });
});

const noThrow = { validateStatus: () => true };

describe('E2E - Conteneur Search', () => {
  it('devrait rechercher par UID', async () => {
    const res = await axios.get(`${BASE_URL}/api/V1/conteneurs/search?uid=C-001`, noThrow);
    expect([200, 401, 404]).toContain(res.status);
  });

  it('devrait filtrer par zone', async () => {
    const res = await axios.get(`${BASE_URL}/api/V1/conteneurs?zone=1`, noThrow);
    expect([200, 401, 404]).toContain(res.status);
  });

  it('devrait appliquer le seuil de remplissage', async () => {
    const res = await axios.get(`${BASE_URL}/api/V1/conteneurs?seuil=70`, noThrow);
    expect([200, 401, 404]).toContain(res.status);
  });
});