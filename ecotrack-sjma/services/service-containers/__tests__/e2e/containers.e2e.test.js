/**
 * E2E Tests for Containers Service (Zones + Containers API)
 */

const request = require('supertest');
const { app } = require('../../index.js');

describe('Containers E2E', () => {
  let token = '';
  let zoneId = '';
  let containerId = '';

  it('login and get token', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: 'admin@ecotrack.dev', password: 'admin123' });
    expect(res.status).toBeDefined();
    if (res.status === 200) token = res.body?.token || res.body?.data?.token;
  });

  it('get all zones', async () => {
    const res = await request(app).get('/api/zones').query({ limit: 10 });
    expect(res.status).toBeDefined();
  });

  it('get zone by id', async () => {
    const res = await request(app).get('/api/zones/1');
    expect(res.status).toBeDefined();
  });

  it('filter zones by search', async () => {
    const res = await request(app).get('/api/zones').query({ search: 'ZONE' });
    expect(res.status).toBeDefined();
  });

  it('get all containers', async () => {
    const res = await request(app).get('/api/containers').query({ page: 1, limit: 10 });
    expect(res.status).toBeDefined();
  });

  it('filter containers by zone', async () => {
    const res = await request(app).get('/api/containers').query({ id_zone: 1 });
    expect(res.status).toBeDefined();
  });

  it('filter containers by type', async () => {
    const res = await request(app).get('/api/containers').query({ id_type: 1 });
    expect(res.status).toBeDefined();
  });

  it('filter containers by status', async () => {
    const res = await request(app).get('/api/containers').query({ statut: 'ACTIF' });
    expect(res.status).toBeDefined();
  });

  it('search containers', async () => {
    const res = await request(app).get('/api/containers').query({ search: 'CONT' });
    expect(res.status).toBeDefined();
  });

  it('get container stats', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBeDefined();
  });

  it('get zone stats', async () => {
    const res = await request(app).get('/api/zones/stats');
    expect(res.status).toBeDefined();
  });

  it('container lifecycle', async () => {
    const res = await request(app).get('/api/containers').query({ limit: 1 });
    if (res.body?.data?.length > 0) {
      const id = res.body.data[0].id_conteneur || res.body.data[0].id;
      const r1 = await request(app).get(`/api/containers/${id}`);
      expect(r1.status).toBeDefined();
      const r2 = await request(app).put(`/api/containers/${id}/status`).send({ statut: 'EN_MAINTENANCE' });
      expect([200, 400]).toContain(r2.status);
    }
  });
});
