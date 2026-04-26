import { SessionRepository } from '../../src/repositories/session.repository.js';

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

jest.mock('../../src/utils/crypto.js', () => ({
  hashToken: jest.fn((t) => `hashed-${t}`),
}));

jest.mock('../../src/config/env.js', () => ({
  __esModule: true,
  default: {
    session: {
      tokenExpirationHours: 24,
    },
  },
}));

import pool from '../../src/config/database.js';

describe('SessionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores, validates and invalidates refresh tokens', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(SessionRepository.storeRefreshToken(1, 'tok')).resolves.toBeUndefined();
    await expect(SessionRepository.validateRefreshToken(1, 'tok')).resolves.toBe(true);
    await expect(SessionRepository.invalidateRefreshToken(1, 'tok')).resolves.toBeUndefined();
    await expect(SessionRepository.invalidateAllTokens(1)).resolves.toBeUndefined();
  });

  it('validateRefreshToken returns false when no rows', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(SessionRepository.validateRefreshToken(1, 'tok')).resolves.toBe(false);
  });

  it('limitConcurrentSessions removes oldest token only when threshold is reached', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '3' }] })
      .mockResolvedValueOnce({ rows: [] });

    await SessionRepository.limitConcurrentSessions(5, 3);
    expect(pool.query).toHaveBeenCalledTimes(2);

    pool.query.mockClear();
    pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

    await SessionRepository.limitConcurrentSessions(5, 3);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
