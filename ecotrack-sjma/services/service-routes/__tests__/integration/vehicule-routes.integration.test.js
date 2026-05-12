const express = require('express');
const request = require('supertest');
const vehiculeRoutes = require('../../src/routes/vehicule.route');

describe('Vehicule routes integration', () => {
  let app;
  let controllers;

  beforeEach(() => {
    controllers = {
      getAll: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getAll' })),
      create: jest.fn((req, res) => res.status(201).json({ ok: true, route: 'create' })),
      getById: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getById', id: req.params.id })),
      update: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'update', id: req.params.id })),
      delete: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'delete', id: req.params.id }))
    };

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.controllers = { vehicule: controllers };
      next();
    });
    app.use('/api/routes', vehiculeRoutes);
  });

  it('routes GET /vehicules to getAll controller', async () => {
    const res = await request(app).get('/api/routes/vehicules');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getAll' }));
    expect(controllers.getAll).toHaveBeenCalledTimes(1);
  });

  it('routes GET /vehicules with pagination', async () => {
    const res = await request(app).get('/api/routes/vehicules?page=2&limit=25');

    expect(res.status).toBe(200);
    expect(controllers.getAll).toHaveBeenCalledTimes(1);
  });

  it('routes POST /vehicules to create controller', async () => {
    const res = await request(app)
      .post('/api/routes/vehicules')
      .send({ numero_immatriculation: 'AB-123-CD', modele: 'Renault Master', capacite_kg: 3500 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(expect.objectContaining({ route: 'create' }));
    expect(controllers.create).toHaveBeenCalledTimes(1);
  });

  it('routes GET /vehicules/:id to getById controller', async () => {
    const res = await request(app).get('/api/routes/vehicules/5');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getById', id: '5' }));
    expect(controllers.getById).toHaveBeenCalledTimes(1);
  });

  it('routes PATCH /vehicules/:id to update controller', async () => {
    const res = await request(app)
      .patch('/api/routes/vehicules/3')
      .send({ modele: 'Updated Model' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'update', id: '3' }));
    expect(controllers.update).toHaveBeenCalledTimes(1);
  });

  it('routes DELETE /vehicules/:id to delete controller', async () => {
    const res = await request(app).delete('/api/routes/vehicules/10');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'delete', id: '10' }));
    expect(controllers.delete).toHaveBeenCalledTimes(1);
  });
});