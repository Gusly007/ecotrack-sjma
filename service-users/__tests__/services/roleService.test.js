import pool from '../../src/config/database.js';
import { assignRoleToUser, removeRoleFromUser, getUserRoles } from '../../src/services/roleService.js';

jest.mock('../../src/config/database.js', () => ({
	__esModule: true,
	default: {
		query: jest.fn(),
	},
}));

describe('roleService', () => {
	beforeEach(() => {
		pool.query.mockReset();
	});

	describe('assignRoleToUser', () => {
		it('inserts a role and returns inserted row', async () => {
			const mockRow = { id_utilisateur: 'user-123', id_role: 'role-456' };
			pool.query.mockResolvedValue({ rows: [mockRow] });

			const result = await assignRoleToUser('user-123', 'role-456');

			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO user_role'),
				['user-123', 'role-456']
			);
			expect(result).toEqual(mockRow);
		});
	});

	describe('removeRoleFromUser', () => {
		it('removes a role mapping', async () => {
			pool.query.mockResolvedValue({});

			await removeRoleFromUser('user-99', 'role-77');

			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining('DELETE FROM user_role'),
				['user-99', 'role-77']
			);
		});
	});

	describe('getUserRoles', () => {
		it('returns rows from database', async () => {
			const rows = [
				{ id_role: 1, nom_role: 'ADMIN' },
				{ id_role: 2, nom_role: 'AGENT' },
			];
			pool.query.mockResolvedValue({ rows });

			const result = await getUserRoles('user-55');

			expect(pool.query).toHaveBeenCalledWith(
				expect.stringContaining('SELECT r.id_role'),
				['user-55']
			);
			expect(result).toEqual(rows);
		});
	});
});
