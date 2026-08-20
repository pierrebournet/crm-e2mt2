/**
 * Script d'import de l'inventaire UT-BAT avec gérants de programme
 * Exécuter avec: node server/import-inventaire.mjs
 */
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
};

async function main() {
  const conn = await createConnection(config);
  console.log('Connected to database');

  // Read CSV
  const csv = readFileSync('/home/ubuntu/upload/inventaire.csv', 'latin1');
  const lines = csv.split('\n');
  
  // Skip header lines (first 2)
  const dataLines = lines.slice(2);
  console.log(`Total lines to process: ${dataLines.length}`);
  
  // Prepare batch insert
  const BATCH_SIZE = 500;
  let inserted = 0;
  let batch = [];
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = line.split(';');
    if (cols.length < 14) continue;
    
    const codeGerant = cols[0].trim();
    const nomGerant = cols[3].trim();
    const codeUt = cols[6].trim();
    const utBat = cols[7].trim();
    const libelleUt = cols[8].trim();
    const codeBatiment = cols[9].trim();
    const libelleBatiment = cols[10].trim();
    const portefeuille = cols[11].trim();
    const proprietaireInterne = cols[13].trim();
    
    // Skip empty rows
    if (!codeUt || !utBat || !nomGerant) continue;
    
    batch.push([
      codeUt.substring(0, 20),
      utBat.substring(0, 30),
      libelleUt.substring(0, 200),
      codeBatiment.substring(0, 20),
      libelleBatiment.substring(0, 200) || null,
      portefeuille.substring(0, 100) || null,
      nomGerant.substring(0, 200),
      codeGerant.substring(0, 100) || null,
      proprietaireInterne.substring(0, 200) || null,
    ]);
    
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(conn, batch);
      inserted += batch.length;
      process.stdout.write(`\rInserted: ${inserted}`);
      batch = [];
    }
  }
  
  // Insert remaining
  if (batch.length > 0) {
    await insertBatch(conn, batch);
    inserted += batch.length;
  }
  
  console.log(`\nDone! Total inserted: ${inserted}`);
  await conn.end();
}

async function insertBatch(conn, batch) {
  const sql = `INSERT INTO inventaire_utbat (code_ut, ut_bat, libelle_ut, code_batiment, libelle_batiment, portefeuille, nom_gerant, code_gerant, proprietaire_interne) VALUES ?`;
  await conn.query(sql, [batch]);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
