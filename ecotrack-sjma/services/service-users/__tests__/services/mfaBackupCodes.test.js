// V2-002 — cycle de vie des codes de secours :
//  - un code fonctionne une fois, puis est refusé au second usage ;
//  - la consommation n'altère ni mfa_enabled ni totp_secret (le TOTP marche
//    toujours après utilisation d'un code de secours).

const mockRepository = {
  consumeMfaBackupCode: jest.fn(),
  updateMfaSettings: jest.fn(),
  createActivationCode: jest.fn(),
  findActivationByEmailAndCode: jest.fn(),
  findActiveActivationByEmail: jest.fn(),
  deleteActivationByEmail: jest.fn(),
  resetMfaForRecovery: jest.fn(),
};
jest.mock('../../src/repositories/auth.repository.js', () => ({
  __esModule: true,
  get AuthRepository() {
    return mockRepository;
  },
}));

import speakeasy from 'speakeasy';
import {
  verifyMfaCode,
  regenerateBackupCodes,
  createRecoveryCode,
  verifyRecoveryCode,
} from '../../src/services/mfaService.js';

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

describe('regenerateBackupCodes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.updateMfaSettings.mockResolvedValue(undefined);
  });

  it('génère 10 codes à 8 caractères et les persiste (sans toucher TOTP)', async () => {
    const codes = await regenerateBackupCodes(7);

    expect(codes).toHaveLength(10);
    codes.forEach((c) => expect(c).toMatch(/^[0-9A-F]{8}$/));
    expect(mockRepository.updateMfaSettings).toHaveBeenCalledTimes(1);
    const [userId, settings] = mockRepository.updateMfaSettings.mock.calls[0];
    expect(userId).toBe(7);
    // Seuls les backup_codes sont écrits : mfa_enabled / totp_secret préservés.
    expect(settings).not.toHaveProperty('mfa_enabled');
    expect(settings).not.toHaveProperty('totp_secret');
    expect(JSON.parse(settings.backup_codes)).toEqual(codes);
  });
});

describe('récupération MFA par code email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.createActivationCode.mockResolvedValue({ email: 'u@test.com' });
    mockRepository.deleteActivationByEmail.mockResolvedValue(undefined);
    mockRepository.resetMfaForRecovery.mockResolvedValue({ id_utilisateur: 7 });
    mockRepository.findActiveActivationByEmail.mockResolvedValue(undefined);
  });

  it('crée un code à 6 chiffres avec expiration', async () => {
    const { code, reused } = await createRecoveryCode('u@test.com');

    expect(reused).toBe(false);
    expect(code).toMatch(/^\d{6}$/);
    expect(mockRepository.createActivationCode).toHaveBeenCalledTimes(1);
    const [email, storedCode, expiresAt] = mockRepository.createActivationCode.mock.calls[0];
    expect(email).toBe('u@test.com');
    expect(storedCode).toBe(code);
    expect(expiresAt instanceof Date).toBe(true);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("réutilise un code valide existant sans en générer un nouveau", async () => {
    mockRepository.findActiveActivationByEmail.mockResolvedValue({
      email: 'u@test.com',
      code: '654321',
      expires_at: new Date(Date.now() + 60000),
    });

    const { code, reused } = await createRecoveryCode('u@test.com');

    expect(reused).toBe(true);
    expect(code).toBe('654321');
    expect(mockRepository.createActivationCode).not.toHaveBeenCalled();
  });

  it('rejette un code inconnu sans réinitialiser le MFA', async () => {
    mockRepository.findActivationByEmailAndCode.mockResolvedValue(undefined);

    const ok = await verifyRecoveryCode(7, 'u@test.com', '000000');

    expect(ok).toBe(false);
    expect(mockRepository.resetMfaForRecovery).not.toHaveBeenCalled();
    expect(mockRepository.deleteActivationByEmail).not.toHaveBeenCalled();
  });

  it('accepte un code valide, le consomme et réinitialise le MFA', async () => {
    mockRepository.findActivationByEmailAndCode.mockResolvedValue({ email: 'u@test.com', expires_at: new Date() });

    const ok = await verifyRecoveryCode(7, 'u@test.com', '123456');

    expect(ok).toBe(true);
    expect(mockRepository.findActivationByEmailAndCode).toHaveBeenCalledWith('u@test.com', '123456');
    expect(mockRepository.deleteActivationByEmail).toHaveBeenCalledWith('u@test.com');
    expect(mockRepository.resetMfaForRecovery).toHaveBeenCalledWith(7);
  });
});
