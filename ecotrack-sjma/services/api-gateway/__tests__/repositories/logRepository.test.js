import { jest } from '@jest/globals';

const { default: logRepository } = await import('../../src/repositories/logRepository.js');

describe('logRepository', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('save should serialize metadata and return inserted row', async () => {
    const querySpy = jest.spyOn(logRepository, 'query').mockResolvedValue({ rows: [{ id: 10 }] });

    const result = await logRepository.save({
      level: 'INFO',
      action: 'LOGIN',
      service: 'api-gateway',
      message: 'ok',
      metadata: { a: 1 },
      userId: 4
    });

    expect(result).toEqual({ id: 10 });
    const values = querySpy.mock.calls[0][1];
    expect(values[4]).toBe(JSON.stringify({ a: 1 }));
  });

  it('getLogs should include selected filters and paging', async () => {
    const querySpy = jest.spyOn(logRepository, 'query').mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await logRepository.getLogs({
      service: 'api-gateway',
      level: 'ERROR',
      action: 'LOGIN',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      search: 'fail',
      userId: 9,
      limit: 20,
      offset: 40
    });

    expect(result).toEqual([{ id: 1 }]);
    expect(querySpy).toHaveBeenCalled();
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toContain('WHERE 1=1');
    expect(sql).toContain('LIMIT');
    expect(params).toEqual(['api-gateway', 'ERROR', 'LOGIN', '2026-01-01', '2026-01-02', '%fail%', 9, 20, 40]);
  });

  it('getLogsCount should parse count', async () => {
    jest.spyOn(logRepository, 'query').mockResolvedValue({ rows: [{ count: '123' }] });

    const result = await logRepository.getLogsCount({ service: 'service-users' });

    expect(result).toBe(123);
  });

  it('getStats should return parsed totals and grouped services', async () => {
    jest.spyOn(logRepository, 'query')
      .mockResolvedValueOnce({ rows: [{ count: '50' }] })
      .mockResolvedValueOnce({ rows: [{ count: '20' }] })
      .mockResolvedValueOnce({ rows: [{ service: 'api-gateway', count: '30' }] });

    const result = await logRepository.getStats(7);

    expect(result).toEqual({
      total: 50,
      last24h: 20,
      byService: [{ service: 'api-gateway', count: '30' }]
    });
  });

  it('getDistinctValues should map known columns and reject unknown column', async () => {
    const querySpy = jest.spyOn(logRepository, 'query').mockResolvedValue({ rows: [{ service: 'api-gateway' }] });

    const services = await logRepository.getDistinctValues('service');
    expect(services).toEqual(['api-gateway']);
    expect(querySpy).toHaveBeenCalled();

    await expect(logRepository.getDistinctValues('invalid')).rejects.toThrow('Invalid column: invalid');
  });

  it('deleteOldLogs should return deleted count', async () => {
    jest.spyOn(logRepository, 'query').mockResolvedValue({ rowCount: 8 });

    const result = await logRepository.deleteOldLogs(90);

    expect(result).toBe(8);
  });
});
