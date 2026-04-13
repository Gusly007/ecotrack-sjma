describe('CacheService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadService({ connectImpl, clientOverrides = {}, nodeCacheOverrides = {} } = {}) {
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    const handlers = {};
    const client = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      connect: jest.fn(connectImpl || (async () => undefined)),
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      quit: jest.fn(),
      ...clientOverrides
    };

    const nodeCacheInstance = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(() => []),
      flushAll: jest.fn(),
      getStats: jest.fn(() => ({ hits: 1, misses: 0, keys: 1 })),
      ...nodeCacheOverrides
    };

    jest.doMock('../../../src/utils/logger', () => logger);
    jest.doMock('redis', () => ({ createClient: jest.fn(() => client) }));
    jest.doMock('node-cache', () => jest.fn(() => nodeCacheInstance));

    const cacheService = require('../../../src/services/cacheService');
    return { cacheService, logger, client, handlers, nodeCacheInstance };
  }

  test('connect uses redis and sets connection state', async () => {
    process.env.REDIS_HOST = 'redis.local';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_PASSWORD = 'secret';

    const { cacheService, client, handlers, logger } = loadService();
    await cacheService.connect();

    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(client.on).toHaveBeenCalledWith('connect', expect.any(Function));
    handlers.connect();
    expect(logger.info).toHaveBeenCalledWith({ redisHost: 'redis.local', redisPort: '6380' }, 'Redis connected');
    expect(cacheService.isConnected).toBe(true);
  });

  test('connect falls back to NodeCache on redis failure', async () => {
    const { cacheService, logger, nodeCacheInstance } = loadService({
      connectImpl: async () => {
        throw new Error('redis down');
      }
    });

    await cacheService.connect();

    expect(logger.warn).toHaveBeenCalledWith(
      { err: 'redis down' },
      'Redis connection failed, using in-memory fallback'
    );
    expect(cacheService.isConnected).toBe(false);
    expect(nodeCacheInstance).toBeDefined();
  });

  test('get/set/del/invalidatePattern use redis when connected', async () => {
    const { cacheService, client, logger } = loadService();
    cacheService.client = client;
    cacheService.isConnected = true;

    client.get.mockResolvedValueOnce(JSON.stringify({ ok: true }));
    await expect(cacheService.get('key')).resolves.toEqual({ ok: true });

    client.get.mockRejectedValueOnce(new Error('bad get'));
    await expect(cacheService.get('key')).resolves.toBeNull();
    expect(logger.error).toHaveBeenCalledWith({ err: 'bad get', key: 'key' }, 'Redis GET error');

    client.setEx.mockResolvedValueOnce(undefined);
    await expect(cacheService.set('key', { ok: true }, 60)).resolves.toBe(true);

    client.setEx.mockRejectedValueOnce(new Error('bad set'));
    await expect(cacheService.set('key', { ok: true }, 60)).resolves.toBe(false);

    client.del.mockResolvedValueOnce(undefined);
    await expect(cacheService.del('key')).resolves.toBe(true);

    client.del.mockRejectedValueOnce(new Error('bad del'));
    await expect(cacheService.del('key')).resolves.toBe(false);

    client.keys.mockResolvedValueOnce(['a:1', 'a:2']);
    client.del.mockResolvedValueOnce(undefined);
    await expect(cacheService.invalidatePattern('a:*')).resolves.toBe(true);

    client.keys.mockRejectedValueOnce(new Error('bad keys'));
    await expect(cacheService.invalidatePattern('a:*')).resolves.toBe(false);
  });

  test('fallback cache supports get/set/del/invalidatePattern and stats', async () => {
    const { cacheService, nodeCacheInstance, logger } = loadService();
    cacheService.fallbackCache = nodeCacheInstance;

    nodeCacheInstance.get.mockReturnValueOnce({ ok: true });
    await expect(cacheService.get('key')).resolves.toEqual({ ok: true });

    await expect(cacheService.set('key', { ok: true }, 15)).resolves.toBe(true);
    expect(nodeCacheInstance.set).toHaveBeenCalledWith('key', { ok: true }, 15);

    await expect(cacheService.del('key')).resolves.toBe(true);
    expect(nodeCacheInstance.del).toHaveBeenCalledWith('key');

    nodeCacheInstance.keys.mockReturnValueOnce(['user:1', 'user:2', 'post:1']);
    await expect(cacheService.invalidatePattern('user:*')).resolves.toBe(true);
    expect(nodeCacheInstance.del).toHaveBeenCalledWith('user:1');
    expect(nodeCacheInstance.del).toHaveBeenCalledWith('user:2');

    expect(cacheService.getStats()).toEqual({ hits: 1, misses: 0, keys: 1 });
    cacheService.clear();
    expect(nodeCacheInstance.flushAll).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Cache cleared');
  });

  test('getOrSet returns cached data or fetches and stores new data', async () => {
    const { cacheService } = loadService();
    jest.spyOn(cacheService, 'get').mockResolvedValueOnce({ cached: true });
    await expect(cacheService.getOrSet('k', jest.fn())).resolves.toEqual({ data: { cached: true }, fromCache: true });

    const fetchFn = jest.fn().mockResolvedValue({ fresh: true });
    jest.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    jest.spyOn(cacheService, 'set').mockResolvedValue(true);
    await expect(cacheService.getOrSet('k', fetchFn, 30)).resolves.toEqual({ data: { fresh: true }, fromCache: false });
    expect(fetchFn).toHaveBeenCalled();
  });

  test('close quits redis client', async () => {
    const { cacheService, client } = loadService();
    cacheService.client = client;
    cacheService.isConnected = true;

    await expect(cacheService.close()).resolves.toBeUndefined();
    expect(client.quit).toHaveBeenCalled();
    expect(cacheService.isConnected).toBe(false);
  });
});



