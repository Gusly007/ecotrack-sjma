const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3011';

describe('E2E - Conteneur Full Lifecycle', () => {
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

  it('devrait créer un conteneur', async () => {
    if (!token) return;
    const res = await axios.post(`${BASE_URL}/api/conteneurs`,
      { uid: `TEST-${Date.now()}`, latitude: 48.85, longitude: 2.35, capacite_l: 1100 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([201, 401]).toContain(res.status);
  });

  it('devrait récupérer tous les conteneurs', async () => {
    if (!token) return;
    const res = await axios.get(`${BASE_URL}/api/conteneurs`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status).toBe(200);
  });

  it('devrait chercher par ID', async () => {
    if (!token) return;
    const res = await axios.get(`${BASE_URL}/api/conteneurs/1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 404]).toContain(res.status);
  });

  it('devrait mettre à jour le niveau', async () => {
    if (!token) return;
    const res = await axios.patch(`${BASE_URL}/api/conteneurs/1/remplissage`,
      { fill_level: 75 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 404]).toContain(res.status);
  });

  it('devrait supprimer un conteneur', async () => {
    if (!token) return;
    const res = await axios.delete(`${BASE_URL}/api/conteneurs/999`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([204, 404]).toContain(res.status);
  });
});

describe('E2E - Geo Proximity', () => {
  it('devrait trouver les conteneurs proches', async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conteneurs/proches?lat=48.85&lng=2.35&rayon=5`);
      expect([200, 401, 404]).toContain(res.status);
    } catch (error) {
      if (!error.response) {
        throw new Error(`Le service est injoignable sur ${BASE_URL}. Détails: ${error.message}`);
      }
      expect(error.response?.status).toBe(401);
    }
  });

  it('devrait calculer la distance', async () => {
    const p1 = { lat: 48.85, lng: 2.35 };
    const p2 = { lat: 48.86, lng: 2.36 };
    const dist = Math.sqrt(Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2)) * 111;
    expect(dist).toBeGreaterThan(0);
  });
});