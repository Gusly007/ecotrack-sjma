import env from '../config/env.js';
import nodemailer from 'nodemailer';
import { getPasswordResetHtml, getWelcomeHtml, getAdminCreatedUserHtml, getAccountStatusHtml, getRoleChangeHtml, getAccountDeletedHtml } from './emailTemplates.js';

// Logger simple (remplacez par winston ou pino si besoin)
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};


let transporter = null;
let transporterPromise = null;

const initTransporter = async () => {
  logger.info('[Email] Configuration SMTP:', {
    host: env.smtp.host,
    port: env.smtp.port,
    user: env.smtp.user ? 'configured' : 'not configured',
    hasPass: !!env.smtp.pass
  });
  
  if (env.smtp.host && env.smtp.user && env.smtp.pass) {
    logger.info('[Email] Utilisation du SMTP configuré');
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000
    });
  } else {
    logger.info('[Email] Utilisation de Ethereal (SMTP de test)');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

const ensureTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  if (!transporterPromise) {
    transporterPromise = initTransporter()
      .then(() => transporter)
      .catch((err) => {
        transporterPromise = null;
        throw err;
      });
  }

  return transporterPromise;
};

export const sanitizeHtml = (unsafeHtml) => {
  if (typeof unsafeHtml !== 'string') return '';
  return unsafeHtml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sendEmail = async (to, subject, html) => {
  try {
    await ensureTransporter();
    logger.info(`[Email] Envoi vers ${to}...`);
    
    const info = await transporter.sendMail({
      from: env.smtp.from || '"EcoTrack" <noreply@ecotrack.fr>',
      to,
      subject,
      html
    });

    logger.info(`[Email] SUCCES! Envoyé à ${to}`);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[Email] VOIR L'EMAIL: ${previewUrl}`);
    }
    
    return { success: true, previewUrl };
  } catch (error) {
    logger.error(`[Email] ECHEC pour ${to}:`, error.code, error.message);
    return { success: false, error: error.message };
  }
};


export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${env.appUrl}/reset-password?token=${resetToken}`;
  const resetHtml = getPasswordResetHtml(resetUrl, env.appUrl);
  return sendEmail(email, 'Réinitialisation de votre mot de passe - EcoTrack', resetHtml);
};

export const sendWelcomeEmail = async (email, prenom) => {
  const welcomeHtml = getWelcomeHtml(prenom, env.appUrl);
  return sendEmail(email, 'Bienvenue sur EcoTrack !', welcomeHtml);
};

export const sendAdminCreatedUserEmail = async (email, prenom, nom, role, password) => {
  const html = getAdminCreatedUserHtml(prenom, nom, role, password, env.appUrl);
  return sendEmail(email, 'Votre compte EcoTrack a été créé', html);
};

export const sendAccountStatusEmail = async (email, prenom, isActivated) => {
  const html = getAccountStatusHtml(prenom, isActivated, env.appUrl);
  const subject = isActivated ? 'Votre compte EcoTrack a été activé' : 'Votre compte EcoTrack a été désactivé';
  return sendEmail(email, subject, html);
};

export const sendRoleChangeEmail = async (email, prenom, oldRole, newRole) => {
  const html = getRoleChangeHtml(prenom, oldRole, newRole, env.appUrl);
  return sendEmail(email, 'Votre rôle EcoTrack a été modifié', html);
};

export const sendAccountDeletedEmail = async (email, prenom) => {
  const html = getAccountDeletedHtml(prenom, env.appUrl);
  return sendEmail(email, 'Votre compte EcoTrack a été supprimé', html);
};
