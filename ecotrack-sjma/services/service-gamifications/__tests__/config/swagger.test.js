import { jest } from '@jest/globals';

describe('Swagger config', () => {
  it('builds swagger spec from configured options', async () => {
    jest.resetModules();
    const swaggerSpec = { openapi: '3.0.0', info: { title: 'mock' } };
    const mockSwaggerJSDoc = jest.fn(() => swaggerSpec);

    jest.unstable_mockModule('swagger-jsdoc', () => ({
      default: mockSwaggerJSDoc
    }));

    const module = await import('../../src/config/swagger.js');

    expect(mockSwaggerJSDoc).toHaveBeenCalledTimes(1);
    const options = mockSwaggerJSDoc.mock.calls[0][0];
    expect(options.apis).toEqual(['./src/routes/*.js']);
    expect(options.swaggerDefinition.openapi).toBe('3.0.0');
    expect(options.swaggerDefinition.info.title).toContain('Gamification');
    expect(module.default).toBe(swaggerSpec);
  });
});
