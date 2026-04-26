import { ConfigService } from '../../src/services/configService.js';

jest.mock('../../src/repositories/configuration.repository.js', () => ({
  ConfigurationRepository: {
    getByKey: jest.fn(),
    getMultiple: jest.fn(),
    getByCategory: jest.fn(),
    update: jest.fn(),
    getAll: jest.fn(),
  },
}));

import { ConfigurationRepository } from '../../src/repositories/configuration.repository.js';

describe('ConfigService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await ConfigService.invalidateCache();
  });

  it('get reads value from db and cache', async () => {
    ConfigurationRepository.getByKey.mockResolvedValue({ valeur: '12', type: 'number' });

    const first = await ConfigService.get('x');
    const second = await ConfigService.get('x');

    expect(first).toBe(12);
    expect(second).toBe(12);
    expect(ConfigurationRepository.getByKey).toHaveBeenCalledTimes(1);
  });

  it('get bypasses cache when requested', async () => {
    ConfigurationRepository.getByKey
      .mockResolvedValueOnce({ valeur: 'true', type: 'boolean' })
      .mockResolvedValueOnce({ valeur: 'false', type: 'boolean' });

    const first = await ConfigService.get('flag');
    const second = await ConfigService.get('flag', false);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(ConfigurationRepository.getByKey).toHaveBeenCalledTimes(2);
  });

  it('returns null when key does not exist', async () => {
    ConfigurationRepository.getByKey.mockResolvedValue(null);

    await expect(ConfigService.get('missing')).resolves.toBeNull();
  });

  it('getMultiple proxies repository', async () => {
    ConfigurationRepository.getMultiple.mockResolvedValue({ a: 1 });

    await expect(ConfigService.getMultiple(['a'])).resolves.toEqual({ a: 1 });
  });

  it('getByCategory parses rows', async () => {
    ConfigurationRepository.getByCategory.mockResolvedValue([
      { cle: 'n', valeur: '1.5', type: 'number' },
      { cle: 'b', valeur: 'true', type: 'boolean' },
      { cle: 'j', valeur: '{"k":2}', type: 'json' },
      { cle: 's', valeur: 'raw', type: 'string' },
    ]);

    await expect(ConfigService.getByCategory('cat')).resolves.toEqual({
      n: 1.5,
      b: true,
      j: { k: 2 },
      s: 'raw',
    });
  });

  it('set invalidates cache when update succeeds', async () => {
    ConfigurationRepository.getByKey.mockResolvedValue({ valeur: '1', type: 'number' });
    ConfigurationRepository.update.mockResolvedValue({ cle: 'k' });

    await ConfigService.get('k');
    await ConfigService.set('k', 2, 'desc');
    await ConfigService.get('k');

    expect(ConfigurationRepository.update).toHaveBeenCalledWith('k', { valeur: '2', description: 'desc' });
    expect(ConfigurationRepository.getByKey).toHaveBeenCalledTimes(2);
  });

  it('getAll formats metadata object', async () => {
    ConfigurationRepository.getAll.mockResolvedValue([
      {
        cle: 'k',
        valeur: 'false',
        type: 'boolean',
        description: 'd',
        categorie: 'c',
        est_modifiable: true,
        updated_at: 'now',
      },
    ]);

    await expect(ConfigService.getAll()).resolves.toEqual({
      k: {
        value: false,
        type: 'boolean',
        description: 'd',
        categorie: 'c',
        modifiable: true,
        updatedAt: 'now',
      },
    });
  });

  it('returns defaults for config groups', async () => {
    const spy = jest.spyOn(ConfigService, 'get').mockResolvedValue(null);

    await expect(ConfigService.getJwtConfig()).resolves.toEqual({
      accessTokenExpiration: '24h',
      refreshTokenExpiration: '168h',
    });

    await expect(ConfigService.getSecurityConfig()).resolves.toEqual({
      bcryptRounds: 10,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
    });

    await expect(ConfigService.getSessionConfig()).resolves.toEqual({
      maxConcurrentSessions: 3,
      tokenExpirationHours: 168,
    });

    await expect(ConfigService.getRateLimitConfig()).resolves.toEqual({
      windowMs: 60000,
      maxRequests: 100,
      authWindowMs: 900000,
      authMaxAttempts: 5,
    });

    await expect(ConfigService.getUploadConfig()).resolves.toEqual({
      maxFileSizeMb: 5,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      maxFilesPerRequest: 5,
    });

    spy.mockRestore();
  });
});
