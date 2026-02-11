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
  createdBy: int("createdBy"),
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
