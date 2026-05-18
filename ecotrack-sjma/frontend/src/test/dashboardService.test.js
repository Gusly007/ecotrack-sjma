import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../services/api';
import { dashboardService, fetchDashboardData } from '../services/dashboardService';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dashboardService.getStats returns payload data', async () => {
    api.get.mockResolvedValueOnce({ data: { total: 3 } });

    const result = await dashboardService.getStats();

    expect(api.get).toHaveBeenCalledWith('/api/dashboard/stats');
    expect(result).toEqual({ total: 3 });
  });

  it('fetchDashboardData merges fulfilled payloads and unwraps data', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: { count: 2 } } })
      .mockResolvedValueOnce({ data: { data: [{ id: 1 }], pagination: { page: 2, limit: 6, total: 7, pages: 2, hasMore: true } } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'n1' }] } });

    const result = await fetchDashboardData({ activePage: 2, activeLimit: 6 });

    expect(result.stats).toEqual({ count: 2 });
    expect(result.activeTournees).toEqual([{ id: 1 }]);
    expect(result.activeTourneesPagination).toEqual({ page: 2, limit: 6, total: 7, pages: 2, hasMore: true });
    expect(result.notifications).toEqual([{ id: 'n1' }]);
  });

  it('fetchDashboardData tolerates partial failures and throws on full failure', async () => {
    api.get
      .mockRejectedValueOnce(new Error('stats fail'))
      .mockResolvedValueOnce({ data: { data: [{ id: 1 }] } })
      .mockRejectedValueOnce(new Error('notif fail'));

    const partial = await fetchDashboardData();
    expect(partial.stats).toEqual({});
    expect(partial.activeTournees).toEqual([{ id: 1 }]);

    api.get
      .mockRejectedValueOnce(new Error('stats fail'))
      .mockRejectedValueOnce(new Error('tournees fail'))
      .mockRejectedValueOnce(new Error('notif fail'));

    await expect(fetchDashboardData()).rejects.toThrow('Impossible de charger les donnees de routes');
  });
});
