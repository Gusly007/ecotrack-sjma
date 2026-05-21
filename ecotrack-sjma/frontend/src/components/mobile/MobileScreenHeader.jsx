import { useNavigate, useLocation } from 'react-router-dom';
import './MobileScreenHeader.css';

// En-tête mobile partagé : titre + bouton retour + action droite optionnelle.
//
// Politique de retour (corrige le bug "back va toujours à l'accueil") :
//   1. `onBack` fourni       → priorité absolue (handler personnalisé).
//   2. Pile d'historique     → `navigate(-1)` pour respecter le parcours
//                              réel de l'utilisateur (Profil → Tri → back
//                              renvoie sur Profil, pas sur l'accueil).
//   3. `backTo` fourni       → utilisé en repli, uniquement si l'utilisateur
//                              est arrivé directement sur la page (lien
//                              profond, rafraîchissement F5, partage d'URL).
//   4. Aucun des trois       → repli `/citoyen`.
//
// `location.key === 'default'` indique qu'aucune navigation n'a précédé
// cette page dans la session courante (React Router v7).
export default function MobileScreenHeader({ title, backTo, onBack, rightAction }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    // Pile d'historique disponible → retour réel.
    if (location.key && location.key !== 'default') {
      navigate(-1);
      return;
    }
    // Lien profond / refresh : on retombe sur la cible explicite ou
    // l'accueil citoyen.
    if (backTo) { navigate(backTo); return; }
    navigate('/citoyen');
  };

  return (
    <header className="mobile-screen-header">
      <button className="mobile-header-back" onClick={handleBack} aria-label="Retour">
        <i className="fas fa-arrow-left"></i>
      </button>
      <h2>{title}</h2>
      <div className="mobile-header-right">
        {rightAction || null}
      </div>
    </header>
  );
}
