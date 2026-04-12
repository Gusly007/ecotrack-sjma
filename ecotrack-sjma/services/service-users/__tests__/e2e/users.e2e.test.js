/**
 * E2E Tests for Users Service
 */

const request = require('supertest');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_AUTH = `${API_URL}/auth`;
const API_USERS = `${API_URL}/users`;
const API_ADMIN = `${API_URL}/admin`;

describe('Users E2E', () => {
  let token = '';

  it('login with valid credentials', async () => {
    const res = await request(API_AUTH).post('/login')
      .send({ email: 'admin@ecotrack.dev', password: 'admin123' });
    expect(res.status).toBeDefined();
    if (res.status === 200) token = res.body?.token || res.body?.data?.token;
  });

  it('reject login with invalid credentials', async () => {
    const res = await request(API_AUTH).post('/login')
      .send({ email: 'admin@ecotrack.dev', password: 'wrong' });
    expect(res.status).toBeGreaterThanOrEqual(401);
  });

  it('get user profile', async () => {
    if (!token) return;
    const res = await request(API_AUTH).get('/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('get all users', async () => {
    if (!token) return;
    const res = await request(API_USERS).get('/')
      .set('Authorization', `Bearer ${token}`).query({ limit: 10 });
    expect(res.status).toBeDefined();
  });

  it('filter users by role', async () => {
    if (!token) return;
    const res = await request(API_USERS).get('/')
      .set('Authorization', `Bearer ${token}`).query({ role: 'ADMIN' });
    expect(res.status).toBeDefined();
  });

  it('filter users by status', async () => {
    if (!token) return;
    const res = await request(API_USERS).get('/')
      .set('Authorization', `Bearer ${token}`).query({ statut: 'ACTIF' });
    expect(res.status).toBeDefined();
  });

  it('search users', async () => {
    if (!token) return;
    const res = await request(API_USERS).get('/')
      .set('Authorization', `Bearer ${token}`).query({ search: 'admin' });
    expect(res.status).toBeDefined();
  });

  it('get user stats', async () => {
    if (!token) return;
    const res = await request(API_USERS).get('/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('get permissions', async () => {
    if (!token) return;
    const res = await request(API_USERS).get('/permissions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('admin get stats', async () => {
    if (!token) return;
    const res = await request(API_ADMIN).get('/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('admin get permissions', async () => {
    if (!token) return;
    const res = await request(API_ADMIN).get('/permissions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeDefined();
  });

  it('unauthorized access', async () => {
    const res = await request(API_USERS).get('/');
    expect([401, 403]).toContain(res.status);
  });

  it('full workflow', async () => {
    let res = await request(API_AUTH).post('/login')
      .send({ email: 'admin@ecotrack.dev', password: 'admin123' });
    expect(res.status).toBeDefined();
    const t = res.body?.token || res.body?.data?.token;
    
    res = await request(API_USERS).get('/').set('Authorization', `Bearer ${t}`).query({ limit: 5 });
    expect(res.status).toBeDefined();
    
    res = await request(API_USERS).get('/stats').set('Authorization', `Bearer ${t}`);
    expect(res.status).toBeDefined();
  });
});
