import {
  EnvironmentalConstantsRepository,
} from '../../src/repositories/environmentalConstants.repository.js';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

import pool from '../../src/config/database.js';

describe('EnvironmentalConstantsRepository', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  it('getAll and getByKey return expected data', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ cle: 'co2' }] });
    pool.query.mockResolvedValueOnce({ rows: [{ cle: 'co2' }] });

    await expect(EnvironmentalConstantsRepository.getAll()).resolves.toEqual([{ cle: 'co2' }]);
    await expect(EnvironmentalConstantsRepository.getByKey('co2')).resolves.toEqual({ cle: 'co2' });
  });

  it('getByKey returns null when missing', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(EnvironmentalConstantsRepository.getByKey('missing')).resolves.toBeNull();
  });

  it('getMultiple handles empty keys and parses types', async () => {
    await expect(EnvironmentalConstantsRepository.getMultiple([])).resolves.toEqual({});

    pool.query.mockResolvedValue({
      rows: [
        { cle: 'n', valeur: '3.14', type: 'number' },
        { cle: 'b', valeur: 'true', type: 'boolean' },
        { cle: 's', valeur: 'raw', type: 'string' },
      ],
    });

    await expect(EnvironmentalConstantsRepository.getMultiple(['n', 'b', 's'])).resolves.toEqual({
      n: 3.14,
      b: true,
      s: 'raw',
    });
  });

  it('getAllAsMap parses rows', async () => {
    pool.query.mockResolvedValue({
      rows: [
        { cle: 'a', valeur: '1', type: 'number' },
        { cle: 'f', valeur: 'false', type: 'boolean' },
      ],
    });

    await expect(EnvironmentalConstantsRepository.getAllAsMap()).resolves.toEqual({ a: 1, f: false });
  });

  it('update commits transaction on success', async () => {
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ cle: 'co2', valeur: '2' }] })
      .mockResolvedValueOnce({});

    const result = await EnvironmentalConstantsRepository.update('co2', 2);

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(result).toEqual({ cle: 'co2', valeur: '2' });
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('update rollbacks transaction on error', async () => {
    const err = new Error('db fail');
    mockClient.query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({});

    await expect(EnvironmentalConstantsRepository.update('co2', 2)).rejects.toThrow('db fail');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
