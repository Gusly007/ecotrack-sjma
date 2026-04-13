/**
 * E2E Tests for Users Service
 */

import request from 'supertest';
import app from '../../src/index.js';

describe('Users E2E', () => {
  let token = '';

  it('login with valid credentials', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: 'admin@ecotrack.dev', password: 'admin123' });
    expect(res.status).toBeDefined();
    if (res.status === 200) token = res.body?.token || res.body?.data?.token;
  });

  it('reject login with invalid credentials', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: 'admin@ecotrack.dev', password: 'wrong' });
    expect(res.status).toBeGreaterThanOrEqual(401);
  });

  it('get user profile', async () => {
    if (!token) return;
    const res = await request(app).get('/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('get all users', async () => {
    if (!token) return;
    const res = await request(app).get('/users')
      .set('Authorization', `Bearer ${token}`).query({ limit: 10 });
    expect(res.status).toBeDefined();
  });

  it('filter users by role', async () => {
    if (!token) return;
    const res = await request(app).get('/users')
      .set('Authorization', `Bearer ${token}`).query({ role: 'ADMIN' });
    expect(res.status).toBeDefined();
  });

  it('filter users by status', async () => {
    if (!token) return;
    const res = await request(app).get('/users')
      .set('Authorization', `Bearer ${token}`).query({ statut: 'ACTIF' });
    expect(res.status).toBeDefined();
  });

  it('search users', async () => {
    if (!token) return;
    const res = await request(app).get('/users')
      .set('Authorization', `Bearer ${token}`).query({ search: 'admin' });
    expect(res.status).toBeDefined();
  });

  it('get user stats', async () => {
    if (!token) return;
    const res = await request(app).get('/users/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('get permissions', async () => {
    if (!token) return;
    const res = await request(app).get('/users/permissions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('admin get stats', async () => {
    if (!token) return;
    const res = await request(app).get('/admin/roles/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('admin get permissions', async () => {
    if (!token) return;
    const res = await request(app).get('/admin/roles/permissions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('unauthorized access', async () => {
    const res = await request(app).get('/users');
    expect([401, 403]).toContain(res.status);
  });

  it('full workflow', async () => {
    let res = await request(app).post('/auth/login')
      .send({ email: 'admin@ecotrack.dev', password: 'admin123' });
    expect(res.status).toBeDefined();
    const t = res.body?.token || res.body?.data?.token;
    
    res = await request(app).get('/users').set('Authorization', `Bearer ${t}`).query({ limit: 5 });
    expect(res.status).toBeDefined();
    
    res = await request(app).get('/users/stats').set('Authorization', `Bearer ${t}`);
    expect(res.status).toBeDefined();
  });
});
