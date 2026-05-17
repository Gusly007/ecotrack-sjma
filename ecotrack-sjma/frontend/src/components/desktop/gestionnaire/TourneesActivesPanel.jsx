import { useEffect, useMemo, useState } from "react";
import TourneesEnCoursTable from "./TourneesEnCoursTable";
import { Pagination } from "../../common";
import { fetchActiveTournees } from "../../../services/tourneeService";

function computeHeureFin(heureDebut, dureePrevueMin) {
  if (!heureDebut || !dureePrevueMin) return null;
  const [h, m] = String(heureDebut).substring(0, 5).split(":").map(Number);
  const totalMin = h * 60 + m + Number(dureePrevueMin);
  const hFin = Math.floor(totalMin / 60) % 24;
  const mFin = totalMin % 60;
  return `${String(hFin).padStart(2, "0")}:${String(mFin).padStart(2, "0")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function normalizeActiveTournee(tournee) {
  const total = Number(tournee.total_etapes || 0);
  const done = Number(tournee.etapes_collectees || 0);
  const progression = total > 0 ? Math.round((done / total) * 100) : 0;

  const estEnRetard = tournee.est_en_retard ?? false;

  let statusText = "En cours";
  let statusColor = "green";

  if (estEnRetard) {
    statusText = "En retard";
    statusColor = "orange";
  } else if (progression >= 90) {
    statusText = "Bientot fini";
  }

  const heureDebut = tournee.heure_debut_prevue
    ? String(tournee.heure_debut_prevue).substring(0, 5)
    : null;

  return {
    id: tournee.code || `T-${tournee.id_tournee}`,
    rawId: tournee.id_tournee,
    agent: `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent non assigne",
    zone: tournee.zone_nom || tournee.zone_code || "Zone inconnue",
    progression,
    statusText,
    statusColor,
    statut: tournee.statut || "EN_COURS",
    totalEtapes: total,
    etapesCollectees: done,
    dateTournee: formatDate(tournee.date_tournee),
    heureDebutPrevue: heureDebut,
    heureFinPrevue: computeHeureFin(heureDebut, tournee.duree_prevue_min),
    dureePrevueMin: tournee.duree_prevue_min || null,
    estEnRetard,
  };
}

export default function TourneesActivesPanel({ pageSize = 6, refreshNonce = 0 }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: pageSize });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const result = await fetchActiveTournees({ page, limit: pageSize });
        if (!mounted) {
          return;
        }

        setRows((result.data || []).map(normalizeActiveTournee));
        setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: pageSize });
      } catch (_err) {
        if (!mounted) {
          return;
        }
        setRows([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [page, pageSize, refreshNonce]);

  const hasRows = useMemo(() => rows.length > 0, [rows]);

  if (loading && !hasRows) {
    return <div className="chart-container">Chargement des tournees actives...</div>;
  }

  return (
    <>
      {hasRows ? (
        <TourneesEnCoursTable tourneesEnCours={rows} />
      ) : (
        <div className="empty-state">Aucune tournee active pour le moment.</div>
      )}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pages || 1}
        onPageChange={setPage}
        showingFrom={(pagination.page - 1) * pageSize + 1}
        showingTo={Math.min(pagination.page * pageSize, pagination.total || 0)}
        totalItems={pagination.total || 0}
        label="tournée active"
      />
    </>
  );
}
