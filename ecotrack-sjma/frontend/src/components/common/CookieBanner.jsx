import { useEffect, useState } from 'react';
import api from '../../services/api';
import './CookieBanner.css';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const sessionId = sessionStorage.getItem('sessionId');

        if (!sessionId) {
          setShowBanner(true);
          return;
        }

        const response = await api.get(`/api/cookies/consent/${sessionId}`);
        if (response?.status === 404) {
          setShowBanner(true);
        } else {
          setShowBanner(false);
        }
      } catch {
        setShowBanner(true);
      }
    };

    checkConsent();
  }, []);

  const saveCookieConsent = async (consentData, consentStatus) => {
    setLoading(true);
    try {
      const sessionId = sessionStorage.getItem('sessionId') || `session_${Date.now()}`;
      sessionStorage.setItem('sessionId', sessionId);

      await api.post('/api/cookies/consent', {
        session_id: sessionId,
        consent_status: consentStatus,
        cookies_accepted: consentData
      });

      setShowBanner(false);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
      setShowBanner(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = () =>
    saveCookieConsent({ functional: true, analytics: true, marketing: true }, 'ACCEPTED');

  const handleRejectAll = () =>
    saveCookieConsent({ functional: true, analytics: false, marketing: false }, 'REJECTED');

  if (!showBanner) return null;

  return (
    <div className="cookie-banner-container">
      <div className="cookie-banner">
        <div className="cookie-banner-content">
          <h3>Gestion des cookies</h3>
          <p>
            Nous utilisons des cookies pour améliorer votre expérience. Les cookies fonctionnels
            sont nécessaires au fonctionnement du site. Vous pouvez choisir d'activer ou non
            les cookies analytiques et marketing.
          </p>

          <div className="cookie-banner-actions">
            <button
              className="cookie-btn cookie-btn-reject"
              onClick={handleRejectAll}
              disabled={loading}
            >
              Refuser tout
            </button>
            <button
              className="cookie-btn cookie-btn-accept"
              onClick={handleAcceptAll}
              disabled={loading}
            >
              Accepter tout
            </button>
          </div>
        </div>
        <a href="/privacy" className="cookie-link">
          Politique de confidentialité
        </a>
      </div>
    </div>
  );
}
