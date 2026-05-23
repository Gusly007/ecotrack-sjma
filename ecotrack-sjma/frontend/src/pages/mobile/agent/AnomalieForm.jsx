import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { useAlert } from '../../../hooks';
import { useGeolocation } from '../../../hooks';
import { fetchMyTournee, fetchEtapes, reportAnomalie } from '../../../services/tourneeService';
import { containerService } from '../../../services/containerService';
import './AnomalieForm.css';

const ANOMALIE_TYPES = [
  { value: 'CONTENEUR_INACCESSIBLE', label: 'Acces bloque', icon: 'fa-car' },
  { value: 'CONTENEUR_ENDOMMAGE', label: 'Conteneur endommage', icon: 'fa-tools' },
  { value: 'CAPTEUR_DEFAILLANT', label: 'Capteur defectueux', icon: 'fa-microchip' },
  { value: 'CONTENEUR_PLEIN', label: 'Conteneur plein', icon: 'fa-fill' },
  { value: 'CONTENEUR_SALE', label: 'Conteneur sale', icon: 'fa-broom' },
  { value: 'MAUVAISE_ODEUR', label: 'Mauvaise odeur', icon: 'fa-wind' },
];

const GRAVITE_LEVELS = ['Basse', 'Moyenne', 'Haute', 'Critique'];

export default function AnomalieForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { showSuccess, showError } = useAlert();
  const { position } = useGeolocation();

  const [tourneeId, setTourneeId] = useState(null);
  const [containers, setContainers] = useState([]);
  const [loadingContainers, setLoadingContainers] = useState(true);
  const [form, setForm] = useState({
    type: 'CONTENEUR_INACCESSIBLE',
    description: '',
    gravite: 'Moyenne',
    id_conteneur: null,
    conteneur_uid: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Pre-selection via ?container=UID query param
  useEffect(() => {
    const containerUid = params.get('container');
    if (!containerUid) return;
    (async () => {
      try {
        const res = await containerService.getByUid(containerUid);
        const c = res?.data ?? res;
        if (c?.id_conteneur) {
          setForm((f) => ({ ...f, id_conteneur: c.id_conteneur, conteneur_uid: c.uid }));
        }
      } catch { /* ignore */ }
    })();
  }, [params]);

  useEffect(() => {
    (async () => {
      try {
        const t = await fetchMyTournee();
        if (!t?.id_tournee) {
          setLoadingContainers(false);
          return;
        }
        setTourneeId(t.id_tournee);
        const etapes = await fetchEtapes(t.id_tournee);
        const list = (etapes || []).map((e) => ({
          id: e.id_conteneur,
          uid: e.conteneur_uid || `Conteneur #${e.id_conteneur}`,
          zone: e.zone_nom || '',
        }));
        setContainers(list);
      } catch {
        setContainers([]);
      } finally {
        setLoadingContainers(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!tourneeId) {
      showError('Aucune tournee active');
      return;
    }
    if (!form.id_conteneur) {
      showError('Veuillez selectionner un conteneur');
      return;
    }
    if (!form.description.trim()) {
      showError('Veuillez decrire le probleme');
      return;
    }
    setSubmitting(true);
    try {
      await reportAnomalie(tourneeId, {
        id_conteneur: form.id_conteneur,
        type_anomalie: form.type,
        description: form.description.trim(),
        gravite: form.gravite,
      });
      showSuccess('Anomalie signalee avec succes');
      navigate('/agent/anomalie');
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || 'Erreur lors de l\'envoi';
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Signaler une anomalie" showBack>
      {form.conteneur_uid && (
        <MobileCard className="selected-container-card">
          <i className="fas fa-check-circle" style={{ color: '#4CAF50' }}></i>
          <strong>{form.conteneur_uid}</strong>
        </MobileCard>
      )}

      <h3 className="form-section-title">Conteneur concerne</h3>
      {loadingContainers ? (
        <p style={{ fontSize: '0.85rem', color: '#888' }}>Chargement…</p>
      ) : containers.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#f44336' }}>
          Aucun conteneur dans votre tournee. Scannez d'abord un conteneur ou utilisez la liste depuis la tournee.
        </p>
      ) : (
        <select
          className="form-input-mobile"
          value={form.id_conteneur ?? ''}
          onChange={(e) => {
            const id = parseInt(e.target.value, 10);
            const found = containers.find((c) => c.id === id);
            setForm({ ...form, id_conteneur: id, conteneur_uid: found?.uid || '' });
          }}
        >
          <option value="">— Choisir —</option>
          {containers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.uid} {c.zone ? `(${c.zone})` : ''}
            </option>
          ))}
        </select>
      )}

      <h3 className="form-section-title">Type d'anomalie</h3>
      <div className="anomalie-type-grid">
        {ANOMALIE_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`anomalie-type-btn ${form.type === t.value ? 'active' : ''}`}
            onClick={() => setForm({ ...form, type: t.value })}
          >
            <i className={`fas ${t.icon}`}></i>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <h3 className="form-section-title">Gravite</h3>
      <div className="gravite-selector">
        {GRAVITE_LEVELS.map((g) => (
          <button
            key={g}
            type="button"
            className={`gravite-btn ${form.gravite === g ? 'active' : ''}`}
            onClick={() => setForm({ ...form, gravite: g })}
          >
            {g}
          </button>
        ))}
      </div>

      <h3 className="form-section-title">Description</h3>
      <textarea
        className="form-textarea-mobile"
        placeholder="Decrivez le probleme en detail..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={4}
      />

      {position && (
        <>
          <h3 className="form-section-title">Geolocalisation</h3>
          <div className="geo-info">
            <i className="fas fa-map-marker-alt" style={{ color: '#2196F3', fontSize: '1.2rem' }}></i>
            <div>
              <strong>Position detectee automatiquement</strong>
              <p>{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>
            </div>
          </div>
        </>
      )}

      <div className="form-actions">
        <button type="button" className="btn-outline-mobile" onClick={() => navigate(-1)}>Annuler</button>
        <button
          type="button"
          className="btn-primary-mobile"
          onClick={handleSubmit}
          disabled={submitting || !form.id_conteneur || !form.description.trim()}
        >
          {submitting
            ? <><i className="fas fa-spinner fa-spin"></i> Envoi...</>
            : <><i className="fas fa-paper-plane"></i> Envoyer</>
          }
        </button>
      </div>
    </MobileLayout>
  );
}
