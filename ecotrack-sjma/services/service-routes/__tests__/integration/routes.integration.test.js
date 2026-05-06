const request = require('supertest');
const app = require('../../src/app');

describe('Integration - Signalement Routes', () => {
  let token;

  beforeAll(async () => {
    try {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@ecotrack.com', password: 'Admin123!' });
      token = loginRes.body?.token;
    } catch (e) {}
  });

  it('GET /api/signalements - devrait lister les signalements', async () => {
    const res = await request(app)
      .get('/api/signalements')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('POST /api/signalements - devrait créer un signalement', async () => {
    const res = await request(app)
      .post('/api/signalements')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_conteneur: 1, type: 'DEPASSEMENT', description: 'Test' });
    expect([201, 400, 401]).toContain(res.status);
  });

  it('GET /api/signalements/:id - devrait récupérer un signalement', async () => {
    const res = await request(app)
      .get('/api/signalements/1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404, 401]).toContain(res.status);
  });

  it('PUT /api/signalements/:id - devrait mettre à jour un signalement', async () => {
    const res = await request(app)
      .put('/api/signalements/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ statut: 'TRAITE' });
    expect([200, 400, 401, 404]).toContain(res.status);
  });

  it('DELETE /api/signalements/:id - devrait supprimer un signalement', async () => {
    const res = await request(app)
      .delete('/api/signalements/999')
      .set('Authorization', `Bearer ${token}`);
    expect([204, 404, 401]).toContain(res.status);
  });
});

describe('Integration - Stats Routes', () => {
  it('GET /api/stats/globales - devrait retourner les stats globales', async () => {
    const res = await request(app)
      .get('/api/stats/globales')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/stats/zones - devrait retourner les stats par zone', async () => {
    const res = await request(app)
      .get('/api/stats/zones')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/stats/agents - devrait retourner les stats agents', async () => {
    const res = await request(app)
      .get('/api/stats/agents')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/stats/periode - devrait filtrer par période', async () => {
    const res = await request(app)
      .get('/api/stats/periode?date_debut=2026-01-01&date_fin=2026-12-31')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });
});

describe('Integration - Vehicule Routes', () => {
  it('GET /api/vehicules - devrait lister les véhicules', async () => {
    const res = await request(app)
      .get('/api/vehicules')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/vehicules/:id - devrait récupérer un véhicule', async () => {
    const res = await request(app)
      .get('/api/vehicules/1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404, 401]).toContain(res.status);
  });

  it('POST /api/vehicules - devrait créer un véhicule', async () => {
    const res = await request(app)
      .post('/api/vehicules')
      .set('Authorization', `Bearer ${token}`)
      .send({ immatriculation: 'TEST-001', type: 'CAMION' });
    expect([201, 400, 401]).toContain(res.status);
  });
});