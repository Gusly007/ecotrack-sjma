import pool from '../config/database.js';
import { hashPassword,comparePassword } from "../utils/crypto.js";
import{ generateToken,generateRefreshToken } from "../utils/jwt.js";
import * as auditService from './auditService.js';
import * as sessionService from './sessionService.js';

/**
 * Inscrire un nouvel utilisateur
 */
export const registerUser = async (email, username, password, role = 'CITOYEN') => {
// Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
    'SELECT id_utilisateur FROM UTILISATEUR WHERE email = $1 OR prenom = $2',
        [email, username]
    );
    if (existingUser.rows.length > 0) {
        throw new Error('Utilisateur déjà existant');
    }
//Valider password (ajouter des règles de validation si nécessaire)
    if (password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }
// Hasher le mot de passe
    const hashedPassword = await hashPassword(password);
// Créer l'utilisateur dans la base de données
    const result = await pool.query(
    `INSERT INTO UTILISATEUR (email, nom, prenom, password_hash, role_par_defaut, est_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id_utilisateur, email, nom, prenom, role_par_defaut, points`,
    [email, username, username, hashedPassword, role]
  );
    const newUser = result.rows[0];
    // Générer les tokens JWT
    const accessToken = generateToken(newUser.id_utilisateur, newUser.role_par_defaut);
  const refreshToken = generateRefreshToken(newUser.id_utilisateur);

  await sessionService.limitConcurrentSessions(newUser.id_utilisateur);
  await sessionService.storeRefreshToken(newUser.id_utilisateur, refreshToken);

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
};

/**
 * Connexion d'un utilisateur
 */
export const loginUser = async (email, password, ipAddress = null) => {
  try {
// Récupérer l'utilisateur 
    const result = await pool.query(
    'SELECT id_utilisateur, email, prenom, password_hash, role_par_defaut, points, est_active FROM UTILISATEUR WHERE email = $1',
    [email]
  );
    if (result.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
    }   
    const user = result.rows[0];
    //Vérifier si actif
    if (!user.est_active) {
        throw new Error('Utilisateur inactif');
    }
    //Vérifier le mot de passe
    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
        throw new Error('Invalid credentials');
    }
    // Générer tokens
  const accessToken = generateToken(user.id_utilisateur, user.role_par_defaut);
  const refreshToken = generateRefreshToken(user.id_utilisateur);

  await sessionService.limitConcurrentSessions(user.id_utilisateur);
  await sessionService.storeRefreshToken(user.id_utilisateur, refreshToken);

  // Audit (best-effort)
  try {
    await auditService.logLoginAttempt(email, true, ipAddress);
  } catch (_) {
    // ignore audit failures
  }

  return {
    user: {
      id: user.id_utilisateur,
      email: user.email,
      username: user.prenom,
      role: user.role_par_defaut
    },
    accessToken,
    refreshToken
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
    const result = await pool.query(
    'SELECT id_utilisateur, email, prenom, role_par_defaut, points FROM UTILISATEUR WHERE id_utilisateur = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
    return result.rows[0];
};

