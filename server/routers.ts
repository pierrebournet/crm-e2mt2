import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllLots, getAllWorkTypes,
  getBuildings, getBuildingById, createBuilding, updateBuilding,
  getInterventions, getInterventionById, createIntervention, updateIntervention, generateReference,
  getCommentsByIntervention, addComment,
  getHistoryByIntervention, addHistoryEntry,
  getDashboardStats,
  getAlerts, createAlert, acknowledgeAlert,
  getAllInterventionsForExport,
} from "./db";
import { CONTRACTUAL_DELAYS } from "@shared/e2mt2";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== REFERENCE DATA =====
  lots: router({
    list: publicProcedure.query(async () => {
      return getAllLots();
    }),
  }),

  workTypes: router({
    list: publicProcedure.query(async () => {
      return getAllWorkTypes();
    }),
  }),

  // ===== BUILDINGS =====
  buildings: router({
    list: protectedProcedure
      .input(z.object({
        lotId: z.number().optional(),
        portfolio: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        return getBuildings(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getBuildingById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        lotId: z.number(),
        portfolio: z.enum(["Industriel", "Ferroviaire", "Gares", "Tertiaire", "Social"]),
        address: z.string().optional(),
        surface: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createBuilding(input as any);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().optional(),
        lotId: z.number().optional(),
        portfolio: z.enum(["Industriel", "Ferroviaire", "Gares", "Tertiaire", "Social"]).optional(),
        address: z.string().optional(),
        surface: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateBuilding(id, data as any);
        return { success: true };
      }),
  }),

  // ===== INTERVENTIONS =====
  interventions: router({
    list: protectedProcedure
      .input(z.object({
        buildingId: z.number().optional(),
        workTypeId: z.number().optional(),
        criticality: z.string().optional(),
        maintenanceType: z.string().optional(),
        status: z.string().optional(),
        lotId: z.number().optional(),
        startDateFrom: z.number().optional(),
        startDateTo: z.number().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        return getInterventions(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getInterventionById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        buildingId: z.number(),
        workTypeId: z.number(),
        criticality: z.enum(["C1", "C2"]),
        maintenanceType: z.enum(["MPREV", "MREG", "MCOR"]),
        title: z.string().min(1),
        description: z.string().optional(),
        plannedDate: z.number().optional(),
        startDate: z.number().optional(),
        assignedTo: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const reference = await generateReference();
        const delays = CONTRACTUAL_DELAYS[input.criticality];
        const now = Date.now();
        const startDate = input.startDate ?? now;

        const data = {
          ...input,
          reference,
          createdBy: ctx.user?.id ?? null,
          startDate,
          d1Deadline: startDate + delays.d1 * 60 * 1000,
          d2Deadline: startDate + delays.d2 * 60 * 1000,
          status: input.startDate ? ("en_cours" as const) : ("planifie" as const),
        };

        const id = await createIntervention(data as any);

        // Alerte si criticité C1
        if (input.criticality === "C1") {
          await createAlert(id, "c1_creation", `Nouvelle intervention critique C1 créée : ${reference} - ${input.title}`);
          try {
            await notifyOwner({
              title: "🔴 Intervention critique C1",
              content: `Nouvelle intervention C1 créée : ${reference}\n${input.title}`,
            });
          } catch (e) {
            console.warn("Notification failed:", e);
          }
        }

        return { id, reference };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["planifie", "en_cours", "termine", "annule"]).optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        durationMinutes: z.number().optional(),
        assignedTo: z.string().optional(),
        description: z.string().optional(),
        title: z.string().optional(),
        d1Met: z.number().optional(),
        d2Met: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const existing = await getInterventionById(id);
        if (!existing) throw new Error("Intervention not found");

        // Track changes
        const userId = ctx.user?.id ?? null;
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) {
            const oldVal = (existing as any)[key];
            if (String(oldVal) !== String(value)) {
              await addHistoryEntry(id, userId, key, String(oldVal ?? ""), String(value));
            }
          }
        }

        // Auto-calculate duration and deadline compliance
        if (data.status === "termine" && data.endDate) {
          const startDate = data.startDate ?? existing.startDate;
          if (startDate) {
            data.durationMinutes = Math.round((data.endDate - Number(startDate)) / 60000);
          }
          // Check D1 compliance
          if (existing.d1Deadline) {
            data.d1Met = data.endDate <= Number(existing.d1Deadline) ? 1 : 0;
          }
          // Check D2 compliance
          if (existing.d2Deadline) {
            data.d2Met = data.endDate <= Number(existing.d2Deadline) ? 1 : 0;
          }

          // Alert if deadlines not met
          if (data.d1Met === 0) {
            await createAlert(id, "d1_depassement", `Dépassement délai D1 : ${existing.reference} - ${existing.title}`);
            try {
              await notifyOwner({
                title: "⚠️ Dépassement délai D1",
                content: `L'intervention ${existing.reference} a dépassé le délai D1 de dépannage.\n${existing.title}`,
              });
            } catch (e) {
              console.warn("Notification failed:", e);
            }
          }
          if (data.d2Met === 0) {
            await createAlert(id, "d2_depassement", `Dépassement délai D2 : ${existing.reference} - ${existing.title}`);
            try {
              await notifyOwner({
                title: "⚠️ Dépassement délai D2",
                content: `L'intervention ${existing.reference} a dépassé le délai D2 de remise en état.\n${existing.title}`,
              });
            } catch (e) {
              console.warn("Notification failed:", e);
            }
          }
        }

        // Set startDate if moving to en_cours
        if (data.status === "en_cours" && !existing.startDate && !data.startDate) {
          const now = Date.now();
          (data as any).startDate = now;
          const delays = CONTRACTUAL_DELAYS[existing.criticality as keyof typeof CONTRACTUAL_DELAYS];
          (data as any).d1Deadline = now + delays.d1 * 60 * 1000;
          (data as any).d2Deadline = now + delays.d2 * 60 * 1000;
        }

        await updateIntervention(id, data as any);
        return { success: true };
      }),

    comments: protectedProcedure
      .input(z.object({ interventionId: z.number() }))
      .query(async ({ input }) => {
        return getCommentsByIntervention(input.interventionId);
      }),

    addComment: protectedProcedure
      .input(z.object({
        interventionId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        await addComment(input.interventionId, ctx.user.id, input.content);
        return { success: true };
      }),

    history: protectedProcedure
      .input(z.object({ interventionId: z.number() }))
      .query(async ({ input }) => {
        return getHistoryByIntervention(input.interventionId);
      }),
  }),

  // ===== DASHBOARD =====
  dashboard: router({
    stats: protectedProcedure
      .input(z.object({ lotId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getDashboardStats(input?.lotId);
      }),
  }),

  // ===== ALERTS =====
  alerts: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ input }) => {
        return getAlerts(input?.limit);
      }),

    acknowledge: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await acknowledgeAlert(input.id);
        return { success: true };
      }),
  }),

  // ===== EXPORT =====
  export: router({
    interventions: protectedProcedure
      .input(z.object({
        lotId: z.number().optional(),
        workTypeId: z.number().optional(),
        criticality: z.string().optional(),
        status: z.string().optional(),
        startDateFrom: z.number().optional(),
        startDateTo: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return getAllInterventionsForExport(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
