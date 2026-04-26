jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

jest.mock('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { createClient } from 'redis';
import cacheService from '../../src/services/cacheService.js';

describe('cacheService', () => {
  let mockClient;
  let handlers;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = {};

    mockClient = {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
    };

    createClient.mockReturnValue(mockClient);

    cacheService.client = null;
    cacheService.isConnected = false;
  });

  it('connect initializes redis client and marks connected on events', async () => {
    await cacheService.connect();

    expect(createClient).toHaveBeenCalled();
    expect(mockClient.on).toHaveBeenCalled();

    handlers.connect();
    expect(cacheService.isConnected).toBe(true);

    handlers.error(new Error('boom'));
    expect(cacheService.isConnected).toBe(false);

    handlers.ready();
    expect(cacheService.isConnected).toBe(true);
  });

  it('connect handles connection failure gracefully', async () => {
    mockClient.connect.mockRejectedValueOnce(new Error('redis down'));

    await cacheService.connect();

    expect(cacheService.isConnected).toBe(false);
  });

  it('get returns null when disconnected or parsing fails', async () => {
    await expect(cacheService.get('k')).resolves.toBeNull();

    cacheService.client = mockClient;
    cacheService.isConnected = true;

    mockClient.get.mockResolvedValue('{bad json');
    await expect(cacheService.get('k')).resolves.toBeNull();
  });

  it('get returns parsed payload when cache has value', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.get.mockResolvedValue('{"x":1}');

    await expect(cacheService.get('k')).resolves.toEqual({ x: 1 });
  });

  it('set and del return booleans based on success', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;

    mockClient.setEx.mockResolvedValue(undefined);
    await expect(cacheService.set('k', { x: 1 }, 10)).resolves.toBe(true);

    mockClient.del.mockResolvedValue(undefined);
    await expect(cacheService.del('k')).resolves.toBe(true);

    mockClient.setEx.mockRejectedValueOnce(new Error('set failed'));
    await expect(cacheService.set('k', { x: 1 }, 10)).resolves.toBe(false);

    mockClient.del.mockRejectedValueOnce(new Error('del failed'));
    await expect(cacheService.del('k')).resolves.toBe(false);
  });

  it('invalidatePattern deletes keys and handles errors', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;

    mockClient.keys.mockResolvedValueOnce(['a', 'b']);
    mockClient.del.mockResolvedValueOnce(2);
    await expect(cacheService.invalidatePattern('user:*')).resolves.toBe(true);

    mockClient.keys.mockResolvedValueOnce([]);
    await expect(cacheService.invalidatePattern('empty:*')).resolves.toBe(true);

    mockClient.keys.mockRejectedValueOnce(new Error('keys failed'));
    await expect(cacheService.invalidatePattern('oops:*')).resolves.toBe(false);
  });

  it('getOrSet returns cache hit or fetched data', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;

    mockClient.get.mockResolvedValueOnce('{"cached":true}');
    const cached = await cacheService.getOrSet('k', async () => ({ fromDb: true }));
    expect(cached).toEqual({ data: { cached: true }, fromCache: true });

    mockClient.get.mockResolvedValueOnce(null);
    mockClient.setEx.mockResolvedValueOnce(undefined);
    const miss = await cacheService.getOrSet('k2', async () => ({ fromDb: true }));
    expect(miss).toEqual({ data: { fromDb: true }, fromCache: false });

    mockClient.get.mockResolvedValueOnce(null);
    const empty = await cacheService.getOrSet('k3', async () => null);
    expect(empty).toEqual({ data: null, fromCache: false });
  });

  it('close quits client and marks disconnected', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;

    await cacheService.close();

    expect(mockClient.quit).toHaveBeenCalled();
    expect(cacheService.isConnected).toBe(false);
  });
});
