import { describe, expect, it } from "vitest";
import { analyserDevis, DevisInput } from "./devis-analyzer";

describe("Analyseur de Devis - IMMO 104 + PPT 2026", () => {
  describe("Charge IMMO 104 - Propriétaire", () => {
    it("classifie désamiantage comme charge propriétaire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-001",
        dateDevis: new Date(),
        montantHT: 5000,
        montantTTC: 6000,
        utCode: "UT-001",
        batimentNumero: "45",
        ville: "Toulouse",
        typesTravaux: ["Désamiantage"],
        description: "Désamiantage toiture",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estDesamiantage: true,
        estLocatif: false,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.chargeImmo104).toBe("Propriétaire");
      expect(analyse.justificationImmo104).toContain("Désamiantage");
    });

    it("classifie bien vacant comme charge propriétaire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-002",
        dateDevis: new Date(),
        montantHT: 2000,
        montantTTC: 2400,
        utCode: "UT-002",
        batimentNumero: "50",
        typesTravaux: ["Peinture"],
        description: "Peinture intérieure",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estVacant: true,
        estLocatif: false,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.chargeImmo104).toBe("Propriétaire");
      expect(analyse.justificationImmo104).toContain("vacant");
    });

    it("classifie mise en conformité comme charge propriétaire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-003",
        dateDevis: new Date(),
        montantHT: 8000,
        montantTTC: 9600,
        utCode: "UT-003",
        batimentNumero: "60",
        typesTravaux: ["Mise en conformité électrique"],
        description: "Mise en conformité électrique",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estMiseEnConformite: true,
        estLocatif: false,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.chargeImmo104).toBe("Propriétaire");
    });

    it("classifie visite réglementaire comme charge propriétaire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-004",
        dateDevis: new Date(),
        montantHT: 1500,
        montantTTC: 1800,
        utCode: "UT-004",
        batimentNumero: "70",
        typesTravaux: ["Visite réglementaire"],
        description: "Visite réglementaire ascenseur",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estVisiteReglementaire: true,
        estLocatif: false,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.chargeImmo104).toBe("Propriétaire");
    });

    it("classifie diagnostic comme charge propriétaire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-005",
        dateDevis: new Date(),
        montantHT: 2500,
        montantTTC: 3000,
        utCode: "UT-005",
        batimentNumero: "80",
        typesTravaux: ["Diagnostic amiante"],
        description: "Diagnostic amiante complet",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estDiagnostic: true,
        estLocatif: false,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.chargeImmo104).toBe("Propriétaire");
    });
  });

  describe("Charge IMMO 104 - Locataire", () => {
    it("classifie maintenance contractuelle comme charge locataire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-006",
        dateDevis: new Date(),
        montantHT: 3000,
        montantTTC: 3600,
        utCode: "UT-006",
        batimentNumero: "90",
        typesTravaux: ["Maintenance"],
        description: "Maintenance contractuelle E2MT",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estMaintenanceContractuelle: true,
        estLocatif: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.chargeImmo104).toBe("Locataire");
      expect(analyse.justificationImmo104).toContain("Maintenance contractuelle");
    });

    it("classifie travaux locatifs > 3 500€ comme charge locataire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-007",
        dateDevis: new Date(),
        montantHT: 5000,
        montantTTC: 6000,
        utCode: "UT-007",
        batimentNumero: "100",
        typesTravaux: ["Remplacement fenêtres"],
        description: "Remplacement fenêtres",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estLocatif: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.chargeImmo104).toBe("Locataire");
    });

    it("classifie entretien locatif ≤ 3 500€ comme charge locataire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-008",
        dateDevis: new Date(),
        montantHT: 2000,
        montantTTC: 2400,
        utCode: "UT-008",
        batimentNumero: "110",
        typesTravaux: ["Peinture intérieure"],
        description: "Peinture intérieure locative",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estLocatif: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.chargeImmo104).toBe("Locataire");
    });
  });

  describe("Charge IMMO 104 - Mixte", () => {
    it("classifie gros entretien > 3 500€ comme charge mixte (30% refacturisable)", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-009",
        dateDevis: new Date(),
        montantHT: 10000,
        montantTTC: 12000,
        utCode: "UT-009",
        batimentNumero: "120",
        typesTravaux: ["Réparation toiture"],
        description: "Réparation toiture importante",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estLocatif: false,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.chargeImmo104).toBe("Mixte");
      expect(analyse.montantPropietaire).toBe(7000);
      expect(analyse.montantLocataire).toBe(3000);
    });
  });

  describe("Famille Budgétaire PPT 2026", () => {
    it("classe désamiantage en GER", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-010",
        dateDevis: new Date(),
        montantHT: 5000,
        montantTTC: 6000,
        utCode: "UT-010",
        batimentNumero: "130",
        typesTravaux: ["Désamiantage"],
        description: "Désamiantage",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estDesamiantage: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.familleButgetaire).toBe("GER");
      expect(analyse.sousType).toBe("Travaux de Désamiantage");
      expect(analyse.caractereBudgetaire).toBe("Non négociable");
    });

    it("classe mise en conformité en MEC", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-011",
        dateDevis: new Date(),
        montantHT: 4000,
        montantTTC: 4800,
        utCode: "UT-011",
        batimentNumero: "140",
        typesTravaux: ["Mise en conformité"],
        description: "Mise en conformité",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estMiseEnConformite: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.familleButgetaire).toBe("MEC");
      expect(analyse.sousType).toContain("conformité");
    });

    it("classe maintenance contractuelle en CME", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-012",
        dateDevis: new Date(),
        montantHT: 3000,
        montantTTC: 3600,
        utCode: "UT-012",
        batimentNumero: "150",
        typesTravaux: ["Maintenance"],
        description: "Maintenance",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estMaintenanceContractuelle: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.familleButgetaire).toBe("CME");
    });

    it("classe visite réglementaire en VR", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-013",
        dateDevis: new Date(),
        montantHT: 1500,
        montantTTC: 1800,
        utCode: "UT-013",
        batimentNumero: "160",
        typesTravaux: ["Visite"],
        description: "Visite réglementaire",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estVisiteReglementaire: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.familleButgetaire).toBe("VR");
      expect(analyse.caractereBudgetaire).toBe("Non négociable");
    });

    it("classe diagnostic en DIAG", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-014",
        dateDevis: new Date(),
        montantHT: 2000,
        montantTTC: 2400,
        utCode: "UT-014",
        batimentNumero: "170",
        typesTravaux: ["Diagnostic"],
        description: "Diagnostic",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estDiagnostic: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.familleButgetaire).toBe("DIAG");
      expect(analyse.caractereBudgetaire).toBe("Négociable");
    });

    it("classe gros entretien > 3 500€ en GER", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-015",
        dateDevis: new Date(),
        montantHT: 5000,
        montantTTC: 6000,
        utCode: "UT-015",
        batimentNumero: "180",
        typesTravaux: ["Réparation"],
        description: "Gros entretien",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estLocatif: false,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.familleButgetaire).toBe("GER");
      expect(analyse.caractereBudgetaire).toBe("Non négociable");
    });

    it("classe travaux locatifs > 3 500€ en TL", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-016",
        dateDevis: new Date(),
        montantHT: 5000,
        montantTTC: 6000,
        utCode: "UT-016",
        batimentNumero: "190",
        typesTravaux: ["Travaux"],
        description: "Travaux locatifs",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estLocatif: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.familleButgetaire).toBe("TL");
    });

    it("classe entretien locatif ≤ 3 500€ en ML", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-017",
        dateDevis: new Date(),
        montantHT: 2000,
        montantTTC: 2400,
        utCode: "UT-017",
        batimentNumero: "200",
        typesTravaux: ["Entretien"],
        description: "Entretien locatif",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estLocatif: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.familleButgetaire).toBe("ML");
    });

    it("classe petits travaux ≤ 3 500€ en PTP", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-018",
        dateDevis: new Date(),
        montantHT: 2000,
        montantTTC: 2400,
        utCode: "UT-018",
        batimentNumero: "210",
        typesTravaux: ["Petits travaux"],
        description: "Petits travaux",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estLocatif: false,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.familleButgetaire).toBe("PTP");
      expect(analyse.caractereBudgetaire).toBe("Négociable");
    });
  });

  describe("Nommage AT", () => {
    it("génère intitulé explicite avec localisation complète", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-019",
        dateDevis: new Date(),
        montantHT: 5000,
        montantTTC: 6000,
        utCode: "UT-019",
        batimentNumero: "220",
        ville: "Paris",
        typesTravaux: ["Remplacement toiture"],
        description: "Remplacement toiture",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.intituleAT).toContain("Travaux");
      expect(analyse.intituleAT).toContain("Remplacement toiture");
      expect(analyse.intituleAT).toContain("UT-019");
      expect(analyse.intituleAT).toContain("220");
      expect(analyse.intituleAT).toContain("Paris");
    });

    it("génère intitulé court sans ville si non renseignée", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-020",
        dateDevis: new Date(),
        montantHT: 3000,
        montantTTC: 3600,
        utCode: "UT-020",
        batimentNumero: "230",
        typesTravaux: ["Peinture"],
        description: "Peinture",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.intituleAT).toContain("UT-020");
      expect(analyse.intituleAT).toContain("230");
    });
  });

  describe("Ventilation des montants", () => {
    it("ventile 100% propriétaire pour charge propriétaire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-021",
        dateDevis: new Date(),
        montantHT: 5000,
        montantTTC: 6000,
        utCode: "UT-021",
        batimentNumero: "240",
        typesTravaux: ["Désamiantage"],
        description: "Désamiantage",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estDesamiantage: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.montantPropietaire).toBe(5000);
      expect(analyse.montantLocataire).toBe(0);
    });

    it("ventile 100% locataire pour charge locataire", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-022",
        dateDevis: new Date(),
        montantHT: 3000,
        montantTTC: 3600,
        utCode: "UT-022",
        batimentNumero: "250",
        typesTravaux: ["Maintenance"],
        description: "Maintenance",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estMaintenanceContractuelle: true,
        estLocatif: true,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.montantPropietaire).toBe(0);
      expect(analyse.montantLocataire).toBe(3000);
    });

    it("ventile 70/30 pour charge mixte", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-023",
        dateDevis: new Date(),
        montantHT: 10000,
        montantTTC: 12000,
        utCode: "UT-023",
        batimentNumero: "260",
        typesTravaux: ["Réparation"],
        description: "Gros entretien",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
        estLocatif: false,
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.montantPropietaire).toBe(7000);
      expect(analyse.montantLocataire).toBe(3000);
    });
  });

  describe("Données Immosis et Connect'Immo", () => {
    it("prépare données Immosis correctement", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-024",
        dateDevis: new Date(),
        montantHT: 5000,
        montantTTC: 6000,
        utCode: "UT-024",
        batimentNumero: "270",
        typesTravaux: ["Travaux"],
        description: "Description travaux",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.immosisData.utCode).toBe("UT-024");
      expect(analyse.immosisData.batimentNumero).toBe("270");
      expect(analyse.immosisData.montant).toBeGreaterThan(0);
    });

    it("prépare données Connect'Immo correctement", () => {
      const devis: DevisInput = {
        numeroDevis: "DEV-025",
        dateDevis: new Date(),
        montantHT: 5000,
        montantTTC: 6000,
        utCode: "UT-025",
        batimentNumero: "280",
        typesTravaux: ["Travaux"],
        description: "Description",
        typeConvention: "Intra SA",
        saPropietaire: "SNCF",
      };
      
      const analyse = analyserDevis(devis);
      expect(analyse.connectImmoData.montantHT).toBe(5000);
      expect(analyse.connectImmoData.montantTTC).toBe(6000);
      expect(analyse.connectImmoData.utCode).toBe("UT-025");
    });
  });
});
