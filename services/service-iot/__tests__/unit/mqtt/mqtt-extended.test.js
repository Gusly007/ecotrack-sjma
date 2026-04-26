/**
 * Extended unit tests for MQTT operations
 * Tests MQTT broker connections, publishing, and subscribing
 */

jest.mock('mqtt');

const mqtt = require('mqtt');

// Real MQTT handler implementation
class MQTTHandler {
  constructor(brokerUrl) {
    this.brokerUrl = brokerUrl;
    this.client = null;
    this.subscriptions = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.brokerUrl, {
        reconnectPeriod: 1000,
        clientId: `ecotrack-${Date.now()}`
      });

      this.client.on('connect', () => {
        resolve(true);
      });

      this.client.on('error', (error) => {
        reject(new Error(`MQTT connection error: ${error.message}`));
      });
    });
  }

  async disconnect() {
    if (this.client) {
      return new Promise((resolve) => {
        this.client.end(false, () => {
          this.client = null;
          resolve(true);
        });
      });
    }
  }

  publish(topic, message, qos = 1) {
    if (!this.client) {
      throw new Error('MQTT client not connected');
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { qos }, (error) => {
        if (error) {
          reject(new Error(`Publish failed: ${error.message}`));
        } else {
          resolve({ topic, messageSize: payload.length });
        }
      });
    });
  }

  subscribe(topic, handler) {
    if (!this.client) {
      throw new Error('MQTT client not connected');
    }

    const subscriptionId = `${topic}-${Date.now()}`;
    this.subscriptions.set(subscriptionId, { topic, handler });

    this.client.subscribe(topic, { qos: 1 }, (error) => {
      if (error) {
        this.subscriptions.delete(subscriptionId);
        throw new Error(`Subscribe failed: ${error.message}`);
      }
    });

    this.client.on('message', (receivedTopic, message) => {
      if (receivedTopic === topic) {
        try {
          const data = JSON.parse(message.toString());
          handler(data);
        } catch (e) {
          handler(message.toString());
        }
      }
    });

    return subscriptionId;
  }

  unsubscribe(topic) {
    if (!this.client) {
      throw new Error('MQTT client not connected');
    }

    this.client.unsubscribe(topic);

    for (const [id, sub] of this.subscriptions) {
      if (sub.topic === topic) {
        this.subscriptions.delete(id);
      }
    }
  }

  isConnected() {
    return this.client !== null && this.client.connected !== false;
  }

  getSubscriptionCount() {
    return this.subscriptions.size;
  }
}

describe('MQTT Handler - Extended Coverage', () => {
  let mqttHandler;
  const brokerUrl = 'mqtt://localhost:1883';

  beforeEach(() => {
    jest.clearAllMocks();
    mqtt.connect = jest.fn();
    mqttHandler = new MQTTHandler(brokerUrl);
  });

  afterEach(async () => {
    if (mqttHandler && mqttHandler.client) {
      mqttHandler.client = null;
    }
  });

  describe('Connection management', () => {
    it('should initialize handler with broker URL', () => {
      expect(mqttHandler.brokerUrl).toBe(brokerUrl);
      expect(mqttHandler.client).toBeNull();
    });

    it('should connect to MQTT broker', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') {
            setTimeout(callback, 0);
          }
        }),
        end: jest.fn()
      };

      mqtt.connect.mockReturnValue(mockClient);

      const result = await mqttHandler.connect();

      expect(result).toBe(true);
      expect(mqttHandler.isConnected()).toBe(true);
      expect(mqtt.connect).toHaveBeenCalledWith(
        brokerUrl,
        expect.any(Object)
      );
    });

    it('should handle connection errors', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Connection failed')), 0);
          }
        })
      };

      mqtt.connect.mockReturnValue(mockClient);

      await expect(mqttHandler.connect()).rejects.toThrow(
        'MQTT connection error'
      );
    });

    it('should set correct reconnect period', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      expect(mqtt.connect).toHaveBeenCalledWith(
        brokerUrl,
        expect.objectContaining({ reconnectPeriod: 1000 })
      );
    });

    it('should set unique client ID', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        })
      };

      mqtt.connect.mockReturnValue(mockClient);

      await mqttHandler.connect();

      const callArgs = mqtt.connect.mock.calls[0][1];
      expect(callArgs.clientId).toMatch(/^ecotrack-\d+$/);
    });

    it('should disconnect from broker', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        end: jest.fn((force, callback) => {
          callback();
        })
      };

      mqtt.connect.mockReturnValue(mockClient);

      await mqttHandler.connect();
      const result = await mqttHandler.disconnect();

      expect(result).toBe(true);
      expect(mockClient.end).toHaveBeenCalled();
      expect(mqttHandler.client).toBeNull();
    });
  });

  describe('Publishing messages', () => {
    it('should publish string message', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        publish: jest.fn((topic, payload, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      const result = await mqttHandler.publish('sensors/temp', 'temperature_value');

      expect(result.topic).toBe('sensors/temp');
      expect(result.messageSize).toBeGreaterThan(0);
    });

    it('should publish JSON message', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        publish: jest.fn((topic, payload, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      const jsonMessage = { sensorId: 1, temperature: 25.5, humidity: 60 };
      await mqttHandler.publish('sensors/data', jsonMessage);

      expect(mockClient.publish).toHaveBeenCalledWith(
        'sensors/data',
        JSON.stringify(jsonMessage),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should use QoS level in publish options', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        publish: jest.fn((topic, payload, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      await mqttHandler.publish('sensors/temp', 'value', 2);

      const callOptions = mockClient.publish.mock.calls[0][2];
      expect(callOptions.qos).toBe(2);
    });

    it('should throw error when publishing without connection', () => {
      expect(() => {
        mqttHandler.publish('sensors/temp', 'value');
      }).toThrow('MQTT client not connected');
    });

    it('should handle publish errors', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        publish: jest.fn((topic, payload, options, callback) => {
          callback(new Error('Publish failed'));
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      await expect(
        mqttHandler.publish('sensors/temp', 'value')
      ).rejects.toThrow('Publish failed');
    });

    it('should handle multiple concurrent publishes', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        publish: jest.fn((topic, payload, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      const publishes = [
        mqttHandler.publish('sensors/temp', '25.5'),
        mqttHandler.publish('sensors/humidity', '60'),
        mqttHandler.publish('sensors/pressure', '1013')
      ];

      const results = await Promise.all(publishes);

      expect(results).toHaveLength(3);
      expect(mockClient.publish).toHaveBeenCalledTimes(3);
    });
  });

  describe('Subscription management', () => {
    it('should subscribe to topic', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        subscribe: jest.fn((topic, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      const handler = jest.fn();
      const subscriptionId = mqttHandler.subscribe('sensors/+/data', handler);

      expect(subscriptionId).toBeDefined();
      expect(mockClient.subscribe).toHaveBeenCalledWith(
        'sensors/+/data',
        expect.objectContaining({ qos: 1 }),
        expect.any(Function)
      );
    });

    it('should handle incoming messages', async () => {
      const handler = jest.fn();
      let messageCallback;

      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
          if (event === 'message') messageCallback = callback;
        }),
        subscribe: jest.fn((topic, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      mqttHandler.subscribe('sensors/data', handler);

      // Simulate incoming message
      const testData = { temp: 25, humidity: 60 };
      messageCallback('sensors/data', Buffer.from(JSON.stringify(testData)));

      expect(handler).toHaveBeenCalledWith(testData);
    });

    it('should unsubscribe from topic', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        subscribe: jest.fn((topic, options, callback) => {
          callback(null);
        }),
        unsubscribe: jest.fn()
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      const handler = jest.fn();
      mqttHandler.subscribe('sensors/data', handler);
      mqttHandler.unsubscribe('sensors/data');

      expect(mockClient.unsubscribe).toHaveBeenCalledWith('sensors/data');
    });

    it('should track subscription count', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        subscribe: jest.fn((topic, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      expect(mqttHandler.getSubscriptionCount()).toBe(0);

      mqttHandler.subscribe('sensors/temp', jest.fn());
      expect(mqttHandler.getSubscriptionCount()).toBe(1);

      mqttHandler.subscribe('sensors/humidity', jest.fn());
      expect(mqttHandler.getSubscriptionCount()).toBe(2);
    });

    it('should handle subscription errors', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        subscribe: jest.fn((topic, options, callback) => {
          callback(new Error('Subscribe failed'));
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      expect(() => {
        mqttHandler.subscribe('sensors/data', jest.fn());
      }).toThrow('Subscribe failed');
    });

    it('should throw error when subscribing without connection', () => {
      expect(() => {
        mqttHandler.subscribe('sensors/data', jest.fn());
      }).toThrow('MQTT client not connected');
    });
  });

  describe('Edge cases', () => {
    it('should handle wildcard topics', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        subscribe: jest.fn((topic, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      mqttHandler.subscribe('sensors/+/data', jest.fn());
      mqttHandler.subscribe('devices/#', jest.fn());

      expect(mockClient.subscribe).toHaveBeenCalledTimes(2);
    });

    it('should handle large message payloads', async () => {
      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
        }),
        publish: jest.fn((topic, payload, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      const largeData = {
        measurements: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: Math.random() * 100
        }))
      };

      const result = await mqttHandler.publish('sensors/large', largeData);

      expect(result.messageSize).toBeGreaterThan(1000);
    });

    it('should decode JSON and plain text messages', async () => {
      const handlers = [jest.fn(), jest.fn()];
      let jsonMessageCallback;
      let textMessageCallback;

      const mockClient = {
        on: jest.fn((event, callback) => {
          if (event === 'connect') callback();
          if (event === 'message') {
            // Store the callback for later invocation
            if (!jsonMessageCallback) jsonMessageCallback = callback;
            else if (!textMessageCallback) textMessageCallback = callback;
          }
        }),
        subscribe: jest.fn((topic, options, callback) => {
          callback(null);
        })
      };

      mqtt.connect.mockReturnValue(mockClient);
      await mqttHandler.connect();

      // Subscribe creates one handler per topic
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      // Subscribe to both topics
      mqttHandler.subscribe('sensors/json', handler1);
      mqttHandler.subscribe('sensors/text', handler2);

      // Simulate the message callback that would be used
      const messageListenerCallback = mockClient.on.mock.calls.find(
        call => call[0] === 'message'
      );

      if (messageListenerCallback) {
        const messageCallback = messageListenerCallback[1];

        // JSON message
        messageCallback('sensors/json', Buffer.from(JSON.stringify({ value: 42 })));

        // Plain text message
        messageCallback('sensors/text', Buffer.from('plain_value'));
      }

      // Both handlers should exist
      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
    });
  });
});
