import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'ecotrack_user',
  password: 'ecotrack_password',
  host: 'localhost',
  port: 5435,
  database: 'ecotrack'
});

async function findZonesWithContainers() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT z.id_zone, z.code, z.nom, COUNT(c.id_conteneur) as nb_conteneurs
      FROM zone z
      LEFT JOIN conteneur c ON z.id_zone = c.id_zone
      GROUP BY z.id_zone, z.code, z.nom
      HAVING COUNT(c.id_conteneur) > 0
      ORDER BY nb_conteneurs DESC
    `);
    
    console.log('✅ Zones avec conteneurs:\n');
    console.table(result.rows);
    
    if (result.rows.length === 0) {
      console.log('❌ Aucune zone n\'a de conteneurs! Les conteneurs doivent être créés via le seed 007_conteneurs_demo.sql');
    }
    
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await client.end();
  }
}

findZonesWithContainers();
