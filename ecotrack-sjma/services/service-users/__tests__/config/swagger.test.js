describe('config/swagger', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('builds swagger spec with expected options', async () => {
    const swaggerJsdoc = jest.fn(() => ({ openapi: '3.0.0', info: { title: 'x' } }));

    jest.doMock('swagger-jsdoc', () => ({
      __esModule: true,
      default: swaggerJsdoc,
    }));

    const mod = await import('../../src/config/swagger.js');

    expect(swaggerJsdoc).toHaveBeenCalledTimes(1);
    const options = swaggerJsdoc.mock.calls[0][0];
    expect(options.definition.openapi).toBe('3.0.0');
    expect(options.definition.info.title).toContain('EcoTrack');
    expect(options.apis).toEqual(['./src/routes/*.js']);
    expect(mod.default).toEqual({ openapi: '3.0.0', info: { title: 'x' } });
  });
});
