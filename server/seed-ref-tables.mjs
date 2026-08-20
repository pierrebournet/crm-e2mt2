/**
 * Script de peuplement des tables de référence IMMOSIS / Connect'Immo
 * Sources : PDF sous-types V2, Nomenclature ZG, CSV gérants 2026, MDG 2026, captures Connect'Immo
 * Exécuter avec: npx tsx server/seed-ref-tables.mjs
 */
import { createConnection } from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname, port: parseInt(url.port) || 3306,
  user: url.username, password: url.password,
  database: url.pathname.slice(1), ssl: { rejectUnauthorized: false },
};

async function main() {
  const conn = await createConnection(config);
  console.log('Connected to database');

  // ============================================================
  // 1. ref_sous_types — 22 sous-types actifs
  // ============================================================
  console.log('\n--- Peuplement ref_sous_types ---');
  await conn.query('DELETE FROM ref_sous_types');
  const sousTypes = [
    { code: 'GE', libelle: 'Gros Entretiens', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Travaux de gros entretien HORS contrat E2MT. Travaux structurels, rénovation lourde, remise en état majeure.', bonnesPratiques: 'Réfection complète toiture, remplacement menuiseries extérieures, ravalement façade, reprise structure, rénovation sanitaires complète', mauvaisesPratiques: 'Travaux < 3500€ (→ PTP), travaux E2MT (→ GE_CMT), remplacement simple robinet (→ ML ou PTP)', sousTypeConnectImmo: 'Gros Entretiens', estActif: 1, estE2MT: 0, seuilMin: '3500.00', seuilMax: null },
    { code: 'GE_CMT', libelle: 'Gros Entretiens - par E2MT', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Travaux de gros entretien réalisés dans le cadre du contrat E2MT². Mêmes travaux que GE mais pilotés par le mainteneur E2MT.', bonnesPratiques: 'Idem GE mais travaux confiés au prestataire E2MT (EQUANS)', mauvaisesPratiques: 'Travaux hors périmètre E2MT, travaux < 3500€ (→ PTP_CMT)', sousTypeConnectImmo: 'Gros Entretiens - par E2MT', estActif: 1, estE2MT: 1, seuilMin: '3500.00', seuilMax: null },
    { code: 'PTP', libelle: 'Petits Travaux Propriétaires', familleZG: 'PTP', budgetImpacte: 'PTP', description: 'Petits travaux du propriétaire HORS contrat E2MT. Travaux ponctuels de faible montant (≤ 3500€ HT).', bonnesPratiques: 'Remplacement serrure, réparation fuite ponctuelle, remplacement luminaire, petite reprise peinture', mauvaisesPratiques: 'Travaux > 3500€ (→ GE), travaux E2MT (→ PTP_CMT), entretien locatif courant (→ ML)', sousTypeConnectImmo: 'Contrats Petits Travaux du Propriétaire', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: '3500.00' },
    { code: 'PTP_CMT', libelle: 'Petits Travaux Propriétaires - E2MT', familleZG: 'PTP', budgetImpacte: 'PTP', description: 'Petits travaux du propriétaire réalisés dans le cadre du contrat E2MT².', bonnesPratiques: 'Idem PTP mais travaux confiés au prestataire E2MT', mauvaisesPratiques: 'Travaux > 3500€ (→ GE_CMT), travaux hors périmètre E2MT', sousTypeConnectImmo: 'Petits Travaux Propriétaires - E2MT', estActif: 1, estE2MT: 1, seuilMin: null, seuilMax: '3500.00' },
    { code: 'CME', libelle: 'Contrats de Maintenance Externe', familleZG: 'CME', budgetImpacte: 'CME', description: 'Contrats de maintenance avec prestataires externes HORS E2MT. Contrats spécifiques (ascenseurs, SSI, CVC...).', bonnesPratiques: 'Contrat ascenseur, contrat SSI, contrat CVC, contrat portail automatique', mauvaisesPratiques: 'Contrat E2MT (→ CME_CMT), travaux ponctuels (→ GE ou PTP)', sousTypeConnectImmo: 'Contrats de Maintenance Externe', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'CME_CMT', libelle: 'Contrats de Maintenance Externe - E2MT', familleZG: 'CME', budgetImpacte: 'CME', description: 'Forfait maintenance multitechnique E2MT². Le contrat E2MT² lui-même.', bonnesPratiques: 'Forfait annuel E2MT, maintenance préventive E2MT, astreinte E2MT', mauvaisesPratiques: 'Contrats hors E2MT (→ CME), travaux ponctuels (→ GE_CMT ou PTP_CMT)', sousTypeConnectImmo: 'Contrats de Maintenance Externe - E2MT', estActif: 1, estE2MT: 1, seuilMin: null, seuilMax: null },
    { code: 'ML', libelle: 'Maintenance Locative', familleZG: 'ML', budgetImpacte: 'ML', description: 'Entretien locatif courant à la charge du locataire/occupant. Entretien courant, petites réparations d\'usage. ⚠️ NE PAS CONFONDRE AVEC TL (Travaux Locatifs).', bonnesPratiques: 'Remplacement ampoule, nettoyage, débouchage, remplacement joint, entretien courant, petite réparation usage', mauvaisesPratiques: '⚠️ Travaux locatifs structurels (→ TL), gros entretien (→ GE), travaux propriétaire (→ PTP)', sousTypeConnectImmo: 'Maintenance Locative', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'TL', libelle: 'Travaux Locatifs', familleZG: 'TL', budgetImpacte: 'TL', description: 'Travaux locatifs à la charge du locataire/occupant. Travaux plus importants que ML : remise en état des locaux, aménagements locatifs. ⚠️ NE PAS CONFONDRE AVEC ML (Maintenance Locative).', bonnesPratiques: 'Remise en état des locaux avant/après occupation, peinture complète, remplacement revêtement sol, aménagement bureau', mauvaisesPratiques: '⚠️ Entretien courant (→ ML), travaux propriétaire (→ GE ou PTP)', sousTypeConnectImmo: 'Travaux Locatifs', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'VRE', libelle: 'Vérifications Réglementaires Énergie Électrique', familleZG: 'EE_MPS', budgetImpacte: 'EE_MPS', description: 'Visites et vérifications réglementaires des installations électriques.', bonnesPratiques: 'Vérification annuelle installations électriques, contrôle conformité, rapport organisme agréé', mauvaisesPratiques: 'Travaux de mise en conformité (→ MEC_EE), visite non réglementaire (→ VTR NR)', sousTypeConnectImmo: 'Visite réglementaire énergie électrique', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'MEC_EE', libelle: 'Mise en Conformité Énergie Électrique', familleZG: 'EE_MPS', budgetImpacte: 'EE_MPS', description: 'Travaux de mise en conformité des installations électriques suite à rapport de vérification.', bonnesPratiques: 'Levée de réserves électriques, mise aux normes tableau, remplacement disjoncteur non conforme', mauvaisesPratiques: 'Vérification seule (→ VRE), travaux non liés à conformité électrique (→ GE)', sousTypeConnectImmo: 'Mise en conformité énergie électrique', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'MEE_MPS', libelle: 'Maintenance Élargie Énergie Électrique', familleZG: 'EE_MPS', budgetImpacte: 'EE_MPS', description: 'Maintenance élargie des installations électriques MPS (Mise en Place de Sécurité).', bonnesPratiques: 'Maintenance préventive installations électriques, remplacement composants vétustes', mauvaisesPratiques: 'Mise en conformité (→ MEC_EE), vérification réglementaire (→ VRE)', sousTypeConnectImmo: 'Maintenance Elargie Energie Electrique', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'EE_MPS', libelle: 'Énergie Électrique MPS', familleZG: 'EE_MPS', budgetImpacte: 'EE_MPS', description: 'Dépenses liées à l\'énergie électrique et MPS non classées ailleurs.', bonnesPratiques: 'Consommation électrique, abonnements, compteurs', mauvaisesPratiques: 'Travaux électriques (→ MEC_EE ou GE)', sousTypeConnectImmo: 'Energie Electrique MPS', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'MEC_RAU', libelle: 'Mise en Conformité Réglementaire Autre', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Travaux de mise en conformité réglementaire hors énergie électrique (incendie, accessibilité, amiante...).', bonnesPratiques: 'Mise aux normes incendie, mise en accessibilité PMR, désamiantage réglementaire', mauvaisesPratiques: 'Mise en conformité électrique (→ MEC_EE), travaux non réglementaires (→ GE)', sousTypeConnectImmo: 'Mise en conformité réglementaire autre', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'VTR NR', libelle: 'Visite Technique Audit Étude (hors réglementaire)', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Visites techniques, audits et études non réglementaires.', bonnesPratiques: 'Diagnostic technique, audit énergétique, étude faisabilité, expertise structure', mauvaisesPratiques: 'Visite réglementaire (→ VRE ou VTR PR), visite de gestion (→ VTR VG)', sousTypeConnectImmo: 'Visite tech audit étude (hors réglementaire et VG)', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'VTR PR', libelle: 'Vérifications Réglementaires', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Vérifications réglementaires obligatoires (hors énergie électrique).', bonnesPratiques: 'Vérification SSI, contrôle ascenseur, vérification légionelle, contrôle amiante', mauvaisesPratiques: 'Vérification électrique (→ VRE), visite non réglementaire (→ VTR NR)', sousTypeConnectImmo: 'Vérifications Réglementaires', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'VTR VG', libelle: 'Visites de Gestion', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Visites de gestion du patrimoine immobilier.', bonnesPratiques: 'Visite annuelle bâtiment, état des lieux, inspection patrimoine', mauvaisesPratiques: 'Visite réglementaire (→ VTR PR), audit technique (→ VTR NR)', sousTypeConnectImmo: 'Visites de Gestion', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'VTR ACC DIAG', libelle: 'Accompagnement Diagnostic', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Accompagnement et assistance pour diagnostics immobiliers.', bonnesPratiques: 'Accompagnement diagnostic amiante, accompagnement DPE', mauvaisesPratiques: 'Diagnostic lui-même (→ VTR NR), travaux suite diagnostic (→ GE ou MEC_RAU)', sousTypeConnectImmo: 'Accompagnement diagnostic', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'VTR GBNC', libelle: 'Visite Technique Bâtiment Non Courant', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Visites techniques spécifiques aux bâtiments non courants (ouvrages d\'art, tunnels, passerelles...).', bonnesPratiques: 'Inspection ouvrage art, visite tunnel, contrôle passerelle', mauvaisesPratiques: 'Visite bâtiment courant (→ VTR VG ou VTR NR)', sousTypeConnectImmo: 'Visite tech audit étude (hors réglementaire et VG)', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'DEC_SEL', libelle: 'Déconstructions Sélectives', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Démolitions et déconstructions sélectives de bâtiments.', bonnesPratiques: 'Démolition bâtiment vétuste, déconstruction sélective avec tri déchets', mauvaisesPratiques: 'Simple suppression équipement (→ GE)', sousTypeConnectImmo: 'Déconstructions Sélectives SNCF', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'DIAG_AMI', libelle: 'Diagnostic Amiante', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Diagnostics amiante obligatoires avant travaux ou périodiques.', bonnesPratiques: 'DTA, diagnostic avant travaux, repérage amiante', mauvaisesPratiques: 'Travaux de désamiantage (→ TVX_DESAM), accompagnement diagnostic (→ VTR ACC DIAG)', sousTypeConnectImmo: 'Diagnostic Amiante', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'TVX_DESAM', libelle: 'Travaux de Désamiantage', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Travaux de retrait ou encapsulage d\'amiante.', bonnesPratiques: 'Retrait amiante, encapsulage, confinement zone amiantée', mauvaisesPratiques: 'Diagnostic seul (→ DIAG_AMI), travaux sans amiante (→ GE)', sousTypeConnectImmo: 'Travaux de Désamiantage', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
    { code: 'ECO_DECARB', libelle: 'Économies d\'énergie, décarbonation', familleZG: 'AM_VR_TVX_A3.2', budgetImpacte: 'GE', description: 'Travaux liés aux économies d\'énergie et à la décarbonation.', bonnesPratiques: 'Isolation thermique, remplacement chaudière par PAC, LED, GTB', mauvaisesPratiques: 'Travaux sans objectif énergétique (→ GE)', sousTypeConnectImmo: 'Economies d\'énergie, décarbonation', estActif: 1, estE2MT: 0, seuilMin: null, seuilMax: null },
  ];

  for (const st of sousTypes) {
    await conn.query(
      `INSERT INTO ref_sous_types (code, libelle, famille_zg, budget_impacte, description, bonnes_pratiques, mauvaises_pratiques, sous_type_connect_immo, est_actif, est_e2mt, seuil_montant_min, seuil_montant_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [st.code, st.libelle, st.familleZG, st.budgetImpacte, st.description, st.bonnesPratiques, st.mauvaisesPratiques, st.sousTypeConnectImmo, st.estActif, st.estE2MT, st.seuilMin, st.seuilMax]
    );
  }
  console.log(`Inséré ${sousTypes.length} sous-types`);

  // ============================================================
  // 2. ref_natures_travaux — codes 83xx-89xx
  // ============================================================
  console.log('\n--- Peuplement ref_natures_travaux ---');
  await conn.query('DELETE FROM ref_natures_travaux');
  const natures = [
    { code: '8301', libelle: 'Assainissement Voierie Réseau Divers, déchet, eau', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,MEC_RAU', description: 'VRD, assainissement, réseaux enterrés, gestion eaux' },
    { code: '8302', libelle: 'Installation hydraulique', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,CME,CME_CMT', description: 'Installations hydrauliques, pompes, réseaux hydrauliques' },
    { code: '8303', libelle: 'Plomberie sanitaire', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,ML,TL,CME_CMT', description: 'Plomberie, sanitaires, robinetterie, évacuations' },
    { code: '8311', libelle: 'Distribution HTetMT - Postes de livr./transf.', sousTypesCompatibles: 'GE,MEC_EE,VRE,EE_MPS,MEE_MPS', description: 'Distribution haute et moyenne tension, postes de transformation' },
    { code: '8312', libelle: 'Eclairage et installations électriques BT', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,ML,TL,CME_CMT,MEC_EE,VRE', description: 'Éclairage, prises, tableaux électriques basse tension' },
    { code: '8313', libelle: 'Courant faible (téléphonie, automatisme, GTB?)', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,CME,CME_CMT', description: 'Courants faibles, téléphonie, automatismes, GTB, contrôle accès' },
    { code: '8320', libelle: 'Installations chauffage, ventil. climatisation', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,ML,CME,CME_CMT,ECO_DECARB', description: 'CVC : chauffage, ventilation, climatisation, PAC' },
    { code: '8330', libelle: 'Accessibilité (Asc, escalier mécanique?) élévateur', sousTypesCompatibles: 'GE,CME,MEC_RAU', description: 'Ascenseurs, escaliers mécaniques, élévateurs, mise en accessibilité PMR' },
    { code: '8341', libelle: 'Equipements de sécurité incendie', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,CME,CME_CMT,MEC_RAU,VTR PR', description: 'SSI, détection incendie, extincteurs, désenfumage, sprinklers' },
    { code: '8342', libelle: 'Vidéosurveillance, gardiennage, sécurisation', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,CME,CME_CMT', description: 'Vidéosurveillance, contrôle accès, sécurisation, gardiennage' },
    { code: '8350', libelle: 'Audits et Etudes Energétiques', sousTypesCompatibles: 'VTR NR,VTR PR,ECO_DECARB', description: 'DPE, audits énergétiques, études thermiques' },
    { code: '8410', libelle: 'Espaces extérieurs dont élagage, abattage', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,ML,CME_CMT', description: 'Espaces verts, élagage, abattage, clôtures, voiries' },
    { code: '8420', libelle: 'Entretien quais voyageurs', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,ML', description: 'Entretien et réparation des quais voyageurs' },
    { code: '8430', libelle: 'Abris de quai et mobilier scellé', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT', description: 'Abris voyageurs, mobilier urbain scellé sur quais' },
    { code: '8501', libelle: 'Structure', sousTypesCompatibles: 'GE,GE_CMT,MEC_RAU,DEC_SEL', description: 'Structure porteuse, fondations, murs porteurs, poteaux, poutres' },
    { code: '8502', libelle: 'Clos', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,MEC_RAU', description: 'Menuiseries extérieures, façades, ravalement, étanchéité murs' },
    { code: '8503', libelle: 'Couvert', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,MEC_RAU', description: 'Toiture, charpente, étanchéité toiture, zinguerie, gouttières' },
    { code: '8510', libelle: 'Aménagements intérieurs', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,ML,TL', description: 'Cloisons, faux plafonds, revêtements sols/murs, peinture, menuiseries intérieures' },
    { code: '8550', libelle: 'Interventions anti-graffiti', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,ML,CME_CMT', description: 'Nettoyage et protection anti-graffiti' },
    { code: '8560', libelle: 'Interventions anti-vandalisme', sousTypesCompatibles: 'GE,GE_CMT,PTP,PTP_CMT,ML,CME_CMT', description: 'Réparations suite vandalisme, protection anti-vandalisme' },
    { code: '8600', libelle: 'Petits Travaux Propriétaire', sousTypesCompatibles: 'PTP,PTP_CMT', description: 'Petits travaux divers du propriétaire, multi-corps d\'état' },
    { code: '8610', libelle: 'Maintenance multitechniques - forfait E2MT', sousTypesCompatibles: 'CME_CMT', description: 'Forfait de maintenance multitechnique du contrat E2MT²' },
    { code: '8700', libelle: 'Visite de surveillance, contrôle, diag., étude', sousTypesCompatibles: 'VTR NR,VTR PR,VTR VG,VTR ACC DIAG,VTR GBNC,VRE,DIAG_AMI', description: 'Visites, contrôles, diagnostics, études techniques' },
    { code: '8800', libelle: 'Démolitions - suppressions bâtiments équipements', sousTypesCompatibles: 'DEC_SEL,GE', description: 'Démolitions, déconstructions, suppressions' },
    { code: '8900', libelle: 'Réhabilitation globale', sousTypesCompatibles: 'GE', description: 'Réhabilitation complète d\'un bâtiment, multi-lots' },
  ];

  for (const n of natures) {
    await conn.query(
      `INSERT INTO ref_natures_travaux (code, libelle, sous_types_compatibles, description) VALUES (?, ?, ?, ?)`,
      [n.code, n.libelle, n.sousTypesCompatibles, n.description]
    );
  }
  console.log(`Inséré ${natures.length} natures de travaux`);

  // ============================================================
  // 3. ref_gerants_programme — Gérants valides
  // ============================================================
  console.log('\n--- Peuplement ref_gerants_programme ---');
  await conn.query('DELETE FROM ref_gerants_programme');
  const gerants = [
    { nom: 'AUTRE VOYAGEURS', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'C32', sa: 'SA_FRET', bd: 'FRET TRANSPORTS LOGISTIQUE', bupo: '67858', portefeuille: 'INDUSTRIEL' },
    { nom: 'COMBUSTIBLE', sa: 'SA_SNCF', bd: 'SNCF', bupo: '67858', portefeuille: 'INDUSTRIEL' },
    { nom: 'DI POUR RH L', sa: 'SA_SNCF', bd: 'EC RH LOGEMENT', bupo: '67858', portefeuille: 'SOCIAL' },
    { nom: 'DI POUR RH/IST', sa: 'SA_SNCF', bd: 'RH IST 13405 02133 02451', bupo: '67858', portefeuille: 'SOCIAL' },
    { nom: 'FRET ISM', sa: 'SA_FRET', bd: 'FRET TRANSPORTS LOGISTIQUE', bupo: '67858', portefeuille: 'INDUSTRIEL' },
    { nom: 'HEXAFRET', sa: 'SA_FRET', bd: 'FRET TRANSPORTS LOGISTIQUE', bupo: '67858', portefeuille: 'INDUSTRIEL' },
    { nom: 'HORS ISM TER', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'HORS ISM TGV', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'ISM INTERCITE', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'ISM TER OCCITANIE', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'ISM TER PROVENCE ALPES COTE D AZUR', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'ISM TGV AXE ATLANTIQUE', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'ISM TGV AXE SUD EST', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'MAINTENANCE LOCATIVE INDUSTRIEL ET FERROVIAIRE', sa: 'SA_DI', bd: 'DIRECTION DE L\'IMMOBILIER', bupo: null, portefeuille: 'INDUSTRIEL' },
    { nom: 'MAINTENANCE LOCATIVE TERTIAIRE ET SOCIAL', sa: 'SA_DI', bd: 'DIRECTION DE L\'IMMOBILIER', bupo: null, portefeuille: 'TERTIAIRE' },
    { nom: 'MAINTENANCE SUD AZUR', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'MATERIEL AUTRES', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'MATERIEL ISM', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'MATERIEL TI NEVERS LANGUEDOC', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: 'INDUSTRIEL' },
    { nom: 'OPTIM SERVICES', sa: 'SA_DI', bd: 'DIRECTION DE L\'IMMOBILIER', bupo: null, portefeuille: null, remarques: 'Ex GIE. TOUJOURS 100% Direction de l\'Immobilier, que les dépenses soient locatives ou propriétaires.' },
    { nom: 'RESEAU FERROVIAIRE', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', bupo: '00077', portefeuille: 'FERROVIAIRE' },
    { nom: 'RESEAU INDUSTRIEL', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', bupo: '00077', portefeuille: 'INDUSTRIEL' },
    { nom: 'RESEAU SOCIAL', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', bupo: '00077', portefeuille: 'SOCIAL' },
    { nom: 'RESEAU TERTIAIRE', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', bupo: '00077', portefeuille: 'TERTIAIRE' },
    { nom: 'RESEAU TRAVAUX A LA DEMANDE', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', bupo: '00077', portefeuille: null },
    { nom: 'TECHNIS', sa: 'SA_FRET', bd: 'FRET TRANSPORTS LOGISTIQUE', bupo: '67858', portefeuille: 'INDUSTRIEL' },
    { nom: 'TRACTION', sa: 'SA_SNCF', bd: 'SNCF', bupo: '67858', portefeuille: 'INDUSTRIEL' },
    { nom: 'VOYAGEURS TRAVAUX A LA DEMANDE', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', bupo: '05335', portefeuille: null },
  ];

  for (const g of gerants) {
    await conn.query(
      `INSERT INTO ref_gerants_programme (nom, sa, bd_proprietaire, code_bupo, portefeuille, remarques) VALUES (?, ?, ?, ?, ?, ?)`,
      [g.nom, g.sa, g.bd, g.bupo, g.portefeuille, g.remarques || null]
    );
  }
  console.log(`Inséré ${gerants.length} gérants de programme`);

  // ============================================================
  // 4. ref_ventilation_bd — Règles gérant → SA → B/D
  // ============================================================
  console.log('\n--- Peuplement ref_ventilation_bd ---');
  await conn.query('DELETE FROM ref_ventilation_bd');
  const ventilations = [
    // SA VOYAGEURS
    { gerant: 'ISM TER OCCITANIE', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'ISM TER PROVENCE ALPES COTE D AZUR', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'ISM TGV AXE ATLANTIQUE', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'ISM TGV AXE SUD EST', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'AUTRE VOYAGEURS', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'HORS ISM TER', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'HORS ISM TGV', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'ISM INTERCITE', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'MAINTENANCE SUD AZUR', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'MATERIEL AUTRES', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'MATERIEL ISM', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'MATERIEL TI NEVERS LANGUEDOC', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    { gerant: 'VOYAGEURS TRAVAUX A LA DEMANDE', sa: 'SA_VOYAGEURS', bd: 'SNCF VOYAGEURS', pct: 100, bupo: '05335' },
    // SA RESEAU
    { gerant: 'RESEAU FERROVIAIRE', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', pct: 100, bupo: '00077' },
    { gerant: 'RESEAU INDUSTRIEL', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', pct: 100, bupo: '00077' },
    { gerant: 'RESEAU SOCIAL', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', pct: 100, bupo: '00077' },
    { gerant: 'RESEAU TERTIAIRE', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', pct: 100, bupo: '00077' },
    { gerant: 'RESEAU TRAVAUX A LA DEMANDE', sa: 'SA_RESEAU', bd: 'SNCF RESEAU', pct: 100, bupo: '00077' },
    // SA FRET
    { gerant: 'HEXAFRET', sa: 'SA_FRET', bd: 'FRET TRANSPORTS LOGISTIQUE', pct: 100, bupo: '67858' },
    { gerant: 'FRET ISM', sa: 'SA_FRET', bd: 'FRET TRANSPORTS LOGISTIQUE', pct: 100, bupo: '67858' },
    { gerant: 'C32', sa: 'SA_FRET', bd: 'FRET TRANSPORTS LOGISTIQUE', pct: 100, bupo: '67858' },
    { gerant: 'TECHNIS', sa: 'SA_FRET', bd: 'FRET TRANSPORTS LOGISTIQUE', pct: 100, bupo: '67858' },
    // SA SNCF
    { gerant: 'COMBUSTIBLE', sa: 'SA_SNCF', bd: 'SNCF', pct: 100, bupo: '67858' },
    { gerant: 'TRACTION', sa: 'SA_SNCF', bd: 'SNCF', pct: 100, bupo: '67858' },
    { gerant: 'DI POUR RH L', sa: 'SA_SNCF', bd: 'EC RH LOGEMENT', pct: 100, bupo: '67858', remarques: 'Logement patrimoine' },
    { gerant: 'DI POUR RH/IST', sa: 'SA_SNCF', bd: 'RH IST 13405 02133 02451', pct: 100, bupo: '67858', remarques: 'Installations sociales' },
    // DI
    { gerant: 'OPTIM SERVICES', sa: 'SA_DI', bd: 'DIRECTION DE L\'IMMOBILIER', pct: 100, bupo: null, remarques: 'Ex GIE. TOUJOURS 100% Direction de l\'Immobilier' },
    { gerant: 'MAINTENANCE LOCATIVE INDUSTRIEL ET FERROVIAIRE', sa: 'SA_DI', bd: 'DIRECTION DE L\'IMMOBILIER', pct: 100, bupo: null },
    { gerant: 'MAINTENANCE LOCATIVE TERTIAIRE ET SOCIAL', sa: 'SA_DI', bd: 'DIRECTION DE L\'IMMOBILIER', pct: 100, bupo: null },
  ];

  for (const v of ventilations) {
    await conn.query(
      `INSERT INTO ref_ventilation_bd (gerant, sa, bd_proprietaire, pourcentage, code_bupo, remarques) VALUES (?, ?, ?, ?, ?, ?)`,
      [v.gerant, v.sa, v.bd, v.pct, v.bupo, v.remarques || null]
    );
  }
  console.log(`Inséré ${ventilations.length} règles de ventilation B/D`);

  // ============================================================
  // 5. ref_correspondance_connect_immo
  // ============================================================
  console.log('\n--- Peuplement ref_correspondance_connect_immo ---');
  await conn.query('DELETE FROM ref_correspondance_connect_immo');
  const correspondances = [
    { immosis: 'GE', connectImmo: 'Gros Entretiens', origine: 'Gestionnaire' },
    { immosis: 'GE_CMT', connectImmo: 'Gros Entretiens - par E2MT', origine: 'Mainteneur' },
    { immosis: 'PTP', connectImmo: 'Contrats Petits Travaux du Propriétaire', origine: 'Gestionnaire' },
    { immosis: 'PTP_CMT', connectImmo: 'Petits Travaux Propriétaires - E2MT', origine: 'Mainteneur' },
    { immosis: 'CME', connectImmo: 'Contrats de Maintenance Externe', origine: 'Gestionnaire' },
    { immosis: 'CME_CMT', connectImmo: 'Contrats de Maintenance Externe - E2MT', origine: 'Mainteneur' },
    { immosis: 'ML', connectImmo: 'Maintenance Locative', origine: 'Gestionnaire' },
    { immosis: 'TL', connectImmo: 'Travaux Locatifs', origine: 'Gestionnaire' },
    { immosis: 'VRE', connectImmo: 'Visite réglementaire énergie électrique', origine: 'Gestionnaire' },
    { immosis: 'MEC_EE', connectImmo: 'Mise en conformité énergie électrique', origine: 'Gestionnaire' },
    { immosis: 'MEE_MPS', connectImmo: 'Maintenance Elargie Energie Electrique', origine: 'Gestionnaire' },
    { immosis: 'EE_MPS', connectImmo: 'Energie Electrique MPS', origine: 'Gestionnaire' },
    { immosis: 'MEC_RAU', connectImmo: 'Mise en conformité réglementaire autre', origine: 'Gestionnaire' },
    { immosis: 'VTR NR', connectImmo: 'Visite tech audit étude (hors réglementaire et VG)', origine: 'Gestionnaire' },
    { immosis: 'VTR PR', connectImmo: 'Vérifications Réglementaires', origine: 'Gestionnaire' },
    { immosis: 'VTR VG', connectImmo: 'Visites de Gestion', origine: 'Gestionnaire' },
    { immosis: 'VTR ACC DIAG', connectImmo: 'Accompagnement diagnostic', origine: 'Gestionnaire' },
    { immosis: 'VTR GBNC', connectImmo: 'Visite tech audit étude (hors réglementaire et VG)', origine: 'Gestionnaire', remarques: 'Bâtiments non courants uniquement' },
    { immosis: 'DEC_SEL', connectImmo: 'Déconstructions Sélectives SNCF', origine: 'Gestionnaire' },
    { immosis: 'DIAG_AMI', connectImmo: 'Diagnostic Amiante', origine: 'Gestionnaire' },
    { immosis: 'TVX_DESAM', connectImmo: 'Travaux de Désamiantage', origine: 'Gestionnaire' },
    { immosis: 'ECO_DECARB', connectImmo: 'Economies d\'énergie, décarbonation', origine: 'Gestionnaire' },
  ];

  for (const c of correspondances) {
    await conn.query(
      `INSERT INTO ref_correspondance_connect_immo (sous_type_immosis, sous_type_connect_immo, origine_connect_immo, remarques) VALUES (?, ?, ?, ?)`,
      [c.immosis, c.connectImmo, c.origine, c.remarques || null]
    );
  }
  console.log(`Inséré ${correspondances.length} correspondances`);

  console.log('\n✅ Toutes les tables de référence ont été peuplées avec succès !');
  await conn.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
