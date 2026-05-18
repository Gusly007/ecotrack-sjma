import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'ecotrack_user',
  password: 'ecotrack_password',
  host: 'localhost',
  port: 5435,
  database: 'ecotrack'
});

async function diagnosticData() {
  try {
    await client.connect();
    
    console.log('🔍 DIAGNOSTIC DES DONNÉES\n');
    
    // Vérifier les zones
    const zones = await client.query(`SELECT id_zone, code, nom FROM zone LIMIT 5`);
    console.log('Zones disponibles:', zones.rows.length);
    
    // Vérifier les conteneurs par zone
    for (const zone of zones.rows) {
      const conteneurs = await client.query(
        `SELECT COUNT(*) FROM conteneur WHERE id_zone = $1`,
        [zone.id_zone]
      );
      console.log(`  Zone ${zone.code}: ${conteneurs.rows[0].count} conteneurs`);
    }
    
    // Vérifier les étapes manquantes
    const manquantes = await client.query(`
      SELECT t.code, t.id_zone, z.code as zone_code, 
             COUNT(e.id_etape) as nb_etapes,
             (SELECT COUNT(*) FROM conteneur WHERE id_zone = t.id_zone) as nb_conteneurs
      FROM tournee t
      JOIN zone z ON t.id_zone = z.id_zone
      LEFT JOIN etape_tournee e ON t.id_tournee = e.id_tournee
      WHERE t.code LIKE 'T-PROGRESS-%' OR t.code LIKE 'T-PLANIF-%'
      GROUP BY t.code, t.id_zone, z.code
      ORDER BY t.code
    `);
    
    console.log('\n📌 État des tournées et étapes:');
    console.table(manquantes.rows);
    
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await client.end();
  }
}

diagnosticData();
