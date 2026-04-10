import {
  AgentPerformanceConstantsRepository,
  getAgentPerformanceConstant,
  invalidateAgentPerformanceConstantsCache,
  loadAgentPerformanceConstants,
} from '../../src/repositories/agentPerformanceConstants.repository.js';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

import pool from '../../src/config/database.js';

describe('AgentPerformanceConstantsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateAgentPerformanceConstantsCache();
  });

  it('getAll, getByKey, getMultiple and getAllAsMap work', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ cle: 'speed' }] })
      .mockResolvedValueOnce({ rows: [{ cle: 'speed' }] })
      .mockResolvedValueOnce({ rows: [{ cle: 'speed', valeur: '10', type: 'number' }] })
      .mockResolvedValueOnce({ rows: [{ cle: 'active', valeur: 'true', type: 'boolean' }] });

    await expect(AgentPerformanceConstantsRepository.getAll()).resolves.toEqual([{ cle: 'speed' }]);
    await expect(AgentPerformanceConstantsRepository.getByKey('speed')).resolves.toEqual({ cle: 'speed' });
    await expect(AgentPerformanceConstantsRepository.getMultiple(['speed'])).resolves.toEqual({ speed: 10 });
    await expect(AgentPerformanceConstantsRepository.getAllAsMap()).resolves.toEqual({ active: true });
  });

  it('getMultiple returns empty object for empty keys', async () => {
    await expect(AgentPerformanceConstantsRepository.getMultiple([])).resolves.toEqual({});
  });

  it('update returns row or null', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ cle: 'speed' }] });
    await expect(AgentPerformanceConstantsRepository.update('speed', 5)).resolves.toEqual({ cle: 'speed' });

    pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(AgentPerformanceConstantsRepository.update('speed', 5)).resolves.toBeNull();
  });

  it('load cache and read constant from cache', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ cle: 'alpha', valeur: '2', type: 'number' }] });

    const cache = await loadAgentPerformanceConstants();
    const value = await getAgentPerformanceConstant('alpha');

    expect(cache.get('alpha')).toBe(2);
    expect(value).toBe(2);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('falls back to single row lookup when key missing in cache', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ cle: 'known', valeur: '1', type: 'number' }] })
      .mockResolvedValueOnce({ rows: [{ cle: 'late', valeur: 'true', type: 'boolean' }] });

    const value = await getAgentPerformanceConstant('late');

    expect(value).toBe(true);
  });

  it('returns null when getByKey has no row', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ cle: 'known', valeur: '1', type: 'number' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(getAgentPerformanceConstant('missing')).resolves.toBeNull();
  });

  it('returns empty map when loading constants fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    pool.query.mockRejectedValueOnce(new Error('db down'));

    const cache = await loadAgentPerformanceConstants();

    expect(cache).toEqual(new Map());
    spy.mockRestore();
  });
});
