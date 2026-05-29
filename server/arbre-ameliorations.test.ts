import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Read source files for content validation
const assistantPage = readFileSync(resolve(__dirname, "../client/src/pages/AssistantPage.tsx"), "utf-8");
const arbreDecisionPage = readFileSync(resolve(__dirname, "../client/src/pages/ArbreDecisionPage.tsx"), "utf-8");
const routersFile = readFileSync(resolve(__dirname, "./routers.ts"), "utf-8");
const dbFile = readFileSync(resolve(__dirname, "./db.ts"), "utf-8");
const schemaFile = readFileSync(resolve(__dirname, "../drizzle/schema.ts"), "utf-8");

describe("Amélioration 1: Connexion Assistant IA ↔ Arbre de Décision", () => {
  it("AssistantPage lit le sessionStorage assistant_prefill", () => {
    expect(assistantPage).toContain("sessionStorage.getItem(\"assistant_prefill\")");
  });

  it("AssistantPage supprime le prefill après lecture", () => {
    expect(assistantPage).toContain("sessionStorage.removeItem(\"assistant_prefill\")");
  });

  it("AssistantPage envoie automatiquement le message pré-rempli", () => {
    expect(assistantPage).toContain("handleSendMessage(prefill)");
  });

  it("ArbreDecisionPage écrit dans sessionStorage avant navigation", () => {
    expect(arbreDecisionPage).toContain("sessionStorage.setItem(\"assistant_prefill\"");
  });

  it("ArbreDecisionPage navigue vers /assistant", () => {
    expect(arbreDecisionPage).toContain("setLocation(\"/assistant\")");
  });

  it("Le contexte envoyé contient les informations de décision", () => {
    expect(arbreDecisionPage).toContain("Résultat arbre de décision");
    expect(arbreDecisionPage).toContain("Analyse le devis en tenant compte de ces paramètres");
  });
});

describe("Amélioration 2: Mode seuil montant", () => {
  it("ArbreDecisionPage contient un champ de saisie montant", () => {
    expect(arbreDecisionPage).toContain("montantDevis");
    expect(arbreDecisionPage).toContain("setMontantDevis");
  });

  it("Le seuil 3500€ est utilisé pour basculer vers PTP", () => {
    expect(arbreDecisionPage).toContain("montant <= 3500");
    expect(arbreDecisionPage).toContain("PTP_CMT");
    expect(arbreDecisionPage).toContain("ZG361510");
  });

  it("Le seuil 15000€ est utilisé pour la réception formelle", () => {
    expect(arbreDecisionPage).toContain("montant > 15000");
    expect(arbreDecisionPage).toContain("réception formelle obligatoire");
  });

  it("Le montant est affiché dans le résultat copié", () => {
    expect(arbreDecisionPage).toContain("MONTANT DEVIS");
  });

  it("Le bouton Appliquer est présent", () => {
    expect(arbreDecisionPage).toContain("setMontantApplied(true)");
    expect(arbreDecisionPage).toContain("Appliquer");
  });

  it("Le sous-type est ajusté dynamiquement (adjustedResult)", () => {
    expect(arbreDecisionPage).toContain("adjustedResult");
    expect(arbreDecisionPage).toContain("Ajusté par montant");
  });

  it("Les règles de seuil sont affichées à l'utilisateur", () => {
    expect(arbreDecisionPage).toContain("3 500");
    expect(arbreDecisionPage).toContain("15 000");
    expect(arbreDecisionPage).toContain("PTP");
    expect(arbreDecisionPage).toContain("validation GP");
    expect(arbreDecisionPage).toContain("réception formelle");
  });
});

describe("Amélioration 3: Historisation des décisions", () => {
  describe("Schema DB", () => {
    it("La table decision_history existe dans le schéma", () => {
      expect(schemaFile).toContain("decision_history");
    });

    it("La table contient les champs essentiels", () => {
      expect(schemaFile).toContain("mission");
      expect(schemaFile).toContain("missionLabel");
      expect(schemaFile).toContain("chargeType");
      expect(schemaFile).toContain("sousTypeCode");
      expect(schemaFile).toContain("famillebudgetaire");
      expect(schemaFile).toContain("montantDevis");
      expect(schemaFile).toContain("parcours");
    });

    it("Le type est exporté", () => {
      expect(schemaFile).toContain("export type DecisionHistory");
      expect(schemaFile).toContain("export type InsertDecisionHistory");
    });
  });

  describe("DB Helpers", () => {
    it("saveDecision est défini", () => {
      expect(dbFile).toContain("export async function saveDecision");
    });

    it("getDecisionHistory est défini", () => {
      expect(dbFile).toContain("export async function getDecisionHistory");
    });

    it("getAllDecisionHistory est défini", () => {
      expect(dbFile).toContain("export async function getAllDecisionHistory");
    });

    it("getDecisionStats est défini avec agrégations", () => {
      expect(dbFile).toContain("export async function getDecisionStats");
      expect(dbFile).toContain("missionC");
      expect(dbFile).toContain("missionD");
      expect(dbFile).toContain("chargeLocataire");
      expect(dbFile).toContain("chargeProprietaire");
    });
  });

  describe("Procédures tRPC", () => {
    it("Le routeur decisions.save existe", () => {
      expect(routersFile).toContain("decisions: router({");
      expect(routersFile).toContain("save: protectedProcedure");
    });

    it("Le routeur decisions.list existe", () => {
      expect(routersFile).toContain("list: protectedProcedure");
    });

    it("Le routeur decisions.listAll existe", () => {
      expect(routersFile).toContain("listAll: protectedProcedure");
    });

    it("Le routeur decisions.stats existe", () => {
      expect(routersFile).toContain("stats: protectedProcedure");
    });
  });

  describe("Frontend - Bouton sauvegarder", () => {
    it("Le bouton Sauvegarder est présent", () => {
      expect(arbreDecisionPage).toContain("handleSaveDecision");
      expect(arbreDecisionPage).toContain("Sauvegarder (mise à jour)");
    });

    it("Le mutation trpc.decisions.save est utilisé", () => {
      expect(arbreDecisionPage).toContain("trpc.decisions.save.useMutation");
    });

    it("Le bouton est désactivé après sauvegarde", () => {
      expect(arbreDecisionPage).toContain("disabled={saved || saveMutation.isPending}");
    });

    it("Un toast de confirmation est affiché", () => {
      expect(arbreDecisionPage).toContain("Décision sauvegardée dans l'historique");
    });
  });
});
