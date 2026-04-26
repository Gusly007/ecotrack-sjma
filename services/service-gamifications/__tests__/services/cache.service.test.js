import { jest } from '@jest/globals';

describe('cacheService', () => {
  const loadService = async ({ failConnect = false } = {}) => {
    jest.resetModules();

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    const handlers = {};
    const client = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      connect: failConnect ? jest.fn().mockRejectedValue(new Error('redis down')) : jest.fn().mockResolvedValue(),
      get: jest.fn(),
      setEx: jest.fn().mockResolvedValue(),
      del: jest.fn().mockResolvedValue(),
      keys: jest.fn().mockResolvedValue([]),
      quit: jest.fn().mockResolvedValue()
    };

    const createClient = jest.fn(() => client);

    jest.unstable_mockModule('redis', () => ({ createClient }));
    jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: logger }));

    const mod = await import('../../src/services/cacheService.js');
    return { cacheService: mod.default, client, handlers, logger, createClient };
  };

  it('connect configures redis client and marks connected on connect event', async () => {
    const { cacheService, handlers, createClient } = await loadService();

    await cacheService.connect();
    handlers.connect();

    expect(createClient).toHaveBeenCalled();
    expect(cacheService.isConnected).toBe(true);
  });

  it('connect handles connection failure without throwing', async () => {
    const { cacheService, logger } = await loadService({ failConnect: true });
    await expect(cacheService.connect()).resolves.toBeUndefined();
    expect(cacheService.isConnected).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('get returns parsed JSON payload', async () => {
    const { cacheService, client, handlers } = await loadService();
    await cacheService.connect();
    handlers.connect();
    client.get.mockResolvedValue('{"x":1}');

    const value = await cacheService.get('k1');
    expect(value).toEqual({ x: 1 });
  });

  it('set stores serialized payload', async () => {
    const { cacheService, client, handlers } = await loadService();
    await cacheService.connect();
    handlers.connect();

    const ok = await cacheService.set('k2', { a: 2 }, 42);
    expect(ok).toBe(true);
    expect(client.setEx).toHaveBeenCalledWith('k2', 42, '{"a":2}');
  });

  it('invalidatePattern deletes matching keys', async () => {
    const { cacheService, client, handlers } = await loadService();
    await cacheService.connect();
    handlers.connect();
    client.keys.mockResolvedValue(['a', 'b']);

    const ok = await cacheService.invalidatePattern('x:*');
    expect(ok).toBe(true);
    expect(client.del).toHaveBeenCalledWith(['a', 'b']);
  });

  it('getOrSet returns cached value when present', async () => {
    const { cacheService, client, handlers } = await loadService();
    await cacheService.connect();
    handlers.connect();
    client.get.mockResolvedValue('{"cached":true}');

    const result = await cacheService.getOrSet('k', async () => ({ fresh: true }));
    expect(result).toEqual({ data: { cached: true }, fromCache: true });
  });

  it('getOrSet stores fetched value when cache miss', async () => {
    const { cacheService, client, handlers } = await loadService();
    await cacheService.connect();
    handlers.connect();
    client.get.mockResolvedValue(null);

    const result = await cacheService.getOrSet('k', async () => ({ fresh: true }), 10);
    expect(result).toEqual({ data: { fresh: true }, fromCache: false });
    expect(client.setEx).toHaveBeenCalledWith('k', 10, '{"fresh":true}');
  });
});
