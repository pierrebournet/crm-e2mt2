import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const routersContent = readFileSync(
  join(__dirname, "routers.ts"),
  "utf-8"
);

describe("Sous-types et Natures de Travaux IMMOSIS", () => {
  describe("Section 5 : Sous-types actifs (22)", () => {
    it("contient la section des sous-types avec bonnes/mauvaises pratiques", () => {
      expect(routersContent).toContain("Sous-types IMMOSIS actifs (22)");
      expect(routersContent).toContain("Bonnes pratiques");
      expect(routersContent).toContain("Mauvaises pratiques");
    });

    it("contient les 22 codes de sous-types", () => {
      const sousTypes = [
        "VTR ACC DIAG", "CME", "CME_CMT", "CMI", "PTP",
        "VTR AMIA INIT", "CA EE", "EE_MPS", "GE", "GE_CMT",
        "EE", "ML", "MEC_EE", "MEC_RAU", "PTP_CMT",
        "TDA", "TL", "VTR PR", "VTR_EE", "VTR NR", "VTR G", "VTR GBNC"
      ];
      for (const code of sousTypes) {
        expect(routersContent).toContain(code);
      }
    });

    it("identifie les sous-types à ne plus utiliser", () => {
      expect(routersContent).toContain("NE PLUS UTILISER");
      expect(routersContent).toContain("CMI");
      expect(routersContent).toContain("Contrats de Maintenance Interne");
    });

    it("identifie les nouveaux sous-types 2026", () => {
      expect(routersContent).toContain("MEC_RAU");
      expect(routersContent).toContain("Mise en conformité réglementaire autre");
      expect(routersContent).toContain("VTR NR");
      expect(routersContent).toContain("Visite tech audit étude (hors réglementaire et VG)");
    });

    it("distingue E2MT des travaux connexes hors E2MT", () => {
      expect(routersContent).toContain("CME_CMT");
      expect(routersContent).toContain("Forfait et prise en charge E2MT UNIQUEMENT");
      expect(routersContent).toContain("GE_CMT");
      expect(routersContent).toContain("AVEC contrat E2MT");
      expect(routersContent).toContain("PTP_CMT");
      expect(routersContent).toContain("AVEC contrat E2MT");
    });

    it("distingue ML (Maintenance Locative) de TL (Travaux Locatifs)", () => {
      expect(routersContent).toContain("ML = entretien");
      expect(routersContent).toContain("TL = travaux");
      expect(routersContent).toContain("Ne pas confondre");
    });
  });

  describe("Section 6 : Natures de Travaux (24)", () => {
    it("contient la section des natures de travaux", () => {
      expect(routersContent).toContain("Natures de Travaux IMMOSIS (24)");
      expect(routersContent).toContain("Guide d'affectation");
    });

    it("contient les natures de travaux principales", () => {
      const natures = [
        "Aménagements intérieurs",
        "Assainissement Voierie R\u00e9seau Divers, d\u00e9chet, eau",
        "Clos",
        "Couvert",
        "Eclairage et installations électriques BT",
        "Installations chauffage, ventil. climatisation",
        "Plomberie, sanitaire",
        "Structure",
        "Vidéosurveillance, gardiennage, sécurisation"
      ];
      for (const nature of natures) {
        expect(routersContent).toContain(nature);
      }
    });

    it("contient les natures réservées G&C", () => {
      expect(routersContent).toContain("Abris de quai et mobilier scellé | Usage G&C uniquement");
      expect(routersContent).toContain("Entretien quais voyageurs | Usage G&C uniquement");
      expect(routersContent).toContain("Interventions anti-graffiti | Usage G&C uniquement");
      expect(routersContent).toContain("Interventions anti-vandalisme | Usage G&C uniquement");
    });

    it("contient les nouvelles natures 2026", () => {
      expect(routersContent).toContain("Maintenance multi techniques - forfait E2MT (NOUVEAU)");
      expect(routersContent).toContain("Audits et Etudes Energétiques (NOUVEAU)");
    });

    it("contient la nature par défaut avec sa règle", () => {
      expect(routersContent).toContain("Visite de surveillance, contr\u00f4le, diag., \u00e9tude | A UTILISER UNIQUEMENT LORSQUE");
    });
  });

  describe("Règles critiques", () => {
    it("contient les 5 règles critiques", () => {
      expect(routersContent).toContain("REGLES CRITIQUES natures de travaux");
      expect(routersContent).toContain("EXCLUSIVEMENT réservées aux sous-types E2MT");
      expect(routersContent).toContain("usage G&C uniquement");
      expect(routersContent).toContain("nature par DEFAUT");
      expect(routersContent).toContain("corps d'état PRINCIPAL");
      expect(routersContent).toContain("désamiantage");
    });
  });
});
