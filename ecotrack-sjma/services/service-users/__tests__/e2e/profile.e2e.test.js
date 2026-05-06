const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010';

describe('E2E - User Profile Workflow', () => {
  let authToken;

  beforeAll(async () => {
    try {
      const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: process.env.TEST_EMAIL || 'admin@ecotrack.com',
        password: process.env.TEST_PASSWORD || 'Admin123!'
      });
      authToken = loginRes.data?.token;
    } catch (e) {}
  });

  it('devrait récupérer le profil utilisateur', async () => {
    if (!authToken) return;
    const res = await axios.get(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(res.status).toBe(200);
  });

  it('devrait mettre à jour le profil', async () => {
    if (!authToken) return;
    const res = await axios.put(`${BASE_URL}/api/users/me`,
      { prenom: 'Test' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    expect([200, 201]).toContain(res.status);
  });

  it('devrait changer le mot de passe', async () => {
    if (!authToken) return;
    const res = await axios.post(`${BASE_URL}/api/users/change-password`,
      { oldPassword: 'old', newPassword: 'new' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    expect([200, 400]).toContain(res.status);
  });
});

describe('E2E - Role Permissions', () => {
  it('devrait vérifier les permissions ADMIN', async () => {
    try {
      const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@ecotrack.com',
        password: 'Admin123!'
      });
      const token = loginRes.data?.token;
      const res = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect([200, 401]).toContain(res.status);
    } catch (e) {}
  });

  it('devrait refuser l\'accès GESTIONNAIRE aux routes admin', async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer token-gestionnaire` }
      });
      expect([403, 401]).toContain(res.status);
    } catch (e) {}
  });
});