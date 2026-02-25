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
      { label: 'Tournées complétées', value: data.totalRoutes || data.completedRoutes || 0 },
      { label: 'Distance totale', value: `${data.totalDistance || 0} km` },
      { label: 'Conteneurs collectés', value: data.containersCollected || 0 },
      { label: 'Conteneurs critiques', value: data.criticalContainers || 0 }
    ];

    weeklyKPIs.forEach(kpi => {
      doc
        .fontSize(10)
        .fillColor('#000')
        .text(`${kpi.label}:`, 70, doc.y, { continued: true })
        .fillColor('#6366F1')
        .text(` ${kpi.value}`, { align: 'left' });
    });

    doc.moveDown(1);

    // Impact Environnemental (DORA)
    doc
      .fontSize(14)
      .fillColor('#10B981')
      .text('Impact Environnemental', { underline: true })
      .moveDown(0.5);

    const envKPIs = [
      { label: 'Coûts économisés', value: `${data.costSaved || 0} €` },
      { label: 'CO2 économisé', value: `${data.co2Saved || 0} kg` },
      { label: 'Carburant économisé', value: `${data.fuelSaved || 0} L` },
      { label: 'Réduction distance', value: `${data.distanceReduction || 0}%` },
      { label: 'Équivalent arbres', value: `${data.treesEquivalent || 0} arbres` },
      { label: 'Équivalent km voiture', value: `${data.carKmEquivalent || 0} km` }
    ];

    envKPIs.forEach(kpi => {
      doc
        .fontSize(10)
        .fillColor('#000')
        .text(`${kpi.label}:`, 70, doc.y, { continued: true })
        .fillColor('#10B981')
        .text(` ${kpi.value}`, { align: 'left' });
    });

    doc.moveDown(1);

    // Détails coûts
    if (data.fuelCost || data.laborCost || data.maintenanceCost) {
      doc
        .fontSize(12)
        .fillColor('#666')
        .text('Détail des économies:', { underline: true })
        .moveDown(0.3);
      
      const costDetails = [
        { label: 'Carburant', value: `${data.fuelCost || 0} €` },
        { label: 'Main d\'œuvre', value: `${data.laborCost || 0} €` },
        { label: 'Maintenance', value: `${data.maintenanceCost || 0} €` }
      ];
      
      costDetails.forEach(cost => {
        doc
          .fontSize(9)
          .fillColor('#000')
          .text(`${cost.label}:`, 80, doc.y, { continued: true })
          .fillColor('#666')
          .text(` ${cost.value}`, { align: 'left' });
      });
    }

    doc.moveDown(1.5);

    // Performance par zone
    if (data.zones && data.zones.length > 0) {
      doc
        .fontSize(14)
        .fillColor('#000')
        .text('Performance par Zone', { underline: true })
        .moveDown(0.5);

      data.zones.forEach(zone => {
        const name = zone.zone_name || zone.properties?.name || 'Zone';
        const count = zone.containers_count || zone.containersCount || 0;
        const avg = zone.avg_fill_level || zone.properties?.avgFillLevel || 0;
        doc
          .fontSize(9)
          .fillColor('#000')
          .text(`${name}:`, 70, doc.y, { continued: true })
          .fillColor('#666')
          .text(` ${count} conteneurs, taux moyen: ${avg}%`);
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
   * Rapport d'Impact Environnemental
   */
  static async generateEnvironmentalReport(data, period = 'week') {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `environmental_${period}_${Date.now()}.pdf`;
        const filePath = path.join(process.env.REPORTS_DIR || './reports', fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24).fillColor('#10B981').text('ECOTRACK', { align: 'center' })
           .fontSize(18).fillColor('#000').text('Analyse Environnementale', { align: 'center' })
           .fontSize(10).fillColor('#666').text(`Période: ${data.period}`, { align: 'center' }).moveDown(2);

        // Impact CO2
        doc.fontSize(14).fillColor('#10B981').text('Impact CO2', { underline: true }).moveDown(0.5);
        const co2 = data.environmental?.co2 || {};
        const co2Data = [
          { label: 'CO2 économisé', value: `${co2.saved || 0} kg` },
          { label: 'Réduction', value: `${co2.reductionPct || 0}%` },
          { label: 'Équivalent arbres', value: `${co2.equivalents?.trees || 0} arbres` },
          { label: 'Équivalent km voiture', value: `${co2.equivalents?.carKm || 0} km` }
        ];
        co2Data.forEach(item => {
          doc.fontSize(11).fillColor('#000').text(`${item.label}:`, { continued: true }).fillColor('#10B981').text(` ${item.value}`).moveDown(0.3);
        });

        doc.moveDown(1);

        // Fuel
        doc.fontSize(14).fillColor('#10B981').text('Carburant', { underline: true }).moveDown(0.5);
        const fuel = data.environmental?.fuel || {};
        doc.fontSize(11).fillColor('#000').text(`Carburant économisé:`, { continued: true }).fillColor('#10B981').text(` ${fuel.saved || 0} L`).moveDown(1);

        // Coûts
        doc.fontSize(14).fillColor('#10B981').text('Économies', { underline: true }).moveDown(0.5);
        const costs = data.environmental?.costs || {};
        const costData = [
          { label: 'Total économisé', value: `${costs.total || 0} €` },
          { label: 'Carburant', value: `${costs.fuel || 0} €` },
          { label: 'Main d\'œuvre', value: `${costs.labor || 0} €` },
          { label: 'Maintenance', value: `${costs.maintenance || 0} €` }
        ];
        costData.forEach(item => {
          doc.fontSize(11).fillColor('#000').text(`${item.label}:`, { continued: true }).fillColor('#10B981').text(` ${item.value}`).moveDown(0.3);
        });

        doc.moveDown(1);

        // Distance
        doc.fontSize(14).fillColor('#10B981').text('Distance', { underline: true }).moveDown(0.5);
        const distance = data.environmental?.distance || {};
        doc.fontSize(11).fillColor('#000').text(`Distance prévue: ${distance.planned || 0} km`).moveDown(0.3)
           .text(`Distance réelle: ${distance.actual || 0} km`).moveDown(0.3)
           .text(`Distance économisée: ${distance.saved || 0} km (${distance.reductionPct || 0}%)`).moveDown(1);

        // Recommandations
        if (data.recommendations?.length > 0) {
          doc.fontSize(14).fillColor('#000').text('Recommandations', { underline: true }).moveDown(0.5);
          data.recommendations.forEach((rec, i) => {
            doc.fontSize(10).text(`${i + 1}. ${rec}`).moveDown(0.3);
          });
        }

        this._addFooter(doc);
        doc.end();
        stream.on('finish', () => resolve({ filePath, fileName, url: `/reports/${fileName}`, size: fs.statSync(filePath).size }));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Rapport de Performance des Tournées
   */
  static async generateRoutesPerformanceReport(data, period = 'week') {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `routes_performance_${period}_${Date.now()}.pdf`;
        const filePath = path.join(process.env.REPORTS_DIR || './reports', fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24).fillColor('#6366F1').text('ECOTRACK', { align: 'center' })
           .fontSize(18).fillColor('#000').text('Performance des Tournées', { align: 'center' })
           .fontSize(10).fillColor('#666').text(`Période: ${data.period}`, { align: 'center' }).moveDown(2);

        // Routes
        doc.fontSize(14).fillColor('#6366F1').text('Statistiques des Tournées', { underline: true }).moveDown(0.5);
        const routes = data.environmental?.routes || {};
        const routesData = [
          { label: 'Tournées complétées', value: routes.completed || 0 },
          { label: 'Tournées totales', value: routes.total || 0 },
          { label: 'Conteneurs collectés', value: data.environmental?.containers?.collected || 0 }
        ];
        routesData.forEach(item => {
          doc.fontSize(11).fillColor('#000').text(`${item.label}:`, { continued: true }).fillColor('#6366F1').text(` ${item.value}`).moveDown(0.3);
        });

        doc.moveDown(1);

        // Agents
        doc.fontSize(14).fillColor('#6366F1').text('Performance des Agents', { underline: true }).moveDown(0.5);
        const agents = data.agents || {};
        doc.fontSize(11).fillColor('#000').text(`Nombre d'agents: ${agents.totalAgents || 0}`).moveDown(0.3)
           .text(`Taux de réussite moyen: ${agents.averageSuccessRate || 0}%`).moveDown(0.3)
           .text(`Taux de complétion: ${agents.completionRate || 0}%`).moveDown(1);

        // Top performer
        if (agents.topPerformer) {
          doc.fontSize(12).fillColor('#10B981').text('Meilleur Agent:', { underline: true }).moveDown(0.3);
          doc.fontSize(11).fillColor('#000').text(`Nom: ${agents.topPerformer.prenom} ${agents.topPerformer.nom}`).moveDown(0.3)
             .text(`Score: ${agents.topPerformer.overall_score}%`).moveDown(0.3)
             .text(`Tournées complétées: ${agents.topPerformer.completed_routes}`).moveDown(1);
        }

        // Recommandations
        if (data.recommendations?.length > 0) {
          doc.fontSize(14).fillColor('#000').text('Recommandations', { underline: true }).moveDown(0.5);
          data.recommendations.forEach((rec, i) => {
            doc.fontSize(10).text(`${i + 1}. ${rec}`).moveDown(0.3);
          });
        }

        this._addFooter(doc);
        doc.end();
        stream.on('finish', () => resolve({ filePath, fileName, url: `/reports/${fileName}`, size: fs.statSync(filePath).size }));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Pied de page standard - ajouté après le contenu principal
   */
  static _addFooter(doc) {
    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor('#999')
      .text(
        'ECOTRACK - Plateforme Intelligente de Gestion des Déchets',
        50,
        doc.y,
        { align: 'center' }
      );
  }
}

module.exports = PDFService;