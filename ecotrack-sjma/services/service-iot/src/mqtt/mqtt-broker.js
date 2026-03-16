/**
 * MQTT Broker embarqué (Aedes)
 * Reçoit les données des capteurs IoT sur le topic containers/+/data
 * Supporte TLS et authentification pour production
 */
const Aedes = require('aedes');
const net = require('net');
const tls = require('tls');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../config/config');

class MqttBroker {
  constructor(mqttHandler) {
    this.mqttHandler = mqttHandler;
    this.aedes = new Aedes();
    this.server = null;
    this._setupEvents();
    this._setupAuth();
  }

  /**
   * Configure l'authentification MQTT
   */
  _setupAuth() {
    const authEnabled = config.MQTT.auth && config.MQTT.auth.enabled;
    
    if (authEnabled) {
      logger.info('MQTT authentication enabled');
      
      this.aedes.authenticate = (client, username, password, callback) => {
        const expectedUser = config.MQTT.auth.username;
        const expectedPass = config.MQTT.auth.password;
        const providedPass = password ? password.toString() : '';
        
        if (username === expectedUser && providedPass === expectedPass) {
          logger.info({ clientId: client.id, username }, 'MQTT client authenticated');
          callback(null, true);
        } else {
          logger.warn({ clientId: client.id, username }, 'MQTT authentication failed');
          callback(new Error('Authentication failed'), false);
        }
      };
    } else {
      logger.info('MQTT authentication disabled');
      this.aedes.authenticate = (client, username, password, callback) => {
        callback(null, true);
      };
    }
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
   * Supporte TLS si configuré
   */
  start() {
    return new Promise((resolve, reject) => {
      const useTls = config.MQTT.tls && config.MQTT.tls.enabled;
      const authEnabled = config.MQTT.auth && config.MQTT.auth.enabled;
      
      if (useTls) {
        logger.info('Starting MQTT Broker with TLS');
        
        const tlsOptions = {
          key: fs.readFileSync(config.MQTT.tls.keyPath),
          cert: fs.readFileSync(config.MQTT.tls.certPath),
          ca: config.MQTT.tls.caPath ? fs.readFileSync(config.MQTT.tls.caPath) : undefined,
          requestCert: config.MQTT.tls.requestCert || false,
          rejectUnauthorized: config.MQTT.tls.rejectUnauthorized || false
        };

        this.server = tls.createServer(tlsOptions, this.aedes.handle);
      } else {
        logger.info('Starting MQTT Broker (no TLS)');
        this.server = net.createServer(this.aedes.handle);
      }

      this.server.listen(config.MQTT.port, config.MQTT.host, () => {
        logger.info({
          port: config.MQTT.port,
          host: config.MQTT.host,
          tls: useTls,
          auth: authEnabled
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
