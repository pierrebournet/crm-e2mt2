import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const routersContent = readFileSync(
  join(__dirname, "routers.ts"),
  "utf-8"
);

describe("Sous-types et Natures de Travaux IMMOSIS", () => {
  describe("Section 5 : Sous-types actifs (18)", () => {
    it("contient la section des sous-types avec bonnes/mauvaises pratiques", () => {
      expect(routersContent).toContain("Sous-types IMMOSIS actifs (18)");
      expect(routersContent).toContain("Bonnes pratiques");
      expect(routersContent).toContain("Mauvaises pratiques");
    });

    it("contient les 18 codes de sous-types", () => {
      const sousTypes = [
        "VTR ACC DIAG", "CME", "CME_CMT", "CMI", "PTP",
        "VTR AMIA INIT", "CA EE", "EE_MPS", "GE", "GE_CMT",
        "EE", "ML", "MEC_EE", "RAU", "PTP_CMT",
        "TDA", "TL", "VTR_EE", "VIR", "VTR G"
      ];
      for (const code of sousTypes) {
        expect(routersContent).toContain(code);
      }
    });

    it("identifie les sous-types à ne plus utiliser", () => {
      expect(routersContent).toContain("CMI | Contrats de Maintenance Interne | NE PLUS UTILISER");
      expect(routersContent).toContain("EE | Maintenance Elargie Energie Electrique | NE PLUS UTILISER");
    });

    it("identifie les nouveaux sous-types 2026", () => {
      expect(routersContent).toContain("RAU | Mise en conformité réglementaire autre (NOUVEAU)");
      expect(routersContent).toContain("VIR | Visite tech audit étude hors réglementaire et VG (NOUVEAU)");
    });

    it("distingue E2MT des travaux connexes hors E2MT", () => {
      expect(routersContent).toContain("CME_CMT | Contrats de Maintenance Externe - E2MT | Forfait et prise en charge E2MT uniquement");
      expect(routersContent).toContain("GE_CMT | Gros Entretiens - par E2MT | Tous travaux sur installations via E2MT");
      expect(routersContent).toContain("PTP_CMT | Petits Travaux Propriétaires - E2MT");
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
        "Assainissement / VRD",
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
      expect(routersContent).toContain("Visite de surveillance, contrôle, diag., étude | UNIQUEMENT si aucune nature spécifique ne correspond");
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
