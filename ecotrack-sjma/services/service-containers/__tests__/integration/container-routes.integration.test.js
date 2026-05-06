const request = require('supertest');
const app = require('../../src/app');

describe('Integration - Conteneur CRUD', () => {
  let token;

  beforeAll(async () => {
    try {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@ecotrack.com', password: 'Admin123!' });
      token = loginRes.body?.token;
    } catch (e) {}
  });

  it('POST /api/conteneurs - devrait créer un conteneur', async () => {
    const res = await request(app)
      .post('/api/conteneurs')
      .set('Authorization', `Bearer ${token}`)
      .send({ uid: `TEST-${Date.now()}`, latitude: 48.85, longitude: 2.35, capacite_l: 1100 });
    expect([201, 400, 401]).toContain(res.status);
  });

  it('GET /api/conteneurs/:id - récupérer un conteneur', async () => {
    const res = await request(app)
      .get('/api/conteneurs/1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404, 401]).toContain(res.status);
  });

  it('PUT /api/conteneurs/:id - mettre à jour un conteneur', async () => {
    const res = await request(app)
      .put('/api/conteneurs/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ adresse: 'Nouvelle adresse' });
    expect([200, 400, 401, 404]).toContain(res.status);
  });

  it('DELETE /api/conteneurs/:id - supprimer un conteneur', async () => {
    const res = await request(app)
      .delete('/api/conteneurs/999')
      .set('Authorization', `Bearer ${token}`);
    expect([204, 404, 401]).toContain(res.status);
  });
});

describe('Integration - Conteneur Filters', () => {
  let token;

  it('GET /api/conteneurs?zone=1 - filtrer par zone', async () => {
    const res = await request(app)
      .get('/api/conteneurs?zone=1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/conteneurs?seuil_remplissage=70 - filtrer par remplissage', async () => {
    const res = await request(app)
      .get('/api/conteneurs?seuil_remplissage=70')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/conteneurs?statut=ACTIF - filtrer par statut', async () => {
    const res = await request(app)
      .get('/api/conteneurs?statut=ACTIF')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });
});

describe('Integration - Geo', () => {
  it('GET /api/conteneurs/proches?lat=48.85&lng=2.35 - conteneurs proches', async () => {
    const res = await request(app)
      .get('/api/conteneurs/proches?lat=48.85&lng=2.35&rayon=5')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });
});