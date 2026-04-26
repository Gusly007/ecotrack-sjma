describe('db/connexion', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.JEST_WORKER_ID;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadConnexion({ queryImpl } = {}) {
    const handlers = {};
    const poolInstance = {
      query: jest.fn(queryImpl || (async () => ({ rows: [{ now: '2025-01-01T00:00:00.000Z' }] }))),
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      })
    };

    jest.doMock('dotenv', () => ({
      config: jest.fn()
    }));

    jest.doMock('pg', () => ({
      Pool: jest.fn(() => poolInstance)
    }));

    const logger = {
      info: jest.fn(),
      error: jest.fn()
    };

    jest.doMock('../../../src/utils/logger', () => logger);

    const module = require('../../../src/db/connexion');
    const pg = require('pg');

    return { module, pg, poolInstance, handlers, logger };
  }

  test('builds pool with environment defaults and exposes query helper', async () => {
    process.env.PGPORT = '5433';
    process.env.PGHOST = 'db.local';
    process.env.PGUSER = 'eco';
    process.env.PGDATABASE = 'eco_track';
    process.env.PGPASSWORD = 'secret';

    const { module, pg, poolInstance } = loadConnexion();

    expect(pg.Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'db.local',
        port: 5433,
        user: 'eco',
        database: 'eco_track',
        password: 'secret',
        max: 10,
        idleTimeoutMillis: 30000
      })
    );

    await module.query('SELECT 1', ['a']);
    expect(poolInstance.query).toHaveBeenCalledWith('SELECT 1', ['a']);
  });

  test('testConnection returns true and logs info on success', async () => {
    const { module, logger } = loadConnexion({
      queryImpl: async () => ({ rows: [{ now: '2025-01-01T10:00:00.000Z' }] })
    });

    const ok = await module.testConnection();

    expect(ok).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      { time: '2025-01-01T10:00:00.000Z' },
      'Postgres connected'
    );
  });

  test('testConnection returns false and logs error on failure', async () => {
    const dbError = new Error('db down');
    const { module, logger } = loadConnexion({
      queryImpl: async () => {
        throw dbError;
      }
    });

    const ok = await module.testConnection();

    expect(ok).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      { error: dbError },
      'Postgres connection error'
    );
  });

  test('pool error handler logs and exits process', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
    const { handlers, logger } = loadConnexion();

    const idleErr = new Error('idle client error');
    handlers.error(idleErr);

    expect(logger.error).toHaveBeenCalledWith(
      { error: idleErr },
      'Unexpected error on idle PostgreSQL client'
    );
    expect(exitSpy).toHaveBeenCalledWith(-1);
    exitSpy.mockRestore();
  });
});
