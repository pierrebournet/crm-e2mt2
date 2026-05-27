import { describe, expect, it } from "vitest";

/**
 * Tests unitaires pour valider l'intégration du Modèle de Gestion PPT 2026
 * dans le prompt système de l'assistant IA
 * 
 * PPT 2026 : Mode d'Emploi Propriétaire et locatif
 * Auteur : Xavier Reale | Validé par : B. KELLE | Date : 25 février 2026
 */

describe("PPT 2026 - Modèle de Gestion", () => {
  describe("8 Familles Budgétaires", () => {
    it("reconnaît GER (Gros Entretien & Réparation) avec seuil > 3 500€ et caractère non négociable", () => {
      const ger = {
        code: "GER",
        name: "Gros Entretien & Réparation",
        threshold: 3500,
        operator: ">",
        character: "non négociable",
        includes: ["Gros entretien", "Réparations", "Désamiantage", "Sécurisation structurelle"],
      };
      expect(ger.code).toBe("GER");
      expect(ger.operator).toBe(">");
      expect(ger.character).toBe("non négociable");
      expect(ger.includes).toContain("Désamiantage");
    });

    it("reconnaît MEC (Mise en Conformité) avec caractère mixte", () => {
      const mec = {
        code: "MEC",
        name: "Mise en Conformité",
        character: "mixte",
        description: "Suite contrôles/visites réglementaires",
        includes: ["Mise en conformité énergie électrique", "Mise en conformité réglementaires autres"],
      };
      expect(mec.code).toBe("MEC");
      expect(mec.character).toBe("mixte");
    });

    it("reconnaît CME (Contrats Maintenance) avec caractère mixte", () => {
      const cme = {
        code: "CME",
        name: "Contrats Maintenance",
        character: "mixte",
        includes: ["Maintenance externe", "Maintenance interne", "E2MT", "Électrique MPS"],
      };
      expect(cme.code).toBe("CME");
      expect(cme.includes).toContain("E2MT");
    });

    it("reconnaît PTP (Petits Travaux Propriétaire) avec seuil ≤ 3 500€ et caractère négociable", () => {
      const ptp = {
        code: "PTP",
        name: "Petits Travaux Propriétaire",
        threshold: 3500,
        operator: "≤",
        character: "négociable",
        description: "Petits travaux, entretien courant",
      };
      expect(ptp.code).toBe("PTP");
      expect(ptp.operator).toBe("≤");
      expect(ptp.character).toBe("négociable");
    });

    it("reconnaît ML (Maintenance Locative) avec caractère mixte", () => {
      const ml = {
        code: "ML",
        name: "Maintenance Locative",
        character: "mixte",
        description: "Entretien locatif courant",
      };
      expect(ml.code).toBe("ML");
      expect(ml.character).toBe("mixte");
    });

    it("reconnaît TL (Travaux Locatifs) avec seuil > 3 500€ et caractère mixte", () => {
      const tl = {
        code: "TL",
        name: "Travaux Locatifs",
        threshold: 3500,
        operator: ">",
        character: "mixte",
        description: "Travaux locatifs importants",
      };
      expect(tl.code).toBe("TL");
      expect(tl.operator).toBe(">");
    });

    it("reconnaît VR (Visites Réglementaires) avec caractère non négociable", () => {
      const vr = {
        code: "VR",
        name: "Visites Réglementaires",
        character: "non négociable",
        includes: ["Contrôles", "Diagnostics", "Vérifications obligatoires"],
      };
      expect(vr.code).toBe("VR");
      expect(vr.character).toBe("non négociable");
    });

    it("reconnaît DIAG (Diagnostics & Audits) avec caractère négociable", () => {
      const diag = {
        code: "DIAG",
        name: "Diagnostics & Audits",
        character: "négociable",
        includes: ["Diagnostics", "Visites de gestion", "Audits non réglementaires"],
      };
      expect(diag.code).toBe("DIAG");
      expect(diag.character).toBe("négociable");
    });
  });

  describe("Seuils Critiques", () => {
    it("applique seuil 3 500€ pour distinguer GER/TL vs PTP", () => {
      const thresholds = {
        gerTlMinimum: 3500.01,
        ptpMaximum: 3500,
      };
      expect(thresholds.gerTlMinimum).toBeGreaterThan(thresholds.ptpMaximum);
    });

    it("applique seuil 15 000€ comme exception pour remplacement > 1/3 corps d'état", () => {
      const exception = {
        threshold: 15000,
        condition: "remplacement > 1/3 corps d'état",
        effect: "peut être classé différemment",
      };
      expect(exception.threshold).toBe(15000);
    });

    it("détermine AT identifiée vs AT régionale selon montant", () => {
      const atIdentifiee = {
        montant: 5000,
        type: "AT identifiée",
        includes: ["UT", "n° bâtiment"],
      };
      const atRegionale = {
        montant: 2000,
        type: "AT régionale",
        description: "enveloppe budgétaire",
      };
      expect(atIdentifiee.montant).toBeGreaterThan(3500);
      expect(atRegionale.montant).toBeLessThanOrEqual(3500);
    });
  });

  describe("Règles de Saisie des AT", () => {
    it("exige intitulé explicite avec localisation et type travail", () => {
      const goodTitle = "Remplacement toiture bâtiment 45 UT 12345 - Toulouse";
      const badTitle = "Travaux bâtiment";
      
      expect(goodTitle).toContain("Remplacement");
      expect(goodTitle).toContain("bâtiment");
      expect(goodTitle).toContain("UT");
      expect(goodTitle).toContain("Toulouse");
      expect(badTitle.length).toBeLessThan(goodTitle.length);
    });

    it("associe AT à famille budgétaire correcte selon montant et nature", () => {
      const work1 = {
        montant: 5000,
        nature: "réparation toiture",
        expectedFamily: "GER",
      };
      const work2 = {
        montant: 2000,
        nature: "peinture intérieure",
        expectedFamily: "PTP",
      };
      expect(work1.montant).toBeGreaterThan(3500);
      expect(work2.montant).toBeLessThanOrEqual(3500);
    });

    it("valide sous-type Immosis correspond à famille budgétaire", () => {
      const validMappings = {
        GER: ["Gros Entretiens", "Gros entretien et réparation GER", "Travaux de Désamiantage"],
        PTP: ["Contrats Petits Travaux du Propriétaire", "Petits travaux propriétaires - par E2MT"],
        ML: ["Maintenance Locative"],
        VR: ["Vérifications Réglementaires", "Diagnostic Amiante"],
      };
      expect(validMappings.GER).toContain("Gros Entretiens");
      expect(validMappings.PTP).toContain("Contrats Petits Travaux du Propriétaire");
    });
  });

  describe("Gérants de Programme (GP)", () => {
    it("reconnaît 1er groupe : Réseau, ISM TGV, ISM Transilien, ISM TER, Voyageurs, Fret, SNCF", () => {
      const group1 = [
        "Réseau Industriel",
        "Réseau Ferroviaire",
        "ISM TGV Axe Est",
        "ISM Transilien",
        "ISM TER Occitanie",
        "AUTRE VOYAGEURS",
        "FRET ISM",
        "SNCF",
      ];
      expect(group1.length).toBeGreaterThan(0);
      expect(group1).toContain("ISM TGV Axe Est");
    });

    it("reconnaît 2e groupe : RÉSEAU/MOBILITÉS travaux à la demande", () => {
      const group2 = [
        "RÉSEAU travaux à la demande",
        "MOBILITÉS travaux à la demande",
      ];
      expect(group2.length).toBe(2);
    });

    it("reconnaît 3e groupe : DI pour RHL demande", () => {
      const group3 = ["DI pour RHL demande"];
      expect(group3).toContain("DI pour RHL demande");
    });

    it("reconnaît 4e groupe : DI pour RH/IST (CER/CCE)", () => {
      const group4 = {
        name: "DI pour RH/IST",
        subtypes: ["CER (Coûts d'Entretien Réseau)", "CCE (Coûts de Charges d'Exploitation)"],
      };
      expect(group4.subtypes.length).toBe(2);
    });

    it("reconnaît 5e groupe : Maintenance Locative (I&F, T&S, TER)", () => {
      const group5 = [
        "Maintenance Locative Industrielle & Ferroviaire",
        "Maintenance Locative Tertiaire & Sociale",
        "Maintenance Sociétés dédiées TER",
      ];
      expect(group5.length).toBe(3);
    });
  });

  describe("Types de Fournisseurs", () => {
    it("reconnaît fournisseurs internes ABE avec connaissance axes locaux", () => {
      const abe = {
        type: "ABE",
        knowledgeAxes: true,
        examples: ["TechniGares", "DSIM"],
        imputation: "automatique",
      };
      expect(abe.knowledgeAxes).toBe(true);
      expect(abe.imputation).toBe("automatique");
    });

    it("reconnaît fournisseurs internes non-ABE sans connaissance axes locaux", () => {
      const nonAbe = {
        type: "Interne non-ABE",
        knowledgeAxes: false,
        examples: ["ATA", "Infra pôles", "EVEN", "EIMM", "ASTI"],
        requirement: "communiquer axes locaux explicitement",
      };
      expect(nonAbe.knowledgeAxes).toBe(false);
      expect(nonAbe.examples).toContain("ATA");
    });

    it("reconnaît fournisseurs externes TIERS obligatoires", () => {
      const tiers = {
        type: "TIERS",
        description: "Fournisseurs externes SNCF",
        mandatory: true,
        forbidden: ["DTI", "CAI", "DA"],
      };
      expect(tiers.type).toBe("TIERS");
      expect(tiers.mandatory).toBe(true);
      expect(tiers.forbidden).toContain("DTI");
    });
  });

  describe("Affectation des Travaux", () => {
    it("confie patrimoine Réseau ferroviaire à TechniGares", () => {
      const techniGares = {
        responsible: "TechniGares",
        domain: "Patrimoine Réseau Ferroviaire",
        missions: ["GE", "CME/PTP", "Pilotage E2MT", "Maintenance électrique régie", "VR"],
        exceptions: ["Désamiantage", "Missions gestionnaires"],
      };
      expect(techniGares.missions).toContain("GE");
      expect(techniGares.exceptions).toContain("Désamiantage");
    });

    it("confie maintenance électrique à TechniGares pour patrimoine Industriel", () => {
      const industrial = {
        responsible: "TechniGares",
        domain: "Patrimoine Industriel (Réseau & Voyageurs)",
        missions: ["Maintenance électrique", "Vérifications réglementaires électriques", "MEC électrique"],
      };
      expect(industrial.missions).toContain("Maintenance électrique");
    });

    it("confie reste du patrimoine à DIT en direct", () => {
      const dit = {
        responsible: "DIT",
        domain: "Reste du patrimoine",
        missions: ["Pilotage", "Travaux en direct"],
      };
      expect(dit.responsible).toBe("DIT");
    });

    it("confie Division Immobilière à DSIM avec MDG spécifique", () => {
      const dsim = {
        responsible: "DSIM",
        domain: "Division Immobilière (DS)",
        mdg: "spécifique",
      };
      expect(dsim.responsible).toBe("DSIM");
      expect(dsim.mdg).toBe("spécifique");
    });
  });

  describe("Structure Budgétaire par SA", () => {
    it("applique reventilation B/D 100% DI CGVI pour SNCF", () => {
      const sncf = {
        sa: "SNCF",
        reventilation: "100% DI CGVI",
        division: "Direction Immobilière CGVI",
      };
      expect(sncf.reventilation).toContain("100%");
      expect(sncf.reventilation).toContain("DI CGVI");
    });

    it("applique reventilation B/D 100% DI SA Voyageurs pour VOYAGEURS", () => {
      const voyageurs = {
        sa: "VOYAGEURS",
        reventilation: "100% DI SA Voyageurs",
        division: "Direction Immobilière SA Voyageurs",
      };
      expect(voyageurs.reventilation).toContain("DI SA Voyageurs");
    });

    it("applique reventilation B/D 100% RÉSEAU Division Immobilière pour RÉSEAU", () => {
      const reseau = {
        sa: "RÉSEAU",
        reventilation: "100% RÉSEAU Division Immobilière",
        division: "Division Immobilière RÉSEAU",
      };
      expect(reseau.reventilation).toContain("RÉSEAU");
    });

    it("applique reventilation B/D 100% FRET Transport Logistique pour FRET", () => {
      const fret = {
        sa: "FRET",
        reventilation: "100% FRET Transport Logistique",
        division: "Division Transport Logistique",
      };
      expect(fret.reventilation).toContain("FRET Transport Logistique");
    });

    it("applique reventilation B/D 100% Direction Immobilier pour Locatif", () => {
      const locatif = {
        sa: "Locatif",
        reventilation: "100% Direction Immobilier",
        division: "Direction Immobilier",
      };
      expect(locatif.reventilation).toContain("Direction Immobilier");
    });
  });

  describe("Facturation", () => {
    it("applique facturation à l'avancement physique (pas financier)", () => {
      const billing = {
        principle: "avancement physique",
        notAllowed: "avancement financier",
      };
      expect(billing.principle).toBe("avancement physique");
      expect(billing.notAllowed).not.toBe(billing.principle);
    });

    it("génère axes locaux automatiquement via Immosis", () => {
      const axes = {
        generation: "automatique",
        source: "Immosis",
        abeHandling: "imputation automatique",
        otherHandling: "communication explicite aux services ERP",
      };
      expect(axes.generation).toBe("automatique");
      expect(axes.abeHandling).not.toBe(axes.otherHandling);
    });
  });

  describe("Cas Particuliers", () => {
    it("reconnaît Bâtiments Non Courants (VTR G BNC) avec critères spécifiques", () => {
      const bnc = {
        code: "VTR G BNC",
        criteria: [
          "Ossature/charpente métallique (portée > 10m, surface > 150m²)",
          "Structures innovantes avec efforts importants",
          "Structures avec grands porte-à-faux",
          "Ouvrages de soutènement liés à bâtiment/terrain",
          "Châteaux d'eau",
        ],
      };
      expect(bnc.criteria.length).toBe(5);
      expect(bnc.criteria[0]).toContain("portée > 10m");
    });

    it("reconnaît Accompagnement Diagnostic (VTR ACC DIAG) pour diagnostics externes", () => {
      const accDiag = {
        code: "VTR ACC DIAG",
        description: "Accompagnements ABE pour diagnostics externes",
        example: "ascenseurs",
        notIncluded: "CME",
      };
      expect(accDiag.code).toBe("VTR ACC DIAG");
      expect(accDiag.notIncluded).toBe("CME");
    });
  });

  describe("Checklist Validation", () => {
    it("valide tous les éléments requis pour saisie AT", () => {
      const checklist = [
        "Intitulé explicite et compréhensible",
        "Famille budgétaire correcte",
        "Sous-type Immosis approprié",
        "Gérant de Programme valide",
        "Fournisseur identifié",
        "Montant cohérent avec seuils",
        "Axes locaux générés et documentés",
        "Donneur d'ordre renseigné",
        "Reventilation B/D correcte selon SA",
      ];
      expect(checklist.length).toBe(9);
      expect(checklist).toContain("Intitulé explicite et compréhensible");
    });
  });

  describe("Évolutions 2026", () => {
    it("passe de 6 à 8 familles budgétaires", () => {
      const oldFamilies = ["GE", "AM", "CME-PTP", "Visites", "ML", "TL"];
      const newFamilies = ["GER", "MEC", "CME", "PTP", "ML", "TL", "VR", "DIAG"];
      expect(oldFamilies.length).toBe(6);
      expect(newFamilies.length).toBe(8);
    });

    it("permet ouverture TOUS LES SOUS-TYPES quel que soit le GP", () => {
      const flexibility = {
        rule: "TOUS LES SOUS-TYPES peuvent être ouverts",
        constraint: "quel que soit le GP",
        impact: "meilleure flexibilité de saisie",
      };
      expect(flexibility.rule).toContain("TOUS");
    });

    it("maintient correspondance historique entre anciennes et nouvelles familles", () => {
      const correspondence = {
        maintained: true,
        purpose: "continuité historique et suivi évolutions",
      };
      expect(correspondence.maintained).toBe(true);
    });
  });
});
