import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../services/api';
import { dashboardService, fetchDashboardData } from '../services/dashboardService';
import {
  fetchActiveTournees,
  fetchAgentsForAssignment,
  fetchAllTournees,
  fetchTourneeCreationOptions,
  fetchTourneesPageData,
  fetchTourneesStats,
  optimizeTournee,
  previewOptimizeTournee,
} from '../services/tourneeService';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('dashboardService + tourneeService', () => {
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

describe('tourneeService - creation optimisee (gestionnaire)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchTourneeCreationOptions agrège zones, agents et véhicules avec appel /users/agents', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: [{ id_zone: 1, nom: 'Centre' }], pagination: { total: 1 } } })
      .mockResolvedValueOnce({ data: { data: [{ id_utilisateur: 5, role: 'AGENT' }], pagination: { total: 1 } } })
      .mockResolvedValueOnce({ data: { data: [{ id_vehicule: 3, numero_immatriculation: 'AB-123-CD' }], pagination: { total: 1 } } });

    const result = await fetchTourneeCreationOptions();

    expect(api.get).toHaveBeenCalledWith('/api/zones', expect.any(Object));
    expect(api.get).toHaveBeenCalledWith('/users/agents', expect.objectContaining({
      params: expect.objectContaining({ page: 1, limit: 100 })
    }));
    expect(api.get).toHaveBeenCalledWith('/api/routes/vehicules', expect.any(Object));

    expect(result.zones).toEqual([{ id_zone: 1, nom: 'Centre' }]);
    expect(result.agents).toEqual([{ id_utilisateur: 5, role: 'AGENT' }]);
    expect(result.vehicles).toEqual([{ id_vehicule: 3, numero_immatriculation: 'AB-123-CD' }]);
  });

  it('fetchTourneeCreationOptions tolère un échec partiel et renvoie des listes vides', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: [{ id_zone: 1 }] } })
      .mockRejectedValueOnce(new Error('agents fail'))
      .mockResolvedValueOnce({ data: { data: [{ id_vehicule: 3 }] } });

    const result = await fetchTourneeCreationOptions();

    expect(result.zones).toEqual([{ id_zone: 1 }]);
    expect(result.agents).toEqual([]);
    expect(result.vehicles).toEqual([{ id_vehicule: 3 }]);
  });

  it('fetchTourneeCreationOptions lance une erreur si tout échoue', async () => {
    api.get
      .mockRejectedValueOnce(new Error('zones fail'))
      .mockRejectedValueOnce(new Error('agents fail'))
      .mockRejectedValueOnce(new Error('vehicules fail'));

    await expect(fetchTourneeCreationOptions())
      .rejects.toThrow('Impossible de charger les references de creation');
  });

  it('fetchAgentsForAssignment utilise /users/agents avec pagination par défaut', async () => {
    api.get.mockResolvedValueOnce({
      data: { data: [{ id_utilisateur: 7, role: 'AGENT', prenom: 'Ana' }] }
    });

    const result = await fetchAgentsForAssignment();

    expect(api.get).toHaveBeenCalledWith('/users/agents', {
      params: { page: 1, limit: 100 }
    });
    expect(result).toEqual([{ id_utilisateur: 7, role: 'AGENT', prenom: 'Ana' }]);
  });

  it('optimizeTournee POST /api/routes/optimize et dé-enveloppe la réponse', async () => {
    const payload = {
      id_zone: 1,
      date_tournee: '2026-04-20',
      id_agent: 5,
      id_vehicule: 3,
      algorithme: '2opt',
      seuil_remplissage: 70,
    };
    const serverPayload = {
      tournee: { id_tournee: 42 },
      optimisation: { gain_pct: 22.5, nb_conteneurs: 8 }
    };
    api.post.mockResolvedValueOnce({
      data: { success: true, data: serverPayload, message: 'Tournée optimisée créée' }
    });

    const result = await optimizeTournee(payload);

    expect(api.post).toHaveBeenCalledWith('/api/routes/optimize', payload);
    expect(result).toEqual(serverPayload);
  });

  it('previewOptimizeTournee POST /api/routes/optimize/preview et ne persiste pas', async () => {
    const payload = {
      id_zone: 1,
      date_tournee: '2026-04-20',
      id_agent: 5,
      algorithme: 'nearest_neighbor',
    };
    const serverPreview = {
      optimisation: { gain_pct: 15.0, nb_conteneurs: 6, distance_prevue_km: 12.4 },
      etapes_preview: [{ sequence: 1, id_conteneur: 1, fill_level: 80 }]
    };
    api.post.mockResolvedValueOnce({
      data: { success: true, data: serverPreview }
    });

    const result = await previewOptimizeTournee(payload);

    expect(api.post).toHaveBeenCalledWith('/api/routes/optimize/preview', payload);
    // pas d'appel /optimize (non-persistant)
    expect(api.post).not.toHaveBeenCalledWith('/api/routes/optimize', expect.anything());
    expect(result).toEqual(serverPreview);
  });
});
