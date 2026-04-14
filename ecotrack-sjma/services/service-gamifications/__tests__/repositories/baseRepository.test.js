import { jest } from '@jest/globals';

describe('BaseRepository', () => {
  const originalEnv = { ...process.env };

  const loadModule = async ({ shouldConnectFail = false } = {}) => {
    jest.resetModules();

    const logger = {
      error: jest.fn(),
      info: jest.fn()
    };

    const mockPool = {
      query: jest.fn(async (sql) => {
        if (sql === 'SELECT 1' && shouldConnectFail) {
          throw new Error('connect failed');
        }
        return { rows: [] };
      })
    };

    const MockPool = jest.fn(() => mockPool);

    jest.unstable_mockModule('pg', () => ({
      default: { Pool: MockPool }
    }));

    jest.unstable_mockModule('../../src/utils/logger.js', () => ({
      default: logger
    }));

    const mod = await import('../../src/repositories/baseRepository.js');
    return { BaseRepository: mod.default, mockPool, MockPool, logger };
  };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('connect initializes pool with environment settings', async () => {
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5433';
    process.env.DB_NAME = 'eco';
    process.env.DB_USER = 'user';
    process.env.DB_PASSWORD = 'pass';

    const { BaseRepository, MockPool } = await loadModule();
    const repo = new BaseRepository();
    await repo.connect();

    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        port: '5433',
        database: 'eco',
        user: 'user',
        password: 'pass',
        max: 10,
        idleTimeoutMillis: 30000
      })
    );
    expect(repo.isConnected).toBe(true);
  });

  it('query triggers lazy connect when disconnected', async () => {
    const { BaseRepository, mockPool } = await loadModule();
    const repo = new BaseRepository();

    await repo.query('SELECT * FROM x', [1]);

    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1');
    expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM x', [1]);
  });

  it('connect is idempotent when pool already exists', async () => {
    const { BaseRepository, mockPool } = await loadModule();
    const repo = new BaseRepository();

    await repo.connect();
    mockPool.query.mockClear();

    await repo.connect();
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('logs and throws when initial connection fails', async () => {
    const { BaseRepository, logger } = await loadModule({ shouldConnectFail: true });
    const repo = new BaseRepository();

    await expect(repo.connect()).rejects.toThrow('connect failed');
    expect(logger.error).toHaveBeenCalled();
  });
});
