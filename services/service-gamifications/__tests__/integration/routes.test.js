import { jest } from '@jest/globals';

const mockPool = {
  query: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
  connect: jest.fn()
};

jest.unstable_mockModule('pg', () => ({
  default: {
    Pool: jest.fn(() => mockPool)
  },
  Pool: jest.fn(() => mockPool)
}));

jest.unstable_mockModule('../../src/config/env.js', () => ({
  default: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    autoSchema: true
  },
  validateEnv: jest.fn()
}));

import request from 'supertest';
const app = (await import('../../src/index.js')).default;

describe('Routes de gamification (intégration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /health retourne 200 et le statut', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'gamifications' });
  });

  it('POST /actions refuse une requête incomplète', async () => {
    const response = await request(app).post('/actions').send({
      id_utilisateur: 1
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Données invalides');
  });

  it('POST /defis refuse une requete invalide', async () => {
    const response = await request(app).post('/defis').send({
      titre: 'AB',
      objectif: -1
    });

    expect(response.status).toBe(400);
  });
});
