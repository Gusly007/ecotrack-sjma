jest.mock('pg', () => ({
  Pool: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const { Pool } = require('pg');
const logger = require('../../../src/utils/logger');

describe('database config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a pool with the expected defaults and delegates queries', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ ok: true }] });
    const on = jest.fn();
    Pool.mockImplementation(() => ({ query, on }));

    const database = require('../../../src/config/database');

    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      })
    );
    expect(on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(on).toHaveBeenCalledWith('connect', expect.any(Function));

    await expect(database.query('SELECT 1', ['a'])).resolves.toEqual({ rows: [{ ok: true }] });
    expect(query).toHaveBeenCalledWith('SELECT 1', ['a']);

    const errorHandler = on.mock.calls.find(([event]) => event === 'error')[1];
    const connectHandler = on.mock.calls.find(([event]) => event === 'connect')[1];

    errorHandler(new Error('db fail'));
    connectHandler();

    expect(logger.error).toHaveBeenCalledWith({ err: expect.any(Error) }, 'Unexpected database error');
    expect(logger.info).toHaveBeenCalledWith('Database connected');
  });
});


