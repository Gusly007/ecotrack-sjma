const path = require('path');

describe('kafkaProducer', () => {
  const modulePath = path.resolve(__dirname, '../../kafkaProducer.js');

  let mockProducer;
  let mockLogger;

  const loadSubject = () => {
    jest.resetModules();

    mockProducer = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    jest.doMock('kafkajs', () => ({
      Kafka: jest.fn().mockImplementation(() => ({
        brokers: ['localhost:9092'],
        producer: () => mockProducer
      }))
    }));

    jest.doMock('../../src/utils/logger.js', () => mockLogger);

    return require(modulePath);
  };

  it('connect should set connected state on success', async () => {
    const kafkaProducer = loadSubject();

    await kafkaProducer.connect();

    expect(mockProducer.connect).toHaveBeenCalledTimes(1);
    expect(kafkaProducer.isConnected()).toBe(true);
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('connect should keep disconnected state on failure', async () => {
    const kafkaProducer = loadSubject();
    mockProducer.connect.mockRejectedValue(new Error('connect failed'));

    await kafkaProducer.connect();

    expect(kafkaProducer.isConnected()).toBe(false);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('disconnect should no-op when not connected', async () => {
    const kafkaProducer = loadSubject();

    await kafkaProducer.disconnect();

    expect(mockProducer.disconnect).not.toHaveBeenCalled();
  });

  it('disconnect should clear connected state on success', async () => {
    const kafkaProducer = loadSubject();
    await kafkaProducer.connect();

    await kafkaProducer.disconnect();

    expect(mockProducer.disconnect).toHaveBeenCalledTimes(1);
    expect(kafkaProducer.isConnected()).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith('Kafka Producer disconnected');
  });

  it('disconnect should log error when disconnection fails', async () => {
    const kafkaProducer = loadSubject();
    await kafkaProducer.connect();
    mockProducer.disconnect.mockRejectedValue(new Error('disconnect failed'));

    await kafkaProducer.disconnect();

    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('sendSensorData should return false and warn when not connected', async () => {
    const kafkaProducer = loadSubject();

    const ok = await kafkaProducer.sendSensorData({ capteur_id: 12, value: 1 });

    expect(ok).toBe(false);
    expect(mockProducer.send).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('sendSensorData should send message and return true when connected', async () => {
    const kafkaProducer = loadSubject();
    await kafkaProducer.connect();

    const ok = await kafkaProducer.sendSensorData({ capteur_id: 12, value: 1 });

    expect(ok).toBe(true);
    expect(mockProducer.send).toHaveBeenCalledTimes(1);
    expect(mockProducer.send.mock.calls[0][0].topic).toBe(kafkaProducer.TOPICS.SENSOR_DATA);
  });

  it('sendSensorData should return false when producer send fails', async () => {
    const kafkaProducer = loadSubject();
    await kafkaProducer.connect();
    mockProducer.send.mockRejectedValue(new Error('send failed'));

    const ok = await kafkaProducer.sendSensorData({ capteurId: 99, value: 7 });

    expect(ok).toBe(false);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('sendAlert should return false when not connected', async () => {
    const kafkaProducer = loadSubject();

    const ok = await kafkaProducer.sendAlert({ conteneur_id: 5, type: 'HIGH' });

    expect(ok).toBe(false);
    expect(mockProducer.send).not.toHaveBeenCalled();
  });

  it('sendAlert should send alert and return true when connected', async () => {
    const kafkaProducer = loadSubject();
    await kafkaProducer.connect();

    const ok = await kafkaProducer.sendAlert({ conteneur_id: 5, type: 'HIGH' });

    expect(ok).toBe(true);
    expect(mockProducer.send.mock.calls[0][0].topic).toBe(kafkaProducer.TOPICS.ALERTS);
  });

  it('sendAlert should return false when send throws', async () => {
    const kafkaProducer = loadSubject();
    await kafkaProducer.connect();
    mockProducer.send.mockRejectedValue(new Error('send alert failed'));

    const ok = await kafkaProducer.sendAlert({ conteneurId: 77, type: 'LOW' });

    expect(ok).toBe(false);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('sendContainerStatus should return false when not connected', async () => {
    const kafkaProducer = loadSubject();

    const ok = await kafkaProducer.sendContainerStatus(15, 'OPEN');

    expect(ok).toBe(false);
    expect(mockProducer.send).not.toHaveBeenCalled();
  });

  it('sendContainerStatus should return true when producer sends successfully', async () => {
    const kafkaProducer = loadSubject();
    await kafkaProducer.connect();

    const ok = await kafkaProducer.sendContainerStatus(15, 'OPEN');

    expect(ok).toBe(true);
    expect(mockProducer.send.mock.calls[0][0].topic).toBe(kafkaProducer.TOPICS.CONTAINER_STATUS);
  });

  it('sendContainerStatus should return false when send fails', async () => {
    const kafkaProducer = loadSubject();
    await kafkaProducer.connect();
    mockProducer.send.mockRejectedValue(new Error('status failed'));

    const ok = await kafkaProducer.sendContainerStatus(15, 'OPEN');

    expect(ok).toBe(false);
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
