import { jest } from '@jest/globals';

const mockCreerNotification = jest.fn();
const mockListerNotifications = jest.fn();

jest.unstable_mockModule('../../src/services/notifications.service.js', () => ({
  creerNotification: mockCreerNotification,
  listerNotifications: mockListerNotifications
}));

const {
  creerNotificationHandler,
  listerNotificationsHandler
} = await import('../../src/controllers/notificationsController.js');

const mockRequest = ({ body = {}, query = {} } = {}) => ({
  body,
  query
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('notificationsController', () => {
  const next = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('crée une notification et renvoie 201', async () => {
    const req = mockRequest({
      body: {
        id_utilisateur: 1,
        type: 'BADGE',
        titre: 'Badge',
        corps: 'Bravo'
      }
    });
    const res = mockResponse();
    mockCreerNotification.mockResolvedValue({ id_notification: 1 });

    await creerNotificationHandler(req, res, next);

    expect(mockCreerNotification).toHaveBeenCalledWith({
      idUtilisateur: 1,
      type: 'BADGE',
      titre: 'Badge',
      corps: 'Bravo'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id_notification: 1 });
  });

  it('liste les notifications d\'un utilisateur', async () => {
    const req = mockRequest({ query: { id_utilisateur: '2' } });
    const res = mockResponse();
    mockListerNotifications.mockResolvedValue([{ id_notification: 1 }]);

    await listerNotificationsHandler(req, res, next);

    expect(mockListerNotifications).toHaveBeenCalledWith({ idUtilisateur: 2 });
    expect(res.json).toHaveBeenCalledWith([{ id_notification: 1 }]);
  });
});
