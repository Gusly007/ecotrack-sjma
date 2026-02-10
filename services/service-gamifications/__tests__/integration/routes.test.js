import { jest } from '@jest/globals';

// ── Mock database (empêche toute connexion PostgreSQL réelle) ──
jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: { query: jest.fn(), on: jest.fn(), end: jest.fn(), connect: jest.fn() },
  ensureGamificationTables: jest.fn(),
  initGamificationDb: jest.fn()
}));

// ── Mock des services métier (même pattern que les tests controllers) ──
const mockEnregistrerAction = jest.fn();
jest.unstable_mockModule('../../src/services/gamificationService.js', () => ({
  enregistrerAction: mockEnregistrerAction
}));

const mockListerBadges = jest.fn();
const mockListerBadgesUtilisateur = jest.fn();
jest.unstable_mockModule('../../src/services/badges.service.js', () => ({
  listerBadges: mockListerBadges,
  listerBadgesUtilisateur: mockListerBadgesUtilisateur,
  attribuerBadgesAutomatique: jest.fn(),
  BADGE_SEUILS: { DEBUTANT: 100, ECO_GUERRIER: 500, SUPER_HEROS: 1000 }
}));

const mockRecupererClassement = jest.fn();
jest.unstable_mockModule('../../src/services/leaderboard.service.js', () => ({
  recupererClassement: mockRecupererClassement
}));

const mockCreerNotification = jest.fn();
const mockListerNotifications = jest.fn();
jest.unstable_mockModule('../../src/services/notifications.service.js', () => ({
  creerNotification: mockCreerNotification,
  listerNotifications: mockListerNotifications
}));

const mockRecupererStatsUtilisateur = jest.fn();
jest.unstable_mockModule('../../src/services/stats.service.js', () => ({
  recupererStatsUtilisateur: mockRecupererStatsUtilisateur
}));

const request = (await import('supertest')).default;
const { default: app } = await import('../../src/index.js');

describe('Routes de gamification (intégration)', () => {
  afterEach(() => jest.clearAllMocks());

  it('GET /health retourne 200 et le statut', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'gamifications' });
  });

  it('POST /actions ajoute des points et attribue un badge', async () => {
    mockEnregistrerAction.mockResolvedValue({
      pointsAjoutes: 10,
      totalPoints: 105,
      nouveauxBadges: [{ code: 'DEBUTANT', nom: 'Débutant' }]
    });

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
    const error = new Error('Utilisateur introuvable');
    error.status = 400;
    mockEnregistrerAction.mockRejectedValue(error);

    const response = await request(app).post('/actions').send({
      id_utilisateur: 999,
      type_action: 'collecte'
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Utilisateur introuvable');
  });

  it('GET /badges retourne une liste non vide', async () => {
    mockListerBadges.mockResolvedValue([
      { id_badge: 1, code: 'DEBUTANT', nom: 'Débutant', description: 'Premier pas', points_requis: 100 },
      { id_badge: 2, code: 'ECO_GUERRIER', nom: 'Éco-Guerrier', description: 'Avancé', points_requis: 500 }
    ]);

    const response = await request(app).get('/badges');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('GET /badges/utilisateurs/:idUtilisateur retourne les badges gagnés', async () => {
    mockListerBadgesUtilisateur.mockResolvedValue([
      { id_badge: 1, code: 'DEBUTANT', nom: 'Débutant', date_obtention: new Date().toISOString(), points_requis: 100 }
    ]);

    const response = await request(app).get('/badges/utilisateurs/2');

    expect(response.status).toBe(200);
    expect(response.body.some((badge) => badge.code === 'DEBUTANT')).toBe(true);
  });

  it('GET /classement retourne un classement trié par points décroissants', async () => {
    mockRecupererClassement.mockResolvedValue({
      classement: [
        { rang: 1, id_utilisateur: 3, points: 300, niveau: 'Éco-Warrior', badges: [] },
        { rang: 2, id_utilisateur: 1, points: 200, niveau: 'Éco-Warrior', badges: [] },
        { rang: 3, id_utilisateur: 2, points: 50, niveau: 'Débutant', badges: [] }
      ]
    });

    const response = await request(app).get('/classement?limite=10');

    expect(response.status).toBe(200);
    expect(response.body.classement[0].points).toBe(300);
    expect(response.body.classement[1].points).toBe(200);
    expect(response.body.classement[2].points).toBe(50);
  });

  it('GET /notifications renvoie la notification de badge après une action', async () => {
    mockListerNotifications.mockResolvedValue([
      { id: 1, id_utilisateur: 1, type: 'BADGE', titre: 'Nouveau badge', corps: 'Félicitations !', date_creation: new Date().toISOString() }
    ]);

    const response = await request(app).get('/notifications?id_utilisateur=1');

    expect(response.status).toBe(200);
    expect(response.body.some((notif) => notif.type === 'BADGE')).toBe(true);
  });

  it('GET /utilisateurs/:idUtilisateur/stats retourne des statistiques cohérentes', async () => {
    mockRecupererStatsUtilisateur.mockResolvedValue({
      totalPoints: 40,
      parJour: [{ periode: '2024-01-10', points: 20 }, { periode: '2024-01-11', points: 20 }],
      parSemaine: [{ periode: '2024-W02', points: 40 }],
      parMois: [{ periode: '2024-01', points: 40 }],
      impactCO2: 1
    });

    const response = await request(app).get('/utilisateurs/3/stats');

    expect(response.status).toBe(200);
    expect(response.body.totalPoints).toBe(40);
    expect(response.body.parJour.length).toBeGreaterThan(0);
    expect(response.body.parSemaine.length).toBeGreaterThan(0);
    expect(response.body.parMois.length).toBeGreaterThan(0);
    expect(response.body.impactCO2).toBe(1);
  });
});
