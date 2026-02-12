import request from 'supertest';
import app from '../../src/index.js';
import pool, {
  prepareDatabase,
  resetDatabase,
  closeDatabase
} from '../helpers/testDatabase.js';

beforeAll(async () => {
  // Initialisation du schéma pour la base de test.
  await prepareDatabase();
});

beforeEach(async () => {
  // Nettoyage + réinjection des utilisateurs de base avant chaque scénario.
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Routes de gamification (intégration)', () => {
  it('GET /health retourne 200 et le statut', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'gamifications' });
  });

  it('POST /actions ajoute des points et attribue un badge', async () => {
    await pool.query('UPDATE utilisateur SET points = 95 WHERE id_utilisateur = 1');

    const response = await request(app).post('/actions').send({
      id_utilisateur: 1,
      type_action: 'signalement'
    });

    expect(response.status).toBe(201);
    expect(response.body.pointsAjoutes).toBe(10);
    expect(response.body.totalPoints).toBe(105);
    expect(response.body.nouveauxBadges.length).toBe(1);
    expect(response.body.nouveauxBadges[0].code).toBe('DEBUTANT');
  });

  it('POST /actions refuse une requête incomplète', async () => {
    const response = await request(app).post('/actions').send({
      id_utilisateur: 1
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Données invalides');
  });

  it('POST /actions retourne une erreur si utilisateur introuvable', async () => {
    const response = await request(app).post('/actions').send({
      id_utilisateur: 999,
      type_action: 'collecte'
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Utilisateur introuvable');
  });

  it('GET /badges retourne une liste non vide', async () => {
    const response = await request(app).get('/badges');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('GET /badges/utilisateurs/:idUtilisateur retourne les badges gagnés', async () => {
    await pool.query('UPDATE utilisateur SET points = 120 WHERE id_utilisateur = 2');

    await request(app).post('/actions').send({
      id_utilisateur: 2,
      type_action: 'collecte'
    });

    const response = await request(app).get('/badges/utilisateurs/2');

    expect(response.status).toBe(200);
    expect(response.body.some((badge) => badge.code === 'DEBUTANT')).toBe(true);
  });

  it('GET /classement retourne un classement trié par points décroissants', async () => {
    await pool.query(
      `UPDATE utilisateur
       SET points = CASE id_utilisateur
         WHEN 1 THEN 200
         WHEN 2 THEN 50
         WHEN 3 THEN 300
       END`
    );

    const response = await request(app).get('/classement?limite=10');

    expect(response.status).toBe(200);
    expect(response.body.classement[0].points).toBe(300);
    expect(response.body.classement[1].points).toBe(200);
    expect(response.body.classement[2].points).toBe(50);
  });

  it('GET /notifications renvoie la notification de badge après une action', async () => {
    await pool.query('UPDATE utilisateur SET points = 95 WHERE id_utilisateur = 1');

    await request(app).post('/actions').send({
      id_utilisateur: 1,
      type_action: 'signalement'
    });

    const response = await request(app).get('/notifications?id_utilisateur=1');

    expect(response.status).toBe(200);
    expect(response.body.some((notif) => notif.type === 'BADGE')).toBe(true);
  });

  it('GET /utilisateurs/:idUtilisateur/stats retourne des statistiques cohérentes', async () => {
    await pool.query('UPDATE utilisateur SET points = 40 WHERE id_utilisateur = 3');
    await pool.query(
      `INSERT INTO historique_points (id_utilisateur, delta_points, raison, date_creation)
       VALUES (3, 20, 'collecte', NOW() - INTERVAL '1 day'),
              (3, 20, 'participation', NOW())`
    );

    const response = await request(app).get('/utilisateurs/3/stats');

    expect(response.status).toBe(200);
    expect(response.body.totalPoints).toBe(40);
    expect(response.body.parJour.length).toBeGreaterThan(0);
    expect(response.body.parSemaine.length).toBeGreaterThan(0);
    expect(response.body.parMois.length).toBeGreaterThan(0);
    expect(response.body.impactCO2).toBe(1);
  });

  describe('Routes /defis', () => {
    it('POST /defis cree un nouveau defi', async () => {
      const response = await request(app).post('/defis').send({
        titre: 'Defi Test Integration',
        description: 'Description du defi',
        objectif: 10,
        recompense_points: 100,
        date_debut: '2026-01-01',
        date_fin: '2026-01-31',
        type_defi: 'INDIVIDUEL'
      });

      expect(response.status).toBe(201);
      expect(response.body.titre).toBe('Defi Test Integration');
      expect(response.body.objectif).toBe(10);
      expect(response.body.recompense_points).toBe(100);
    });

    it('GET /defis liste tous les defis', async () => {
      await request(app).post('/defis').send({
        titre: 'Defi 1',
        objectif: 5,
        date_debut: '2026-01-01',
        date_fin: '2026-01-31'
      });

      const response = await request(app).get('/defis');

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('POST /defis refuse une requete invalide', async () => {
      const response = await request(app).post('/defis').send({
        titre: 'AB',
        objectif: -1
      });

      expect(response.status).toBe(400);
    });

    it('POST /defis/:idDefi/participations cree une participation', async () => {
      const defiResponse = await request(app).post('/defis').send({
        titre: 'Defi Participation',
        objectif: 10,
        date_debut: '2026-01-01',
        date_fin: '2026-01-31'
      });

      const idDefi = defiResponse.body.id_defi;

      const response = await request(app)
        .post(`/defis/${idDefi}/participations`)
        .send({ id_utilisateur: 1 });

      expect(response.status).toBe(201);
      expect(response.body.id_defi).toBe(idDefi);
      expect(response.body.id_utilisateur).toBe(1);
      expect(response.body.progression).toBe(0);
      expect(response.body.statut).toBe('EN_COURS');
    });

    it('PATCH /defis/:idDefi/participations/:idUtilisateur met a jour la progression', async () => {
      const defiResponse = await request(app).post('/defis').send({
        titre: 'Defi Progression',
        objectif: 10,
        date_debut: '2026-01-01',
        date_fin: '2026-01-31'
      });

      const idDefi = defiResponse.body.id_defi;

      await request(app)
        .post(`/defis/${idDefi}/participations`)
        .send({ id_utilisateur: 1 });

      const response = await request(app)
        .patch(`/defis/${idDefi}/participations/1`)
        .send({ progression: 5, statut: 'EN_COURS' });

      expect(response.status).toBe(200);
      expect(response.body.progression).toBe(5);
      expect(response.body.statut).toBe('EN_COURS');
    });
  });
});
