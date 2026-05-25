import { useLocation, useNavigate } from 'react-router-dom';
import {
  estimateKgTries,
  estimateKgCO2,
  METHODOLOGY_NOTE,
} from '../../../utils/impactEstimation';
import './CitoyenSignalerSuccess.css';

export default function CitoyenSignalerSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const ticketNumber = state?.id ? `#SIG-${new Date().getFullYear()}-${String(state.id).padStart(6, '0')}` : '#SIG-NOUVEAU';

  // Impact prévisionnel ADEME — uniquement si on a un typeCode dans le state
  // (le citoyen vient bien de créer un signalement). Les valeurs sont des
  // médianes corrigées par le multiplicateur d'urgence ; un signalement
  // sans filière (capteur défaillant) ne contribue pas au CO₂.
  const typeCode = state?.typeCode || null;
  const urgence = state?.urgence || state?.payload?.urgence || 'MOYENNE';
  const kgTries = typeCode ? estimateKgTries(typeCode, urgence) : 0;
  const kgCO2 = typeCode ? estimateKgCO2(typeCode, urgence) : 0;
  const showImpact = typeCode && (kgTries > 0 || kgCO2 > 0);

  return (
    <div className="signaler-success">
      <div className="success-icon-wrap">
        <div className="success-circle"><i className="fas fa-check"></i></div>
      </div>
      <h2>Signalement envoyé !</h2>
      <p>Votre signalement a bien été transmis aux équipes concernées.</p>
      <div className="success-points-badge">
        <i className="fas fa-star"></i> +10 EcoPoints crédités
      </div>
      <div className="success-ticket">
        <span>Numéro de ticket</span>
        <strong>{ticketNumber}</strong>
      </div>
      <p className="success-delay">Délai de traitement estimé : <strong>24–48h</strong></p>

      {showImpact && (
        <div className="success-impact-card" role="region" aria-label="Impact estimé">
          <div className="success-impact-header">
            <i className="fas fa-leaf"></i>
            <strong>Impact estimé si traité</strong>
          </div>
          <div className="success-impact-grid">
            <div className="success-impact-item">
              <span className="success-impact-value">≈ {kgTries} kg</span>
              <span className="success-impact-label">Déchets potentiellement triés</span>
            </div>
            {kgCO2 > 0 && (
              <div className="success-impact-item">
                <span className="success-impact-value">≈ {kgCO2} kg</span>
                <span className="success-impact-label">CO₂ évité (équivalent)</span>
              </div>
            )}
          </div>
          <p className="success-impact-note">{METHODOLOGY_NOTE}</p>
        </div>
      )}

      <div className="success-actions">
        <button className="sig-btn-primary" onClick={() => navigate('/citoyen')}>
          Retour à l'accueil
        </button>
        <button className="sig-btn-outline" onClick={() => navigate('/citoyen/signalements')}>
          Mes signalements
        </button>
      </div>
    </div>
  );
}
