/**
 * Tests Unitaires - Socket Middleware
 * Tests du middleware d'injection Socket.IO
 */

const socketMiddleware = require('../../src/middleware/socket-middleware');
const DI = require('../../src/container-di');
const ContainerController = require('../../src/controllers/container-controller');

jest.mock('../../src/container-di');
jest.mock('../../src/controllers/container-controller');

describe('Socket Middleware - Unit Tests', () => {
  let mockReq, mockRes, mockNext, mockSocketService, mockService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSocketService = {
      emitStatusChange: jest.fn()
    };

    mockService = jest.fn();

    mockReq = {
      app: {
        locals: {
          socketService: mockSocketService
        }
      }
    };
    mockRes = {};
    mockNext = jest.fn();

    DI.createContainerService.mockReturnValue(mockService);
  });

  it('devrait créer un service de conteneur avec socketService', () => {
    socketMiddleware(mockReq, mockRes, mockNext);

    expect(DI.createContainerService).toHaveBeenCalledWith(mockSocketService);
  });

  it('devrait créer un controlleur de conteneur avec le service', () => {
    socketMiddleware(mockReq, mockRes, mockNext);

    expect(ContainerController).toHaveBeenCalledWith(mockService);
  });

  it('devrait attacher le controlleur à req.containerController', () => {
    const mockController = jest.fn();
    ContainerController.mockImplementation(() => mockController);

    socketMiddleware(mockReq, mockRes, mockNext);

    expect(mockReq.containerController).toBe(mockController);
  });

  it('devrait appeler next() après injection', () => {
    socketMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
