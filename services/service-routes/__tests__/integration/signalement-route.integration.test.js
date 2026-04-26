const express = require('express');
const request = require('supertest');
const signalementRoutes = require('../../src/routes/signalement.route');

describe('Signalement routes integration', () => {
  let app;
  let controllers;

  beforeEach(() => {
    controllers = {
      getAll: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getAll' })),
      getStats: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getStats' })),
      getTypes: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getTypes' })),
      getHistory: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getHistory', id: req.params.id })),
      getById: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getById', id: req.params.id })),
      updateStatus: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'updateStatus', id: req.params.id })),
      saveTreatment: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'saveTreatment', id: req.params.id })),
      update: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'update', id: req.params.id }))
    };

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.controllers = { signalement: controllers };
      next();
    });
    app.use('/api/routes', signalementRoutes);
  });

  it('routes GET /signalements to getAll controller', async () => {
    const res = await request(app).get('/api/routes/signalements');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getAll' }));
    expect(controllers.getAll).toHaveBeenCalledTimes(1);
  });

  it('routes GET /signalements/:id/historique to getHistory controller', async () => {
    const res = await request(app).get('/api/routes/signalements/22/historique');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getHistory', id: '22' }));
    expect(controllers.getHistory).toHaveBeenCalledTimes(1);
  });

  it('routes PUT /signalements/:id/status to updateStatus controller', async () => {
    const res = await request(app).put('/api/routes/signalements/5/status').send({ statut: 'RESOLU' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'updateStatus', id: '5' }));
    expect(controllers.updateStatus).toHaveBeenCalledTimes(1);
  });

  it('routes PUT /signalements/:id/traitement to saveTreatment controller', async () => {
    const res = await request(app).put('/api/routes/signalements/6/traitement').send({ id_agent: 1, commentaire: 'ok' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'saveTreatment', id: '6' }));
    expect(controllers.saveTreatment).toHaveBeenCalledTimes(1);
  });
});