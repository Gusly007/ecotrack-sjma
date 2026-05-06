import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAlert } from '../../hooks/useAlert';

export default function MfaPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [isSetup, setIsSetup] = useState(false);
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem('mfa_user_id');
    const setupParam = searchParams.get('setup');
    const setupFromStorage = localStorage.getItem('mfa_setup');
    
    // Si on a un setup en storage ET qu'il est frais (moins de 10 min)
    if (setupFromStorage && (setupParam === 'true' || setupParam === null)) {
      const data = JSON.parse(setupFromStorage);
      const setupTime = data.timestamp ? new Date(data.timestamp).getTime() : null;
      const now = Date.now();
      // Si pas de timestamp ou expiré (> 10 min)
      const isExpired = !setupTime || (now - setupTime > 10 * 60 * 1000);
      
      if (data?.secret && data?.qrCodeUrl && !isExpired) {
        // Setup frais - mode configuration initiale
        setSetupData(data);
        setIsSetup(true);
        setUserId(userIdFromStorage);
        return;
      } else {
        localStorage.removeItem('mfa_setup');
      }
    }
    
    if (userIdFromStorage) {
      // Pas de setup frais = mode vérification simple (MFA déjà activé)
      setUserId(userIdFromStorage);
      setIsSetup(false); // Toujours false si pas de setup frais
    } else {
      navigate('/login');
    }
  }, [navigate, searchParams]);

  const finalizeLogin = (response) => {
    console.log('[MfaPage] Données reçues pour finalisation:', response);
    
    // Gestion flexible de la structure de réponse
    // Si le service a déjà extrait .data, on utilise response. Sinon response.data
    const data = response?.token ? response : (response?.data?.token ? response.data : response);
    
    const token = data?.token || data?.accessToken;
    const refreshToken = data?.refreshToken;
    
    if (!token) {
      console.error('[MfaPage] Erreur : Aucun jeton (token) trouvé dans la réponse. Vérifiez authService.js côté frontend.', data);
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
      localStorage.removeItem('mfa_user_id');
      localStorage.removeItem('mfa_setup');
      
      console.log('[MfaPage] Login finalized. Redirecting to dashboard...');
      const role = userData.role;
      const dest = role === 'ADMIN' ? '/admin' : role === 'GESTIONNAIRE' ? '/gestionnaire' : role === 'AGENT' ? '/agent' : '/citoyen';
      window.location.href = dest;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setError('Veuillez saisir un code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    // S'assurer que le userId est bien un nombre pour le backend
    const numericUserId = Number(userId);

    try {
      if (isSetup) {
        const response = await authService.verifyMfaSetup(numericUserId, code, setupData?.secret);
        finalizeLogin(response);
      } else {
        // Ajout d'une sécurité pour récupérer l'ID directement du storage si le state est vide
        const idToUse = numericUserId || Number(localStorage.getItem('mfa_user_id'));
        if (!idToUse) throw new Error("Session expirée, veuillez vous reconnecter.");
        
        const response = await authService.loginWithMfa(idToUse, code);
        finalizeLogin(response);
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Code invalide';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isSetup ? 'Configurer l\'authentification à deux facteurs' : 'Authentification à deux facteurs'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSetup 
              ? 'Scannez ce QR code avec Google Authenticator, puis saisissez le code' 
              : 'Saisissez le code à 6 chiffres de votre application d\'authentification'}
          </p>
        </div>

        {isSetup && setupData && (
          <div className="flex flex-col items-center space-y-4">
            <img src={setupData.qrCodeUrl} alt="QR Code MFA" className="border rounded-md p-2 bg-white" />
            <p className="text-xs text-gray-500">Secret: {setupData.secret}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="code" className="sr-only">
              Code de vérification
            </label>
            <input
              id="code"
              name="code"
              type="text"
              maxLength="6"
              required
              className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 text-center text-2xl tracking-widest"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('mfa_user_id');
                navigate('/login');
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Retour à la connexion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
