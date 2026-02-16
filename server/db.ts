import { eq, and, like, sql, desc, asc, inArray, gte, lte, count, avg, min, max, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  lots, buildings, workTypes, interventions, comments, interventionHistory, alerts,
  bpuItems, interventionBpuLines,
  devisAnalyses, devisLines, suiviEntries, deliverables,
  type InsertBuilding, type InsertIntervention, type InsertInterventionBpuLine,
  type InsertDevisAnalyse, type InsertDevisLine, type InsertSuiviEntry, type InsertDeliverable,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== LOTS =====
export async function getAllLots() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lots).orderBy(asc(lots.code));
}

// ===== WORK TYPES =====
export async function getAllWorkTypes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workTypes).orderBy(asc(workTypes.code));
}

// ===== BUILDINGS =====
export async function getBuildings(filters: {
  lotId?: number;
  portfolio?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { lotId, portfolio, search, page = 1, limit = 20 } = filters;
  const conditions = [];
  if (lotId) conditions.push(eq(buildings.lotId, lotId));
  if (portfolio) conditions.push(eq(buildings.portfolio, portfolio as any));
  if (search) conditions.push(or(like(buildings.name, `%${search}%`), like(buildings.code, `%${search}%`)));
  conditions.push(eq(buildings.isActive, 1));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, totalResult] = await Promise.all([
    db.select({
      id: buildings.id,
      name: buildings.name,
      code: buildings.code,
      lotId: buildings.lotId,
      portfolio: buildings.portfolio,
      address: buildings.address,
      surface: buildings.surface,
      description: buildings.description,
      lotCode: lots.code,
      lotRegion: lots.region,
      createdAt: buildings.createdAt,
    })
      .from(buildings)
      .leftJoin(lots, eq(buildings.lotId, lots.id))
      .where(where)
      .orderBy(asc(buildings.name))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(buildings).where(where),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function getBuildingById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    id: buildings.id,
    name: buildings.name,
    code: buildings.code,
    lotId: buildings.lotId,
    portfolio: buildings.portfolio,
    address: buildings.address,
    surface: buildings.surface,
    description: buildings.description,
    isActive: buildings.isActive,
    lotCode: lots.code,
    lotRegion: lots.region,
    createdAt: buildings.createdAt,
    updatedAt: buildings.updatedAt,
  })
    .from(buildings)
    .leftJoin(lots, eq(buildings.lotId, lots.id))
    .where(eq(buildings.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createBuilding(data: InsertBuilding) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(buildings).values(data);
  return result[0].insertId;
}

export async function updateBuilding(id: number, data: Partial<InsertBuilding>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(buildings).set(data).where(eq(buildings.id, id));
}

// ===== INTERVENTIONS =====
export async function getInterventions(filters: {
  buildingId?: number;
  workTypeId?: number;
  criticality?: string;
  maintenanceType?: string;
  status?: string;
  lotId?: number;
  startDateFrom?: number;
  startDateTo?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { buildingId, workTypeId, criticality, maintenanceType, status, lotId, startDateFrom, startDateTo, search, page = 1, limit = 20 } = filters;
  const conditions = [];
  if (buildingId) conditions.push(eq(interventions.buildingId, buildingId));
  if (workTypeId) conditions.push(eq(interventions.workTypeId, workTypeId));
  if (criticality) conditions.push(eq(interventions.criticality, criticality as any));
  if (maintenanceType) conditions.push(eq(interventions.maintenanceType, maintenanceType as any));
  if (status) conditions.push(eq(interventions.status, status as any));
  if (lotId) conditions.push(eq(buildings.lotId, lotId));
  if (startDateFrom) conditions.push(gte(interventions.startDate, startDateFrom));
  if (startDateTo) conditions.push(lte(interventions.startDate, startDateTo));
  if (search) {
    conditions.push(or(
      like(interventions.reference, `%${search}%`),
      like(interventions.title, `%${search}%`),
      like(buildings.name, `%${search}%`)
    ));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, totalResult] = await Promise.all([
    db.select({
      id: interventions.id,
      reference: interventions.reference,
      buildingId: interventions.buildingId,
      buildingName: buildings.name,
      buildingCode: buildings.code,
      lotCode: lots.code,
      lotRegion: lots.region,
      workTypeId: interventions.workTypeId,
      workTypeCode: workTypes.code,
      workTypeName: workTypes.name,
      criticality: interventions.criticality,
      maintenanceType: interventions.maintenanceType,
      title: interventions.title,
      description: interventions.description,
      status: interventions.status,
      plannedDate: interventions.plannedDate,
      startDate: interventions.startDate,
      endDate: interventions.endDate,
      durationMinutes: interventions.durationMinutes,
      d1Deadline: interventions.d1Deadline,
      d2Deadline: interventions.d2Deadline,
      d1Met: interventions.d1Met,
      d2Met: interventions.d2Met,
      assignedTo: interventions.assignedTo,
      alertSent: interventions.alertSent,
      createdAt: interventions.createdAt,
      updatedAt: interventions.updatedAt,
    })
      .from(interventions)
      .leftJoin(buildings, eq(interventions.buildingId, buildings.id))
      .leftJoin(lots, eq(buildings.lotId, lots.id))
      .leftJoin(workTypes, eq(interventions.workTypeId, workTypes.id))
      .where(where)
      .orderBy(desc(interventions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() })
      .from(interventions)
      .leftJoin(buildings, eq(interventions.buildingId, buildings.id))
      .leftJoin(lots, eq(buildings.lotId, lots.id))
      .where(where),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function getInterventionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    id: interventions.id,
    reference: interventions.reference,
    buildingId: interventions.buildingId,
    buildingName: buildings.name,
    buildingCode: buildings.code,
    lotId: buildings.lotId,
    lotCode: lots.code,
    lotRegion: lots.region,
    portfolio: buildings.portfolio,
    workTypeId: interventions.workTypeId,
    workTypeCode: workTypes.code,
    workTypeName: workTypes.name,
    criticality: interventions.criticality,
    maintenanceType: interventions.maintenanceType,
    title: interventions.title,
    description: interventions.description,
    status: interventions.status,
    plannedDate: interventions.plannedDate,
    startDate: interventions.startDate,
    endDate: interventions.endDate,
    durationMinutes: interventions.durationMinutes,
    d1Deadline: interventions.d1Deadline,
    d2Deadline: interventions.d2Deadline,
    d1Met: interventions.d1Met,
    d2Met: interventions.d2Met,
    assignedTo: interventions.assignedTo,
    contractor: interventions.contractor,
    quoteNumber: interventions.quoteNumber,
    amount: interventions.amount,
    validationKnitiv: interventions.validationKnitiv,
    connectImmoRef: interventions.connectImmoRef,
    daNumber: interventions.daNumber,
    cdaNumber: interventions.cdaNumber,
    pvNumber: interventions.pvNumber,
    receptionNumber: interventions.receptionNumber,
    atNumber: interventions.atNumber,
    axeLocal: interventions.axeLocal,
    axeCentral: interventions.axeCentral,
    dateDacia: interventions.dateDacia,
    clotureAt: interventions.clotureAt,
    createdBy: interventions.createdBy,
    alertSent: interventions.alertSent,
    createdAt: interventions.createdAt,
    updatedAt: interventions.updatedAt,
  })
    .from(interventions)
    .leftJoin(buildings, eq(interventions.buildingId, buildings.id))
    .leftJoin(lots, eq(buildings.lotId, lots.id))
    .leftJoin(workTypes, eq(interventions.workTypeId, workTypes.id))
    .where(eq(interventions.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createIntervention(data: InsertIntervention) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(interventions).values(data);
  return result[0].insertId;
}

export async function updateIntervention(id: number, data: Partial<InsertIntervention>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(interventions).set(data).where(eq(interventions.id, id));
}

export async function generateReference() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `INT-${year}${month}-`;
  const result = await db.select({ count: count() }).from(interventions);
  const num = (result[0]?.count ?? 0) + 1;
  return `${prefix}${String(num).padStart(5, "0")}`;
}

// ===== COMMENTS =====
export async function getCommentsByIntervention(interventionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: comments.id,
    interventionId: comments.interventionId,
    userId: comments.userId,
    userName: users.name,
    content: comments.content,
    createdAt: comments.createdAt,
  })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.interventionId, interventionId))
    .orderBy(desc(comments.createdAt));
}

export async function addComment(interventionId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(comments).values({ interventionId, userId, content });
}

// ===== HISTORY =====
export async function getHistoryByIntervention(interventionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: interventionHistory.id,
    interventionId: interventionHistory.interventionId,
    userId: interventionHistory.userId,
    userName: users.name,
    field: interventionHistory.field,
    oldValue: interventionHistory.oldValue,
    newValue: interventionHistory.newValue,
    createdAt: interventionHistory.createdAt,
  })
    .from(interventionHistory)
    .leftJoin(users, eq(interventionHistory.userId, users.id))
    .where(eq(interventionHistory.interventionId, interventionId))
    .orderBy(desc(interventionHistory.createdAt));
}

export async function addHistoryEntry(interventionId: number, userId: number | null, field: string, oldValue: string | null, newValue: string | null) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(interventionHistory).values({ interventionId, userId, field, oldValue, newValue });
}

// ===== DASHBOARD STATS =====
export async function getDashboardStats(lotId?: number) {
  const db = await getDb();
  if (!db) return null;

  const lotCondition = lotId ? eq(buildings.lotId, lotId) : undefined;

  // Total interventions
  const totalQuery = lotId
    ? db.select({ count: count() }).from(interventions).leftJoin(buildings, eq(interventions.buildingId, buildings.id)).where(lotCondition)
    : db.select({ count: count() }).from(interventions);
  const [totalResult] = await totalQuery;

  // By status
  const statusQuery = lotId
    ? db.select({ status: interventions.status, count: count() }).from(interventions).leftJoin(buildings, eq(interventions.buildingId, buildings.id)).where(lotCondition).groupBy(interventions.status)
    : db.select({ status: interventions.status, count: count() }).from(interventions).groupBy(interventions.status);
  const byStatus = await statusQuery;

  // By work type
  const workTypeQuery = lotId
    ? db.select({ code: workTypes.code, name: workTypes.name, count: count() })
        .from(interventions)
        .leftJoin(workTypes, eq(interventions.workTypeId, workTypes.id))
        .leftJoin(buildings, eq(interventions.buildingId, buildings.id))
        .where(lotCondition)
        .groupBy(workTypes.code, workTypes.name)
    : db.select({ code: workTypes.code, name: workTypes.name, count: count() })
        .from(interventions)
        .leftJoin(workTypes, eq(interventions.workTypeId, workTypes.id))
        .groupBy(workTypes.code, workTypes.name);
  const byWorkType = await workTypeQuery;

  // D1/D2 compliance
  const d1MetQuery = lotId
    ? db.select({ count: count() }).from(interventions).leftJoin(buildings, eq(interventions.buildingId, buildings.id)).where(and(eq(interventions.d1Met, 1), lotCondition))
    : db.select({ count: count() }).from(interventions).where(eq(interventions.d1Met, 1));
  const [d1MetResult] = await d1MetQuery;

  const d1FailQuery = lotId
    ? db.select({ count: count() }).from(interventions).leftJoin(buildings, eq(interventions.buildingId, buildings.id)).where(and(eq(interventions.d1Met, 0), lotCondition))
    : db.select({ count: count() }).from(interventions).where(eq(interventions.d1Met, 0));
  const [d1FailResult] = await d1FailQuery;

  const d2MetQuery = lotId
    ? db.select({ count: count() }).from(interventions).leftJoin(buildings, eq(interventions.buildingId, buildings.id)).where(and(eq(interventions.d2Met, 1), lotCondition))
    : db.select({ count: count() }).from(interventions).where(eq(interventions.d2Met, 1));
  const [d2MetResult] = await d2MetQuery;

  const d2FailQuery = lotId
    ? db.select({ count: count() }).from(interventions).leftJoin(buildings, eq(interventions.buildingId, buildings.id)).where(and(eq(interventions.d2Met, 0), lotCondition))
    : db.select({ count: count() }).from(interventions).where(eq(interventions.d2Met, 0));
  const [d2FailResult] = await d2FailQuery;

  // Average durations by work type
  const avgDurationQuery = lotId
    ? db.select({
        code: workTypes.code,
        name: workTypes.name,
        avgDuration: avg(interventions.durationMinutes),
        minDuration: min(interventions.durationMinutes),
        maxDuration: max(interventions.durationMinutes),
        count: count(),
      })
        .from(interventions)
        .leftJoin(workTypes, eq(interventions.workTypeId, workTypes.id))
        .leftJoin(buildings, eq(interventions.buildingId, buildings.id))
        .where(and(eq(interventions.status, "termine"), lotCondition))
        .groupBy(workTypes.code, workTypes.name)
    : db.select({
        code: workTypes.code,
        name: workTypes.name,
        avgDuration: avg(interventions.durationMinutes),
        minDuration: min(interventions.durationMinutes),
        maxDuration: max(interventions.durationMinutes),
        count: count(),
      })
        .from(interventions)
        .leftJoin(workTypes, eq(interventions.workTypeId, workTypes.id))
        .where(eq(interventions.status, "termine"))
        .groupBy(workTypes.code, workTypes.name);
  const avgDurations = await avgDurationQuery;

  // Buildings count
  const buildingsCountQuery = lotId
    ? db.select({ count: count() }).from(buildings).where(and(eq(buildings.isActive, 1), eq(buildings.lotId, lotId)))
    : db.select({ count: count() }).from(buildings).where(eq(buildings.isActive, 1));
  const [buildingsCount] = await buildingsCountQuery;

  // By criticality
  const byCriticalityQuery = lotId
    ? db.select({ criticality: interventions.criticality, count: count() }).from(interventions).leftJoin(buildings, eq(interventions.buildingId, buildings.id)).where(lotCondition).groupBy(interventions.criticality)
    : db.select({ criticality: interventions.criticality, count: count() }).from(interventions).groupBy(interventions.criticality);
  const byCriticality = await byCriticalityQuery;

  return {
    totalInterventions: totalResult?.count ?? 0,
    totalBuildings: buildingsCount?.count ?? 0,
    byStatus,
    byWorkType,
    byCriticality,
    d1Met: d1MetResult?.count ?? 0,
    d1Failed: d1FailResult?.count ?? 0,
    d2Met: d2MetResult?.count ?? 0,
    d2Failed: d2FailResult?.count ?? 0,
    avgDurations,
  };
}

// ===== ALERTS =====
export async function getAlerts(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: alerts.id,
    interventionId: alerts.interventionId,
    reference: interventions.reference,
    type: alerts.type,
    message: alerts.message,
    sentAt: alerts.sentAt,
    acknowledged: alerts.acknowledged,
  })
    .from(alerts)
    .leftJoin(interventions, eq(alerts.interventionId, interventions.id))
    .orderBy(desc(alerts.sentAt))
    .limit(limit);
}

export async function createAlert(interventionId: number, type: string, message: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(alerts).values({ interventionId, type: type as any, message });
}

export async function acknowledgeAlert(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(alerts).set({ acknowledged: 1 }).where(eq(alerts.id, id));
}

// ===== BPU =====
export async function getBpuItems(filters: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { category, search, page = 1, limit = 50 } = filters;
  const conditions = [];
  if (category) conditions.push(eq(bpuItems.category, category));
  if (search) conditions.push(or(like(bpuItems.code, `%${search}%`), like(bpuItems.name, `%${search}%`)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, totalResult] = await Promise.all([
    db.select().from(bpuItems).where(where).orderBy(asc(bpuItems.code)).limit(limit).offset((page - 1) * limit),
    db.select({ count: count() }).from(bpuItems).where(where),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function getAllBpuCategories() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.selectDistinct({ category: bpuItems.category }).from(bpuItems).orderBy(asc(bpuItems.category));
  return result.map(r => r.category);
}

export async function getBpuItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bpuItems).where(eq(bpuItems.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getInterventionBpuLines(interventionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: interventionBpuLines.id,
    interventionId: interventionBpuLines.interventionId,
    bpuItemId: interventionBpuLines.bpuItemId,
    bpuCode: bpuItems.code,
    bpuName: bpuItems.name,
    bpuCategory: bpuItems.category,
    quantity: interventionBpuLines.quantity,
    unitPriceHT: interventionBpuLines.unitPriceHT,
    totalHT: interventionBpuLines.totalHT,
    unit: bpuItems.unit,
    createdAt: interventionBpuLines.createdAt,
  })
    .from(interventionBpuLines)
    .leftJoin(bpuItems, eq(interventionBpuLines.bpuItemId, bpuItems.id))
    .where(eq(interventionBpuLines.interventionId, interventionId))
    .orderBy(asc(interventionBpuLines.id));
}

export async function addBpuLine(data: InsertInterventionBpuLine) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(interventionBpuLines).values(data);
}

export async function removeBpuLine(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(interventionBpuLines).where(eq(interventionBpuLines.id, id));
}

// ===== EXPORT DATA =====
export async function getAllInterventionsForExport(filters: {
  lotId?: number;
  workTypeId?: number;
  criticality?: string;
  status?: string;
  startDateFrom?: number;
  startDateTo?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const { lotId, workTypeId, criticality, status, startDateFrom, startDateTo } = filters;
  const conditions = [];
  if (workTypeId) conditions.push(eq(interventions.workTypeId, workTypeId));
  if (criticality) conditions.push(eq(interventions.criticality, criticality as any));
  if (status) conditions.push(eq(interventions.status, status as any));
  if (lotId) conditions.push(eq(buildings.lotId, lotId));
  if (startDateFrom) conditions.push(gte(interventions.startDate, startDateFrom));
  if (startDateTo) conditions.push(lte(interventions.startDate, startDateTo));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select({
    reference: interventions.reference,
    buildingName: buildings.name,
    buildingCode: buildings.code,
    lotCode: lots.code,
    lotRegion: lots.region,
    portfolio: buildings.portfolio,
    workTypeCode: workTypes.code,
    workTypeName: workTypes.name,
    criticality: interventions.criticality,
    maintenanceType: interventions.maintenanceType,
    title: interventions.title,
    status: interventions.status,
    plannedDate: interventions.plannedDate,
    startDate: interventions.startDate,
    endDate: interventions.endDate,
    durationMinutes: interventions.durationMinutes,
    d1Met: interventions.d1Met,
    d2Met: interventions.d2Met,
    assignedTo: interventions.assignedTo,
    contractor: interventions.contractor,
    quoteNumber: interventions.quoteNumber,
    amount: interventions.amount,
    validationKnitiv: interventions.validationKnitiv,
    connectImmoRef: interventions.connectImmoRef,
    daNumber: interventions.daNumber,
    cdaNumber: interventions.cdaNumber,
    pvNumber: interventions.pvNumber,
    receptionNumber: interventions.receptionNumber,
    atNumber: interventions.atNumber,
    axeLocal: interventions.axeLocal,
    axeCentral: interventions.axeCentral,
    createdAt: interventions.createdAt,
  })
    .from(interventions)
    .leftJoin(buildings, eq(interventions.buildingId, buildings.id))
    .leftJoin(lots, eq(buildings.lotId, lots.id))
    .leftJoin(workTypes, eq(interventions.workTypeId, workTypes.id))
    .where(where)
    .orderBy(desc(interventions.createdAt));
}

// ===== DEVIS ANALYSES =====

export async function createDevisAnalyse(data: InsertDevisAnalyse) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(devisAnalyses).values(data);
  return result[0].insertId;
}

export async function updateDevisAnalyse(id: number, data: Partial<InsertDevisAnalyse>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(devisAnalyses).set(data).where(eq(devisAnalyses.id, id));
}

export async function getDevisAnalyseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(devisAnalyses).where(eq(devisAnalyses.id, id)).limit(1);
  return result[0] ?? null;
}

export async function listDevisAnalyses(params: { page: number; limit: number; verdict?: string }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (params.verdict) conditions.push(eq(devisAnalyses.verdict, params.verdict as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;
  const [items, totalResult] = await Promise.all([
    db.select().from(devisAnalyses).where(where).orderBy(desc(devisAnalyses.createdAt)).limit(params.limit).offset(offset),
    db.select({ count: count() }).from(devisAnalyses).where(where),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function deleteDevisAnalyse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(devisLines).where(eq(devisLines.devisId, id));
  await db.delete(devisAnalyses).where(eq(devisAnalyses.id, id));
}

// ===== DEVIS LINES =====

export async function createDevisLines(lines: InsertDevisLine[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (lines.length === 0) return;
  await db.insert(devisLines).values(lines);
}

export async function getDevisLines(devisId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devisLines).where(eq(devisLines.devisId, devisId)).orderBy(asc(devisLines.id));
}

// ===== BPU SEARCH (for matching) =====

export async function getAllBpuItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bpuItems).orderBy(asc(bpuItems.code));
}

// ===== SUIVI (Tableau de suivi Excel) =====

export async function getSuiviEntries(filters: {
  search?: string;
  prestataire?: string;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { search, prestataire, page = 1, limit = 50 } = filters;
  const conditions = [];
  if (prestataire) conditions.push(eq(suiviEntries.prestataire, prestataire));
  if (search) {
    conditions.push(or(
      like(suiviEntries.prestataire, `%${search}%`),
      like(suiviEntries.ut, `%${search}%`),
      like(suiviEntries.bat, `%${search}%`),
      like(suiviEntries.intitule, `%${search}%`),
      like(suiviEntries.numDevis, `%${search}%`),
      like(suiviEntries.numConnectImmo, `%${search}%`),
      like(suiviEntries.numAT, `%${search}%`),
      like(suiviEntries.commentaires, `%${search}%`),
      like(suiviEntries.montant, `%${search}%`),
    ));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, totalResult] = await Promise.all([
    db.select().from(suiviEntries).where(where).orderBy(desc(suiviEntries.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ count: count() }).from(suiviEntries).where(where),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function getSuiviEntryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(suiviEntries).where(eq(suiviEntries.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createSuiviEntry(data: Omit<InsertSuiviEntry, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(suiviEntries).values(data);
  return result[0].insertId;
}

export async function updateSuiviEntry(id: number, data: Partial<InsertSuiviEntry>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(suiviEntries).set(data).where(eq(suiviEntries.id, id));
}

export async function deleteSuiviEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(suiviEntries).where(eq(suiviEntries.id, id));
}

export async function getAllSuiviForExport(filters: { prestataire?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.prestataire) conditions.push(eq(suiviEntries.prestataire, filters.prestataire));
  if (filters.search) {
    conditions.push(or(
      like(suiviEntries.prestataire, `%${filters.search}%`),
      like(suiviEntries.intitule, `%${filters.search}%`),
      like(suiviEntries.numDevis, `%${filters.search}%`),
    ));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(suiviEntries).where(where).orderBy(desc(suiviEntries.createdAt));
}

// ===== DELIVERABLES (Livrables contractuels) =====

export async function getDeliverables(filters: {
  mission?: string;
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { mission, status, priority, search, page = 1, limit = 50 } = filters;
  const conditions: any[] = [];
  if (mission) conditions.push(eq(deliverables.mission, mission));
  if (status) conditions.push(eq(deliverables.status, status as any));
  if (priority) conditions.push(eq(deliverables.priority, priority as any));
  if (search) {
    conditions.push(or(
      like(deliverables.code, `%${search}%`),
      like(deliverables.title, `%${search}%`),
      like(deliverables.category, `%${search}%`),
      like(deliverables.responsable, `%${search}%`),
      like(deliverables.notes, `%${search}%`),
    ));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, totalResult] = await Promise.all([
    db.select().from(deliverables).where(where).orderBy(asc(deliverables.code)).limit(limit).offset((page - 1) * limit),
    db.select({ count: count() }).from(deliverables).where(where),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function getDeliverableById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(deliverables).where(eq(deliverables.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createDeliverable(data: Omit<InsertDeliverable, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(deliverables).values(data);
  return result[0].insertId;
}

export async function updateDeliverable(id: number, data: Partial<InsertDeliverable>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(deliverables).set(data).where(eq(deliverables.id, id));
}

export async function deleteDeliverable(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(deliverables).where(eq(deliverables.id, id));
}

export async function getDeliverableStats() {
  const db = await getDb();
  if (!db) return { total: 0, aVenir: 0, enCours: 0, livre: 0, enRetard: 0, nonApplicable: 0, alertes: 0 };
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  
  const [totalResult] = await db.select({ count: count() }).from(deliverables);
  const [aVenirResult] = await db.select({ count: count() }).from(deliverables).where(eq(deliverables.status, "a_venir"));
  const [enCoursResult] = await db.select({ count: count() }).from(deliverables).where(eq(deliverables.status, "en_cours"));
  const [livreResult] = await db.select({ count: count() }).from(deliverables).where(eq(deliverables.status, "livre"));
  const [enRetardResult] = await db.select({ count: count() }).from(deliverables).where(eq(deliverables.status, "en_retard"));
  const [nonApplicableResult] = await db.select({ count: count() }).from(deliverables).where(eq(deliverables.status, "non_applicable"));
  
  // Alertes: livrables avec dueDate dans les 7 prochains jours et non livrés
  const alerteItems = await db.select().from(deliverables)
    .where(and(
      or(eq(deliverables.status, "a_venir"), eq(deliverables.status, "en_cours")),
    ));
  const alertes = alerteItems.filter(d => {
    if (!d.dueDate) return false;
    const daysLeft = (Number(d.dueDate) - now) / (24 * 60 * 60 * 1000);
    return daysLeft <= (d.alertDaysBefore ?? 7) && daysLeft >= 0;
  }).length;

  // Also count overdue items
  const overdueItems = alerteItems.filter(d => {
    if (!d.dueDate) return false;
    return Number(d.dueDate) < now;
  }).length;

  return {
    total: totalResult?.count ?? 0,
    aVenir: aVenirResult?.count ?? 0,
    enCours: enCoursResult?.count ?? 0,
    livre: livreResult?.count ?? 0,
    enRetard: enRetardResult?.count ?? 0,
    nonApplicable: nonApplicableResult?.count ?? 0,
    alertes,
    overdueCount: overdueItems,
  };
}

export async function getAllDeliverablesForExport(filters: { mission?: string; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters.mission) conditions.push(eq(deliverables.mission, filters.mission));
  if (filters.status) conditions.push(eq(deliverables.status, filters.status as any));
  if (filters.search) {
    conditions.push(or(
      like(deliverables.code, `%${filters.search}%`),
      like(deliverables.title, `%${filters.search}%`),
      like(deliverables.category, `%${filters.search}%`),
    ));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(deliverables).where(where).orderBy(asc(deliverables.code));
}

export async function seedDeliverables(items: Omit<InsertDeliverable, "id" | "createdAt" | "updatedAt">[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (items.length === 0) return;
  // Check if already seeded
  const [existing] = await db.select({ count: count() }).from(deliverables);
  if ((existing?.count ?? 0) > 0) return; // Already seeded
  await db.insert(deliverables).values(items);
}
