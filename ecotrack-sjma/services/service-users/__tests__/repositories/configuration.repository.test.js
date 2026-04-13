import { ConfigurationRepository } from '../../src/repositories/configuration.repository.js';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

import pool from '../../src/config/database.js';

describe('ConfigurationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAll returns rows', async () => {
    pool.query.mockResolvedValue({ rows: [{ cle: 'a' }] });

    const result = await ConfigurationRepository.getAll();

    expect(result).toEqual([{ cle: 'a' }]);
  });

  it('getByKey returns null when missing', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await ConfigurationRepository.getByKey('missing');

    expect(result).toBeNull();
  });

  it('getByCategory returns rows', async () => {
    pool.query.mockResolvedValue({ rows: [{ cle: 'rate' }] });

    const result = await ConfigurationRepository.getByCategory('limits');

    expect(result).toEqual([{ cle: 'rate' }]);
  });

  it('getMultiple returns empty object when keys missing', async () => {
    await expect(ConfigurationRepository.getMultiple([])).resolves.toEqual({});
    await expect(ConfigurationRepository.getMultiple(null)).resolves.toEqual({});
  });

  it('getMultiple parses values by type', async () => {
    pool.query.mockResolvedValue({
      rows: [
        { cle: 'n', valeur: '42.5', type: 'number' },
        { cle: 'b', valeur: 'true', type: 'boolean' },
        { cle: 'j', valeur: '{"x":1}', type: 'json' },
        { cle: 's', valeur: 'hello', type: 'string' },
      ],
    });

    const result = await ConfigurationRepository.getMultiple(['n', 'b', 'j', 's']);

    expect(result).toEqual({ n: 42.5, b: true, j: { x: 1 }, s: 'hello' });
  });

  it('parseValue handles invalid json fallback', () => {
    expect(ConfigurationRepository.parseValue('not-json', 'json')).toBe('not-json');
  });

  it('update returns updated row', async () => {
    const row = { cle: 'x', valeur: '1' };
    pool.query.mockResolvedValue({ rows: [row] });

    const result = await ConfigurationRepository.update('x', { valeur: '1', description: 'd' });

    expect(pool.query).toHaveBeenCalled();
    expect(result).toEqual(row);
  });

  it('create stores stringified value and returns row', async () => {
    const row = { cle: 'x' };
    pool.query.mockResolvedValue({ rows: [row] });

    const result = await ConfigurationRepository.create({
      cle: 'x',
      valeur: 99,
      type: 'number',
      description: 'desc',
      categorie: 'cat',
    });

    expect(pool.query).toHaveBeenCalled();
    expect(result).toEqual(row);
  });

  it('deactivate returns null when nothing changed', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await ConfigurationRepository.deactivate('x');

    expect(result).toBeNull();
  });

  it('getHistory returns rows with default and custom limits', async () => {
    pool.query.mockResolvedValue({ rows: [{ cle: 'x' }] });

    const first = await ConfigurationRepository.getHistory('x');
    const second = await ConfigurationRepository.getHistory('x', 10);

    expect(first).toEqual([{ cle: 'x' }]);
    expect(second).toEqual([{ cle: 'x' }]);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});
