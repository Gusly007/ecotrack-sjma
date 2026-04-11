jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-1' })
  }))
}));

jest.mock('../../../src/utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

const nodemailer = require('nodemailer');
const logger = require('../../../src/utils/logger');
const EmailService = require('../../../src/services/emailService');

describe('EmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'from@test.com';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('sendReport returns skipped when SMTP not configured', async () => {
    delete process.env.SMTP_USER;
    const service = new EmailService();
    await expect(service.sendReport({ fileName: 'r.pdf', filePath: '/tmp/r.pdf' }, ['a@test.com'])).resolves.toEqual({ sent: false, reason: 'SMTP not configured' });
    expect(logger.warn).toHaveBeenCalled();
  });

  test('sendReport sends mail with attachment and subject', async () => {
    const service = new EmailService();
    const result = await service.sendReport({ fileName: 'r.pdf', filePath: '/tmp/r.pdf' }, ['a@test.com', 'b@test.com'], 'weekly');

    expect(result).toEqual({ sent: true, messageId: 'msg-1' });
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(service.transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'from@test.com',
      to: 'a@test.com, b@test.com',
      subject: expect.stringContaining('Rapport Hebdomadaire'),
      attachments: expect.arrayContaining([expect.objectContaining({ filename: 'r.pdf' })])
    }));
  });

  test('_getSubject and _getHtmlBody support branches', () => {
    const service = new EmailService();
    expect(service._getSubject('daily')).toContain('Rapport Quotidien');
    expect(service._getSubject('monthly')).toContain('Rapport Mensuel');
    expect(service._getSubject('other')).toContain('Rapport');
    expect(service._getHtmlBody('weekly')).toContain('hebdomadaire');
  });
});



