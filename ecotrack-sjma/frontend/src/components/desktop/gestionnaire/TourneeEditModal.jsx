import { useCallback, useEffect, useState } from "react";
import Modal from "../../common/Modal";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchTourneeById,
  fetchTourneeCreationOptions,
  updateTournee,
  updateTourneeStatut,
} from "../../../services/tourneeService";
import { getErrorMessage } from "../../../utils/formatters";

const ALL_STATUT_OPTIONS = [
  { value: "PLANIFIEE", label: "Planifiée" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Terminée" },
  { value: "ANNULEE", label: "Annulée" },
];

const GESTIONNAIRE_STATUT_OPTIONS = [
  { value: "ANNULEE", label: "Annulée" },
];

// Champs modifiables selon le statut de la tournée
const EDITABLE_BY_STATUT = {
  PLANIFIEE: new Set(["date_tournee", "heure_debut_prevue", "duree_prevue_min", "distance_prevue_km", "id_agent", "id_vehicule"]),
  EN_COURS:  new Set(["id_agent", "id_vehicule", "duree_reelle_min", "distance_reelle_km"]),
  TERMINEE:  new Set(["duree_reelle_min", "distance_reelle_km"]),
  ANNULEE:   new Set(),
};

const STATUT_INFO = {
  PLANIFIEE: "Tournée planifiée — vous pouvez modifier la date, l'heure, l'agent et le véhicule.",
  EN_COURS:  "Tournée en cours — seuls l'agent, le véhicule et les données réelles sont modifiables.",
  TERMINEE:  "Tournée terminée — seules les données réelles peuvent être corrigées.",
  ANNULEE:   "Tournée annulée — aucune modification possible.",
};

function buildInitialForm(raw) {
  return {
    date_tournee:      raw.date_tournee ? String(raw.date_tournee).slice(0, 10) : "",
    heure_debut_prevue: raw.heure_debut_prevue ? String(raw.heure_debut_prevue).slice(0, 5) : "07:30",
    duree_prevue_min:  raw.duree_prevue_min ?? "",
    distance_prevue_km: raw.distance_prevue_km ?? "",
    id_agent:          raw.id_agent ?? "",
    id_vehicule:       raw.id_vehicule ?? "",
    duree_reelle_min:  raw.duree_reelle_min ?? "",
    distance_reelle_km: raw.distance_reelle_km ?? "",
  };
}

export default function TourneeEditModal({ tourneeId, isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const isGestionnaire = user?.role === "gestionnaire";
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statutSubmitting, setStatutSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tournee, setTournee] = useState(null);
  const [options, setOptions] = useState({ zones: [], agents: [], vehicles: [] });
  const [form, setForm] = useState({});
  const [newStatut, setNewStatut] = useState("");

  useEffect(() => {
    if (!isOpen || !tourneeId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setTournee(null);
      try {
        const [raw, opts] = await Promise.all([
          fetchTourneeById(tourneeId),
          fetchTourneeCreationOptions(),
        ]);
        if (cancelled) return;
        setTournee(raw);
        setOptions(opts);
        setForm(buildInitialForm(raw));
        setNewStatut(raw.statut || "PLANIFIEE");
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Impossible de charger les données de la tournée."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isOpen, tourneeId]);

  const editableFields = EDITABLE_BY_STATUT[tournee?.statut] ?? new Set();
  const canEdit = (field) => editableFields.has(field);
  const isReadOnly = tournee?.statut === "ANNULEE";

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");

    const payload = {};
    if (canEdit("date_tournee")      && form.date_tournee)          payload.date_tournee = form.date_tournee;
    if (canEdit("duree_prevue_min")  && form.duree_prevue_min !== "") payload.duree_prevue_min = Number(form.duree_prevue_min);
    if (canEdit("distance_prevue_km") && form.distance_prevue_km !== "") payload.distance_prevue_km = Number(form.distance_prevue_km);
    if (canEdit("id_agent")          && form.id_agent !== "")        payload.id_agent = Number(form.id_agent);
    if (canEdit("id_vehicule"))                                       payload.id_vehicule = form.id_vehicule !== "" ? Number(form.id_vehicule) : null;
    if (canEdit("duree_reelle_min")  && form.duree_reelle_min !== "") payload.duree_reelle_min = Number(form.duree_reelle_min);
    if (canEdit("distance_reelle_km") && form.distance_reelle_km !== "") payload.distance_reelle_km = Number(form.distance_reelle_km);

    if (Object.keys(payload).length === 0) {
      setError("Aucune modification à enregistrer.");
      return;
    }

    try {
      setSubmitting(true);
      await updateTournee(tourneeId, payload);
      onSuccess?.("Tournée mise à jour avec succès.");
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de mettre à jour la tournée."));
    } finally {
      setSubmitting(false);
    }
  }, [form, tourneeId, onSuccess, onClose, editableFields]);

  const handleStatutApply = useCallback(async () => {
    if (!newStatut || newStatut === tournee?.statut) return;
    setError("");
    try {
      setStatutSubmitting(true);
      await updateTourneeStatut(tourneeId, newStatut);
      const label = ALL_STATUT_OPTIONS.find((s) => s.value === newStatut)?.label ?? newStatut;
      onSuccess?.(`Statut changé en "${label}" avec succès.`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de changer le statut."));
    } finally {
      setStatutSubmitting(false);
    }
  }, [newStatut, tournee, tourneeId, onSuccess, onClose]);

  const disabled = submitting || statutSubmitting;
  const showPlanification = canEdit("date_tournee") || canEdit("heure_debut_prevue") || canEdit("duree_prevue_min") || canEdit("distance_prevue_km");
  const showAssignment = canEdit("id_agent") || canEdit("id_vehicule");
  const showRealData = canEdit("duree_reelle_min") || canEdit("distance_reelle_km");
  const canChangeStatut = !isReadOnly && !(isGestionnaire && (tournee?.statut === "TERMINEE" || tournee?.statut === "ANNULEE"));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tourneeId ? `Modifier — T-${tourneeId}` : "Modifier la tournée"}
      headerIcon="fa-pen"
      headerColor="#2196F3"
      size="lg"
      showFooter={false}
    >
      {loading && (
        <p className="tournee-modal-info">
          <i className="fas fa-spinner fa-spin"></i> Chargement...
        </p>
      )}

      {!loading && error && !tournee && (
        <p className="tournee-modal-error">{error}</p>
      )}

      {!loading && tournee && (
        <form className="tournee-modal-form" onSubmit={handleSubmit}>

          <p className="tournee-modal-info">
            <i className="fas fa-info-circle"></i> {STATUT_INFO[tournee.statut]}
          </p>

          {showPlanification && (
            <>
              <h4 className="tournee-edit-section-title">Planification</h4>
              <div className="tournee-modal-row">
                <div className="tournee-modal-field">
                  <label htmlFor="edit-date_tournee">Date</label>
                  <input
                    id="edit-date_tournee"
                    name="date_tournee"
                    type="date"
                    value={form.date_tournee}
                    onChange={handleChange}
                    disabled={disabled || !canEdit("date_tournee")}
                  />
                </div>
                <div className="tournee-modal-field">
                  <label htmlFor="edit-heure_debut_prevue">Heure de départ prévue</label>
                  <input
                    id="edit-heure_debut_prevue"
                    name="heure_debut_prevue"
                    type="time"
                    value={form.heure_debut_prevue}
                    onChange={handleChange}
                    disabled={disabled || !canEdit("heure_debut_prevue")}
                  />
                </div>
              </div>

              <div className="tournee-modal-row">
                <div className="tournee-modal-field">
                  <label htmlFor="edit-duree_prevue_min">Durée prévue (min)</label>
                  <input
                    id="edit-duree_prevue_min"
                    name="duree_prevue_min"
                    type="number"
                    min="1"
                    value={form.duree_prevue_min}
                    onChange={handleChange}
                    disabled={disabled || !canEdit("duree_prevue_min")}
                  />
                </div>
                <div className="tournee-modal-field">
                  <label htmlFor="edit-distance_prevue_km">Distance prévue (km)</label>
                  <input
                    id="edit-distance_prevue_km"
                    name="distance_prevue_km"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.distance_prevue_km}
                    onChange={handleChange}
                    disabled={disabled || !canEdit("distance_prevue_km")}
                  />
                </div>
              </div>
            </>
          )}

          {showAssignment && (
            <>
              <h4 className="tournee-edit-section-title">Assignation</h4>
              <div className="tournee-modal-row">
                <div className="tournee-modal-field">
                  <label htmlFor="edit-id_agent">Agent</label>
                  <select
                    id="edit-id_agent"
                    name="id_agent"
                    value={form.id_agent}
                    onChange={handleChange}
                    disabled={disabled || !canEdit("id_agent")}
                  >
                    <option value="">— Sélectionner un agent —</option>
                    {options.agents.map((a) => (
                      <option key={a.id_utilisateur} value={a.id_utilisateur}>
                        {a.prenom} {a.nom} ({a.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tournee-modal-field">
                  <label htmlFor="edit-id_vehicule">Véhicule</label>
                  <select
                    id="edit-id_vehicule"
                    name="id_vehicule"
                    value={form.id_vehicule}
                    onChange={handleChange}
                    disabled={disabled || !canEdit("id_vehicule")}
                  >
                    <option value="">— Aucun véhicule —</option>
                    {options.vehicles.map((v) => (
                      <option key={v.id_vehicule} value={v.id_vehicule}>
                        {v.numero_immatriculation} ({v.modele || "N/A"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {showRealData && (
            <>
              <h4 className="tournee-edit-section-title">Données réelles</h4>
              <div className="tournee-modal-row">
                <div className="tournee-modal-field">
                  <label htmlFor="edit-duree_reelle_min">Durée réelle (min)</label>
                  <input
                    id="edit-duree_reelle_min"
                    name="duree_reelle_min"
                    type="number"
                    min="0"
                    value={form.duree_reelle_min}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                </div>
                <div className="tournee-modal-field">
                  <label htmlFor="edit-distance_reelle_km">Distance réelle (km)</label>
                  <input
                    id="edit-distance_reelle_km"
                    name="distance_reelle_km"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.distance_reelle_km}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                </div>
              </div>
            </>
          )}

          <h4 className="tournee-edit-section-title">Statut</h4>
          {canChangeStatut ? (
            <div className="tournee-statut-row">
              <select
                value={newStatut}
                onChange={(e) => setNewStatut(e.target.value)}
                disabled={disabled}
              >
                {(isGestionnaire ? GESTIONNAIRE_STATUT_OPTIONS : ALL_STATUT_OPTIONS).map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-statut-apply"
                onClick={handleStatutApply}
                disabled={disabled || newStatut === tournee.statut}
              >
                {statutSubmitting ? <i className="fas fa-spinner fa-spin"></i> : "Appliquer"}
              </button>
            </div>
          ) : (
            <p className="tournee-modal-info">
              {isReadOnly ? "Tournée annulée — statut non modifiable." : "Tournée clôturée — statut non modifiable."}
            </p>
          )}

          {error && <p className="tournee-modal-error">{error}</p>}

          {!isReadOnly && (
            <div className="tournee-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={disabled}
              >
                Fermer
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={disabled}
              >
                {submitting
                  ? <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
                  : "Enregistrer les modifications"}
              </button>
            </div>
          )}

          {isReadOnly && (
            <div className="tournee-modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Fermer</button>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
