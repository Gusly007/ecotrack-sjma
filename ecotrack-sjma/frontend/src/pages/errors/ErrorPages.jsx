import { Link } from 'react-router-dom';
import './ErrorPages.css';

// Page d'erreur commune. `inLayout` : affichée dans le layout desktop ou mobile
// citoyen (qui a déjà son propre <h1>) plutôt qu'en plein écran.
function ErrorPage({ code, icon, title, message, homePath, homeLabel, inLayout }) {
  const Heading = inLayout ? 'h2' : 'h1';

  return (
    <div className={`error-page${inLayout ? ' error-page--in-layout' : ''}`}>
      <div className="error-page-box">
        <i className={`fas ${icon} error-page-icon`} aria-hidden="true"></i>
        <p className="error-page-code">Erreur {code}</p>
        <Heading className="error-page-title">{title}</Heading>
        <p className="error-page-message">{message}</p>
        <Link to={homePath} className="error-page-link">{homeLabel}</Link>
      </div>
    </div>
  );
}

export function NotFoundPage({ homePath = '/', inLayout = false }) {
  return (
    <ErrorPage
      code="404"
      icon="fa-compass"
      title="Page introuvable"
      message="L'adresse demandée n'existe pas ou a été déplacée."
      homePath={homePath}
      homeLabel="Retour à l'accueil"
      inLayout={inLayout}
    />
  );
}

// '/' renvoie chaque rôle vers son espace (RootRedirect) : pas de logique de rôle ici.
export function UnauthorizedPage() {
  return (
    <ErrorPage
      code="403"
      icon="fa-lock"
      title="Accès refusé"
      message="Votre compte n'a pas accès à cette page."
      homePath="/"
      homeLabel="Retour à mon espace"
    />
  );
}
