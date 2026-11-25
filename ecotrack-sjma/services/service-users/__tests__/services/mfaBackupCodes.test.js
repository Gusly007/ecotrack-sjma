// V2-002 — cycle de vie des codes de secours :
//  - un code fonctionne une fois, puis est refusé au second usage ;
//  - la consommation n'altère ni mfa_enabled ni totp_secret (le TOTP marche
//    toujours après utilisation d'un code de secours).

const mockRepository = {
  updateMfaSettings: jest.fn(),
};
jest.mock('../../src/repositories/auth.repository.js', () => ({
  __esModule: true,
  get AuthRepository() {
    return mockRepository;
  },
}));

import speakeasy from 'speakeasy';
import { verifyMfaCode } from '../../src/services/mfaService.js';

const secret = 'JBSWY3DPEHPK3PXP';
const totp = () => speakeasy.totp({ secret, encoding: 'base32' });

describe('verifyMfaCode / codes de secours', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.updateMfaSettings.mockResolvedValue(undefined);
  });

  it('accepte un code de secours puis le refuse au second usage', async () => {
    let user = {
      id_utilisateur: 7,
      mfa_enabled: true,
      totp_secret: secret,
      backup_codes: JSON.stringify(['AAAA1111', 'BBBB2222']),
    };

    const first = await verifyMfaCode('AAAA1111', user);
    expect(first).toEqual({ valid: true, usedBackupCode: true });
    // L'écriture ne doit toucher que backup_codes.
    expect(mockRepository.updateMfaSettings).toHaveBeenCalledWith(7, {
      backup_codes: JSON.stringify(['BBBB2222']),
    });
    const [, settings] = mockRepository.updateMfaSettings.mock.calls[0];
    expect(settings).not.toHaveProperty('mfa_enabled');
    expect(settings).not.toHaveProperty('totp_secret');

    // L'état client reflète la consommation : le même code est désormais refusé.
    user = { ...user, backup_codes: settings.backup_codes };
    const second = await verifyMfaCode('AAAA1111', user);
    expect(second).toEqual({ valid: false, usedBackupCode: false });
  });

  it('conserve la connexion TOTP après consommation d\'un code de secours', async () => {
    const user = {
      id_utilisateur: 7,
      mfa_enabled: true,
      totp_secret: secret,
      backup_codes: JSON.stringify(['CCCC3333']),
    };

    // Utiliser le code de secours ne modifie pas le secret TOTP en base...
    await verifyMfaCode('CCCC3333', user);
    const [, settings] = mockRepository.updateMfaSettings.mock.calls[0];
    expect(settings.totp_secret).toBeUndefined();

    // ...et le TOTP courant reste valide pour l'utilisateur.
    const totpResult = await verifyMfaCode(totp(), user);
    expect(totpResult).toEqual({ valid: true, usedBackupCode: false });
  });
});
