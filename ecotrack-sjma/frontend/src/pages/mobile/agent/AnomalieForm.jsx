import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { useAlert } from '../../../hooks';
import { useGeolocation } from '../../../hooks';
import { fetchMyTournee, reportAnomalie } from '../../../services/tourneeService';
import './AnomalieForm.css';

const ANOMALIE_TYPES = [
  { value: 'CONTENEUR_INACCESSIBLE', label: 'Acces bloque', icon: 'fa-car' },
  { value: 'CONTENEUR_ENDOMMAGE', label: 'Conteneur endommage', icon: 'fa-tools' },
  { value: 'CAPTEUR_DEFAILLANT', label: 'Capteur defectueux', icon: 'fa-microchip' },
  { value: 'AUTRE', label: 'Autre', icon: 'fa-question-circle' },
];

const GRAVITE_LEVELS = ['Basse', 'Moyenne', 'Haute', 'Critique'];

export default function AnomalieForm() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const { position } = useGeolocation();
  const [tourneeId, setTourneeId] = useState(null);
  const [form, setForm] = useState({
    type: 'CONTENEUR_INACCESSIBLE',
    description: '',
    gravite: 'Moyenne',
    id_conteneur: null,
    conteneur_uid: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const t = await fetchMyTournee();
        if (t?.id_tournee) setTourneeId(t.id_tournee);
      } catch { /* ignore */ }
    };
    fetch();
  }, []);

  const handleSubmit = async () => {
    if (!tourneeId) {
      showError('Aucune tournee active');
      return;
    }
    if (!form.description.trim()) {
      showError('Veuillez decrire le probleme');
      return;
    }
    setSubmitting(true);
    try {
      await reportAnomalie(tourneeId, {
        type: form.type,
        description: form.description,
        id_conteneur: form.id_conteneur,
      });
      showSuccess('Anomalie signalee avec succes');
      navigate('/agent/tournee');
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors de l\'envoi');
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

      <h3 className="form-section-title">Type d'anomalie</h3>
      <div className="anomalie-type-grid">
        {ANOMALIE_TYPES.map(t => (
          <button
            key={t.value}
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
        {GRAVITE_LEVELS.map(g => (
          <button
            key={g}
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
        <button className="btn-outline-mobile" onClick={() => navigate(-1)}>Annuler</button>
        <button className="btn-primary-mobile" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? <><i className="fas fa-spinner fa-spin"></i> Envoi...</>
            : <><i className="fas fa-paper-plane"></i> Envoyer</>
          }
        </button>
      </div>
    </MobileLayout>
  );
}
