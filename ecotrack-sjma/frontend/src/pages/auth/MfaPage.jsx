import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAlert } from '../../hooks/useAlert';
import Footer from '../../components/layout/Footer';

// Étape 2 de la connexion, après vérification du mot de passe.
//
//  l'identité ne vient plus d'un `userId` en clair (il permettait de
// régénérer le secret TOTP de n'importe quel compte). Toutes les requêtes
// s'appuient sur le jeton pré-MFA remis par /auth/login, valable 5 minutes.
//
// La récupération « appareil perdu » passe par un code de secours, plus par la
// régénération non authentifiée du secret.
export default function MfaPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [isSetup, setIsSetup] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetInfo, setResetInfo] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);
  const { showError } = useAlert();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mfaToken = authService.getMfaToken();
    const setupParam = searchParams.get('setup');
    const setupFromStorage = localStorage.getItem('mfa_setup');

    // Sans jeton pré-MFA, aucune étape MFA n'est possible : retour au login.
    if (!mfaToken) {
      navigate('/login', { replace: true });
      return;
    }

    // Si on a un setup en storage ET qu'il est frais (moins de 10 min)
    if (setupFromStorage && (setupParam === 'true' || setupParam === null)) {
      let data = null;
      try {
        data = JSON.parse(setupFromStorage);
      } catch {
        localStorage.removeItem('mfa_setup');
      }

      const setupTime = data?.timestamp ? new Date(data.timestamp).getTime() : null;
      const now = Date.now();
      // Si pas de timestamp ou expiré (> 10 min)
      const isExpired = !setupTime || (now - setupTime > 10 * 60 * 1000);

      if (data?.secret && data?.qrCodeUrl && !isExpired) {
        // Le QR doit être celui que le serveur vérifiera. On le régénère côté
        // serveur (persiste mfa_setup_secret) pour éviter d'afficher un QR
        // périmé du localStorage, cause de « Code MFA invalide ».
        (async () => {
          try {
            const fresh = await authService.generateMfaSetup();
            setSetupData({ secret: fresh.secret, qrCodeUrl: fresh.qrCodeUrl });
          } catch {
            // Fallback : ancien QR du storage si la régénération échoue.
            setSetupData(data);
          }
          setIsSetup(true);
        })();
        return;
      }

      localStorage.removeItem('mfa_setup');
    }

    setIsSetup(false);
  }, [navigate, searchParams]);

  const finalizeLogin = (response) => {
    // Gestion flexible de la structure de réponse
    // Si le service a déjà extrait .data, on utilise response. Sinon response.data
    const data = response?.token ? response : (response?.data?.token ? response.data : response);

    const token = data?.token || data?.accessToken;
    const refreshToken = data?.refreshToken;

    if (!token) {
      // Pas de jeton dans la réponse : on n'affiche pas le contenu brut
      // (qui pourrait contenir des données sensibles) et on remonte l'erreur.
      setError('Erreur d\'authentification : Jeton de session manquant. Veuillez contacter le support.');
      setLoading(false);
      return;
    }

    // On enregistre sous 'token' ET 'accessToken' pour être compatible avec tout le projet
    localStorage.setItem('token', token);
    localStorage.setItem('accessToken', token);

    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

    // Si data n'a pas de clé 'user', on vérifie si data lui-même ressemble à un utilisateur
    const rawUser = data?.user || (data?.id ? data : null);

    if (rawUser) {
      // Normalisation de l'utilisateur pour être compatible avec AuthContext et ProtectedRoutes
      const userData = {
        ...rawUser,
        // Assurer que 'id' et 'role' sont présents (clés les plus courantes dans le front)
        id: rawUser.id || rawUser.id_utilisateur,
        role: rawUser.role || rawUser.role_par_defaut
      };

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('mfa_setup');
      authService.setMfaToken(null);
      localStorage.removeItem('mfa_user_id');

      const role = userData.role;
      const path = role === 'ADMIN' ? '/admin' : role === 'GESTIONNAIRE' ? '/gestionnaire' : role === 'AGENT' ? '/agent' : '/citoyen';
      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      window.location.href = `${base}${path}`;
    }
  };

  const submitMfa = async (submittedCode) => {
    setLoading(true);
    setError('');

    try {
      if (isSetup) {
        const response = await authService.verifyMfaSetup(submittedCode);
        // V2-002 : les codes de secours ne sont affichés qu'ici, une seule
        // fois. On les montre avant la redirection pour que l'utilisateur les
        // conserve, puis on termine la connexion au clic.
        const codes = response?.backupCodes || response?.data?.backupCodes || [];
        if (Array.isArray(codes) && codes.length > 0) {
          setBackupCodes({ codes, response });
          setLoading(false);
          return;
        }
        finalizeLogin(response);
      } else {
        const response = await authService.loginWithMfa(submittedCode);
        finalizeLogin(response);
      }
    } catch (err) {
      const status = err.response?.status;
      const message = status === 401 && !err.response?.data?.error
        ? 'Session expirée, veuillez vous reconnecter.'
        : (err.response?.data?.error || 'Code invalide');
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setError('Veuillez saisir un code à 6 chiffres');
      return;
    }
    await submitMfa(code);
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    const clean = recoveryCode.trim().toUpperCase();
    if (!clean) {
      setError('Veuillez saisir un code de secours');
      return;
    }
    await submitMfa(clean);
  };

  const goToLogin = () => {
    authService.setMfaToken(null);
    localStorage.removeItem('mfa_user_id');
    localStorage.removeItem('mfa_setup');
    navigate('/login');
  };

  // Télécharge les codes de secours en fichier .txt (l'utilisateur doit les
  // conserver ; ils ne seront plus réaffichés).
  const downloadBackupCodes = (codes) => {
    const lines = [
      'EcoTrack — Codes de secours',
      'Conservez ce fichier en lieu sûr. Chaque code ne sert qu\'une seule fois.',
      '',
      ...codes,
      '',
      `Généré le ${new Date().toLocaleString()}`,
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ecotrack-codes-de-secours.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Appareil supprimé/perdu : demander un code de récupération par email.
  const handleRequestReset = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.requestMfaRecovery();
      setResetInfo(res?.message || 'Un code a été envoyé par email.');
      setResetSent(true);
    } catch (err) {
      const message = err.response?.data?.error || 'Impossible d\'envoyer le code de récupération';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // Valider le code reçu par email : réinitialise le MFA puis affiche un QR neuf.
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    const clean = resetCode.trim();
    if (!/^\d{6}$/.test(clean)) {
      setError('Saisissez le code à 6 chiffres reçu par email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.verifyMfaRecovery(clean);
      // Le MFA est réinitialisé : on régénère un setup (QR) pour rescanner.
      const setup = await authService.generateMfaSetup();
      setSetupData({ secret: setup.secret, qrCodeUrl: setup.qrCodeUrl });
      setIsSetup(true);
      setResetMode(false);
      setResetSent(false);
      setCode('');
    } catch (err) {
      const message = err.response?.data?.error || 'Code de récupération invalide ou expiré';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {backupCodes ? (
          <div className="space-y-6">
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                Codes de secours
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Notez ces codes maintenant. Ils ne seront plus jamais affichés et
                permettent de vous connecter si vous perdez votre appareil.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-2 rounded-md bg-white p-4 ring-1 ring-inset ring-gray-300 font-mono text-center text-sm">
              {backupCodes.codes.map((c) => (
                <li key={c} className="py-1 tracking-widest">{c}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => downloadBackupCodes(backupCodes.codes)}
              className="group relative flex w-full justify-center rounded-md border border-indigo-600 bg-white px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Télécharger les codes (.txt)
            </button>
            <button
              type="button"
              onClick={() => finalizeLogin(backupCodes.response)}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              J'ai noté mes codes, continuer
            </button>
          </div>
        ) : (
        <>
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isSetup
              ? 'Configurer l\'authentification à deux facteurs'
              : recoveryMode
                ? 'Utiliser un code de secours'
                : 'Authentification à deux facteurs'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSetup
              ? 'Scannez ce QR code avec Google Authenticator, puis saisissez le code'
              : recoveryMode
                ? 'Saisissez l\'un des codes de secours qui vous ont été remis lors de l\'activation'
                : 'Saisissez le code à 6 chiffres de votre application d\'authentification'}
          </p>
        </div>

        {resetMode && !isSetup && (
          <div className="space-y-4 rounded-md border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-base font-semibold text-amber-900">
              Recevoir un code et rescanner le QR code
            </h3>
            {error && <p className="text-sm text-red-700">{error}</p>}
            {!resetSent ? (
              <>
                <p className="text-sm text-amber-800">
                  Un code à 6 chiffres sera envoyé à l'adresse email de votre compte. Après validation,
                  un nouveau QR code s'affichera à scanner.
                </p>
                <button
                  type="button"
                  onClick={handleRequestReset}
                  disabled={loading}
                  className="w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {loading ? 'Envoi...' : 'Recevoir le code par email'}
                </button>
              </>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-3">
                <p className="text-sm text-amber-800">
                  {resetInfo || 'Un code a été envoyé par email.'} Saisissez le code du <strong>dernier</strong> email reçu
                  (valable 10 minutes, un seul code actif à la fois).
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  required
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || resetCode.length < 6}
                  className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Vérification...' : 'Valider et afficher un nouveau QR code'}
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={() => { setResetMode(false); setResetSent(false); setResetInfo(''); setResetCode(''); setError(''); }}
              className="text-sm text-gray-600 hover:underline"
            >
              Annuler
            </button>
          </div>
        )}

        {isSetup && setupData && (
          <div className="flex flex-col items-center space-y-4">
            <img src={setupData.qrCodeUrl} alt="QR Code MFA" className="border rounded-md p-2 bg-white" />
            <p className="text-xs text-gray-500">Secret: {setupData.secret}</p>
          </div>
        )}

        {/* En mode récupération-email, on masque le formulaire principal pour
            éviter deux champs de code concurrents. */}
        {!(resetMode && !isSetup) && (
        <form className="mt-8 space-y-6" onSubmit={recoveryMode && !isSetup ? handleRecoverySubmit : handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="code" className="sr-only">
              {recoveryMode && !isSetup ? 'Code de secours' : 'Code de vérification'}
            </label>
            {recoveryMode && !isSetup ? (
              <input
                id="code"
                name="code"
                type="text"
                maxLength="8"
                required
                className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset ring-indigo-600 sm:text-sm sm:leading-6 text-center text-2xl tracking-widest uppercase"
                placeholder="XXXXXXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                autoFocus
              />
            ) : (
              <input
                id="code"
                name="code"
                type="text"
                maxLength="6"
                required
                className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset ring-indigo-600 sm:text-sm sm:leading-6 text-center text-2xl tracking-widest"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || (recoveryMode && !isSetup ? !recoveryCode : code.length < 6)}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={goToLogin}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Retour à la connexion
            </button>
          </div>
        </form>
        )}

        {!isSetup && (
          <div className="text-center space-y-2">
            <div>
              <button
                type="button"
                onClick={() => {
                  setRecoveryMode((v) => !v);
                  setResetMode(false);
                  setError('');
                }}
                className="text-sm font-medium text-orange-600 hover:text-orange-500 underline"
              >
                {recoveryMode
                  ? 'Revenir à l\'application d\'authentification'
                  : 'Utiliser un code de secours'}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setResetMode((v) => !v);
                  setRecoveryMode(false);
                  setResetSent(false);
                  setResetInfo('');
                  setResetCode('');
                  setError('');
                }}
                className="text-sm font-medium text-amber-700 hover:text-amber-800 underline"
              >
                {resetMode
                  ? 'Annuler la récupération par email'
                  : 'Recevoir un code et rescanner le QR code'}
              </button>
            </div>
          </div>
        )}
        <Footer />
        </>
        )}
      </div>
    </div>
  );
}
