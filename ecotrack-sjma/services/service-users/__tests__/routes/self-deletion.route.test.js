jest.mock('../../src/middleware/auth.js', () => {
  const actual = jest.requireActual('../../src/middleware/auth.js');
  return {
    __esModule: true,
    ...actual,
    authenticateToken: (req, res, next) => {
      req.user = { id: 42, role: req.headers['x-test-role'] };
      next();
    },
  };
});

jest.mock('../../src/config/rateLimit.js', () => ({
  __esModule: true,
  publicLimiter: (req, res, next) => next(),
}));

jest.mock('../../src/services/userService.js', () => ({
  __esModule: true,
  requestAccountDeletion: jest.fn(),
}));

jest.mock('../../src/services/gdprService.js', () => ({
  __esModule: true,
  requestAccountDeletion: jest.fn(),
}));

jest.mock('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import express from 'express';
import request from 'supertest';
import usersRouter from '../../src/routes/users.js';
import gdprRouter from '../../src/routes/gdpr.route.js';
import * as userService from '../../src/services/userService.js';
import * as gdprService from '../../src/services/gdprService.js';

const app = express();
app.use(express.json());
app.use('/users', usersRouter);
app.use('/users', gdprRouter);

const selfDeletionRoutes = [
  { name: 'DELETE /users/me', send: (role) => request(app).delete('/users/me').set('x-test-role', role).send({ password: 'password123' }) },
  { name: 'POST /users/me/delete', send: (role) => request(app).post('/users/me/delete').set('x-test-role', role).send({ password: 'password123' }) },
];

describe('self-deletion is reserved to citizens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userService.requestAccountDeletion.mockResolvedValue({ message: 'ok' });
    gdprService.requestAccountDeletion.mockResolvedValue({ message: 'ok' });
  });

  describe.each(selfDeletionRoutes)('$name', ({ send }) => {
    it.each(['AGENT', 'GESTIONNAIRE', 'ADMIN'])('refuses %s with 403 and leaves the account untouched', async (role) => {
      const res = await send(role);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/administrateur/);
      expect(userService.requestAccountDeletion).not.toHaveBeenCalled();
      expect(gdprService.requestAccountDeletion).not.toHaveBeenCalled();
    });

    it('lets a citizen request deletion', async () => {
      const res = await send('CITOYEN');

      expect(res.status).toBe(200);
      const calls = userService.requestAccountDeletion.mock.calls.length
        + gdprService.requestAccountDeletion.mock.calls.length;
      expect(calls).toBe(1);
    });
  });
});
