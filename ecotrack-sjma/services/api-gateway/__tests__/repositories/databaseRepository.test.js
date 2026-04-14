import { jest } from '@jest/globals';

const { default: databaseRepository } = await import('../../src/repositories/databaseRepository.js');

describe('databaseRepository', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getDatabaseSize should map row values and percentage', async () => {
    jest.spyOn(databaseRepository, 'query').mockResolvedValue({
      rows: [{ used_bytes: '1073741824', used_pretty: '1 GB' }]
    });

    const result = await databaseRepository.getDatabaseSize();

    expect(result.usedBytes).toBe(1073741824);
    expect(result.usedPretty).toBe('1 GB');
    expect(result.totalBytes).toBe(50 * 1024 * 1024 * 1024);
    expect(result.percentage).toBe(2);
  });

  it('getDatabaseSize should return fallback payload on error', async () => {
    jest.spyOn(databaseRepository, 'query').mockRejectedValue(new Error('boom'));

    const result = await databaseRepository.getDatabaseSize();

    expect(result).toEqual({
      usedBytes: 0,
      usedPretty: '0 MB',
      totalBytes: 50 * 1024 * 1024 * 1024,
      percentage: 0
    });
  });

  it('getTableSizes should return rows', async () => {
    const rows = [{ tablename: 'utilisateur', size: '10 MB' }];
    jest.spyOn(databaseRepository, 'query').mockResolvedValue({ rows });

    const result = await databaseRepository.getTableSizes();

    expect(result).toEqual(rows);
  });

  it('getConnectionStats should return fallback when query fails', async () => {
    jest.spyOn(databaseRepository, 'query').mockRejectedValue(new Error('down'));

    const result = await databaseRepository.getConnectionStats();

    expect(result).toEqual({ activeConnections: 0 });
  });
});
