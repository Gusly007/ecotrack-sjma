import { jest } from '@jest/globals';

describe('Route modules registration', () => {
  const loadRoute = async (modulePath) => {
    jest.resetModules();

    const router = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };

    const requirePermission = jest.fn((perm) => `perm:${perm}`);
    const validateQuery = jest.fn(() => 'validateQuery');
    const validateBody = jest.fn(() => 'validateBody');

    jest.unstable_mockModule('express', () => ({
      Router: () => router
    }));

    jest.unstable_mockModule('../../src/middleware/rbac.js', () => ({
      requirePermission
    }));

    jest.unstable_mockModule('../../src/middleware/validation.js', () => ({
      validateQuery,
      validateBody
    }));

    jest.unstable_mockModule('../../src/validators/schemas.js', () => ({
      badgesQuerySchema: { name: 'badges' },
      classementQuerySchema: { name: 'classement' },
      defisQuerySchema: { name: 'defis' },
      notificationQuerySchema: { name: 'notificationQuery' },
      notificationBodySchema: { name: 'notificationBody' }
    }));

    jest.unstable_mockModule('../../src/controllers/actionsController.js', () => ({
      enregistrerAction: 'actionsHandler'
    }));

    jest.unstable_mockModule('../../src/controllers/badgesController.js', () => ({
      obtenirBadges: 'obtenirBadges',
      obtenirBadgesUtilisateur: 'obtenirBadgesUtilisateur'
    }));

    jest.unstable_mockModule('../../src/controllers/classementController.js', () => ({
      obtenirClassement: 'obtenirClassement'
    }));

    jest.unstable_mockModule('../../src/controllers/defisController.js', () => ({
      creerDefiHandler: 'creerDefiHandler',
      listerDefisHandler: 'listerDefisHandler',
      creerParticipationHandler: 'creerParticipationHandler',
      mettreAJourProgressionHandler: 'mettreAJourProgressionHandler'
    }));

    jest.unstable_mockModule('../../src/controllers/notificationsController.js', () => ({
      creerNotificationHandler: 'creerNotificationHandler',
      listerNotificationsHandler: 'listerNotificationsHandler'
    }));

    jest.unstable_mockModule('../../src/controllers/statsController.js', () => ({
      obtenirStatsUtilisateur: 'obtenirStatsUtilisateur'
    }));

    await import(modulePath);

    return { router, requirePermission, validateQuery, validateBody };
  };

  it('registers actions route', async () => {
    const { router, requirePermission } = await loadRoute('../../src/routes/actions.js');
    expect(requirePermission).toHaveBeenCalledWith('gamification:create');
    expect(router.post).toHaveBeenCalledWith('/', 'perm:gamification:create', 'actionsHandler');
  });

  it('registers badges routes', async () => {
    const { router, requirePermission, validateQuery } = await loadRoute('../../src/routes/badges.js');
    expect(requirePermission).toHaveBeenCalledWith('badges:read');
    expect(validateQuery).toHaveBeenCalled();
    expect(router.get).toHaveBeenCalledTimes(2);
    expect(router.get).toHaveBeenNthCalledWith(1, '/', 'perm:badges:read', 'obtenirBadges');
    expect(router.get).toHaveBeenNthCalledWith(
      2,
      '/utilisateurs/:idUtilisateur',
      'perm:badges:read',
      'validateQuery',
      'obtenirBadgesUtilisateur'
    );
  });

  it('registers classement route', async () => {
    const { router, requirePermission, validateQuery } = await loadRoute('../../src/routes/classement.js');
    expect(requirePermission).toHaveBeenCalledWith('classement:read');
    expect(validateQuery).toHaveBeenCalled();
    expect(router.get).toHaveBeenCalledWith('/', 'perm:classement:read', 'validateQuery', 'obtenirClassement');
  });

  it('registers defis routes', async () => {
    const { router, requirePermission } = await loadRoute('../../src/routes/defis.js');

    expect(requirePermission).toHaveBeenCalledWith('defis:read');
    expect(requirePermission).toHaveBeenCalledWith('defis:create');
    expect(requirePermission).toHaveBeenCalledWith('defis:update');

    expect(router.get).toHaveBeenCalledWith('/', 'perm:defis:read', 'listerDefisHandler');
    expect(router.post).toHaveBeenCalledWith('/', 'perm:defis:create', 'creerDefiHandler');
    expect(router.post).toHaveBeenCalledWith(
      '/:idDefi/participations',
      'perm:defis:read',
      'creerParticipationHandler'
    );
    expect(router.patch).toHaveBeenCalledWith(
      '/:idDefi/participations/:idUtilisateur',
      'perm:defis:update',
      'mettreAJourProgressionHandler'
    );
  });

  it('registers notifications routes', async () => {
    const { router, requirePermission, validateBody } = await loadRoute('../../src/routes/notifications.js');

    expect(requirePermission).toHaveBeenCalledWith('gamification:read');
    expect(requirePermission).toHaveBeenCalledWith('gamification:create');
    expect(validateBody).toHaveBeenCalled();

    expect(router.get).toHaveBeenCalledWith('/', 'perm:gamification:read', 'listerNotificationsHandler');
    expect(router.post).toHaveBeenCalledWith(
      '/',
      'perm:gamification:create',
      'validateBody',
      'creerNotificationHandler'
    );
  });

  it('registers stats route', async () => {
    const { router, requirePermission } = await loadRoute('../../src/routes/stats.js');
    expect(requirePermission).toHaveBeenCalledWith('gamification:read');
    expect(router.get).toHaveBeenCalledWith(
      '/utilisateurs/:idUtilisateur/stats',
      'perm:gamification:read',
      'obtenirStatsUtilisateur'
    );
  });
});
