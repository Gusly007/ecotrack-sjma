jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const logger = require('../../../src/utils/logger');

function createRes() {
  return {
    json: jest.fn().mockReturnThis()
  };
}

describe('cacheMiddleware', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('returns next when redis is unavailable', async () => {
    jest.doMock('redis', () => ({
      createClient: jest.fn(() => ({
        on: jest.fn(),
        connect: jest.fn(() => Promise.resolve()),
        isOpen: false
      }))
    }));

    const { cacheMiddleware } = require('../../../src/middleware/cacheMiddleware');
    const req = { originalUrl: '/a' };
    const res = createRes();
    const next = jest.fn();

    await cacheMiddleware()(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('serves cached payload and clears invalid cache entries', async () => {
    const client = {
      on: jest.fn(),
      connect: jest.fn(() => Promise.resolve()),
      isOpen: true,
      get: jest.fn().mockResolvedValueOnce(JSON.stringify({ success: true })),
      del: jest.fn(),
      setEx: jest.fn(),
      keys: jest.fn(),
    };
    jest.doMock('redis', () => ({ createClient: jest.fn(() => client) }));
    const { cacheMiddleware, initRedis } = require('../../../src/middleware/cacheMiddleware');
    initRedis();

    const req = { originalUrl: '/cached' };
    const res = createRes();
    const next = jest.fn();

    await cacheMiddleware()(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();

    client.get.mockResolvedValueOnce('invalid json');
    await cacheMiddleware()(req, res, next);
    expect(client.del).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('caches successful responses and clears matching keys', async () => {
    const client = {
      on: jest.fn(),
      connect: jest.fn(() => Promise.resolve()),
      isOpen: true,
      get: jest.fn().mockResolvedValueOnce(null),
      del: jest.fn(),
      setEx: jest.fn(() => Promise.resolve()),
      keys: jest.fn().mockResolvedValueOnce(['cache:/x', 'cache:/y'])
    };
    jest.doMock('redis', () => ({ createClient: jest.fn(() => client) }));
    const { cacheMiddleware, clearCache, initRedis } = require('../../../src/middleware/cacheMiddleware');
    initRedis();

    const req = { originalUrl: '/store' };
    const res = createRes();
    const next = jest.fn();
    await cacheMiddleware(60)(req, res, next);
    res.json({ success: true });
    expect(client.setEx).toHaveBeenCalled();

    await clearCache('*');
    expect(client.del).toHaveBeenCalled();
  });
});



