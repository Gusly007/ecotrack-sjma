import { useCallback, useEffect, useState } from "react";
import Modal from "../../common/Modal";
import {
  fetchTourneeById,
  fetchTourneeCreationOptions,
  updateTournee,
  updateTourneeStatut,
} from "../../../services/tourneeService";
import { getErrorMessage } from "../../../utils/formatters";

const STATUT_OPTIONS = [
  { value: "PLANIFIEE", label: "Planifiée" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Terminée" },
  { value: "ANNULEE", label: "Annulée" },
];

function buildInitialForm(raw) {
  return {
    date_tournee: raw.date_tournee ? String(raw.date_tournee).slice(0, 10) : "",
    heure_debut_prevue: raw.heure_debut_prevue ? String(raw.heure_debut_prevue).slice(0, 5) : "07:30",
    duree_prevue_min: raw.duree_prevue_min ?? "",
    distance_prevue_km: raw.distance_prevue_km ?? "",
    id_agent: raw.id_agent ?? "",
    id_zone: raw.id_zone ?? "",
    id_vehicule: raw.id_vehicule ?? "",
    duree_reelle_min: raw.duree_reelle_min ?? "",
    distance_reelle_km: raw.distance_reelle_km ?? "",
  };
}

export default function TourneeEditModal({ tourneeId, isOpen, onClose, onSuccess }) {
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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");

    const payload = {};
    if (form.date_tournee) payload.date_tournee = form.date_tournee;
    if (form.heure_debut_prevue) payload.heure_debut_prevue = form.heure_debut_prevue;
    if (form.duree_prevue_min !== "") payload.duree_prevue_min = Number(form.duree_prevue_min);
    if (form.distance_prevue_km !== "") payload.distance_prevue_km = Number(form.distance_prevue_km);
    if (form.id_agent !== "") payload.id_agent = Number(form.id_agent);
    if (form.id_zone !== "") payload.id_zone = Number(form.id_zone);
    payload.id_vehicule = form.id_vehicule !== "" ? Number(form.id_vehicule) : null;
    if (form.duree_reelle_min !== "") payload.duree_reelle_min = Number(form.duree_reelle_min);
    if (form.distance_reelle_km !== "") payload.distance_reelle_km = Number(form.distance_reelle_km);

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
  }, [form, tourneeId, onSuccess, onClose]);

  const handleStatutApply = useCallback(async () => {
    if (!newStatut || newStatut === tournee?.statut) return;
    setError("");
    try {
      setStatutSubmitting(true);
      await updateTourneeStatut(tourneeId, newStatut);
      const label = STATUT_OPTIONS.find((s) => s.value === newStatut)?.label ?? newStatut;
      onSuccess?.(`Statut changé en "${label}" avec succès.`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de changer le statut."));
    } finally {
      setStatutSubmitting(false);
    }
  }, [newStatut, tournee, tourneeId, onSuccess, onClose]);

  const showRealData = tournee?.statut === "EN_COURS" || tournee?.statut === "TERMINEE";
  const disabled = submitting || statutSubmitting;

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
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
              />
            </div>
          </div>

          <div className="tournee-modal-row">
            <div className="tournee-modal-field">
              <label htmlFor="edit-id_agent">Agent</label>
              <select
                id="edit-id_agent"
                name="id_agent"
                value={form.id_agent}
                onChange={handleChange}
                disabled={disabled}
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
              <label htmlFor="edit-id_zone">Zone</label>
              <select
                id="edit-id_zone"
                name="id_zone"
                value={form.id_zone}
                onChange={handleChange}
                disabled={disabled}
              >
                <option value="">— Sélectionner une zone —</option>
                {options.zones.map((z) => (
                  <option key={z.id_zone} value={z.id_zone}>
                    {z.nom} ({z.code})
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
                disabled={disabled}
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
          <div className="tournee-statut-row">
            <select
              value={newStatut}
              onChange={(e) => setNewStatut(e.target.value)}
              disabled={disabled}
            >
              {STATUT_OPTIONS.map((s) => (
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

          {error && <p className="tournee-modal-error">{error}</p>}

          <div className="tournee-modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={disabled}
            >
              Annuler
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
        </form>
      )}
    </Modal>
  );
}
