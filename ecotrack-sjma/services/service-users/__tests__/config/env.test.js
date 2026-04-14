describe('config/env', () => {
  const baseEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...baseEnv };
  });

  afterAll(() => {
    process.env = baseEnv;
  });

  const mockConfigRepo = (rows) => {
    jest.doMock('../../src/repositories/configuration.repository.js', () => ({
      __esModule: true,
      default: {},
      ConfigurationRepository: {
        getAll: jest.fn().mockResolvedValue(rows),
      },
    }));
  };

  it('loads DB config and maps getter values', async () => {
    process.env.PORT = '9999';
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_REFRESH_SECRET = 'refresh';
    process.env.DATABASE_URL = 'postgres://db';

    mockConfigRepo([
      { cle: 'rate_limit.window_ms', type: 'number', valeur: '120000' },
      { cle: 'rate_limit.max_requests', type: 'number', valeur: '200' },
      { cle: 'jwt.access_token_expiration', type: 'string', valeur: '12h' },
      { cle: 'upload.allowed_extensions', type: 'json', valeur: '["png","webp"]' },
      { cle: 'security.bcrypt_rounds', type: 'number', valeur: '12' },
    ]);

    const mod = await import('../../src/config/env.js');
    const env = mod.default;

    await mod.loadDbConfig();

    expect(env.port).toBe(9999);
    expect(env.rateLimit.windowMs).toBe(120000);
    expect(env.rateLimit.maxRequests).toBe(200);
    expect(env.jwt.expiresIn).toBe('12h');
    expect(env.upload.allowedExtensions).toEqual(['png', 'webp']);
    expect(env.security.bcryptRounds).toBe(12);
  });

  it('falls back to process env/defaults and validates missing required vars', async () => {
    process.env.PORT = 'bad';
    process.env.RATE_LIMIT_WINDOW_MS = '70';
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.BCRYPT_ROUNDS = '11';
    process.env.RATE_LIMIT_PASSWORD_RESET_MINUTES = '30';
    process.env.JWT_SECRET = '';
    process.env.JWT_REFRESH_SECRET = '';
    process.env.DATABASE_URL = '';

    mockConfigRepo([]);

    const mod = await import('../../src/config/env.js');
    const env = mod.default;

    await mod.loadDbConfig();

    expect(env.port).toBe(3010);
    expect(env.rateLimit.windowMs).toBe(70);
    expect(env.rateLimit.passwordResetWindowMs).toBe(30 * 60 * 1000);
    expect(env.jwt.expiresIn).toBe('24h');
    expect(env.security.bcryptRounds).toBe(11);

    expect(() => mod.validateEnv()).toThrow('Missing required environment variables');
  });

  it('refreshDbConfig reloads values and handles loader failures', async () => {
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_REFRESH_SECRET = 'refresh';
    process.env.DATABASE_URL = 'postgres://db';

    const getAll = jest
      .fn()
      .mockResolvedValueOnce([{ cle: 'session.max_concurrent_sessions', type: 'number', valeur: '4' }])
      .mockResolvedValueOnce([{ cle: 'session.max_concurrent_sessions', type: 'number', valeur: '7' }])
      .mockRejectedValueOnce(new Error('db down'));

    jest.doMock('../../src/repositories/configuration.repository.js', () => ({
      __esModule: true,
      default: {},
      ConfigurationRepository: { getAll },
    }));

    const mod = await import('../../src/config/env.js');
    const env = mod.default;

    await mod.loadDbConfig();
    expect(env.session.maxConcurrentSessions).toBe(4);

    await env.refreshDbConfig();
    expect(env.session.maxConcurrentSessions).toBe(7);

    await env.refreshDbConfig();
    expect(env.session.maxConcurrentSessions).toBe(3);

    expect(() => mod.validateEnv()).not.toThrow();
  });
});
