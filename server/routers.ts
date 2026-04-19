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
  getDeliverables, getDeliverableById, createDeliverable, updateDeliverable, deleteDeliverable,
  getDeliverableStats, getAllDeliverablesForExport, seedDeliverables,
  getChecklistByIntervention, upsertChecklistStep, updateChecklistNote, initChecklistForIntervention, getChecklistSummaryForInterventions,
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
    uploadFile: protectedProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const maxSize = 16 * 1024 * 1024; // 16MB
        if (buffer.length > maxSize) {
          throw new Error("Le fichier dépasse la taille maximale de 16 Mo");
        }
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const fileKey = `assistant-docs/${Date.now()}-${randomSuffix}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        return { url, fileName: input.fileName, mimeType: input.mimeType };
      }),

    ask: protectedProcedure
      .input(z.object({
        question: z.string().min(1),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
        attachments: z.array(z.object({
          url: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
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
            content: `Tu es un assistant expert du contrat E2MT² (Entretien, Exploitation et Maintenance Multi-Techniques de 2ème génération) de la SNCF.
Tu connais parfaitement le cahier des charges, le BPU (Bordereau de Prix Unitaires), les délais contractuels, toutes les règles du contrat, les applications métier SNCF Immobilier et les procédures internes (demandes d'achat, Connect'Immo, etc.).

## Ton interlocuteur
Tu t'adresses à un **Pilote du contrat E2MT² pour la DIT (Direction Immobilière Territoriale) Grand Sud**.
- **Rôle** : Pilote de contrat — il assure le suivi opérationnel et le pilotage local du contrat E2MT² sur son périmètre.
- **Périmètre** : Lot 4.1 Occitanie (13 départements : 09, 11, 12, 30, 31, 32, 34, 46, 48, 65, 66, 81, 82).
- **DIT** : Direction Immobilière Territoriale Grand Sud (régions 47 Occitanie Ouest, 58 PACA, 59 Occitanie Est).
- **Titulaire du lot 4.1** : AXIMA CONCEPT.
- **Portefeuilles concernés** : 410 bâtiments hors Ferroviaire (148 Industriel, 161 Gare, 56 Tertiaire, 45 Social = 312 290 m²).
- **Donneurs d'ordres** : SNCF Immobilier (Industriel, Tertiaire, Social) et Gares & Connexions (Gares).
- **Ses missions quotidiennes** : suivi des interventions correctives et préventives, réception des OT dans iGO, validation des devis, suivi des livrables contractuels, organisation des réunions (COSUI, COPIL), contrôles qualité, suivi des plans de prévention, passage des DA dans l'ERP, suivi des prestations connexes.

Adapte tes réponses à ce contexte : sois concret, opérationnel, et donne des conseils pratiques directement applicables dans son quotidien de pilote DIT.

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
Lorsqu'une demande provient de la DIT, il faut appliquer les prestations connexes du contrat E2MT\u00b2 (missions F).

## Proc\u00e9dure de Demande d'Achat (DA) dans l'ERP PeopleSoft
### Cl\u00e9 comptable
La cl\u00e9 comptable est renseign\u00e9e d\u00e8s la cr\u00e9ation de la DA et v\u00e9hicul\u00e9e tout au long du processus achat :
- Compte G\u00e9n\u00e9ral : Classe 6 / Immo VS Non immo (remonte automatiquement via cat\u00e9gorie d'achat)
- Entit\u00e9 PC / Projet / Activit\u00e9 : Compte projet J*, E, G*
- Axe Central : Nomenclatur\u00e9 au niveau national : ZP*, PS*, PX*, P* (OPEX)
- Axe Local : Administr\u00e9 localement (lors de la cr\u00e9ation de l'AT dans IMMOSIS)

### BUPO selon SA
| SA | Code BUPO |
|---|---|
| SA SNCF | 67858 |
| SA Voyageurs | 05335 |
| SA R\u00e9seau | 00077 |
| SAS Fret | 00059 |

### Groupes d'achat selon montant
| Montant | Groupe d'achat |
|---|---|
| < 40 k\u20ac | 67099_004 DIT GS |
| 40 \u00e0 90 k\u20ac | 67099_014 CADI |
| > 90 k\u20ac | CAI locale |

### Seuils de consultation
| Montant | Obligation |
|---|---|
| < 50\u20ac | Note de frais (pas dans l'ERP) |
| 600\u20ac \u00e0 25k\u20ac | 1 devis minimum |
| 25k\u20ac \u00e0 40k\u20ac | Consultation simplifi\u00e9e (3 fournisseurs min) |
| > 40k\u20ac | Appel d'offre par DI ou CAI |

### Circuit d'approbation DA
1. Cr\u00e9ation DA \u2192 statut "en attente"
2. Approbation comptable par le contr\u00f4leur de gestion
3. Approbation hi\u00e9rarchique
4. DA approuv\u00e9e \u2192 transformation en CDA par le gestionnaire de commandes

### Sites destinataires Grand Sud
| Ville | Code |
|---|---|
| Marseille | SD001 |
| Montpellier | SD002 |
| Toulouse | SD003 |

## Connect'Immo - Architecture V3
Connect'Immo est l'application centrale de suivi des op\u00e9rations OPEX.
### Hi\u00e9rarchie des donn\u00e9es
Projet Alpha \u2192 Projet principal (AT ou OS) \u2192 Lignes commandes
- Un projet principal = une AT ou un OS
- Un projet cr\u00e9\u00e9 dispose automatiquement d'une premi\u00e8re commande
- L'UT-BAT renseign\u00e9 au niveau du projet principal est h\u00e9rit\u00e9 au niveau de la commande

### 5 cas d'usage Connect'Immo
1. AT r\u00e9gionale sans UT-BAT (contrats forfaitaires/EMT)
2. AT r\u00e9gionale avec UT-BAT au niveau commande (PTP)
3. AT non-r\u00e9gionale avec UT, sans BAT
4. AT non-r\u00e9gionale avec UT et BAT au niveau commande
5. AT non-r\u00e9gionale avec UT-BAT h\u00e9rit\u00e9 du projet

## Applications M\u00e9tier SNCF Immobilier (20 outils)
Voici les principales applications utilis\u00e9es par le pilote DIT :
- IMMOSIS : R\u00e9f\u00e9rentiel immobilier central, gestion du cycle de vie des actifs, cr\u00e9ation des axes locaux pour les AT
- ERP PeopleSoft : Gestion des achats (DA, CDA), suivi budg\u00e9taire, workflow de validation
- DACIA : Centralisation et fiabilisation des donn\u00e9es patrimoine, tableaux de bord
- Connect'Immo : Suivi des op\u00e9rations OPEX, gestion projets/commandes (AT/OS)
- Connect IS : Portail centralis\u00e9 consolidant les donn\u00e9es de diff\u00e9rentes applications
- DIGIPREV-GROUPE : D\u00e9mat\u00e9rialisation des plans de pr\u00e9vention (s\u00e9curit\u00e9)
- eCONSO DeepKi : Suivi des consommations \u00e9nerg\u00e9tiques (\u00e9lectricit\u00e9, gaz, eau)
- eFICHE_DEMOL : Gestion des fiches de d\u00e9molition de b\u00e2timents
- G\u00e9oprism : SIG (Syst\u00e8me d'Information G\u00e9ographique) pour la cartographie du patrimoine
- Carnet de Sant\u00e9 : Vision 360\u00b0 des b\u00e2timents avec saisie terrain et mode d\u00e9connect\u00e9
- GA\u00cfA : Gestion des achats et interventions
- Knitiv : GED maintenance, interface collaborative avec les prestataires E2MT\u00b2
- MA\u00cfS : Archives historiques (via le Centre des Archives Historiques)
- myHorizon : Gestion de projets immobilier \u00e0 long terme
- myPIM : Gestion de l'information patrimoine (donn\u00e9es techniques, admin, financi\u00e8res)
- PAM : Plan Amiante, gestion du risque amiante (DTA obligatoire avant travaux)
- SMAJIC : Gestion des sinistres majeurs (GED)
- SPA : Simplification des Plans d'Actions (suivi des plans d'actions)
- Kiz\u00e9o Forms : Formulaires terrain mobile (PEC, contr\u00f4les r\u00e9glementaires)
- Teams Microsoft : Collaboration et communication (hub central pour le pilotage)

## Guide Connect'Immo V.8 — Procédures détaillées (Power Apps SNCF Immobilier)

Connect'Immo est la solution informatique (Power Apps) de SNCF Immobilier pour la programmation, planification et pilotage des opérations de travaux et maintenance sur le parc immobilier SNCF. Elle permet aussi le suivi budgétaire des projets OPEX. Fonctionne exclusivement sur Google Chrome.

### Navigation principale Connect'Immo (barre latérale)
- Accueil
- Création (Chantier, Projets, Commandes, MyH)
- Modification en masse (Filtrer par région / Filtrer par pilote)
- Reporting (Rapports OPEX)
- Planification
- Programmation
- Archives
- Guide utilisateur

### Créer un projet OPEX dans Connect'Immo — Procédure complète
1. Cliquer sur "Création" dans la barre latérale
2. Sélectionner le bouton radio "Projets"
3. Renseigner les champs obligatoires : DIT et Région
4. IMPORTANT : Vérifier d'abord via la Loupe si un projet existe déjà pour le même UT_BAT
5. Cliquer sur "+" pour créer une nouvelle opération
6. Fenêtre "Créer une opération" — Champs obligatoires (*) :
   - DIT* et Région* (pré-remplis depuis la page précédente, restent modifiables)
   - Agence*
   - UT* (saisir "MULTI" si inconnu)
   - Bien* (saisir "_MULTI" si inconnu)
   - Intitulé du projet*
   - Origine* (ex: Agence EDT)
   - Sous-types* (ex: Petits Travaux Propriétaire, Economies d'énergie...)
   - Gérants de programme* (ex: C32)
   - Attributaire* (valeur par défaut "A renseigner" autorisée)
7. Switch "Afficher les données budgétaires" = option d'aide à la décision (affiche suivi budgétaire exercice en cours)
8. Cliquer sur la Disquette pour enregistrer → message "Projet créé avec succès"
9. RÈGLE : À la création d'un projet, une commande par défaut est AUTOMATIQUEMENT créée
10. La fenêtre reste ouverte pour créer plusieurs opérations. Cliquer sur X pour fermer.
11. ID projet au format P-XX-XXXXXX (ex: P-23-001168)

### Détail du projet Connect'Immo — 7 onglets

**Onglet Emergence :**
- Switches (s'appliquent au projet ET à toutes ses commandes) : Démolition, Locatif, Mise en sécurité ferroviaire, Risques Ferroviaires, Pollution
- Champs : Intitulé du projet*, Statut du projet (Emergence, Transféré vers MyH...), Attributaire
- Infos affichées : Nom UT, Nom BAT, Numéro UEX, Libellé UEX, Nature du bien, Portefeuille, Propriétaire interne
- Codes comptables : RG, BUPO, DIVISION, BUGL
- Regroupement_transverse : liste de programmes prioritaires (Enveloppe RH IST 4.4, ADAP, AUTRES (C2MI/PLI/VRD), ECO NRJ DECARBONATION, MIXITE, MEC MCO MES CEPIA)
- Pôle : liste déroulante uniquement pour DI IDF (TERTIAIRE CAMPUS, IDF hors Paris et Campus, TERTIAIRE Paris)

**Onglet Prévision pluriannuelle :** Planification budgétaire sur plusieurs années.

**Onglet Ouverture AT/OS :**
- Renseigner le N° AT/OS
- RÈGLE D'UNICITÉ : un N° AT/OS ne peut être utilisé que sur UN SEUL projet
- Si le N° AT/OS n'existe pas dans la liste → bouton "Ajouter un nouveau N° AT/OS"
- Si le N° AT/OS existe déjà → message d'erreur → rechercher le projet existant et y ajouter des commandes
- Après saisie, cliquer sur "Enregistrer" pour vérifier l'unicité

**Onglet Démolition (si switch activé) :**
- Surface démolie récupérée automatiquement d'Immosis Inventaire
- Les données saisies appartiennent à la commande sélectionnée
- Les switches Démolition correspondent au projet et s'appliquent à toutes les commandes

**Onglet Synthèse commande(s) :**
- Créer, supprimer, visualiser toutes les commandes rattachées au projet
- Bouton "+" pour créer une nouvelle commande
- Bouton Corbeille pour supprimer (SAUF la 1ère commande par défaut → règle : Un projet + 1 CDA minimum)
- Cliquer sur la flèche > pour accéder au détail d'une commande

**Onglet Demande de devis :**
- Switches spécifiques à la commande sélectionnée (pas au projet)
- Menu déroulant pour sélectionner la commande parmi celles du projet
- Renseigner : N° de devis, N° DA, N° CDA, N° de réception
- IMPORTANT : C'est le renseignement de ces 4 numéros qui alimente les quartiers colorés du statut de la commande

**Onglet Vie de la commande :**
- Renseigner la Référence du contrat pour chaque commande (liste déroulante + "Ajouter un nouveau N° de contrat")
- BONNE PRATIQUE : Quand les champs "Axe local" et "Axe central" ne sont pas valorisés → vérifier 2 choses :
  1. N° AT/OS bien renseigné et enregistré dans "Ouverture AT/OS"
  2. Bonne "Référence du contrat" dans "Vie de la commande" pour chaque commande du même projet

### Montant total commandé
Le "Montant total commandé" affiché en haut de la fiche projet = somme des "Montants CDA" de toutes les commandes rattachées à ce projet OPEX.

### Attribuer un N° AT/OS — 2 méthodes
**Méthode 1 : N° AT/OS jamais utilisé**
1. Onglet "Ouverture AT/OS" > Sélectionner dans la liste déroulante
2. Si inexistant → "Ajouter un nouveau N° AT/OS" > Saisir le numéro > Enregistrer
3. Cliquer "Enregistrer" pour vérifier l'unicité

**Méthode 2 : N° AT/OS déjà utilisé sur un autre projet**
1. Message d'erreur si on tente de l'utiliser sur un nouveau projet
2. Solution : rechercher le projet existant ("Modification en masse" > DIT + Région + N° AT/OS)
3. Ajouter de nouvelles commandes sur ce projet existant via "Synthèse commande(s)" > "+"

### Créer et gérer un chantier Connect'Immo
**Créer un nouveau chantier :**
1. Rubrique "Création" > Bouton radio "Chantier"
2. Renseigner DIT* et Région*
3. Lancer la recherche via la Loupe pour afficher les projets
4. Cocher les lignes des projets à associer (cases grisées = projets déjà associés à un autre chantier)
5. Cliquer sur la flèche droite pour les désigner
6. Cliquer sur "Créer le chantier"
- RÈGLE : Un projet ne peut être associé qu'à UN SEUL chantier à la fois
- Le montant total du chantier = somme des montants des ATs des projets associés

**Mettre à jour un chantier existant :**
1. Espace "Mise à jour du chantier existant" > Sélectionner le chantier > Chevron pour voir les projets
2. Ajouter des projets : cocher + flèche droite
3. Retirer des projets : cocher + flèche gauche
- RÈGLE : Un chantier avec un seul projet est automatiquement supprimé si ce projet est dissocié

### Consulter les projets/commandes OPEX et CAPEX MyHorizon
**Vue Projets (par défaut) :**
- Rubrique "Création" > bouton radio "Projets" > Filtres : DIT*, Région*, UT (facultatif), Bien (facultatif)
- Filtres 2ème rang : Pilote, Statut projet, Exercice, ID projet, Gérant de prog., Rech. Intitulé projet
- Bouton "Réinitialiser" pour effacer les filtres

**Vue Commandes :**
- Bouton radio "Commandes" > Les filtres géographiques sont conservés
- Filtres 2ème rang spécifiques aux commandes

**Vue My Horizon (CAPEX) :**
- Bouton radio "MyH" > Filtres : DIT*, Région*, Statut projet
- ATTENTION : Projets CAPEX en mode CONSULTATION uniquement (pas de modification dans Connect'Immo)

### Statut "Transféré vers MyH"
- Quand le statut du projet passe à "Transféré vers MyH" → renseigner l'ID_MyH (ex: DI__XXXXX)
- Cela permet de récupérer le commentaire production Connect'Immo dans le commentaire du projet CAPEX de myHorizon
- Les projets "Transféré vers MyH" disparaissent du tableau du programmateur pour éviter les doublons
- Seul le programmateur peut renseigner le "Commentaire programmation"

### Modification en masse Connect'Immo
**Filtrer par région :**
1. Rubrique "Modification en masse" > Vue par défaut : Projets
2. Filtres obligatoires : DIT* et Région* > Cliquer "Rechercher"
3. Filtres avancés : Pilote, Gérant de prog., N° AT, Sous-type, Statut, Démolition (Oui/Non/Vide)
4. Modifier les données directement dans le tableau
5. Cliquer "Enregistrer" pour sauvegarder
6. Basculer sur la vue "Commandes" pour modifier les commandes

**Filtrer par pilote :**
1. Onglet "Filtrer par pilote"
2. Filtres obligatoires : DIT* et Pilote*
3. Même principe de modification directe dans le tableau

### Actualiser l'UT_BAT d'un projet ou d'une commande
**Modifier l'UT_BAT d'un projet :**
1. Cliquer sur un onglet du projet > Bouton "Crayon"
2. Pop-up "Modification de l'UT_BAT détaillée" s'affiche (précise l'ID du projet)
3. Modifier l'UT et/ou le Bien du projet
4. Cliquer "Enregistrer" dédié au projet
5. IMPORTANT : Les nouvelles valeurs s'appliquent automatiquement aux FUTURES commandes, mais PAS aux commandes existantes → mettre à jour chaque commande séparément

**Modifier l'UT_BAT d'une commande :**
1. Onglet "Demande de devis" ou "Vie de la commande" > Bouton "Crayon"
2. Pop-up spécifique à la commande (précise ID projet + N° commande)
3. Modifier et enregistrer

### Principe de calcul du budget disponible
Activé via le switch "Afficher les données budgétaires" dans la pop-up de création.

**Étape 1 — Sélection des projets :**
- Mêmes critères géographiques (DIT/Région/Agence)
- Même gérant de programme (identifie la SA)
- Même sous-type (identifie la catégorie)
- Exclusions : Statuts Sans suite, Annulé, Transféré vers MyH ; Sous-types Compte-sinistre, Occupations sans titre, Logements, Régularisation, Gestion foncière

**Étape 2 — Sélection des commandes :**
- Date CDA = Exercice en cours
- Attributaire CDA = DIT, ABE ou Gestionnaire (ESSET)
- Montant CDA renseigné
- Regroupement par région (ou par agence pour DIT Grand Sud et Centre Ouest)
- Données du cadrage budgétaire récupérées de Perf'Eco

### Rapports OPEX Connect'Immo (BI)
- Menu "Reporting" > 3 rapports disponibles :
  1. Tableau complet des données en cours : commandes avec Date Fin travaux ≥ 1er janvier N-2
  2. Tableau complet des données projets : projets avec Date Fin travaux ≥ 1er janvier N-2
  3. Tableau complet des données antérieures à N-2 : commandes avec Date Fin travaux ≤ 31 décembre N-2
- Export : cliquer "..." > "Exporter des données" > "Exporter"

### Archiver des projets OPEX
- Archivage automatique le 31 juillet de chaque année
- Condition : la "Date de fin des travaux" doit être correctement renseignée
- Rubrique "Archives" pour consulter les projets archivés (mode consultation uniquement)

### Créer une commande dans Connect'Immo (procédure terrain)
1. Accéder au projet via "Modification en masse" ou "Création" > rechercher par ID projet
2. Flèche descendante : voir les travaux rattachés à l'AT
3. Flèche horizontale : nouvelle ligne
4. Onglet "SYNTHÈSE COMMANDE" > "+" > Crayon
5. Remplacer MULTI par UT et BIEN réels > Attendre validation
6. Remplir les champs > Enregistrer
7. Onglet "VIE DE LA COMMANDE" > Renseigner le montant > Enregistrer
8. Vérifier que l'axe central et l'axe local sont bien renseignés

### Astuces importantes Connect'Immo
- Sélectionner "MULTI" pour UT et/ou Bien quand les valeurs sont inconnues (AT générique)
- Mettre à jour l'UT_BAT des commandes APRÈS modification de l'UT_BAT du projet
- Renseigner correctement tous les champs (Intitulé du projet, Intitulé CDA)
- Ne JAMAIS supprimer les valeurs "A renseigner" par défaut (éviter les champs vides)
- Champs avec "A renseigner" par défaut : Gestionnaire d'actifs, Occupant bénéficiaire, N° AT/OS, N° de devis, N° DA, Détail fournisseur
- Toujours garder le champ "Gérant de programme" renseigné (valeur connue ou "A renseigner")
- 3 cas pour le Gérant de programme :
  1. UT_BAT connus à la création → valeur automatique
  2. UT_BAT renseignés après création (via Crayon) → "A renseigner" par défaut, à mettre à jour manuellement
  3. Projet régional (MULTI) → "A renseigner" par défaut

### Suppression dans Connect'Immo
- Supprimer un projet : sélectionner la ligne > icône Corbeille → supprime le projet ET TOUTES ses commandes
- Supprimer une commande : possible sauf la 1ère commande par défaut (règle : 1 projet = minimum 1 CDA)

### 5 cas d'usage Connect'Immo
1. AT régionale sans UT-BAT (contrats forfaitaires/EMT)
2. AT régionale avec UT-BAT au niveau commande (PTP)
3. AT non-régionale avec UT, sans BAT
4. AT non-régionale avec UT et BAT au niveau commande
5. AT non-régionale avec UT-BAT hérité du projet

## DA Spéciale ERP 9.2 - Mode opératoire détaillé

### Accès
- Page d'accueil ERP v9.2 > Boussole (NavBar) > Navigateur > eProcurement > Gérer demandes d'achat > Créer demande achat > Demandes spéciales

### 2 types de lignes spéciales
1. **Fournitures** : Décocher "Mnt seulement", renseigner Quantité + Prix unitaire + Date échéance
2. **Prestations/Travaux** : Cocher "Mnt seulement" (Quantité=1 fixe), renseigner Prix global + Date début + Date fin

### Champs obligatoires DA spéciale
- *Description article, *Quantité, *Prix, *Catégorie achat, *Unité de mesure, *Devise EUR
- Aide catégories : https://wikiachats.achats.sncf.fr/index.php/Wiki_SI_Achats_:_ERP
- Fournisseur (optionnel) : Code fournisseur, Site, Nom
- Informations complémentaires + cocher "Envoyer à fournisseur" si besoin

### Sélection BU PO (demandeur multi BU PO)
- Paramètres demande achat > Loupe Entité > Rechercher code BU PO

### Validation et soumission
1. Valider le panier
2. Compléter : Nom demande, Justification approbation, Commentaires et documents joints
3. Compléter le détail ligne : Acheteur (groupe d'achat), Informations contrat
4. Compléter les éléments comptables : Site destinataire, Lignes comptables (4 onglets clé comptable)
5. "Enreg. et soumettre" pour envoyer au circuit d'approbation

## Création d'AT dans IMMOSIS - Procédure complète

### Accès IMMOSIS
- URL : https://immosis.sncf.fr/rei/
- Connexion : N° CP + mot de passe Windows

### Créer une AT
1. Menu : Technique > Programmation des AT
2. Mettre le gérant de programme > "AJOUTER AT"
3. Renseigner : Région, Type, Nom (normalisation), UT, Ventilation, BAT
4. Cliquer "+" jaune > Indiquer type et montant sur l'année concernée

### Normalisation du nom de l'AT
- Toujours : N° Région + Année
- AT annuelles : + Propriétaire + Portefeuille
- Autres AT : + Propriétaire + Portefeuille + UT + BAT + Nature de l'opération

### Changements d'état obligatoires
Émergent → Initialisée → Programmée → Promotionner

### Contractualisation
1. Onglet "Contractualise" > "Créer un contrat"
2. Donneur d'ordre (= propriétaire, ex: 02533) + Fournisseur (ESBE ou Tiers) + Montant
3. Valider l'avenant > L'axe local se génère à midi ou minuit

### Retrouver un Axe Local
- Menu : Dossier > Dossier Technique > Filtre par N° AT > Onglet "Contractualisation"

### Annuler une AT
- Condition : AT non contractualisée uniquement
- Onglet "Général" > "Action" > "Changer d'état" > "ANNULÉ" > Valider

### Clôturer une AT
- Sans modification : Onglet "Général" > "Action" > "Changer d'état" > "CLÔTURE"
- Avec modification montant : Onglet "Suivi Budgétaire" > Modifier montant > puis clôturer
- À 0€ : Contractualisation (montant à 0€) + Suivi Budgétaire (montant à 0€ + ventilation accostage global) > puis clôturer

## TUTO iGO (Coswin) - GMAO
### Accès et paramétrage
- Navigateur obligatoire : FIREFOX
- Paramétrer sur son périmètre dès la première connexion
- Cliquer sur le cône "ordres de travail" pour accéder à la liste des OT
- Gestion colonnes : clic droit sur titre > Colonne > Gestion des colonnes
- Enregistrer filtre : "+" vert avec entonnoir puis disquette rouge
- Export Excel : logo avec le X

### Filtres recommandés
- Filtre principal sur N° UT (travail quotidien)
- Filtre sans restriction (recherche OT mal orientées/paramétrées)

### Statuts OT iGO
| Statut | Signification |
|--------|---------------|
| 1 | Affecté |
| 3 | En cours |
| 4 | Terminé |
| 5 | Clôturé |
| 6 | Réceptionné |
| 7 | Non valide (refusé par le pilote) |
| 8 | À réviser (refusé par l'occupant) |
| 9 | Annulé |
| 10 | Non réalisable |
| 11 | Non réalisé |

### Actions sur une OT
- Commentaires : onglet "Commentaire" pour lire/écrire
- Origine OT : onglet "Origine OT" pour connaître le demandeur
- Réparation provisoire : mettre date quand mainteneur ne peut pas réparer immédiatement (demandé par QUADRIM)

### Créer un OT dans iGO
1. Accueil > "Ajouter un OT"
2. Vérifier nom demandeur, degré urgence, CP gestionnaire
3. Bien équipement : flèche gauche > UT dans "Entité" > "Géographique" > Bâtiment dans "Spécifique" > double-clic UT-BAT
4. Domaine, Constat, Précisions (localisation + contact + téléphone)
5. Contrat si connu, sinon "Contrat non disponible" + 00000
6. Valider : disquette rouge
7. CP Gestionnaire valide la DI (si urgent : "Sélection une action" > "Changer d'état")
8. Les 3C valident et transforment la DI en OT

## TUTO ERP PeopleSoft - Procédures pratiques
### Suivre l'état d'une DA
- ERP > eProcurement > Gérer demande d'achat > N° DA > Rechercher > Flèche

### Extraire un PDF de la DA
- ERP > Gestion des achats > Demandes d'achat > Statuts documents
- Entité + N° DA (avec 0 devant ou "contient")
- Pour lister toutes ses DA : pas de N°, mettre son CP dans "Demandeur"
- Cliquer DA > CDA > Imprimante (parfois plusieurs clics) > Actualiser > Ouvrir PDF
- PDF 3 pages : commande + récapitulatif (N° DA, demandeur, infos comptables)
- Commande non signée car envoyée via DOCUSIGN

### Créer une réception
- ERP > Gestion des achats > Réceptions > Créer et mise à jour réception
- Entité > Créer > N° commande > Supprimer autres infos > Rechercher > Cocher > OK > Enregistrer
- IMPORTANT : noter le numéro de réception

### Vérifier si réception nécessaire
- Commandes d'achat > Consulter informations > Commande > Petite feuille
- Si "Aucune réception obligatoire" : pas de réception

### Trouver commentaire refus DA
- Cliquer lien mail refus > DA > "Afficher commentaires" pour voir la raison

### Modifier DA sans la refaire
- Gérer demande d'achat > Option "Modification" > Accepter réinitialisation approbation
- Détail ligne > Modifier groupe d'achat ou code fournisseur > OK > Resoumettre

## TUTO DACIA + Connect'Immo - Workflow complet
### AT génériques dans Connect'Immo
- "Modification en masse" > Sélectionner région > Rechercher > N° ID PROJET
- Exemples AT génériques 2025 (Région 47) :
  - 47-25-0019 : DIVOY INDUS ISM-PTP E2MT-ANNUEL (25 000€, Axe PX312920, Local M16860, Projet P-25-1071880)
  - 47-25-0020 : DI-VOY PTP E2MT ANNUEL (20 000€, Axe PX312920, Local M16861, Projet P-25-1071886)
  - 47-25-0154 : Gestion site Raynal UT 003818H Ferroviaire (8 000€, Axe PF323920, Local R11172)
  - 47-25-0155-01 : MOBILITE VOYAGEURS GESTION DE SITE RAYNAL (8 000€, Axe PX312920, Local M17609)

### Créer une commande dans Connect'Immo
1. Flèche descendante : voir travaux rattachés à l'AT
2. Flèche horizontale : nouvelle ligne
3. SYNTHÈSE COMMANDE > "+" > Crayon
4. Remplacer MULTI par UT et BIEN > Attendre validation
5. Remplir champs > Enregistrer > VIE DE LA COMMANDE > Montant > Enregistrer
6. Vérifier axe central et local

### Saisie DA dans DACIA
- Type de demande : "Maintenance"
- N° projet Connect'Immo (commençant par P)
- AT générique : N° projet de l'AT générique / Hors générique : N° projet précis
- Valider > Vérifier dans "MES DA"
- Déposer le PV dans le petit carton de la ligne

### Suivi commande dans l'ERP
- Consulter DA : entité 01425 > N° DA > Statut > N° commande et réception (clic sur "O")
- Consulter CMDE > Historique CDA > "Afficher détail"

## TUTO Commande ERP hors E2MT²
### Contexte
Commandes hors contrat E2MT² (EPI, fournitures). BUPO : 01425 (UA GRAND SUD).

### Créer DA hors E2MT (ancienne méthode)
1. eProcurement > Créer DA > Entité 01425 > Nom commande
2. Article référencé : mettre références > remplissage auto
3. Article non référencé : N° contrat + Description + Groupe achat 67858-005 + Quantité/Prix/Date
4. "Créer une ligne" > Répéter > "Non" à acheteur par défaut > "Valider et soumettre"
5. Site : 01425SD003 (Toulouse, 2 fois)
6. Infos comptables : Division 02136, Resp Gest 02533, Département 51831
7. Axe central ZG39300 (coûts équipes/EPI), Sup OP MPY001
8. Pas d'axe local

### Créer DA hors E2MT (nouvelle méthode Punch Out)
- "Ajouter articles" > "Commerçant" > Choisir fournisseur > Commander sur site fournisseur > Retour ERP > Suite identique

### Trouver un contrat cadre
- Intranet > Services Pratiques > Accès direct > Recherche accord-cadre > Nom fournisseur > Onglet "Contrat"

## ÉVOLUTIONS DU MODÈLE DE GESTION MAINTENANCE 2026
### Applicable depuis le 1er janvier 2026 (Source : Pôle Exploitation, présentation du 05/01/2026)

### 1. Nouveau modèle de gestion comptable
**RÈGLE CLÉ** : Toutes les commandes liées à l'entretien maintenance doivent désormais être créées dans la **DI historique - Division 65924** (et non plus dans la division 02136).

**Tableau des nouveaux codes comptables pour la DIT Grand-Sud :**
| Champ | Ancien (2025) | Nouveau (2026) |
|---|---|---|
| Entité GL | 13402 (DI Prestataires) | **65910** (CSP Autres) |
| Division | 02136 (DI FM Env Travail) | **65924** (DI) |
| RG (Responsabilité de gestion) | 02533 (ET Grand Sud) | **00138** (Optimisat Gest Tech DIT Sud) |
| Département comptable | 06305 (Multitech GS) | **néant** |
| BUAP | 01418 (Factures) | **00043** (Factures) |
| BUPO | 01425 (DA/CDA/RECEP) | **67099** (DA/CDA/RECEP) |

**Règles de transition :**
- Les commandes ouvertes sur 2025 (division 02136) pluriannuelles se clôturent normalement en 2026.
- Toutes les nouvelles commandes 2026 doivent être créées sur la division 65924.
- Les RG renseignées doivent être identiques à celles du champ donneur d'ordre de l'AT dans IMMOSIS.

**Ce qui ne change PAS :** Déconstructions sélectives et dépenses mandatées ESSET.

### 2. Nouvelle segmentation : 6 familles d'opérations propriétaire + 2 locatif
Les sous-types ont été simplifiés. Certains sont figés ou supprimés.

**6 familles propriétaire :**
| Enveloppe budgétaire | Code ZG | Libellé |
|---|---|---|
| Contrat de Maintenance | ZG360720 | P - Contrats de maintenance |
| Contrôles et Visites Réglementaires | ZG360840 | P - Contrôles et Visites Réglementaires |
| Diagnostics, audits non réglementaires et autres | ZG361050 | P - Diagnostics / Audits non réglementaires / Autres |
| Gros entretien et réparations (GER) | ZG360910 | P - Gros entretiens |
| MEC suite Contrôles et Visites Réglementaires | ZG361040 | P - MEC suite Contrôles et Visites Réglementaires |
| Petits Travaux Propriétaire | ZG361820 | P - Petits travaux propriétaire |

**2 familles locatif :**
| Enveloppe budgétaire | Code ZG | Libellé |
|---|---|---|
| Maintenance Locative | ZG361599 | L - Maintenance locative |
| Travaux Locatifs | ZG361699 | L - Travaux locatifs |

**Sous-types supprimés en 2026 :** Maintenance Élargie Chauffage Ventilation Climat., Contrôle Périodique Amiante, Groupes de Visites techniques et réglementaires, Gros Entretien IST CCE, Travaux Enlèvement Amiante Non Friable, Contre Expertise Amiante, RFF CIM GOE Autres.

**Nouveaux sous-types :** Visites tech audit étude (hors réglementaire et VG), Mise en conformité réglementaire autre.

### 3. Axes locaux IMMOSIS (maintenance propriétaire et locative HORS DS)
Ajout du suffixe **P** en 2ème caractère pour identifier les prestations réalisées par Gares & Connexion / prestataire ABE :
- **TP** / **T** : SNCF PABE + RH IST (P si prestataire ABE, sans P si TIERS)
- **RP** / **R** : Réseau
- **MP** / **M** : Voyageurs (N peut aussi être utilisé)
- **FP** / **F** : Fret
- **L** : Maintenance locative (pas de changement)

**Codes fournisseur ABE :** 59167 (ABE Languedoc Roussillon), 59166 (ABE PACA), 59160 (ABE Toulouse).

### 4. Gérants de programme 2026 (liste exhaustive)

**GP PROPRIÉTAIRES :**
- **SA VOYAGEURS** (concernés DIT GS) : AUTRES VOYAGEURS, COMBUSTIBLE, TRACTION, DI POUR RHL, VOYAGEURS TRAVAUX A LA DEMANDE, ISM TER PROVENCE ALPES COTE D'AZUR, ISM TER OCCITANIE, HORS ISM TER, ISM TGV AXE SUD EST, ISM TGV AXE ATLANTIQUE, HORS ISM TGV, MATERIEL TI NEVERS LANGUEDOC, MATERIEL ISM, MATERIEL AUTRES
- **SA VOYAGEURS** (hors DIT GS) : ISM INTERCITES, ISM TRANSILIEN, HORS ISM TRANSILIEN, ISM TER GRAND EST, ISM TER HAUTS DE France, ISM TER NORMANDIE, ISM TER CENTRE VAL DE LOIRE, ISM TER PAYS DE LOIRE, ISM TER BRETAGNE, ISM TER AUVERGNE RHONE ALPES, ISM TER BOURGOGNE FRANCHE COMTE, ISM TER NOUVELLE AQUITAINE, ISM TGV AXE EST, ISM TGV AXE NORD, MATERIEL TI BISCHHEIM, MATERIEL TI ROMILLY, MATERIEL TI HELLEMMES, MATERIEL TI ROUEN QUATRE-MARES, MATERIEL TI PICARDIE, MATERIEL TI RENNES, MATERIEL TI SPDC, MATERIEL TI VENISSIEUX, MATERIEL TICP PERIGUEUX, MATERIEL TICP SAINTES
- **EX FRET** : C32, TECHNIS, HEXAFRET
- **SA RESEAU** : RESEAU FERROVIAIRE, RESEAU INDUSTRIEL, RESEAU SOCIAL, RESEAU TERTIAIRE, RESEAU TRAVAUX A LA DEMANDE
- **SA SNCF** : SNCF, DI POUR RH IST
- **TIERS** : MAINTENANCE LOCATIVE SUD AZUR (concerné DIT GS), MAINTENANCE LOCATIVE ETOILE D'AMIENS, MAINTENANCE LOCATIVE VAL DE LOIRE
- **SNCF OPTIM SERVICES** : GIE (nouveau 2026)

**GP LOCATIFS :**
- **GP LOCATIF** : MAINTENANCE LOCATIVE INDUSTRIEL & FERROVIAIRE, MAINTENANCE LOCATIVE TERTIAIRE & SOCIAL

**Rappels :**
- Les 3 gérants Matériel (MATERIEL AUTRES, MATERIEL ISM, TI NEVERS LANGUEDOC) sont nouveaux en 2026 pour la DIT GS.
- Le gérant MAINTENANCE SUD AZUR a été créé depuis 2025 et doit être utilisé avec la famille travaux correspondante.
- Le gérant GIE est nouveau en 2026 (SNCF Optim Services).

## BPU - Bordereau de Prix Unitaires (Lot 4.1 - Occitanie)
Voici le référentiel de prix contractuel :\n${bpuContext}

## RÈGLES CONTRACTUELLES COMPLÈTES (CPS + Annexes)

### Pénalités (Annexe 3 au CPS) — 19 pénalités
| N° | Objet | Pénalité | Seuil |
|---|---|---|---|
| P1 | Documents / Retard remise devis | 100 €HT/jour ouvré de retard | >10 jours ouvrés |
| P1 | Documents / Devis non conforme | 100 €HT/anomalie (1 par devis) | Par constat |
| P1 | Documents / Plan de prévention | 100 €HT/jour calendaire retard | >10j Prestataire, >30j SST |
| P1 | Documents / Non tenue à jour | 100 €HT/document/constat | Par constat |
| P2 | Attestations manquantes | 100 €HT/attestation | Par constat |
| P3 | Non-respect consignes/PAQ | 250 €HT/constat | Par constat |
| **P4** | **Retard maintenance corrective** | **50 €HT/jour calendaire** | **>2 jours au-delà des délais** |
| P5 | Retard intervention programmée | 100 €HT/jour calendaire | >10 jours calendaires |
| P6 | Outils informatiques (GMAO/GED) | 100 €HT/document/constat | Par constat |
| P7 | Absence visite bureau contrôle | 150 €HT/constat | Non signalée 48h avant |
| P8 | Observations bureau contrôle | 100 €HT/observation/semaine | Au-delà du délai contractuel |
| P9 | Non-conformité contrôles réglementaires | 100 €HT/non-conformité/semaine | Au-delà du délai |
| P10 | Période de chauffe | 100 €HT/jour/installation | >15 jours retard |
| P11 | Dérive énergétique | 100 €HT/jour/installation | >15 jours après constat |
| P12 | Confidentialité | 1 500 €HT/défaillance | Par constat |
| P13 | Recouvrement personnel | 100 €HT/jour calendaire/personne | Par personnel concerné |
| P14 | Insertion activité économique | 60 €HT/heure non réalisée | Non réalisation heures |
| P15 | Insertion reporting | 100 €HT/jour calendaire | Après mise en demeure |
| P16 | Insertion bilan fin contrat | 300 €HT/jour calendaire | Après mise en demeure |
| P17 | RFA communication CA | 50 €HT/jour calendaire | Non communication CA |
| P18 | RFA retard paiement | 50 €HT/jour calendaire | Non paiement RFA |
| P19 | Restitution documents fin contrat | 1/20e du prix global A-C | Dernier jour contrat |

**Principes pénalités (Art. 27.1 CPS) :**
- Applicables de plein droit, SANS mise en demeure préalable
- Cumulables entre elles
- Plafond annuel : 20% du montant annuel HT des missions B + C + E
- Contestation : charge de la preuve au Titulaire
- Note : sur un mois donné, pénalités unitaires non cumulables avec pénalités indicateurs clés sur même objet

### Franchise pièces de rechange (Art. 15.3.4 CPS)
- S'applique UNIQUEMENT pour opérations Mission C (pas Mission D)
- Si PU pièce < seuil franchise → 0 €HT (pièce à charge du Titulaire)
- Si PU pièce > seuil franchise → (PU - franchise) × coefficient de revente
- Franchise s'applique AUTANT DE FOIS que de pièces dans le devis
- NE S'APPLIQUE PAS en cas de vandalisme
- Exemple : franchise 300€, pompe 400€ → (400-300) × coef = montant facturable

### Contenu OBLIGATOIRE des propositions tarifaires Mission D (Art. 15.3.5)
Un devis conforme DOIT contenir :
1. N° accord-cadre
2. Objet des prestations
3. Localisation (n° UT, bâtiment, installation)
4. Origine de la demande et nom du demandeur
5. Caractéristiques équipements (quantité, marque, type)
6. Heures MO décomposées par poste
7. Taux horaires BPU (comprenant déplacements)
8. Majorations éventuelles
9. Coûts unitaires fournitures (remises fournisseur déduites)
10. Coefficients de revente fournitures
11. Abattement franchises le cas échéant
12. Total HT, TVA, TTC
13. Conditions d'exécution, délai de réalisation
14. Copie des devis fournisseurs et/ou sous-traitants

### Délais de remise des devis (Art. 15.3.4)
- Maintenance corrective : selon délais du CdC (PARTIE I.3.4.7)
- Autres cas : 2 jours ouvrés pour accepter ou non + 10 jours ouvrés pour remettre le devis
- Retard → pénalité P1 : 100 €HT/jour ouvré

### Sous-traitance (BPU Annexe 4 Rubrique 3)
- Le coefficient SST ne s'applique QUE si la prestation ne peut pas être chiffrée en taux horaires BPU
- Si un profil MO BPU existe pour le travail → le Titulaire DOIT chiffrer en taux horaires, pas en SST
- 3 tranches de coefficient SST : <2000€, 2000-5000€, ≥5000€

### Profils MO BPU (Rubrique 2) — Taux horaires contractuels Equans lun-sam 8h-19h
| Code | Profil | Prix €HT/h | Qté DQE |
|---|---|---|---|
| R05 | Ingénieur Méthodes/Qualité/Sécurité/GMAO/Energies | 85,00 | 200 h |
| R12 | Technicien CVCD/Plomberie (Plombier, Chauffagiste, Frigoriste) | 62,00 | 2 000 h |
| R13 | Spécialiste constructeur Groupes Frigorifiques/PAC | 90,00 | 500 h |
| R14 | Technicien Fermetures motorisées | 75,00 | 1 200 h |
| R15 | Technicien Protection incendie et Extincteurs | 70,00 | 500 h |
| R16 | Technicien de maintenance GTC/GTB/SSI | 95,00 | 500 h |
| R17 | Spécialiste constructeur GTC/GTB/SSI | 155,00 | 300 h |
| R18 | Technicien Clos et Couvert | 65,00 | 500 h |
| R19 | Technicien Electricien CFO/CFA/Eclairage | 70,00 | 600 h |
| R20 | Spécialiste constructeur CFO (Onduleurs/GE/HT) | 130,00 | 40 h |
| R21 | Spécialiste constructeur CFA (Contrôle accès/Intrusion/Vidéo) | 110,00 | 40 h |
| R22 | Technicien Ascenseurs/Monte-charges/Levage | 95,00 | 200 h |
| R23 | Technicien polyvalent second œuvre/menuisier/serrurier | 55,00 | 600 h |
| R24 | Intervention repérage/diagnostic amiante avant travaux | 98,00 | 40 h |

Si le devis utilise un taux horaire DIFFÉRENT de ces prix contractuels, c'est une ANOMALIE à signaler.

**IMPORTANT :** Les taux horaires comprennent DÉJÀ les frais de déplacement (Art. 25 CPS). Pas de facturation séparée.

### Prestations particulières ACC (Moyens d'accès) — Prix contractuels Equans
| Code | Désignation | Prix €HT | Unité |
|---|---|---|---|
| ACC-01 | Nacelle/plateforme mobile ≤6m (SANS conducteur) | 313,28 | Journée |
| ACC-02 | Nacelle/plateforme mobile ≤9m (SANS conducteur) | 321,78 | Journée |
| ACC-03 | Camion nacelle 20m (AVEC conducteur) | 1 214,27 | Journée |
| ACC-04 | Camion nacelle 30m (AVEC conducteur) | 1 359,97 | Journée |

ATTENTION : ACC-01/ACC-02 = location sèche SANS conducteur. ACC-03/ACC-04 = AVEC conducteur inclus.
Les moyens d'accès pour les prestations récurrentes (Mission C) sont à la charge du Prestataire.

### Coefficients fournitures (Rubrique 3) — Prix contractuels Equans
| Tranche | Coefficient |
|---|---|
| < 500 €HT | 1,24 |
| 500 - 2 000 €HT | 1,22 |
| ≥ 2 000 €HT | 1,19 |
Le coefficient s'applique sur le coût d'achat des fournitures (remises fournisseur déduites).

### Coefficients sous-traitance (Rubrique 3) — Prix contractuels Equans
| Tranche | Coefficient |
|---|---|
| < 2 000 €HT | 1,24 |
| 2 000 - 5 000 €HT | 1,22 |
| ≥ 5 000 €HT | 1,19 |

### Prestations particulières — Extincteurs (Prix contractuels Equans)
| Code | Désignation | Prix €HT | Unité |
|---|---|---|---|
| EXT-01 | Remplacement extincteur eau pulvérisée 6L | 68,18 | Appareil |
| EXT-02 | Remplacement extincteur eau pulvérisée 9L | 77,27 | Appareil |
| EXT-03 | Remplacement extincteur CO2 2kg | 93,18 | Appareil |
| EXT-04 | Remplacement extincteur CO2 5kg | 136,36 | Appareil |
| EXT-05 | Remplacement extincteur Poudre ABC 6kg | 63,64 | Appareil |
| EXT-06 | Remplacement extincteur Poudre ABC 9kg | 72,73 | Appareil |
| EXT-07 | Recharge eau pulvérisée 6L | 20,45 | Appareil |
| EXT-08 | Recharge eau pulvérisée 9L | 25,00 | Appareil |
| EXT-09 | Recharge CO2 2kg | 22,73 | Appareil |
| EXT-10 | Recharge CO2 5kg | 35,23 | Appareil |
| EXT-11 | Recharge Poudre ABC 6kg | 32,95 | Appareil |
| EXT-12 | Recharge Poudre ABC 9kg | 37,50 | Appareil |

### Prestations particulières — Amiante
| Code | Désignation | Prix €HT | Unité |
|---|---|---|---|
| AM-01 | Analyse amiante (prélèvement + labo + rapport) | 80,68 | Forfait/prélèvement |

### Réception des prestations (Art. 22 CPS)
- Mission D ≥ 8 000 €HT : PV de réception OBLIGATOIRE
- Mission D 1 500 à 8 000 €HT : PV possible sur demande
- Délai réponse : 30 jours après notification → sinon réception tacite

### Facturation (Art. 26 CPS)
- Mission D : après exécution ET réception, facture récapitulative mensuelle
- Paiement à 60 jours
- Plateforme PSFOUR obligatoire

### Réfactions maintenance préventive (Art. 27.2)
- Au 15 janvier N+1 : taux de réalisation des missions C
- Si taux < 100% : R = (1 - taux) × (Montant B+C au T3) / 2

### Valeur maximale Lot 4.1 Occitanie
- 33 287 561 €HT sur la durée du contrat
- RFA : 3% du CA annuel HT

### Exécution aux frais et risques (Art. 27.4)
- Si Titulaire ne remédie pas aux réserves → mise en demeure LRAR
- Si pas de réaction → exécution par un tiers aux frais du Titulaire + 10% frais administratifs

### Obligation de résultat (Art. 17.1)
- Le Titulaire a une obligation de RÉSULTAT (pas de moyens)
- Ne doit pas débuter sans BC de La Société
- Proposer chaque semestre des améliorations

### Confidentialité (Art. 31)
- Violation = résiliation pour faute grave
- Indemnité forfaitaire : 250 000 €HT de plein droit

### SECUFER (Art. 30)
- Depuis 1er octobre 2024 : habilitation TCS ou AAE obligatoire
- Défaut = interdiction d'accès aux emprises ferroviaires
- Formation allégée possible hors emprise

### ATTRIBUTAIRES DES LOTS E2MT²
- Lot 4.1 Occitanie : AXIMA CONCEPT (filiale Equans/Bouygues)
- 18 lots géographiques au total, 4 titulaires : AXIMA CONCEPT, VEOLIA, EIFFAGE, VINCI

### CRITICITÉS ET DÉLAIS D'INTERVENTION
| Criticité | Définition | Délai intervention | Délai dépannage | Délai remise en état définitive |
| C1 | Défaillances installations critiques et/ou remettant en cause l'activité ou la sécurité | 15 min (si présent) ou 2h | 8h | 2 jours ouvrés |
| C2 | Autres défaillances (sans risque sécurité) | 4h ouvrées | 8h ouvrées | 8 jours ouvrés |

### SITUATIONS DE FACTURATION DEVIS (Situation N°1 vs N°2)
- **Situation N°1** : Maintenance corrective pour niveaux COMPRIS dans la rémunération récurrente (hors cas d'exclusion)
  - MO : Incluse au forfait (missions B, C, D IF&G), y compris frais déplacement et administratifs
  - Moyens d'accès : Inclus
  - Pièces détachées : Facturables après déduction franchise et application coef BPU
  - Accompagnement sous-traitant : Inclus
  - Rubrique 1 BPU : Impossible à utiliser
- **Situation N°2** : Maintenance corrective pour niveaux HORS rémunération récurrente ou travaux
  - MO : Facturable, taux horaires BPU (incluant frais déplacement et administratifs)
  - Moyens d'accès : Facturables, prix BPU
  - Pièces détachées : Facturables (hors consommables inclus) après application coef BPU
  - Accompagnement sous-traitant : Facturable si nécessaire, prix BPU
  - Rubrique 1 BPU : À utiliser en priorité
- Rubriques 2 (taux horaires) et 3 (coefficients) : à utiliser si rubrique 1 insuffisante
- Seules les rubriques 1 et 2 font l'objet de la formule de révision des prix

### CAS D'EXCLUSION DE LA SITUATION N°1 (MO facturable même si niveau inclus au forfait)
1. Réparations suite à vandalisme ou malveillance AVÉRÉE (exiger photo/constat)
2. Mise en conformité réglementaire
3. Remplacement installation globale (production + réseaux + terminaux)
4. Remplacement appareil complet fonctionnel pour améliorer/changer caractéristiques
5. Sous-traitance très spécialisée (grutage par exemple)
6. Équipement complet ayant dépassé sa durée de vie théorique

### POINTS CLEFS VÉRIFICATION DEVIS (Formations E2MT²)
1. Justification obligatoire : le devis du sous-traitant doit être joint
2. Cohérence entre devis prestataire et sous-traitant
3. Pas de facturation MO et franchise sur pièces si < au niveau de maintenance
4. Application des bons coefficients de refacturation
5. Seuil 100 k€ → mise en concurrence obligatoire
6. Facturation après exécution et réception, facture récapitulative mensuelle
7. E2MT n'est PAS un marché de travaux
8. Les prestataires ne sont pas toujours compétents → maîtriser le volume des petits travaux
9. Alternatives possibles : recours MOSO existant, nouveau MOSO, mise en concurrence

### FRANCHISE PIÈCES (300 €HT)
- Franchise = 300 €HT (augmentée de 200 à 300 €HT vs ancien contrat)
- S'applique autant de fois que de pièces prévues dans le devis
- Montant unitaire = prix unitaire fournisseur après application remise
- Coefficient d'entreprise appliqué APRÈS déduction franchise
- Exemple : pièce 400 €HT, franchise 300 €, coef 1,10 → (400-300) × 1,10 = 110 €HT
- Pièce < 300 €HT → 0 €HT dans le devis (prise en charge par le prestataire)

### WORKFLOW DES DEVIS
1. Dépôt du devis par le prestataire (via Hub de données, workflow obligatoire)
2. Avis éventuel de l'AMO
3. Décision du pilote SNCF (acceptation, refus ou demande de correction)
4. Suivi de la réalisation (commande, facture, réception)

### OUTILS DU CONTRAT
- IGO : GMAO pour l'ensemble du périmètre
- 1.4 Démat : Power Apps pour visualiser le patrimoine et paramétrer le contrat
- Hub de données : Centralise les livrables, connecté à IGO et Kizéo, workflow validation devis
- Kizéo : Formulaires mobiles pour relevés terrain (inventaire, contrôles qualité)
- PBI (Power BI) : Reporting et tableaux de bord
- PSFOUR : Plateforme de facturation

### CONTRÔLES QUALITÉ
- Le contrat impose au moins 5 équipements autocontrôlés par le prestataire tous les mois
- Vérifier que le prestataire s'auto-contrôle, contrôler régulièrement et de façon exhaustive
- Formulaires KN1 refondus, préremplis avec liste équipements, envoyés automatiquement vers le Hub

### RÉVERSIBILITÉ
- 6 mois en fin de contrat
- Le prestataire doit fournir : données GMAO, GDI, GED à jour et dans un format exploitable

### DONNÉES PERSONNELLES (Annexes 8 et 9)
- Sous-traitance de données à caractère personnel encadrée
- Le Titulaire est sous-traitant au sens RGPD
- Données traitées : identité des intervenants, habilitations, données de maintenance

### NIVEAUX DE MAINTENANCE (Annexe 1.3A)
La MO est-elle facturable en Mission D ? Applique les 8 questions Q1-Q8 :
- Q1 : Vandalisme/malveillance ? → OUI = Mission D (MO facturable), exiger PHOTO justificative. NON → Q2
- Q2 : Mise en conformité réglementaire ? → OUI = Mission D. NON → Q3
- Q3 : Opération classifiée Niveau 5 dans les tableaux ? → OUI = Mission D. NON → Q4
- Q4 : Équipement complet ou Pièce Détachée (PD) ? → PD = MO incluse Mission C. Équipement complet → Q5-Q8
- Q5 : Remplacement installation globale (production+réseaux+terminaux) ? → OUI = Mission D. NON → Q6
- Q6 : Changement profond des caractéristiques techniques ? → OUI = Mission D. NON → Q7
- Q7 : Sous-traitance très spécialisée nécessaire (grutage, manutention lourde) ? → OUI = Mission D. NON → Q8
- Q8 : Durée de vie théorique dépassée ? → OUI = Mission D. NON = MO incluse Mission C

Équipements systématiquement N5 (MO facturable Mission D) :
- CVCD : Chaudière ≥30kW, Groupe eau glacée, Split system complet, Armoire clim, PAC centralisée, CTA complète
- Fermetures : Remplacement complet portes auto/portails/rideaux/barrières/bornes/portes ferroviaires
- Électricité : Armoire >30 départs, Cellules HT/transfo/TGBT, Groupe électrogène, Onduleur >50kVA
- Plomberie : Préparateur ECS >100L
- SSI : Centrale incendie type 1-3
- Levage : Nacelle, Plateformes élévatrices/PMR
- Extincteurs : Remplacement complet

Pièces Détachées (PD) — MO TOUJOURS incluse Mission C :
- Brûleur, Compresseur frigo, Cartouche déshydratante, Filtres, Régulation/Variateur/Ventilateur CTA
- Vannes/robinetterie tous diamètres, Régulateurs/capteurs/sondes/actionneurs
- Lames tablier, Lisses barrière, Moteurs électriques, Dispositifs commande/sécurité, Feux signalisation
- Disjoncteurs BT, Batteries onduleur, Appareillage électrique (prises, interrupteurs)
- Contact de porte, Avertisseur sonore, Déclencheur manuel, Détecteur fumée
- Pièces détachées extincteurs

Durées de vie théoriques clés (au-delà = Q8 → Mission D) :
- 10 ans : Vase expansion, Pompe relevage eaux chargées
- 12 ans : BAES
- 15 ans : Chaudière murale <30kW, Préparateur ECS ≤100L, Onduleur ≤50kVA, Lecteurs badge, Gâches/ventouses, Détecteurs volumétriques, Adoucisseur, Pompe eaux claires, Clapet <DN65
- 20 ans : Ventilo-convecteur, Caisson VMC, Convecteur élec, Pompes/circulateurs, Préparateur ECS gaz, Centrale incendie type 4-5, UTL, Clapet ≥DN65
- 25 ans : Compteurs volumétriques/énergie, Vannes plomberie, Désemboueur
- 30 ans : Radiateur eau chaude, Armoire élec ≤30 départs, Appareils éclairage, Poste RIA, Compteur eau, Appareils sanitaires, Filtre eau

Exemples contractuels :
1. Brûleur chaudière 200kW en panne → PD, niveau 3 → MO incluse Mission C
2. Porte ferroviaire après choc train → Q1 vandalisme OUI → MO facturable Mission D
3. Tête détection incendie → PD, niveau 4 → MO incluse Mission C
4. Clim R22 fonctionnelle → Q2 conformité réglementaire OUI → MO facturable Mission D
5. Compresseur groupe frigo → PD, niveau 4 → MO incluse Mission C
6. Chaudière murale 15 ans (DVT 20 ans) → Q8 NON → MO incluse Mission C
7. Ballon ECS 100L 12 ans (DVT 15 ans) → Q8 NON → MO incluse Mission C

### IGO (GMAO - Intégration Gestion des Opérations)

Lexique IGO :
- UT = Unité Topographique (frontière géographique des propriétés SNCF)
- DI = Demande d'Intervention (signaler une anomalie)
- OT = Ordre de Travail (attribuer une action à une équipe)
- OT COR = OT Correctif (suite à DI)
- OT TVX = OT Travaux (suite à devis)
- OT VR = OT Vérification Réglementaire
- OT MPREV = OT Maintenance Préventive
- OT MREG = OT Maintenance Réglementaire
- OT AUTRE = OT suite à Non-Conformité (NC)
- OT MEC = OT Mise en Conformité
- SAMI = Satisfait/Acceptable/Moyen/Insatisfait (enquête satisfaction)
- Cockpit = Indicateur métier sur la page d'accueil IGO

Circuit correctif DI → OT COR :
- Statuts DI : 0.Créée → 11.Validée (ou 5.Annulée) → 3.En cours → 9.Terminée → 8.Réceptionnée (ou 10.Refusée)
- Statuts OT COR : 0.Créé → 1.Affecté (ou 9.Annulé) → 3.En cours → 4.Terminé → 5.Clôturé → 6.Réceptionné (ou 8.A réviser / 7.Non validé)
- Workflow : Demandeur crée DI → Gestionnaire valide → Guichet 3C verrouille DI et crée OT COR → 3C affecte équipe → Prestataire prend en charge (3.En cours) → Prestataire termine (4.Terminé) → Pilote clôture (5.Clôturé) → DI passe à 9.Terminée → Demandeur réceptionne (8.Réceptionnée) + enquête SAMI
- Si refus réception : DI → 10.Refusée, OT → 8.A réviser

Création DI - Champs obligatoires (fond jaune) :
- Urgence (1-Urgent, 2-Norme de service, 3-A programmer)
- Demandeur (auto via CP connexion)
- Équipement/Bien concerné
- Domaine (corps de métier)
- Constat (liste de choix selon domaine)
- Précision sur la demande (devient le titre de la DI)
- Précision sur la localisation
- Destinataire ABE
- Gestionnaire valideur
- Onglet paiement : contrat associé (obligatoire) ou case "Contrat non disponible" + RG client
- Onglet description : texte détaillé + pièces jointes (photos, PDF)
- Commentaires non supprimables ni modifiables une fois enregistrés

Circuit OT MPREV / MREG (maintenance préventive/réglementaire) :
- Générés automatiquement par les plans de maintenance (2 mois avant date planifiée)
- Condition : OT précédent à statut archivable (9.Annulé / 11.Non réalisé / 6.Réceptionné)
- Statuts : Plan créé → 1.Affecté → 3.En cours → 4.Terminé → 5.Clôturé → 6.Réceptionné
- Passage auto : 4→5 au bout d'1 mois, puis 5→6 au bout d'1 mois
- Champ "Non-conformité" modifiable jusqu'au statut 4
- Si NC > 0 au passage à 6.Réceptionné → OT AUTRE généré automatiquement

Circuit OT AUTRE (Non-conformités) :
- Créé auto ou manuellement depuis OT MPREV/MREG si NC > 0
- Récupère auto : équipement, équipe, sous-traitant, imputation, OT père, nombre NC
- Date planifiée = date fin OT père + 30 jours
- Un seul OT AUTRE par OT MPREV/MREG
- Au statut 4.Terminé : "NC réalisées" obligatoire, ≥ 0, ≤ nombre NC total
- Passage auto 5→6 après 1 mois

Gestion des équipements :
- Chaque équipement rattaché à un modèle (famille + classe d'attributs)
- Cycle : Création → Validation référent → Actif (ou Rebut si refusé)
- Mise au rebut : demande + commentaire justificatif → validation référent
- ATTENTION : équipements avec DI/OT/Devis en cours ne peuvent PAS être mis au rebut

Application Nomad (mobile) :
- Modules : OT (traiter MPREV, MREG en mobilité) + Équipement
- Synchronisations : Totale (vide Nomad), OT-DI, Contextuelle
- Fonctionnalités : commentaires (dictée vocale), pièces jointes, photo, vidéo, signature
- Notifications pop-up quand OT attribué (champ "Employé Notifié")

Règles de réponse :
- Réponds toujours en français
- Sois précis et cite les références du contrat (articles CPS, annexes, pénalités P1-P19) quand c'est pertinent
- Si tu n'es pas sûr d'une information, dis-le clairement
- Utilise le format Markdown pour structurer tes réponses
- Pour les questions sur les prix, réfère-toi au BPU ci-dessus
- Pour les questions sur les délais, réfère-toi aux délais contractuels D1/D2
- Pour les questions sur les pénalités, réfère-toi au tableau des 19 pénalités ci-dessus
- Pour l'analyse de devis, vérifie systématiquement : conformité TVA/TTC, profils MO vs BPU, coefficients, régularisations, sous-traitance, contenu obligatoire, et NIVEAUX DE MAINTENANCE (la MO est-elle facturable ou incluse en Mission C ?)
- Quand on te demande d'analyser un devis, applique les 14 vérifications du contenu obligatoire ET les 8 questions Q1-Q8 de l'Annexe 1.3A pour vérifier si la MO est facturable
- Pour déterminer si la MO est facturable, parcours les questions Q1 à Q8 dans l'ordre et cite le résultat de chaque question
- Pour les devis en Situation N°1 : vérifie que la MO n'est PAS facturée (sauf cas d'exclusion)
- Pour les devis en Situation N°2 : vérifie que les taux horaires correspondent au BPU
- Vérifie systématiquement la franchise sur les pièces (300 €HT par pièce)
- Vérifie que le coefficient d'entreprise est appliqué APRÈS déduction de la franchise
- Si sous-traitance : vérifie que le devis du sous-traitant est joint et cohérent
- Si régularisation : signale que le devis aurait dû être soumis AVANT l'intervention
- Rappelle que E2MT n'est PAS un marché de travaux quand pertinent`,
          },
        ];

        // Add conversation history
        if (input.conversationHistory) {
          for (const msg of input.conversationHistory) {
            messages.push({ role: msg.role as any, content: msg.content });
          }
        }

        // Add current question with optional file attachments
        if (input.attachments && input.attachments.length > 0) {
          const contentParts: any[] = [];
          // Add text question
          contentParts.push({ type: "text", text: input.question });
          // Add file attachments
          for (const att of input.attachments) {
            if (att.mimeType.startsWith("image/")) {
              contentParts.push({
                type: "image_url",
                image_url: { url: att.url, detail: "high" },
              });
            } else if (att.mimeType === "application/pdf") {
              contentParts.push({
                type: "file_url",
                file_url: { url: att.url, mime_type: "application/pdf" },
              });
            }
          }
          messages.push({ role: "user" as const, content: contentParts });
        } else {
          messages.push({ role: "user" as const, content: input.question });
        }

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
    uploadDevis: protectedProcedure
      .input(z.object({
        id: z.number(),
        fileBase64: z.string(),
        fileName: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { id, fileBase64, fileName, contentType } = input;
        const buffer = Buffer.from(fileBase64, "base64");
        const ext = fileName.split(".").pop() || "pdf";
        const safeKey = `suivi-devis/${id}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(safeKey, buffer, contentType);
        await updateSuiviEntry(id, { devisUrl: url, devisFilename: fileName } as any);
        return { url, fileName };
      }),

    removeDevis: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateSuiviEntry(input.id, { devisUrl: null, devisFilename: null } as any);
        return { success: true };
      }),

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
        devisUrl: z.string().optional(),
        devisFilename: z.string().optional(),
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
        devisUrl: z.string().optional(),
        devisFilename: z.string().optional(),
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

  // ===== DELIVERABLES (Livrables contractuels) =====
  deliverables: router({
    list: protectedProcedure
      .input(z.object({
        mission: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        return getDeliverables(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDeliverableById(input.id);
      }),

    stats: protectedProcedure.query(async () => {
      return getDeliverableStats();
    }),

    create: protectedProcedure
      .input(z.object({
        code: z.string().min(1),
        mission: z.string().min(1),
        category: z.string().min(1),
        title: z.string().min(1),
        description: z.string().optional(),
        contractualDelay: z.string().min(1),
        referenceDate: z.number().optional(),
        dueDate: z.number().optional(),
        deliveredDate: z.number().optional(),
        status: z.enum(["a_venir", "en_cours", "livre", "en_retard", "non_applicable"]).optional(),
        responsable: z.string().optional(),
        notes: z.string().optional(),
        alertDaysBefore: z.number().optional(),
        priority: z.enum(["haute", "moyenne", "basse"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await createDeliverable({ ...input, updatedBy: ctx.user?.id ?? null } as any);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        mission: z.string().optional(),
        category: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        contractualDelay: z.string().optional(),
        referenceDate: z.number().nullable().optional(),
        dueDate: z.number().nullable().optional(),
        deliveredDate: z.number().nullable().optional(),
        status: z.enum(["a_venir", "en_cours", "livre", "en_retard", "non_applicable"]).optional(),
        responsable: z.string().optional(),
        notes: z.string().optional(),
        alertDaysBefore: z.number().optional(),
        priority: z.enum(["haute", "moyenne", "basse"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await updateDeliverable(id, { ...data, updatedBy: ctx.user?.id ?? null } as any);

        // If status changed to en_retard, notify owner
        if (data.status === "en_retard") {
          const deliverable = await getDeliverableById(id);
          if (deliverable) {
            try {
              await notifyOwner({
                title: "\u26a0\ufe0f Livrable en retard",
                content: `Le livrable ${deliverable.code} - ${deliverable.title} est en retard.`,
              });
            } catch (e) {
              console.warn("Notification failed:", e);
            }
          }
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteDeliverable(input.id);
        return { success: true };
      }),

    exportAll: protectedProcedure
      .input(z.object({
        mission: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getAllDeliverablesForExport(input);
      }),

    seed: protectedProcedure.mutation(async () => {
      const seedData = [
        // Mission A1 - Organisation
        { code: "A1-01", mission: "A1", category: "Organisation", title: "Organigramme op\u00e9rationnel des \u00e9quipes de d\u00e9marrage", contractualDelay: "15 jours calendaires suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-02", mission: "A1", category: "Organisation", title: "Liste des intervenants phase d\u00e9ploiement (CV + fiches poste)", contractualDelay: "15 jours calendaires suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-03", mission: "A1", category: "Organisation", title: "Planning g\u00e9n\u00e9ral de d\u00e9ploiement", contractualDelay: "15 jours calendaires, MAJ chaque fin de mois", priority: "haute" as const },
        { code: "A1-04", mission: "A1", category: "Organisation", title: "Organigramme op\u00e9rationnel \u00e9quipes exploitation courante", contractualDelay: "3 mois suivant prise d'effet mission A2", priority: "haute" as const },
        { code: "A1-05", mission: "A1", category: "Organisation", title: "Liste des intervenants exploitation courante (CV + fiches poste)", contractualDelay: "4 mois suivant prise d'effet mission A1", priority: "moyenne" as const },
        { code: "A1-06", mission: "A1", category: "Organisation", title: "Plan de formation des intervenants exploitation courante", contractualDelay: "4 mois suivant prise d'effet mission A1, formations dans 5 mois", priority: "moyenne" as const },
        { code: "A1-07", mission: "A1", category: "Organisation", title: "Plannings pr\u00e9visionnels permanences sites", contractualDelay: "5 mois suivant prise d'effet mission A1", priority: "moyenne" as const },
        { code: "A1-08", mission: "A1", category: "Organisation", title: "Dossier de d\u00e9claration des sous-traitants", contractualDelay: "3 mois suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-09", mission: "A1", category: "Organisation", title: "Tableau r\u00e9capitulatif de la sous-traitance", contractualDelay: "5 mois suivant prise d'effet mission A1", priority: "moyenne" as const },
        { code: "A1-10", mission: "A1", category: "Qualit\u00e9", title: "Plan d'assurance qualit\u00e9", contractualDelay: "5 mois suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-11", mission: "A1", category: "Qualit\u00e9", title: "Plan de r\u00e9versibilit\u00e9", contractualDelay: "3 mois suivant prise d'effet mission A2", priority: "moyenne" as const },
        { code: "A1-12", mission: "A1", category: "Astreinte", title: "Proc\u00e9dure d'astreinte", contractualDelay: "3 mois suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-13", mission: "A1", category: "Astreinte", title: "Guides d'astreinte", contractualDelay: "Trame type 2 mois, d\u00e9ploiement p\u00e9rim\u00e8tre 5 mois", priority: "haute" as const },
        { code: "A1-14", mission: "A1", category: "S\u00e9curit\u00e9", title: "Plans de pr\u00e9vention (concertation SNCF)", contractualDelay: "5 mois suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-15", mission: "A1", category: "S\u00e9curit\u00e9", title: "Tableau de suivi avancement plans de pr\u00e9vention", contractualDelay: "30 jours calendaires, MAJ chaque fin de mois", priority: "moyenne" as const },
        // Mission A1 - Inventaire et prise en charge
        { code: "A1-16", mission: "A1", category: "Inventaire", title: "Note m\u00e9thodologique de prise en charge", contractualDelay: "30 jours calendaires suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-17", mission: "A1", category: "Inventaire", title: "Planning de prise en charge", contractualDelay: "30 jours calendaires, MAJ chaque fin de semestre", priority: "haute" as const },
        { code: "A1-18", mission: "A1", category: "Inventaire", title: "Restitution donn\u00e9es prise en charge et \u00e9tat des lieux globaux", contractualDelay: "2 mois suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-19", mission: "A1", category: "Inventaire", title: "Inventaires \u00e9quipements actualis\u00e9s et compl\u00e9t\u00e9s + \u00e9tats des lieux", contractualDelay: "4 mois suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-20", mission: "A1", category: "Inventaire", title: "\u00c9tiquetage des \u00e9quipements", contractualDelay: "5 mois suivant prise d'effet (ou premi\u00e8re maintenance)", priority: "moyenne" as const },
        { code: "A1-21", mission: "A1", category: "Inventaire", title: "Signature PV de prise en charge", contractualDelay: "Au plus tard 5 mois apr\u00e8s prise d'effet mission A1", priority: "haute" as const },
        // Mission A1 - GMAO et GED
        { code: "A1-22", mission: "A1", category: "GMAO/GED", title: "Liste de comptes \u00e0 cr\u00e9er (selon profil)", contractualDelay: "2 mois suivant prise d'effet mission A1", priority: "moyenne" as const },
        { code: "A1-23", mission: "A1", category: "GMAO/GED", title: "Donn\u00e9es de param\u00e9trage g\u00e9n\u00e9ral", contractualDelay: "5 mois suivant prise d'effet mission A1", priority: "moyenne" as const },
        { code: "A1-24", mission: "A1", category: "GMAO/GED", title: "Plan annuel de maintenance", contractualDelay: "5 mois suivant prise d'effet mission A1", priority: "haute" as const },
        { code: "A1-25", mission: "A1", category: "GMAO/GED", title: "Trame des rapports (RLAM, RLAA, RMA, RAA)", contractualDelay: "5 mois suivant prise d'effet mission A1", priority: "moyenne" as const },
        // Mission A2 - Prise en charge nouveaux b\u00e2timents
        { code: "A2-01", mission: "A2", category: "Int\u00e9gration", title: "MAJ organisation op\u00e9rationnelle (intervenants, plannings, permanences)", contractualDelay: "D\u00e8s prise d'effet mission A2", priority: "haute" as const },
        { code: "A2-02", mission: "A2", category: "Int\u00e9gration", title: "Dossiers d\u00e9claration sous-traitants et MAJ tableau r\u00e9capitulatif", contractualDelay: "D\u00e8s prise d'effet mission A2", priority: "moyenne" as const },
        { code: "A2-03", mission: "A2", category: "Int\u00e9gration", title: "Guide d'astreinte (p\u00e9rim\u00e8tre > 50 \u00e9quipements)", contractualDelay: "30 jours calendaires apr\u00e8s prise en charge", priority: "haute" as const },
        { code: "A2-04", mission: "A2", category: "Int\u00e9gration", title: "Plan de pr\u00e9vention et MAJ tableau de suivi", contractualDelay: "30 jours calendaires apr\u00e8s prise en charge", priority: "haute" as const },
        { code: "A2-05", mission: "A2", category: "Int\u00e9gration", title: "Inventaire \u00e9quipements, \u00e9tats des lieux, PV de prise en charge", contractualDelay: "120 jours \u00e0 compter de la prise d'effet mission A2", priority: "haute" as const },
        { code: "A2-06", mission: "A2", category: "Int\u00e9gration", title: "Int\u00e9gration GMAO", contractualDelay: "D\u00e8s prise d'effet mission A2", priority: "moyenne" as const },
        { code: "A2-07", mission: "A2", category: "Int\u00e9gration", title: "Ensemble des autres livrables et actions n\u00e9cessaires", contractualDelay: "D\u00e8s prise d'effet mission A2", priority: "moyenne" as const },
      ];
      await seedDeliverables(seedData as any);
      return { success: true, count: seedData.length };
    }),
  }),

  // ===== CHECKLIST (Workflow DI → Réception) =====
  checklist: router({
    getByIntervention: protectedProcedure
      .input(z.object({ interventionId: z.number() }))
      .query(async ({ input }) => {
        return getChecklistByIntervention(input.interventionId);
      }),

    toggleStep: protectedProcedure
      .input(z.object({
        interventionId: z.number(),
        stepId: z.string(),
        completed: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        await upsertChecklistStep({
          interventionId: input.interventionId,
          stepId: input.stepId,
          completed: input.completed ? 1 : 0,
          completedAt: input.completed ? Date.now() : null,
          completedBy: input.completed ? (ctx.user?.id ?? null) : null,
        });
        return { success: true };
      }),

    updateNote: protectedProcedure
      .input(z.object({
        interventionId: z.number(),
        stepId: z.string(),
        notes: z.string(),
      }))
      .mutation(async ({ input }) => {
        await updateChecklistNote(input);
        return { success: true };
      }),

    init: protectedProcedure
      .input(z.object({
        interventionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const stepIds = ["step_1", "step_2", "step_3", "step_4", "step_5", "step_6", "step_7", "step_8", "step_9", "step_10", "step_11"];
        await initChecklistForIntervention(input.interventionId, stepIds);
        return { success: true };
      }),

    summary: protectedProcedure
      .input(z.object({
        interventionIds: z.array(z.number()),
      }))
      .query(async ({ input }) => {
        return getChecklistSummaryForInterventions(input.interventionIds);
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
        content: `Tu es un expert en analyse de devis de maintenance immobilière pour la SNCF (contrat E2MT² — Lot 4.1 Occitanie, Titulaire : AXIMA CONCEPT / Equans).
Tu dois extraire les informations d'un devis, vérifier sa conformité contractuelle et le comparer au BPU.

Voici le BPU de référence :\n${bpuSummary}

## RÈGLES D'ANALYSE CONTRACTUELLES

### 1. Extraction des données
- Extrais chaque ligne de prestation : description, quantité, prix unitaire, total, unité
- Identifie le prestataire, n° devis, date, total HT, TVA, total TTC

### 2. Vérification du contenu obligatoire (Art. 15.3.5 CPS)
Un devis conforme DOIT contenir ces 14 éléments :
1. N° accord-cadre | 2. Objet des prestations | 3. Localisation (UT, bâtiment) | 4. Origine demande + demandeur
5. Caractéristiques équipements | 6. Heures MO décomposées par poste | 7. Taux horaires BPU
8. Majorations éventuelles | 9. Coûts unitaires fournitures (remises déduites) | 10. Coefficients de revente
11. Abattement franchises | 12. Total HT, TVA, TTC | 13. Délai de réalisation | 14. Copie devis fournisseurs/SST
Signale chaque élément manquant.

### 3. Vérification des calculs
- Vérifie que Total HT = somme des lignes
- Vérifie que TVA = Total HT × taux TVA (généralement 20%)
- Vérifie que TTC = HT + TVA
- Signale toute erreur de calcul

### 4. Vérification des profils MO — Références BPU (Annexe 4, Rubrique 2 "Détail D-Prest. connexes 2")
Pour chaque ligne de MO du devis, identifie le profil BPU correspondant et cite sa RÉFÉRENCE EXACTE.

**PRIX CONTRACTUELS EQUANS (BPU SIGNÉ) — Taux horaires lun-sam 8h-19h :**
| Réf. BPU | Profil MO | Prix €HT/h |
|----------|-----------|------------|
| R05 | Ingénieur Méthodes/Qualité/Sécurité/GMAO/Energies | 85,00 |
| R12 | Technicien CVCD/Plomberie (Plombier, Chauffagiste, Frigoriste) | 62,00 |
| R13 | Spécialiste constructeur Groupes Frigo/PAC | 90,00 |
| R14 | Technicien Fermetures motorisées | 75,00 |
| R15 | Technicien Protection incendie et Extincteurs | 70,00 |
| R16 | Technicien de maintenance GTC/GTB/SSI | 95,00 |
| R17 | Spécialiste constructeur GTC/GTB/SSI | 155,00 |
| R18 | Technicien Clos et Couvert | 65,00 |
| R19 | Technicien Electricien CFO/CFA/Eclairage | 70,00 |
| R20 | Spécialiste constructeur CFO (Onduleurs/GE/HT) | 130,00 |
| R21 | Spécialiste constructeur CFA (Contrôle accès/Intrusion/Vidéo) | 110,00 |
| R22 | Technicien Ascenseurs/Monte-charges/Levage | 95,00 |
| R23 | Technicien polyvalent second œuvre/menuisier/serrurier | 55,00 |
| R24 | Intervention repérage/diagnostic amiante avant travaux | 98,00 |

Pour chaque ligne MO du devis, tu DOIS indiquer :
- La référence BPU exacte (ex: R19)
- Le profil correspondant
- Le taux horaire facturé vs le taux BPU contractuel
- L'écart en % entre le taux facturé et le taux contractuel
- Si le taux facturé est DIFFÉRENT du taux contractuel, c'est une ANOMALIE à signaler impérativement

Plages horaires BPU (Annexe 4, Rubrique 2) :
- Taux de base : lundi-samedi 6h-21h
- Majorations : dimanches/fériés jour, nuit LMMJVS 21h-6h, nuit dimanches/fériés
Le taux horaire BPU INCLUT : frais de déplacement, majorations heures sup, charges salariales, petits matériels et fournitures courants, frais généraux, assurances, marges (Art. 25 CPS). Toute facturation séparée de déplacement est NON CONFORME.

### 5. Vérification de la sous-traitance — Références BPU (Annexe 4, Rubrique 3 "Détail D-Prest. connexes 3")

**COEFFICIENTS CONTRACTUELS EQUANS (BPU SIGNÉ) :**

Coefficients sous-traitance :
| Tranche SST | Montant achat SST | Coefficient Equans |
|-------------|-------------------|--------------------|
| Tranche 1 | < 2 000 €HT | 1,24 |
| Tranche 2 | 2 000 à 5 000 €HT | 1,22 |
| Tranche 3 | ≥ 5 000 €HT | 1,19 |

RÈGLE CONTRACTUELLE CLEF (Annexe 4, Rubrique 3) : "Si et seulement si le prix de la main d'œuvre sous-traitée n'est pas déterminable à partir des taux horaires prévus dans la rubrique Détail D-Prest. connexes 2, le Prestataire s'engage à appliquer un coefficient d'entreprise sur l'achat de sous-traitance."

Autrement dit :
- Le coefficient SST ne s'applique QUE si la prestation ne peut PAS être chiffrée en taux horaires BPU
- Si un profil MO BPU existe pour le travail (R05 à R24) → le Titulaire DOIT chiffrer en taux horaires, PAS en SST
- Signale si le devis est 100% sous-traitance alors qu'un profil MO BPU existe, et cite le profil BPU applicable
- Vérifie que le coefficient appliqué correspond à la bonne tranche et au coefficient contractuel Equans

Coefficients de fournitures (Annexe 4, Rubrique 3) :
| Tranche FO | Montant achat fournitures | Coefficient Equans |
|------------|---------------------------|--------------------|
| Tranche 1 | < 500 €HT | 1,24 |
| Tranche 2 | 500 à 2 000 €HT | 1,22 |
| Tranche 3 | ≥ 2 000 €HT | 1,19 |

Pour chaque coefficient appliqué dans le devis, vérifie la tranche correcte et compare au coefficient contractuel Equans.

### 6. Vérification des moyens d'accès — Références BPU (Annexe 4, Rubrique 1 "Détail D-Prest. connexes 1")

**PRIX CONTRACTUELS EQUANS (BPU SIGNÉ) :**
| Réf. BPU | Désignation | Prix €HT | Unité | Conducteur |
|----------|-------------|----------|-------|------------|
| ACC-01 | Nacelle ou plateforme mobile jusqu'à 6 m | 313,28 | Journée | SANS conducteur (MO séparée) |
| ACC-02 | Nacelle ou plateforme mobile jusqu'à 9 m | 321,78 | Journée | SANS conducteur (MO séparée) |
| ACC-03 | Camion nacelle 20 m | 1 214,27 | Journée | AVEC conducteur inclus |
| ACC-04 | Camion nacelle 30 m | 1 359,97 | Journée | AVEC conducteur inclus |

Pour chaque moyen d'accès facturé, cite la référence BPU exacte (ACC-01 à ACC-04), compare le prix facturé au prix contractuel Equans, et vérifie la cohérence conducteur/MO.
ATTENTION : Pour les mâts d'éclairage inventoriés en Mission C (codes C11B/C11C), les moyens d'accès sont déjà inclus dans le forfait ("compris moyens d'accès"). Signale si la nacelle est potentiellement déjà incluse.

**Prestations extincteurs (BPU SIGNÉ) :**
| Code | Désignation | Prix €HT |
|------|-------------|----------|
| EXT-01 | Remplacement extincteur eau pulvérisée 6L | 68,18 |
| EXT-02 | Remplacement extincteur eau pulvérisée 9L | 77,27 |
| EXT-03 | Remplacement extincteur CO2 2kg | 93,18 |
| EXT-04 | Remplacement extincteur CO2 5kg | 136,36 |
| EXT-05 | Remplacement extincteur Poudre ABC 6kg | 63,64 |
| EXT-06 | Remplacement extincteur Poudre ABC 9kg | 72,73 |
| EXT-07 | Recharge eau pulvérisée 6L | 20,45 |
| EXT-08 | Recharge eau pulvérisée 9L | 25,00 |
| EXT-09 | Recharge CO2 2kg | 22,73 |
| EXT-10 | Recharge CO2 5kg | 35,23 |
| EXT-11 | Recharge Poudre ABC 6kg | 32,95 |
| EXT-12 | Recharge Poudre ABC 9kg | 37,50 |

**Analyse amiante (BPU SIGNÉ) :**
| Code | Désignation | Prix €HT |
|------|-------------|----------|
| AM-01 | Analyse amiante (prélèvement + labo + rapport) | 80,68 |

### 7. Détection des régularisations
- Si le devis mentionne "régularisation" → l'intervention a été réalisée AVANT validation du devis
- C'est une anomalie contractuelle : le Titulaire ne doit intervenir QU'APRÈS réception du BC (Art. 15.2 CPS)
- Signale le nombre de jours entre la date d'intervention et la date du devis

### 8. Vérification des franchises
- Mission C : franchise pièces applicable (seuil défini en Annexe 1.1)
- Mission D : PAS de franchise
- Vandalisme : PAS de franchise (mais le vandalisme doit être prouvé par constat)

### 9. Comparaison BPU
- Pour chaque ligne, trouve la correspondance la plus proche dans le BPU
- Calcule l'écart en % entre le prix du devis et le prix BPU
- Écart < 5% = conforme, 5-15% = ecart_faible, > 15% = ecart_fort
- Si aucune correspondance BPU = non_trouve

### 10. Pénalités applicables
- P1 : Retard remise devis > 10 jours ouvrés → 100 €HT/jour ouvré
- P1 : Devis non conforme aux règles → 100 €HT/anomalie (1 par devis)
- P4 : Retard maintenance corrective > 2 jours au-delà des délais → 50 €HT/jour calendaire
- P6 : Non tenue à jour GMAO → 100 €HT/constat

### 11. Vérification des niveaux de maintenance (Annexe 1.3A)
Pour chaque devis, détermine si la MO est légitimement facturable en Mission D en appliquant les 8 questions Q1-Q8 :
- Q1 : Vandalisme/malveillance ? OUI = MO facturable (exiger PHOTO). NON → Q2
- Q2 : Mise en conformité réglementaire ? OUI = MO facturable. NON → Q3
- Q3 : Opération classée Niveau 5 dans les tableaux Annexe 1.3A ? OUI = MO facturable. NON → Q4
- Q4 : Équipement complet ou Pièce Détachée (PD) ? PD = MO incluse Mission C (non facturable). Équipement complet → Q5-Q8
- Q5 : Remplacement installation globale ? OUI = MO facturable. NON → Q6
- Q6 : Changement profond caractéristiques techniques ? OUI = MO facturable. NON → Q7
- Q7 : Sous-traitance très spécialisée (grutage, manutention lourde) ? OUI = MO facturable. NON → Q8
- Q8 : Durée de vie théorique dépassée ? OUI = MO facturable. NON = MO incluse Mission C

Équipements systématiquement N5 (MO facturable) : Chaudière ≥30kW, Groupe eau glacée, Split complet, Armoire clim, PAC centralisée, CTA complète, Remplacement complet fermetures motorisées, Armoire élec >30 départs, Cellules HT/transfo/TGBT, Groupe électrogène, Onduleur >50kVA, Préparateur ECS >100L, Centrale incendie type 1-3, Nacelle/Plateforme PMR, Extincteur complet.

Pièces Détachées (MO TOUJOURS incluse Mission C) : Brûleur, Compresseur frigo, Régulation/Variateur/Ventilateur CTA, Vannes/robinetterie, Moteurs électriques, Dispositifs commande/sécurité, Disjoncteurs BT, Batteries onduleur, Appareillage électrique, Contact porte, Détecteurs, Lames tablier, Lisses barrière.

Durées de vie théoriques clés : 10 ans (vase expansion, pompe eaux chargées), 12 ans (BAES), 15 ans (chaudière <30kW, ECS ≤100L, onduleur ≤50kVA, lecteurs badge), 20 ans (ventilo-convecteur, VMC, pompes, ECS gaz), 25 ans (compteurs, vannes plomberie), 30 ans (radiateur, armoire ≤30 départs, éclairage, RIA, sanitaires).

Si la MO est incluse en Mission C mais que le devis la facture quand même → signale comme anomalie majeure ("MO non facturable selon Annexe 1.3A").

### 12. Tableau récapitulatif BPU obligatoire
Pour CHAQUE ligne du devis, tu DOIS fournir dans le champ bpuReference un tableau structuré :
- Référence BPU exacte (ex: R19, ACC-01, Tranche FO 1, Tranche SST 2, EXT-03, AM-01)
- Source dans l'Annexe 4 (ex: "Rubrique 2 — Détail D-Prest. connexes 2")
- Prix BPU contractuel Equans (OBLIGATOIRE — les prix sont maintenant connus, voir tableaux ci-dessus)
- Écart constaté en % entre le prix facturé et le prix BPU contractuel
- Si le prix facturé est différent du prix contractuel, SIGNALER comme ANOMALIE

Si l'équipement est mentionné comme "non repris au périmètre" ou "hors périmètre", vérifie dans les codes BPU Mission C (C01 à C14) si l'équipement devrait être inventorié.

### Verdict global
- "valide" : devis conforme, calculs corrects, contenu complet, profils MO corrects
- "a_reverifier" : écarts de prix, éléments manquants mineurs, ou points à clarifier
- "rejete" : erreurs de calcul, régularisation non justifiée, SST non conforme, contenu très incomplet, total >20% au-dessus du BPU théorique`,
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
                  bpuReference: { type: "string", description: "Référence BPU exacte (ex: R19 — Technicien Electricien CFO/CFA/Eclairage, Annexe 4 Rubrique 2) ou ACC-01, Tranche FO 1, etc. Si BPU signé non disponible, indiquer 'BPU signé requis pour vérification du taux'" },
                  bpuSource: { type: "string", description: "Source dans l'Annexe 4 (ex: 'Rubrique 2 — Détail D-Prest. connexes 2' ou 'Rubrique 1 — Détail D-Prest. connexes 1')" },
                  moFacturable: { type: "string", description: "Résultat de l'analyse Annexe 1.3A : 'OUI — MO facturable Mission D (raison)' ou 'NON — MO incluse Mission C (raison)' ou 'À VÉRIFIER (raison)'" },
                },
                required: ["description", "quantity", "unitPrice", "totalPrice", "unit", "matchedBpuCode", "bpuUnitPrice", "ecartPct", "lineStatus", "matchConfidence", "bpuReference", "bpuSource", "moFacturable"],
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
      bpuReference: line.bpuReference || null,
      bpuSource: line.bpuSource || null,
      moFacturable: line.moFacturable || null,
    }));
    await createDevisLines(lines);
  }

  console.log(`Devis ${devisId} analyzed: ${analysis.verdict} (${analysis.lines?.length || 0} lines)`);
}
