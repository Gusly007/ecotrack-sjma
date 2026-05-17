'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { ADMIN_NOTIF_TYPES, PRIORITES } = require('./adminNotificationService');

class WebSocketAdminService {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      },
      path: '/ws/admin'
    });

    this.adminClients = new Map();
    this.setupMiddleware();
    this.setupHandlers();
  }

  setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token requis'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_me_in_production_access_secret');
        if (decoded.role !== 'ADMIN' && decoded.role_par_defaut !== 'ADMIN') {
          return next(new Error('Accès admin requis'));
        }
        socket.user = decoded;
        next();
      } catch (error) {
        next(new Error('Token invalide'));
      }
    });
  }

  setupHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Admin connecté: ${socket.id} (${socket.user.email || socket.user.id})`);
      this.adminClients.set(socket.id, socket.user);

      socket.join('admin:all');
      socket.join(`admin:user:${socket.user.id}`);

      socket.on('subscribe:priority', (priority) => {
        if (Object.values(PRIORITES).includes(priority)) {
          socket.join(`admin:priority:${priority}`);
          logger.info(`${socket.id} abonné à priorité ${priority}`);
        }
      });

      socket.on('subscribe:category', (category) => {
        socket.join(`admin:category:${category}`);
        logger.info(`${socket.id} abonné à catégorie ${category}`);
      });

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', () => {
        logger.info(`Admin déconnecté: ${socket.id}`);
        this.adminClients.delete(socket.id);
      });
    });
  }

  emitAdminNotification(notification) {
    if (!this.io) return;

    const event = 'admin:notification';

    this.io.to(`admin:user:${notification.id_utilisateur}`).emit(event, notification);

    if (notification.priorite <= PRIORITES.HAUTE) {
      this.io.to('admin:all').emit(event, notification);
    }

    this.io.to(`admin:priority:${notification.priorite}`).emit(event, notification);
    if (notification.categorie) {
      this.io.to(`admin:category:${notification.categorie}`).emit(event, notification);
    }

    if (notification.priorite === PRIORITES.URGENT) {
      this.io.to('admin:all').emit('admin:urgent', notification);
    }

    logger.debug({
      id_notification: notification.id_notification,
      priorite: notification.priorite,
      categorie: notification.categorie
    }, 'Notification admin émise via WebSocket');
  }

  emitAlert(data) {
    if (!this.io) return;
    this.io.to('admin:all').emit('admin:alert', data);
  }

  emitStatsUpdate(stats) {
    if (!this.io) return;
    this.io.to('admin:all').emit('admin:stats', stats);
  }

  getConnectedAdminsCount() {
    return this.adminClients.size;
  }

  broadcast(event, data) {
    if (!this.io) return;
    this.io.to('admin:all').emit(event, data);
  }
}

let instance = null;

function createWebSocketAdminService(httpServer) {
  instance = new WebSocketAdminService(httpServer);
  return instance;
}

function getWebSocketAdminService() {
  return instance;
}

module.exports = { createWebSocketAdminService, getWebSocketAdminService, WebSocketAdminService };
