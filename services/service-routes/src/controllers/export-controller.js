const TourneeService = require('../services/tournee-service');
const TourneeRepository = require('../repositories/tournee-repository');
const CollecteRepository = require('../repositories/collecte-repository');
const { pool } = require('../db/connexion');
const PDFService = require('../services/pdfService');
const logger = require('../utils/logger');

const tourneeRepo = new TourneeRepository(pool);
const collecteRepo = new CollecteRepository(pool);
const tourneeServiceInstance = new TourneeService(tourneeRepo, collecteRepo);

class ExportController {
  /**
   * GET /tournees/:id/pdf
   * Génère une feuille de route PDF
   */
  static async generatePDF(req, res, next) {
    try {
      const { id } = req.params;
      
      const tournee = await tourneeServiceInstance.getTourneeById(id);
      if (!tournee) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'Tournée introuvable'
        });
      }

      const etapes = await tourneeServiceInstance.getTourneeEtapes(id);
      
      const agent = tournee.agent || null;
      const vehicule = tournee.vehicule || null;

      const pdf = await PDFService.generateRouteSheet(tournee, etapes, agent, vehicule);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdf.fileName}"`);
      
      const fs = require('fs');
      const fileStream = fs.createReadStream(pdf.filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      logger.error({ error: error.message }, 'Error generating PDF');
      res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Erreur lors de la génération du PDF'
      });
    }
  }

  /**
   * GET /tournees/:id/map
   * Retourne les données GeoJSON pour affichage carte
   */
  static async getMapData(req, res, next) {
    try {
      const { id } = req.params;
      
      const tournee = await tourneeServiceInstance.getTourneeById(id);
      if (!tournee) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'Tournée introuvable'
        });
      }

      const etapes = await tourneeServiceInstance.getTourneeEtapes(id);

      const features = etapes.map((etape, index) => ({
        type: 'Feature',
        properties: {
          id_conteneur: etape.id_conteneur,
          uid_conteneur: etape.uid_conteneur,
          sequence: etape.sequence || index + 1,
          collectee: etape.collectee || false,
          adresse: etape.adresse || `Zone ${etape.id_zone}`,
          niveau_remplissage: etape.niveau_remplissage_pct || null
        },
        geometry: {
          type: 'Point',
          coordinates: [
            etape.longitude || 0,
            etape.latitude || 0
          ]
        }
      }));

      const geojson = {
        type: 'FeatureCollection',
        features
      };

      res.json({
        success: true,
        statusCode: 200,
        data: {
          tournee: {
            id_tournee: tournee.id_tournee,
            code: tournee.code,
            statut: tournee.statut,
            date_tournee: tournee.date_tournee,
            distance_prevue_km: tournee.distance_prevue_km,
            duree_prevue_min: tournee.duree_prevue_min
          },
          agent: tournee.agent,
          vehicule: tournee.vehicule,
          geojson
        }
      });

    } catch (error) {
      logger.error({ error: error.message, stack: error.stack }, 'Error getting map data');
      res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Erreur lors de la récupération des données cartographiques',
        details: error.message
      });
    }
  }
}

module.exports = ExportController;
