describe('emailService', () => {
  const baseEnv = {
    smtp: {
      host: 'smtp.test.local',
      port: 2525,
      secure: false,
      user: 'user',
      pass: 'pass',
      from: 'noreply@test.local',
    },
    appUrl: 'https://app.test.local',
  };

  const buildNodemailerMock = () => {
    const sendMail = jest.fn();
    const createTransport = jest.fn(() => ({ sendMail }));
    const createTestAccount = jest.fn(async () => ({ user: 'ethereal-user', pass: 'ethereal-pass' }));
    const getTestMessageUrl = jest.fn(() => 'https://preview.local/msg');

    return {
      __esModule: true,
      default: {
        createTransport,
        createTestAccount,
        getTestMessageUrl,
      },
      _mock: {
        sendMail,
        createTransport,
        createTestAccount,
        getTestMessageUrl,
      },
    };
  };

  const loadService = async (envOverride) => {
    jest.resetModules();

    const nodemailerMock = buildNodemailerMock();

    jest.doMock('../../src/config/env.js', () => ({
      __esModule: true,
      default: { ...baseEnv, ...envOverride },
    }));

    jest.doMock('../../src/services/emailTemplates.js', () => ({
      __esModule: true,
      getPasswordResetHtml: jest.fn(() => '<html>reset</html>'),
      getWelcomeHtml: jest.fn(() => '<html>welcome</html>'),
      getAdminCreatedUserHtml: jest.fn(() => '<html>admin-created</html>'),
      getAccountStatusHtml: jest.fn(() => '<html>status</html>'),
      getRoleChangeHtml: jest.fn(() => '<html>role</html>'),
      getAccountDeletedHtml: jest.fn(() => '<html>deleted</html>'),
    }));

    jest.doMock('nodemailer', () => nodemailerMock);

    const service = await import('../../src/services/emailService.js');
    return { service, nodemailerMock: nodemailerMock._mock };
  };

  it('initializes transporter with configured SMTP and sends emails', async () => {
    const { service, nodemailerMock } = await loadService({});
    nodemailerMock.sendMail.mockResolvedValue({ messageId: '1' });

    const result = await service.sendEmail('user@test.local', 'Subject', '<h1>Hello</h1>');

    expect(nodemailerMock.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.test.local',
      port: 2525,
      auth: { user: 'user', pass: 'pass' },
    }));
    expect(nodemailerMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@test.local',
      subject: 'Subject',
      html: '<h1>Hello</h1>',
    }));
    expect(result).toEqual({ success: true, previewUrl: 'https://preview.local/msg' });
  });

  it('falls back to ethereal when smtp credentials are missing', async () => {
    const { service, nodemailerMock } = await loadService({
      smtp: {
        host: '',
        port: 587,
        secure: false,
        user: '',
        pass: '',
        from: '',
      },
    });

    nodemailerMock.sendMail.mockResolvedValue({ messageId: '2' });
    await service.sendEmail('eth@test.local', 'Hi', '<p>x</p>');

    expect(nodemailerMock.createTestAccount).toHaveBeenCalled();
    expect(nodemailerMock.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
    }));
  });

  it('returns error object when send fails', async () => {
    const { service, nodemailerMock } = await loadService({});
    const err = new Error('smtp failed');
    err.code = 'ECONNRESET';
    nodemailerMock.sendMail.mockRejectedValue(err);

    const result = await service.sendEmail('user@test.local', 'Subject', '<h1>Hello</h1>');

    expect(result).toEqual({ success: false, error: 'smtp failed' });
  });

  it('wrapper methods delegate to sendEmail', async () => {
    const { service, nodemailerMock } = await loadService({});
    nodemailerMock.sendMail.mockResolvedValue({ messageId: 'x' });

    await service.sendPasswordResetEmail('a@test.local', 'token');
    await service.sendWelcomeEmail('b@test.local', 'Nora');
    await service.sendAdminCreatedUserEmail('c@test.local', 'Nora', 'Dupont', 'ADMIN', 'Temp123');
    await service.sendAccountStatusEmail('d@test.local', 'Nora', true);
    await service.sendAccountStatusEmail('d@test.local', 'Nora', false);
    await service.sendRoleChangeEmail('e@test.local', 'Nora', 'CITOYEN', 'ADMIN');
    await service.sendAccountDeletedEmail('f@test.local', 'Nora');

    expect(nodemailerMock.sendMail).toHaveBeenCalledTimes(7);
    expect(nodemailerMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@test.local', subject: 'Réinitialisation de votre mot de passe - EcoTrack', html: '<html>reset</html>' }));
    expect(nodemailerMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'b@test.local', subject: 'Bienvenue sur EcoTrack !', html: '<html>welcome</html>' }));
    expect(nodemailerMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'c@test.local', subject: 'Votre compte EcoTrack a été créé', html: '<html>admin-created</html>' }));
    expect(nodemailerMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'd@test.local', subject: 'Votre compte EcoTrack a été activé', html: '<html>status</html>' }));
    expect(nodemailerMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'd@test.local', subject: 'Votre compte EcoTrack a été désactivé', html: '<html>status</html>' }));
    expect(nodemailerMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'e@test.local', subject: 'Votre rôle EcoTrack a été modifié', html: '<html>role</html>' }));
    expect(nodemailerMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'f@test.local', subject: 'Votre compte EcoTrack a été supprimé', html: '<html>deleted</html>' }));
  });
});
