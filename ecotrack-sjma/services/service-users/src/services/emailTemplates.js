export const getPasswordResetHtml = (resetUrl, appUrl) => {
  const escapedResetUrl = escapeHtml(resetUrl);
  const escapedAppUrl = escapeHtml(appUrl);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">EcoTrack</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Gestion des déchets simplifiée</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Réinitialisation de votre mot de passe</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Vous avez demandé la réinitialisation de votre mot de passe EcoTrack. 
                    Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 30px 0;">
                        <a href="${escapedResetUrl}" style="background-color: #4CAF50; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: 600; display: inline-block;">
                          Réinitialiser mon mot de passe
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #999999; font-size: 14px; margin: 20px 0 0 0;">
                    Ce lien expire dans <strong>1 heure</strong>.
                  </p>
                  <p style="color: #999999; font-size: 14px; margin: 20px 0 0 0;">
                    Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © 2026 EcoTrack. Tous droits réservés.
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                    <a href="${escapedAppUrl}/terms" style="color: #4CAF50; text-decoration: none;">Conditions d'utilisation</a> | 
                    <a href="${escapedAppUrl}/privacy" style="color: #4CAF50; text-decoration: none;">Politique de confidentialité</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
`;
};

// Security: HTML escape function to prevent XSS  
const escapeHtml = (text) => {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
};

export const getWelcomeHtml = (prenom, appUrl) => {
  const escapedPrenom = escapeHtml(prenom);
  const escapedAppUrl = escapeHtml(appUrl);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">EcoTrack</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Bienvenue !</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Bienvenue sur EcoTrack, ${escapedPrenom} !</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Nous sommes ravis de vous accueillir dans notre communauté engagée pour l'environnement.
                  </p>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Avec EcoTrack, vous pouvez :
                  </p>
                  <ul style="color: #666666; font-size: 16px; line-height: 1.8; margin: 0 0 20px 20px;">
                    <li>Signaler les problèmes environnementaux</li>
                    <li>Suivre vos actions et gagner des points</li>
                    <li>Participer à des défis écologiques</li>
                    <li>Contribuer à un environnement plus propre</li>
                  </ul>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 30px 0;">
                        <a href="${escapedAppUrl}/login" style="background-color: #4CAF50; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: 600; display: inline-block;">
                          Se connecter
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © 2026 EcoTrack. Tous droits réservés.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
`;
};

export const getAdminCreatedUserHtml = (prenom, nom, role, password, appUrl) => {
  const escapedPrenom = escapeHtml(prenom);
  const escapedNom = escapeHtml(nom);
  const escapedPassword = escapeHtml(password);
  const escapedAppUrl = escapeHtml(appUrl);
  const roleLabels = {
    CITOYEN: 'Citoyen',
    AGENT: 'Agent de collecte',
    GESTIONNAIRE: 'Gestionnaire',
    ADMIN: 'Administrateur'
  };
  const roleLabel = roleLabels[role] || role;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">EcoTrack</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Compte créé par l'administrateur</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Bienvenue, ${escapedPrenom} ${escapedNom} !</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Un compte EcoTrack a été créé pour vous par l'administrateur.
                  </p>
                  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; color: #333; font-size: 16px;"><strong>Votre compte :</strong></p>
                    <p style="margin: 5px 0; color: #666; font-size: 14px;">• Rôle : <strong>${roleLabel}</strong></p>
                    <p style="margin: 5px 0; color: #666; font-size: 14px;">• Email : ${escapedPrenom.toLowerCase()}.${escapedNom.toLowerCase()}@ecotrack.local</p>
                  </div>
                  <div style="background-color: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0 0 10px 0; color: #856404; font-size: 16px;"><strong>🔑 Mot de passe temporaire :</strong></p>
                    <p style="margin: 0; color: #856404; font-size: 18px; font-family: monospace; letter-spacing: 2px;"><strong>${escapedPassword}</strong></p>
                    <p style="margin: 10px 0 0 0; color: #856404; font-size: 13px;">Vous devrez changer ce mot de passe lors de votre première connexion.</p>
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 30px 0;">
                        <a href="${escapedAppUrl}/login" style="background-color: #4CAF50; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: 600; display: inline-block;">
                          Se connecter
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © 2026 EcoTrack. Tous droits réservés.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getAccountStatusHtml = (prenom, isActivated, appUrl) => {
  const escapedPrenom = escapeHtml(prenom);
  const escapedAppUrl = escapeHtml(appUrl);
  const status = isActivated ? 'activé' : 'désactivé';
  const title = isActivated ? 'Compte activé' : 'Compte désactivé';
  const color = isActivated ? '#4CAF50' : '#f44336';
  const icon = isActivated ? '✅' : '❌';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, ${color} 0%, ${color === '#4CAF50' ? '#2E7D32' : '#d32f2f'} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">EcoTrack</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Modification de compte</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">${icon} ${title}</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Bonjour ${escapedPrenom},
                  </p>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Votre compte EcoTrack a été <strong>${status}</strong> par un administrateur.
                  </p>
                  ${isActivated 
                    ? `<table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <a href="${escapedAppUrl}/login" style="background-color: ${color}; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: 600; display: inline-block;">
                              Se connecter
                            </a>
                          </td>
                        </tr>
                      </table>`
                    : ``
                  }
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © 2026 EcoTrack. Tous droits réservés.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getRoleChangeHtml = (prenom, oldRole, newRole, appUrl) => {
  const escapedPrenom = escapeHtml(prenom);
  const escapedAppUrl = escapeHtml(appUrl);
  const roleLabels = {
    CITOYEN: 'Citoyen',
    AGENT: 'Agent de collecte',
    GESTIONNAIRE: 'Gestionnaire',
    ADMIN: 'Administrateur'
  };
  const oldRoleLabel = roleLabels[oldRole] || oldRole;
  const newRoleLabel = roleLabels[newRole] || newRole;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">EcoTrack</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Modification de rôle</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">🔄 Rôle modifié</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Bonjour ${escapedPrenom},
                  </p>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Votre rôle sur EcoTrack a été modifié par un administrateur.
                  </p>
                  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Ancien rôle</p>
                    <p style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 600;">${escapeHtml(oldRoleLabel)}</p>
                    <p style="margin: 0; color: #2196F3; font-size: 24px;">⬇️</p>
                    <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">Nouveau rôle</p>
                    <p style="margin: 10px 0 0 0; color: #4CAF50; font-size: 18px; font-weight: 600;">${escapeHtml(newRoleLabel)}</p>
                  </div>
                  ${newRole === 'ADMIN' || newRole === 'GESTIONNAIRE' 
                    ? `<p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Vous avez désormais accès à de nouvelles fonctionnalités administratives. Consultez votre tableau de bord pour voir vos nouveaux droits.</p>`
                    : `<p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Si vous avez des questions concernant ce changement, veuillez contacter l'administrateur.</p>`
                  }
                    <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 30px 0;">
                        <a href="${escapedAppUrl}/login" style="background-color: #2196F3; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: 600; display: inline-block;">
                          Se connecter
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © 2026 EcoTrack. Tous droits réservés.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getAccountDeletedHtml = (prenom, appUrl) => {
  const escapedPrenom = escapeHtml(prenom);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">EcoTrack</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Compte supprimé</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">❌ Compte supprimé</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Bonjour ${escapedPrenom},
                  </p>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Votre compte EcoTrack a été <strong>supprimé</strong> par un administrateur.
                  </p>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Toutes vos données ont été effacées de notre système. Si vous pensez que cette suppression est une erreur, veuillez contacter l'administrateur.
                  </p>
                  <div style="background-color: #ffebee; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f44336;">
                    <p style="margin: 0; color: #c62828; font-size: 14px;">
                      Cette action est irréversible. Vous ne pourrez plus vous connecter avec ce compte.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-radius: 0 0 10px 10px; text-align: center;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © 2026 EcoTrack. Tous droits réservés.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};