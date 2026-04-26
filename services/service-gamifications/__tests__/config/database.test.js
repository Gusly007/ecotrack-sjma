/**
 * Database Config Tests
 */
import { jest } from '@jest/globals';

describe('Database Configuration', () => {
  const originalEnv = { ...process.env };

  const loadDatabaseModule = async ({ autoSchema, nodeEnv = 'test', queryImpl } = {}) => {
    jest.resetModules();
    process.env.NODE_ENV = nodeEnv;

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };

    const handlers = {};
    const mockPool = {
      query: queryImpl || jest.fn().mockResolvedValue({ rows: [] }),
      on: jest.fn((event, callback) => {
        handlers[event] = callback;
      })
    };

    const MockPool = jest.fn(() => mockPool);

    jest.unstable_mockModule('pg', () => ({
      default: { Pool: MockPool }
    }));

    jest.unstable_mockModule('../../src/config/env.js', () => ({
      default: {
        databaseUrl: 'postgresql://localhost/test',
        autoSchema: Boolean(autoSchema)
      }
    }));

    jest.unstable_mockModule('../../src/utils/logger.js', () => ({
      default: mockLogger
    }));

    const module = await import('../../src/config/database.js');
    return { ...module, mockPool, handlers, mockLogger };
  };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('checks required tables when autoSchema is disabled', async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [{ table_name: 'utilisateur' }]
    });
    const { ensureGamificationTables } = await loadDatabaseModule({
      autoSchema: false,
      queryImpl: query
    });

    await expect(ensureGamificationTables()).rejects.toThrow(/Missing tables/);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('passes table verification when all required tables exist', async () => {
    const tableRows = [
      'utilisateur',
      'badge',
      'user_badge',
      'historique_points',
      'notification',
      'gamification_defi',
      'gamification_participation_defi'
    ].map((table_name) => ({ table_name }));

    const query = jest.fn().mockResolvedValue({ rows: tableRows });
    const { ensureGamificationTables } = await loadDatabaseModule({
      autoSchema: false,
      queryImpl: query
    });

    await expect(ensureGamificationTables()).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('creates schema objects when autoSchema is enabled', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const { ensureGamificationTables } = await loadDatabaseModule({
      autoSchema: true,
      queryImpl: query
    });

    await expect(ensureGamificationTables()).resolves.toBeUndefined();
    expect(query).toHaveBeenCalled();
    const firstSql = query.mock.calls[0][0];
    expect(firstSql).toContain('CREATE TABLE IF NOT EXISTS utilisateur');
  });

  it('ignores duplicate object errors during auto schema creation', async () => {
    const query = jest
      .fn()
      .mockRejectedValueOnce(new Error('relation "badge" already exists'))
      .mockResolvedValue({ rows: [] });

    const { ensureGamificationTables } = await loadDatabaseModule({
      autoSchema: true,
      queryImpl: query
    });

    await expect(ensureGamificationTables()).resolves.toBeUndefined();
  });

  it('rethrows non-duplicate SQL errors', async () => {
    const query = jest
      .fn()
      .mockRejectedValueOnce(new Error('syntax error at or near "CREATE"'));

    const { ensureGamificationTables } = await loadDatabaseModule({
      autoSchema: true,
      queryImpl: query
    });

    await expect(ensureGamificationTables()).rejects.toThrow('syntax error');
  });

  it('initGamificationDb delegates to ensureGamificationTables', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const { initGamificationDb } = await loadDatabaseModule({
      autoSchema: true,
      queryImpl: query
    });

    await expect(initGamificationDb()).resolves.toBeUndefined();
    expect(query).toHaveBeenCalled();
  });

  it('logs connect event in non-test environments', async () => {
    const { handlers, mockLogger } = await loadDatabaseModule({
      autoSchema: false,
      nodeEnv: 'development'
    });

    expect(typeof handlers.connect).toBe('function');
    handlers.connect();
    expect(mockLogger.info).toHaveBeenCalledWith('Connected to PostgreSQL');
  });

  it('does not log connect event in test environment', async () => {
    const { handlers, mockLogger } = await loadDatabaseModule({
      autoSchema: false,
      nodeEnv: 'test'
    });

    handlers.connect();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('logs pool errors from error event callback', async () => {
    const { handlers, mockLogger } = await loadDatabaseModule({ autoSchema: false });
    const error = new Error('connection lost');

    handlers.error(error);
    expect(mockLogger.error).toHaveBeenCalledWith({ error }, 'Database error');
  });
});
