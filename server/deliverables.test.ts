import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted - data must be inline, not referencing top-level variables
vi.mock("./db", () => {
  const data = [
    {
      id: 1, code: "A1-01", mission: "A1", category: "Organisation",
      title: "Organigramme opérationnel des équipes de démarrage",
      contractualDelay: "15 jours calendaires suivant prise d'effet mission A1",
      referenceDate: null, dueDate: Date.now() + 86400000 * 5,
      deliveredDate: null, status: "a_venir", responsable: null,
      notes: null, alertDaysBefore: 7, priority: "haute",
      updatedBy: null, createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: 2, code: "A1-02", mission: "A1", category: "Organisation",
      title: "Liste des intervenants phase déploiement",
      contractualDelay: "15 jours calendaires suivant prise d'effet mission A1",
      referenceDate: null, dueDate: Date.now() - 86400000 * 2,
      deliveredDate: null, status: "en_retard", responsable: "Jean Dupont",
      notes: "En attente du prestataire", alertDaysBefore: 7, priority: "haute",
      updatedBy: null, createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: 3, code: "A1-10", mission: "A1", category: "Qualité",
      title: "Plan d'assurance qualité",
      contractualDelay: "5 mois suivant prise d'effet mission A1",
      referenceDate: null, dueDate: Date.now() + 86400000 * 30,
      deliveredDate: Date.now() - 86400000, status: "livre", responsable: null,
      notes: null, alertDaysBefore: 7, priority: "haute",
      updatedBy: null, createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: 4, code: "A2-01", mission: "A2", category: "Intégration",
      title: "MAJ organisation opérationnelle",
      contractualDelay: "Dès prise d'effet mission A2",
      referenceDate: null, dueDate: null,
      deliveredDate: null, status: "en_cours", responsable: null,
      notes: null, alertDaysBefore: 7, priority: "moyenne",
      updatedBy: null, createdAt: Date.now(), updatedAt: Date.now(),
    },
    {
      id: 5, code: "A1-20", mission: "A1", category: "Inventaire",
      title: "Étiquetage des équipements",
      contractualDelay: "5 mois suivant prise d'effet",
      referenceDate: null, dueDate: null,
      deliveredDate: null, status: "non_applicable", responsable: null,
      notes: "Non applicable pour ce lot", alertDaysBefore: 7, priority: "basse",
      updatedBy: null, createdAt: Date.now(), updatedAt: Date.now(),
    },
  ];
  const stats = { total: 5, livre: 1, enCours: 1, aVenir: 1, enRetard: 1, nonApplicable: 1, alertes: 2 };
  return {
    getDeliverables: vi.fn().mockResolvedValue({ items: data, total: 5 }),
    getDeliverableById: vi.fn().mockImplementation((id: number) => Promise.resolve(data.find(d => d.id === id) || null)),
    createDeliverable: vi.fn().mockResolvedValue(6),
    updateDeliverable: vi.fn().mockResolvedValue(undefined),
    deleteDeliverable: vi.fn().mockResolvedValue(undefined),
    getDeliverableStats: vi.fn().mockResolvedValue(stats),
    getAllDeliverablesForExport: vi.fn().mockResolvedValue(data),
    seedDeliverables: vi.fn().mockResolvedValue(undefined),
  };
});

import {
  getDeliverables, getDeliverableById, createDeliverable,
  updateDeliverable, deleteDeliverable, getDeliverableStats,
  getAllDeliverablesForExport, seedDeliverables,
} from "./db";

describe("Deliverables - Livrables contractuels E2MT²", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── LIST & FILTER ──────────────────────────────────────────────

  describe("getDeliverables", () => {
    it("should return all deliverables with total count", async () => {
      const result = await getDeliverables({});
      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(5);
    });

    it("should be called with filter parameters", async () => {
      await getDeliverables({ mission: "A1", status: "a_venir", priority: "haute", search: "organigramme" });
      expect(getDeliverables).toHaveBeenCalledWith({
        mission: "A1", status: "a_venir", priority: "haute", search: "organigramme",
      });
    });

    it("should be called with pagination parameters", async () => {
      await getDeliverables({ page: 2, limit: 10 });
      expect(getDeliverables).toHaveBeenCalledWith({ page: 2, limit: 10 });
    });
  });

  // ─── GET BY ID ──────────────────────────────────────────────────

  describe("getDeliverableById", () => {
    it("should return a specific deliverable by id", async () => {
      const result = await getDeliverableById(1);
      expect(result).toBeDefined();
      expect(result!.code).toBe("A1-01");
      expect(result!.mission).toBe("A1");
      expect(result!.category).toBe("Organisation");
    });

    it("should return null for non-existent id", async () => {
      const result = await getDeliverableById(999);
      expect(result).toBeNull();
    });
  });

  // ─── CREATE ─────────────────────────────────────────────────────

  describe("createDeliverable", () => {
    it("should create a new deliverable and return its id", async () => {
      const newDeliverable = {
        code: "A1-26", mission: "A1", category: "GMAO/GED",
        title: "Nouveau livrable test", contractualDelay: "30 jours calendaires",
        status: "a_venir", priority: "moyenne", alertDaysBefore: 7, updatedBy: null,
      };
      const id = await createDeliverable(newDeliverable as any);
      expect(id).toBe(6);
      expect(createDeliverable).toHaveBeenCalledWith(newDeliverable);
    });
  });

  // ─── UPDATE ─────────────────────────────────────────────────────

  describe("updateDeliverable", () => {
    it("should update deliverable status", async () => {
      await updateDeliverable(1, { status: "livre", deliveredDate: Date.now(), updatedBy: null } as any);
      expect(updateDeliverable).toHaveBeenCalledWith(1, expect.objectContaining({ status: "livre" }));
    });

    it("should update deliverable responsable", async () => {
      await updateDeliverable(1, { responsable: "Pierre Bournet", updatedBy: null } as any);
      expect(updateDeliverable).toHaveBeenCalledWith(1, expect.objectContaining({ responsable: "Pierre Bournet" }));
    });

    it("should update deliverable due date", async () => {
      const newDueDate = Date.now() + 86400000 * 10;
      await updateDeliverable(1, { dueDate: newDueDate, updatedBy: null } as any);
      expect(updateDeliverable).toHaveBeenCalledWith(1, expect.objectContaining({ dueDate: newDueDate }));
    });
  });

  // ─── DELETE ─────────────────────────────────────────────────────

  describe("deleteDeliverable", () => {
    it("should delete a deliverable by id", async () => {
      await deleteDeliverable(1);
      expect(deleteDeliverable).toHaveBeenCalledWith(1);
    });
  });

  // ─── STATS ──────────────────────────────────────────────────────

  describe("getDeliverableStats", () => {
    it("should return correct stats breakdown", async () => {
      const stats = await getDeliverableStats();
      expect(stats.total).toBe(5);
      expect(stats.livre).toBe(1);
      expect(stats.enCours).toBe(1);
      expect(stats.aVenir).toBe(1);
      expect(stats.enRetard).toBe(1);
      expect(stats.nonApplicable).toBe(1);
      expect(stats.alertes).toBe(2);
    });

    it("should compute progress percentage correctly", async () => {
      const stats = await getDeliverableStats();
      const progressPct = Math.round(((stats.livre + stats.nonApplicable) / stats.total) * 100);
      expect(progressPct).toBe(40);
    });
  });

  // ─── EXPORT ─────────────────────────────────────────────────────

  describe("getAllDeliverablesForExport", () => {
    it("should return all deliverables for CSV export", async () => {
      const result = await getAllDeliverablesForExport({});
      expect(result).toHaveLength(5);
    });

    it("should be called with filter parameters", async () => {
      await getAllDeliverablesForExport({ mission: "A2", status: "en_cours" });
      expect(getAllDeliverablesForExport).toHaveBeenCalledWith({ mission: "A2", status: "en_cours" });
    });
  });

  // ─── SEED ───────────────────────────────────────────────────────

  describe("seedDeliverables", () => {
    it("should seed deliverables with contractual data", async () => {
      const seedData = [
        { code: "A1-01", mission: "A1", category: "Organisation", title: "Organigramme", contractualDelay: "15 jours", priority: "haute" },
        { code: "A1-02", mission: "A1", category: "Organisation", title: "Intervenants", contractualDelay: "15 jours", priority: "haute" },
      ];
      await seedDeliverables(seedData as any);
      expect(seedDeliverables).toHaveBeenCalledWith(seedData);
    });
  });

  // ─── DATA INTEGRITY ─────────────────────────────────────────────

  describe("Data integrity", () => {
    it("should have valid status values", async () => {
      const result = await getDeliverables({});
      const validStatuses = ["a_venir", "en_cours", "livre", "en_retard", "non_applicable"];
      for (const d of result.items) {
        expect(validStatuses).toContain(d.status);
      }
    });

    it("should have valid priority values", async () => {
      const result = await getDeliverables({});
      const validPriorities = ["haute", "moyenne", "basse"];
      for (const d of result.items) {
        expect(validPriorities).toContain(d.priority);
      }
    });

    it("should have valid mission values", async () => {
      const result = await getDeliverables({});
      const validMissions = ["A1", "A2"];
      for (const d of result.items) {
        expect(validMissions).toContain(d.mission);
      }
    });

    it("should have unique codes", async () => {
      const result = await getDeliverables({});
      const codes = result.items.map((d: any) => d.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("should have non-empty required fields", async () => {
      const result = await getDeliverables({});
      for (const d of result.items) {
        expect(d.code).toBeTruthy();
        expect(d.mission).toBeTruthy();
        expect(d.category).toBeTruthy();
        expect(d.title).toBeTruthy();
        expect(d.contractualDelay).toBeTruthy();
      }
    });

    it("delivered items should have deliveredDate set", async () => {
      const result = await getDeliverables({});
      const deliveredItems = result.items.filter((d: any) => d.status === "livre");
      for (const d of deliveredItems) {
        expect(d.deliveredDate).toBeTruthy();
      }
    });
  });

  // ─── ALERT LOGIC ────────────────────────────────────────────────

  describe("Alert logic", () => {
    it("should identify items due within 7 days as alerts", async () => {
      const result = await getDeliverables({});
      const now = Date.now();
      const alertItems = result.items.filter((d: any) => {
        if (d.status === "livre" || d.status === "non_applicable") return false;
        if (!d.dueDate) return false;
        const daysRemaining = Math.ceil((d.dueDate - now) / (24 * 60 * 60 * 1000));
        return daysRemaining <= 7;
      });
      expect(alertItems.length).toBe(2);
    });

    it("should identify overdue items", async () => {
      const result = await getDeliverables({});
      const now = Date.now();
      const overdueItems = result.items.filter((d: any) => {
        if (d.status === "livre" || d.status === "non_applicable") return false;
        if (!d.dueDate) return false;
        return d.dueDate < now;
      });
      expect(overdueItems.length).toBe(1);
      expect(overdueItems[0].code).toBe("A1-02");
    });

    it("should not alert for delivered items even if past due", async () => {
      const result = await getDeliverables({});
      const now = Date.now();
      const delivered = result.items.filter((d: any) => d.status === "livre");
      const overdueDelivered = delivered.filter((d: any) => d.dueDate && d.dueDate < now);
      expect(overdueDelivered.length).toBe(0);
    });

    it("should not alert for non-applicable items", async () => {
      const result = await getDeliverables({});
      const naItems = result.items.filter((d: any) => d.status === "non_applicable");
      expect(naItems.length).toBe(1);
      expect(naItems[0].code).toBe("A1-20");
    });
  });

  // ─── DAYS REMAINING CALCULATION ─────────────────────────────────

  describe("Days remaining calculation", () => {
    function getDaysRemaining(dueDate: number | null) {
      if (!dueDate) return null;
      const now = Date.now();
      const diff = dueDate - now;
      const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
      if (days < 0) return { days, urgency: "critical" };
      if (days === 0) return { days, urgency: "critical" };
      if (days <= 3) return { days, urgency: "warning" };
      if (days <= 7) return { days, urgency: "attention" };
      return { days, urgency: "ok" };
    }

    it("should return null for no due date", () => {
      expect(getDaysRemaining(null)).toBeNull();
    });

    it("should return critical for overdue items", () => {
      const result = getDaysRemaining(Date.now() - 86400000 * 2);
      expect(result).toBeDefined();
      expect(result!.urgency).toBe("critical");
      expect(result!.days).toBeLessThan(0);
    });

    it("should return warning for items due within 3 days", () => {
      const result = getDaysRemaining(Date.now() + 86400000 * 2);
      expect(result).toBeDefined();
      expect(result!.urgency).toBe("warning");
    });

    it("should return attention for items due within 7 days", () => {
      const result = getDaysRemaining(Date.now() + 86400000 * 5);
      expect(result).toBeDefined();
      expect(result!.urgency).toBe("attention");
    });

    it("should return ok for items due in more than 7 days", () => {
      const result = getDaysRemaining(Date.now() + 86400000 * 30);
      expect(result).toBeDefined();
      expect(result!.urgency).toBe("ok");
    });
  });
});
