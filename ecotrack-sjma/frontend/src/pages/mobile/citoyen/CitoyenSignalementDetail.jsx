import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MobileScreenHeader from '../../../components/mobile/MobileScreenHeader';
import { citoyenService } from '../../../services/citoyenService';
import { safeImageSrc } from '../../../utils/security';
import {
  impactForSignalement,
  METHODOLOGY_NOTE,
} from '../../../utils/impactEstimation';
import './CitoyenSignalementDetail.css';

const badgeClassMap = { new: 'badge-new', progress: 'badge-progress', resolved: 'badge-resolved', rejected: 'badge-rejected' };
const urgenceColors = { Haute: '#f44336', Moyenne: '#FF9800', Basse: '#4CAF50' };

const STATUT_TO_UI = {
  OUVERT: { statusType: 'new', status: 'Nouveau' },
  EN_COURS: { statusType: 'progress', status: 'En cours' },
  RESOLU: { statusType: 'resolved', status: 'Résolu' },
  FERME: { statusType: 'rejected', status: 'Rejeté' },
};

function buildTimeline(statut, history = []) {
  const timeline = [
    { step: 'Signalement envoyé', done: true },
    { step: 'Pris en charge', done: ['EN_COURS', 'RESOLU', 'FERME'].includes(statut) },
    { step: 'En cours de traitement', done: ['EN_COURS', 'RESOLU'].includes(statut) },
    { step: 'Résolu', done: statut === 'RESOLU' },
  ];
  // Enrichit chaque étape avec sa date via l'historique des changements de statut.
  if (history && history.length > 0) {
    history.forEach((h) => {
      const d = new Date(h.date_modification || h.date_creation);
      const fmt = d.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      if (h.nouveau_statut === 'EN_COURS' && timeline[1]) timeline[1].date = fmt;
      if (h.nouveau_statut === 'RESOLU' && timeline[3]) timeline[3].date = fmt;
    });
  }
  return timeline;
}

// FERME = pas de bandeau (section masquée — pas d'impact à afficher sur un rejet).
const IMPACT_BANDEAU = {
  OUVERT:   { className: 'sig-impact-band sig-impact-band-blue',   icon: 'fa-hourglass-half', label: 'En attente — fourchette estimée' },
  EN_COURS: { className: 'sig-impact-band sig-impact-band-yellow', icon: 'fa-check-circle',   label: 'Validé — impact en cours' },
  RESOLU:   { className: 'sig-impact-band sig-impact-band-green',  icon: 'fa-leaf',           label: 'Résolu — Merci !' },
};

export default function CitoyenSignalementDetail() {
  const { id } = useParams();
  const [sig, setSig] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [detail, hist] = await Promise.allSettled([
          citoyenService.getSignalementById(id),
          citoyenService.getSignalementHistory(id).catch(() => []),
        ]);
        if (!alive) return;
        if (detail.status === 'fulfilled' && detail.value) {
          setSig(detail.value);
        } else {
          setError('Signalement introuvable');
        }
        if (hist.status === 'fulfilled') {
          setHistory(Array.isArray(hist.value) ? hist.value : []);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="sig-detail-page">
        <MobileScreenHeader title="Signalement" backTo="/citoyen/signalements" />
        <p style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chargement…</p>
      </div>
    );
  }

  if (error || !sig) {
    return (
      <div className="sig-detail-page">
        <MobileScreenHeader title="Signalement" backTo="/citoyen/signalements" />
        <p style={{ textAlign: 'center', padding: 40, color: '#f44336' }}>{error || 'Erreur'}</p>
      </div>
    );
  }

  const ui = STATUT_TO_UI[sig.statut] || STATUT_TO_UI.OUVERT;
  const urgenceLabel = sig.urgence === 'HAUTE' ? 'Haute' : sig.urgence === 'BASSE' ? 'Basse' : 'Moyenne';
  const type = (sig.type_signalement || '').replace(/_/g, ' ').toLowerCase() || 'Signalement';
  const dateStr = sig.date_creation
    ? new Date(sig.date_creation).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const timeline = buildTimeline(sig.statut, history);

  // Bloque les schémas dangereux (javascript:, data:text/html, etc.) avant
  // le rendu <img>. null → on masque le bloc photo entièrement.
  const photoSrc = safeImageSrc(sig.url_photo);

  const impact = impactForSignalement(sig);
  const bandeau = IMPACT_BANDEAU[sig.statut] || null;
  const showImpact = !!bandeau && impact;

  return (
    <div className="sig-detail-page">
      <MobileScreenHeader
        title={`#${sig.id_signalement}`}
        backTo="/citoyen/signalements"
        rightAction={<span className={`mes-sig-badge ${badgeClassMap[ui.statusType]}`}>{ui.status}</span>}
      />

      <div className="sig-detail-body">
        <section className="sig-detail-section">
          <h4>Suivi du signalement</h4>
          <div className="sig-full-timeline">
            {timeline.map((step, i) => (
              <div key={i} className={`sig-tl-item ${step.done ? 'done' : ''}`}>
                <div className="sig-tl-left">
                  <div className="sig-tl-dot" />
                  {i < timeline.length - 1 && <div className="sig-tl-line" />}
                </div>
                <div className="sig-tl-content">
                  <strong>{step.step}</strong>
                  {step.date && <span>{step.date}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="sig-detail-section">
          <h4>Informations</h4>
          <div className="sig-info-grid">
            <div className="sig-info-row"><span>Type</span><strong>{type}</strong></div>
            <div className="sig-info-row"><span>Conteneur</span><strong>{sig.conteneur_uid || `#${sig.id_conteneur}`}</strong></div>
            <div className="sig-info-row"><span>Adresse</span><strong>{sig.zone_nom || '—'}</strong></div>
            <div className="sig-info-row">
              <span>Urgence</span>
              <strong style={{ color: urgenceColors[urgenceLabel] }}>{urgenceLabel}</strong>
            </div>
            <div className="sig-info-row"><span>Date</span><strong>{dateStr}</strong></div>
          </div>
        </section>

        <section className="sig-detail-section">
          <h4>Description</h4>
          <p className="sig-description">{sig.description || '—'}</p>
        </section>

        {photoSrc && (
          <section className="sig-detail-section">
            <h4>Photo</h4>
            <img
              src={photoSrc}
              alt="Photo du signalement"
              style={{
                width: '100%',
                maxHeight: 360,
                objectFit: 'cover',
                borderRadius: 10,
                background: '#f5f5f5',
              }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </section>
        )}

        {showImpact && (
          <section className="sig-detail-section">
            <h4>Impact environnemental</h4>
            <div className={bandeau.className}>
              <i className={`fas ${bandeau.icon}`} aria-hidden="true" />
              <span>{bandeau.label}</span>
            </div>

            {sig.statut === 'OUVERT' && (
              <div className="sig-impact-grid">
                <div className="sig-impact-item">
                  <span className="sig-impact-value">
                    {impact.estimation.rangeTries.min} – {impact.estimation.rangeTries.max} kg
                  </span>
                  <span className="sig-impact-label">Déchets potentiellement triés</span>
                </div>
                {impact.hasCO2Filiere && (
                  <div className="sig-impact-item">
                    <span className="sig-impact-value">
                      {impact.estimation.rangeCO2.min} – {impact.estimation.rangeCO2.max} kg
                    </span>
                    <span className="sig-impact-label">CO₂ évitable (équivalent)</span>
                  </div>
                )}
              </div>
            )}

            {(sig.statut === 'EN_COURS' || sig.statut === 'RESOLU') && (
              <div className="sig-impact-grid">
                <div className="sig-impact-item">
                  <span className="sig-impact-value">≈ {impact.estimation.kgTries} kg</span>
                  <span className="sig-impact-label">
                    {sig.statut === 'RESOLU' ? 'Déchets triés (estimé)' : 'Déchets triés (en cours)'}
                  </span>
                </div>
                {impact.hasCO2Filiere && sig.statut === 'RESOLU' && impact.estimation.kgCO2 > 0 && (
                  <div className="sig-impact-item">
                    <span className="sig-impact-value">≈ {impact.estimation.kgCO2} kg</span>
                    <span className="sig-impact-label">CO₂ évité (équivalent)</span>
                  </div>
                )}
                {impact.hasCO2Filiere && sig.statut === 'EN_COURS' && impact.estimation.kgCO2 > 0 && (
                  <div className="sig-impact-item">
                    <span className="sig-impact-value">≈ {impact.estimation.kgCO2} kg</span>
                    <span className="sig-impact-label">CO₂ évitable (équivalent)</span>
                  </div>
                )}
              </div>
            )}

            {!impact.hasCO2Filiere && (
              <p className="sig-impact-note-small">
                Ce type de signalement améliore l'opérationnel : pas de filière de
                valorisation matière directe associée.
              </p>
            )}

            <p className="sig-impact-note">{METHODOLOGY_NOTE}</p>
          </section>
        )}
      </div>
    </div>
  );
}
