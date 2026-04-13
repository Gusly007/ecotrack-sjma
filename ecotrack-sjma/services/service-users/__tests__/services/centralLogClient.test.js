jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}), { virtual: true });

import axios from 'axios';
import centralLogClient from '../../src/services/centralLogClient.js';

describe('centralLogClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('log sends payload to central endpoint', async () => {
    axios.post.mockResolvedValue({});

    await centralLogClient.log({
      message: 'hello',
      metadata: { x: 1 },
      userId: 42,
      traceId: 'trace-1',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [url, payload] = axios.post.mock.calls[0];
    expect(url).toContain('/api/logs');
    expect(payload.message).toBe('hello');
    expect(payload.userId).toBe(42);
  });

  it('log swallows network errors', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValue(new Error('network down'));

    await centralLogClient.log({ message: 'x' });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('helper methods route to expected level/action', async () => {
    const spy = jest.spyOn(centralLogClient, 'log').mockResolvedValue(undefined);

    await centralLogClient.login('m');
    await centralLogClient.logout('m');
    await centralLogClient.register('m');
    await centralLogClient.passwordChange('m');
    await centralLogClient.create('m');
    await centralLogClient.update('m');
    await centralLogClient.delete('m');
    await centralLogClient.view('m');
    await centralLogClient.info('m');
    await centralLogClient.warn('m');
    await centralLogClient.error('m');
    await centralLogClient.critical('m');
    await centralLogClient.security('m');
    await centralLogClient.apiCall('m');

    expect(spy).toHaveBeenCalledTimes(14);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ action: 'login', level: 'info' }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete', level: 'warning' }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ action: 'security', level: 'critical' }));

    spy.mockRestore();
  });
});
