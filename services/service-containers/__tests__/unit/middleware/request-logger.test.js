/**
 * Tests Unitaires - Request Logger Middleware
 * Tests du middleware de logging des requêtes
 */

const requestLogger = require('../../../src/middleware/request-logger');

describe('Request Logger Middleware - Unit Tests', () => {
  let mockReq, mockRes, mockNext;
  let finishCallback;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/containers'
    };
    mockRes = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      })
    };
    mockNext = jest.fn();
    
    // Mock console.log
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('devrait appeler next() pour passer au middleware suivant', () => {
    requestLogger(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('devrait enregistrer le listener finish sur la réponse', () => {
    requestLogger(mockReq, mockRes, mockNext);

    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('devrait logger au moment de la fin de la réponse', () => {
    requestLogger(mockReq, mockRes, mockNext);
    
    // Appeler le callback finish
    finishCallback();

    expect(console.log).toHaveBeenCalled();
    const logMessage = console.log.mock.calls[0][0];
    expect(logMessage).toContain('GET');
    expect(logMessage).toContain('/api/containers');
    expect(logMessage).toContain('200');
  });

  it('devrait inclure la durée en millisecondes', () => {
    requestLogger(mockReq, mockRes, mockNext);
    finishCallback();

    const logMessage = console.log.mock.calls[0][0];
    expect(logMessage).toMatch(/\[\d+ms\]/);
  });

  it('devrait gérer différents codes de statut', () => {
    mockRes.statusCode = 404;
    requestLogger(mockReq, mockRes, mockNext);
    finishCallback();

    const logMessage = console.log.mock.calls[0][0];
    expect(logMessage).toContain('404');
  });

  it('devrait inclure un indicateur de statut (emoji)', () => {
    requestLogger(mockReq, mockRes, mockNext);
    finishCallback();

    const logMessage = console.log.mock.calls[0][0];
    expect(logMessage).toContain('✅');
  });

  it('devrait afficher un avertissement pour les erreurs 4xx/5xx', () => {
    mockRes.statusCode = 500;
    requestLogger(mockReq, mockRes, mockNext);
    finishCallback();

    const logMessage = console.log.mock.calls[0][0];
    expect(logMessage).toContain('⚠️');
  });
});
