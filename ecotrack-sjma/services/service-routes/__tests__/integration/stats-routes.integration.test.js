const express = require('express');
const request = require('supertest');
const statsRoutes = require('../../src/routes/stats.route');

describe('Stats routes integration', () => {
  let app;
  let controllers;

  beforeEach(() => {
    controllers = {
      getDashboard: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getDashboard' })),
      getKpis: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getKpis' })),
      getCollecteStats: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getCollecteStats' })),
      getAlgorithmComparison: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getAlgorithmComparison' }))
    };

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.controllers = { stats: controllers };
      next();
    });
    app.use('/api/routes', statsRoutes);
  });

  it('routes GET /stats/dashboard to getDashboard controller', async () => {
    const res = await request(app).get('/api/routes/stats/dashboard');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getDashboard' }));
    expect(controllers.getDashboard).toHaveBeenCalledTimes(1);
  });

  it('routes GET /stats/kpis to getKpis controller', async () => {
    const res = await request(app).get('/api/routes/stats/kpis?date_debut=2026-01-01&date_fin=2026-12-31');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getKpis' }));
    expect(controllers.getKpis).toHaveBeenCalledTimes(1);
  });

  it('routes GET /stats/kpis with zone filter', async () => {
    const res = await request(app).get('/api/routes/stats/kpis?date_debut=2026-01-01&date_fin=2026-12-31&id_zone=1');

    expect(res.status).toBe(200);
    expect(controllers.getKpis).toHaveBeenCalledTimes(1);
  });

  it('routes GET /stats/collectes to getCollecteStats controller', async () => {
    const res = await request(app).get('/api/routes/stats/collectes?date_debut=2026-01-01&date_fin=2026-12-31');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getCollecteStats' }));
    expect(controllers.getCollecteStats).toHaveBeenCalledTimes(1);
  });

  it('routes GET /stats/algorithm-comparison to getAlgorithmComparison controller', async () => {
    const res = await request(app).get('/api/routes/stats/algorithm-comparison');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getAlgorithmComparison' }));
    expect(controllers.getAlgorithmComparison).toHaveBeenCalledTimes(1);
  });
});