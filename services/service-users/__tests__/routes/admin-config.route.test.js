const passthrough = (req, res, next) => next();

jest.mock('../../src/middleware/auth.js', () => ({
  __esModule: true,
  authenticateToken: passthrough,
  authorizeRole: jest.fn(() => passthrough),
}));

jest.mock('../../src/repositories/configuration.repository.js', () => ({
  __esModule: true,
  ConfigurationRepository: {
    getAll: jest.fn(),
    getByCategory: jest.fn(),
    getByKey: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../src/config/env.js', () => ({
  __esModule: true,
  default: {
    refreshDbConfig: jest.fn(),
  },
}));

import router from '../../src/routes/admin-config.js';
import { ConfigurationRepository } from '../../src/repositories/configuration.repository.js';
import env from '../../src/config/env.js';

function getHandler(method, path) {
  const layer = router.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('admin-config routes inline handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / formats all configuration values', async () => {
    ConfigurationRepository.getAll.mockResolvedValue([
      { cle: 'maxUsers', type: 'number', valeur: '10.5', description: 'desc', categorie: 'gen', est_modifiable: true, updated_at: 'now' },
      { cle: 'featureX', type: 'boolean', valeur: 'true', description: 'desc', categorie: 'flags', est_modifiable: false, updated_at: 'now' },
      { cle: 'layout', type: 'json', valeur: '{"a":1}', description: 'desc', categorie: 'ui', est_modifiable: true, updated_at: 'now' },
      { cle: 'fallback', type: 'json', valeur: 'not-json', description: 'desc', categorie: 'ui', est_modifiable: true, updated_at: 'now' },
    ]);

    const handler = getHandler('get', '/');
    const res = mockRes();
    await handler({}, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      maxUsers: expect.objectContaining({ value: 10.5, type: 'number' }),
      featureX: expect.objectContaining({ value: true, type: 'boolean' }),
      layout: expect.objectContaining({ value: { a: 1 }, type: 'json' }),
      fallback: expect.objectContaining({ value: 'not-json', type: 'json' }),
    }));
  });

  it('GET /category/:category handles repository errors', async () => {
    ConfigurationRepository.getByCategory.mockRejectedValue(new Error('db failed'));

    const handler = getHandler('get', '/category/:category');
    const req = { params: { category: 'ops' } };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'db failed' });
  });

  it('GET /:key returns 404 when key does not exist', async () => {
    ConfigurationRepository.getByKey.mockResolvedValue(null);

    const handler = getHandler('get', '/:key');
    const req = { params: { key: 'missing' } };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Configuration non trouvée' });
  });

  it('PUT /:key validates required value', async () => {
    const handler = getHandler('put', '/:key');
    const req = { params: { key: 'x' }, body: {} };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'value est requis' });
  });

  it('PUT /:key validates non-modifiable config', async () => {
    ConfigurationRepository.getByKey.mockResolvedValue({ est_modifiable: false });

    const handler = getHandler('put', '/:key');
    const req = { params: { key: 'x' }, body: { value: '1' } };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cette configuration ne peut pas être modifiée' });
  });

  it('PUT /:key validates number range', async () => {
    ConfigurationRepository.getByKey.mockResolvedValue({
      est_modifiable: true,
      type: 'number',
      min_valeur: 2,
      max_valeur: 8,
    });

    const handler = getHandler('put', '/:key');

    const reqInvalid = { params: { key: 'x' }, body: { value: 'abc' } };
    const resInvalid = mockRes();
    await handler(reqInvalid, resInvalid);
    expect(resInvalid.status).toHaveBeenCalledWith(400);

    const reqTooLow = { params: { key: 'x' }, body: { value: 1 } };
    const resTooLow = mockRes();
    await handler(reqTooLow, resTooLow);
    expect(resTooLow.status).toHaveBeenCalledWith(400);

    const reqTooHigh = { params: { key: 'x' }, body: { value: 9 } };
    const resTooHigh = mockRes();
    await handler(reqTooHigh, resTooHigh);
    expect(resTooHigh.status).toHaveBeenCalledWith(400);
  });

  it('PUT /:key validates boolean and json types', async () => {
    const handler = getHandler('put', '/:key');

    ConfigurationRepository.getByKey.mockResolvedValueOnce({
      est_modifiable: true,
      type: 'boolean',
      min_valeur: null,
      max_valeur: null,
    });
    const reqBool = { params: { key: 'bool' }, body: { value: 'x' } };
    const resBool = mockRes();
    await handler(reqBool, resBool);
    expect(resBool.status).toHaveBeenCalledWith(400);

    ConfigurationRepository.getByKey.mockResolvedValueOnce({
      est_modifiable: true,
      type: 'json',
      min_valeur: null,
      max_valeur: null,
    });
    const reqJson = { params: { key: 'json' }, body: { value: 'not-an-object' } };
    const resJson = mockRes();
    await handler(reqJson, resJson);
    expect(resJson.status).toHaveBeenCalledWith(400);
  });

  it('PUT /:key updates and refreshes db config on success', async () => {
    ConfigurationRepository.getByKey.mockResolvedValue({
      est_modifiable: true,
      type: 'boolean',
      min_valeur: null,
      max_valeur: null,
    });

    const handler = getHandler('put', '/:key');
    const req = { params: { key: 'featureX' }, body: { value: true, description: 'new' } };
    const res = mockRes();
    await handler(req, res);

    expect(ConfigurationRepository.update).toHaveBeenCalledWith('featureX', {
      valeur: 'true',
      description: 'new',
    });
    expect(env.refreshDbConfig).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, key: 'featureX', value: true }));
  });
});
