import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const historiquePage = readFileSync(resolve(__dirname, "../client/src/pages/HistoriqueDecisionsPage.tsx"), "utf-8");
const arbreDecisionPage = readFileSync(resolve(__dirname, "../client/src/pages/ArbreDecisionPage.tsx"), "utf-8");
const dashboardLayout = readFileSync(resolve(__dirname, "../client/src/components/DashboardLayout.tsx"), "utf-8");
const appTsx = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf-8");
const routersFile = readFileSync(resolve(__dirname, "./routers.ts"), "utf-8");

describe("Page Historique des Décisions", () => {
  describe("Route et navigation", () => {
    it("La route /historique-decisions est définie dans App.tsx", () => {
      expect(appTsx).toContain("/historique-decisions");
      expect(appTsx).toContain("HistoriqueDecisionsPage");
    });

    it("L'entrée est présente dans la sidebar", () => {
      expect(dashboardLayout).toContain("Historique Décisions");
      expect(dashboardLayout).toContain("/historique-decisions");
      expect(dashboardLayout).toContain("History");
    });
  });

  describe("Tableau filtrable", () => {
    it("Contient un champ de recherche", () => {
      expect(historiquePage).toContain("searchTerm");
      expect(historiquePage).toContain("setSearchTerm");
      expect(historiquePage).toContain("Rechercher");
    });

    it("Filtre par mission (C/D)", () => {
      expect(historiquePage).toContain("filterMission");
      expect(historiquePage).toContain("Mission C");
      expect(historiquePage).toContain("Mission D");
    });

    it("Filtre par type de charge", () => {
      expect(historiquePage).toContain("filterCharge");
      expect(historiquePage).toContain("Locataire");
      expect(historiquePage).toContain("Propriétaire");
      expect(historiquePage).toContain("Mixte");
    });

    it("Filtre par famille budgétaire", () => {
      expect(historiquePage).toContain("filterFamille");
      expect(historiquePage).toContain("uniqueFamilles");
    });

    it("Affiche un tableau avec les colonnes essentielles", () => {
      expect(historiquePage).toContain("TableHeader");
      expect(historiquePage).toContain("TableBody");
      expect(historiquePage).toContain("Date");
      expect(historiquePage).toContain("Mission");
      expect(historiquePage).toContain("Charge");
      expect(historiquePage).toContain("Sous-type");
      expect(historiquePage).toContain("Code ZG");
      expect(historiquePage).toContain("Nature travaux");
      expect(historiquePage).toContain("Montant");
    });

    it("Affiche un dialogue de détail au clic", () => {
      expect(historiquePage).toContain("selectedDecision");
      expect(historiquePage).toContain("Dialog");
      expect(historiquePage).toContain("Détail de la décision");
    });

    it("Affiche le parcours de décision dans le détail", () => {
      expect(historiquePage).toContain("Parcours de décision");
      expect(historiquePage).toContain("parcours");
    });

    it("Affiche les recommandations dans le détail", () => {
      expect(historiquePage).toContain("Recommandations");
      expect(historiquePage).toContain("recommandations");
    });
  });

  describe("Statistiques globales", () => {
    it("Affiche le total des décisions", () => {
      expect(historiquePage).toContain("Total décisions");
      expect(historiquePage).toContain("stats?.total");
    });

    it("Affiche le nombre de Mission C", () => {
      expect(historiquePage).toContain("stats?.missionC");
    });

    it("Affiche le nombre de Mission D", () => {
      expect(historiquePage).toContain("stats?.missionD");
    });

    it("Affiche le compteur du mois en cours", () => {
      expect(historiquePage).toContain("thisMonthCount");
      expect(historiquePage).toContain("Ce mois");
    });

    it("Affiche le pourcentage charge propriétaire", () => {
      expect(historiquePage).toContain("chargeProprietaire");
      expect(historiquePage).toContain("Charge propriétaire");
    });
  });
});

describe("Export CSV", () => {
  it("Le bouton Export CSV est présent", () => {
    expect(historiquePage).toContain("Export CSV");
    expect(historiquePage).toContain("handleExportCSV");
  });

  it("Le CSV contient les headers corrects", () => {
    expect(historiquePage).toContain("Date");
    expect(historiquePage).toContain("Mission (détail)");
    expect(historiquePage).toContain("Charge (détail)");
    expect(historiquePage).toContain("Sous-type code");
    expect(historiquePage).toContain("Famille budgétaire");
    expect(historiquePage).toContain("Code ZG");
    expect(historiquePage).toContain("MO facturable");
    expect(historiquePage).toContain("Nature travaux");
    expect(historiquePage).toContain("Montant devis");
    expect(historiquePage).toContain("Recommandations");
  });

  it("Le CSV utilise le séparateur point-virgule (Excel FR)", () => {
    expect(historiquePage).toContain('join(";")');
  });

  it("Le CSV inclut le BOM UTF-8 pour Excel", () => {
    expect(historiquePage).toContain("\\uFEFF");
  });

  it("Le fichier est nommé avec la date", () => {
    expect(historiquePage).toContain("historique-decisions-");
    expect(historiquePage).toContain(".csv");
  });

  it("Un toast confirme l'export", () => {
    expect(historiquePage).toContain("décisions exportées en CSV");
  });
});

describe("Sauvegarde automatique", () => {
  it("Un useEffect déclenche la sauvegarde quand result est défini", () => {
    expect(arbreDecisionPage).toContain("autoSaveRef");
    expect(arbreDecisionPage).toContain("useRef(false)");
  });

  it("La sauvegarde est déclenchée après un délai (500ms)", () => {
    expect(arbreDecisionPage).toContain("setTimeout");
    expect(arbreDecisionPage).toContain("500");
  });

  it("Le ref est réinitialisé quand result est null (reset)", () => {
    expect(arbreDecisionPage).toContain("autoSaveRef.current = false");
  });

  it("Le bouton indique 'Sauvegardé automatiquement' après la sauvegarde", () => {
    expect(arbreDecisionPage).toContain("Sauvegardé automatiquement");
  });

  it("Le bouton propose 'Sauvegarder (mise à jour)' pour re-sauvegarder avec montant", () => {
    expect(arbreDecisionPage).toContain("Sauvegarder (mise à jour)");
  });
});

describe("Backend - Procédures tRPC", () => {
  it("decisions.listAll est utilisé par la page historique", () => {
    expect(historiquePage).toContain("trpc.decisions.listAll.useQuery");
  });

  it("decisions.stats est utilisé par la page historique", () => {
    expect(historiquePage).toContain("trpc.decisions.stats.useQuery");
  });

  it("Le routeur decisions.listAll accepte un limit", () => {
    expect(routersFile).toContain("listAll: protectedProcedure");
    expect(routersFile).toContain("getAllDecisionHistory");
  });

  it("Le routeur decisions.stats retourne les agrégations", () => {
    expect(routersFile).toContain("stats: protectedProcedure");
    expect(routersFile).toContain("getDecisionStats");
  });
});
