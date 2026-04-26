import { jest } from '@jest/globals';

const mockPool = {
  query: jest.fn(),
  end: jest.fn(),
  on: jest.fn()
};

jest.unstable_mockModule('pg', () => ({
  default: {
    Pool: jest.fn(() => mockPool)
  },
  Pool: jest.fn(() => mockPool)
}));

const { creerNotification, listerNotifications } = await import('../../src/services/notifications.service.js');

describe('notifications.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crée puis récupère une notification', async () => {
    const nouvelleNotification = {
      id_notification: 1,
      id_utilisateur: 1,
      type: 'BADGE',
      titre: 'Nouveau badge!',
      corps: 'Vous avez obtenu le badge Débutant',
      date_creation: new Date()
    };

    mockPool.query
      .mockResolvedValueOnce({
        rows: [nouvelleNotification]
      })
      .mockResolvedValueOnce({
        rows: [nouvelleNotification]
      });

    const created = await creerNotification({
      idUtilisateur: 1,
      type: 'BADGE',
      titre: 'Nouveau badge!',
      corps: 'Vous avez obtenu le badge Débutant'
    });

    expect(created.id_notification).toBe(1);

    const notifications = await listerNotifications({ idUtilisateur: 1 });
    expect(notifications.length).toBe(1);
    expect(notifications[0].titre).toBe('Nouveau badge!');
  });

  it('filtre les notifications par utilisateur', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { id_notification: 1, id_utilisateur: 1, type: 'BADGE', titre: 'Badge 1' },
        { id_notification: 2, id_utilisateur: 1, type: 'DEFI', titre: 'Defi 1' }
      ]
    });

    const notifications = await listerNotifications({ idUtilisateur: 1 });

    expect(notifications.length).toBe(2);
    expect(notifications[0].id_utilisateur).toBe(1);
  });
});
