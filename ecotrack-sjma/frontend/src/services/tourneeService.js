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

export async function fetchTourneesStats() {
  const response = await api.get("/api/routes/stats/dashboard");
  return unwrap(response.data) || {};
}

export async function fetchActiveTournees({ page = 1, limit = 6 } = {}) {
  const response = await api.get("/api/routes/tournees", {
    params: {
      page,
      limit,
      statut: "EN_COURS",
    },
  });

  return extractPaginated(response.data || {});
}

export async function fetchAllTournees({ statut, page = 1, limit = 12 } = {}) {
  const statutFilter = statut && statut !== "TOUS" ? statut : undefined;

  const response = await api.get("/api/routes/tournees", {
    params: {
      page,
      limit,
      statut: statutFilter,
    },
  });

  return extractPaginated(response.data || {});
}

// --- Mobile agent methods ---
export async function fetchMyTournee() {
  const response = await api.get('/api/routes/my-tournee');
  return unwrap(response.data);
}

export async function fetchTourneeById(id) {
  const response = await api.get(`/api/routes/tournees/${id}`);
  return unwrap(response.data);
}

export async function fetchEtapes(tourneeId) {
  const response = await api.get(`/api/routes/tournees/${tourneeId}/etapes`);
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
  const response = await api.post(`/api/routes/tournees/${tourneeId}/anomalie`, data);
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
