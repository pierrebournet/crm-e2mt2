import { describe, expect, it, vi, beforeEach } from "vitest";
import { CONTRACTUAL_DELAYS } from "../shared/e2mt2";

// Mock the db module
vi.mock("./db", () => ({
  getAllLots: vi.fn().mockResolvedValue([
    { id: 1, code: "1.1", name: "Lot 1.1", region: "Hauts de France" },
    { id: 2, code: "1.2", name: "Lot 1.2", region: "Normandie" },
  ]),
  getAllWorkTypes: vi.fn().mockResolvedValue([
    { id: 1, code: "C1a", name: "CVC", description: "Chauffage, Ventilation et Climatisation" },
    { id: 2, code: "C1b", name: "Désenfumage", description: "Installations de désenfumage" },
  ]),
  getBuildings: vi.fn().mockResolvedValue({
    items: [
      { id: 1, name: "Bâtiment A", code: "BAT-A", lotId: 1, portfolio: "Industriel", lotCode: "1.1", lotRegion: "Hauts de France" },
    ],
    total: 1,
  }),
  getBuildingById: vi.fn().mockResolvedValue({
    id: 1, name: "Bâtiment A", code: "BAT-A", lotId: 1, portfolio: "Industriel",
    lotCode: "1.1", lotRegion: "Hauts de France",
  }),
  createBuilding: vi.fn().mockResolvedValue(1),
  updateBuilding: vi.fn().mockResolvedValue(undefined),
  getInterventions: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getInterventionById: vi.fn().mockResolvedValue({
    id: 1, reference: "INT-202602-00001", buildingId: 1, buildingName: "Bâtiment A",
    workTypeId: 1, workTypeCode: "C1a", workTypeName: "CVC",
    criticality: "C1", maintenanceType: "MCOR", title: "Test intervention",
    status: "en_cours", startDate: Date.now() - 3600000,
    d1Deadline: Date.now() + 3600000, d2Deadline: Date.now() + 86400000,
    d1Met: null, d2Met: null,
  }),
  createIntervention: vi.fn().mockResolvedValue(1),
  updateIntervention: vi.fn().mockResolvedValue(undefined),
  generateReference: vi.fn().mockResolvedValue("INT-202602-00001"),
  getCommentsByIntervention: vi.fn().mockResolvedValue([]),
  addComment: vi.fn().mockResolvedValue(undefined),
  getHistoryByIntervention: vi.fn().mockResolvedValue([]),
  addHistoryEntry: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalInterventions: 10, totalBuildings: 5,
    byStatus: [{ status: "termine", count: 7 }, { status: "en_cours", count: 3 }],
    byWorkType: [{ code: "C1a", name: "CVC", count: 5 }],
    byCriticality: [{ criticality: "C1", count: 3 }, { criticality: "C2", count: 7 }],
    d1Met: 8, d1Failed: 2, d2Met: 9, d2Failed: 1,
    avgDurations: [{ code: "C1a", name: "CVC", avgDuration: 120, minDuration: 60, maxDuration: 240, count: 5 }],
  }),
  getAlerts: vi.fn().mockResolvedValue([]),
  createAlert: vi.fn().mockResolvedValue(undefined),
  acknowledgeAlert: vi.fn().mockResolvedValue(undefined),
  getAllInterventionsForExport: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("CRM E2MT² - Reference Data", () => {
  it("lists all lots", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const lots = await caller.lots.list();
    expect(lots).toHaveLength(2);
    expect(lots[0]).toHaveProperty("code", "1.1");
  });

  it("lists all work types", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const types = await caller.workTypes.list();
    expect(types).toHaveLength(2);
    expect(types[0]).toHaveProperty("code", "C1a");
  });
});

describe("CRM E2MT² - Buildings", () => {
  it("lists buildings with filters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.buildings.list({ page: 1, limit: 20 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toHaveProperty("name", "Bâtiment A");
  });

  it("gets a building by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const building = await caller.buildings.getById({ id: 1 });
    expect(building).toHaveProperty("name", "Bâtiment A");
    expect(building).toHaveProperty("portfolio", "Industriel");
  });

  it("creates a building", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.buildings.create({
      name: "Nouveau Bâtiment",
      lotId: 1,
      portfolio: "Gares",
    });
    expect(result).toHaveProperty("id", 1);
    expect(db.createBuilding).toHaveBeenCalled();
  });
});

describe("CRM E2MT² - Interventions", () => {
  it("creates an intervention with correct deadlines", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.interventions.create({
      buildingId: 1,
      workTypeId: 1,
      criticality: "C1",
      maintenanceType: "MCOR",
      title: "Panne climatisation urgente",
      startDate: Date.now(),
    });
    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("reference", "INT-202602-00001");
    // Should create alert for C1
    expect(db.createAlert).toHaveBeenCalledWith(
      1,
      "c1_creation",
      expect.stringContaining("C1")
    );
  });

  it("updates intervention status to termine and calculates compliance", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const endDate = Date.now(); // within d1Deadline
    const result = await caller.interventions.update({
      id: 1,
      status: "termine",
      endDate,
    });
    expect(result).toEqual({ success: true });
    expect(db.updateIntervention).toHaveBeenCalled();
    expect(db.addHistoryEntry).toHaveBeenCalled();
  });

  it("lists interventions", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.interventions.list({ page: 1, limit: 20 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total", 0);
  });

  it("gets comments for an intervention", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const comments = await caller.interventions.comments({ interventionId: 1 });
    expect(Array.isArray(comments)).toBe(true);
  });

  it("adds a comment to an intervention", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.interventions.addComment({
      interventionId: 1,
      content: "Test commentaire",
    });
    expect(result).toEqual({ success: true });
    expect(db.addComment).toHaveBeenCalledWith(1, 1, "Test commentaire");
  });
});

describe("CRM E2MT² - Dashboard", () => {
  it("returns dashboard stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("totalInterventions", 10);
    expect(stats).toHaveProperty("totalBuildings", 5);
    expect(stats).toHaveProperty("d1Met", 8);
    expect(stats).toHaveProperty("d1Failed", 2);
    expect(stats?.byStatus).toHaveLength(2);
  });

  it("returns dashboard stats filtered by lot", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats({ lotId: 1 });
    expect(stats).toHaveProperty("totalInterventions");
    expect(db.getDashboardStats).toHaveBeenCalledWith(1);
  });
});

describe("CRM E2MT² - Alerts", () => {
  it("lists alerts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const alerts = await caller.alerts.list();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("acknowledges an alert", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.alerts.acknowledge({ id: 1 });
    expect(result).toEqual({ success: true });
    expect(db.acknowledgeAlert).toHaveBeenCalledWith(1);
  });
});

describe("CRM E2MT² - Contractual Delays", () => {
  it("has correct C1 delays", () => {
    expect(CONTRACTUAL_DELAYS.C1.d1).toBe(480); // 8h = 480min
    expect(CONTRACTUAL_DELAYS.C1.d2).toBe(960); // 2 jours = 16h = 960min
    expect(CONTRACTUAL_DELAYS.C1.arrivalOnSite).toBe(120); // 2h
    expect(CONTRACTUAL_DELAYS.C1.arrivalIfPresent).toBe(15); // 15min
  });

  it("has correct C2 delays", () => {
    expect(CONTRACTUAL_DELAYS.C2.d1).toBe(480); // 8h ouvrées
    expect(CONTRACTUAL_DELAYS.C2.d2).toBe(3840); // 8 jours = 64h = 3840min
    expect(CONTRACTUAL_DELAYS.C2.arrivalOnSite).toBe(240); // 4h
  });
});

describe("CRM E2MT² - Export", () => {
  it("exports interventions data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const data = await caller.export.interventions({});
    expect(Array.isArray(data)).toBe(true);
    expect(db.getAllInterventionsForExport).toHaveBeenCalled();
  });
});
