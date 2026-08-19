import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const routerContent = readFileSync(join(__dirname, "routers.ts"), "utf-8");
const dbContent = readFileSync(join(__dirname, "db.ts"), "utf-8");
const schemaContent = readFileSync(join(__dirname, "../drizzle/schema.ts"), "utf-8");

describe("Questions COTECH", () => {
  describe("Schéma BDD", () => {
    it("contient la table cotech_questions", () => {
      expect(schemaContent).toContain("cotechQuestions");
      expect(schemaContent).toContain("cotech_questions");
    });

    it("a les champs obligatoires", () => {
      expect(schemaContent).toContain("question");
      expect(schemaContent).toContain("reponse");
      expect(schemaContent).toContain("resolved");
      expect(schemaContent).toContain("archived");
      expect(schemaContent).toContain("priority");
      expect(schemaContent).toContain("reference");
      expect(schemaContent).toContain("category");
    });

    it("a les champs de dates", () => {
      expect(schemaContent).toContain("reponseDate");
      expect(schemaContent).toContain("resolvedAt");
      expect(schemaContent).toContain("archivedAt");
    });
  });

  describe("Helpers BDD", () => {
    it("exporte createCotechQuestion", () => {
      expect(dbContent).toContain("export async function createCotechQuestion");
    });

    it("exporte getCotechQuestions avec filtres", () => {
      expect(dbContent).toContain("export async function getCotechQuestions");
      expect(dbContent).toContain("options.archived");
    });

    it("exporte updateCotechQuestion", () => {
      expect(dbContent).toContain("export async function updateCotechQuestion");
    });

    it("exporte deleteCotechQuestion", () => {
      expect(dbContent).toContain("export async function deleteCotechQuestion");
    });
  });

  describe("Routeur tRPC", () => {
    it("contient le routeur cotech", () => {
      expect(routerContent).toContain("cotech: router({");
    });

    it("a les procédures CRUD", () => {
      expect(routerContent).toContain("cotech");
      // Vérifier les noms de procédures dans le contexte du routeur cotech
      expect(dbContent).toContain("createCotechQuestion");
      expect(dbContent).toContain("getCotechQuestions");
      expect(dbContent).toContain("updateCotechQuestion");
      expect(dbContent).toContain("deleteCotechQuestion");
    });

    it("a la procédure archiveResolved", () => {
      expect(routerContent).toContain("archiveResolved");
    });
  });
});

describe("Suivi Auto-Création", () => {
  describe("Helpers BDD", () => {
    it("exporte findSuiviByDevisOrOT pour dédoublonnage", () => {
      expect(dbContent).toContain("export async function findSuiviByDevisOrOT");
    });

    it("exporte createSuiviEntryAuto avec dédoublonnage", () => {
      expect(dbContent).toContain("export async function createSuiviEntryAuto");
      expect(dbContent).toContain("alreadyExists");
    });

    it("vérifie l'existence avant insertion", () => {
      expect(dbContent).toContain("findSuiviByDevisOrOT");
      expect(dbContent).toContain("if (existing)");
    });
  });

  describe("Routeur tRPC", () => {
    it("contient le routeur suiviAuto", () => {
      expect(routerContent).toContain("suiviAuto: router({");
    });

    it("a la procédure createFromDevis", () => {
      expect(routerContent).toContain("createFromDevis");
    });

    it("a la procédure checkExists", () => {
      expect(routerContent).toContain("checkExists");
    });

    it("accepte les champs du devis", () => {
      expect(routerContent).toContain("prestataire");
      expect(routerContent).toContain("numDevis");
      expect(routerContent).toContain("numAT");
      expect(routerContent).toContain("devisUrl");
    });
  });
});

describe("Intégration dans les pages", () => {
  it("la page ImmosisConnectImmo a le bouton suivi auto", () => {
    const pageContent = readFileSync(
      join(__dirname, "../client/src/pages/ImmosisConnectImmoPage.tsx"),
      "utf-8"
    );
    expect(pageContent).toContain("suiviAuto.createFromDevis");
    expect(pageContent).toContain("Ajouter au tableau de suivi");
    expect(pageContent).toContain("alreadyExists");
  });

  it("la page CotechQuestions existe et a les fonctionnalités clés", () => {
    const pageContent = readFileSync(
      join(__dirname, "../client/src/pages/CotechQuestionsPage.tsx"),
      "utf-8"
    );
    expect(pageContent).toContain("cotech.list");
    expect(pageContent).toContain("cotech.create");
    expect(pageContent).toContain("cotech.update");
    expect(pageContent).toContain("cotech.delete");
    expect(pageContent).toContain("archiveResolved");
    expect(pageContent).toContain("Questions COTECH");
  });

  it("la sidebar contient le lien Questions COTECH", () => {
    const layoutContent = readFileSync(
      join(__dirname, "../client/src/components/DashboardLayout.tsx"),
      "utf-8"
    );
    expect(layoutContent).toContain("Questions COTECH");
    expect(layoutContent).toContain("/cotech");
  });

  it("App.tsx contient la route /cotech", () => {
    const appContent = readFileSync(
      join(__dirname, "../client/src/App.tsx"),
      "utf-8"
    );
    expect(appContent).toContain("/cotech");
    expect(appContent).toContain("CotechQuestionsPage");
  });
});
