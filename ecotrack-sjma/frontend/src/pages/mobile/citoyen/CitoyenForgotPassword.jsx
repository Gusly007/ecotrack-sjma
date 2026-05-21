import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './auth/citoyenApi';
import { isValidEmail, normalizeText, safeErrorMessage } from '../../../utils/security';

// Page de demande de réinitialisation isolée du scope mobile citoyen.
// Envoie POST /auth/forgot-password avec `from: 'citoyen'` pour que le lien
// dans l'email pointe vers /citoyen/reset-password (et non /reset-password
// partagé qui termine sur /login). Réutilise les classes auth-* /
// form-input / btn-primary de index.css.

export default function CitoyenForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = normalizeText(email, { maxLength: 254 });
    if (!isValidEmail(cleanEmail)) {
      setError('Adresse email invalide.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: cleanEmail, from: 'citoyen' });
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Aucun compte citoyen trouvé avec cet email.");
      } else {
        setError(safeErrorMessage(err, "Erreur lors de l'envoi"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-box">
            <div className="success-message">
              <div className="success-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h2 style={{ color: '#fff', marginBottom: '12px' }}>Email envoyé !</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
                Un lien de réinitialisation a été envoyé à votre adresse email.
                Cliquez dessus pour choisir un nouveau mot de passe.
              </p>
              <button className="btn-primary" onClick={() => navigate('/citoyen/login')}>
                <i className="fas fa-arrow-left"></i>
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-box">
          <Link to="/citoyen/login" className="back-link">
            <i className="fas fa-arrow-left"></i> Retour à la connexion
          </Link>

          <div className="auth-header">
            <div className="auth-logo">
              <i className="fas fa-key"></i>
            </div>
            <h1>Mot de passe oublié</h1>
            <p>Nous vous enverrons un lien de réinitialisation</p>
          </div>

          {error && (
            <div className="error-alert" role="alert">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="citoyen-fp-email">Email</label>
              <input
                type="email"
                id="citoyen-fp-email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="votre@email.com"
                className="form-input"
                disabled={loading}
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Envoyer le lien
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
