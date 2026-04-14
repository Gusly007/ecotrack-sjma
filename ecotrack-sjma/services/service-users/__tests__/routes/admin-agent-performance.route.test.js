const passthrough = (req, res, next) => next();

jest.mock('../../src/middleware/auth.js', () => ({
  __esModule: true,
  authenticateToken: passthrough,
  authorizeRole: jest.fn(() => passthrough),
}));

jest.mock('../../src/repositories/agentPerformanceConstants.repository.js', () => ({
  __esModule: true,
  AgentPerformanceConstantsRepository: {
    getAll: jest.fn(),
    getByKey: jest.fn(),
    update: jest.fn(),
  },
}));

import router from '../../src/routes/admin-agent-performance.js';
import { AgentPerformanceConstantsRepository } from '../../src/repositories/agentPerformanceConstants.repository.js';

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

describe('admin-agent-performance inline handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / returns formatted constants', async () => {
    AgentPerformanceConstantsRepository.getAll.mockResolvedValue([
      { cle: 'speed', type: 'number', valeur: '7.5', unite: 'kmh', description: 'd', est_modifiable: true, updated_at: 'now' },
    ]);

    const handler = getHandler('get', '/');
    const res = mockRes();
    await handler({}, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      speed: expect.objectContaining({ value: 7.5, unite: 'kmh' }),
    }));
  });

  it('GET /:key returns 404 when missing', async () => {
    AgentPerformanceConstantsRepository.getByKey.mockResolvedValue(null);

    const handler = getHandler('get', '/:key');
    const req = { params: { key: 'missing' } };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('PUT /:key validates modifiable and updates', async () => {
    const handler = getHandler('put', '/:key');

    AgentPerformanceConstantsRepository.getByKey.mockResolvedValueOnce({
      est_modifiable: false,
    });
    const resForbidden = mockRes();
    await handler({ params: { key: 'speed' }, body: { value: 3 } }, resForbidden);
    expect(resForbidden.status).toHaveBeenCalledWith(403);

    AgentPerformanceConstantsRepository.getByKey.mockResolvedValueOnce({
      est_modifiable: true,
      type: 'number',
      min_valeur: 1,
      max_valeur: 10,
      unite: 'kmh',
    });
    const resOk = mockRes();
    await handler({ params: { key: 'speed' }, body: { value: 4 } }, resOk);

    expect(AgentPerformanceConstantsRepository.update).toHaveBeenCalledWith('speed', 4);
    expect(resOk.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, key: 'speed', value: 4 }));
  });
});
