import { jest } from '@jest/globals';

const { default: userRepository } = await import('../../src/repositories/userRepository.js');

describe('userRepository', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getActiveUsers should return parsed count', async () => {
    jest.spyOn(userRepository, 'query').mockResolvedValue({ rows: [{ count: '12' }] });

    const result = await userRepository.getActiveUsers();

    expect(result).toBe(12);
  });

  it('getTotalUsers should return parsed count', async () => {
    jest.spyOn(userRepository, 'query').mockResolvedValue({ rows: [{ count: '21' }] });

    const result = await userRepository.getTotalUsers();

    expect(result).toBe(21);
  });

  it('getUsersByRole should pass role parameter', async () => {
    const querySpy = jest.spyOn(userRepository, 'query').mockResolvedValue({ rows: [{ count: '7' }] });

    const result = await userRepository.getUsersByRole('ADMIN');

    expect(result).toBe(7);
    expect(querySpy).toHaveBeenCalledWith(expect.stringContaining('role_par_defaut'), ['ADMIN']);
  });

  it('getRecentUsers should return 0 on query failure', async () => {
    jest.spyOn(userRepository, 'query').mockRejectedValue(new Error('db down'));

    const result = await userRepository.getRecentUsers(14);

    expect(result).toBe(0);
  });
});
