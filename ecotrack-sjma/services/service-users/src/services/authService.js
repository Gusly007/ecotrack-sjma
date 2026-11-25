import { AuthRepository } from '../repositories/auth.repository.js';
import { hashPassword, comparePassword } from "../utils/crypto.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";
import * as auditService from './auditService.js';
import * as sessionService from './sessionService.js';
import { sendPasswordResetEmail, sendAdminCreatedUserEmail, sendCitoyenActivationEmail } from './emailService.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

// Code numérique à 6 chiffres (000000-999999) — facile à taper depuis un email
// sur mobile. crypto.randomInt assure une distribution cryptographiquement
// aléatoire sur toute la plage.
const generateNumericCode = (digits = 6) => {
  const max = 10 ** digits;
  return String(crypto.randomInt(0, max)).padStart(digits, '0');
};

const ACTIVATION_TTL_MS = 30 * 60 * 1000;

/**
 * Inscrire un nouvel utilisateur
 */
export const registerUser = async (email, nom, prenom, password, role = 'CITOYEN') => {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await AuthRepository.findUserByEmailOrPrenom(email, prenom);
    if (existingUser.length > 0) {
      const error = new Error('Email already in use');
      error.status = 409;
      throw error;
    }
    
    if (!password || password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }
    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);
    // Créer l'utilisateur dans la base de données
    const newUser = await AuthRepository.insertUser(email, nom, prenom, hashedPassword, role);
    // Générer les tokens JWT
    const accessToken = generateToken(newUser.id_utilisateur, newUser.role_par_defaut);
    const refreshToken = generateRefreshToken(newUser.id_utilisateur);

    await sessionService.limitConcurrentSessions(newUser.id_utilisateur);
    await sessionService.storeRefreshToken(newUser.id_utilisateur, refreshToken);

    // Envoyer email de création de compte par admin
    try {
      await sendAdminCreatedUserEmail(email, prenom, nom, role, password);
    } catch (_) {
      // ignore email failures
    }

    // Audit (best-effort)
    try {
      await auditService.logAction(newUser.id_utilisateur, 'USER_REGISTER', 'UTILISATEUR', newUser.id_utilisateur);
    } catch (_) {
      // ignore audit failures
    }

    return {
      user: newUser,
      accessToken,
      refreshToken
    };
  } catch (err) {
    try {
      await auditService.logAction(null, 'USER_REGISTER_FAILED', 'UTILISATEUR', null);
    } catch (_) {
      // ignore audit failures
    }
    throw err;
  }
};

/**
 * Connexion d'un utilisateur
 */
export const loginUser = async (email, password, ipAddress = null) => {
  try {
    // Récupérer l'utilisateur 
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }
    // Vérifier si actif
    if (!user.est_active) {
      const error = new Error('Compte inactif');
      error.status = 403;
      throw error;
    }
    // Vérifier le mot de passe
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    // Vérifier si le compte a été soft-deleted (période de grâce expirée)
    if (user.deleted_at) {
      const error = new Error('Votre compte a été supprimé définitivement. Veuillez contacter l\'administrateur.');
      error.status = 403;
      throw error;
    }

    const mfa = await AuthRepository.findUserByIdWithMfa(user.id_utilisateur);
    if (!mfa) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    // Si MFA est activé, demander juste le code (pas de setup)
    if (mfa.mfa_enabled) {
      await sessionService.limitConcurrentSessions(user.id_utilisateur);
      
      // Audit (best-effort)
      try {
        await auditService.logLoginAttempt(email, true, ipAddress);
      } catch (_) {
        // ignore audit failures
      }

      return {
        requiresMFA: true,
        requiresSetup: false,
        userId: user.id_utilisateur,
        email: user.email,
        // role expose pour permettre au frontend de filtrer par scope
        // (citoyen vs personnel) AVANT la navigation vers la page MFA partagee.
        role: user.role_par_defaut,
        message: 'Entrez le code MFA de votre application'
      };
    }

    // Si MFA n'est pas activé, générer automatiquement le setup
    // Vérifier si un secret de setup existe déjà et n'est pas expiré (< 10 min)
    const setupSecret = mfa.mfa_setup_secret;
    const setupCreatedAt = mfa.mfa_setup_secret_created_at;
    const now = new Date();
    const setupAge = setupCreatedAt ? (now - new Date(setupCreatedAt)) / 1000 : Infinity;
    
    let setup;
    if (setupSecret && setupAge < 600) {
      // Réutiliser le secret existant
      console.log('[AuthService] Réutilisation du secret existant, age:', setupAge, 's');
      const { generateQrCode } = await import('../services/mfaService.js');
      const qrCodeUrl = await generateQrCode(setupSecret, user.email);
      setup = { secret: setupSecret, qrCodeUrl };
    } else {
      // Générer un nouveau secret
      console.log('[AuthService] Génération nouveau secret');
      const { generateMfaSetup } = await import('../services/mfaService.js');
      setup = await generateMfaSetup(user.id_utilisateur, user.email);
      
      // ⚠️ IMPORTANT: Sauvegarder le secret en base !
      await storeMfaSetupSecret(user.id_utilisateur, setup.secret);
    }
    
    await sessionService.limitConcurrentSessions(user.id_utilisateur);
    
    // Audit (best-effort)
    try {
      await auditService.logLoginAttempt(email, true, ipAddress);
    } catch (_) {
      // ignore audit failures
    }

    return {
      requiresMFA: true,
      requiresSetup: true,
      mfaSetup: {
        secret: setup.secret,
        qrCodeUrl: setup.qrCodeUrl
      },
      userId: user.id_utilisateur,
      email: user.email,
      // role expose pour le filtrage de scope cote frontend (cf. branche MFA ci-dessus).
      role: user.role_par_defaut,
      message: 'Veuillez scanner le QR code avec Google Authenticator'
    };
  } catch (err) {
    try {
      await auditService.logLoginAttempt(email, false, ipAddress);
    } catch (_) {
      // ignore audit failures
    }
    throw err;
  }
};

/**
 * Récupérer un utilisateur par son ID
 */
export const getUserById = async (userId) => {
  const user = await AuthRepository.findUserByIdWithMfa(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Stocker le secret MFA en attente de vérification
 */
export const storeMfaSetupSecret = async (userId, secret) => {
  try {
    await AuthRepository.updateUserMfaSetupSecret(userId, secret);
    console.log('[AuthService] MFA setup secret stored for userId:', userId);
  } catch (error) {
    console.error('[AuthService] Failed to store MFA setup secret:', error);
    throw error;
  }
};

/**
 * Message unique renvoyé pour TOUS les cas de /auth/forgot-password.
 * Le même texte part que l'email existe ou non : un attaquant ne peut pas
 * distinguer un compte réel d'un compte inexistant (anti-énumération).
 */
export const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'Si un compte est associé à cette adresse, un lien de réinitialisation a été envoyé.';

/**
 * Le resetToken ne doit JAMAIS sortir de l'API hors d'un environnement de test
 * explicitement isolé. `NODE_ENV=test` seul ne suffit pas (Jest tourne en test,
 * mais aussi toute stack de préprod). On exige en plus un opt-in explicite,
 * absent de docker-compose / .env de prod, et jamais défini automatiquement.
 *
 * `!isProdLike` est redondant avec `isTestEnv` (test n'est ni production ni
 * staging) : gardé comme garde-fou explicite si `isTestEnv` venait à s'élargir.
 */
const isTokenPreviewAllowed = () => {
  const isTestEnv = env.nodeEnv === 'test';
  const optedIn = process.env.ALLOW_RESET_TOKEN_PREVIEW === 'true';
  const isProdLike = env.nodeEnv === 'production' || env.nodeEnv === 'staging';
  return isTestEnv && optedIn && !isProdLike;
};

/**
 * Plancher de latence de /auth/forgot-password.
 *
 * Le corps de réponse est identique quel que soit le compte, mais le TEMPS de
 * réponse trahissait encore son existence : un email connu déclenche une
 * écriture en base + un envoi SMTP, un email inconnu seulement deux lectures.
 * On ne renvoie donc la réponse qu'après un délai fixe, que le travail soit
 * terminé ou non.
 *
 * 2000 ms couvre largement le cas nominal (DB + SMTP rapide) et reste sous le
 * timeout client. Un SMTP plus lent que ce plancher n'est plus attendu du tout
 * (voir le fire-and-forget ci-dessous), donc son temps n'apparaît jamais.
 */
const FORGOT_PASSWORD_MIN_DURATION_MS = 2000;

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Demander la réinitialisation du mot de passe.
 *
 * Anti-énumération sur deux canaux :
 *  - le corps et le statut sont identiques (200 + message générique) ;
 *  - le délai de réponse est constant (plancher fixe), donc il ne dépend pas de
 *    l'existence du compte ni de la latence SMTP.
 *
 * En mode aperçu de test, on attend réellement l'envoi pour pouvoir renvoyer
 * le previewUrl / resetToken. Dans tous les autres cas, écriture du jeton et
 * envoi s'exécutent en arrière-plan : la réponse part sans les attendre.
 *
 * Le fire-and-forget suppose que le process n'est pas arrêté dès la réponse.
 * Sur Cloud Run, service-users est déployé avec `--min-instances=0` et sans
 * `--no-cpu-throttling` : le CPU est coupé après la réponse. Il faut donc soit
 * ajouter `--no-cpu-throttling` au déploiement, soit déporter l'envoi dans une
 * file (Kafka est déjà en place). Tant que ce n'est pas fait, l'écriture du
 * jeton peut être retardée ou perdue sur cette plateforme.
 */
export const forgotPassword = async (email, { from } = {}) => {
  const genericResponse = { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
  const startedAt = Date.now();

  const finish = async (payload = genericResponse) => {
    const elapsed = Date.now() - startedAt;
    const remaining = FORGOT_PASSWORD_MIN_DURATION_MS - elapsed;
    if (remaining > 0) await waitFor(remaining);
    return payload;
  };

  try {
    const address = typeof email === 'string' ? email.trim() : '';
    const user = await AuthRepository.findUserByEmail(address)
      ?? await AuthRepository.findUniqueUserByEmailIgnoreCase(address);

    if (!user) {
      // Aucun compte unique : on ne signale rien et on n'écrit rien.
      return finish();
    }

    // Même après une recherche sans distinction de casse, le token et le
    // courriel utilisent l'adresse enregistrée, comparée exactement au reset.
    const recipientEmail = user.email;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    const issueAndSend = async () => {
      await AuthRepository.createPasswordResetToken(recipientEmail, resetToken, expiresAt);
      // `from === 'citoyen'` aiguille le lien email vers /citoyen/reset-password
      // (page isolée du scope mobile, redirige vers /citoyen/login après succès).
      return sendPasswordResetEmail(recipientEmail, resetToken, { from });
    };

    // Aperçu Ethereal : seul cas où l'on attend, pour pouvoir renvoyer le lien.
    if (isTokenPreviewAllowed()) {
      const emailResult = await issueAndSend();
      if (emailResult?.previewUrl) {
        return finish({ ...genericResponse, previewUrl: emailResult.previewUrl, resetToken });
      }
      return finish();
    }

    // Chemin nominal : le travail continue après la réponse, son échec est
    // journalisé côté serveur uniquement.
    issueAndSend().catch((err) => {
      logger.error({ err: err?.message }, 'forgotPassword: envoi en arrière-plan échoué');
    });

    return finish();
  } catch (error) {
    // Toute erreur interne (SMTP, DB) reste une réponse générique : le message
    // d'erreur ne doit pas devenir un oracle d'énumération.
    logger.error({ err: error?.message, code: error?.code }, 'Error in forgotPassword');
    return finish();
  }
};

/**
 * Réinitialiser le mot de passe
 */
export const resetPassword = async (token, newPassword) => {
  const resetData = await AuthRepository.findPasswordResetToken(token);

  if (!resetData) {
    throw new Error('Token invalide ou expiré');
  }

  if (newPassword.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  }

  const hashedPassword = await hashPassword(newPassword);
  await AuthRepository.updatePassword(resetData.email, hashedPassword);
  await AuthRepository.deletePasswordResetToken(token);

  return { message: 'Mot de passe réinitialisé avec succès' };
};

/**
 * Activer un compte utilisateur avec mot de passe temporaire
 */
export const activateAccount = async (email, token, newPassword) => {
  const user = await AuthRepository.findUserByEmail(email);
  
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  if (newPassword.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  }

  const hashedPassword = await hashPassword(newPassword);
  await AuthRepository.updatePassword(email, hashedPassword);

  return { message: 'Compte activé avec succès' };
};

// ====================================================================
// Self-registration citoyen (flow isolé du flow admin-créé upstream).
// 1) POST /auth/citoyen/register   → crée user inactif + envoie code 6 chiffres
// 2) POST /auth/citoyen/verify-activation → valide code, active, renvoie JWT
// 3) POST /auth/citoyen/resend-activation → régénère et renvoie un code
//
// Admin/manager continuent d'utiliser registerUser() qui auto-active et
// envoie un mot de passe temporaire. Aucune intersection.
// ====================================================================

export const registerCitoyen = async (email, nom, prenom, password) => {
  const existing = await AuthRepository.findUserByEmailOrPrenom(email, prenom);
  if (existing.length > 0) {
    const error = new Error('Email already in use');
    error.status = 409;
    throw error;
  }
  if (!password || password.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  }

  const hashedPassword = await hashPassword(password);
  // est_active = false : l'utilisateur doit saisir le code reçu par email
  // avant de pouvoir se connecter.
  const newUser = await AuthRepository.insertUser(email, nom, prenom, hashedPassword, 'CITOYEN', false);

  const code = generateNumericCode(6);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
  await AuthRepository.createActivationCode(email, code, expiresAt);

  let emailResult = { success: false };
  try {
    emailResult = await sendCitoyenActivationEmail(email, prenom, code);
  } catch (err) {
    console.error('[registerCitoyen] activation email failed:', err.message);
  }

  // Audit best-effort.
  try {
    await auditService.logAction(newUser.id_utilisateur, 'CITOYEN_REGISTER', 'UTILISATEUR', newUser.id_utilisateur);
  } catch (_) { /* ignore */ }

  // En dev seulement : log le previewUrl Ethereal + le code côté serveur
  // pour faciliter le test. En production, le code ne quitte jamais l'email.
  if (env.nodeEnv !== 'production' && emailResult?.previewUrl) {
    console.log('[Email][DEV] Citoyen activation preview:', emailResult.previewUrl, '| code:', code);
  }

  return {
    message: "Un code d'activation a été envoyé à votre email.",
    email,
    requiresActivation: true,
    user: {
      id_utilisateur: newUser.id_utilisateur,
      email: newUser.email,
      prenom: newUser.prenom,
      nom: newUser.nom
    }
  };
};

export const verifyCitoyenActivation = async (email, code) => {
  const row = await AuthRepository.findActivationByEmailAndCode(email, code);
  if (!row) {
    const error = new Error("Code d'activation invalide ou expiré");
    error.status = 400;
    throw error;
  }

  await AuthRepository.setUserActive(email, true);
  await AuthRepository.deleteActivationByEmail(email);

  const user = await AuthRepository.findUserByEmail(email);
  if (!user) {
    throw new Error('User not found after activation');
  }

  const accessToken = generateToken(user.id_utilisateur, user.role_par_defaut);
  const refreshToken = generateRefreshToken(user.id_utilisateur);
  await sessionService.limitConcurrentSessions(user.id_utilisateur);
  await sessionService.storeRefreshToken(user.id_utilisateur, refreshToken);

  return {
    message: 'Compte activé avec succès',
    token: accessToken,
    refreshToken,
    user: {
      id_utilisateur: user.id_utilisateur,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      role_par_defaut: user.role_par_defaut,
      points: user.points,
      avatar_url: user.avatar_url || null,
      avatar_thumbnail: user.avatar_thumbnail || null,
      avatar_mini: user.avatar_mini || null
    }
  };
};

export const resendCitoyenActivation = async (email) => {
  const user = await AuthRepository.findUserByEmail(email);
  if (!user) {
    const error = new Error("Aucun compte trouvé avec cet email");
    error.status = 404;
    throw error;
  }
  if (user.est_active) {
    return { message: 'Compte déjà activé. Connectez-vous.', alreadyActive: true };
  }

  const code = generateNumericCode(6);
  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
  await AuthRepository.createActivationCode(email, code, expiresAt);

  let emailResult = { success: false };
  try {
    emailResult = await sendCitoyenActivationEmail(email, user.prenom, code);
  } catch (err) {
    console.error('[resendCitoyenActivation] email failed:', err.message);
  }

  if (env.nodeEnv !== 'production' && emailResult?.previewUrl) {
    console.log('[Email][DEV] Citoyen re-activation preview:', emailResult.previewUrl, '| code:', code);
  }

  return { message: 'Un nouveau code a été envoyé à votre email.' };
};
