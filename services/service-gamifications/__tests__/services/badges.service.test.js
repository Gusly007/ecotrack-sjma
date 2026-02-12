import { attribuerBadgesAutomatique } from '../../src/services/badges.service.js';
import pool, {
  prepareDatabase,
  resetDatabase,
  closeDatabase
} from '../helpers/testDatabase.js';

beforeAll(async () => {
  // Initialisation des tables requises pour les badges.
  await prepareDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('badges.service', () => {
  it('attribue un badge dès que le seuil est atteint', async () => {
    const nouveaux = await attribuerBadgesAutomatique({
      client: pool,
      idUtilisateur: 1,
      totalPoints: 120
    });

    expect(nouveaux.length).toBe(1);
    expect(nouveaux[0].code).toBe('DEBUTANT');
  });

  it('ne réattribue pas deux fois le même badge', async () => {
    await attribuerBadgesAutomatique({
      client: pool,
      idUtilisateur: 1,
      totalPoints: 120
    });

    const nouveaux = await attribuerBadgesAutomatique({
      client: pool,
      idUtilisateur: 1,
      totalPoints: 120
    });

    expect(nouveaux.length).toBe(0);
  });
});
