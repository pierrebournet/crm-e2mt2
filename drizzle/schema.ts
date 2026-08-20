import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Lots géographiques (18 lots E2MT²)
 */
export const lots = mysqlTable("lots", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lot = typeof lots.$inferSelect;

/**
 * Types de travaux (C1a à C14)
 */
export const workTypes = mysqlTable("work_types", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkType = typeof workTypes.$inferSelect;

/**
 * Bâtiments du patrimoine SNCF
 */
export const buildings = mysqlTable("buildings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }),
  lotId: int("lotId").notNull(),
  portfolio: mysqlEnum("portfolio", ["Industriel", "Ferroviaire", "Gares", "Tertiaire", "Social"]).notNull(),
  address: text("address"),
  surface: decimal("surface", { precision: 12, scale: 2 }),
  description: text("description"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Building = typeof buildings.$inferSelect;
export type InsertBuilding = typeof buildings.$inferInsert;

/**
 * Interventions de maintenance
 */
export const interventions = mysqlTable("interventions", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  buildingId: int("buildingId").notNull(),
  workTypeId: int("workTypeId").notNull(),
  criticality: mysqlEnum("criticality", ["C1", "C2"]).notNull(),
  maintenanceType: mysqlEnum("maintenanceType", ["MPREV", "MREG", "MCOR"]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["planifie", "en_cours", "termine", "annule"]).default("planifie").notNull(),
  // Dates et durées
  plannedDate: bigint("plannedDate", { mode: "number" }),
  startDate: bigint("startDate", { mode: "number" }),
  endDate: bigint("endDate", { mode: "number" }),
  durationMinutes: int("durationMinutes"),
  // Délais contractuels
  d1Deadline: bigint("d1Deadline", { mode: "number" }),
  d2Deadline: bigint("d2Deadline", { mode: "number" }),
  d1Met: int("d1Met"),
  d2Met: int("d2Met"),
  // Assignation
  assignedTo: varchar("assignedTo", { length: 200 }),
  contractor: varchar("contractor", { length: 200 }),
  createdBy: int("createdBy"),
  // Suivi administratif et financier
  quoteNumber: varchar("quoteNumber", { length: 100 }),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  validationKnitiv: varchar("validationKnitiv", { length: 200 }),
  connectImmoRef: varchar("connectImmoRef", { length: 100 }),
  daNumber: varchar("daNumber", { length: 100 }),
  cdaNumber: varchar("cdaNumber", { length: 100 }),
  pvNumber: varchar("pvNumber", { length: 100 }),
  receptionNumber: varchar("receptionNumber", { length: 100 }),
  atNumber: varchar("atNumber", { length: 100 }),
  axeLocal: varchar("axeLocal", { length: 100 }),
  axeCentral: varchar("axeCentral", { length: 100 }),
  dateDacia: bigint("dateDacia", { mode: "number" }),
  clotureAt: bigint("clotureAt", { mode: "number" }),
  // Alertes
  alertSent: int("alertSent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Intervention = typeof interventions.$inferSelect;
export type InsertIntervention = typeof interventions.$inferInsert;

/**
 * Commentaires sur les interventions
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  interventionId: int("interventionId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;

/**
 * Historique des modifications d'une intervention
 */
export const interventionHistory = mysqlTable("intervention_history", {
  id: int("id").autoincrement().primaryKey(),
  interventionId: int("interventionId").notNull(),
  userId: int("userId"),
  field: varchar("field", { length: 100 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterventionHistoryEntry = typeof interventionHistory.$inferSelect;

/**
 * Alertes envoyées
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  interventionId: int("interventionId").notNull(),
  type: mysqlEnum("type", ["d1_depassement", "d2_depassement", "c1_creation", "retard_preventif"]).notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  acknowledged: int("acknowledged").default(0).notNull(),
});

export type Alert = typeof alerts.$inferSelect;

/**
 * Bordereau de Prix Unitaires (BPU)
 */
export const bpuItems = mysqlTable("bpu_items", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  name: text("name").notNull(),
  detail: text("detail"),
  priceHT: decimal("priceHT", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 200 }),
  lotCode: varchar("lotCode", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BpuItem = typeof bpuItems.$inferSelect;
export type InsertBpuItem = typeof bpuItems.$inferInsert;

/**
 * Ligne de prestation BPU liée à une intervention
 */
export const interventionBpuLines = mysqlTable("intervention_bpu_lines", {
  id: int("id").autoincrement().primaryKey(),
  interventionId: int("interventionId").notNull(),
  bpuItemId: int("bpuItemId").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPriceHT: decimal("unitPriceHT", { precision: 12, scale: 2 }).notNull(),
  totalHT: decimal("totalHT", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterventionBpuLine = typeof interventionBpuLines.$inferSelect;
export type InsertInterventionBpuLine = typeof interventionBpuLines.$inferInsert;

/**
 * Analyses de devis
 */
export const devisAnalyses = mysqlTable("devis_analyses", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 300 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  contractor: varchar("contractor", { length: 200 }),
  devisNumber: varchar("devisNumber", { length: 100 }),
  devisDate: varchar("devisDate", { length: 50 }),
  totalHT: decimal("totalHT", { precision: 12, scale: 2 }),
  totalTTC: decimal("totalTTC", { precision: 12, scale: 2 }),
  // Verdict: valide, a_reverifier, rejete
  verdict: mysqlEnum("verdict", ["valide", "a_reverifier", "rejete", "en_cours"]).default("en_cours").notNull(),
  verdictReason: text("verdictReason"),
  // Ecart global par rapport au BPU (%)
  ecartGlobalPct: decimal("ecartGlobalPct", { precision: 8, scale: 2 }),
  // Données brutes extraites par l'IA
  rawExtraction: json("rawExtraction"),
  // Lien optionnel vers une intervention
  interventionId: int("interventionId"),
  // Utilisateur qui a uploadé
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DevisAnalyse = typeof devisAnalyses.$inferSelect;
export type InsertDevisAnalyse = typeof devisAnalyses.$inferInsert;

/**
 * Lignes extraites d'un devis avec comparaison BPU
 */
export const devisLines = mysqlTable("devis_lines", {
  id: int("id").autoincrement().primaryKey(),
  devisId: int("devisId").notNull(),
  // Données extraites du devis
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }),
  unit: varchar("unit", { length: 100 }),
  // Correspondance BPU trouvée
  matchedBpuId: int("matchedBpuId"),
  matchedBpuCode: varchar("matchedBpuCode", { length: 20 }),
  bpuUnitPrice: decimal("bpuUnitPrice", { precision: 12, scale: 2 }),
  // Ecart en % par rapport au BPU
  ecartPct: decimal("ecartPct", { precision: 8, scale: 2 }),
  // Statut de la ligne: conforme, ecart_faible, ecart_fort, non_trouve
  lineStatus: mysqlEnum("lineStatus", ["conforme", "ecart_faible", "ecart_fort", "non_trouve"]).default("non_trouve").notNull(),
  matchConfidence: decimal("matchConfidence", { precision: 5, scale: 2 }),
  // Nouvelles références BPU détaillées
  bpuReference: text("bpuReference"),
  bpuSource: text("bpuSource"),
  moFacturable: text("moFacturable"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DevisLine = typeof devisLines.$inferSelect;
export type InsertDevisLine = typeof devisLines.$inferInsert;

/**
 * Tableau de suivi (reproduction exacte du fichier Excel)
 */
export const suiviEntries = mysqlTable("suivi_entries", {
  id: int("id").autoincrement().primaryKey(),
  prestataire: varchar("prestataire", { length: 200 }),
  ut: varchar("ut", { length: 50 }),
  bat: varchar("bat", { length: 50 }),
  intitule: text("intitule"),
  numDevis: varchar("numDevis", { length: 100 }),
  dateDevis: varchar("dateDevis", { length: 50 }),
  montant: varchar("montant", { length: 50 }),
  validationKnitiv: varchar("validationKnitiv", { length: 200 }),
  numConnectImmo: varchar("numConnectImmo", { length: 100 }),
  numDA: varchar("numDA", { length: 100 }),
  numCDA: varchar("numCDA", { length: 100 }),
  pv: varchar("pv", { length: 100 }),
  numReception: varchar("numReception", { length: 100 }),
  numAT: varchar("numAT", { length: 100 }),
  axeLocal: varchar("axeLocal", { length: 100 }),
  axeCentral: varchar("axeCentral", { length: 100 }),
  dateDacia: varchar("dateDacia", { length: 50 }),
  clotureAT: varchar("clotureAT", { length: 100 }),
  commentaires: text("commentaires"),
  devisUrl: text("devisUrl"),
  devisFilename: varchar("devisFilename", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuiviEntry = typeof suiviEntries.$inferSelect;
export type InsertSuiviEntry = typeof suiviEntries.$inferInsert;

/**
 * Livrables contractuels E2MT² (Mission A)
 */
export const deliverables = mysqlTable("deliverables", {
  id: int("id").autoincrement().primaryKey(),
  // Identification
  code: varchar("code", { length: 20 }).notNull(),
  mission: varchar("mission", { length: 20 }).notNull(),
  category: varchar("category", { length: 200 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  // Délai contractuel
  contractualDelay: varchar("contractualDelay", { length: 500 }).notNull(),
  // Dates
  referenceDate: bigint("referenceDate", { mode: "number" }),
  dueDate: bigint("dueDate", { mode: "number" }),
  deliveredDate: bigint("deliveredDate", { mode: "number" }),
  // Statut
  status: mysqlEnum("status", ["a_venir", "en_cours", "livre", "en_retard", "non_applicable"]).default("a_venir").notNull(),
  // Responsable et notes
  responsable: varchar("responsable", { length: 200 }),
  notes: text("notes"),
  // Alerte
  alertDaysBefore: int("alertDaysBefore").default(7),
  alertSent: int("alertSent").default(0).notNull(),
  // Priorité
  priority: mysqlEnum("priority", ["haute", "moyenne", "basse"]).default("moyenne").notNull(),
  // Tracking
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = typeof deliverables.$inferInsert;

/**
 * Checklist d'avancement du workflow (11 étapes DI → Réception)
 */
export const interventionChecklist = mysqlTable("intervention_checklist", {
  id: int("id").autoincrement().primaryKey(),
  interventionId: int("interventionId").notNull(),
  stepId: varchar("stepId", { length: 30 }).notNull(),
  completed: int("completed").default(0).notNull(),
  completedAt: bigint("completedAt", { mode: "number" }),
  completedBy: int("completedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InterventionChecklist = typeof interventionChecklist.$inferSelect;
export type InsertInterventionChecklist = typeof interventionChecklist.$inferInsert;

/**
 * Historique des décisions de l'arbre de décision
 */
export const decisionHistory = mysqlTable("decision_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mission: varchar("mission", { length: 1 }).notNull(), // C ou D
  missionLabel: varchar("missionLabel", { length: 255 }).notNull(),
  chargeType: varchar("chargeType", { length: 20 }).notNull(), // locataire, proprietaire, mixte
  chargeLabel: varchar("chargeLabel", { length: 100 }).notNull(),
  sousTypeCode: varchar("sousTypeCode", { length: 20 }).notNull(),
  sousType: varchar("sousType", { length: 100 }).notNull(),
  famillebudgetaire: varchar("famillebudgetaire", { length: 20 }).notNull(),
  codeZG: varchar("codeZG", { length: 20 }).notNull(),
  moFacturable: int("moFacturable").default(0).notNull(),
  moExplication: text("moExplication"),
  natureTravauxSelectionnee: varchar("natureTravauxSelectionnee", { length: 200 }),
  montantDevis: decimal("montantDevis", { precision: 12, scale: 2 }),
  parcours: json("parcours"), // JSON array of {questionId, answer, label}
  recommandations: json("recommandations"), // JSON array of strings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DecisionHistory = typeof decisionHistory.$inferSelect;
export type InsertDecisionHistory = typeof decisionHistory.$inferInsert;

/**
 * Questions COTECH — Questions à poser en réunion COTECH avec suivi des réponses
 */
export const cotechQuestions = mysqlTable("cotech_questions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Question
  question: text("question").notNull(),
  // Contexte optionnel (référence OT, devis, bâtiment)
  reference: varchar("reference", { length: 200 }),
  category: varchar("category", { length: 100 }),
  // Réponse
  reponse: text("reponse"),
  reponseDate: bigint("reponseDate", { mode: "number" }),
  // Statut
  resolved: int("resolved").default(0).notNull(),
  resolvedAt: bigint("resolvedAt", { mode: "number" }),
  // Archivage
  archived: int("archived").default(0).notNull(),
  archivedAt: bigint("archivedAt", { mode: "number" }),
  // Priorité
  priority: mysqlEnum("priority", ["haute", "moyenne", "basse"]).default("moyenne").notNull(),
  // Tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CotechQuestion = typeof cotechQuestions.$inferSelect;
export type InsertCotechQuestion = typeof cotechQuestions.$inferInsert;

/**
 * Inventaire UT-BAT avec gérant de programme — Référence pour déterminer
 * automatiquement le gérant de programme à partir de l'UT-BAT d'un devis
 */
export const inventaireUtbat = mysqlTable("inventaire_utbat", {
  id: int("id").autoincrement().primaryKey(),
  codeUt: varchar("code_ut", { length: 20 }).notNull(),
  utBat: varchar("ut_bat", { length: 30 }).notNull(),
  libelleUt: varchar("libelle_ut", { length: 200 }).notNull(),
  codeBatiment: varchar("code_batiment", { length: 20 }).notNull(),
  libelleBatiment: varchar("libelle_batiment", { length: 200 }),
  portefeuille: varchar("portefeuille", { length: 100 }),
  nomGerant: varchar("nom_gerant", { length: 200 }).notNull(),
  codeGerant: varchar("code_gerant", { length: 100 }),
  proprietaireInterne: varchar("proprietaire_interne", { length: 200 }),
});
export type InventaireUtbat = typeof inventaireUtbat.$inferSelect;
export type InsertInventaireUtbat = typeof inventaireUtbat.$inferInsert;

// ============================================================
// TABLES DE RÉFÉRENCE — Données métier IMMOSIS / Connect'Immo
// ============================================================

/**
 * Sous-types IMMOSIS actifs (22 sous-types)
 * Source : PDF "Accompagnement usage sous-types et nature de travaux" V2 + Nomenclature ZG
 */
export const refSousTypes = mysqlTable("ref_sous_types", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  libelle: varchar("libelle", { length: 200 }).notNull(),
  familleZG: varchar("famille_zg", { length: 100 }),
  budgetImpacte: varchar("budget_impacte", { length: 100 }),
  description: text("description"),
  bonnesPratiques: text("bonnes_pratiques"),
  mauvaisesPratiques: text("mauvaises_pratiques"),
  sousTypeConnectImmo: varchar("sous_type_connect_immo", { length: 200 }),
  estActif: int("est_actif").default(1).notNull(),
  estE2MT: int("est_e2mt").default(0).notNull(),
  seuilMontantMin: decimal("seuil_montant_min", { precision: 12, scale: 2 }),
  seuilMontantMax: decimal("seuil_montant_max", { precision: 12, scale: 2 }),
});
export type RefSousType = typeof refSousTypes.$inferSelect;

/**
 * Natures de travaux IMMOSIS (codes 83xx-89xx)
 * Source : Captures Immosis + PDF sous-types V2
 */
export const refNaturesTravaux = mysqlTable("ref_natures_travaux", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  libelle: varchar("libelle", { length: 200 }).notNull(),
  sousTypesCompatibles: text("sous_types_compatibles"),
  description: text("description"),
});
export type RefNatureTravaux = typeof refNaturesTravaux.$inferSelect;

/**
 * Gérants de programme valides pour ouverture AT
 * Source : CSV "2026-Gérants de programme valides pour ouv AT" + inventaire
 */
export const refGerantsProgramme = mysqlTable("ref_gerants_programme", {
  id: int("id").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 200 }).notNull().unique(),
  codeImmosis: varchar("code_immosis", { length: 100 }),
  sa: varchar("sa", { length: 100 }),
  bdProprietaire: varchar("bd_proprietaire", { length: 200 }),
  codeBupo: varchar("code_bupo", { length: 20 }),
  portefeuille: varchar("portefeuille", { length: 100 }),
  estValideOuvAT: int("est_valide_ouv_at").default(1).notNull(),
  remarques: text("remarques"),
});
export type RefGerantProgramme = typeof refGerantsProgramme.$inferSelect;

/**
 * Règles de ventilation B/D Propriétaire
 * Source : MDG 2026 + Mode Emploi PPT 2026
 */
export const refVentilationBD = mysqlTable("ref_ventilation_bd", {
  id: int("id").autoincrement().primaryKey(),
  gerant: varchar("gerant", { length: 200 }).notNull(),
  sa: varchar("sa", { length: 100 }).notNull(),
  bdProprietaire: varchar("bd_proprietaire", { length: 200 }).notNull(),
  pourcentage: int("pourcentage").default(100).notNull(),
  codeBupo: varchar("code_bupo", { length: 20 }),
  remarques: text("remarques"),
});
export type RefVentilationBD = typeof refVentilationBD.$inferSelect;

/**
 * Correspondance sous-type IMMOSIS → sous-type Connect'Immo
 * Source : Captures Connect'Immo + PDF sous-types V2
 */
export const refCorrespondanceConnectImmo = mysqlTable("ref_correspondance_connect_immo", {
  id: int("id").autoincrement().primaryKey(),
  sousTypeImmosis: varchar("sous_type_immosis", { length: 30 }).notNull(),
  sousTypeConnectImmo: varchar("sous_type_connect_immo", { length: 200 }).notNull(),
  origineConnectImmo: varchar("origine_connect_immo", { length: 200 }),
  remarques: text("remarques"),
});
export type RefCorrespondanceConnectImmo = typeof refCorrespondanceConnectImmo.$inferSelect;
