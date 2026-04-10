/**
 * Config - env tests
 */
import { jest } from '@jest/globals';

describe('Environment Configuration', () => {
  const originalEnv = { ...process.env };

  const loadEnvModule = async () => {
    jest.resetModules();
    return import('../../src/config/env.js');
  };

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  it('uses default nodeEnv when missing', async () => {
    delete process.env.NODE_ENV;
    const { default: env } = await loadEnvModule();
    expect(env.nodeEnv).toBe('development');
  });

  it('uses default port when no env value exists', async () => {
    delete process.env.GAMIFICATIONS_PORT;
    delete process.env.PORT;
    const { default: env } = await loadEnvModule();
    expect(env.port).toBe(3014);
  });

  it('prioritizes GAMIFICATIONS_PORT over PORT', async () => {
    process.env.GAMIFICATIONS_PORT = '3014';
    process.env.PORT = '9999';
    const { default: env } = await loadEnvModule();
    expect(env.port).toBe(3014);
  });

  it('falls back to default port when provided port is invalid', async () => {
    process.env.GAMIFICATIONS_PORT = 'abc';
    const { default: env } = await loadEnvModule();
    expect(env.port).toBe(3014);
  });

  it('uses GAMIFICATIONS_DATABASE_URL before DATABASE_URL', async () => {
    process.env.GAMIFICATIONS_DATABASE_URL = 'postgresql://localhost/gamifications';
    process.env.DATABASE_URL = 'postgresql://localhost/generic';
    const { default: env } = await loadEnvModule();
    expect(env.databaseUrl).toBe('postgresql://localhost/gamifications');
  });

  it('falls back to DATABASE_URL when service URL is missing', async () => {
    delete process.env.GAMIFICATIONS_DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://localhost/main';
    const { default: env } = await loadEnvModule();
    expect(env.databaseUrl).toBe('postgresql://localhost/main');
  });

  it('forces autoSchema in test environment', async () => {
    process.env.NODE_ENV = 'test';
    process.env.GAMIFICATIONS_AUTO_SCHEMA = 'false';
    const { default: env } = await loadEnvModule();
    expect(env.autoSchema).toBe(true);
  });

  it('enables autoSchema in non-test when env flag is true', async () => {
    process.env.NODE_ENV = 'development';
    process.env.GAMIFICATIONS_AUTO_SCHEMA = 'TRUE';
    const { default: env } = await loadEnvModule();
    expect(env.autoSchema).toBe(true);
  });

  it('disables autoSchema in non-test when env flag is false', async () => {
    process.env.NODE_ENV = 'development';
    process.env.GAMIFICATIONS_AUTO_SCHEMA = 'false';
    const { default: env } = await loadEnvModule();
    expect(env.autoSchema).toBe(false);
  });

  it('validateEnv throws when DB URL is missing', async () => {
    process.env.GAMIFICATIONS_DATABASE_URL = '';
    process.env.DATABASE_URL = '';
    const { validateEnv } = await loadEnvModule();
    expect(() => validateEnv()).toThrow(/Variables d'environnement manquantes/);
  });

  it('validateEnv passes when DB URL exists', async () => {
    process.env.GAMIFICATIONS_DATABASE_URL = 'postgresql://localhost/ok';
    const { validateEnv } = await loadEnvModule();
    expect(() => validateEnv()).not.toThrow();
  });
});
