import {
  getPasswordResetHtml,
  getWelcomeHtml,
  getAdminCreatedUserHtml,
  getAccountStatusHtml,
  getRoleChangeHtml,
  getAccountDeletedHtml,
} from '../../src/services/emailTemplates.js';

describe('emailTemplates', () => {
  const appUrl = 'https://app.ecotrack.test';

  it('builds password reset template with reset url', () => {
    const html = getPasswordResetHtml('https://reset/link', appUrl);
    expect(html).toContain('https://reset/link');
    expect(html).toContain('Réinitialisation de votre mot de passe');
    expect(html).toContain(`${appUrl}/privacy`);
  });

  it('builds welcome template with first name', () => {
    const html = getWelcomeHtml('Nora', appUrl);
    expect(html).toContain('Bienvenue sur EcoTrack, Nora');
    expect(html).toContain(`${appUrl}/login`);
  });

  it('builds admin-created template with mapped role labels', () => {
    const htmlAdmin = getAdminCreatedUserHtml('Nora', 'Dupont', 'ADMIN', 'Temp123', appUrl);
    const htmlCustom = getAdminCreatedUserHtml('Nora', 'Dupont', 'CUSTOM', 'Temp123', appUrl);

    expect(htmlAdmin).toContain('Administrateur');
    expect(htmlAdmin).toContain('Temp123');
    expect(htmlCustom).toContain('CUSTOM');
  });

  it('builds account status template for activated and deactivated states', () => {
    const active = getAccountStatusHtml('Nora', true, appUrl);
    const inactive = getAccountStatusHtml('Nora', false, appUrl);

    expect(active).toContain('Compte activé');
    expect(active).toContain(`${appUrl}/login`);
    expect(inactive).toContain('Compte désactivé');
    expect(inactive).not.toContain(`${appUrl}/login`);
  });

  it('builds role change template with both branch messages', () => {
    const elevated = getRoleChangeHtml('Nora', 'CITOYEN', 'ADMIN', appUrl);
    const basic = getRoleChangeHtml('Nora', 'ADMIN', 'CITOYEN', appUrl);

    expect(elevated).toContain('Vous avez désormais accès à de nouvelles fonctionnalités administratives');
    expect(basic).toContain('veuillez contacter l\'administrateur');
    expect(elevated).toContain('Citoyen');
    expect(elevated).toContain('Administrateur');
  });

  it('builds account deleted template', () => {
    const html = getAccountDeletedHtml('Nora', appUrl);

    expect(html).toContain('Compte supprimé');
    expect(html).toContain('Bonjour Nora');
    expect(html).toContain('irréversible');
  });
});
