const { EventEmitter } = require('events');
const requestLogger = require('../../../src/middleware/request-logger');

describe('request-logger middleware', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('logs successful requests on response finish', () => {
    const req = { method: 'GET', path: '/iot/health' };
    const res = new EventEmitter();
    res.statusCode = 200;
    const next = jest.fn();

    requestLogger(req, res, next);
    expect(next).toHaveBeenCalled();

    res.emit('finish');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('✅ GET /iot/health - 200'));
  });

  test('logs warning style for error status codes', () => {
    const req = { method: 'POST', path: '/iot/measurements' };
    const res = new EventEmitter();
    res.statusCode = 500;
    const next = jest.fn();

    requestLogger(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  POST /iot/measurements - 500'));
  });
});