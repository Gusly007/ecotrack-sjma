'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketNotifService {
  constructor(httpServer) {
    const allowedOrigin = process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_URL || 'http://localhost:5173')
      : true;

    this.io = new Server(httpServer, {
      cors: { origin: allowedOrigin, credentials: true },
      path: '/ws/notifications',
      pingInterval: 25000,
      pingTimeout: 60000,
      upgradeTimeout: 10000,
    });

    this._setupMiddleware();
    this._setupHandlers();
  }

  _setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Token requis'));
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'change_me_in_production_access_secret'
        );
        socket.userId = decoded.id || decoded.id_utilisateur;
        socket.userRole = decoded.role || decoded.role_par_defaut || 'UNKNOWN';
        next();
      } catch {
        next(new Error('Token invalide'));
      }
    });
  }

  _setupHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`[WS-Notif] ${socket.userRole} #${socket.userId} connecté (${socket.id})`);
      socket.join(`user:${socket.userId}`);

      socket.on('disconnect', () => {
        logger.info(`[WS-Notif] User #${socket.userId} déconnecté`);
      });
    });
  }

  /**
   * Émet un événement notification:new au room de l'utilisateur cible.
   * @param {number} userId
   * @param {object} notification
   */
  emitToUser(userId, notification) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('notification:new', notification);
    logger.debug({ userId, notifId: notification?.id_notification }, '[WS-Notif] notification:new émis');
  }
}

let instance = null;

function createWebSocketNotifService(httpServer) {
  instance = new WebSocketNotifService(httpServer);
  return instance;
}

function getWebSocketNotifService() {
  return instance;
}

module.exports = { createWebSocketNotifService, getWebSocketNotifService };
