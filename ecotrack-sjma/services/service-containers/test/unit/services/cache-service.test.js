const redis = require('redis');
const cacheService = require('../../../src/services/cacheService');
const logger = require('../../../src/utils/logger');

jest.mock('redis', () => ({
  createClient: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('cacheService', () => {
  let client;
  let handlers;

  beforeEach(() => {
    handlers = {};
    client = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      connect: jest.fn().mockResolvedValue(),
      get: jest.fn(),
      setEx: jest.fn().mockResolvedValue(),
      del: jest.fn().mockResolvedValue(),
      keys: jest.fn().mockResolvedValue([]),
      quit: jest.fn().mockResolvedValue()
    };

    redis.createClient.mockReturnValue(client);
    cacheService.client = null;
    cacheService.isConnected = false;
    jest.clearAllMocks();
  });

  it('connect initializes client and marks connected via events', async () => {
    await cacheService.connect();
    handlers.connect();
    handlers.ready();

    expect(redis.createClient).toHaveBeenCalled();
    expect(cacheService.isConnected).toBe(true);
  });

  it('connect handles failure without throwing', async () => {
    client.connect.mockRejectedValueOnce(new Error('redis down'));
    await expect(cacheService.connect()).resolves.toBeUndefined();
    expect(cacheService.isConnected).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('get returns parsed JSON value', async () => {
    await cacheService.connect();
    handlers.connect();
    client.get.mockResolvedValue('{"x":1}');

    const value = await cacheService.get('k1');
    expect(value).toEqual({ x: 1 });
  });

  it('set and del return true on success', async () => {
    await cacheService.connect();
    handlers.connect();

    const setOk = await cacheService.set('k2', { a: 2 }, 10);
    const delOk = await cacheService.del('k2');

    expect(setOk).toBe(true);
    expect(client.setEx).toHaveBeenCalledWith('k2', 10, '{"a":2}');
    expect(delOk).toBe(true);
  });

  it('invalidatePattern deletes matched keys', async () => {
    await cacheService.connect();
    handlers.connect();
    client.keys.mockResolvedValue(['a', 'b']);

    const ok = await cacheService.invalidatePattern('z:*');

    expect(ok).toBe(true);
    expect(client.del).toHaveBeenCalledWith(['a', 'b']);
  });

  it('getOrSet returns cache hit and miss paths', async () => {
    await cacheService.connect();
    handlers.connect();

    client.get.mockResolvedValueOnce('{"cached":true}');
    const hit = await cacheService.getOrSet('k', async () => ({ fresh: true }), 5);
    expect(hit).toEqual({ data: { cached: true }, fromCache: true });

    client.get.mockResolvedValueOnce(null);
    const miss = await cacheService.getOrSet('k', async () => ({ fresh: true }), 5);
    expect(miss).toEqual({ data: { fresh: true }, fromCache: false });
  });

  it('close quits client and resets state', async () => {
    await cacheService.connect();
    handlers.connect();

    await cacheService.close();

    expect(client.quit).toHaveBeenCalled();
    expect(cacheService.isConnected).toBe(false);
  });
});
