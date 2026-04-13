const passthrough = (req, res, next) => next();

jest.mock('../../src/middleware/auth.js', () => ({
  __esModule: true,
  authenticateToken: passthrough,
  authorizeRole: jest.fn(() => passthrough),
}));

jest.mock('../../src/repositories/environmentalConstants.repository.js', () => ({
  __esModule: true,
  EnvironmentalConstantsRepository: {
    getAll: jest.fn(),
    getByKey: jest.fn(),
    update: jest.fn(),
  },
}));

import router from '../../src/routes/admin-environmental-constants.js';
import { EnvironmentalConstantsRepository } from '../../src/repositories/environmentalConstants.repository.js';

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

describe('admin-environmental-constants inline handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /internal formats constants', async () => {
    EnvironmentalConstantsRepository.getAll.mockResolvedValue([
      { cle: 'co2', type: 'number', valeur: '12.3', unite: 'kg', description: 'd', est_modifiable: true, updated_at: 'now' },
      { cle: 'policy', type: 'string', valeur: 'strict', unite: null, description: 'd', est_modifiable: false, updated_at: 'now' },
    ]);

    const handler = getHandler('get', '/internal');
    const res = mockRes();
    await handler({}, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      co2: expect.objectContaining({ value: 12.3, unite: 'kg' }),
      policy: expect.objectContaining({ value: 'strict' }),
    }));
  });

  it('GET /:key returns 404 when missing', async () => {
    EnvironmentalConstantsRepository.getByKey.mockResolvedValue(null);

    const handler = getHandler('get', '/:key');
    const req = { params: { key: 'missing' } };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('PUT /:key validates required and numeric input', async () => {
    const handler = getHandler('put', '/:key');

    const resMissing = mockRes();
    await handler({ params: { key: 'x' }, body: {} }, resMissing);
    expect(resMissing.status).toHaveBeenCalledWith(400);

    EnvironmentalConstantsRepository.getByKey.mockResolvedValue({
      est_modifiable: true,
      type: 'number',
      min_valeur: 1,
      max_valeur: 5,
      unite: 'kg',
    });

    const resInvalid = mockRes();
    await handler({ params: { key: 'x' }, body: { value: 'abc' } }, resInvalid);
    expect(resInvalid.status).toHaveBeenCalledWith(400);
  });

  it('PUT /:key updates on success', async () => {
    EnvironmentalConstantsRepository.getByKey.mockResolvedValue({
      est_modifiable: true,
      type: 'number',
      min_valeur: 1,
      max_valeur: 5,
      unite: 'kg',
    });

    const handler = getHandler('put', '/:key');
    const req = { params: { key: 'co2' }, body: { value: 2 } };
    const res = mockRes();
    await handler(req, res);

    expect(EnvironmentalConstantsRepository.update).toHaveBeenCalledWith('co2', 2);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, key: 'co2', value: 2 }));
  });
});
