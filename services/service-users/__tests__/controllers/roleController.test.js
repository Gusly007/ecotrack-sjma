import * as roleService from '../../src/services/roleService.js';
import * as roleController from '../../src/controllers/roleController.js';

jest.mock('../../src/services/roleService.js');

describe('roleController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: {},
            body: {}
        };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('getUserRoles', () => {
        it('should return roles for a user', async () => {
            const userId = 1;
            const roles = [{ id: 1, name: 'admin' }];
            req.params.id = userId;
            roleService.getUserRoles.mockResolvedValue(roles);

            await roleController.getUserRoles(req, res);

            expect(roleService.getUserRoles).toHaveBeenCalledWith(userId);
            expect(res.json).toHaveBeenCalledWith({ data: roles });
        });
    });

    describe('assignRole', () => {
        it('should assign a role to a user', async () => {
            const userId = 1;
            const roleId = 2;
            req.params.id = userId;
            req.body.roleId = roleId;
            roleService.assignRoleToUser.mockResolvedValue({ userId, roleId });

            await roleController.assignRole(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Role assigné',
                data: { userId, roleId }
            });
        });

        it('should return 400 when roleId is missing', async () => {
            req.params.id = 1;
            req.body.roleId = null;

            await roleController.assignRole(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'roleId requis' });
        });
    });

    describe('removeRole', () => {
        it('should remove a role from a user', async () => {
            const userId = 1;
            const roleId = 2;
            req.params.id = userId;
            req.params.roleId = roleId;
            roleService.removeRoleFromUser.mockResolvedValue(undefined);

            await roleController.removeRole(req, res);

            expect(roleService.removeRoleFromUser).toHaveBeenCalledWith(userId, roleId);
            expect(res.json).toHaveBeenCalledWith({ message: 'Role retiré' });
        });
    });
});