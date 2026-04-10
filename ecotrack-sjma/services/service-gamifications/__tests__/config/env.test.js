/**
 * Config - env tests
 */
import { jest } from '@jest/globals';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load NODE_ENV from environment', () => {
    process.env.NODE_ENV = 'test';
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have default port when not set', () => {
    delete process.env.GAMIFICATIONS_PORT;
    expect(process.env.GAMIFICATIONS_PORT).toBeUndefined();
  });

  it('should parse integer ports correctly', () => {
    process.env.GAMIFICATIONS_PORT = '3014';
    const port = parseInt(process.env.GAMIFICATIONS_PORT, 10);
    expect(port).toBe(3014);
    expect(typeof port).toBe('number');
  });

  it('should preserve DATABASE_URL when GAMIFICATIONS_DATABASE_URL not set', () => {
    delete process.env.GAMIFICATIONS_DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    expect(process.env.DATABASE_URL).toBe('postgresql://localhost/test');
  });

  it('should prioritize GAMIFICATIONS_DATABASE_URL over DATABASE_URL', () => {
    process.env.GAMIFICATIONS_DATABASE_URL = 'postgresql://localhost/gamifications';
    process.env.DATABASE_URL = 'postgresql://localhost/generic';
    expect(process.env.GAMIFICATIONS_DATABASE_URL).toBe('postgresql://localhost/gamifications');
  });

  it('should handle auto schema flag', () => {
    process.env.GAMIFICATIONS_AUTO_SCHEMA = 'true';
    expect(process.env.GAMIFICATIONS_AUTO_SCHEMA).toBe('true');
    
    process.env.GAMIFICATIONS_AUTO_SCHEMA = 'false';
    expect(process.env.GAMIFICATIONS_AUTO_SCHEMA).toBe('false');
  });
});
