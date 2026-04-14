import { jest } from '@jest/globals';

describe('LogRepository', () => {
  const loadModule = async () => {
    jest.resetModules();

    const logger = {
      info: jest.fn(),
      error: jest.fn()
    };

    const baseQuery = jest.fn().mockResolvedValue({ rows: [] });

    class MockBaseRepository {
      async query(sql, params) {
        return baseQuery(sql, params);
      }
    }

    jest.unstable_mockModule('../../src/repositories/baseRepository.js', () => ({
      default: MockBaseRepository
    }));

    jest.unstable_mockModule('../../src/utils/logger.js', () => ({
      default: logger
    }));

    const mod = await import('../../src/repositories/logRepository.js');
    return { logRepository: mod.default, baseQuery, logger };
  };

  it('createTable creates table and indexes then logs success', async () => {
    const { logRepository, baseQuery, logger } = await loadModule();

    await logRepository.createTable();

    expect(baseQuery).toHaveBeenCalledTimes(1);
    const sql = baseQuery.mock.calls[0][0];
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS centralized_logs');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_logs_timestamp');
    expect(logger.info).toHaveBeenCalledWith('Centralized logs table created');
  });

  it('createTable logs errors without throwing', async () => {
    const { logRepository, baseQuery, logger } = await loadModule();
    baseQuery.mockRejectedValueOnce(new Error('ddl failed'));

    await expect(logRepository.createTable()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });

  it('save inserts log row using defaults', async () => {
    const { logRepository, baseQuery } = await loadModule();
    const row = { id: 1, message: 'ok' };
    baseQuery.mockResolvedValueOnce({ rows: [row] });

    const result = await logRepository.save({ message: 'hello' });

    expect(baseQuery).toHaveBeenCalledTimes(1);
    expect(baseQuery.mock.calls[0][0]).toContain('INSERT INTO centralized_logs');
    expect(baseQuery.mock.calls[0][1]).toEqual([
      'info',
      'other',
      'service-gamifications',
      'hello',
      '{}',
      null,
      null,
      null,
      null
    ]);
    expect(result).toEqual(row);
  });

  it('save inserts log row using provided metadata', async () => {
    const { logRepository, baseQuery } = await loadModule();
    baseQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] });

    await logRepository.save({
      level: 'warn',
      action: 'badge:create',
      service: 'svc-x',
      message: 'created',
      metadata: { badgeId: 1 },
      userId: 'u1',
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
      traceId: 't1'
    });

    expect(baseQuery.mock.calls[0][1]).toEqual([
      'warn',
      'badge:create',
      'svc-x',
      'created',
      '{"badgeId":1}',
      'u1',
      '127.0.0.1',
      'Jest',
      't1'
    ]);
  });
});
