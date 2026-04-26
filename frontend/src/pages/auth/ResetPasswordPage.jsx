import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token de réinitialisation manquant');
      return;
    }

    if (!password) {
      setError('Mot de passe requis');
      return;
    }

    if (password.length < 6) {
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
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation');
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
            <Link to="/forgot-password" className="btn-secondary" style={{ marginTop: '16px', display: 'inline-block', textAlign: 'center' }}>
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
              <h2 style={{color: '#fff', marginBottom: '12px'}}>Mot de passe réinitialisé !</h2>
              <p style={{color: 'rgba(255,255,255,0.7)', marginBottom: '24px'}}>
                Votre mot de passe a été modifié avec succès.
              </p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/login')}
              >
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
          <Link to="/login" className="back-link">
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
            <div className="error-alert">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="form-input"
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="form-input"
                disabled={loading}
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
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
};

export default ResetPasswordPage;
