import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email || !token) {
      setError('Lien d\'activation invalide');
    }
  }, [email, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      await authService.activateAccount({
        email,
        token,
        newPassword
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'activation du compte');
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
                <i className="fas fa-check"></i>
              </div>
              <h1>Compte activé !</h1>
              <p>Votre mot de passe a été défini avec succès.</p>
              <p>Redirection vers la page de connexion...</p>
              <a href="/login" className="back-link">Aller à la connexion</a>
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
          <div className="auth-header">
            <div className="auth-logo">
              <i className="fas fa-leaf"></i>
            </div>
            <h1>Activer votre compte</h1>
            <p>Définissez votre mot de passe pour accéder à EcoTrack</p>
          </div>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={email || ''} 
                disabled 
              />
            </div>

            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <div className="input-group">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="form-input"
                  placeholder="Minimum 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input"
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || !email || !token}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Activation...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Activer mon compte
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <a href="/login">
              <i className="fas fa-arrow-left"></i> Retour à la connexion
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
