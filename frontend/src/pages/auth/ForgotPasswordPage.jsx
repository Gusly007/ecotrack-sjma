import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email requis');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email invalide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi');
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
              <h2 style={{color: '#fff', marginBottom: '12px'}}>Email envoyé !</h2>
              <p style={{color: 'rgba(255,255,255,0.7)', marginBottom: '24px'}}>
                Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
              </p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/login')}
              >
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
          <Link to="/login" className="back-link">
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
            <div className="error-alert">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="votre@email.com"
                className="form-input"
                disabled={loading}
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
};

export default ForgotPasswordPage;