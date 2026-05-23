import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const PrivacyPage = () => {
  const navigate = useNavigate();
  return (
    <div className="auth-container">
      <div className="auth-wrapper" style={{ maxWidth: '860px', width: '100%' }}>
        <div className="auth-box">
          <button onClick={() => navigate(-1)} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <i className="fas fa-arrow-left"></i> Retour
          </button>

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
              <p>Nous collectons uniquement les données strictement nécessaires au fonctionnement de la plateforme :</p>
              <ul>
                <li><strong>Données d'identification :</strong> Nom, prénom, adresse email</li>
                <li><strong>Données de compte :</strong> Mot de passe chiffré (bcrypt), rôle utilisateur</li>
                <li><strong>Données d'activité :</strong> Signalements créés, tournées effectuées, points gagnés, badges débloqués, défis relevés</li>
                <li><strong>Données de connexion :</strong> Journal d'authentification (horodatage des connexions)</li>
                <li><strong>Journalisation technique :</strong> Adresse IP, agent utilisateur (navigateur), horodatage des requêtes — collectés automatiquement pour des raisons de sécurité et de traçabilité (logs techniques, traces de consentement, archivage)</li>
                <li><strong>Préférences :</strong> Paramètres de notification</li>
              </ul>
              <p><em>Aucune donnée n'est collectée à des fins de traçage publicitaire ou de revente à des tiers.</em></p>
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
              <p>Vos données sont conservées selon les règles suivantes :</p>
              <ul>
                <li><strong>Compte actif :</strong> Vos données sont conservées tant que votre compte est actif.</li>
                <li><strong>Suppression demandée :</strong> Vous pouvez demander la suppression de votre compte depuis votre profil. Une période de grâce de <strong>30 jours</strong> est appliquée avant la suppression définitive, durant laquelle vous pouvez restaurer votre compte.</li>
                <li><strong>Comptes inactifs :</strong> Les comptes sans connexion depuis <strong>3 ans</strong> sont automatiquement anonymisés (nom, email et mot de passe effacés).</li>
                <li><strong>Journaux d'audit :</strong> Les logs de connexion sont conservés <strong>7 jours</strong> dans la base active, puis archivés dans une base de sauvegarde dédiée.</li>
              </ul>

              <h3>Tableau récapitulatif des durées de conservation</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="retention-table">
                  <thead>
                    <tr>
                      <th>Catégorie de données</th>
                      <th>Durée de conservation</th>
                      <th>Justification</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Données de compte (nom, email, mot de passe)</td>
                      <td>Durée de vie du compte + 30 jours de grâce</td>
                      <td>Exécution du contrat, obligation légale</td>
                    </tr>
                    <tr>
                      <td>Données d'activité (signalements, tournées, badges)</td>
                      <td>Durée de vie du compte + 30 jours de grâce</td>
                      <td>Historique nécessaire au service</td>
                    </tr>
                    <tr>
                      <td>Comptes inactifs sans connexion</td>
                      <td>3 ans maximum</td>
                      <td>Anonymisation automatique après 3 ans d'inactivité</td>
                    </tr>
                    <tr>
                      <td>Journaux d'authentification (logs)</td>
                      <td>7 jours en base active, puis archivage</td>
                      <td>Sécurité et traçabilité</td>
                    </tr>
                    <tr>
                      <td>Données après suppression du compte</td>
                      <td>30 jours (période de grâce)</td>
                      <td>Délai de rétractation avant anonymisation définitive</td>
                    </tr>
                    <tr>
                      <td>Logs techniques (actions, erreurs, API)</td>
                      <td>12 mois</td>
                      <td>Sécurité, maintenance et amélioration du service</td>
                    </tr>
                    <tr>
                      <td>Traces de consentement (cookies)</td>
                      <td>13 mois maximum</td>
                      <td>Preuve de consentement (Art. 7 RGPD, recommandation CNIL)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2>6. Vos droits (RGPD)</h2>
              <p>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
              <ul>
                <li><strong>Droit d'accès (Art. 15) :</strong> Obtenir une copie de vos données.</li>
                <li><strong>Droit de rectification (Art. 16) :</strong> Corriger des données inexactes depuis votre profil.</li>
                <li><strong>Droit à l'effacement (Art. 17) :</strong> Demander la suppression de votre compte depuis votre profil (rubrique "Zone de danger").</li>
                <li><strong>Droit à la portabilité (Art. 20) :</strong> Télécharger l'ensemble de vos données au format JSON depuis votre profil.</li>
                <li><strong>Droit d'opposition (Art. 21) :</strong> Vous opposer au traitement de vos données.</li>
                <li><strong>Droit à la limitation (Art. 18) :</strong> Demander la suspension du traitement.</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à : <strong>dpo@ecotrack.fr</strong>
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
                EcoTrack utilise uniquement des cookies techniques strictement nécessaires au fonctionnement de la plateforme (authentification JWT, session). <strong>Nous ne collectons aucune donnée à des fins de traçage ou de publicité.</strong>
              </p>
              <p>
                Lors de votre première visite, une bannière de consentement vous informe de l'utilisation des cookies. Vous pouvez à tout moment accepter ou refuser.
              </p>
              <p>
                <strong>Preuve de consentement :</strong> Conformément à l'Art. 7 du RGPD et aux recommandations de la CNIL, chaque action de consentement (acceptation ou refus) est horodatée et enregistrée avec une adresse IP et un agent utilisateur (navigateur). Ces informations sont strictement nécessaires pour prouver le consentement et ne sont utilisées à aucune autre fin. Elles sont conservées <strong>13 mois maximum</strong>, puis automatiquement supprimées.
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
        <Footer />
      </div>
    </div>
  );
};

export default PrivacyPage;
