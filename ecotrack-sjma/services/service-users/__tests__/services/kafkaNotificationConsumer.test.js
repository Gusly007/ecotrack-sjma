var mockConsumer;
var mockKafka;

jest.mock('kafkajs', () => ({
  Kafka: jest.fn(() => {
    mockConsumer = {
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
      disconnect: jest.fn(),
    };

    mockKafka = {
      consumer: jest.fn(() => mockConsumer),
    };

    return mockKafka;
  }),
}));

jest.mock('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import consumerApi, {
  connectKafkaConsumer,
  disconnectKafkaConsumer,
  isKafkaRunning,
  onAlert,
  onNotification,
} from '../../src/services/kafkaNotificationConsumer.js';

describe('kafkaNotificationConsumer', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockConsumer.connect.mockResolvedValue(undefined);
    mockConsumer.subscribe.mockResolvedValue(undefined);
    mockConsumer.run.mockResolvedValue(undefined);
    mockConsumer.disconnect.mockResolvedValue(undefined);
    onAlert(null);
    onNotification(null);
    await disconnectKafkaConsumer();
  });

  it('connects, subscribes and starts consumer run', async () => {
    await connectKafkaConsumer();

    expect(mockConsumer.connect).toHaveBeenCalled();
    expect(mockConsumer.subscribe).toHaveBeenCalled();
    expect(mockConsumer.run).toHaveBeenCalled();
    expect(isKafkaRunning()).toBe(true);
    expect(consumerApi.isRunning()).toBe(true);
  });

  it('dispatches alerts and notifications through handlers', async () => {
    const alertHandler = jest.fn();
    const notifHandler = jest.fn();
    onAlert(alertHandler);
    onNotification(notifHandler);

    await connectKafkaConsumer();
    const eachMessage = mockConsumer.run.mock.calls[0][0].eachMessage;

    await eachMessage({
      topic: 'ecotrack.alerts',
      partition: 1,
      message: { value: Buffer.from(JSON.stringify({ alert: { id: 1 }, timestamp: 't1' })) },
    });

    await eachMessage({
      topic: 'ecotrack.notifications',
      partition: 2,
      message: { value: Buffer.from(JSON.stringify({ type: 'INFO', timestamp: 't2' })) },
    });

    expect(alertHandler).toHaveBeenCalledWith({ id: 1 }, expect.objectContaining({ topic: 'ecotrack.alerts' }));
    expect(notifHandler).toHaveBeenCalledWith(expect.objectContaining({ type: 'INFO' }), expect.objectContaining({ topic: 'ecotrack.notifications' }));
  });

  it('handles bad payload JSON without throwing', async () => {
    await connectKafkaConsumer();
    const eachMessage = mockConsumer.run.mock.calls[0][0].eachMessage;

    await expect(eachMessage({
      topic: 'ecotrack.alerts',
      partition: 1,
      message: { value: Buffer.from('{bad') },
    })).resolves.toBeUndefined();
  });

  it('keeps stopped state when connect fails', async () => {
    mockConsumer.connect.mockRejectedValueOnce(new Error('kafka down'));

    await connectKafkaConsumer();

    expect(isKafkaRunning()).toBe(false);
  });

  it('disconnects cleanly and handles disconnect errors', async () => {
    await connectKafkaConsumer();
    await disconnectKafkaConsumer();
    expect(isKafkaRunning()).toBe(false);

    await connectKafkaConsumer();
    mockConsumer.disconnect.mockRejectedValueOnce(new Error('cannot disconnect'));
    await disconnectKafkaConsumer();
    expect(isKafkaRunning()).toBe(true);
  });
});
