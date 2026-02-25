const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const DateUtils = require('../utils/dateUtils');
const logger = require('../utils/logger');

class PDFService {
  /**
   * Générer un rapport PDF
   */
  static async generateReport(data, reportType = 'daily') {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `report_${reportType}_${Date.now()}.pdf`;
        const filePath = path.join(process.env.REPORTS_DIR || './reports', fileName);

        // Créer le dossier si nécessaire
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const doc = new PDFDocument({ 
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Génération du contenu selon le type
        switch(reportType) {
          case 'daily':
            this._generateDailyReport(doc, data);
            break;
          case 'weekly':
            this._generateWeeklyReport(doc, data);
            break;
          case 'monthly':
            this._generateMonthlyReport(doc, data);
            break;
          default:
            this._generateDailyReport(doc, data);
        }
        
        doc.end();

        stream.on('finish', () => {
          // Validate file path to prevent file inclusion attacks
          const reportsDir = path.resolve(process.env.REPORTS_DIR || './reports');
          const resolvedFilePath = path.resolve(filePath);
          if (!resolvedFilePath.startsWith(reportsDir)) {
            return reject(new Error('Invalid file path'));
          }
          resolve({
            filePath,
            fileName,
            url: `/reports/${fileName}`,
            size: fs.statSync(resolvedFilePath).size
          });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Rapport quotidien (agents)
   */
  static _generateDailyReport(doc, data) {
    // En-tête
    doc
      .fontSize(24)
      .fillColor('#6366F1')
      .text('ECOTRACK', { align: 'center' })
      .fontSize(16)
      .fillColor('#000')
      .text('Rapport Quotidien', { align: 'center' })
      .fontSize(10)
      .fillColor('#666')
      .text(`${DateUtils.formatDate(new Date())}`, { align: 'center' })
      .moveDown(2);

    // Résumé de la journée
    doc
      .fontSize(14)
      .fillColor('#000')
      .text('Résumé de la Journée', { underline: true })
      .moveDown(0.5);

    const dailyStats = [
      { label: 'Tournées complétées', value: data.completedRoutes || 0 },
      { label: 'Conteneurs collectés', value: data.containersCollected || 0 },
      { label: 'Distance parcourue', value: `${data.totalDistance || 0} km` },
      { label: 'Signalements traités', value: data.resolvedReports || 0 },
      { label: 'Conteneurs critiques', value: data.criticalContainers || 0 }
    ];

    dailyStats.forEach(stat => {
      doc
        .fontSize(10)
        .fillColor('#000')
        .text(`${stat.label}:`, 70, doc.y, { continued: true })
        .fillColor('#6366F1')
        .text(` ${stat.value}`, { align: 'left' });
    });

    doc.moveDown(1.5);

    // Tournées du jour
    if (data.routes && data.routes.length > 0) {
      doc
        .fontSize(14)
        .fillColor('#000')
        .text('Tournées Effectuées', { underline: true })
        .moveDown(0.5);

      data.routes.forEach((route, index) => {
        doc
          .fontSize(9)
          .fillColor('#000')
          .text(`${index + 1}. ${route.code}`, 70)
          .fontSize(8)
          .fillColor('#666')
          .text(`   Agent: ${route.agentName}`, 80)
          .text(`   Distance: ${route.distance} km | Durée: ${route.duration} min`, 80)
          .moveDown(0.3);
      });
    }

    // Pied de page
    this._addFooter(doc);
  }

  /**
   * Rapport hebdomadaire (gestionnaires)
   */
  static _generateWeeklyReport(doc, data) {
    doc
      .fontSize(24)
      .fillColor('#6366F1')
      .text('ECOTRACK', { align: 'center' })
      .fontSize(16)
      .fillColor('#000')
      .text('Rapport Hebdomadaire', { align: 'center' })
      .fontSize(10)
      .fillColor('#666')
      .text(`Semaine du ${data.period}`, { align: 'center' })
      .moveDown(2);

    // KPIs de la semaine
    doc
      .fontSize(14)
      .text('Indicateurs Clés', { underline: true })
      .moveDown(0.5);

    const weeklyKPIs = [
      { label: 'Tournées complétées', value: data.totalRoutes },
      { label: 'Distance totale', value: `${data.totalDistance} km` },
      { label: 'Économies réalisées', value: `${data.costSaved} €` },
      { label: 'CO2 économisé', value: `${data.co2Saved} kg` },
      { label: 'Taux débordement', value: `${data.overflowRate}%` },
      { label: 'Signalements', value: `${data.totalReports} (${data.resolvedRate}% résolus)` }
    ];

    weeklyKPIs.forEach(kpi => {
      doc
        .fontSize(10)
        .fillColor('#000')
        .text(`${kpi.label}:`, 70, doc.y, { continued: true })
        .fillColor('#6366F1')
        .text(` ${kpi.value}`, { align: 'left' });
    });

    doc.moveDown(1.5);

    // Performance par zone
    if (data.zones && data.zones.length > 0) {
      doc
        .fontSize(14)
        .fillColor('#000')
        .text('Performance par Zone', { underline: true })
        .moveDown(0.5);

      data.zones.forEach(zone => {
        doc
          .fontSize(9)
          .fillColor('#000')
          .text(`${zone.name}:`, 70, doc.y, { continued: true })
          .fillColor('#666')
          .text(` ${zone.containersCount} conteneurs, taux moyen: ${zone.avgFillLevel}%`);
      });
    }

    this._addFooter(doc);
  }

  /**
   * Rapport mensuel (direction)
   */
  static _generateMonthlyReport(doc, data) {
    doc
      .fontSize(24)
      .fillColor('#6366F1')
      .text('ECOTRACK', { align: 'center' })
      .fontSize(16)
      .fillColor('#000')
      .text('Rapport Mensuel Exécutif', { align: 'center' })
      .fontSize(10)
      .fillColor('#666')
      .text(`${data.period}`, { align: 'center' })
      .moveDown(2);

    // Synthèse exécutive
    doc
      .fontSize(14)
      .fillColor('#000')
      .text('Synthèse Exécutive', { underline: true })
      .moveDown(0.5)
      .fontSize(10)
      .text(
        `Le mois écoulé a enregistré ${data.totalRoutes} tournées complétées, ` +
        `parcourant ${data.totalDistance} km avec une réduction de ${data.distanceReduction}% ` +
        `par rapport au mois précédent. Le taux de débordement s'établit à ${data.overflowRate}%, ` +
        `${data.overflowRate < 2 ? 'dans les objectifs fixés' : 'nécessitant une attention particulière'}.`
      )
      .moveDown(1.5);

    // Objectifs stratégiques
    doc
      .fontSize(14)
      .text('Atteinte des Objectifs', { underline: true })
      .moveDown(0.5);

    const objectives = [
      { 
        label: 'Optimisation tournées', 
        target: '-20%', 
        actual: `${data.distanceReduction}%`,
        status: data.distanceReduction >= 20 ? '✓' : '✗'
      },
      { 
        label: 'Taux débordements', 
        target: '<2%', 
        actual: `${data.overflowRate}%`,
        status: data.overflowRate < 2 ? '✓' : '✗'
      },
      { 
        label: 'Réduction CO2', 
        target: '-18%', 
        actual: `${data.co2Reduction}%`,
        status: data.co2Reduction >= 18 ? '✓' : '✗'
      }
    ];

    objectives.forEach(obj => {
      const color = obj.status === '✓' ? '#10B981' : '#EF4444';
      doc
        .fontSize(10)
        .fillColor('#000')
        .text(`${obj.label}:`, 70, doc.y, { continued: true })
        .text(` Cible ${obj.target}, Réalisé ${obj.actual} `, { continued: true })
        .fillColor(color)
        .text(obj.status);
    });

    doc.moveDown(1.5);

    // Recommandations
    if (data.recommendations && data.recommendations.length > 0) {
      doc
        .fontSize(14)
        .fillColor('#000')
        .text('Recommandations', { underline: true })
        .moveDown(0.5);

      data.recommendations.forEach((rec, index) => {
        doc
          .fontSize(9)
          .text(`${index + 1}. ${rec}`, 70)
          .moveDown(0.3);
      });
    }

    this._addFooter(doc);
  }

  /**
   * Pied de page standard
   */
  static _addFooter(doc) {
    doc
      .fontSize(8)
      .fillColor('#999')
      .text(
        'ECOTRACK - Plateforme Intelligente de Gestion des Déchets',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
  }
}

module.exports = PDFService;