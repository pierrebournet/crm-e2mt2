import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Read the router file to verify prompt content
const routerContent = readFileSync(join(__dirname, "routers.ts"), "utf-8");

describe("Immosis & Connect'Immo - Base de connaissances dans le prompt", () => {
  describe("Instructions spéciales pour génération de trames", () => {
    it("contient la section GÉNÉRATION TRAMES IMMOSIS & CONNECT'IMMO", () => {
      expect(routerContent).toContain("GÉNÉRATION TRAMES IMMOSIS & CONNECT'IMMO");
    });

    it("contient les règles de remplissage IMMOSIS", () => {
      expect(routerContent).toContain("RÈGLES DE REMPLISSAGE IMMOSIS");
      expect(routerContent).toContain("NETiKA");
    });

    it("contient les règles de remplissage CONNECT'IMMO", () => {
      expect(routerContent).toContain("RÈGLES DE REMPLISSAGE CONNECT'IMMO");
      expect(routerContent).toContain("V11");
    });

    it("contient le format de nommage AT 47-26-xxxx", () => {
      expect(routerContent).toContain("47-26-DI-");
      expect(routerContent).toContain("ÉMETTEUR = DI OBLIGATOIREMENT");
      expect(routerContent).toContain("JAMAIS ESBE");
    });

    it("contient la règle OPTIM SERVICES", () => {
      expect(routerContent).toContain("OPTIM SERVICES (ex GIE)");
      expect(routerContent).toContain("100% DIRECTION DE L'IMMOBILIER");
    });
  });

  describe("Listes déroulantes Immosis", () => {
    it("contient les gérants de programme Immosis", () => {
      expect(routerContent).toContain("ISM TER OCCITANIE");
      expect(routerContent).toContain("ISM TER PROVENCE ALPES COTE D AZUR");
      expect(routerContent).toContain("RESEAU FERROVIAIRE");
      expect(routerContent).toContain("OPTIM SERVICES");
      expect(routerContent).toContain("MAINTENANCE LOCATIVE INDUSTRIEL ET FERROVIAIRE");
    });

    it("contient les codes nature 83xx-89xx", () => {
      expect(routerContent).toContain("8301 Assainissement");
      expect(routerContent).toContain("8312 Électricité BT");
      expect(routerContent).toContain("8320 CVC");
      expect(routerContent).toContain("8501 Structure");
      expect(routerContent).toContain("8503 Couvert");
      expect(routerContent).toContain("8610 Maintenance E2MT");
    });

    it("contient la ventilation B/D Propriétaire", () => {
      expect(routerContent).toContain("SNCF VOYAGEURS");
      expect(routerContent).toContain("SNCF RESEAU");
      expect(routerContent).toContain("FRET TRANSPORTS LOGISTIQUE");
    });
  });

  describe("Listes déroulantes Connect'Immo", () => {
    it("contient les origines Connect'Immo", () => {
      expect(routerContent).toContain("Activité/Occupant");
      expect(routerContent).toContain("Mainteneur");
      expect(routerContent).toContain("Gestionnaire d'actif");
      expect(routerContent).toContain("FEX");
    });

    it("contient les sous-types Connect'Immo", () => {
      expect(routerContent).toContain("Gros Entretiens - par E2MT");
      expect(routerContent).toContain("Petits Travaux Propriétaires - E2MT");
      expect(routerContent).toContain("Contrats de Maintenance Externe - E2MT");
      expect(routerContent).toContain("Vérifications Réglementaires");
      expect(routerContent).toContain("Maintenance Locative");
    });

    it("contient les gérants de programme Connect'Immo", () => {
      // Les gérants sont listés dans le prompt en majuscules (section Immosis) et en casse mixte dans le JSON template
      expect(routerContent).toContain("ISM TER OCCITANIE");
      expect(routerContent).toContain("ISM TER PROVENCE ALPES COTE D AZUR");
      expect(routerContent).toContain("OPTIM SERVICES");
      expect(routerContent).toContain("RESEAU FERROVIAIRE");
    });

    it("contient les attributaires", () => {
      expect(routerContent).toContain("ABE, Gestionnaire, DIT, A renseigner");
    });

    it("contient la correspondance sous-type IMMOSIS → Connect'Immo", () => {
      expect(routerContent).toContain('GE→"Gros Entretiens - par E2MT"');
      expect(routerContent).toContain('PTP→"Petits Travaux Propriétaires - E2MT"');
      expect(routerContent).toContain('CME→"Contrats de Maintenance Externe - E2MT"');
    });
  });

  describe("Les 7 onglets Connect'Immo", () => {
    it("mentionne les 7 onglets du workflow", () => {
      expect(routerContent).toContain("7 onglets Connect'Immo");
      expect(routerContent).toContain("Emergence");
      expect(routerContent).toContain("Prévision pluriannuelle");
      expect(routerContent).toContain("Ouverture AT/OS");
      expect(routerContent).toContain("Synthèse commandes");
      expect(routerContent).toContain("Demande de devis");
      expect(routerContent).toContain("Vie de la commande");
    });
  });

  describe("Workflow de facturation", () => {
    it("contient le workflow IMMOSIS → CONNECT'IMMO → ERP → PSFOUR", () => {
      expect(routerContent).toContain("IMMOSIS (AT→axe local+central)");
      expect(routerContent).toContain("CONNECT'IMMO (projet+AT/OS+axes)");
      expect(routerContent).toContain("ERP (DA+CDA+Réception)");
      expect(routerContent).toContain("PSFOUR (Facture)");
    });
  });

  describe("Format JSON de réponse", () => {
    it("contient le format JSON obligatoire pour les trames", () => {
      expect(routerContent).toContain('"immosis":{');
      expect(routerContent).toContain('"connectImmo":{');
      expect(routerContent).toContain('"warnings":[]');
    });
  });
});

describe("Exigences CDC E2MT² dans l'étape 5 (Conformité devis)", () => {
  it("contient la section CONTRÔLE CDC E2MT²", () => {
    expect(routerContent).toContain("CONTRÔLE CDC E2MT²");
    expect(routerContent).toContain("Pièces obligatoires du devis");
    expect(routerContent).toContain("Cahier des Charges");
  });

  it("vérifie CDC-1 : Cadre de décomposition du prix", () => {
    expect(routerContent).toContain("CDC-1");
    expect(routerContent).toContain("Cadre de décomposition du prix");
    expect(routerContent).toContain("prix unitaires fournitures");
    expect(routerContent).toContain("temps unitaires MO");
  });

  it("vérifie CDC-2 : Durée de validité", () => {
    expect(routerContent).toContain("CDC-2");
    expect(routerContent).toContain("Durée de validité de la proposition tarifaire");
  });

  it("vérifie CDC-3 : Notice descriptive", () => {
    expect(routerContent).toContain("CDC-3");
    expect(routerContent).toContain("Notice descriptive");
    expect(routerContent).toContain("matériaux");
    expect(routerContent).toContain("dispositions constructives");
  });

  it("vérifie CDC-4 : Délai total d'exécution avec planning", () => {
    expect(routerContent).toContain("CDC-4");
    expect(routerContent).toContain("Délai total d'exécution");
    expect(routerContent).toContain("planning détaillé");
    expect(routerContent).toContain("approvisionnements");
    expect(routerContent).toContain("réception");
  });

  it("vérifie CDC-5 : Coupures ou arrêts d'installations", () => {
    expect(routerContent).toContain("CDC-5");
    expect(routerContent).toContain("Coupures ou arrêts d'installations");
  });

  it("vérifie CDC-6 : Copie des devis fournisseur/sous-traitant", () => {
    expect(routerContent).toContain("CDC-6");
    expect(routerContent).toContain("Copie des devis fournisseur");
  });

  it("vérifie CDC-7 : Date prévisionnelle d'engagement dans le devis", () => {
    expect(routerContent).toContain("CDC-7");
    expect(routerContent).toContain("Date prévisionnelle d'engagement");
    expect(routerContent).toContain("dans le devis");
  });

  it("vérifie CDC-8 : Date prévisionnelle dans IGO", () => {
    expect(routerContent).toContain("CDC-8");
    expect(routerContent).toContain("IGO");
    expect(routerContent).toContain("date de fin prévue");
  });

  it("contient la règle de signalement anomalie modérée", () => {
    expect(routerContent).toContain("ANOMALIE MODÉRÉE");
    expect(routerContent).toContain("compléter son devis avant validation");
  });

  it("rappelle l'obligation de reporter dans IGO", () => {
    expect(routerContent).toContain("date prévisionnelle d'engagement doit figurer dans le devis ET être reportée dans IGO");
  });
});

describe("Base de connaissances structurée (fichier knowledge)", () => {
  // Test the knowledge file exists and exports correctly
  it("exporte les listes déroulantes Connect'Immo", async () => {
    const knowledge = await import("./immosis-connectimmo-knowledge");
    expect(knowledge.CONNECTIMMO_ORIGINES).toBeDefined();
    expect(knowledge.CONNECTIMMO_ORIGINES.length).toBeGreaterThan(15);
    expect(knowledge.CONNECTIMMO_SOUS_TYPES).toBeDefined();
    expect(knowledge.CONNECTIMMO_SOUS_TYPES.length).toBeGreaterThan(25);
    expect(knowledge.CONNECTIMMO_GERANTS_PROGRAMME).toBeDefined();
    expect(knowledge.CONNECTIMMO_GERANTS_PROGRAMME.length).toBeGreaterThan(20);
    expect(knowledge.CONNECTIMMO_ATTRIBUTAIRES).toBeDefined();
    expect(knowledge.CONNECTIMMO_ATTRIBUTAIRES.length).toBe(4);
  });

  it("exporte les listes déroulantes Immosis", async () => {
    const knowledge = await import("./immosis-connectimmo-knowledge");
    expect(knowledge.IMMOSIS_GERANTS_PROGRAMME).toBeDefined();
    expect(knowledge.IMMOSIS_GERANTS_PROGRAMME.length).toBeGreaterThan(20);
    expect(knowledge.IMMOSIS_NATURES).toBeDefined();
    expect(knowledge.IMMOSIS_NATURES.length).toBeGreaterThan(20);
    expect(knowledge.IMMOSIS_VENTILATION_BD).toBeDefined();
    expect(knowledge.IMMOSIS_VENTILATION_BD.length).toBeGreaterThan(15);
  });

  it("exporte les règles métier", async () => {
    const knowledge = await import("./immosis-connectimmo-knowledge");
    expect(knowledge.REGLE_OPTIM_SERVICES).toBeDefined();
    expect(knowledge.REGLE_OPTIM_SERVICES.gerant).toBe("OPTIM SERVICES");
    expect(knowledge.REGLE_OPTIM_SERVICES.ventilationBD).toBe("DIRECTION DE L'IMMOBILIER");
    expect(knowledge.REGLE_OPTIM_SERVICES.pourcentage).toBe(100);
  });

  it("exporte le nommage AT config", async () => {
    const knowledge = await import("./immosis-connectimmo-knowledge");
    expect(knowledge.NOMMAGE_AT_CONFIG).toBeDefined();
    expect(knowledge.NOMMAGE_AT_CONFIG.prefixe).toBe("47-26-");
    expect(knowledge.NOMMAGE_AT_CONFIG.emetteur).toBe("DI");
  });

  it("exporte les correspondances sous-types", async () => {
    const knowledge = await import("./immosis-connectimmo-knowledge");
    expect(knowledge.CORRESPONDANCE_SOUS_TYPES).toBeDefined();
    expect(knowledge.CORRESPONDANCE_SOUS_TYPES["GE"]).toBe("Gros Entretiens - par E2MT");
    expect(knowledge.CORRESPONDANCE_SOUS_TYPES["PTP"]).toBe("Petits Travaux Propriétaires - E2MT");
    expect(knowledge.CORRESPONDANCE_SOUS_TYPES["CME"]).toBe("Contrats de Maintenance Externe - E2MT");
  });

  it("exporte les correspondances gérant → SA", async () => {
    const knowledge = await import("./immosis-connectimmo-knowledge");
    expect(knowledge.GERANT_VERS_SA).toBeDefined();
    expect(knowledge.GERANT_VERS_SA["ISM TER OCCITANIE"].sa).toBe("SA_VOYAGEURS");
    expect(knowledge.GERANT_VERS_SA["RESEAU FERROVIAIRE"].sa).toBe("SA_RESEAU");
    expect(knowledge.GERANT_VERS_SA["OPTIM SERVICES"].bd).toBe("DIRECTION DE L'IMMOBILIER");
  });

  it("exporte les codes BUPO par SA", async () => {
    const knowledge = await import("./immosis-connectimmo-knowledge");
    expect(knowledge.BUPO_PAR_SA).toBeDefined();
    expect(knowledge.BUPO_PAR_SA["SA_SNCF"]).toBe("67858");
    expect(knowledge.BUPO_PAR_SA["SA_VOYAGEURS"]).toBe("05335");
    expect(knowledge.BUPO_PAR_SA["SA_RESEAU"]).toBe("00077");
  });

  it("exporte les 7 onglets Connect'Immo", async () => {
    const knowledge = await import("./immosis-connectimmo-knowledge");
    expect(knowledge.CONNECTIMMO_ONGLETS).toBeDefined();
    expect(knowledge.CONNECTIMMO_ONGLETS.length).toBe(7);
    expect(knowledge.CONNECTIMMO_ONGLETS[0].nom).toBe("Emergence");
    expect(knowledge.CONNECTIMMO_ONGLETS[3].nom).toBe("Ouverture AT/OS");
    expect(knowledge.CONNECTIMMO_ONGLETS[6].nom).toBe("Vie de la commande");
  });

  it("exporte la correspondance nature travaux → code Immosis", async () => {
    const knowledge = await import("./immosis-connectimmo-knowledge");
    expect(knowledge.NATURE_TRAVAUX_VERS_CODE).toBeDefined();
    expect(knowledge.NATURE_TRAVAUX_VERS_CODE["climatisation"]).toBe("8320");
    expect(knowledge.NATURE_TRAVAUX_VERS_CODE["électricité"]).toBe("8312");
    expect(knowledge.NATURE_TRAVAUX_VERS_CODE["toiture"]).toBe("8503");
    expect(knowledge.NATURE_TRAVAUX_VERS_CODE["ascenseur"]).toBe("8330");
  });
});
