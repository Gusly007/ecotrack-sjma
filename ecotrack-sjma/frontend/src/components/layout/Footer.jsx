import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const links = [
    { to: '/privacy', icon: 'fas fa-shield-alt', label: 'Politique de confidentialité' },
    { to: '/terms', icon: 'fas fa-file-contract', label: 'CGU' },
    { to: '/legal', icon: 'fas fa-gavel', label: 'Mentions légales' },
  ];

  return (
    <footer className="auth-footer">
      <div className="footer-content">
        <div className="footer-links">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="footer-link">
              <i className={link.icon}></i> {link.label}
            </Link>
          ))}
          <a href="mailto:dpo@ecotrack.fr" className="footer-link">
            <i className="fas fa-envelope"></i> DPO
          </a>
        </div>
        <div className="footer-info">
          <p>&copy; 2026 EcoTrack. Tous droits réservés.</p>
          <p className="gdpr-badge">
            <i className="fas fa-check-circle"></i> Conforme RGPD
          </p>
        </div>
      </div>
    </footer>
  );
}
