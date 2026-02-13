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
  getBpuItems, getAllBpuCategories, getBpuItemById,
  getInterventionBpuLines, addBpuLine, removeBpuLine,
  createDevisAnalyse, updateDevisAnalyse, getDevisAnalyseById, listDevisAnalyses, deleteDevisAnalyse,
  createDevisLines, getDevisLines, getAllBpuItems,
  getSuiviEntries, getSuiviEntryById, createSuiviEntry, updateSuiviEntry, deleteSuiviEntry, getAllSuiviForExport,
} from "./db";
import { CONTRACTUAL_DELAYS } from "@shared/e2mt2";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

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
        contractor: z.string().optional(),
        description: z.string().optional(),
        title: z.string().optional(),
        d1Met: z.number().optional(),
        d2Met: z.number().optional(),
        quoteNumber: z.string().optional(),
        amount: z.string().optional(),
        validationKnitiv: z.string().optional(),
        connectImmoRef: z.string().optional(),
        daNumber: z.string().optional(),
        cdaNumber: z.string().optional(),
        pvNumber: z.string().optional(),
        receptionNumber: z.string().optional(),
        atNumber: z.string().optional(),
        axeLocal: z.string().optional(),
        axeCentral: z.string().optional(),
        dateDacia: z.number().optional(),
        clotureAt: z.number().optional(),
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

  // ===== BPU =====
  bpu: router({
    list: protectedProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return getBpuItems(input);
      }),

    categories: protectedProcedure.query(async () => {
      return getAllBpuCategories();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getBpuItemById(input.id);
      }),

    interventionLines: protectedProcedure
      .input(z.object({ interventionId: z.number() }))
      .query(async ({ input }) => {
        return getInterventionBpuLines(input.interventionId);
      }),

    addLine: protectedProcedure
      .input(z.object({
        interventionId: z.number(),
        bpuItemId: z.number(),
        quantity: z.string(),
        unitPriceHT: z.string(),
        totalHT: z.string(),
      }))
      .mutation(async ({ input }) => {
        await addBpuLine(input as any);
        return { success: true };
      }),

    removeLine: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await removeBpuLine(input.id);
        return { success: true };
      }),
  }),

  // ===== DEVIS ANALYSIS =====
  devis: router({
    list: protectedProcedure
      .input(z.object({
        verdict: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        return listDevisAnalyses(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const devis = await getDevisAnalyseById(input.id);
        if (!devis) return null;
        const lines = await getDevisLines(input.id);
        return { ...devis, lines };
      }),

    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileBase64: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // 1. Upload file to S3
        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        const fileKey = `devis/${nanoid()}-${input.fileName}`;
        const { url: fileUrl } = await storagePut(fileKey, fileBuffer, input.contentType);

        // 2. Create initial record
        const devisId = await createDevisAnalyse({
          fileName: input.fileName,
          fileUrl,
          verdict: "en_cours",
          uploadedBy: ctx.user?.id ?? null,
        } as any);

        // 3. Analyze with LLM (async, don't block)
        analyzeDevisWithLLM(devisId, fileUrl, input.contentType).catch((err) => {
          console.error("Devis analysis failed:", err);
          updateDevisAnalyse(devisId, {
            verdict: "a_reverifier",
            verdictReason: `Erreur d'analyse automatique: ${err.message}`,
          } as any).catch(console.error);
        });

        return { id: devisId, fileUrl };
      }),

    reanalyze: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const devis = await getDevisAnalyseById(input.id);
        if (!devis) throw new Error("Devis not found");
        await updateDevisAnalyse(input.id, { verdict: "en_cours", verdictReason: null } as any);
        analyzeDevisWithLLM(input.id, devis.fileUrl, "application/pdf").catch((err) => {
          console.error("Devis re-analysis failed:", err);
          updateDevisAnalyse(input.id, {
            verdict: "a_reverifier",
            verdictReason: `Erreur de ré-analyse: ${err.message}`,
          } as any).catch(console.error);
        });
        return { success: true };
      }),

    updateVerdict: protectedProcedure
      .input(z.object({
        id: z.number(),
        verdict: z.enum(["valide", "a_reverifier", "rejete"]),
        verdictReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateDevisAnalyse(input.id, {
          verdict: input.verdict,
          verdictReason: input.verdictReason ?? null,
        } as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteDevisAnalyse(input.id);
        return { success: true };
      }),
  }),

  // ===== ASSISTANT IA =====
  assistant: router({
    ask: protectedProcedure
      .input(z.object({
        question: z.string().min(1),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        // Get BPU data for context
        const bpuItemsList = await getAllBpuItems();
        const bpuContext = bpuItemsList.map((b: any) => `${b.code}: ${b.name} | ${b.priceHT}\u20ac HT/${b.unit || 'unit\u00e9'} | Cat\u00e9gorie: ${b.category}`).join("\n");

        // Build conversation messages
        const messages: any[] = [
          {
            role: "system" as const,
            content: `Tu es un assistant expert du contrat E2MT\u00b2 (Entretien, Exploitation et Maintenance Multi-Techniques de 2\u00e8me g\u00e9n\u00e9ration) de la SNCF.
Tu connais parfaitement le cahier des charges, le BPU (Bordereau de Prix Unitaires), les d\u00e9lais contractuels et toutes les r\u00e8gles du contrat.

Voici les informations cl\u00e9s du contrat :

## Contexte g\u00e9n\u00e9ral
Le contrat E2MT\u00b2 couvre l'entretien, l'exploitation et la maintenance des installations techniques des b\u00e2timents SNCF (GPU - Gestion du Patrimoine Urbain). Il est divis\u00e9 en 18 lots g\u00e9ographiques et 5 portefeuilles de b\u00e2timents.

## Lots g\u00e9ographiques (18 lots)
| Lot | R\u00e9gion | Nb B\u00e2timents | Surface |
|-----|--------|-------------|--------|
| 1.1 | Hauts de France | 1190 | 621 229 m\u00b2 |
| 1.2 | Normandie | 682 | 311 096 m\u00b2 |
| 2.1 | Champagne-Ardenne-Lorraine | 556 | 412 717 m\u00b2 |
| 2.2 | Alsace | 219 | 284 844 m\u00b2 |
| 3.1 | Auvergne-Rh\u00f4ne-Alpes | 965 | 724 037 m\u00b2 |
| 3.2 | Bourgogne-Franche-Comt\u00e9 | 695 | 428 522 m\u00b2 |
| 4.1 | Occitanie | 760 | 412 476 m\u00b2 |
| 4.2 | Provence-Alpes-C\u00f4te d'Azur | 430 | 336 434 m\u00b2 |
| 5.1 | Aquitaine | 402 | 275 636 m\u00b2 |
| 5.2 | Poitou-Charentes-Limousin | 378 | 196 906 m\u00b2 |
| 6.1 | Bretagne \u2013 Pays de la Loire | 543 | 345 017 m\u00b2 |
| 6.2 | Centre | 389 | 273 918 m\u00b2 |
| 7.1 | Saint-Denis | 60 | 195 487 m\u00b2 |
| 7.2 | Paris Rive-Gauche | 487 | 585 751 m\u00b2 |
| 8.1 | Paris Nord | 404 | 333 160 m\u00b2 |
| 8.2 | Paris Saint Lazare | 484 | 313 698 m\u00b2 |
| 9.1 | Paris Est | 384 | 380 659 m\u00b2 |
| 9.2 | Paris Sud Est | 395 | 484 466 m\u00b2 |

## Portefeuilles de b\u00e2timents
5 portefeuilles : Industriel, Ferroviaire, Gares, Tertiaire, Social

## Missions C - Types de travaux (14 sous-missions)
| Code | Domaine technique |
|------|-------------------|
| C1a | CVC (Chauffage, Ventilation, Climatisation) |
| C1b | D\u00e9senfumage |
| C2 | Protection incendie |
| C3 | Fermetures motoris\u00e9es |
| C4 | Syst\u00e8mes GTC/GTB |
| C5 | Syst\u00e8mes de s\u00e9curit\u00e9 incendie |
| C6 | Clos et couvert |
| C7 | \u00c9lectricit\u00e9 courants forts |
| C8 | Appareils de levage |
| C9 | Ascenseurs et monte-charges |
| C10 | Plomberie |
| C11 | \u00c9clairage |
| C12 | Second \u0153uvre |
| C13 | \u00c9lectricit\u00e9 courants faibles |
| C14 | Extincteurs |

## Types de maintenance
- MPREV : Maintenance pr\u00e9ventive syst\u00e9matique
- MREG : Maintenance pr\u00e9ventive r\u00e9glementaire
- MCOR : Maintenance corrective

## Niveaux de maintenance (5 niveaux)
| Niveau | Description |
|--------|-------------|
| N1 | Action simple, \u00e9l\u00e9ment facilement accessible |
| N2 | Action avec proc\u00e9dure simple |
| N3 | Op\u00e9ration avec proc\u00e9dure complexe |
| N4 | Op\u00e9ration avec ma\u00eetrise technologie particuli\u00e8re |
| N5 | Op\u00e9ration de r\u00e9novation ou reconstruction |

## Niveaux de criticit\u00e9
| Criticit\u00e9 | Description |
|-----------|-------------|
| C1 | Installations critiques - d\u00e9faillance remettant en cause l'activit\u00e9 ou la s\u00e9curit\u00e9 |
| C2 | Autres installations - conditions de confort ou fonctionnement |

## D\u00e9lais contractuels
| Criticit\u00e9 | D1 - D\u00e9pannage | Arriv\u00e9e sur site | D2 - Remise en \u00e9tat d\u00e9finitif |
|-----------|----------------|------------------|------------------------------|
| C1 | 8 heures | 2h (15min si sur site) | 2 jours ouvr\u00e9s |
| C2 | 8 heures ouvr\u00e9es | 4h ouvr\u00e9es | 8 jours ouvr\u00e9s |
Pour C8/C9 (ascenseurs) en cas de personne bloqu\u00e9e : D1 = 45 minutes.

## Horaires
- Jours ouvr\u00e9s : lundi-vendredi hors f\u00e9ri\u00e9s, 8h-18h
- Astreinte : 24h/24, 7j/7

## Missions F - Prestations connexes
Lorsqu'une demande provient de la DIT, il faut appliquer les prestations connexes du contrat E2MT (missions F).

## BPU - Bordereau de Prix Unitaires (Lot 4.1 - Occitanie)
Voici le r\u00e9f\u00e9rentiel de prix contractuel :\n${bpuContext}

R\u00e8gles de r\u00e9ponse :
- R\u00e9ponds toujours en fran\u00e7ais
- Sois pr\u00e9cis et cite les r\u00e9f\u00e9rences du contrat quand c'est pertinent
- Si tu n'es pas s\u00fbr d'une information, dis-le clairement
- Utilise le format Markdown pour structurer tes r\u00e9ponses
- Pour les questions sur les prix, r\u00e9f\u00e8re-toi au BPU ci-dessus
- Pour les questions sur les d\u00e9lais, r\u00e9f\u00e8re-toi aux d\u00e9lais contractuels D1/D2`,
          },
        ];

        // Add conversation history
        if (input.conversationHistory) {
          for (const msg of input.conversationHistory) {
            messages.push({ role: msg.role as any, content: msg.content });
          }
        }

        // Add current question
        messages.push({ role: "user" as const, content: input.question });

        const result = await invokeLLM({ messages });
        const answer = result.choices[0]?.message?.content;
        if (!answer || typeof answer !== "string") {
          throw new Error("L'assistant n'a pas pu g\u00e9n\u00e9rer de r\u00e9ponse");
        }

        return { answer };
      }),
  }),

  // ===== SUIVI (Tableau de suivi Excel) =====
  suivi: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        prestataire: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return getSuiviEntries(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getSuiviEntryById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        prestataire: z.string().optional(),
        ut: z.string().optional(),
        bat: z.string().optional(),
        intitule: z.string().optional(),
        numDevis: z.string().optional(),
        dateDevis: z.string().optional(),
        montant: z.string().optional(),
        validationKnitiv: z.string().optional(),
        numConnectImmo: z.string().optional(),
        numDA: z.string().optional(),
        numCDA: z.string().optional(),
        pv: z.string().optional(),
        numReception: z.string().optional(),
        numAT: z.string().optional(),
        axeLocal: z.string().optional(),
        axeCentral: z.string().optional(),
        dateDacia: z.string().optional(),
        clotureAT: z.string().optional(),
        commentaires: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createSuiviEntry(input as any);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        prestataire: z.string().optional(),
        ut: z.string().optional(),
        bat: z.string().optional(),
        intitule: z.string().optional(),
        numDevis: z.string().optional(),
        dateDevis: z.string().optional(),
        montant: z.string().optional(),
        validationKnitiv: z.string().optional(),
        numConnectImmo: z.string().optional(),
        numDA: z.string().optional(),
        numCDA: z.string().optional(),
        pv: z.string().optional(),
        numReception: z.string().optional(),
        numAT: z.string().optional(),
        axeLocal: z.string().optional(),
        axeCentral: z.string().optional(),
        dateDacia: z.string().optional(),
        clotureAT: z.string().optional(),
        commentaires: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSuiviEntry(id, data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSuiviEntry(input.id);
        return { success: true };
      }),

    exportAll: protectedProcedure
      .input(z.object({
        prestataire: z.string().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getAllSuiviForExport(input);
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

// ===== LLM DEVIS ANALYSIS =====
async function analyzeDevisWithLLM(devisId: number, fileUrl: string, contentType: string) {
  // 1. Get all BPU items for comparison
  const bpuItemsList = await getAllBpuItems();
  const bpuSummary = bpuItemsList.map((b: any) => `${b.code}: ${b.name} | ${b.priceHT}€ HT/${b.unit || 'unité'} | Cat: ${b.category}`).join("\n");

  // 2. Call LLM to extract devis data
  const isImage = contentType.startsWith("image/");
  const contentPart = isImage
    ? { type: "image_url" as const, image_url: { url: fileUrl, detail: "high" as const } }
    : { type: "file_url" as const, file_url: { url: fileUrl, mime_type: "application/pdf" as const } };

  const extractionResult = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en analyse de devis de maintenance immobilière pour la SNCF (contrat E2MT²).
Tu dois extraire les informations d'un devis et les comparer au Bordereau de Prix Unitaires (BPU) contractuel.

Voici le BPU de référence :\n${bpuSummary}

Règles d'analyse :
- Extrais chaque ligne de prestation du devis avec : description, quantité, prix unitaire, total
- Pour chaque ligne, trouve la correspondance la plus proche dans le BPU
- Calcule l'écart en % entre le prix du devis et le prix BPU
- Écart < 5% = conforme, 5-15% = ecart_faible, > 15% = ecart_fort
- Si aucune correspondance BPU = non_trouve
- Verdict global : "valide" si toutes les lignes sont conformes ou ecart_faible, "a_reverifier" si au moins une ligne a un ecart_fort ou non_trouve, "rejete" si le total dépasse de plus de 20% le total BPU théorique`,
      },
      {
        role: "user",
        content: [
          contentPart,
          { type: "text" as const, text: "Analyse ce devis et extrais toutes les informations. Réponds en JSON." },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "devis_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            contractor: { type: "string", description: "Nom du prestataire" },
            devisNumber: { type: "string", description: "Numéro du devis" },
            devisDate: { type: "string", description: "Date du devis" },
            totalHT: { type: "number", description: "Total HT du devis" },
            totalTTC: { type: "number", description: "Total TTC du devis" },
            verdict: { type: "string", enum: ["valide", "a_reverifier", "rejete"], description: "Verdict global" },
            verdictReason: { type: "string", description: "Explication du verdict" },
            ecartGlobalPct: { type: "number", description: "Écart global en % par rapport au BPU" },
            lines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" },
                  totalPrice: { type: "number" },
                  unit: { type: "string" },
                  matchedBpuCode: { type: "string", description: "Code BPU correspondant ou vide" },
                  bpuUnitPrice: { type: "number", description: "Prix unitaire BPU ou 0" },
                  ecartPct: { type: "number", description: "Écart en % par rapport au BPU" },
                  lineStatus: { type: "string", enum: ["conforme", "ecart_faible", "ecart_fort", "non_trouve"] },
                  matchConfidence: { type: "number", description: "Confiance du matching 0-100" },
                },
                required: ["description", "quantity", "unitPrice", "totalPrice", "unit", "matchedBpuCode", "bpuUnitPrice", "ecartPct", "lineStatus", "matchConfidence"],
                additionalProperties: false,
              },
            },
          },
          required: ["contractor", "devisNumber", "devisDate", "totalHT", "totalTTC", "verdict", "verdictReason", "ecartGlobalPct", "lines"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = extractionResult.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM returned empty content");
  }

  const analysis = JSON.parse(content);

  // 3. Update devis record
  await updateDevisAnalyse(devisId, {
    contractor: analysis.contractor || null,
    devisNumber: analysis.devisNumber || null,
    devisDate: analysis.devisDate || null,
    totalHT: analysis.totalHT ? String(analysis.totalHT) : null,
    totalTTC: analysis.totalTTC ? String(analysis.totalTTC) : null,
    verdict: analysis.verdict,
    verdictReason: analysis.verdictReason || null,
    ecartGlobalPct: analysis.ecartGlobalPct != null ? String(analysis.ecartGlobalPct) : null,
    rawExtraction: analysis,
  } as any);

  // 4. Insert devis lines
  if (analysis.lines && analysis.lines.length > 0) {
    // Find BPU IDs for matched codes
    const bpuMap = new Map(bpuItemsList.map((b: any) => [b.code, b.id]));
    const lines = analysis.lines.map((line: any) => ({
      devisId,
      description: line.description,
      quantity: line.quantity ? String(line.quantity) : null,
      unitPrice: line.unitPrice ? String(line.unitPrice) : null,
      totalPrice: line.totalPrice ? String(line.totalPrice) : null,
      unit: line.unit || null,
      matchedBpuId: line.matchedBpuCode ? (bpuMap.get(line.matchedBpuCode) ?? null) : null,
      matchedBpuCode: line.matchedBpuCode || null,
      bpuUnitPrice: line.bpuUnitPrice ? String(line.bpuUnitPrice) : null,
      ecartPct: line.ecartPct != null ? String(line.ecartPct) : null,
      lineStatus: line.lineStatus || "non_trouve",
      matchConfidence: line.matchConfidence != null ? String(line.matchConfidence) : null,
    }));
    await createDevisLines(lines);
  }

  console.log(`Devis ${devisId} analyzed: ${analysis.verdict} (${analysis.lines?.length || 0} lines)`);
}
