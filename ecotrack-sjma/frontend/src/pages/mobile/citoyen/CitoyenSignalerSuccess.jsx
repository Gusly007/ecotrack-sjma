import { useLocation, useNavigate } from 'react-router-dom';
import './CitoyenSignalerSuccess.css';

export default function CitoyenSignalerSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const ticketNumber = state?.id ? `#${state.id}` : '#SIG-NOUVEAU';

  return (
    <div className="signaler-success">
      <div className="success-icon-wrap">
        <div className="success-circle"><i className="fas fa-check"></i></div>
      </div>
      <h2>Signalement envoyé !</h2>
      <p>Votre signalement a bien été transmis aux équipes concernées.</p>
      <p className="success-points-info">Vous serez crédités de <strong>10 EcoPoints</strong> une fois votre signalement validé par nos équipes.</p>
      <div className="success-ticket">
        <span>Numéro de ticket</span>
        <strong>{ticketNumber}</strong>
      </div>
      <p className="success-delay">Délai de traitement estimé : <strong>24–48h</strong></p>

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
