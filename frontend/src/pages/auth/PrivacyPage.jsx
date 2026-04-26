import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-box" style={{ maxWidth: '800px' }}>
          <Link to="/register" className="back-link">
            <i className="fas fa-arrow-left"></i> Retour à l'inscription
          </Link>

          <div className="auth-header">
            <div className="auth-logo">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h1>Politique de Confidentialité</h1>
            <p>Dernière mise à jour : Février 2026</p>
          </div>

          <div className="legal-content">
            <section>
              <h2>1. Introduction</h2>
              <p>
                La présente Politique de Confidentialité décrit comment EcoTrack collecte, utilise et protège vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
              </p>
            </section>

            <section>
              <h2>2. Données collectées</h2>
              <p>Nous collectons les données suivantes :</p>
              <ul>
                <li><strong>Données d'identification :</strong> Nom, prénom, adresse email</li>
                <li><strong>Données de compte :</strong> Mot de passe chiffré, rôle utilisateur</li>
                <li><strong>Données d'activité :</strong> Signalements créés, points gagnés, badges débloqués</li>
                <li><strong>Données techniques :</strong> Adresse IP, type de navigateur, appareil utilisé</li>
              </ul>
            </section>

            <section>
              <h2>3. Finalités du traitement</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul>
                <li>Créer et gérer votre compte utilisateur</li>
                <li>Vous authentifier lors de la connexion</li>
                <li>Vous permettre de signaler des problèmes environnementaux</li>
                <li>Calculer et attribuer vos points et badges</li>
                <li>Analyser les données pour améliorer nos services</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section>
              <h2>4. Base légale</h2>
              <p>Le traitement de vos données repose sur :</p>
              <ul>
                <li><strong>Exécution d'un contrat :</strong> Pour la création et gestion de votre compte</li>
                <li><strong>Consentement :</strong> Pour les communications marketing (le cas échéant)</li>
                <li><strong>Intérêt légitime :</strong> Pour l'amélioration de nos services et la sécurité</li>
              </ul>
            </section>

            <section>
              <h2>5. Conservation des données</h2>
              <p>
                Vos données sont conservées aussi longtemps que votre compte est actif. Vous pouvez demander la suppression de vos données à tout moment. Après suppression, vos données sont conservées uniquement si la loi l'exige.
              </p>
            </section>

            <section>
              <h2>6. Vos droits</h2>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul>
                <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données</li>
                <li><strong>Droit de rectification :</strong> Corriger des données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
                <li><strong>Droit d'opposition :</strong> Vous opposer au traitement</li>
                <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à : dpo@ecotrack.fr
              </p>
            </section>

            <section>
              <h2>7. Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données :
              </p>
              <ul>
                <li>Chiffrement des mots de passe (bcrypt)</li>
                <li>Protocole HTTPS pour toutes les communications</li>
                <li>Stockage sécurisé des bases de données</li>
                <li>Contrôle d'accès aux données</li>
              </ul>
            </section>

            <section>
              <h2>8. Cookies</h2>
              <p>
                EcoTrack utilise des cookies strictement nécessaires au fonctionnement de la plateforme. Ces cookies ne collectent pas d'informations personnelleselles.
              </p>
            </section>

            <section>
              <h2>9. Transfert de données</h2>
              <p>
                Vos données sont hébergées au sein de l'Union Européenne. Aucun transfert vers des pays tiers n'est effectué sans votre consentement explicite.
              </p>
            </section>

            <section>
              <h2>10. Modifications</h2>
              <p>
                Cette politique peut être modifiée à tout temps. En cas de modification substantielle, vous serez informé par email ou via la plateforme.
              </p>
            </section>

            <section>
              <h2>11. Contact</h2>
              <p>
                Pour toute question concernant cette politique ou pour exercer vos droits, contactez notre Délégué à la Protection des Données :
              </p>
              <p>
                <strong>Email :</strong> dpo@ecotrack.fr<br />
                <strong>Adresse :</strong> EcoTrack - Service Privacy, 123 Rue Verte, 75000 Paris
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
