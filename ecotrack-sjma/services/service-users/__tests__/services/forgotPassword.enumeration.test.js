// Tests de non-régression pour V2-011 :
//  - /auth/forgot-password ne doit jamais révéler si un compte existe
//  - le resetToken ne doit jamais sortir de l'API hors environnement isolé
//
// Le service est chargé via jest.resetModules() pour permettre de faire varier
// NODE_ENV / ALLOW_RESET_TOKEN_PREVIEW entre les cas.

const mockRepository = {
  findUserByEmail: jest.fn(),
  createPasswordResetToken: jest.fn(),
};

const mockEmailService = {
  sendPasswordResetEmail: jest.fn(),
  sendAdminCreatedUserEmail: jest.fn(),
  sendCitoyenActivationEmail: jest.fn(),
};

const loadService = () => {
  jest.resetModules();
  jest.doMock('../../src/repositories/auth.repository.js', () => ({
    __esModule: true,
    AuthRepository: mockRepository,
  }));
  jest.doMock('../../src/services/emailService.js', () => ({
    __esModule: true,
    ...mockEmailService,
  }));
  jest.doMock('../../src/services/auditService.js', () => ({
    __esModule: true,
    logLoginAttempt: jest.fn(),
    logAction: jest.fn(),
  }));
  jest.doMock('../../src/services/sessionService.js', () => ({
    __esModule: true,
    limitConcurrentSessions: jest.fn(),
  }));
  return require('../../src/services/authService.js');
};

const GENERIC = 'Si un compte est associé à cette adresse, un lien de réinitialisation a été envoyé.';

describe('authService.forgotPassword — anti-énumération', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    delete process.env.ALLOW_RESET_TOKEN_PREVIEW;
    mockEmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('un email inconnu renvoie exactement le même message qu\'un email connu', async () => {
    const { forgotPassword } = loadService();

    // Cas 1 : email existant
    mockRepository.findUserByEmail.mockResolvedValueOnce({
      id_utilisateur: 1,
      email: 'existe@ecotrack.fr',
    });
    const known = await forgotPassword('existe@ecotrack.fr');

    // Cas 2 : email inconnu
    mockRepository.findUserByEmail.mockResolvedValueOnce(null);
    const unknown = await forgotPassword('inconnu@ecotrack.fr');

    expect(known).toEqual({ message: GENERIC });
    expect(unknown).toEqual({ message: GENERIC });
    expect(JSON.stringify(known)).toBe(JSON.stringify(unknown));
  });

  test('un email inconnu n\'écrit aucun token et n\'envoie aucun email', async () => {
    const { forgotPassword } = loadService();
    mockRepository.findUserByEmail.mockResolvedValueOnce(null);

    await forgotPassword('inconnu@ecotrack.fr');

    expect(mockRepository.createPasswordResetToken).not.toHaveBeenCalled();
    expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('un email inconnu ne lève pas d\'erreur 404', async () => {
    const { forgotPassword } = loadService();
    mockRepository.findUserByEmail.mockResolvedValueOnce(null);

    await expect(forgotPassword('inconnu@ecotrack.fr')).resolves.toBeDefined();
  });

  test('une erreur interne (SMTP) ne devient pas un oracle d\'énumération', async () => {
    const { forgotPassword } = loadService();
    mockRepository.findUserByEmail.mockResolvedValueOnce({ id_utilisateur: 1, email: 'existe@ecotrack.fr' });
    mockEmailService.sendPasswordResetEmail.mockRejectedValueOnce(new Error('SMTP 550 mailbox unavailable'));

    await expect(forgotPassword('existe@ecotrack.fr')).resolves.toEqual({ message: GENERIC });
  });
});

describe('authService.forgotPassword — fuite de resetToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    mockRepository.findUserByEmail.mockResolvedValue({
      id_utilisateur: 1,
      email: 'existe@ecotrack.fr',
    });
    mockRepository.createPasswordResetToken.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('en production, previewUrl et resetToken ne sont jamais exposés', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_RESET_TOKEN_PREVIEW = 'true';
    mockEmailService.sendPasswordResetEmail.mockResolvedValue({
      success: true,
      previewUrl: 'https://ethereal.email/message/abc',
    });

    const { forgotPassword } = loadService();
    const result = await forgotPassword('existe@ecotrack.fr');

    expect(result).toEqual({ message: GENERIC });
    expect(result.resetToken).toBeUndefined();
    expect(result.previewUrl).toBeUndefined();
  });

  test('en test sans opt-in explicite, le resetToken reste caché', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ALLOW_RESET_TOKEN_PREVIEW;
    mockEmailService.sendPasswordResetEmail.mockResolvedValue({
      success: true,
      previewUrl: 'https://ethereal.email/message/abc',
    });

    const { forgotPassword } = loadService();
    const result = await forgotPassword('existe@ecotrack.fr');

    expect(result.resetToken).toBeUndefined();
    expect(result.previewUrl).toBeUndefined();
  });

  test('le resetToken n\'apparaît pas si l\'email n\'a pas de previewUrl', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_RESET_TOKEN_PREVIEW = 'true';
    mockEmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });

    const { forgotPassword } = loadService();
    const result = await forgotPassword('existe@ecotrack.fr');

    expect(result.resetToken).toBeUndefined();
    expect(result.previewUrl).toBeUndefined();
  });

  test('en environnement isolé opt-in, le preview reste disponible (dev uniquement)', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_RESET_TOKEN_PREVIEW = 'true';
    mockEmailService.sendPasswordResetEmail.mockResolvedValue({
      success: true,
      previewUrl: 'https://ethereal.email/message/abc',
    });

    const { forgotPassword } = loadService();
    const result = await forgotPassword('existe@ecotrack.fr');

    expect(result.message).toBe(GENERIC);
    expect(result.previewUrl).toBe('https://ethereal.email/message/abc');
    expect(typeof result.resetToken).toBe('string');
    expect(result.resetToken).toHaveLength(64);
  });
});