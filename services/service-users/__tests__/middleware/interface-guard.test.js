/**
 * Tests Unitaires - Interface Guard Middleware
 */

const { requireInterface, requireDesktop, requireMobile } = require('../../src/middleware/interface-guard');
const { isMobileRole, isDesktopRole } = require('../../src/utils/permissions');

jest.mock('../../src/utils/permissions', () => ({
    isMobileRole: jest.fn(),
    isDesktopRole: jest.fn()
}));

describe('Interface Guard Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            user: null
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    describe('requireInterface', () => {
        it('devrait retourner 401 si utilisateur non authentifié', async () => {
            const middleware = requireInterface('mobile');

            await middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait retourner 403 si le rôle nest pas autorisé pour linterface', async () => {
            mockReq.user = { role: 'CITOYEN' };
            isMobileRole.mockReturnValue(false);
            isDesktopRole.mockReturnValue(false);

            const middleware = requireInterface('desktop');

            await middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('desktop'),
                currentRole: 'CITOYEN'
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait autoriser laccès mobile pour CITOYEN', async () => {
            mockReq.user = { role: 'CITOYEN' };
            isMobileRole.mockReturnValue(true);

            const middleware = requireInterface('mobile');

            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('devrait autoriser laccès mobile pour AGENT', async () => {
            mockReq.user = { role: 'AGENT' };
            isMobileRole.mockReturnValue(true);

            const middleware = requireInterface('mobile');

            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait autoriser laccès desktop pour GESTIONNAIRE', async () => {
            mockReq.user = { role: 'GESTIONNAIRE' };
            isDesktopRole.mockReturnValue(true);

            const middleware = requireInterface('desktop');

            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait autoriser laccès desktop pour ADMIN', async () => {
            mockReq.user = { role: 'ADMIN' };
            isDesktopRole.mockReturnValue(true);

            const middleware = requireInterface('desktop');

            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait refuser CITOYEN pour interface desktop', async () => {
            mockReq.user = { role: 'CITOYEN' };
            isMobileRole.mockReturnValue(true);
            isDesktopRole.mockReturnValue(false);

            const middleware = requireInterface('desktop');

            await middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait refuser ADMIN pour interface mobile', async () => {
            mockReq.user = { role: 'ADMIN' };
            isMobileRole.mockReturnValue(false);
            isDesktopRole.mockReturnValue(true);

            const middleware = requireInterface('mobile');

            await middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireDesktop', () => {
        it('devrait autoriser GESTIONNAIRE', async () => {
            mockReq.user = { role: 'GESTIONNAIRE' };
            isDesktopRole.mockReturnValue(true);

            await requireDesktop(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait autoriser ADMIN', async () => {
            mockReq.user = { role: 'ADMIN' };
            isDesktopRole.mockReturnValue(true);

            await requireDesktop(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait refuser CITOYEN', async () => {
            mockReq.user = { role: 'CITOYEN' };
            isDesktopRole.mockReturnValue(false);

            await requireDesktop(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('desktop')
            }));
        });

        it('devrait refuser AGENT', async () => {
            mockReq.user = { role: 'AGENT' };
            isDesktopRole.mockReturnValue(false);

            await requireDesktop(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('devrait retourner 401 si pas dauthentification', async () => {
            await requireDesktop(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });

    describe('requireMobile', () => {
        it('devrait autoriser CITOYEN', async () => {
            mockReq.user = { role: 'CITOYEN' };
            isMobileRole.mockReturnValue(true);

            await requireMobile(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait autoriser AGENT', async () => {
            mockReq.user = { role: 'AGENT' };
            isMobileRole.mockReturnValue(true);

            await requireMobile(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait refuser GESTIONNAIRE', async () => {
            mockReq.user = { role: 'GESTIONNAIRE' };
            isMobileRole.mockReturnValue(false);

            await requireMobile(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('mobile')
            }));
        });

        it('devrait refuser ADMIN', async () => {
            mockReq.user = { role: 'ADMIN' };
            isMobileRole.mockReturnValue(false);

            await requireMobile(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('devrait retourner 401 si pas dauthentification', async () => {
            await requireMobile(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });
});
