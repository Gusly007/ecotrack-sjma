import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCitoyenAuth as useAuth } from './auth/CitoyenAuthContext';
import { isValidEmail, normalizeText, safeErrorMessage } from '../../../utils/security';
import './CitoyenRegister.css';

// Inscription self-service du rôle CITOYEN. Page publique isolée du flow
// admin/gestionnaire upstream. Réutilise les classes auth-* de index.css
// (charte LoginPage) pour rester visuellement cohérent.

export default function CitoyenRegister() {
  const navigate = useNavigate();
  const { registerCitoyen, verifyActivation, resendActivation } = useAuth();

  // step = 'form' (saisie infos) → 'activation' (saisie code reçu par email).
  const [step, setStep] = useState('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentNotice, setResentNotice] = useState('');

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const prenom = normalizeText(form.prenom, { maxLength: 80 });
    const nom = normalizeText(form.nom, { maxLength: 80 });
    const email = normalizeText(form.email, { maxLength: 254 });

    if (!prenom || prenom.length < 2) return setError('Prénom requis (au moins 2 caractères).');
    if (!nom || nom.length < 2) return setError('Nom requis (au moins 2 caractères).');
    if (!isValidEmail(email)) return setError('Adresse email invalide.');
    if (!form.password || form.password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');
    if (form.password !== form.confirmPassword) return setError('Les mots de passe ne correspondent pas.');

    setLoading(true);
    try {
      const r = await registerCitoyen({ prenom, nom, email, password: form.password });
      // Le backend renvoie {requiresActivation:true, email} — on bascule sur
      // l'étape de saisie du code reçu par email.
      setPendingEmail(r?.email || email);
      setStep('activation');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setError('Un compte existe déjà pour cet email.');
      } else {
        setError(safeErrorMessage(err, 'Inscription impossible. Veuillez réessayer.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setResentNotice('');
    const cleanCode = String(code).replace(/\D/g, '').slice(0, 6);
    if (cleanCode.length !== 6) {
      return setError('Veuillez saisir le code à 6 chiffres reçu par email.');
    }
    setVerifying(true);
    try {
      await verifyActivation(pendingEmail, cleanCode);
      navigate('/citoyen', { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) {
        setError("Code invalide ou expiré. Demandez un nouveau code si besoin.");
      } else {
        setError(safeErrorMessage(err, "Activation impossible. Veuillez réessayer."));
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResentNotice('');
    setResending(true);
    try {
      const r = await resendActivation(pendingEmail);
      if (r?.alreadyActive) {
        setResentNotice('Votre compte est déjà activé. Connectez-vous.');
      } else {
        setResentNotice("Un nouveau code a été envoyé à votre email.");
      }
    } catch (err) {
      setError(safeErrorMessage(err, "Impossible d'envoyer un nouveau code."));
    } finally {
      setResending(false);
    }
  };

  // Étape 2 : saisie du code d'activation reçu par email.
  if (step === 'activation') {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-box">
            <div className="auth-header">
              <div className="auth-logo" aria-hidden="true">
                <i className="fas fa-envelope-open-text"></i>
              </div>
              <h1>Activez votre compte</h1>
              <p>
                Nous avons envoyé un code à 6 chiffres à <strong>{pendingEmail}</strong>.
                Saisissez-le ci-dessous pour finaliser la création de votre compte.
              </p>
            </div>

            {error && (
              <div className="error-alert" role="alert">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            {resentNotice && (
              <div className="error-alert" role="status" style={{ background: '#1f3f25', color: '#a5d6a7', borderColor: '#388e3c' }}>
                <i className="fas fa-check-circle"></i> {resentNotice}
              </div>
            )}

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label htmlFor="reg-code">Code d'activation</label>
                <input
                  id="reg-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  className="form-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.3rem', fontFamily: 'monospace' }}
                  required
                />
                <span className="citoyen-register-hint">Le code expire dans 30 minutes.</span>
              </div>

              <button type="submit" className="btn-primary" disabled={verifying}>
                {verifying ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Activer mon compte
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Pas reçu d'email ?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', color: '#6fce72', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  {resending ? 'Envoi…' : 'Renvoyer un code'}
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setCode(''); setError(''); setResentNotice(''); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(230,237,243,0.7)', cursor: 'pointer', padding: 0 }}
                >
                  <i className="fas fa-arrow-left"></i> Modifier mes informations
                </button>
              </p>
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
            <div className="auth-logo" aria-hidden="true">
              <i className="fas fa-leaf"></i>
            </div>
            <h1>Créer un compte citoyen</h1>
            <p>Rejoignez EcoTrack pour signaler, suivre et agir pour votre quartier.</p>
          </div>

          {error && (
            <div className="error-alert" role="alert">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reg-prenom">Prénom</label>
              <input
                id="reg-prenom"
                type="text"
                className="form-input"
                autoComplete="given-name"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                maxLength={80}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-nom">Nom</label>
              <input
                id="reg-nom"
                type="text"
                className="form-input"
                autoComplete="family-name"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                maxLength={80}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={254}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Mot de passe</label>
              <div className="input-group">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
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
              <span className="citoyen-register-hint">6 caractères minimum.</span>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Confirmer le mot de passe</label>
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          <p className="citoyen-register-legal">
            En créant un compte, vous acceptez nos <Link to="/terms">conditions d'utilisation</Link> et notre <Link to="/privacy">politique de confidentialité</Link>.
          </p>

          <div className="auth-footer">
            <p>
              Déjà un compte ?{' '}
              <Link to="/citoyen/login" style={{ fontWeight: 600 }}>Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
