import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from './auth/citoyenApi';
import { safeErrorMessage } from '../../../utils/security';

// Page de réinitialisation isolée du scope mobile citoyen. Lien reçu par
// email pointe ici (et non /reset-password partagé) quand le citoyen a
// initié la demande via /citoyen/mot-de-passe-oublie. Sur succès, retourne
// vers /citoyen/login (et non /login upstream).

export default function CitoyenResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError('Token de réinitialisation manquant');
      return;
    }
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(safeErrorMessage(err, 'Erreur lors de la réinitialisation'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-box">
            <div className="error-alert">
              <i className="fas fa-exclamation-circle"></i>
              Token de réinitialisation manquant
            </div>
            <Link
              to="/citoyen/mot-de-passe-oublie"
              className="btn-secondary"
              style={{ marginTop: '16px', display: 'inline-block', textAlign: 'center' }}
            >
              <i className="fas fa-arrow-left"></i> Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-box">
            <div className="success-message">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2 style={{ color: '#fff', marginBottom: '12px' }}>Mot de passe réinitialisé !</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
                Votre mot de passe a été modifié avec succès.
              </p>
              <button className="btn-primary" onClick={() => navigate('/citoyen/login')}>
                <i className="fas fa-sign-in-alt"></i>
                Se connecter
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
              <i className="fas fa-lock"></i>
            </div>
            <h1>Nouveau mot de passe</h1>
            <p>Entrez votre nouveau mot de passe</p>
          </div>

          {error && (
            <div className="error-alert" role="alert">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="citoyen-rp-pass">Nouveau mot de passe</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="citoyen-rp-pass"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="form-input"
                  disabled={loading}
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="citoyen-rp-confirm">Confirmer le mot de passe</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="citoyen-rp-confirm"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="form-input"
                  disabled={loading}
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Réinitialiser le mot de passe
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
