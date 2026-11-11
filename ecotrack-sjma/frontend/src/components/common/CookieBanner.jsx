import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import './CookieBanner.css';

const CONSENT_KEY = 'cookieConsent';

const readConsent = () => {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
};

const writeConsent = (consent) => {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch (error) {
    console.warn('Cookie consent not stored locally:', error);
  }
};

const getSessionId = () => {
  const generatedId = `session_${Date.now()}`;
  try {
    const sessionId = sessionStorage.getItem('sessionId') || generatedId;
    sessionStorage.setItem('sessionId', sessionId);
    return sessionId;
  } catch {
    return generatedId;
  }
};

const sendConsent = async (consent) => {
  try {
    await api.post('/api/V1/cookies/consent', {
      session_id: consent.sessionId,
      consent_status: consent.status,
      cookies_accepted: consent.cookies
    });
    writeConsent({ ...consent, pending: false });
  } catch (error) {
    console.warn('Cookie consent not sent, retrying on next load:', error);
  }
};

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const retryStarted = useRef(false);

  useEffect(() => {
    const storedConsent = readConsent();
    if (storedConsent) {
      if (storedConsent.pending && !retryStarted.current) {
        retryStarted.current = true;
        sendConsent(storedConsent);
      }
      return;
    }

    const checkConsent = async () => {
      try {
        const sessionId = sessionStorage.getItem('sessionId');

        if (!sessionId) {
          setShowBanner(true);
          return;
        }

        const response = await api.get(`/api/V1/cookies/consent/${sessionId}`);
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

  const saveCookieConsent = (cookies, status) => {
    const consent = { sessionId: getSessionId(), status, cookies, pending: true };
    writeConsent(consent);
    setShowBanner(false);
    sendConsent(consent);
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
            >
              Refuser tout
            </button>
            <button
              className="cookie-btn cookie-btn-accept"
              onClick={handleAcceptAll}
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
