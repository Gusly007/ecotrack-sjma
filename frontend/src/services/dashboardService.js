import api from "./api";

export const dashboardService = {
  async getStats() {
    const response = await api.get("/api/dashboard/stats");
    return response.data;
  },
};

function unwrap(payload) {
  if (!payload) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }

  return payload;
}

function extractPaginated(payload) {
  const data = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];

  const pagination = payload?.pagination || {
    page: 1,
    limit: data.length || 0,
    total: data.length || 0,
    pages: 1,
    hasMore: false,
  };

  return { data, pagination };
}

export async function fetchDashboardData({ activePage = 1, activeLimit = 6 } = {}) {
  const [statsResult, tourneesResult, notificationsResult] = await Promise.allSettled([
    api.get("/api/routes/stats/dashboard"),
    api.get("/api/routes/tournees", {
      params: {
        statut: "EN_COURS",
        page: activePage,
        limit: activeLimit,
      },
    }),
    api.get("/notifications?limit=5"),
  ]);

  const statsData = statsResult.status === "fulfilled"
    ? unwrap(statsResult.value.data) || {}
    : {};

  const activeTourneesPayload = tourneesResult.status === "fulfilled"
    ? tourneesResult.value.data || {}
    : {};

  const { data: activeTournees, pagination: activeTourneesPagination } = extractPaginated(activeTourneesPayload);

  const notificationsPayload = notificationsResult.status === "fulfilled"
    ? unwrap(notificationsResult.value.data) || notificationsResult.value.data || {}
    : {};

  const notifications = Array.isArray(notificationsPayload)
    ? notificationsPayload
    : notificationsPayload.data || [];

  if (statsResult.status === "rejected" && tourneesResult.status === "rejected") {
    throw new Error("Impossible de charger les donnees de routes");
  }

  return {
    stats: statsData,
    activeTournees,
    activeTourneesPagination,
    notifications,
  };
}
