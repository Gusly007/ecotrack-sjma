const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class ExcelService {
  /**
   * Générer un rapport Excel
   */
  static async generateReport(data, reportType = 'weekly') {
    try {
      const workbook = new ExcelJS.Workbook();
      
      workbook.creator = 'ECOTRACK';
      workbook.created = new Date();

      // Ajouter les feuilles selon le type de rapport
      await this._addSummarySheet(workbook, data);
      await this._addKPIsSheet(workbook, data.kpis || {});
      
      if (data.zones) {
        await this._addZonesSheet(workbook, data.zones);
      }
      
      if (data.routes) {
        await this._addRoutesSheet(workbook, data.routes);
      }

      const fileName = `report_excel_${reportType}_${Date.now()}.xlsx`;
      const filePath = path.join(process.env.REPORTS_DIR || './reports', fileName);
      
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await workbook.xlsx.writeFile(filePath);
      
      return {
        filePath,
        fileName,
        url: `/reports/${fileName}`,
        size: fs.statSync(filePath).size
      };
    } catch (error) {
      logger.error('Error generating Excel report:', error);
      throw error;
    }
  }

  /**
   * Feuille Résumé
   */
  static async _addSummarySheet(workbook, data) {
    const sheet = workbook.addWorksheet('Résumé', {
      properties: { tabColor: { argb: '6366F1' } }
    });

    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'ECOTRACK - Rapport d\'Analyse';
    titleCell.font = { size: 18, bold: true, color: { argb: '6366F1' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    const summaryData = [
      ['', ''],
      ['Période', data.period],
      ['Date génération', new Date().toLocaleString('fr-FR')],
      ['', ''],
      ['INDICATEURS PRINCIPAUX', ''],
      ['Tournées complétées', data.totalRoutes],
      ['Distance totale', `${data.totalDistance} km`],
      ['Taux débordement', `${data.overflowRate}%`],
      ['Économies', `${data.costSaved} €`],
      ['CO2 économisé', `${data.co2Saved} kg`]
    ];

    summaryData.forEach((row, index) => {
      const rowNum = index + 3;
      sheet.getRow(rowNum).values = row;
      
      if (row[0] === 'INDICATEURS PRINCIPAUX') {
        sheet.getRow(rowNum).font = { bold: true, size: 12 };
        sheet.getRow(rowNum).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E5E7EB' }
        };
      }
    });

    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 20;
  }

  /**
   * Feuille KPIs
   */
  static async _addKPIsSheet(workbook, kpis) {
    const sheet = workbook.addWorksheet('KPIs');

    const headers = ['Métrique', 'Valeur', 'Unité', 'Variation'];
    sheet.addRow(headers);
    
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '6366F1' }
    };

    // Données KPIs
    const kpiRows = Object.entries(kpis).map(([key, value]) => [
      key.replace(/_/g, ' ').toUpperCase(),
      value.current || value,
      value.unit || '',
      value.variation ? `${value.variation > 0 ? '+' : ''}${value.variation}%` : 'N/A'
    ]);

    kpiRows.forEach(row => sheet.addRow(row));

    sheet.columns.forEach((column, index) => {
      column.width = [30, 15, 10, 15][index];
    });
  }

  /**
   * Feuille Zones
   */
  static async _addZonesSheet(workbook, zones) {
    const sheet = workbook.addWorksheet('Zones');

    const headers = ['Zone', 'Conteneurs', 'Remplissage Moyen', 'Critiques', 'Signalements'];
    sheet.addRow(headers);
    
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '6366F1' }
    };

    zones.forEach(zone => {
      sheet.addRow([
        zone.name,
        zone.containersCount,
        `${zone.avgFillLevel}%`,
        zone.criticalCount,
        zone.reportsCount
      ]);
    });

    sheet.columns.forEach(column => column.width = 20);
  }

  /**
   * Feuille Tournées
   */
  static async _addRoutesSheet(workbook, routes) {
    const sheet = workbook.addWorksheet('Tournées');

    const headers = ['Code', 'Date', 'Agent', 'Distance (km)', 'Durée (min)', 'Statut'];
    sheet.addRow(headers);
    
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '6366F1' }
    };

    routes.forEach(route => {
      sheet.addRow([
        route.code,
        new Date(route.date).toLocaleDateString('fr-FR'),
        route.agentName,
        route.distance,
        route.duration,
        route.status
      ]);
    });

    sheet.columns.forEach(column => column.width = 15);
  }
}

module.exports = ExcelService;