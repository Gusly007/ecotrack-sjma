import * as mfaService from '../services/mfaService.js';
import * as authService from '../services/authService.js';
import * as sessionService from '../services/sessionService.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';
import * as auditService from '../services/auditService.js';

export const setup = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await authService.getUserById(userId);
    const setupData = await mfaService.generateMfaSetup(userId, user.email);
    const { AuthRepository } = await import('../repositories/auth.repository.js');
    await AuthRepository.updateUserMfaSetupSecret(userId, setupData.secret);
    res.json({ secret: setupData.secret, qrCodeUrl: setupData.qrCodeUrl });
  } catch (err) { next(err); }
};

export const verify = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { secret, token } = req.body;
    if (!secret || !token) return res.status(400).json({ error: 'Secret et token requis' });
    const result = await mfaService.enableMfa(userId, secret);
    res.json({ message: 'MFA activé', backupCodes: result.backupCodes });
  } catch (err) { next(err); }
};

export const disable = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await mfaService.disableMfa(userId);
    res.json({ message: 'MFA désactivé' });
  } catch (err) { next(err); }
};

export const completeSetupAndLogin = async (req, res, next) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: 'userId et code requis' });
    const user = await authService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const { AuthRepository } = await import('../repositories/auth.repository.js');
    const userWithSecret = await AuthRepository.findUserByIdWithMfa(userId);
    const setupSecret = String(userWithSecret?.mfa_setup_secret || '').trim();
    if (!setupSecret) return res.status(400).json({ error: 'Setup MFA non initialisé' });
    if (!mfaService.verifyTotp(String(code), setupSecret)) {
      return res.status(401).json({ error: 'Code MFA invalide' });
    }
    await mfaService.enableMfa(userId, setupSecret);
    const accessToken = generateToken(user.id_utilisateur, user.role_par_defaut);
    const refreshToken = generateRefreshToken(user.id_utilisateur);
    await sessionService.storeRefreshToken(user.id_utilisateur, refreshToken);
    res.json({ 
      message: 'MFA activé et connexion réussie', 
      token: accessToken,
      accessToken: accessToken, 
      refreshToken,
      user: { id: user.id_utilisateur, email: user.email, prenom: user.prenom, role: user.role_par_defaut } 
    });
  } catch (err) { next(err); }
};

export const loginWithMfa = async (req, res, next) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: 'userId et code requis' });
    const user = await authService.getUserById(userId);
    if (!user || !user.mfa_enabled) return res.status(400).json({ error: 'MFA non activé' });
    const verification = await mfaService.verifyMfaCode(code, user);
    if (!verification.valid) return res.status(401).json({ error: 'Code MFA invalide' });
    const accessToken = generateToken(user.id_utilisateur, user.role_par_defaut);
    const refreshToken = generateRefreshToken(user.id_utilisateur);
    await sessionService.storeRefreshToken(user.id_utilisateur, refreshToken);

    // Audit du login réussi via MFA
    try {
      await auditService.logLoginAttempt(user.email, true, req.ip);
    } catch (_) {}

    res.json({ 
      message: 'Login successful',
      token: accessToken,        // Clé standard pour le frontend
      accessToken: accessToken,  // Compatibilité ascendante
      refreshToken,
      user: { id: user.id_utilisateur, email: user.email, prenom: user.prenom, role: user.role_par_defaut }
    });
  } catch (err) { next(err); }
};
