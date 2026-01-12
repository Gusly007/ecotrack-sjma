import { register, login, getProfile, updateProfile, changePassword, getProfileWithStats } from '../../src/controllers/authController';
import * as authService from '../../src/services/authService';
import * as userService from '../../src/services/userService';

jest.mock('../../src/services/authService');
jest.mock('../../src/services/userService');

const mockRequest = (body = {}, user = null) => ({
    body,
    user,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a user and return tokens', async () => {
            const req = mockRequest({ email: 'test@example.com', username: 'test', password: 'password' });
            const res = mockResponse();
            const serviceResult = { accessToken: 'access', refreshToken: 'refresh', user: {} };
            authService.registerUser.mockResolvedValue(serviceResult);

            await register(req, res, mockNext);

            expect(authService.registerUser).toHaveBeenCalledWith('test@example.com', 'test', 'password', undefined);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: 'access',
            }));
        });
    });

    describe('login', () => {
        it('should login a user and return tokens', async () => {
            const req = mockRequest({ email: 'test@example.com', password: 'password' });
            const res = mockResponse();
            const serviceResult = { accessToken: 'access', refreshToken: 'refresh', user: {} };
            authService.loginUser.mockResolvedValue(serviceResult);
            
            await login(req, res, mockNext);

            expect(authService.loginUser).toHaveBeenCalledWith('test@example.com', 'password', undefined);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: 'access',
            }));
        });
    });

    describe('getProfile', () => {
        it('should return user profile', async () => {
            const req = mockRequest({}, { id: 1 });
            const res = mockResponse();
            const user = { id: 1, email: 'test@example.com' };
            authService.getUserById.mockResolvedValue(user);

            await getProfile(req, res, mockNext);
            
            expect(authService.getUserById).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith({ data: user });
        });
    });

    describe('updateProfile', () => {
        it('should update user profile', async () => {
            const req = mockRequest({ username: 'new' }, { id: 1 });
            const res = mockResponse();
            const updatedUser = { id: 1, username: 'new' };
            userService.updateProfile.mockResolvedValue(updatedUser);

            await updateProfile(req, res, mockNext);

            expect(userService.updateProfile).toHaveBeenCalledWith(1, { username: 'new' });
            expect(res.json).toHaveBeenCalledWith({ message: 'Profile updated', data: updatedUser });
        });
    });

    describe('changePassword', () => {
        it('should change user password', async () => {
            const req = mockRequest({ oldPassword: 'old', newPassword: 'new' }, { id: 1 });
            const res = mockResponse();
            const result = { message: 'Password changed successfully' };
            userService.changePassword.mockResolvedValue(result);

            await changePassword(req, res, mockNext);

            expect(userService.changePassword).toHaveBeenCalledWith(1, 'old', 'new');
            expect(res.json).toHaveBeenCalledWith(result);
        });
    });
    
    describe('getProfileWithStats', () => {
        it('should return user profile with stats', async () => {
            const req = mockRequest({}, { id: 1 });
            const res = mockResponse();
            const user = { id: 1, email: 'test@example.com', badge_count: 3 };
            userService.getProfileWithStats.mockResolvedValue(user);

            await getProfileWithStats(req, res, mockNext);
            
            expect(userService.getProfileWithStats).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith({ data: user });
        });
    });
});
