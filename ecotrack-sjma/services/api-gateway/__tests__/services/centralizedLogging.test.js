import { jest } from '@jest/globals';

const mockLogRepository = {
  connect: jest.fn(),
  createTable: jest.fn(),
  save: jest.fn(),
  getLogs: jest.fn(),
  getStats: jest.fn(),
  getSummary: jest.fn(),
  getDistinctValues: jest.fn(),
  deleteOldLogs: jest.fn()
};

jest.unstable_mockModule('../../src/repositories/logRepository.js', () => ({
  default: mockLogRepository
}));

jest.unstable_mockModule('../../src/middleware/logger.js', () => ({
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  },
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

const { default: centralizedLoggingService } = await import('../../src/services/centralizedLogging.js');

describe('centralizedLoggingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connect should initialize repository', async () => {
    await centralizedLoggingService.connect();

    expect(mockLogRepository.connect).toHaveBeenCalled();
    expect(mockLogRepository.createTable).toHaveBeenCalled();
  });

  it('connect should throw when repository connection fails', async () => {
    mockLogRepository.connect.mockRejectedValue(new Error('connect failed'));

    await expect(centralizedLoggingService.connect()).rejects.toThrow('connect failed');
  });

  it('log should return saved log entry', async () => {
    mockLogRepository.save.mockResolvedValue({ id: 99 });

    const result = await centralizedLoggingService.log({ level: 'INFO', message: 'ok' });

    expect(result).toEqual({ id: 99 });
  });

  it('log should swallow save errors', async () => {
    mockLogRepository.save.mockRejectedValue(new Error('save failed'));

    const result = await centralizedLoggingService.log({ level: 'INFO', message: 'ok' });

    expect(result).toBeUndefined();
  });

  it('queryLogs should remove all filters and keep useful filters', async () => {
    mockLogRepository.getLogs.mockResolvedValue([{ id: 1 }]);

    const result = await centralizedLoggingService.queryLogs({
      service: 'all',
      level: 'error',
      action: 'all',
      search: 'token',
      userId: 7,
      limit: 20,
      offset: 40
    });

    expect(result).toEqual([{ id: 1 }]);
    expect(mockLogRepository.getLogs).toHaveBeenCalledWith({
      level: 'error',
      search: 'token',
      userId: 7,
      limit: 20,
      offset: 40
    });
  });

  it('getLogs should proxy filters directly', async () => {
    mockLogRepository.getLogs.mockResolvedValue([{ id: 2 }]);

    const result = await centralizedLoggingService.getLogs({ service: 'api-gateway' });

    expect(result).toEqual([{ id: 2 }]);
    expect(mockLogRepository.getLogs).toHaveBeenCalledWith({ service: 'api-gateway' });
  });

  it('level helpers should call log with expected level', async () => {
    const logSpy = jest.spyOn(centralizedLoggingService, 'log').mockResolvedValue({});

    await centralizedLoggingService.info('A', 'S', 'M', { x: 1 });
    await centralizedLoggingService.warn('A', 'S', 'M', { x: 1 });
    await centralizedLoggingService.error('A', 'S', 'M', { x: 1 });
    await centralizedLoggingService.debug('A', 'S', 'M', { x: 1 });

    expect(logSpy).toHaveBeenNthCalledWith(1, { level: 'INFO', action: 'A', service: 'S', message: 'M', metadata: { x: 1 } });
    expect(logSpy).toHaveBeenNthCalledWith(2, { level: 'WARN', action: 'A', service: 'S', message: 'M', metadata: { x: 1 } });
    expect(logSpy).toHaveBeenNthCalledWith(3, { level: 'ERROR', action: 'A', service: 'S', message: 'M', metadata: { x: 1 } });
    expect(logSpy).toHaveBeenNthCalledWith(4, { level: 'DEBUG', action: 'A', service: 'S', message: 'M', metadata: { x: 1 } });
  });

  it('getStats/getSummary/exportLogs should proxy repository methods', async () => {
    mockLogRepository.getStats.mockResolvedValue({ total: 1 });
    mockLogRepository.getSummary.mockResolvedValue({ total: 1 });
    mockLogRepository.getLogs.mockResolvedValue([{ id: 5 }]);

    const stats = await centralizedLoggingService.getStats(10);
    const summary = await centralizedLoggingService.getSummary(10);
    const exported = await centralizedLoggingService.exportLogs({ level: 'ERROR' });

    expect(stats).toEqual({ total: 1 });
    expect(summary).toEqual({ total: 1 });
    expect(exported).toEqual([{ id: 5 }]);
  });

  it('getFilterValues should return distinct values from repository', async () => {
    mockLogRepository.getDistinctValues
      .mockResolvedValueOnce(['api-gateway', 'service-users'])
      .mockResolvedValueOnce(['ERROR', 'WARN'])
      .mockResolvedValueOnce(['LOGIN', 'READ']);

    const result = await centralizedLoggingService.getFilterValues();

    expect(result).toEqual({
      services: ['api-gateway', 'service-users'],
      levels: ['ERROR', 'WARN'],
      actions: ['LOGIN', 'READ']
    });
  });

  it('getFilterValues should throw when repository fails', async () => {
    mockLogRepository.getDistinctValues.mockRejectedValue(new Error('distinct failed'));

    await expect(centralizedLoggingService.getFilterValues()).rejects.toThrow('distinct failed');
  });

  it('cleanup should support object payload and fallback days', async () => {
    mockLogRepository.deleteOldLogs.mockResolvedValue(12);

    const result = await centralizedLoggingService.cleanup({ olderThanDays: 45 });

    expect(result).toBe(12);
    expect(mockLogRepository.deleteOldLogs).toHaveBeenCalledWith(45);
  });

  it('cleanup should support numeric days', async () => {
    mockLogRepository.deleteOldLogs.mockResolvedValue(3);

    const result = await centralizedLoggingService.cleanup(7);

    expect(result).toBe(3);
    expect(mockLogRepository.deleteOldLogs).toHaveBeenCalledWith(7);
  });
});