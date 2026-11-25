// Tests de non-régression pour les deux points bloquants de la revue V2-011 :
//
//  1. Le TEMPS de réponse de /auth/forgot-password ne doit pas dépendre de
//     l'existence du compte : un envoi SMTP qui ne se résout jamais ne doit
//     pas empêcher la réponse de partir (fire-and-forget + plancher de latence).
//  2. verifyTotp ne doit journaliser aucun code (attendu ou reçu) et doit
//     rester borné à ±1 intervalle.

const mockRepository = {
  findUserByEmail: jest.fn(),
  findUniqueUserByEmailIgnoreCase: jest.fn(),
  createPasswordResetToken: jest.fn(),
};

const mockEmailService = {
  sendPasswordResetEmail: jest.fn(),
  sendAdminCreatedUserEmail: jest.fn(),
  sendCitoyenActivationEmail: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
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
  jest.doMock('../../src/utils/logger.js', () => ({
    __esModule: true,
    default: mockLogger,
  }));
  return require('../../src/services/authService.js');
};

const GENERIC = 'Si un compte est associé à cette adresse, un lien de réinitialisation a été envoyé.';

describe('forgotPassword — le délai ne trahit pas l\'existence du compte', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    delete process.env.ALLOW_RESET_TOKEN_PREVIEW;
    mockRepository.createPasswordResetToken.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('un envoi SMTP qui ne se résout jamais ne bloque pas la réponse', async () => {
    // Promesse qui ne se résout jamais : c'est le cas d'un SMTP en panne lente.
    mockEmailService.sendPasswordResetEmail.mockImplementation(() => new Promise(() => {}));
    mockRepository.findUserByEmail.mockResolvedValue({ id_utilisateur: 1, email: 'existe@ecotrack.fr' });

    const { forgotPassword } = loadService();

    const pending = forgotPassword('existe@ecotrack.fr');

    // On avance le plancher de latence : la réponse doit partir sans attendre SMTP.
    await jest.advanceTimersByTimeAsync(2500);

    await expect(pending).resolves.toEqual({ message: GENERIC });
  });

  test('adresse connue et adresse inconnue répondent après le même délai', async () => {
    const { forgotPassword } = loadService();

    mockRepository.findUserByEmail.mockResolvedValue({ id_utilisateur: 1, email: 'existe@ecotrack.fr' });
    mockEmailService.sendPasswordResetEmail.mockImplementation(() => new Promise(() => {}));
    const knownStart = Date.now();
    const known = forgotPassword('existe@ecotrack.fr');

    mockRepository.findUserByEmail.mockResolvedValue(null);
    mockRepository.findUniqueUserByEmailIgnoreCase.mockResolvedValue(null);
    const unknownStart = Date.now();
    const unknown = forgotPassword('inconnu@ecotrack.fr');

    await jest.advanceTimersByTimeAsync(2500);
    const [knownResult, unknownResult] = await Promise.all([known, unknown]);

    expect(knownResult).toEqual({ message: GENERIC });
    expect(unknownResult).toEqual({ message: GENERIC });
    // Les deux ont attendu le plancher avant de répondre.
    expect(Date.now() - knownStart).toBeGreaterThanOrEqual(2000);
    expect(Date.now() - unknownStart).toBeGreaterThanOrEqual(2000);
  });

  test('un SMTP extrêmement lent n\'ajoute pas sa latence à la réponse', async () => {
    // 60 s de latence : sans fire-and-forget, la réponse attendrait 60 s.
    mockEmailService.sendPasswordResetEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 60000))
    );
    mockRepository.findUserByEmail.mockResolvedValue({ id_utilisateur: 1, email: 'existe@ecotrack.fr' });

    const { forgotPassword } = loadService();

    const started = Date.now();
    const pending = forgotPassword('existe@ecotrack.fr');
    await jest.advanceTimersByTimeAsync(2500);

    await expect(pending).resolves.toEqual({ message: GENERIC });
    // Bien en dessous des 60 s du SMTP : le travail continue en arrière-plan.
    expect(Date.now() - started).toBeLessThan(60000);
  });
});

describe('verifyTotp — aucun code dans les journaux, fenêtre bornée', () => {
  const originalEnv = process.env;

  let consoleSpies;
  let mfaService;
  let speakeasy;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    jest.resetModules();
    jest.doMock('../../src/utils/logger.js', () => ({
      __esModule: true,
      default: mockLogger,
    }));

    consoleSpies = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
    };

    mfaService = require('../../src/services/mfaService.js');
    speakeasy = require('speakeasy');
  });

  afterEach(() => {
    Object.values(consoleSpies).forEach((spy) => spy.mockRestore());
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const allConsoleOutput = () =>
    Object.values(consoleSpies)
      .flatMap((spy) => spy.mock.calls)
      .flat()
      .map((arg) => {
        try {
          return typeof arg === 'string' ? arg : JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' | ');

  const allLoggerOutput = () =>
    Object.values(mockLogger)
      .flatMap((fn) => fn.mock.calls)
      .flat()
      .map((arg) => {
        try {
          return typeof arg === 'string' ? arg : JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' | ');

  test('un code refusé ne journalise ni le code attendu ni le code reçu', () => {
    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    const wrongCode = '000000';
    const expectedCode = speakeasy.totp({ secret, encoding: 'base32' });

    const result = mfaService.verifyTotp(wrongCode, secret);

    expect(result).toBe(false);
    const output = `${allConsoleOutput()} | ${allLoggerOutput()}`;
    expect(output).not.toContain(wrongCode);
    expect(output).not.toContain(expectedCode);
    expect(output).not.toContain('Expected token');
    expect(output).not.toContain('Received token');
  });

  test('un code au mauvais format ne journalise pas le code reçu', () => {
    const secret = speakeasy.generateSecret({ length: 20 }).base32;

    expect(mfaService.verifyTotp('12ab34', secret)).toBe(false);
    expect(allConsoleOutput()).not.toContain('12ab34');
    expect(allLoggerOutput()).not.toContain('12ab34');
  });

  test('un jeton ou un secret absent ne journalise rien de sensible', () => {
    expect(mfaService.verifyTotp(null, 'SECRETBASE32')).toBe(false);
    expect(mfaService.verifyTotp('123456', null)).toBe(false);

    const output = allConsoleOutput();
    expect(output).not.toContain('SECRETBASE32');
    expect(output).not.toContain('123456');
  });

  test('accepte le code courant et un pas de décalage, refuse au-delà de ±1', () => {
    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    const now = Math.floor(Date.now() / 1000);
    const step = 30;

    const codeAt = (offsetSteps) =>
      speakeasy.totp({ secret, encoding: 'base32', time: now + offsetSteps * step });

    // Cale l'horloge de vérification sur la même fenêtre que la génération.
    jest.spyOn(Date, 'now').mockReturnValue(now * 1000);

    expect(mfaService.verifyTotp(codeAt(0), secret)).toBe(true);
    expect(mfaService.verifyTotp(codeAt(-1), secret)).toBe(true);
    expect(mfaService.verifyTotp(codeAt(1), secret)).toBe(true);
    expect(mfaService.verifyTotp(codeAt(-2), secret)).toBe(false);
    expect(mfaService.verifyTotp(codeAt(2), secret)).toBe(false);
    expect(mfaService.verifyTotp(codeAt(-4), secret)).toBe(false);
  });
});