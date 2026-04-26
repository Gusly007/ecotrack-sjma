import { jest } from '@jest/globals';

describe('Rate limit config', () => {
  it('builds public limiter with expected options', async () => {
    jest.resetModules();
    const mockRateLimit = jest.fn(() => 'public-limiter');

    jest.unstable_mockModule('express-rate-limit', () => ({
      default: mockRateLimit
    }));

    const { publicLimiter } = await import('../../src/config/rateLimit.js');

    expect(publicLimiter).toBe('public-limiter');
    expect(mockRateLimit).toHaveBeenCalledTimes(1);
    expect(mockRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        windowMs: 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
      })
    );
  });
});
