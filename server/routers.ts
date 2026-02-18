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

## Guide Connect'Immo - Procédures détaillées

### Créer un projet OPEX dans Connect'Immo
1. Menu "Opérations" > "Création" > Cliquer "+" pour nouveau projet
2. Champs obligatoires (*) : DIT*, Région*, UT*, Bien*, Intitulé du projet*, Origine*, Sous-Types*, Gérants de programme*, Attributaire*
3. Après création : ID projet au format P-23-XXXXXX, commande par défaut au format 23-XXXXXX
4. 5 onglets du projet : Emergence, Prévision pluriannuelle, Ouverture AT/OS, Synthèse commande(s), Demande de devis / Vie de la commande
5. Astuce : saisir "MULTI" pour UT et/ou Bien quand la valeur est inconnue (AT générique)

### Attribuer un N° AT/OS dans Connect'Immo
- Règle d'unicité : un N° AT/OS ne peut plus être utilisé sur plusieurs projets
- Onglet "Ouverture AT/OS" > Sélectionner ou "Ajouter un nouveau N° AT/OS"
- Si le N° existe déjà : message d'erreur, rechercher le projet existant via "Filtrer par région"

### Créer un chantier dans Connect'Immo
- Menu "Opérations" > "Chantier" > Renseigner DIT*, Région*, UT*, Bien*
- Cocher les projets à associer > Flèche droite > "Créer le chantier"
- Un projet = un seul chantier à la fois
- Montant total = somme des montants des ATs des projets associés

### Vie de la commande dans Connect'Immo
- Renseigner : N° devis, N° DA, N° CDA, N° réception pour compléter le camembert de statut
- Référence du contrat : liste déroulante + "Ajouter un nouveau N° de contrat"
- Quand Axe local/central non valorisés : vérifier N° AT/OS dans "Ouverture AT/OS" et Référence contrat dans "Vie de la commande"

### Rapports OPEX Connect'Immo
- Menu "Reporting" > "OPEX" > 3 rapports : données en cours, données projets, données antérieures N-2
- Export : "..." > "Exporter des données" > "Exporter"
- Les données s'actualisent chaque nuit

### Modification en masse Connect'Immo
- "Filtrer par région" : DIT*, Région*, filtres avancés (Pilote, Gérant, N° AT, Sous-type, Statut, etc.)
- "Filtrer par pilote" : DIT*, Pilote*
- Modification directe dans le tableau + bouton "Enregistrer"

### Regroupement transverse Connect'Immo
Liste de programmes prioritaires : Enveloppe RH IST 4.4, Enveloppe RH IST ADAP, AUTRES (Dont C2MI, PLI, VRD), ECO NRJ – DECRET TERTIAIRE-DECARBONATION, MIXITE, MEC MCO MES CEPIA

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

## BPU - Bordereau de Prix Unitaires (Lot 4.1 - Occitanie)
Voici le référentiel de prix contractuel :\n${bpuContext}

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
