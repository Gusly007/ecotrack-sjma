const socketIO = require('socket.io');
const logger = require('../utils/logger');

class SocketService {
    constructor(server) {
        logger.info('Socket.IO initialization');
        
        // Configuration CORS basée sur l'environnement
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3011'];
        
        this.io = socketIO(server, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST']
            },
            transports: ['websocket', 'polling']
        });
        logger.info('Socket.IO ready');
        this.setupConnections();
    }

    setupConnections() {
        this.io.on('connection', (socket) => {
            logger.info({ socketId: socket.id }, 'Socket client connected');

            // Le client s'abonne à une zone
            socket.on('subscribe-zone', (data) => {
                // Accepte soit un objet { id_zone: 1 } soit un entier direct
                const idZone = data.id_zone || data;
                const roomName = `zone-${idZone}`;
                socket.join(roomName);
                logger.info({ socketId: socket.id, room: roomName }, 'Socket client joined room');
            });

            // Le client se désabonne d'une zone
            socket.on('unsubscribe-zone', (data) => {
                // Accepte soit un objet { id_zone: 1 } soit un entier direct
                const idZone = data.id_zone || data;
                const roomName = `zone-${idZone}`;
                socket.leave(roomName);
                logger.info({ socketId: socket.id, room: roomName }, 'Socket client left room');
            });

            socket.on('disconnect', () => {
                logger.info({ socketId: socket.id }, 'Socket client disconnected');
            });

            socket.on('error', (error) => {
                logger.error({ error: String(error) }, 'Socket error');
            });
        });
    }

    /**
     * Émet un événement de changement de statut à une zone spécifique
     */
    emitStatusChange(idZone, containerData) {
        const roomName = `zone-${idZone}`;
        this.io.to(roomName).emit('container:status-changed', {
            id_conteneur: containerData.id_conteneur,
            uid: containerData.uid,
            ancien_statut: containerData.ancien_statut,
            nouveau_statut: containerData.statut,
            date_changement: new Date().toISOString(),
            id_zone: idZone
        });
        logger.info({
            containerId: containerData.id_conteneur,
            zoneId: idZone
        }, 'Socket status change emitted');
    }

    /**
     * Émet un événement à tous les clients
     */
    emit(event, data) {
        this.io.emit(event, data);
    }

    /**
     * Émet un événement à une room spécifique
     */
    emitToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }

    getIO() {
        return this.io;
    }
}

module.exports = SocketService;