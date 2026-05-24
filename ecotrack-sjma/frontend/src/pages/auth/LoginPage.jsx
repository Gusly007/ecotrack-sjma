import { useState } from 'react';
import LogoEcoTrack from '../../assets/LogoEcoTrack.svg';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Footer from '../../components/layout/Footer';

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

      // Filtrage de scope : /login est réservé au personnel EcoTrack
      // (ADMIN / GESTIONNAIRE / AGENT). Un compte CITOYEN est rejeté ici, AVANT
      // toute redirection MFA. Le rôle est lu dans la branche MFA (`result.role`,
      // exposé par le backend) ou dans la branche sans MFA (`result.role_par_defaut`,
      // l'objet user étant renvoyé directement par authService.login).
      const userRole = result?.role || result?.role_par_defaut || null;
      if (userRole === 'CITOYEN') {
        // En branche sans MFA, authService.login a déjà persisté les tokens.
        // On purge pour ne laisser aucune session active.
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('mfa_user_id');
        localStorage.removeItem('mfa_setup');
        sessionStorage.removeItem('mfa_pending_setup');
        setError("Cet espace de connexion est réservé au personnel EcoTrack.");
        return;
      }

      // Si MFA requis
      if (result?.requiresMFA) {
        const userId = Number(result.userId);
        localStorage.setItem('mfa_user_id', userId);

        console.log('MFA required for user:', userId, 'requiresSetup:', result?.requiresSetup);
        // Si MFA setup requis (première fois), rediriger vers setup sans stocker le secret
        if (result?.requiresSetup && result?.mfaSetup?.secret) {
          // Stocker uniquement userId temporairement (pour récup après redirect)
          // Note: les données sensibles sont récupérées via API sur la page MFA
          sessionStorage.setItem('mfa_pending_setup', 'true');
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
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: '#666',
              cursor: 'pointer', fontSize: '0.85rem', padding: '0 0 10px 0',
              fontFamily: 'inherit',
            }}
          >
            <i className="fas fa-arrow-left" style={{ fontSize: '0.78rem' }}></i> Retour
          </button>
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
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;
