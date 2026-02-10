import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: { query: mockQuery, on: jest.fn(), end: jest.fn() },
  ensureGamificationTables: jest.fn(),
  initGamificationDb: jest.fn()
}));

const { creerNotification, listerNotifications } = await import(
  '../../src/services/notifications.service.js'
);

describe('notifications.service', () => {
  afterEach(() => jest.clearAllMocks());

  it('crée puis récupère une notification', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [{
          id: 1,
          id_utilisateur: 1,
          type: 'BADGE',
          titre: 'Test badge',
          corps: 'Badge obtenu.',
          date_creation: new Date().toISOString()
        }]
      })
    };

    const notif = await creerNotification({
      idUtilisateur: 1,
      type: 'BADGE',
      titre: 'Test badge',
      corps: 'Badge obtenu.'
    }, mockClient);

    expect(notif.type).toBe('BADGE');

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 1,
        id_utilisateur: 1,
        type: 'BADGE',
        titre: 'Test badge',
        corps: 'Badge obtenu.',
        date_creation: new Date().toISOString()
      }]
    });

    const notifications = await listerNotifications({ idUtilisateur: 1 });

    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('BADGE');
  });

  it('filtre les notifications par utilisateur', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 1,
        id_utilisateur: 1,
        type: 'ALERTE',
        titre: 'Alerte 1',
        corps: 'Test.'
      }]
    });

    const notifications = await listerNotifications({ idUtilisateur: 1 });

    expect(notifications.length).toBe(1);
    expect(notifications[0].id_utilisateur).toBe(1);
  });
});
