jest.mock('../../../src/repositories/logRepository', () => ({
  save: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

const logRepository = require('../../../src/repositories/logRepository');
const logger = require('../../../src/utils/logger');
const centralizedLogging = require('../../../src/services/centralizedLogging');

describe('CentralizedLoggingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('log delegates to repository and swallows errors', async () => {
    logRepository.save.mockResolvedValueOnce({ id: 1 });
    await expect(centralizedLogging.log({ level: 'INFO' })).resolves.toEqual({ id: 1 });

    logRepository.save.mockRejectedValueOnce(new Error('save failed'));
    await expect(centralizedLogging.log({ level: 'WARN' })).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith('Centralized logging failed:', 'save failed');
  });

  test('info warn and error format payloads', async () => {
    logRepository.save.mockResolvedValue({ ok: true });

    await centralizedLogging.info('CREATE', 'created', { id: 1 });
    await centralizedLogging.warn('UPDATE', 'warned');
    await centralizedLogging.error('DELETE', 'failed', { reason: 'db' });

    expect(logRepository.save).toHaveBeenCalledWith({
      level: 'INFO',
      action: 'CREATE',
      service: 'service-analytics',
      message: 'created',
      metadata: { id: 1 }
    });
    expect(logRepository.save).toHaveBeenCalledWith({
      level: 'WARN',
      action: 'UPDATE',
      service: 'service-analytics',
      message: 'warned',
      metadata: {}
    });
    expect(logRepository.save).toHaveBeenCalledWith({
      level: 'ERROR',
      action: 'DELETE',
      service: 'service-analytics',
      message: 'failed',
      metadata: { reason: 'db' }
    });
  });
});



