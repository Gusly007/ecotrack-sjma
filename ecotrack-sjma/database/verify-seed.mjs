import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'ecotrack_user',
  password: 'ecotrack_password',
  host: 'localhost',
  port: 5435,
  database: 'ecotrack'
});

async function verifyData() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM tournee WHERE code LIKE 'T-PROGRESS-%' AND statut = 'EN_COURS') as tournees_progress,
        (SELECT COUNT(*) FROM tournee WHERE code LIKE 'T-PLANIF-%' AND statut = 'PLANIFIEE') as tournees_planifiees,
        (SELECT COUNT(*) FROM etape_tournee) as total_etapes,
        (SELECT COUNT(*) FROM collecte) as total_collectes,
        (SELECT COUNT(*) FROM gamification_participation_defi) as defis_en_progression
    `);
    
    console.log('✅ Vérification des données insérées:\n');
    console.table(result.rows[0]);
    
    // Détails des tournées
    const tournees = await client.query(`
      SELECT code, statut, distance_prevue_km, duree_prevue_min, 
             (SELECT COUNT(*) FROM etape_tournee WHERE id_tournee = tournee.id_tournee AND collectee = TRUE) as conteneurs_collectes,
             (SELECT COUNT(*) FROM etape_tournee WHERE id_tournee = tournee.id_tournee) as total_conteneurs
      FROM tournee 
      WHERE code LIKE 'T-PROGRESS-%'
      ORDER BY code
    `);
    
    console.log('\n📍 Détails des tournées en cours:\n');
    console.table(tournees.rows);
    
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await client.end();
  }
}

verifyData();
