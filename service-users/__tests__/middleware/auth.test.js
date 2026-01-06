import { authenticateToken, authorizeRole } from '../../src/middleware/auth.js';
import * as jwt from '../../src/utils/jwt.js';
jest.mock('../../src/utils/jwt.js');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            user: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('authenticateToken', () => {
        it('should return 401 if no token provided', () => {
            authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if authorization header missing', () => {
            req.headers.authorization = '';
            authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should verify token and call next on success', () => {
            const decoded = { id: 1, role: 'user' };
            jwt.verifyToken.mockReturnValue(decoded);
            req.headers.authorization = 'Bearer validtoken';
            authenticateToken(req, res, next);
            expect(req.user).toEqual(decoded);
            expect(next).toHaveBeenCalled();
        });

        it('should return 403 if token is invalid', () => {
            jwt.verifyToken.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            req.headers.authorization = 'Bearer invalidtoken';
            authenticateToken(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        });
    });

    describe('authorizeRole', () => {
        it('should return 401 if user not authenticated', () => {
            const middleware = authorizeRole(['admin']);
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 403 if user role not in allowed roles', () => {
            req.user = { id: 1, role: 'user' };
            const middleware = authorizeRole(['admin']);
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
        });

        it('should call next if user role is allowed', () => {
            req.user = { id: 1, role: 'admin' };
            const middleware = authorizeRole(['admin', 'moderator']);
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should handle multiple allowed roles', () => {
            req.user = { id: 1, role: 'moderator' };
            const middleware = authorizeRole(['admin', 'moderator']);
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});