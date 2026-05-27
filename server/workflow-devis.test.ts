import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Read the routers.ts file to verify the workflow is properly integrated
const routersContent = readFileSync(join(__dirname, "routers.ts"), "utf-8");

describe("Workflow Analyse de Devis - Mission C/D Integration", () => {
  describe("Prompt système contient le workflow complet", () => {
    it("contient la section WORKFLOW COMPLET D'ANALYSE DE DEVIS", () => {
      expect(routersContent).toContain("WORKFLOW COMPLET D'ANALYSE DE DEVIS");
    });

    it("contient l'étape 1 : Détermination Mission C ou Mission D", () => {
      expect(routersContent).toContain("Détermination Mission C ou Mission D");
    });

    it("contient les 8 questions Q1-Q8", () => {
      expect(routersContent).toContain("Q1 : Vandalisme/malveillance");
      expect(routersContent).toContain("Q2 : Mise en conformité réglementaire");
      expect(routersContent).toContain("Q3 : Opération classifiée Niveau 5");
      expect(routersContent).toContain("Q4 : Équipement complet ou Pièce Détachée");
      expect(routersContent).toContain("Q5 : Remplacement installation globale");
      expect(routersContent).toContain("Q6 : Changement profond des caractéristiques");
      expect(routersContent).toContain("Q7 : Sous-traitance très spécialisée");
      expect(routersContent).toContain("Q8 : Durée de vie théorique dépassée");
    });

    it("contient l'étape 2 : Classification IMMO 104", () => {
      expect(routersContent).toContain("Classification IMMO 104 (Charge Locataire ou Propriétaire)");
    });

    it("contient les règles Mission C → Charge LOCATAIRE", () => {
      expect(routersContent).toContain("Mission C");
      expect(routersContent).toContain("Charge LOCATAIRE (IMMO 104 § 9.3)");
    });

    it("contient les règles Mission D → Selon nature", () => {
      expect(routersContent).toContain("Mission D");
      expect(routersContent).toContain("Charge PROPRIÉTAIRE (IMMO 104 § 9.1)");
    });

    it("contient l'étape 3 : Ventilation Budgétaire PPT 2026", () => {
      expect(routersContent).toContain("Ventilation Budgétaire PPT 2026");
    });

    it("contient les familles budgétaires liées aux missions", () => {
      expect(routersContent).toContain("Mission C → **CME** (Contrats Maintenance Externe)");
      expect(routersContent).toContain("Mission D + Gros entretien > 3 500€ → **GER** (Non négociable)");
      expect(routersContent).toContain("Mission D + Mise en conformité → **MEC** (Mixte)");
      expect(routersContent).toContain("Mission D + Petits travaux ≤ 3 500€ → **PTP** (Négociable)");
    });

    it("contient l'étape 4 : Nommage de l'AT", () => {
      expect(routersContent).toContain("Nommage de l'AT");
      expect(routersContent).toContain("[Nature travaux] [UT Code] Bâtiment [N°] - [Ville]");
    });

    it("contient l'étape 5 : Trames Immosis et Connect'Immo", () => {
      expect(routersContent).toContain("TRAME IMMOSIS");
      expect(routersContent).toContain("TRAME CONNECT'IMMO");
    });

    it("contient l'étape 6 : Vérification conformité du devis", () => {
      expect(routersContent).toContain("Vérification conformité du devis");
      expect(routersContent).toContain("14 vérifications du contenu obligatoire");
    });

    it("contient la règle d'application systématique du workflow", () => {
      expect(routersContent).toContain("applique SYSTÉMATIQUEMENT le workflow complet des 6 étapes");
    });
  });

  describe("Logique de détermination Mission C vs D", () => {
    it("Q1 Vandalisme → Mission D", () => {
      expect(routersContent).toContain("Q1 : Vandalisme/malveillance ? → OUI = Mission D (MO facturable). NON → Q2");
    });

    it("Q4 Pièce Détachée → Mission C (MO incluse)", () => {
      expect(routersContent).toContain("PD = Mission C (MO incluse)");
    });

    it("Q8 DVT dépassée → Mission D", () => {
      expect(routersContent).toContain("Q8 : Durée de vie théorique dépassée ? → OUI = Mission D. NON = Mission C (MO incluse)");
    });
  });

  describe("Lien Mission → IMMO 104 → PPT 2026", () => {
    it("Mission C → LOCATAIRE → CME", () => {
      expect(routersContent).toContain("Mission C");
      expect(routersContent).toContain("Charge LOCATAIRE (IMMO 104 § 9.3)");
      expect(routersContent).toContain("Mission C → **CME** (Contrats Maintenance Externe)");
    });

    it("Mission D désamiantage → PROPRIÉTAIRE → GER", () => {
      expect(routersContent).toContain("Désamiantage → Charge PROPRIÉTAIRE (IMMO 104 § 9.1)");
      expect(routersContent).toContain("Mission D + Gros entretien > 3 500€ → **GER** (Non négociable)");
    });

    it("Mission D mise en conformité → PROPRIÉTAIRE → MEC", () => {
      expect(routersContent).toContain("Mise en conformité → Charge PROPRIÉTAIRE (IMMO 104 § 9.1)");
      expect(routersContent).toContain("Mission D + Mise en conformité → **MEC** (Mixte)");
    });

    it("Mission D petits travaux ≤ 3500€ → PROPRIÉTAIRE → PTP", () => {
      expect(routersContent).toContain("Petits travaux ≤ 3 500€ → Charge PROPRIÉTAIRE (PTP)");
      expect(routersContent).toContain("Mission D + Petits travaux ≤ 3 500€ → **PTP** (Négociable)");
    });

    it("Visite réglementaire → PROPRIÉTAIRE → VR", () => {
      expect(routersContent).toContain("Visite réglementaire → Charge PROPRIÉTAIRE (IMMO 104 § 9.1)");
      expect(routersContent).toContain("Visite réglementaire → **VR** (Non négociable)");
    });
  });

  describe("Format de sortie attendu", () => {
    it("contient le format de présentation Mission C/D", () => {
      expect(routersContent).toContain("DÉTERMINATION MISSION C ou D");
      expect(routersContent).toContain("Question | Réponse | Justification");
    });

    it("contient le format de présentation IMMO 104", () => {
      expect(routersContent).toContain("CLASSIFICATION IMMO 104");
      expect(routersContent).toContain("Type de charge");
    });

    it("contient le format de présentation PPT 2026", () => {
      expect(routersContent).toContain("VENTILATION PPT 2026");
      expect(routersContent).toContain("Famille budgétaire");
    });

    it("contient le format de conformité devis", () => {
      expect(routersContent).toContain("CONFORMITÉ DEVIS");
      expect(routersContent).toContain("Anomalies détectées");
    });
  });

  describe("Vérifications de conformité du devis", () => {
    it("contient les 14 vérifications obligatoires", () => {
      expect(routersContent).toContain("N° accord-cadre");
      expect(routersContent).toContain("Objet des prestations");
      expect(routersContent).toContain("Localisation (n° UT, bâtiment, installation)");
      expect(routersContent).toContain("Origine de la demande et nom du demandeur");
      expect(routersContent).toContain("Caractéristiques équipements");
      expect(routersContent).toContain("Heures MO décomposées par poste");
      expect(routersContent).toContain("Taux horaires BPU");
      expect(routersContent).toContain("Majorations éventuelles");
      expect(routersContent).toContain("Coûts unitaires fournitures");
      expect(routersContent).toContain("Coefficients de revente fournitures");
      expect(routersContent).toContain("Abattement franchises");
      expect(routersContent).toContain("Total HT, TVA, TTC");
    });

    it("contient les vérifications complémentaires", () => {
      expect(routersContent).toContain("Franchise pièces");
      expect(routersContent).toContain("Coefficient d'entreprise appliqué APRÈS déduction");
      expect(routersContent).toContain("Sous-traitance : devis joint et cohérent");
      expect(routersContent).toContain("Régularisation : signale si devis soumis APRÈS intervention");
    });
  });

  describe("Phrase clé de déclenchement", () => {
    it("contient la phrase clé 'Analyse le devis'", () => {
      expect(routersContent).toContain('PHRASE CLÉ DE DÉCLENCHEMENT : \"Analyse le devis\"');
    });

    it("déclenche sur variantes de la phrase clé", () => {
      expect(routersContent).toContain('"analyse ce devis", "analyser le devis"');
    });

    it("exige un fichier joint (PDF ou image)", () => {
      expect(routersContent).toContain("joint un fichier (PDF ou image)");
    });
  });

  describe("Exemple de référence intégré", () => {
    it("contient la section EXEMPLE DE RÉFÉRENCE", () => {
      expect(routersContent).toContain("EXEMPLE DE RÉFÉRENCE");
    });

    it("contient l'exemple du devis Tarbes OT COR 3402905", () => {
      expect(routersContent).toContain("OT COR 3402905 - Tarbes");
      expect(routersContent).toContain("UT 004714Y, B032 Tarbes");
    });

    it("montre le résultat Mission C avec MO incluse", () => {
      expect(routersContent).toContain("RÉSULTAT : Mission C \u2014 MO INCLUSE");
    });

    it("montre les anomalies détectées dans l'exemple", () => {
      expect(routersContent).toContain("MO facturée (248\u20ac) alors que Mission C + PD");
      expect(routersContent).toContain("Franchise pièces non appliquée");
    });

    it("contient la recommandation REFUSER", () => {
      expect(routersContent).toContain("REFUSER le devis");
    });

    it("contient la règle de recommandation finale obligatoire", () => {
      expect(routersContent).toContain("ACCEPTER / REFUSER / ACCEPTER SOUS RÉSERVE");
    });
  });
});
