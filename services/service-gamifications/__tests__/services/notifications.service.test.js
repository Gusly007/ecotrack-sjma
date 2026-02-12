import { creerNotification, listerNotifications } from '../../src/services/notifications.service.js';
import pool, {
  prepareDatabase,
  resetDatabase,
  closeDatabase
} from '../helpers/testDatabase.js';

beforeAll(async () => {
  // Préparation du schéma pour les notifications.
  await prepareDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('notifications.service', () => {
  it('crée puis récupère une notification', async () => {
    await creerNotification({
      idUtilisateur: 1,
      type: 'BADGE',
      titre: 'Test badge',
      corps: 'Badge obtenu.'
    }, pool);

    const notifications = await listerNotifications({ idUtilisateur: 1 });

    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('BADGE');
  });

  it('filtre les notifications par utilisateur', async () => {
    await creerNotification({
      idUtilisateur: 1,
      type: 'ALERTE',
      titre: 'Alerte 1',
      corps: 'Test.'
    }, pool);
    await creerNotification({
      idUtilisateur: 2,
      type: 'ALERTE',
      titre: 'Alerte 2',
      corps: 'Test.'
    }, pool);

    const notifications = await listerNotifications({ idUtilisateur: 1 });

    expect(notifications.length).toBe(1);
    expect(notifications[0].id_utilisateur).toBe(1);
  });
});
