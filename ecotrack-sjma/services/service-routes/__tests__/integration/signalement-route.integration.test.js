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
    app.use('/api/V1/routes', signalementRoutes);
  });

  it('routes GET /signalements to getAll controller', async () => {
    const res = await request(app).get('/api/V1/routes/signalements');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getAll' }));
    expect(controllers.getAll).toHaveBeenCalledTimes(1);
  });

  it('routes GET /signalements/:id/historique to getHistory controller', async () => {
    const res = await request(app).get('/api/V1/routes/signalements/22/historique');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'getHistory', id: '22' }));
    expect(controllers.getHistory).toHaveBeenCalledTimes(1);
  });

  it('routes PUT /signalements/:id/status to updateStatus controller', async () => {
    const res = await request(app)
      .put('/api/V1/routes/signalements/5/status')
      .set('x-user-role', 'GESTIONNAIRE')
      .send({ statut: 'RESOLU' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'updateStatus', id: '5' }));
    expect(controllers.updateStatus).toHaveBeenCalledTimes(1);
  });

  it('routes PUT /signalements/:id/traitement to saveTreatment controller', async () => {
    const res = await request(app)
      .put('/api/V1/routes/signalements/6/traitement')
      .set('x-user-role', 'GESTIONNAIRE')
      .send({ id_agent: 1, commentaire: 'ok' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ route: 'saveTreatment', id: '6' }));
    expect(controllers.saveTreatment).toHaveBeenCalledTimes(1);
  });

  // SCRUM-7 : les 3 routes de modification sont réservées à GESTIONNAIRE et ADMIN.
  describe('RBAC sur les routes de modification (SCRUM-7)', () => {
    const writeRoutes = [
      { path: '/api/V1/routes/signalements/7/status', body: { statut: 'RESOLU' }, controller: 'updateStatus' },
      { path: '/api/V1/routes/signalements/7/traitement', body: { commentaire: 'ok' }, controller: 'saveTreatment' },
      { path: '/api/V1/routes/signalements/7', body: { description: 'réécrite' }, controller: 'update' }
    ];

    describe.each(writeRoutes)('PUT $path', ({ path, body, controller }) => {
      it('renvoie 401 sans rôle transmis par le gateway', async () => {
        const res = await request(app).put(path).send(body);

        expect(res.status).toBe(401);
        expect(controllers[controller]).not.toHaveBeenCalled();
      });

      it('renvoie 403 à un CITOYEN, y compris sur un signalement qui n\'est pas le sien', async () => {
        const res = await request(app)
          .put(path)
          .set('x-user-role', 'CITOYEN')
          .set('x-user-id', '999')
          .send(body);

        expect(res.status).toBe(403);
        expect(controllers[controller]).not.toHaveBeenCalled();
      });

      it('renvoie 403 à un AGENT', async () => {
        const res = await request(app)
          .put(path)
          .set('x-user-role', 'AGENT')
          .send(body);

        expect(res.status).toBe(403);
        expect(controllers[controller]).not.toHaveBeenCalled();
      });

      it.each(['GESTIONNAIRE', 'ADMIN'])('laisse passer %s jusqu\'au contrôleur', async (role) => {
        const res = await request(app)
          .put(path)
          .set('x-user-role', role)
          .send(body);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(expect.objectContaining({ route: controller, id: '7' }));
        expect(controllers[controller]).toHaveBeenCalledTimes(1);
      });
    });

    it('laisse les routes de lecture accessibles à un CITOYEN', async () => {
      const res = await request(app)
        .get('/api/V1/routes/signalements/7')
        .set('x-user-role', 'CITOYEN');

      expect(res.status).toBe(200);
      expect(controllers.getById).toHaveBeenCalledTimes(1);
    });
  });
});