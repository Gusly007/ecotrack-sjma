import {
  getOwnProfile,
  updateProfile,
  changePassword,
  getProfileWithStats,
  listUsers,
  getUserProfile,
  getUserStats,
  updateUserByAdmin,
  deleteUser
} from '../../src/controllers/userController.js';
import * as userService from '../../src/services/userService.js';

jest.mock('../../src/services/emailService.js', () => ({
  sendAccountStatusEmail: jest.fn(),
  sendRoleChangeEmail: jest.fn(),
  sendAccountDeletedEmail: jest.fn(),
}));

jest.mock('../../src/services/userService.js');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when getOwnProfile is called without auth user', async () => {
    const req = { user: null };
    const res = mockResponse();

    await getOwnProfile(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(userService.getUserProfile).not.toHaveBeenCalled();
  });

  it('calls service with parsed id for getOwnProfile', async () => {
    const req = { user: { id: '7' } };
    const res = mockResponse();
    userService.getUserProfile.mockResolvedValue({ id_utilisateur: 7, prenom: 'Ana' });

    await getOwnProfile(req, res, jest.fn());

    expect(userService.getUserProfile).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith({ data: { id_utilisateur: 7, prenom: 'Ana' } });
  });

  it('validates required password fields in changePassword', async () => {
    const req = { user: { id: 1 }, body: { oldPassword: 'old' } };
    const res = mockResponse();

    await changePassword(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userService.changePassword).not.toHaveBeenCalled();
  });

  it('validates new password minimum length in changePassword', async () => {
    const req = { user: { id: 1 }, body: { oldPassword: 'old', newPassword: '123' } };
    const res = mockResponse();

    await changePassword(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userService.changePassword).not.toHaveBeenCalled();
  });

  it('calls service in updateProfile with safe default body', async () => {
    const req = { user: { userId: '12' }, body: undefined };
    const res = mockResponse();
    userService.updateProfile.mockResolvedValue({ id_utilisateur: 12 });

    await updateProfile(req, res, jest.fn());

    expect(userService.updateProfile).toHaveBeenCalledWith(12, {});
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Profile updated successfully' }));
  });

  it('passes query filters to listUsers', async () => {
    const req = { query: { page: '2', limit: '10', role: 'ADMIN', search: 'ana', est_active: 'true' } };
    const res = mockResponse();
    userService.listUsers.mockResolvedValue({ data: [], pagination: {} });

    await listUsers(req, res, jest.fn());

    expect(userService.listUsers).toHaveBeenCalledWith(req.query);
    expect(res.json).toHaveBeenCalledWith({ data: [], pagination: {} });
  });

  it('returns 400 for invalid params id in admin endpoints', async () => {
    const req = { params: { id: 'abc' } };
    const res = mockResponse();

    await getUserProfile(req, res, jest.fn());
    await getUserStats(req, res, jest.fn());
    await updateUserByAdmin(req, res, jest.fn());
    await deleteUser(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('calls updateUserByAdmin and deleteUser with numeric id', async () => {
    const res = mockResponse();
    userService.updateUserByAdmin.mockResolvedValue({ id_utilisateur: 9, nom: 'Neo' });
    userService.deleteUser.mockResolvedValue(true);

    await updateUserByAdmin({ params: { id: '9' }, body: { nom: 'Neo' } }, res, jest.fn());
    await deleteUser({ params: { id: '9' } }, res, jest.fn());

    expect(userService.updateUserByAdmin).toHaveBeenCalledWith(9, { nom: 'Neo' });
    expect(userService.deleteUser).toHaveBeenCalledWith(9);
  });

  it('calls getProfileWithStats with extracted id variant', async () => {
    const req = { user: { id_utilisateur: '3' } };
    const res = mockResponse();
    userService.getProfileWithStats.mockResolvedValue({ id_utilisateur: 3, badge_count: 2 });

    await getProfileWithStats(req, res, jest.fn());

    expect(userService.getProfileWithStats).toHaveBeenCalledWith(3);
    expect(res.json).toHaveBeenCalledWith({ data: { id_utilisateur: 3, badge_count: 2 } });
  });
});