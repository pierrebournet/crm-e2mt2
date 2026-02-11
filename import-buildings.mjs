import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const CSV_PATH = '/home/ubuntu/crm-e2mt2/bacs-import.csv';

async function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  
  // Skip header lines (lines 0, 1, 2 are headers)
  // Data starts at line 3 (index 3)
  const dataLines = lines.slice(3);
  
  console.log(`Found ${dataLines.length} data lines to process`);
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get lot 4.1 (Occitanie) ID
  const [lots] = await connection.execute("SELECT id, code FROM lots WHERE code = '4.1'");
  if (lots.length === 0) {
    console.error("Lot 4.1 (Occitanie) not found in database!");
    process.exit(1);
  }
  const lotId = lots[0].id;
  console.log(`Using lot 4.1 (Occitanie) with ID: ${lotId}`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const line of dataLines) {
    const cols = line.split(';');
    
    // CSV columns:
    // 0: region SNCF
    // 1: UT-BAT (code)
    // 2: m² bat (surface)
    // 3: Portefeuille
    // 4: DESCRIPTION UT (site name)
    // 5: BIEN (description)
    // 6: Puissance Cumulée (KW)
    // 7: Type BACS
    // 8: Zone E2MT
    // 9: Libelle proprietaire juridique
    // 10: Libelle proprietaire interne
    // 11: Libelle statut juridique
    // 12: Libelle perimetre
    // 13: Libelle nature de bien
    // 14: Libelle destination de bien
    // 15: Libelle code emploi
    // 16: Entite Regionale
    // 17: Code departement
    // 18: Libelle departement
    // 19: Date Debut Existence du Bien
    // 20: Pérénité en année du batiment
    // 21-26: suivi
    // 27: commentaires
    // 28: Colonne1 (full reference)
    
    const code = (cols[1] || '').trim();
    const surfaceStr = (cols[2] || '').trim().replace(/\s/g, '');
    const portfolioRaw = (cols[3] || '').trim().toUpperCase();
    const siteName = (cols[4] || '').trim();
    const bien = (cols[5] || '').trim();
    const department = (cols[18] || '').trim();
    const departmentCode = (cols[17] || '').trim();
    const proprietaire = (cols[9] || '').trim();
    const destination = (cols[14] || '').trim();
    const comments = (cols[27] || '').trim();
    
    if (!code) {
      skipped++;
      continue;
    }
    
    // Map portfolio
    let portfolio;
    if (portfolioRaw === 'INDUSTRIEL') portfolio = 'Industriel';
    else if (portfolioRaw === 'FERROVIAIRE') portfolio = 'Ferroviaire';
    else if (portfolioRaw === 'GARES' || portfolioRaw.includes('GARE')) portfolio = 'Gares';
    else if (portfolioRaw === 'TERTIAIRE') portfolio = 'Tertiaire';
    else if (portfolioRaw === 'SOCIAL') portfolio = 'Social';
    else portfolio = 'Ferroviaire'; // default
    
    // Build name: site + bien description
    let name = siteName;
    if (bien && bien !== code) {
      name = `${siteName} - ${bien}`;
    }
    name = name.replace(/\s+/g, ' ').trim();
    if (name.length > 200) name = name.substring(0, 197) + '...';
    
    // Surface
    const surface = surfaceStr ? parseFloat(surfaceStr) : null;
    
    // Build address from department info
    let address = '';
    if (department && departmentCode) {
      address = `${department} (${departmentCode})`;
    }
    
    // Build description with extra info
    const descParts = [];
    if (proprietaire) descParts.push(`Propriétaire: ${proprietaire}`);
    if (destination) descParts.push(`Destination: ${destination}`);
    if (comments) descParts.push(`Notes: ${comments}`);
    const description = descParts.join(' | ') || null;
    
    try {
      // Check if building with this code already exists
      const [existing] = await connection.execute(
        "SELECT id FROM buildings WHERE code = ?", [code]
      );
      
      if (existing.length > 0) {
        console.log(`  Skipping ${code} (already exists)`);
        skipped++;
        continue;
      }
      
      await connection.execute(
        `INSERT INTO buildings (name, code, lotId, portfolio, address, surface, description, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [name, code, lotId, portfolio, address || null, surface, description]
      );
      
      imported++;
      console.log(`  ✓ Imported: ${code} - ${name} (${portfolio}, ${surface || '?'}m²)`);
    } catch (err) {
      errors++;
      console.error(`  ✗ Error importing ${code}: ${err.message}`);
    }
  }
  
  console.log(`\n=== Import Summary ===`);
  console.log(`Total lines: ${dataLines.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  await connection.end();
}

main().catch(console.error);
