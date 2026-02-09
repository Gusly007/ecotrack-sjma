const socketIO = require('socket.io');

class SocketService {
    constructor(server) {
        console.log('[Socket] Initialisation de Socket.IO...');
        
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
        console.log('[Socket] Socket.IO initialisé avec succès');
        this.setupConnections();
    }

    setupConnections() {
        this.io.on('connection', (socket) => {
            console.log(`[Socket] Client connected: ${socket.id}`);

            // Le client s'abonne à une zone
            socket.on('subscribe-zone', (data) => {
                // Accepte soit un objet { id_zone: 1 } soit un entier direct
                const idZone = data.id_zone || data;
                const roomName = `zone-${idZone}`;
                socket.join(roomName);
                console.log(`[Socket] Client ${socket.id} joined room: ${roomName}`);
            });

            // Le client se désabonne d'une zone
            socket.on('unsubscribe-zone', (data) => {
                // Accepte soit un objet { id_zone: 1 } soit un entier direct
                const idZone = data.id_zone || data;
                const roomName = `zone-${idZone}`;
                socket.leave(roomName);
                console.log(`[Socket] Client ${socket.id} left room: ${roomName}`);
            });

            socket.on('disconnect', () => {
                console.log(`[Socket] Client disconnected: ${socket.id}`);
            });

            socket.on('error', (error) => {
                console.error(`[Socket] Error: ${error}`);
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
        console.log(`[Socket] Emitted status change for container ${containerData.id_conteneur} in zone ${idZone}`);
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