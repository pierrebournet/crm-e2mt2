import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const arbreDecisionContent = readFileSync(
  join(__dirname, "../client/src/pages/ArbreDecisionPage.tsx"),
  "utf-8"
);

describe("Arbre de Décision Interactif", () => {
  describe("Structure du composant", () => {
    it("exporte un composant par défaut", () => {
      expect(arbreDecisionContent).toContain("export default function ArbreDecisionPage");
    });

    it("contient les imports nécessaires", () => {
      expect(arbreDecisionContent).toContain("from \"@/components/ui/card\"");
      expect(arbreDecisionContent).toContain("from \"@/components/ui/button\"");
      expect(arbreDecisionContent).toContain("from \"@/components/ui/badge\"");
      expect(arbreDecisionContent).toContain("from \"@/components/ui/separator\"");
    });

    it("utilise wouter pour la navigation vers l'assistant", () => {
      expect(arbreDecisionContent).toContain("from \"wouter\"");
      expect(arbreDecisionContent).toContain("useLocation");
    });
  });

  describe("Questions Q1-Q8", () => {
    it("commence par la question Q1 (vandalisme)", () => {
      expect(arbreDecisionContent).toContain("L'intervention fait-elle suite à un acte de vandalisme");
    });

    it("contient la question Q2 (mise en conformité)", () => {
      expect(arbreDecisionContent).toContain("L'intervention vise-t-elle une mise en conformité réglementaire");
    });

    it("contient la question Q3 (niveau 5)", () => {
      expect(arbreDecisionContent).toContain("équipement de niveau 5 (remplacement complet)");
    });

    it("contient la question Q4 (PD vs Équipement)", () => {
      expect(arbreDecisionContent).toContain("Pièce Détachée (PD) ou un Équipement complet");
    });

    it("contient la question sur la DVT (durée de vie théorique)", () => {
      expect(arbreDecisionContent).toContain("Durée de Vie Théorique (DVT)");
    });

    it("contient la question sur les consommables", () => {
      expect(arbreDecisionContent).toContain("consommable ou une pièce d'usure normale");
    });

    it("contient la question sur la cause de panne", () => {
      expect(arbreDecisionContent).toContain("Quelle est la cause de la panne");
    });
  });

  describe("Résultats Mission C", () => {
    it("identifie Mission C pour PD consommable", () => {
      expect(arbreDecisionContent).toContain("Mission C — Maintenance préventive (PD consommable)");
    });

    it("indique MO non facturable pour Mission C", () => {
      expect(arbreDecisionContent).toContain("MO INCLUSE au forfait E2MT²");
    });

    it("associe le sous-type CME_CMT pour Mission C E2MT", () => {
      expect(arbreDecisionContent).toContain("sousTypeCode: \"CME_CMT\"");
    });

    it("mentionne la franchise 300€", () => {
      expect(arbreDecisionContent).toContain("franchise 300€");
    });
  });

  describe("Résultats Mission D", () => {
    it("identifie Mission D pour vandalisme", () => {
      expect(arbreDecisionContent).toContain("Mission D — Travaux correctifs (vandalisme");
    });

    it("identifie Mission D pour MEC électrique", () => {
      expect(arbreDecisionContent).toContain("Mission D — Mise en conformité électrique");
    });

    it("identifie Mission D pour remplacement niveau 5", () => {
      expect(arbreDecisionContent).toContain("Mission D — Remplacement complet (niveau 5)");
    });

    it("identifie Mission D pour DVT dépassée", () => {
      expect(arbreDecisionContent).toContain("Mission D — Remplacement équipement vétuste (DVT dépassée)");
    });

    it("indique MO facturable pour Mission D", () => {
      expect(arbreDecisionContent).toContain("MO facturable car Mission D");
    });
  });

  describe("Sous-types IMMOSIS", () => {
    it("contient les codes sous-types principaux", () => {
      const codes = ["CME_CMT", "GE", "GE_CMT", "ML", "MEC_EE", "RAU"];
      for (const code of codes) {
        expect(arbreDecisionContent).toContain(`"${code}"`);
      }
    });

    it("contient les codes ZG correspondants", () => {
      expect(arbreDecisionContent).toContain("ZG360720"); // CME
      expect(arbreDecisionContent).toContain("ZG360910"); // GER
      expect(arbreDecisionContent).toContain("ZG361040"); // MEC
      expect(arbreDecisionContent).toContain("ZG361599"); // ML
    });
  });

  describe("Natures de travaux par corps d'état", () => {
    it("contient les corps d'état principaux", () => {
      expect(arbreDecisionContent).toContain("Électricité BT");
      expect(arbreDecisionContent).toContain("CVC (Chauffage/Ventilation/Clim)");
      expect(arbreDecisionContent).toContain("Plomberie / Sanitaire");
      expect(arbreDecisionContent).toContain("Couverture / Toiture");
      expect(arbreDecisionContent).toContain("Sécurité incendie");
    });

    it("mappe les corps d'état aux natures IMMOSIS", () => {
      expect(arbreDecisionContent).toContain("Eclairage et installations électriques BT");
      expect(arbreDecisionContent).toContain("Installations chauffage, ventil. climatisation");
      expect(arbreDecisionContent).toContain("Plomberie, sanitaire");
      expect(arbreDecisionContent).toContain("Couvert");
    });
  });

  describe("Fonctionnalités UX", () => {
    it("a un bouton Recommencer", () => {
      expect(arbreDecisionContent).toContain("Recommencer");
      expect(arbreDecisionContent).toContain("handleReset");
    });

    it("a un bouton Copier le résultat", () => {
      expect(arbreDecisionContent).toContain("Copier le résultat");
      expect(arbreDecisionContent).toContain("handleCopyResult");
    });

    it("a un bouton Envoyer à l'Assistant IA", () => {
      expect(arbreDecisionContent).toContain("Envoyer à l'Assistant IA");
      expect(arbreDecisionContent).toContain("handleSendToAssistant");
    });

    it("utilise sessionStorage pour transférer le contexte à l'assistant", () => {
      expect(arbreDecisionContent).toContain("sessionStorage.setItem(\"assistant_prefill\"");
    });

    it("a une barre de progression", () => {
      expect(arbreDecisionContent).toContain("bg-emerald-500 h-2 rounded-full");
    });

    it("affiche le parcours (breadcrumb)", () => {
      expect(arbreDecisionContent).toContain("Parcours");
    });

    it("permet de revenir à la question précédente", () => {
      expect(arbreDecisionContent).toContain("Revenir à la question précédente");
      expect(arbreDecisionContent).toContain("handleBack");
    });
  });

  describe("Intégration dans l'application", () => {
    const appContent = readFileSync(
      join(__dirname, "../client/src/App.tsx"),
      "utf-8"
    );
    const layoutContent = readFileSync(
      join(__dirname, "../client/src/components/DashboardLayout.tsx"),
      "utf-8"
    );

    it("la route /arbre-decision est enregistrée dans App.tsx", () => {
      expect(appContent).toContain("/arbre-decision");
      expect(appContent).toContain("ArbreDecisionPage");
    });

    it("le lien est dans la navigation sidebar", () => {
      expect(layoutContent).toContain("Arbre de Décision");
      expect(layoutContent).toContain("/arbre-decision");
    });

    it("utilise l'icône TreePine", () => {
      expect(layoutContent).toContain("TreePine");
    });
  });
});
