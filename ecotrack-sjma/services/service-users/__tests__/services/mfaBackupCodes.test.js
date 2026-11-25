// V2-002 — cycle de vie des codes de secours :
//  - un code fonctionne une fois, puis est refusé au second usage ;
//  - la consommation n'altère ni mfa_enabled ni totp_secret (le TOTP marche
//    toujours après utilisation d'un code de secours).

const mockRepository = {
  consumeMfaBackupCode: jest.fn(),
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
    mockRepository.consumeMfaBackupCode.mockReset();
  });

  it('accepte un code de secours puis le refuse au second usage', async () => {
    const user = {
      id_utilisateur: 7,
      mfa_enabled: true,
      totp_secret: secret,
      backup_codes: JSON.stringify(['AAAA1111', 'BBBB2222']),
    };

    mockRepository.consumeMfaBackupCode.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const first = await verifyMfaCode('aaaa1111', user);
    expect(first).toEqual({ valid: true, usedBackupCode: true });
    expect(mockRepository.consumeMfaBackupCode).toHaveBeenCalledWith(7, 'AAAA1111');
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

    mockRepository.consumeMfaBackupCode.mockResolvedValueOnce(true);
    expect(await verifyMfaCode('CCCC3333', user)).toEqual({ valid: true, usedBackupCode: true });
    const totpResult = await verifyMfaCode(totp(), user);
    expect(totpResult).toEqual({ valid: true, usedBackupCode: false });
    expect(mockRepository.consumeMfaBackupCode).toHaveBeenCalledTimes(1);
  });
});
