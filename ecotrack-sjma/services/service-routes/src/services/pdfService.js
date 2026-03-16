const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  /**
   * Génère une feuille de route PDF pour une tournée
   */
  static async generateRouteSheet(tournee, etapes, agent, vehicule) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `feuille_route_${tournee.id_tournee}_${Date.now()}.pdf`;
        const filePath = path.join(process.env.REPORTS_DIR || './reports', fileName);

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

        this._generateRouteSheetContent(doc, {
          tournee,
          etapes,
          agent,
          vehicule
        });
        
        doc.end();

        stream.on('finish', () => {
          const resolvedFilePath = path.resolve(filePath);
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
   * Génère le contenu de la feuille de route
   */
  static _generateRouteSheetContent(doc, data) {
    const { tournee, etapes, agent, vehicule } = data;
    
    doc
      .fontSize(20)
      .fillColor('#10B981')
      .text('ECOTRACK', { align: 'center' })
      .fontSize(14)
      .fillColor('#000')
      .text('Feuille de Route - Tournée de Collecte', { align: 'center' })
      .fontSize(10)
      .fillColor('#666')
      .text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' })
      .moveDown(2);

    doc
      .fontSize(12)
      .fillColor('#000')
      .text('Informations de la Tournée', { underline: true })
      .moveDown(0.5);

    const tourneeInfo = [
      { label: 'Code:', value: tournee.code || `TOURNEE-${tournee.id_tournee}` },
      { label: 'Date:', value: new Date(tournee.date_tournee).toLocaleDateString('fr-FR') },
      { label: 'Statut:', value: tournee.statut },
      { label: 'Distance prévue:', value: `${tournee.distance_prevue_km || 0} km` },
      { label: 'Durée prévue:', value: `${tournee.duree_prevue_min || 0} minutes` }
    ];

    tourneeInfo.forEach(info => {
      doc.fontSize(10).fillColor('#333').text(`${info.label} `, { continued: true })
         .fillColor('#000').text(info.value);
    });

    doc.moveDown(1.5);

    if (agent) {
      doc
        .fontSize(12)
        .fillColor('#000')
        .text('Agent', { underline: true })
        .fontSize(10)
        .fillColor('#333')
        .text(`Nom: ${agent.prenom} ${agent.nom}`)
        .text(`Email: ${agent.email}`)
        .moveDown(1);
    }

    if (vehicule) {
      doc
        .fontSize(12)
        .fillColor('#000')
        .text('Véhicule', { underline: true })
        .fontSize(10)
        .fillColor('#333')
        .text(`Immatriculation: ${vehicule.numero_immatriculation}`)
        .text(`Modèle: ${vehicule.modele}`)
        .text(`Capacité: ${vehicule.capacite_kg} kg`)
        .moveDown(2);
    }

    doc
      .fontSize(12)
      .fillColor('#000')
      .text('Itinéraire', { underline: true })
      .moveDown(0.5);

    const headerY = doc.y;
    doc.fontSize(10).fillColor('#666');
    doc.text('#', 50, headerY, { width: 30 });
    doc.text('Conteneur', 80, headerY, { width: 100 });
    doc.text('Adresse', 180, headerY, { width: 200 });
    doc.text('Ordre', 380, headerY, { width: 50 });
    doc.text('Statut', 430, headerY, { width: 80 });
    
    doc.moveDown(0.5);
    
    etapes.forEach((etape, index) => {
      const y = doc.y;
      doc.fontSize(9).fillColor('#333');
      
      doc.text(`${index + 1}`, 50, y, { width: 30 });
      doc.text(etape.uid_conteneur || `CNT-${etape.id_conteneur}`, 80, y, { width: 100 });
      
      const address = etape.adresse || `Zone ${etape.id_zone || '-'}`;
      doc.text(address.substring(0, 40), 180, y, { width: 200 });
      doc.text(`${etape.sequence || index + 1}`, 380, y, { width: 50 });
      doc.text(etape.collectee ? 'Collecté' : 'À collecter', 430, y, { width: 80 });
      
      doc.moveDown(0.3);
    });

    doc.moveDown(2);

    doc
      .fontSize(12)
      .fillColor('#000')
      .text('Résumé', { underline: true })
      .moveDown(0.5);

    const totalCollected = etapes.filter(e => e.collectee).length;
    const totalPending = etapes.filter(e => !e.collectee).length;
    
    doc.fontSize(10).fillColor('#333');
    doc.text(`Total conteneurs: ${etapes.length}`);
    doc.text(`Collectés: ${totalCollected}`);
    doc.text(`En attente: ${totalPending}`);

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor('#666')
      .text('Signature agent: _________________________', 50, doc.page.height - 100)
      .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 350, doc.page.height - 100);
  }
}

module.exports = PDFService;
