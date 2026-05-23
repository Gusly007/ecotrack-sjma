import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const LegalPage = () => {
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
              <i className="fas fa-file-contract"></i>
            </div>
            <h1>Mentions Légales</h1>
            <p>Dernière mise à jour : Mai 2026</p>
          </div>

          <div className="legal-content">
            <section>
              <h2>1. Informations générales</h2>
              <p>
                EcoTrack est une plateforme collaborative dédiée à la gestion et l'optimisation des collectes de déchets et 
                du nettoyage urbain. Le site est édité et géré par l'équipe EcoTrack.
              </p>
            </section>

            <section>
              <h2>2. Responsable d'édition</h2>
              <p>
                <strong>Responsable</strong> : EcoTrack Team<br />
                <strong>Adresse</strong> : France<br />
                <strong>Email</strong> : contact@ecotrack.fr<br />
                <strong>DPO (Délégué à la Protection des Données)</strong> : dpo@ecotrack.fr
              </p>
            </section>

            <section>
              <h2>3. Hébergement</h2>
              <p>
                Le site est hébergé sur une infrastructure cloud sécurisée conformément aux normes RGPD et de sécurité 
                informatique (HTTPS, chiffrage, authentification sécurisée).
              </p>
            </section>

            <section>
              <h2>4. Propriété intellectuelle</h2>
              <p>
                Tous les contenus du site (textes, images, logos, données) sont la propriété exclusive d'EcoTrack. 
                Toute reproduction sans autorisation est strictement interdite.
              </p>
            </section>

            <section>
              <h2>5. Données personnelles</h2>
              <p>
                Conformément au RGPD, EcoTrack s'engage à protéger vos données personnelles. Pour plus d'informations, 
                veuillez consulter notre <Link to="/privacy">Politique de Confidentialité</Link>.
              </p>
            </section>

            <section>
              <h2>6. Conditions générales d'utilisation</h2>
              <p>
                En accédant à EcoTrack, vous acceptez nos <Link to="/terms">Conditions Générales d'Utilisation</Link>. 
                Ces conditions définissent les droits et obligations des utilisateurs.
              </p>
            </section>

            <section>
              <h2>7. Responsabilité</h2>
              <p>
                EcoTrack s'efforce de maintenir le site en ligne et à jour. Cependant, aucune garantie n'est fournie quant à 
                l'exactitude ou la disponibilité continue du service. EcoTrack ne peut pas être tenu responsable des 
                dommages directs ou indirects résultant de l'utilisation du site.
              </p>
            </section>

            <section>
              <h2>8. Liens externes</h2>
              <p>
                EcoTrack peut contenir des liens vers des sites externes. EcoTrack n'est pas responsable du contenu de ces 
                sites et ne les cautionné pas nécessairement.
              </p>
            </section>

            <section>
              <h2>9. Modifications</h2>
              <p>
                EcoTrack se réserve le droit de modifier ces mentions légales à tout moment. Les modifications sont 
                effectives dès leur publication.
              </p>
            </section>

            <section>
              <h2>10. Droit applicable et juridiction</h2>
              <p>
                Ces mentions légales sont régies par la loi française. Tout litige sera soumis aux tribunaux compétents 
                du territoire français.
              </p>
            </section>

            <section>
              <h2>11. Signalement de problème</h2>
              <p>
                Si vous identifiez une erreur ou un problème sur le site, veuillez contacter : contact@ecotrack.fr
              </p>
            </section>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default LegalPage;
