import api from "./api";

function unwrap(payload) {
  if (!payload) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }

  return payload;
}

function asArray(payload) {
  const unwrapped = unwrap(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }

  if (Array.isArray(unwrapped?.data)) {
    return unwrapped.data;
  }

  return [];
}

function extractPaginated(payload) {
  const data = asArray(payload);
  const pagination = payload?.pagination || {
    page: 1,
    limit: data.length || 0,
    total: data.length || 0,
    pages: 1,
    hasMore: false,
  };

  return { data, pagination };
}

function extractList(payload) {
  const unwrapped = unwrap(payload);

  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }

  if (Array.isArray(unwrapped?.data)) {
    return unwrapped.data;
  }

  return [];
}

export async function fetchTourneesStats() {
  const response = await api.get("/api/routes/stats/dashboard");
  return unwrap(response.data) || {};
}

export async function fetchNearlyDoneTournees(seuil = 80) {
  const response = await api.get("/api/routes/stats/nearly-done", { params: { seuil } });
  return unwrap(response.data) || { count: 0, tournees: [] };
}

export async function fetchAverageProgression() {
  const response = await api.get("/api/routes/stats/average-progression");
  return unwrap(response.data)?.progression_moyenne_pct ?? null;
}

export async function fetchActiveMapData({ signal } = {}) {
  const response = await api.get("/api/routes/tournees/active/map", { signal });
  return extractList(response.data || {});
}

export async function fetchActiveTournees({ page = 1, limit = 6, signal } = {}) {
  const response = await api.get("/api/routes/tournees", {
    params: { page, limit, statut: "EN_COURS" },
    signal,
  });
  return extractPaginated(response.data || {});
}

export async function fetchAllTournees({ statut, page = 1, limit = 12, signal } = {}) {
  const statutFilter = statut && statut !== "TOUS" ? statut : undefined;
  const response = await api.get("/api/routes/tournees", {
    params: { page, limit, statut: statutFilter },
    signal,
  });
  return extractPaginated(response.data || {});
}

// --- Mobile agent methods ---
export async function fetchMyTournee() {
  const response = await api.get('/api/routes/my-tournee');
  return unwrap(response.data);
}

export async function fetchEtapes(tourneeId) {
  const response = await api.get(`/api/routes/tournees/${tourneeId}/etapes`);
  return unwrap(response.data);
}

export async function fetchEtapeById(etapeId) {
  const response = await api.get(`/api/routes/etapes/${etapeId}`);
  return unwrap(response.data);
}

export async function fetchProgress(tourneeId) {
  const response = await api.get(`/api/routes/tournees/${tourneeId}/progress`);
  return unwrap(response.data);
}

export async function changeStatut(tourneeId, statut) {
  const response = await api.patch(`/api/routes/tournees/${tourneeId}/statut`, { statut });
  return unwrap(response.data);
}

export async function recordCollecte(tourneeId, data) {
  const response = await api.post(`/api/routes/tournees/${tourneeId}/collecte`, data);
  return unwrap(response.data);
}

export async function reportAnomalie(tourneeId, data) {
  const payload = {
    ...data,
    type_anomalie: data.type_anomalie || data.type,
  };
  delete payload.type;
  const response = await api.post(`/api/routes/tournees/${tourneeId}/anomalie`, payload);
  return unwrap(response.data);
}

export async function fetchAnomalies(tourneeId) {
  const response = await api.get(`/api/routes/tournees/${tourneeId}/anomalies`);
  return unwrap(response.data);
}

export async function fetchMapData(tourneeId) {
  const response = await api.get(`/api/routes/tournees/${tourneeId}/map`);
  return unwrap(response.data);
}

export async function fetchAgentHistory(agentId, params = {}) {
  const response = await api.get('/api/routes/tournees', {
    params: { id_agent: agentId, ...params },
  });
  return extractPaginated(response.data || {});
}

export async function fetchKpis() {
  const response = await api.get('/api/routes/stats/kpis');
  return unwrap(response.data);
}

export async function fetchAgentStats(period = 'semaine') {
  const response = await api.get('/api/routes/stats/agent', { params: { period } });
  return unwrap(response.data) || {};
}

export async function fetchTourneesPageData({
  statut,
  allPage = 1,
  allLimit = 12,
  activePage = 1,
  activeLimit = 6,
} = {}) {
  const statutFilter = statut && statut !== "TOUS" ? statut : undefined;

  const [statsResult, allTourneesResult, activeTourneesResult] = await Promise.allSettled([
    api.get("/api/routes/stats/dashboard"),
    api.get("/api/routes/tournees", {
      params: {
        page: allPage,
        limit: allLimit,
        statut: statutFilter,
      },
    }),
    api.get("/api/routes/tournees", {
      params: {
        page: activePage,
        limit: activeLimit,
        statut: "EN_COURS",
      },
    }),
  ]);

  const stats = statsResult.status === "fulfilled"
    ? unwrap(statsResult.value.data) || {}
    : {};

  const allTourneesPayload = allTourneesResult.status === "fulfilled"
    ? allTourneesResult.value.data || {}
    : {};

  const activeTourneesPayload = activeTourneesResult.status === "fulfilled"
    ? activeTourneesResult.value.data || {}
    : {};

  const { data: allTournees, pagination: allTourneesPagination } = extractPaginated(allTourneesPayload);
  const { data: activeTournees, pagination: activeTourneesPagination } = extractPaginated(activeTourneesPayload);

  if (
    statsResult.status === "rejected" &&
    allTourneesResult.status === "rejected" &&
    activeTourneesResult.status === "rejected"
  ) {
    throw new Error("Impossible de charger les donnees des tournees");
  }

  return {
    stats,
    allTournees,
    allTourneesPagination,
    activeTournees,
    activeTourneesPagination,
  };
}

export async function fetchTourneeCreationOptions() {
  const [zonesResult, agentsResult, vehiclesResult, typesResult] = await Promise.allSettled([
    api.get("/api/zones", { params: { page: 1, limit: 100 } }),
    api.get("/users/agents", { params: { page: 1, limit: 100 } }),
    api.get("/api/routes/vehicules", { params: { page: 1, limit: 100 } }),
    api.get("/api/routes/types-conteneurs"),
  ]);

  if (
    zonesResult.status === "rejected"
    && agentsResult.status === "rejected"
    && vehiclesResult.status === "rejected"
  ) {
    throw new Error("Impossible de charger les references de creation");
  }

  const zones = zonesResult.status === "fulfilled"
    ? extractList(zonesResult.value?.data)
    : [];

  const agents = agentsResult.status === "fulfilled"
    ? extractList(agentsResult.value?.data)
    : [];

  const vehicles = vehiclesResult.status === "fulfilled"
    ? extractList(vehiclesResult.value?.data)
    : [];

  const types = typesResult.status === "fulfilled"
    ? extractList(typesResult.value?.data)
    : [];

  return { zones, agents, vehicles, types };
}

// L'optimisation 2-opt sur une zone avec beaucoup de conteneurs peut prendre
// plusieurs secondes (matrice de distances + itérations d'amélioration).
// On override le timeout axios (défaut 10 s) à 30 s pour ces 2 endpoints.
const OPTIMIZE_TIMEOUT_MS = 30000;

export async function optimizeTournee(payload) {
  const response = await api.post("/api/routes/optimize", payload, {
    timeout: OPTIMIZE_TIMEOUT_MS,
  });
  return unwrap(response.data) || response.data;
}

export async function previewOptimizeTournee(payload) {
  const response = await api.post("/api/routes/optimize/preview", payload, {
    timeout: OPTIMIZE_TIMEOUT_MS,
  });
  return unwrap(response.data) || response.data;
}

export async function fetchTourneeById(id) {
  const response = await api.get(`/api/routes/tournees/${id}`);
  return unwrap(response.data) || response.data;
}

export async function fetchTourneeEtapes(id) {
  const response = await api.get(`/api/routes/tournees/${id}/etapes`);
  return extractList(response.data || {});
}

export async function fetchTourneeProgress(id) {
  const response = await api.get(`/api/routes/tournees/${id}/progress`);
  return unwrap(response.data) || {};
}

export async function fetchAgentsForAssignment({ page = 1, limit = 100 } = {}) {
  const response = await api.get("/users/agents", {
    params: { page, limit },
  });

  return extractList(response.data || {});
}

export async function assignTourneeAgent(id, idAgent) {
  const response = await api.patch(`/api/routes/tournees/${id}`, {
    id_agent: Number(idAgent),
  });

  return unwrap(response.data) || response.data;
}

export async function updateTournee(id, data) {
  const response = await api.patch(`/api/routes/tournees/${id}`, data);
  return unwrap(response.data) || response.data;
}

export async function updateTourneeStatut(id, statut) {
  const response = await api.patch(`/api/routes/tournees/${id}/statut`, { statut });
  return unwrap(response.data) || response.data;
}
