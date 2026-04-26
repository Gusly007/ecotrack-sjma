import { jest } from '@jest/globals';

describe('logger module', () => {
  const originalEnv = { ...process.env };

  const loadLogger = async (nodeEnv) => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: nodeEnv, LOG_LEVEL: 'debug' };

    const transport = jest.fn(() => 'prettyTransport');
    const pinoFn = jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    }));
    pinoFn.transport = transport;

    jest.unstable_mockModule('pino', () => ({ default: pinoFn }));

    const mod = await import('../../src/utils/logger.js');
    return { mod, pinoFn, transport };
  };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses pretty transport in development', async () => {
    const { pinoFn, transport } = await loadLogger('development');
    expect(transport).toHaveBeenCalled();
    expect(pinoFn).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
        base: expect.objectContaining({ service: 'service-gamifications', environment: 'development' })
      }),
      'prettyTransport'
    );
  });

  it('skips pretty transport in production', async () => {
    const { pinoFn, transport } = await loadLogger('production');
    expect(transport).not.toHaveBeenCalled();
    expect(pinoFn).toHaveBeenCalledWith(expect.any(Object), undefined);
  });

  it('skips pretty transport in test env', async () => {
    const { pinoFn, transport, mod } = await loadLogger('test');
    expect(transport).not.toHaveBeenCalled();
    expect(pinoFn).toHaveBeenCalledWith(expect.any(Object), undefined);
    expect(mod.default).toBe(mod.logger);
  });
});
