import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.nom || !formData.prenom || !formData.email || !formData.password) {
      setError('Tous les champs sont obligatoires');
      return false;
    }
    
    if (formData.nom.length < 2) {
      setError('Nom trop court');
      return false;
    }
    
    if (formData.prenom.length < 2) {
      setError('Prénom trop court');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email invalide');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Mot de passe trop court (min 6 caractères)');
      return false;
    }
    
    if (formData.password !== formData.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    if (!acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      await register({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        role: 'CITOYEN'
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
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
              <h2 style={{color: '#fff', marginBottom: '12px'}}>Compte créé avec succès !</h2>
              <p style={{color: 'rgba(255,255,255,0.7)', marginBottom: '24px'}}>
                Votre compte EcoTrack a été créé. Vous pouvez maintenant vous connecter.
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
              <i className="fas fa-user-plus"></i>
            </div>
            <h1>Créer un compte</h1>
            <p>Rejoignez la communauté EcoTrack</p>
          </div>

          {error && (
            <div className="error-alert">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Dupont"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Jean"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jean@email.com"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 caractères"
                  className="form-input"
                  disabled={loading}
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
              <label htmlFor="passwordConfirm">Confirmer le mot de passe</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="passwordConfirm"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="••••••••"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <label htmlFor="acceptTerms">
                J'accepte les <a href="/terms">Conditions Générales d'Utilisation</a> et la{' '}
                <a href="/privacy">Politique de confidentialité</a>
              </label>
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;