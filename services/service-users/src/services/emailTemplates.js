
export const getPasswordResetHtml = (resetUrl, appUrl) => `
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
                        <a href="${resetUrl}" style="background-color: #4CAF50; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: 600; display: inline-block;">
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
                    <a href="${appUrl}/terms" style="color: #4CAF50; text-decoration: none;">Conditions d'utilisation</a> | 
                    <a href="${appUrl}/privacy" style="color: #4CAF50; text-decoration: none;">Politique de confidentialité</a>
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

export const getWelcomeHtml = (prenom, appUrl) => `
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
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Bienvenue sur EcoTrack, ${prenom} !</h2>
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
                        <a href="${appUrl}" style="background-color: #4CAF50; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-size: 16px; font-weight: 600; display: inline-block;">
                          Commencer maintenant
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
