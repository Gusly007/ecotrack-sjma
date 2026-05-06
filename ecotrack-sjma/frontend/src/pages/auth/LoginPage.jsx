import { useState } from 'react';
import LogoEcoTrack from '../../assets/LogoEcoTrack.svg';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', formData.email);
      // On utilise le service directement au lieu du context pour éviter de polluer le state global 
      // avant que le MFA ne soit validé.
      const response = await authService.login(formData.email, formData.password);
      const result = response.data || response;
      
      // Si MFA requis
      if (result?.requiresMFA) {
        const userId = Number(result.userId);
        localStorage.setItem('mfa_user_id', userId);

        console.log('MFA required for user:', userId, 'requiresSetup:', result?.requiresSetup);
        // Si MFA setup requis (première fois), rediriger avec les données
        if (result?.requiresSetup && result?.mfaSetup?.secret) {
        // Stocker les données MFA pour la page de setup
        localStorage.setItem('mfa_setup', JSON.stringify({
          userId: userId,
          secret: result.mfaSetup.secret,
          qrCodeUrl: result.mfaSetup.qrCodeUrl,
            email: result.email || formData.email,
            timestamp: new Date().toISOString()
        }));
        navigate('/auth/mfa?setup=true');
        return;
      }
        // Important: nettoyer un ancien setup pour éviter un faux mode setup
        localStorage.removeItem('mfa_setup');
        // Si MFA déjà activé (pas de setup), rediriger vers la page MFA simple
        navigate('/auth/mfa');
        return;
      }

      console.log('Login successful, user:', result);

      // Si pas de MFA, on peut appeler la fonction login du context pour finaliser
      const user = await login(formData.email, formData.password);
      
      if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else if (user?.role === 'GESTIONNAIRE') {
        navigate('/gestionnaire');
      } else if (user?.role === 'AGENT') {
        navigate('/agent');
      } else if (user?.role === 'CITOYEN') {
        navigate('/citoyen');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Trop de tentatives de connexion. Veuillez patienter quelques instants.');
      } else if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError(err.response?.data?.error || 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-box">
          <div className="auth-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center', marginBottom: 16 }}>
              <img src={LogoEcoTrack} alt="Logo EcoTrack" style={{ height: 150, width: 150, display: 'block' }} />
                {/* <h1 style={{ margin: 0, color: '#fff', fontSize: '2.5rem' }}>EcoTrack</h1>*/}
            </div>
            <p>Plateforme Intelligente de Gestion des Déchets</p>
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
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
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
                  placeholder="••••••••"
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

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </p>
            <p>
              Pas de compte ? Contacter un administrateur pour la création de compte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
