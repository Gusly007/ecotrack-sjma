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

export async function fetchDashboardData() {
  const [statsResult, tourneesResult, notificationsResult] = await Promise.allSettled([
    api.get("/api/routes/stats/dashboard"),
    api.get("/api/routes/tournees/active"),
    api.get("/notifications?limit=5"),
  ]);

  const statsData = statsResult.status === "fulfilled"
    ? unwrap(statsResult.value.data) || {}
    : {};

  const activeTournees = tourneesResult.status === "fulfilled"
    ? unwrap(tourneesResult.value.data) || []
    : [];

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
    notifications,
  };
}
