import { jest } from '@jest/globals';

describe('gamificationService.enregistrerAction', () => {
  const loadService = async ({ failAt = null } = {}) => {
    jest.resetModules();

    const client = {
      query: jest.fn(async (sql) => {
        if (failAt && sql === failAt) throw new Error(`failed at ${sql}`);
      }),
      release: jest.fn()
    };

    const pool = {
      connect: jest.fn().mockResolvedValue(client)
    };

    const points = {
      calculerPoints: jest.fn().mockReturnValue(10),
      incrementerPoints: jest.fn().mockResolvedValue(120),
      enregistrerHistoriquePoints: jest.fn().mockResolvedValue()
    };

    const badges = {
      attribuerBadgesSiEligibles: jest.fn().mockResolvedValue([
        { nom: 'Debutant' }
      ])
    };

    const notifications = {
      creerNotification: jest.fn().mockResolvedValue({ id: 1 })
    };

    jest.unstable_mockModule('../../src/config/database.js', () => ({ default: pool }));
    jest.unstable_mockModule('../../src/services/points.service.js', () => points);
    jest.unstable_mockModule('../../src/services/badges.service.js', () => badges);
    jest.unstable_mockModule('../../src/services/notifications.service.js', () => notifications);

    const mod = await import('../../src/services/gamificationService.js');
    return { enregistrerAction: mod.enregistrerAction, client, pool, points, badges, notifications };
  };

  it('commits transaction and returns orchestration result', async () => {
    const { enregistrerAction, client, points, badges, notifications } = await loadService();

    const result = await enregistrerAction({
      idUtilisateur: 5,
      typeAction: 'DEPOT',
      pointsCustom: 2
    });

    expect(client.query).toHaveBeenCalledWith('BEGIN');
    expect(points.calculerPoints).toHaveBeenCalledWith('DEPOT', 2);
    expect(points.incrementerPoints).toHaveBeenCalled();
    expect(points.enregistrerHistoriquePoints).toHaveBeenCalled();
    expect(badges.attribuerBadgesSiEligibles).toHaveBeenCalled();
    expect(notifications.creerNotification).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
    expect(result).toEqual({
      pointsAjoutes: 10,
      totalPoints: 120,
      nouveauxBadges: [{ nom: 'Debutant' }]
    });
  });

  it('rolls back and rethrows on error', async () => {
    const { enregistrerAction, points, client } = await loadService();
    points.incrementerPoints.mockRejectedValueOnce(new Error('boom'));

    await expect(
      enregistrerAction({ idUtilisateur: 1, typeAction: 'X', pointsCustom: 1 })
    ).rejects.toThrow('boom');

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
