describe('config/database', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('creates pool with env URL and wires event handlers', async () => {
    const on = jest.fn();
    const query = jest.fn();
    const poolInstance = { on, query };
    const Pool = jest.fn(() => poolInstance);
    const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

    jest.doMock('pg', () => ({ __esModule: true, default: { Pool } }));
    jest.doMock('../../src/config/env.js', () => ({ __esModule: true, default: { databaseUrl: 'postgres://test' } }));
    jest.doMock('../../src/utils/logger.js', () => ({ __esModule: true, default: logger }));

    const mod = await import('../../src/config/database.js');

    expect(Pool).toHaveBeenCalledWith({ connectionString: 'postgres://test' });
    expect(on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mod.default).toBe(poolInstance);
  });

  it('ensureAuthTables skips bootstrap when utilisateur table missing', async () => {
    const on = jest.fn();
    const query = jest.fn().mockResolvedValueOnce({ rowCount: 0 });
    const poolInstance = { on, query };
    const Pool = jest.fn(() => poolInstance);
    const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

    jest.doMock('pg', () => ({ __esModule: true, default: { Pool } }));
    jest.doMock('../../src/config/env.js', () => ({ __esModule: true, default: { databaseUrl: 'postgres://test' } }));
    jest.doMock('../../src/utils/logger.js', () => ({ __esModule: true, default: logger }));

    const mod = await import('../../src/config/database.js');
    await mod.ensureAuthTables();

    expect(logger.warn).toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('ensureAuthTables runs sequence sync and table/index creation', async () => {
    const on = jest.fn();
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ is_identity: 'NO' }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ seq: 'public.utilisateur_id_utilisateur_seq' }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const poolInstance = { on, query };
    const Pool = jest.fn(() => poolInstance);

    jest.doMock('pg', () => ({ __esModule: true, default: { Pool } }));
    jest.doMock('../../src/config/env.js', () => ({ __esModule: true, default: { databaseUrl: 'postgres://test' } }));
    jest.doMock('../../src/utils/logger.js', () => ({ __esModule: true, default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

    const mod = await import('../../src/config/database.js');
    await mod.ensureAuthTables();

    expect(query).toHaveBeenCalled();
    expect(query.mock.calls.some((c) => String(c[0]).includes('CREATE TABLE IF NOT EXISTS refresh_tokens'))).toBe(true);
    expect(query.mock.calls.some((c) => String(c[0]).includes('idx_refresh_tokens_user_token'))).toBe(true);
  });

  it('ensureAuthTables ignores identity-sync errors and still creates refresh token schema', async () => {
    const on = jest.fn();
    const query = jest.fn();
    query.mockResolvedValueOnce({ rowCount: 1 });
    query.mockRejectedValueOnce(new Error('identity query fail'));
    query.mockResolvedValueOnce({});
    query.mockResolvedValueOnce({});
    query.mockResolvedValueOnce({});

    const poolInstance = { on, query };
    const Pool = jest.fn(() => poolInstance);

    jest.doMock('pg', () => ({ __esModule: true, default: { Pool } }));
    jest.doMock('../../src/config/env.js', () => ({ __esModule: true, default: { databaseUrl: 'postgres://test' } }));
    jest.doMock('../../src/utils/logger.js', () => ({ __esModule: true, default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

    const mod = await import('../../src/config/database.js');
    await mod.ensureAuthTables();

    expect(query.mock.calls.some((c) => String(c[0]).includes('CREATE TABLE IF NOT EXISTS refresh_tokens'))).toBe(true);
  });
});
