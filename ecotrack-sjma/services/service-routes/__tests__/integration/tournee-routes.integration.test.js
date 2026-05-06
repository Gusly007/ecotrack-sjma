const express = require('express');
const request = require('supertest');
const tourneeRoutes = require('../../src/routes/tournee.route');

describe('Tournee routes integration', () => {
  let app;
  let controllers;

  beforeEach(() => {
    controllers = {
      getAll: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getAll' })),
      getActive: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getActive' })),
      getById: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getById', id: req.params.id })),
      create: jest.fn((req, res) => res.status(201).json({ ok: true, route: 'create' })),
      update: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'update', id: req.params.id })),
      delete: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'delete', id: req.params.id })),
      start: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'start', id: req.params.id })),
      finish: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'finish', id: req.params.id })),
      optimize: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'optimize' })),
      getAgentTournees: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getAgentTournees' }))
    };

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.controllers = { tournee: controllers };
      next();
    });
    app.use('/api/routes/tournees', tourneeRoutes);
  });

  it('routes GET / to getAll controller', async () => {
    const res = await request(app).get('/api/routes/tournees');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getAll' }));
    expect(controllers.getAll).toHaveBeenCalledTimes(1);
  });

  it('routes GET / with pagination', async () => {
    const res = await request(app).get('/api/routes/tournees?page=1&limit=20');

    expect(res.status).toBe(200);
    expect(controllers.getAll).toHaveBeenCalledTimes(1);
  });

  it('routes GET /active to getActive controller', async () => {
    const res = await request(app).get('/api/routes/tournees/active');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getActive' }));
    expect(controllers.getActive).toHaveBeenCalledTimes(1);
  });

  it('routes GET /:id to getById controller', async () => {
    const res = await request(app).get('/api/routes/tournees/5');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getById', id: '5' }));
    expect(controllers.getById).toHaveBeenCalledTimes(1);
  });

  it('routes POST / to create controller', async () => {
    const res = await request(app)
      .post('/api/routes/tournees')
      .send({ date_tournee: '2026-05-10', duree_prevue_min: 120, id_zone: 1, id_agent: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(expect.objectContaining({ route: 'create' }));
    expect(controllers.create).toHaveBeenCalledTimes(1);
  });

  it('routes PATCH /:id to update controller', async () => {
    const res = await request(app)
      .patch('/api/routes/tournees/3')
      .send({ statut: 'TERMINEE' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'update', id: '3' }));
    expect(controllers.update).toHaveBeenCalledTimes(1);
  });

  it('routes DELETE /:id to delete controller', async () => {
    const res = await request(app).delete('/api/routes/tournees/10');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'delete', id: '10' }));
    expect(controllers.delete).toHaveBeenCalledTimes(1);
  });
});