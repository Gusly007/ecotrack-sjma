import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { useAlert } from '../../../hooks';
import { useGeolocation } from '../../../hooks';
import { fetchMyTournee, reportAnomalie } from '../../../services/tourneeService';
import { containerService } from '../../../services/containerService';
import './AnomalieForm.css';

const ANOMALIE_TYPES = [
  { value: 'CONTENEUR_INACCESSIBLE', label: 'Acces bloque',        icon: 'fa-car' },
  { value: 'CONTENEUR_ENDOMMAGE',    label: 'Conteneur endommage', icon: 'fa-tools' },
  { value: 'CAPTEUR_DEFAILLANT',     label: 'Capteur defectueux',  icon: 'fa-microchip' },
];

const GRAVITE_LEVELS = ['Basse', 'Moyenne', 'Haute', 'Critique'];

export default function AnomalieForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useAlert();
  const { position } = useGeolocation();
  const [tourneeId, setTourneeId]       = useState(null);
  const [uidInput, setUidInput]         = useState(searchParams.get('uid') || '');
  const [container, setContainer]       = useState(null);
  const [uidError, setUidError]         = useState('');
  const [form, setForm] = useState({
    type_anomalie: 'CONTENEUR_INACCESSIBLE',
    description: '',
    gravite: 'Moyenne',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyTournee()
      .then(t => { if (t?.id_tournee) setTourneeId(t.id_tournee); })
      .catch(() => {});
  }, []);

  // Auto-fetch container if uid passed via URL
  useEffect(() => {
    const uid = searchParams.get('uid');
    if (uid) lookupContainer(uid);
  }, []);

  const lookupContainer = async (uid) => {
    if (!uid.trim()) { setContainer(null); setUidError(''); return; }
    setUidError('');
    try {
      const res = await containerService.getByUid(uid.trim().toUpperCase());
      if (res?.id_conteneur) {
        setContainer(res);
      } else {
        setContainer(null);
        setUidError('Conteneur introuvable');
      }
    } catch {
      setContainer(null);
      setUidError('Conteneur introuvable');
    }
  };

  const handleUidBlur = () => lookupContainer(uidInput);

  const handleSubmit = async () => {
    if (!tourneeId) { showError('Aucune tournee active'); return; }
    if (!container)  { showError('Veuillez saisir un UID de conteneur valide'); return; }
    if (!form.description.trim()) { showError('Veuillez decrire le probleme'); return; }

    setSubmitting(true);
    try {
      await reportAnomalie(tourneeId, {
        type_anomalie: form.type_anomalie,
        description:   form.description,
        id_conteneur:  container.id_conteneur,
        gravite:       form.gravite,
      });
      showSuccess('Anomalie signalee avec succes !');
      navigate('/agent/tournee');
    } catch (err) {
      showError(err.response?.data?.message || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Signaler une anomalie" showBack>

      {/* Conteneur */}
      <h3 className="form-section-title">Conteneur concerne</h3>
      <div className="uid-lookup-row">
        <input
          className="form-input-mobile"
          type="text"
          placeholder="Ex: CNT-00001"
          value={uidInput}
          onChange={e => { setUidInput(e.target.value); setUidError(''); setContainer(null); }}
          onBlur={handleUidBlur}
          style={{ textTransform: 'uppercase' }}
        />
        <button className="btn-outline-mobile btn-sm-icon" onClick={() => lookupContainer(uidInput)}>
          <i className="fas fa-search"></i>
        </button>
      </div>
      {uidError && <p style={{ color: '#f44336', fontSize: '0.8rem', margin: '4px 0 0' }}>{uidError}</p>}
      {container && (
        <MobileCard style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-check-circle" style={{ color: '#4CAF50', fontSize: '1.1rem' }}></i>
            <div>
              <strong style={{ fontFamily: 'monospace' }}>{container.uid}</strong>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>
                {container.zone_nom || container.adresse || ''}
              </p>
            </div>
          </div>
        </MobileCard>
      )}

      {/* Type */}
      <h3 className="form-section-title" style={{ marginTop: 16 }}>Type d'anomalie</h3>
      <div className="anomalie-type-grid">
        {ANOMALIE_TYPES.map(t => (
          <button
            key={t.value}
            className={`anomalie-type-btn ${form.type_anomalie === t.value ? 'active' : ''}`}
            onClick={() => setForm({ ...form, type_anomalie: t.value })}
          >
            <i className={`fas ${t.icon}`}></i>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Gravite */}
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

      {/* Description */}
      <h3 className="form-section-title">Description</h3>
      <textarea
        className="form-textarea-mobile"
        placeholder="Decrivez le probleme en detail..."
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={4}
      />

      {/* Geoloc */}
      {position && (
        <div className="geo-info" style={{ marginTop: 12 }}>
          <i className="fas fa-map-marker-alt" style={{ color: '#2196F3', fontSize: '1.1rem' }}></i>
          <div>
            <strong>Position detectee</strong>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </p>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button className="btn-outline-mobile" onClick={() => navigate(-1)}>Annuler</button>
        <button
          className="btn-primary-mobile"
          onClick={handleSubmit}
          disabled={submitting || !container}
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
