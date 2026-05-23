import { asyncHandler } from '../middleware/errorHandler.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';

/**
 * POST /auth/registre  
 */

export const register = asyncHandler(async (req, res) => {
  const { email, nom, prenom, password, role } = req.body;

  if (!email || !nom || !prenom || !password) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const result = await authService.registerUser(email, nom, prenom, password, role);

  res.status(201).json({
    message: 'Registration reussie',
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user
  });
});

/**
 * POST /auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const result = await authService.loginUser(email, password, req.ip);

  // Si MFA requis
  if (result.requiresMFA) {
    try {
      const userId = result.userId;
      const user = await authService.getUserById(userId);
      
      // Si MFA déjà activé, pas de setup nécessaire (juste vérification)
      if (user.mfa_enabled) {
        console.log('[MFA] MFA déjà activé, vérification simple');
        result.requiresSetup = false;
      } else {
        // MFA pas encore activé, générer le setup
        console.log('[MFA] MFA non activé, génération setup');
        let setup;
        const setupSecret = user.mfa_setup_secret;
        const setupCreatedAt = user.mfa_setup_secret_created_at;
        const now = new Date();
        const setupAge = setupCreatedAt ? (now - new Date(setupCreatedAt)) / 1000 : Infinity;
        
        if (setupSecret && setupAge < 600) {
          // Secret existe et n'est pas expiré, réutiliser
          console.log('[MFA] Reusing existing setup secret, age:', setupAge, 's');
          const { generateQrCode } = await import('../services/mfaService.js');
          const qrCodeUrl = await generateQrCode(setupSecret, user.email);
          setup = { secret: setupSecret, qrCodeUrl };
        } else {
          // Générer un nouveau secret
          const { generateMfaSetup } = await import('../services/mfaService.js');
          setup = await generateMfaSetup(userId, user.email);
          
          // Stocker le secret en attente
          await authService.storeMfaSetupSecret(userId, setup.secret);
          console.log('[MFA] Generated new setup secret');
        }
        
        result.mfaSetup = {
          secret: setup.secret,
          qrCodeUrl: setup.qrCodeUrl,
          message: 'Veuillez scanner le QR code avec Google Authenticator'
        };
        result.requiresSetup = true;
      }
    } catch (mfaErr) {
      console.error('MFA auto-setup failed:', mfaErr.message);
    }
  }

  res.json({
    message: 'Login successful',
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
    userId: result.userId,
    email: result.user?.email,
    // role expose dans les deux branches (MFA via result.role, sans MFA via result.user)
    // pour permettre au frontend de filtrer le scope citoyen vs personnel avant MFA.
    role: result.role || result.user?.role_par_defaut || null,
    requiresMFA: result.requiresMFA || false,
    requiresSetup: result.requiresSetup || false,
    mfaSetup: result.mfaSetup || null
  });
});

/**
 * GET /auth/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await authService.getUserById(userId);
  res.json({ data: user });
});

/**
 * PUT /users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updated = await userService.updateProfile(userId, req.body);
  res.json({ message: 'Profile updated', data: updated });
});

/**
 * POST /users/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const result = await userService.changePassword(userId, oldPassword, newPassword);
  res.json(result);
});

/**
 * GET /users/profile-with-stats
 */
export const getProfileWithStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await userService.getProfileWithStats(userId);
  res.json({ data: user });
});

/**
 * POST /auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email, from } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  // `from` ('citoyen' | undefined) — quand la requête vient du flow mobile
  // citoyen, le lien email pointe vers /citoyen/reset-password (page isolée
  // qui redirige vers /citoyen/login). Sinon comportement upstream inchangé.
  const result = await authService.forgotPassword(email, { from });
  res.json(result);
});

/**
 * POST /auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
  }
  
  const result = await authService.resetPassword(token, newPassword);
  res.json(result);
});

/**
 * POST /auth/activate
 */
export const activateAccount = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Email, token et nouveau mot de passe requis' });
  }
  
  const result = await authService.activateAccount(email, token, newPassword);
  res.json(result);
});

// ====================================================================
// Self-registration citoyen — flow isolé du register admin upstream.
// ====================================================================

/** POST /auth/citoyen/register */
export const citoyenRegister = asyncHandler(async (req, res) => {
  const { email, nom, prenom, password } = req.body || {};
  if (!email || !nom || !prenom || !password) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  const result = await authService.registerCitoyen(email, nom, prenom, password);
  res.status(201).json(result);
});

/** POST /auth/citoyen/verify-activation */
export const citoyenVerifyActivation = asyncHandler(async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'Email et code requis' });
  }
  const result = await authService.verifyCitoyenActivation(email, String(code).trim());
  res.json(result);
});

/** POST /auth/citoyen/resend-activation */
export const citoyenResendActivation = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }
  const result = await authService.resendCitoyenActivation(email);
  res.json(result);
});