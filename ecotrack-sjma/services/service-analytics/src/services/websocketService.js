const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketService {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    this.clients = new Map();
    this.setupMiddleware();
    this.setupHandlers();
  }

  setupMiddleware() {
    // Authentification WebSocket
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  setupHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id} (${socket.user.email})`);
      this.clients.set(socket.id, socket.user);

      // Abonner aux mises à jour du dashboard
      socket.on('subscribe:dashboard', () => {
        socket.join('dashboard');
        logger.info(`${socket.id} subscribed to dashboard`);
        
        // Envoyer les données initiales
        this._sendDashboardUpdate(socket);
      });

      // Abonner aux alertes
      socket.on('subscribe:alerts', () => {
        socket.join('alerts');
        logger.info(`${socket.id} subscribed to alerts`);
      });

      // Abonner à un conteneur spécifique
      socket.on('subscribe:container', (containerId) => {
        socket.join(`container:${containerId}`);
        logger.info(`${socket.id} subscribed to container ${containerId}`);
      });

      // Ping/Pong pour keep-alive
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        this.clients.delete(socket.id);
      });
    });

    logger.info('WebSocket handlers configured');
  }

  async _sendDashboardUpdate(socket) {
    try {
      const DashboardService = require('./dashboardService');
      const data = await DashboardService.getDashboardData('day');
      socket.emit('dashboard:update', data);
    } catch (error) {
      logger.error('Error sending dashboard update:', error);
    }
  }

  /**
   * Émettre une mise à jour du dashboard
   */
  emitDashboardUpdate(data) {
    this.io.to('dashboard').emit('dashboard:update', data);
    logger.info('Dashboard update broadcasted');
  }

  /**
   * Émettre une nouvelle alerte
   */
  emitAlert(alert) {
    this.io.to('alerts').emit('alert:new', alert);
    logger.warn(`Alert broadcasted: ${alert.type}`);
  }

  /**
   * Émettre une mise à jour de conteneur
   */
  emitContainerUpdate(containerId, data) {
    this.io.to(`container:${containerId}`).emit('container:update', data);
  }

  /**
   * Broadcast à tous les clients
   */
  broadcast(event, data) {
    this.io.emit(event, data);
    logger.info(`Broadcasted ${event} to all clients`);
  }

  /**
   * Get connected clients count
   */
  getClientsCount() {
    return this.clients.size;
  }
}

module.exports = WebSocketService;