import { useEffect, useMemo, useState } from "react";
import { signalementService } from "../../../services/signalementService";
import "./MaintenancePage.css";

const SEVERITY_ORDER = {
  CRITIQUE: 3,
  ELEVEE: 2,
  MOYENNE: 1,
  FAIBLE: 0,
};

function formatDate(dateValue) {
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

function normalizeIntervention(item) {
  const urgenceRaw = String(item.urgence || "MOYENNE").toUpperCase();
  const statutRaw = String(item.statut || "NOUVEAU").toUpperCase();

  return {
    id: item.id_signalement,
    titre: item.titre || "Intervention sans titre",
    zone: item.zone_nom || item.zone_code || "Zone non definie",
    urgence: urgenceRaw,
    statut: statutRaw,
    date: item.created_at || item.date_creation,
    description: item.description || item.commentaire || "Aucun detail",
    conteneur: item.id_conteneur ? `CONT-${item.id_conteneur}` : "-",
    assigneA: item.assigne_a || item.technicien || "Non assigne",
  };
}

function statusClass(status) {
  if (status === "RESOLU") return "resolved";
  if (status === "EN_COURS") return "active";
  return "pending";
}

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [priorityFilter, setPriorityFilter] = useState("TOUS");
  const [interventions, setInterventions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [planning, setPlanning] = useState({
    technicien: "",
    datePrevue: "",
    commentaire: "",
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await signalementService.getAll(1, 200, {});
        const payload = response?.data?.data || response?.data || response || [];
        const list = Array.isArray(payload) ? payload.map(normalizeIntervention) : [];

        if (!mounted) return;

        setInterventions(list);
        if (list.length > 0) {
          setSelectedId((current) => current || list[0].id);
        }
      } catch (err) {
        if (!mounted) return;
        setError("Impossible de charger les interventions maintenance.");
        setInterventions([]);
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
  }, []);

  const filteredInterventions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return interventions
      .filter((item) => {
        const matchesSearch = !q
          || item.titre.toLowerCase().includes(q)
          || item.zone.toLowerCase().includes(q)
          || item.conteneur.toLowerCase().includes(q)
          || String(item.id).includes(q);

        const matchesStatus = statusFilter === "TOUS" || item.statut === statusFilter;
        const matchesPriority = priorityFilter === "TOUS" || item.urgence === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        const priorityDiff = (SEVERITY_ORDER[b.urgence] || 0) - (SEVERITY_ORDER[a.urgence] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      });
  }, [interventions, priorityFilter, search, statusFilter]);

  useEffect(() => {
    if (!filteredInterventions.length) {
      setSelectedId(null);
      return;
    }

    const exists = filteredInterventions.some((item) => item.id === selectedId);
    if (!exists) {
      setSelectedId(filteredInterventions[0].id);
    }
  }, [filteredInterventions, selectedId]);

  const selected = useMemo(
    () => filteredInterventions.find((item) => item.id === selectedId) || null,
    [filteredInterventions, selectedId],
  );

  const metrics = useMemo(() => {
    const total = interventions.length;
    const open = interventions.filter((i) => i.statut === "NOUVEAU").length;
    const inProgress = interventions.filter((i) => i.statut === "EN_COURS").length;
    const resolved = interventions.filter((i) => i.statut === "RESOLU").length;
    const critical = interventions.filter((i) => i.urgence === "CRITIQUE").length;

    return {
      total,
      open,
      inProgress,
      resolved,
      critical,
    };
  }, [interventions]);

  function handlePlanningChange(event) {
    const { name, value } = event.target;
    setPlanning((prev) => ({ ...prev, [name]: value }));
  }

  function handlePlanningSubmit(event) {
    event.preventDefault();
    if (!selected) return;

    setInterventions((prev) => prev.map((item) => (
      item.id === selected.id
        ? {
            ...item,
            statut: "EN_COURS",
            assigneA: planning.technicien || item.assigneA,
          }
        : item
    )));

    setPlanning({ technicien: "", datePrevue: "", commentaire: "" });
  }

  return (
    <div className="maintenance-page">
      <header className="maintenance-header">
        <div>
          <h2>Maintenance operationnelle</h2>
          <p>Supervisez les interventions, priorisez les incidents et planifiez les actions terrain.</p>
        </div>
      </header>

      <section className="maintenance-kpis">
        <article className="maintenance-kpi-card">
          <span>Total interventions</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="maintenance-kpi-card">
          <span>Nouveaux tickets</span>
          <strong>{metrics.open}</strong>
        </article>
        <article className="maintenance-kpi-card">
          <span>En cours</span>
          <strong>{metrics.inProgress}</strong>
        </article>
        <article className="maintenance-kpi-card">
          <span>Resolus</span>
          <strong>{metrics.resolved}</strong>
        </article>
        <article className="maintenance-kpi-card critical">
          <span>Priorite critique</span>
          <strong>{metrics.critical}</strong>
        </article>
      </section>

      <section className="maintenance-filters">
        <input
          type="text"
          placeholder="Rechercher intervention, zone, conteneur..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="TOUS">Tous statuts</option>
          <option value="NOUVEAU">Nouveau</option>
          <option value="EN_COURS">En cours</option>
          <option value="RESOLU">Resolu</option>
        </select>

        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
          <option value="TOUS">Toutes priorites</option>
          <option value="CRITIQUE">Critique</option>
          <option value="ELEVEE">Elevee</option>
          <option value="MOYENNE">Moyenne</option>
          <option value="FAIBLE">Faible</option>
        </select>
      </section>

      <section className="maintenance-layout">
        <article className="maintenance-table-wrap">
          <div className="maintenance-table-head">
            <h3>Interventions a traiter</h3>
            <span>{filteredInterventions.length} resultats</span>
          </div>

          {loading ? (
            <div className="maintenance-empty">Chargement des interventions...</div>
          ) : error ? (
            <div className="maintenance-empty error">{error}</div>
          ) : !filteredInterventions.length ? (
            <div className="maintenance-empty">Aucune intervention ne correspond aux filtres.</div>
          ) : (
            <div className="maintenance-table-scroll">
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Intervention</th>
                    <th>Zone</th>
                    <th>Priorite</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventions.map((item) => {
                    const isSelected = selectedId === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={isSelected ? "selected" : ""}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <td>INT-{item.id}</td>
                        <td>{item.titre}</td>
                        <td>{item.zone}</td>
                        <td>
                          <span className={`badge priority ${item.urgence.toLowerCase()}`}>{item.urgence}</span>
                        </td>
                        <td>
                          <span className={`badge status ${statusClass(item.statut)}`}>{item.statut}</span>
                        </td>
                        <td>{formatDate(item.date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="maintenance-side-panel">
          {!selected ? (
            <div className="maintenance-empty">Selectionnez une intervention pour afficher les details.</div>
          ) : (
            <>
              <div className="maintenance-detail-card">
                <h3>Detail intervention</h3>
                <p className="maintenance-title">{selected.titre}</p>
                <p>{selected.description}</p>
                <div className="maintenance-meta">
                  <div>
                    <span>Zone</span>
                    <strong>{selected.zone}</strong>
                  </div>
                  <div>
                    <span>Conteneur</span>
                    <strong>{selected.conteneur}</strong>
                  </div>
                  <div>
                    <span>Assigne a</span>
                    <strong>{selected.assigneA}</strong>
                  </div>
                  <div>
                    <span>Date creation</span>
                    <strong>{formatDate(selected.date)}</strong>
                  </div>
                </div>
              </div>

              <form className="maintenance-plan-form" onSubmit={handlePlanningSubmit}>
                <h3>Planifier l'intervention</h3>
                <label htmlFor="technicien">Technicien</label>
                <input
                  id="technicien"
                  name="technicien"
                  type="text"
                  value={planning.technicien}
                  onChange={handlePlanningChange}
                  placeholder="Nom du technicien"
                  required
                />

                <label htmlFor="datePrevue">Date prevue</label>
                <input
                  id="datePrevue"
                  name="datePrevue"
                  type="date"
                  value={planning.datePrevue}
                  onChange={handlePlanningChange}
                  required
                />

                <label htmlFor="commentaire">Commentaire</label>
                <textarea
                  id="commentaire"
                  name="commentaire"
                  rows={3}
                  value={planning.commentaire}
                  onChange={handlePlanningChange}
                  placeholder="Instructions pour l'equipe terrain"
                />

                <button type="submit">Demarrer l'intervention</button>
              </form>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}
