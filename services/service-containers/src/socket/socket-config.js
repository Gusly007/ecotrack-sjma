const socketIo = require('socket.io');

const initializeSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        socket.on('message', (data) => {
            io.emit('message', data);
        });
    });

    return io;
};

module.exports = initializeSocket;