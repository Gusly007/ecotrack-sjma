/**
 * Tests Unitaires - Socket Middleware
 * Tests du middleware d'injection Socket.IO
 */

const socketMiddleware = require('../../../src/middleware/socket-middleware');

describe('Socket Middleware - Unit Tests', () => {
  let mockReq, mockRes, mockNext, mockSocketService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSocketService = {
      emitStatusChange: jest.fn()
    };

    mockReq = {
      app: {
        locals: {
          socketService: mockSocketService
        }
      }
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('devrait injecter le socketService dans la requête', () => {
    socketMiddleware(mockReq, mockRes, mockNext);

    expect(mockReq.socketService).toBe(mockSocketService);
  });

  it('devrait définir socketReady à true quand socketService existe', () => {
    socketMiddleware(mockReq, mockRes, mockNext);

    expect(mockReq.socketReady).toBe(true);
  });

  it('devrait appeler next() après injection', () => {
    socketMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('devrait gérer l\'absence de socketService gracieusement', () => {
    mockReq.app.locals.socketService = null;

    socketMiddleware(mockReq, mockRes, mockNext);

    expect(mockReq.socketService).toBeNull();
    expect(mockNext).toHaveBeenCalled();
  });
});
