import { Link } from 'react-router-dom';
import './CitoyenLanding.css';

// Page d'atterrissage publique à la racine /. Permet aux citoyens d'accéder
// à leur propre flow d'inscription/connexion sans toucher au LoginPage
// partagé (qui pointe vers "Contacter un administrateur"). Les ADMIN /
// GESTIONNAIRE / AGENT passent par le bouton "Personnel EcoTrack" et
// retombent sur le /login upstream inchangé.

export default function CitoyenLanding() {
  return (
    <div className="citoyen-landing">
      <div className="citoyen-landing-inner">
        <div className="citoyen-landing-header">
          <div className="citoyen-landing-logo" aria-hidden="true">
            <i className="fas fa-leaf"></i>
          </div>
          <h1>EcoTrack</h1>
          <p>Plateforme intelligente de gestion des déchets</p>
        </div>

        <div className="citoyen-landing-cards">
          <Link to="/citoyen/login" className="citoyen-landing-card citoyen-landing-card-primary">
            <div className="citoyen-landing-card-icon" aria-hidden="true">
              <i className="fas fa-user"></i>
            </div>
            <h2>Je suis citoyen</h2>
            <p>Signaler, suivre et agir pour mon quartier.</p>
            <span className="citoyen-landing-card-cta">
              Continuer <i className="fas fa-arrow-right"></i>
            </span>
          </Link>

          <Link to="/login" className="citoyen-landing-card citoyen-landing-card-secondary">
            <div className="citoyen-landing-card-icon" aria-hidden="true">
              <i className="fas fa-briefcase"></i>
            </div>
            <h2>Personnel EcoTrack</h2>
            <p>Admin, gestionnaire ou agent.</p>
            <span className="citoyen-landing-card-cta">
              Continuer <i className="fas fa-arrow-right"></i>
            </span>
          </Link>
        </div>

        <p className="citoyen-landing-footnote">
          Vous n'avez pas encore de compte citoyen ?{' '}
          <Link to="/citoyen/inscription">Créer un compte</Link>.
        </p>
      </div>
    </div>
  );
}
