import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../services/api';
import {
  fetchActiveTournees,
  fetchAllTournees,
  fetchTourneesPageData,
  fetchTourneesStats,
} from '../services/tourneeService';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('tourneeService - lecture/pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchTourneesStats and fetchActiveTournees unwrap and paginate payloads', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: { open: 5 } } })
      .mockResolvedValueOnce({ data: { data: [{ id: 9 }], pagination: { page: 1, limit: 6, total: 1, pages: 1, hasMore: false } } });

    const stats = await fetchTourneesStats();
    const active = await fetchActiveTournees({ page: 1, limit: 6 });

    expect(stats).toEqual({ open: 5 });
    expect(active.data).toEqual([{ id: 9 }]);
    expect(active.pagination.total).toBe(1);
  });

  it('fetchAllTournees handles TOUS filter and fallback pagination', async () => {
    api.get
      .mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({ data: { data: [{ id: 3 }] } });

    const tous = await fetchAllTournees({ statut: 'TOUS', page: 1, limit: 12 });
    const filtered = await fetchAllTournees({ statut: 'EN_COURS', page: 1, limit: 12 });

    expect(tous.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(tous.pagination.total).toBe(2);

    const secondCallParams = api.get.mock.calls[1][1].params;
    expect(secondCallParams.statut).toBe('EN_COURS');
    expect(filtered.data).toEqual([{ id: 3 }]);
  });

  it('fetchTourneesPageData merges settled calls and throws only on full failure', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: { done: 1 } } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'a' }], pagination: { page: 1, limit: 12, total: 1, pages: 1, hasMore: false } } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'b' }], pagination: { page: 1, limit: 6, total: 1, pages: 1, hasMore: false } } });

    const result = await fetchTourneesPageData({ statut: 'TOUS' });
    expect(result.stats).toEqual({ done: 1 });
    expect(result.allTournees).toEqual([{ id: 'a' }]);
    expect(result.activeTournees).toEqual([{ id: 'b' }]);

    api.get
      .mockRejectedValueOnce(new Error('stats'))
      .mockRejectedValueOnce(new Error('all'))
      .mockRejectedValueOnce(new Error('active'));

    await expect(fetchTourneesPageData()).rejects.toThrow('Impossible de charger les donnees des tournees');
  });
});
