/**
 * MQTT Broker embarqué (Aedes)
 * Reçoit les données des capteurs IoT sur le topic containers/+/data
 */
const Aedes = require('aedes');
const net = require('net');
const logger = require('../utils/logger');
const config = require('../config/config');

class MqttBroker {
  constructor(mqttHandler) {
    this.mqttHandler = mqttHandler;
    this.aedes = new Aedes();
    this.server = null;
    this._setupEvents();
  }

  /**
   * Configure les événements du broker
   */
  _setupEvents() {
    this.aedes.on('client', (client) => {
      logger.info({ clientId: client.id }, 'MQTT client connected');
    });

    this.aedes.on('clientDisconnect', (client) => {
      logger.info({ clientId: client.id }, 'MQTT client disconnected');
    });

    this.aedes.on('publish', async (packet, client) => {
      // Ignorer les messages système ($SYS) et les messages sans client
      if (!client || packet.topic.startsWith('$SYS')) return;

      logger.info({
        topic: packet.topic,
        clientId: client.id,
        payloadSize: packet.payload.length
      }, 'MQTT message received');

      try {
        await this.mqttHandler.handleMessage(packet.topic, packet.payload);
      } catch (err) {
        logger.error({ error: err.message, topic: packet.topic }, 'Error processing MQTT message');
      }
    });

    this.aedes.on('subscribe', (subscriptions, client) => {
      if (client) {
        logger.info({
          clientId: client.id,
          topics: subscriptions.map(s => s.topic)
        }, 'MQTT client subscribed');
      }
    });
  }

  /**
   * Démarre le broker MQTT sur le port configuré
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer(this.aedes.handle);

      this.server.listen(config.MQTT.port, config.MQTT.host, () => {
        logger.info({
          port: config.MQTT.port,
          host: config.MQTT.host
        }, 'MQTT Broker started');
        resolve();
      });

      this.server.on('error', (err) => {
        logger.error({ error: err.message }, 'MQTT Broker error');
        reject(err);
      });
    });
  }

  /**
   * Arrête proprement le broker
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.aedes.close(() => {
          this.server.close(() => {
            logger.info('MQTT Broker stopped');
            resolve();
          });
        });
      });
    }
  }

  /**
   * Publie un message sur un topic (pour notifications internes)
   */
  publish(topic, payload) {
    this.aedes.publish({
      topic,
      payload: Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload)),
      qos: 1,
      retain: false
    });
  }

  getAedes() {
    return this.aedes;
  }
}

module.exports = MqttBroker;
