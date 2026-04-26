import { jest } from '@jest/globals';

const mockClient = {
  on: jest.fn(),
  connect: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  quit: jest.fn()
};

const mockCreateClient = jest.fn(() => mockClient);

jest.unstable_mockModule('redis', () => ({
  createClient: mockCreateClient
}));

jest.unstable_mockModule('../../src/middleware/logger.js', () => ({
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  },
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

const { default: cacheService } = await import('../../src/services/cacheService.js');

describe('cacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.client = null;
    cacheService.isConnected = false;
  });

  it('connect should initialize redis client', async () => {
    mockClient.connect.mockResolvedValue();

    await cacheService.connect();

    expect(mockCreateClient).toHaveBeenCalled();
    expect(mockClient.on).toHaveBeenCalled();
    expect(mockClient.connect).toHaveBeenCalled();
  });

  it('connect should swallow redis connection errors', async () => {
    mockClient.connect.mockRejectedValue(new Error('redis down'));

    await cacheService.connect();

    expect(cacheService.isConnected).toBe(false);
  });

  it('get should return null when disconnected', async () => {
    const result = await cacheService.get('k0');

    expect(result).toBeNull();
  });

  it('get should parse json value when connected', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.get.mockResolvedValue('{"ok":true}');

    const result = await cacheService.get('k1');

    expect(result).toEqual({ ok: true });
  });

  it('get should return null when parsing fails', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.get.mockResolvedValue('bad-json');

    const result = await cacheService.get('k1');

    expect(result).toBeNull();
  });

  it('set and del should return false when disconnected', async () => {
    const setResult = await cacheService.set('k', { a: 1 }, 60);
    const delResult = await cacheService.del('k');

    expect(setResult).toBe(false);
    expect(delResult).toBe(false);
  });

  it('set should return true when connected', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.setEx.mockResolvedValue('OK');

    const result = await cacheService.set('k2', { a: 1 }, 20);

    expect(result).toBe(true);
    expect(mockClient.setEx).toHaveBeenCalledWith('k2', 20, JSON.stringify({ a: 1 }));
  });

  it('set should return false on redis error', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.setEx.mockRejectedValue(new Error('set failed'));

    const result = await cacheService.set('k2', { a: 1 }, 20);

    expect(result).toBe(false);
  });

  it('del should return true when connected', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.del.mockResolvedValue(1);

    const result = await cacheService.del('k3');

    expect(result).toBe(true);
    expect(mockClient.del).toHaveBeenCalledWith('k3');
  });

  it('del should return false on redis error', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.del.mockRejectedValue(new Error('del failed'));

    const result = await cacheService.del('k3');

    expect(result).toBe(false);
  });

  it('invalidatePattern should delete matching keys', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.keys.mockResolvedValue(['a', 'b']);
    mockClient.del.mockResolvedValue(2);

    const result = await cacheService.invalidatePattern('stats:*');

    expect(result).toBe(true);
    expect(mockClient.del).toHaveBeenCalledWith(['a', 'b']);
  });

  it('invalidatePattern should return true when no keys match', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.keys.mockResolvedValue([]);

    const result = await cacheService.invalidatePattern('none:*');

    expect(result).toBe(true);
    expect(mockClient.del).not.toHaveBeenCalled();
  });

  it('invalidatePattern should return false on redis error', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.keys.mockRejectedValue(new Error('keys failed'));

    const result = await cacheService.invalidatePattern('none:*');

    expect(result).toBe(false);
  });

  it('getOrSet should return cached payload when available', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.get.mockResolvedValue('{"cached":1}');

    const result = await cacheService.getOrSet('key', async () => ({ fresh: 1 }), 120);

    expect(result).toEqual({ data: { cached: 1 }, fromCache: true });
  });

  it('getOrSet should fetch and cache when cache miss occurs', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.get.mockResolvedValue(null);
    mockClient.setEx.mockResolvedValue('OK');

    const result = await cacheService.getOrSet('key', async () => ({ fresh: 1 }), 120);

    expect(result).toEqual({ data: { fresh: 1 }, fromCache: false });
    expect(mockClient.setEx).toHaveBeenCalled();
  });

  it('getOrSet should not cache falsy payload', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.get.mockResolvedValue(null);

    const result = await cacheService.getOrSet('key', async () => null, 120);

    expect(result).toEqual({ data: null, fromCache: false });
    expect(mockClient.setEx).not.toHaveBeenCalled();
  });

  it('close should quit client and update state', async () => {
    cacheService.client = mockClient;
    cacheService.isConnected = true;
    mockClient.quit.mockResolvedValue();

    await cacheService.close();

    expect(mockClient.quit).toHaveBeenCalled();
    expect(cacheService.isConnected).toBe(false);
  });

  it('close should no-op when client is absent', async () => {
    cacheService.client = null;
    cacheService.isConnected = false;

    await cacheService.close();

    expect(cacheService.isConnected).toBe(false);
  });
});