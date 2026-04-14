describe('utils/logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('exports console in test mode', () => {
    process.env.NODE_ENV = 'test';

    const logger = require('../../../src/utils/logger');

    expect(logger).toBe(console);
    expect(logger.logger).toBe(console);
  });

  test('exports console when running under jest worker', () => {
    delete process.env.NODE_ENV;
    process.env.JEST_WORKER_ID = '1';

    const logger = require('../../../src/utils/logger');

    expect(logger).toBe(console);
    expect(logger.logger).toBe(console);
  });
});
