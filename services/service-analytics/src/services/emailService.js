const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.from = process.env.SMTP_FROM || 'ecotrack@ingetis.fr';
  }

  /**
   * Envoyer un rapport par email
   */
  async sendReport(report, recipients, reportType = 'weekly') {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('Email not configured, skipping send');
        return { sent: false, reason: 'SMTP not configured' };
      }

      const subject = this._getSubject(reportType);
      const html = this._getHtmlBody(reportType);

      const attachments = [{
        filename: report.fileName,
        path: report.filePath,
        contentType: report.fileName.endsWith('.pdf') 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }];

      const info = await this.transporter.sendMail({
        from: this.from,
        to: recipients.join(', '),
        subject,
        html,
        attachments
      });

      logger.info(`Report sent to ${recipients.join(', ')}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Obtenir le sujet selon le type de rapport
   */
  _getSubject(reportType) {
    const date = new Date().toLocaleDateString('fr-FR');
    switch (reportType) {
      case 'daily':
        return `[ECOTRACK] Rapport Quotidien - ${date}`;
      case 'weekly':
        return `[ECOTRACK] Rapport Hebdomadaire - ${date}`;
      case 'monthly':
        return `[ECOTRACK] Rapport Mensuel - ${date}`;
      default:
        return `[ECOTRACK] Rapport - ${date}`;
    }
  }

  /**
   * Obtenir le corps HTML du message
   */
  _getHtmlBody(reportType) {
    const typeLabels = {
      daily: 'quotidien',
      weekly: 'hebdomadaire',
      monthly: 'mensuel'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6366F1; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ECOTRACK</h1>
              <p>Rapport ${typeLabels[reportType] || reportType}</p>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Veuillez trouver ci-joint le rapport ${typeLabels[reportType] || reportType} généré par ECOTRACK.</p>
              <p>Ce rapport contient les données et analyses relatives à la gestion des conteneurs et des tournées.</p>
              <p>Vous pouvez également télécharger ce rapport depuis la plateforme ECOTRACK.</p>
            </div>
            <div class="footer">
              <p>© 2024 ECOTRACK - Plateforme Intelligente de Gestion des Déchets</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = EmailService;
