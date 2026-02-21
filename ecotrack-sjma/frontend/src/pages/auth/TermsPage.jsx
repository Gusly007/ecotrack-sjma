import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-box" style={{ maxWidth: '800px' }}>
          <Link to="/register" className="back-link">
            <i className="fas fa-arrow-left"></i> Retour à l'inscription
          </Link>

          <div className="auth-header">
            <div className="auth-logo">
              <i className="fas fa-file-contract"></i>
            </div>
            <h1>Conditions Générales d'Utilisation</h1>
            <p>Dernière mise à jour : Février 2026</p>
          </div>

          <div className="legal-content">
            <section>
              <h2>1. Objet</h2>
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation de la plateforme EcoTrack, application de gestion des déchets et de sensibilisation environnementale.
              </p>
            </section>

            <section>
              <h2>2. Acceptance des conditions</h2>
              <p>
                L'utilisation de la plateforme EcoTrack implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.
              </p>
            </section>

            <section>
              <h2>3. Description des services</h2>
              <p>
                EcoTrack propose les fonctionnalités suivantes :
              </p>
              <ul>
                <li>Signalement de problèmes environnementaux (déchets abandonnés, conteneurs défaillants)</li>
                <li>Suivi des tournées de collecte</li>
                <li>Gestion des conteneurs et des véhicules</li>
                <li>Système de gamification et奖励 (points, badges)</li>
                <li>Tableau de bord analytique pour les gestionnaires</li>
              </ul>
            </section>

            <section>
              <h2>4. Comptes utilisateurs</h2>
              <p>
                Lors de votre inscription, vous vous engagez à fournir des informations exactes et à les maintenir à jour. Vous êtes responsable de la confidentialité de votre mot de passe et de toutes les activités effectuées sous votre compte.
              </p>
            </section>

            <section>
              <h2>5. Responsabilités</h2>
              <p>
                <strong>Utilisateurs :</strong> Vous acceptez d'utiliser la plateforme de manière responsable et conforme à la loi. Toute utilisation abusive ou frauduleuse peut entraîner la suspension ou la suppression de votre compte.
              </p>
              <p>
                <strong>EcoTrack :</strong> Nous nous engageons à fournir un service accessible et sécurisé, mais nous ne garantissons pas l'absence d'interruptions ou d'erreurs.
              </p>
            </section>

            <section>
              <h2>6. Propriété intellectuelle</h2>
              <p>
                L'ensemble des contenus, graphismes, logos et technologies présents sur EcoTrack sont protégés par les droits de propriété intellectuelle. Toute reproduction ou utilisation sans autorisation préalable est interdite.
              </p>
            </section>

            <section>
              <h2>7. Protection des données personnelles</h2>
              <p>
                La collecte et le traitement de vos données personnelles sont régis par notre Politique de Confidentialité, disponible sur cette plateforme. En utilisant EcoTrack, vous consentez à ce traitement.
              </p>
            </section>

            <section>
              <h2>8. Modification des CGU</h2>
              <p>
                EcoTrack se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur la plateforme.
              </p>
            </section>

            <section>
              <h2>9. Contact</h2>
              <p>
                Pour toute question concernant ces CGU, vous pouvez nous contacter à l'adresse : support@ecotrack.fr
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
