import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../services/api';
import {
  fetchAgentsForAssignment,
  fetchTourneeCreationOptions,
  optimizeTournee,
  previewOptimizeTournee,
} from '../services/tourneeService';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

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

    expect(api.post).toHaveBeenCalledWith(
      '/api/routes/optimize',
      payload,
      expect.objectContaining({ timeout: 30000 })
    );
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

    expect(api.post).toHaveBeenCalledWith(
      '/api/routes/optimize/preview',
      payload,
      expect.objectContaining({ timeout: 30000 })
    );
    expect(api.post).not.toHaveBeenCalledWith('/api/routes/optimize', expect.anything());
    expect(result).toEqual(serverPreview);
  });
});
