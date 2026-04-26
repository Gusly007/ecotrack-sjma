import { beforeEach, describe, expect, it, vi } from 'vitest';

let requestOnFulfilled;
let requestOnRejected;
let responseOnFulfilled;
let responseOnRejected;

const axiosPost = vi.fn();
const axiosCreate = vi.fn(() => {
  const instance = vi.fn();

  instance.interceptors = {
    request: {
      use: vi.fn((onFulfilled, onRejected) => {
        requestOnFulfilled = onFulfilled;
        requestOnRejected = onRejected;
      }),
    },
    response: {
      use: vi.fn((onFulfilled, onRejected) => {
        responseOnFulfilled = onFulfilled;
        responseOnRejected = onRejected;
      }),
    },
  };

  return instance;
});

vi.mock('axios', () => ({
  default: {
    create: axiosCreate,
    post: axiosPost,
  },
  create: axiosCreate,
  post: axiosPost,
}));

const loadApi = async () => {
  vi.resetModules();
  requestOnFulfilled = undefined;
  requestOnRejected = undefined;
  responseOnFulfilled = undefined;
  responseOnRejected = undefined;

  const mod = await import('../services/api');
  return mod.default;
};

describe('services/api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('creates axios instance with default config', async () => {
    await loadApi();

    expect(axiosCreate).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  });

  it('request interceptor injects auth token and cache headers', async () => {
    await loadApi();
    localStorage.setItem('token', 'abc-token');

    const config = await requestOnFulfilled({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer abc-token');
    expect(config.headers['Cache-Control']).toBe('no-cache');
    expect(config.headers.Pragma).toBe('no-cache');
    expect(config.headers.Expires).toBe('0');
  });

  it('request interceptor rejects request errors', async () => {
    await loadApi();

    const err = new Error('request failed');
    await expect(requestOnRejected(err)).rejects.toBe(err);
  });

  it('response interceptor returns response on success', async () => {
    await loadApi();

    const response = { data: { ok: true } };
    expect(responseOnFulfilled(response)).toBe(response);
  });

  it('retries original request after successful token refresh', async () => {
    const api = await loadApi();
    localStorage.setItem('refreshToken', 'refresh-1');

    axiosPost.mockResolvedValueOnce({ data: { token: 'new-access', refreshToken: 'new-refresh' } });
    api.mockResolvedValueOnce({ data: { retried: true } });

    const originalRequest = { headers: {} };
    const error = { response: { status: 401 }, config: originalRequest };

    const result = await responseOnRejected(error);

    expect(axiosPost).toHaveBeenCalledWith('http://localhost:3000/auth/refresh', {
      refreshToken: 'refresh-1',
    });
    expect(localStorage.getItem('token')).toBe('new-access');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    expect(originalRequest._retry).toBe(true);
    expect(originalRequest.headers.Authorization).toBe('Bearer new-access');
    expect(api).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ data: { retried: true } });
  });

  it('clears auth storage and rejects when refresh fails', async () => {
    await loadApi();
    localStorage.setItem('token', 'old-token');
    localStorage.setItem('refreshToken', 'refresh-1');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    axiosPost.mockResolvedValueOnce({ data: {} });

    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');

    const error = { response: { status: 401 }, config: { headers: {} } };
    await expect(responseOnRejected(error)).rejects.toThrow('Refresh response missing token');

    expect(removeSpy).toHaveBeenCalledWith('token');
    expect(removeSpy).toHaveBeenCalledWith('refreshToken');
    expect(removeSpy).toHaveBeenCalledWith('user');

    removeSpy.mockRestore();
  });

  it('rejects non-401 errors without retry', async () => {
    await loadApi();

    const error = { response: { status: 500 }, config: {} };
    await expect(responseOnRejected(error)).rejects.toBe(error);
    expect(axiosPost).not.toHaveBeenCalled();
  });
});
