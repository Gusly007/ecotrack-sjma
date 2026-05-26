import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCitoyenAuth as useAuth } from './auth/CitoyenAuthContext';
import { authService } from '../../../services/authService';
import { safeErrorMessage } from '../../../utils/security';
import LogoEcoTrack from '../../../assets/LogoEcoTrack.svg';

// Page de connexion dédiée au flow citoyen mobile (logo feuille, charte
// EcoTrack mobile). Réutilise les classes auth-* / form-input / btn-primary
// définies dans index.css (héritées de LoginPage upstream). Délègue la
// logique MFA à /auth/mfa (page upstream) ; sur succès, redirige toujours
// vers /citoyen.

const CitoyenLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      const response = await authService.login(formData.email, formData.password);
      const result = response.data || response;

      // Filtrage de scope : /citoyen/login est réservé aux comptes CITOYEN.
      // Le rôle est lu dans la branche MFA (`result.role`, exposé par le
      // backend à cet effet) ou dans la branche sans MFA (`result.role_par_defaut`,
      // présent sur l'objet user renvoyé directement).
      const userRole = result?.role || result?.role_par_defaut || null;
      if (userRole && userRole !== 'CITOYEN') {
        // En branche sans MFA, authService.login a déjà persisté les tokens.
        // On purge pour ne laisser aucune session active. Pas d'appel à
        // /auth/logout : le refresh token expirera via son TTL serveur.
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('mfa_user_id');
        localStorage.removeItem('mfa_setup');
        sessionStorage.removeItem('mfa_pending_setup');
        setError("Cet espace de connexion est réservé aux citoyens.");
        return;
      }

      if (result?.requiresMFA) {
        const userId = Number(result.userId);
        localStorage.setItem('mfa_user_id', userId);
        if (result?.requiresSetup && result?.mfaSetup?.secret) {
          sessionStorage.setItem('mfa_pending_setup', 'true');
          navigate('/auth/mfa?setup=true');
          return;
        }
        localStorage.removeItem('mfa_setup');
        navigate('/auth/mfa');
        return;
      }

      const user = await login(formData.email, formData.password);

      if (user?.role === 'CITOYEN') {
        navigate('/citoyen');
      } else if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else if (user?.role === 'GESTIONNAIRE') {
        navigate('/gestionnaire');
      } else if (user?.role === 'AGENT') {
        navigate('/agent');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Trop de tentatives de connexion. Veuillez patienter quelques instants.');
      } else if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError(safeErrorMessage(err, 'Erreur de connexion'));
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
            </div>
            <p>Plateforme Intelligente de Gestion des Déchets</p>
          </div>

          {error && (
            <div className="error-alert" role="alert">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="citoyen-email">Email</label>
              <input
                type="email"
                id="citoyen-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                className="form-input"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="citoyen-password">Mot de passe</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="citoyen-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
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
              {/* Flow citoyen isolé : email reset pointe vers /citoyen/reset-password
                  qui redirige sur /citoyen/login (et non /login partagé). */}
              <Link to="/citoyen/mot-de-passe-oublie">Mot de passe oublié ?</Link>
            </p>
            <p>
              Pas encore de compte ?{' '}
              <Link to="/citoyen/inscription" style={{ fontWeight: 600 }}>Créer un compte citoyen</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitoyenLogin;
