import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/database.js', () => ({
  __esModule: true,
  default: { query: mockQuery, on: jest.fn() }
}));

describe('NotificationsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('creerNotification should insert and return notification', async () => {
    const { NotificationsRepository } = await import('../../src/repositories/notifications.repository.js');
    const notif = { id_utilisateur: 1, type: 'BADGE', titre: 'T', corps: 'C' };
    mockQuery.mockResolvedValue({ rows: [notif] });
    const result = await NotificationsRepository.creerNotification(notif);
    expect(mockQuery).toHaveBeenCalled();
    expect(result).toEqual(notif);
  });

  it('listerNotifications should select notifications for user', async () => {
    const { NotificationsRepository } = await import('../../src/repositories/notifications.repository.js');
    const notif = { id_utilisateur: 1, titre: 'T' };
    mockQuery.mockResolvedValue({ rows: [notif] });
    const result = await NotificationsRepository.listerNotifications({ idUtilisateur: 1 });
    expect(mockQuery).toHaveBeenCalled();
    expect(result).toEqual([notif]);
  });
});
