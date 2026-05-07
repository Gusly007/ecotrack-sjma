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

export async function fetchTourneeById(id) {
  const response = await api.get(`/api/routes/tournees/${id}`);
  return unwrap(response.data);
}

export async function fetchTourneeCreationOptions() {
  const [zonesRes, agentsRes, vehiclesRes] = await Promise.allSettled([
    api.get("/api/containers/zones"),
    api.get("/api/users/agents"),
    api.get("/api/routes/vehicules"),
  ]);

  return {
    zones: zonesRes.status === "fulfilled" ? asArray(zonesRes.value.data) : [],
    agents: agentsRes.status === "fulfilled" ? asArray(agentsRes.value.data) : [],
    vehicles: vehiclesRes.status === "fulfilled" ? asArray(vehiclesRes.value.data) : [],
  };
}

export async function updateTournee(id, data) {
  const response = await api.patch(`/api/routes/tournees/${id}`, data);
  return unwrap(response.data);
}

export async function updateTourneeStatut(id, statut) {
  const response = await api.patch(`/api/routes/tournees/${id}`, { statut });
  return unwrap(response.data);
}

export async function fetchAgentsForAssignment({ page = 1, limit = 100 } = {}) {
  const response = await api.get("/users/agents", {
    params: { page, limit },
  });
  return extractList(response.data || {});
}

const OPTIMIZE_TIMEOUT_MS = 120000;

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
