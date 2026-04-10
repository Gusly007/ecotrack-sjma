import { jest } from '@jest/globals';

describe('centralizedLogging service', () => {
  const loadService = async ({ failConnect = false, failSave = false } = {}) => {
    jest.resetModules();

    const repo = {
      connect: failConnect ? jest.fn().mockRejectedValue(new Error('db down')) : jest.fn().mockResolvedValue(),
      createTable: jest.fn().mockResolvedValue(),
      save: failSave ? jest.fn().mockRejectedValue(new Error('save failed')) : jest.fn().mockResolvedValue({ id: 1 }),
      close: jest.fn().mockResolvedValue()
    };

    const logger = {
      info: jest.fn(),
      error: jest.fn()
    };

    jest.unstable_mockModule('../../src/repositories/logRepository.js', () => ({ default: repo }));
    jest.unstable_mockModule('../../src/utils/logger.js', () => ({ default: logger }));

    const mod = await import('../../src/services/centralizedLogging.js');
    return { service: mod.default, repo, logger };
  };

  it('connect sets isConnected true on success', async () => {
    const { service, repo, logger } = await loadService();
    await service.connect();
    expect(repo.connect).toHaveBeenCalled();
    expect(repo.createTable).toHaveBeenCalled();
    expect(service.isConnected).toBe(true);
    expect(logger.info).toHaveBeenCalled();
  });

  it('connect handles failures and keeps disconnected state', async () => {
    const { service, logger } = await loadService({ failConnect: true });
    await service.connect();
    expect(service.isConnected).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it('log auto-connects when disconnected', async () => {
    const { service, repo } = await loadService();
    service.isConnected = false;

    const result = await service.log({ message: 'hello' });
    expect(repo.connect).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith({ message: 'hello' });
    expect(result).toEqual({ id: 1 });
  });

  it('log catches save failures', async () => {
    const { service, logger } = await loadService({ failSave: true });
    service.isConnected = true;

    await expect(service.log({ message: 'x' })).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });

  it('info/warn/error delegate with correct levels', async () => {
    const { service, repo } = await loadService();
    service.isConnected = true;

    await service.info('a1', 'm1', { x: 1 });
    await service.warn('a2', 'm2', { x: 2 });
    await service.error('a3', 'm3', { x: 3 });

    expect(repo.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ level: 'INFO', action: 'a1', message: 'm1' })
    );
    expect(repo.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ level: 'WARN', action: 'a2', message: 'm2' })
    );
    expect(repo.save).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ level: 'ERROR', action: 'a3', message: 'm3' })
    );
  });

  it('close resets connection state', async () => {
    const { service, repo } = await loadService();
    service.isConnected = true;
    await service.close();
    expect(repo.close).toHaveBeenCalled();
    expect(service.isConnected).toBe(false);
  });
});
