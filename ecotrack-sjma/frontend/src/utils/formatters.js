export function formatDate(dateValue) {
  if (!dateValue) return "-";
  try {
    return new Date(dateValue).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export function formatDuration(minutes) {
  const total = Number(minutes || 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

export function formatTourneeCode(tournee) {
  if (tournee?.code) return tournee.code;
  if (tournee?.id_tournee != null) return `Tournée #${tournee.id_tournee}`;
  return "-";
}

export function formatConteneurUid(item) {
  const uid = item?.conteneur_uid || item?.uid_conteneur;
  if (uid) return uid;
  if (item?.id_conteneur != null) return `Conteneur #${item.id_conteneur}`;
  return "-";
}

export function getErrorMessage(error, fallback = "Une erreur est survenue.") {
  return (
    error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback
  );
}
