import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const arbreContent = readFileSync(
  join(__dirname, "../client/src/pages/ArbreDecisionPage.tsx"),
  "utf-8"
);

describe("VTR G BNC dans l'arbre de décision", () => {
  it("contient la question sur le type de bâtiment (BNC)", () => {
    expect(arbreContent).toContain("q3_batiment_type");
    expect(arbreContent).toContain("ouvrage d'art, une grande halle ou un bâtiment non courant (BNC)");
  });

  it("propose VTR G BNC comme sous-type pour les bâtiments non courants", () => {
    expect(arbreContent).toContain("VTR G BNC");
    expect(arbreContent).toContain("Visite technique Gros Bâtiments Non Courants");
  });

  it("la question BNC apparaît après Q3 (niveau 5 = oui)", () => {
    expect(arbreContent).toContain('nextQuestion: "q3_batiment_type"');
  });

  it("propose les natures de travaux adaptées aux BNC (Structure, Couvert, Clos)", () => {
    // Vérifier que les suggestions pour BNC incluent Structure, Couvert, Clos
    const bncSection = arbreContent.substring(
      arbreContent.indexOf("q3_batiment_type"),
      arbreContent.indexOf("q4:")
    );
    expect(bncSection).toContain("Structure");
    expect(bncSection).toContain("Couvert");
    expect(bncSection).toContain("Clos");
  });

  it("inclut les recommandations spécifiques BNC", () => {
    expect(arbreContent).toContain("bâtiments non courants (ouvrages d'art, grandes halles)");
    expect(arbreContent).toContain("compétences spécifiques");
    expect(arbreContent).toContain("bureau d'études structure");
  });

  it("le résultat BNC est en charge propriétaire Mission D", () => {
    const bncSection = arbreContent.substring(
      arbreContent.indexOf("q3_batiment_type"),
      arbreContent.indexOf("q4:")
    );
    expect(bncSection).toContain('mission: "D"');
    expect(bncSection).toContain('chargeType: "proprietaire"');
  });
});

describe("Module de vérification croisée sous-type ↔ nature de travaux", () => {
  it("contient la table de compatibilité sous-type/nature", () => {
    expect(arbreContent).toContain("compatibilitesSousTypeNature");
    expect(arbreContent).toContain("verifierCompatibilite");
  });

  it("CME_CMT est exclusivement réservé à Maintenance multi techniques", () => {
    expect(arbreContent).toContain('CME_CMT');
    expect(arbreContent).toContain("Maintenance multi techniques - forfait E2MT");
    expect(arbreContent).toContain("EXCLUSIVEMENT réservé");
  });

  it("MEC_EE est réservé aux natures électriques", () => {
    expect(arbreContent).toContain("MEC_EE");
    expect(arbreContent).toContain("réservé aux natures électriques");
  });

  it("VTR ACC DIAG est exclusivement réservé à Visite de surveillance", () => {
    expect(arbreContent).toContain("VTR ACC DIAG");
    expect(arbreContent).toContain("Visite de surveillance, contrôle, diag., étude");
  });

  it("affiche un indicateur visuel de compatibilité dans le rendu", () => {
    expect(arbreContent).toContain("Vérification croisée");
    expect(arbreContent).toContain("Nature compatible");
    expect(arbreContent).toContain("Nature INCOMPATIBLE");
  });

  it("propose les natures autorisées quand incompatible", () => {
    expect(arbreContent).toContain("Natures autorisées");
    expect(arbreContent).toContain("naturesCompatibles");
  });

  it("permet de cliquer sur une nature autorisée pour la sélectionner", () => {
    expect(arbreContent).toContain("onClick={() => setSelectedNature(n)}");
  });

  it("VTR G BNC a ses propres règles de compatibilité", () => {
    // Vérifier que VTR G BNC est dans la table de compatibilité
    const compatSection = arbreContent.substring(
      arbreContent.indexOf("compatibilitesSousTypeNature"),
      arbreContent.indexOf("// Fonction de vérification croisée")
    );
    expect(compatSection).toContain('"VTR G BNC"');
    expect(compatSection).toContain("bâtiments non courants");
  });

  it("contient au moins 10 sous-types dans la table de compatibilité", () => {
    const sousTypes = ["CME_CMT", "PTP_CMT", "GE_CMT", "MEC_EE", "RAU", "ML", "VTR G BNC", "VTR_EE", "CA EE", "EE_MPS", "VTR ACC DIAG", "VIR"];
    for (const st of sousTypes) {
      expect(arbreContent).toContain(st);
    }
  });
});
