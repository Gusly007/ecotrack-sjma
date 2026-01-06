import { EventEmitter } from 'events';

const invokeLimiter = (limiter, { statusAfterNext = 200 } = {}) =>
  new Promise((resolve) => {
    const req = {
      ip: '127.0.0.1',
      method: 'POST',
      path: '/test',
      originalUrl: '/test',
      headers: {},
      app: {
        get: () => undefined
      }
    };

    const res = new EventEmitter();
    res.statusCode = 200;
    res.headers = {};
    res.status = function setStatus(code) {
      this.statusCode = code;
      return this;
    };
    res.setHeader = function setHeader(key, value) {
      this.headers[key] = value;
      return this;
    };
    res.header = res.setHeader;
    const complete = (payload) => {
      res.payload = payload;
      resolve({ blocked: true, status: res.statusCode, body: payload });
    };
    res.send = complete;
    res.json = complete;
    res.end = complete;

    limiter(req, res, () => {
      res.statusCode = statusAfterNext;
      res.emit('finish');
      resolve({ blocked: false, status: res.statusCode });
    });
  });

describe('Rate limit middleware', () => {
  describe('publicLimiter', () => {
    let loadPublicLimiter;

    beforeEach(() => {
      loadPublicLimiter = async () => {
        jest.resetModules();
        process.env.RATE_LIMIT_REQUESTS = '2';
        process.env.RATE_LIMIT_WINDOW_MS = '1000';
        return import('../../src/config/rateLimit.js');
      };
    });

    afterEach(() => {
      delete process.env.RATE_LIMIT_REQUESTS;
      delete process.env.RATE_LIMIT_WINDOW_MS;
    });

    it('returns 429 after exceeding configured max requests', async () => {
      const { publicLimiter } = await loadPublicLimiter();

      const first = await invokeLimiter(publicLimiter);
      const second = await invokeLimiter(publicLimiter);
      const third = await invokeLimiter(publicLimiter);

      expect(first.blocked).toBe(false);
      expect(second.blocked).toBe(false);
      expect(third.blocked).toBe(true);
      expect(third.status).toBe(429);
      expect(String(third.body)).toContain('Too many requests');
    });
  });

  describe('loginLimiter', () => {
    let loginLimiter;

    beforeEach(async () => {
      jest.resetModules();
      ({ loginLimiter } = await import('../../src/config/rateLimit.js'));
    });

    const failAttempt = () => invokeLimiter(loginLimiter, { statusAfterNext: 401 });
    const successAttempt = () => invokeLimiter(loginLimiter, { statusAfterNext: 200 });

    it('blocks repeated failed login attempts after max threshold', async () => {
      for (let i = 0; i < 5; i += 1) {
        const attempt = await failAttempt();
        expect(attempt.blocked).toBe(false);
        expect(attempt.status).toBe(401);
      }

      const blockedResponse = await failAttempt();
      expect(blockedResponse.blocked).toBe(true);
      expect(blockedResponse.status).toBe(429);
      expect(String(blockedResponse.body)).toContain('Too many login attempts');
    });

    it('ignores successful attempts when skipSuccessfulRequests is enabled', async () => {
      for (let i = 0; i < 4; i += 1) {
        const attempt = await failAttempt();
        expect(attempt.blocked).toBe(false);
        expect(attempt.status).toBe(401);
      }

      const success = await successAttempt();
      expect(success.blocked).toBe(false);
      expect(success.status).toBe(200);

      const fifthFailure = await failAttempt();
      expect(fifthFailure.blocked).toBe(false);
      expect(fifthFailure.status).toBe(401);

      const blockedResponse = await failAttempt();
      expect(blockedResponse.blocked).toBe(true);
      expect(blockedResponse.status).toBe(429);
    });
  });
});
