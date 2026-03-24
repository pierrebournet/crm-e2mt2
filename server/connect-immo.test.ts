import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Read the routers.ts file to check the Connect'Immo content in the assistant prompt
const routersContent = readFileSync(join(__dirname, "routers.ts"), "utf-8");

describe("Connect'Immo V.8 — Intégration dans le prompt IA", () => {
  describe("Présentation et navigation", () => {
    it("devrait mentionner Connect'Immo comme Power Apps SNCF Immobilier", () => {
      expect(routersContent).toContain("Power Apps");
      expect(routersContent).toContain("SNCF Immobilier");
    });

    it("devrait contenir la navigation principale", () => {
      expect(routersContent).toContain("Création (Chantier, Projets, Commandes, MyH)");
      expect(routersContent).toContain("Modification en masse");
      expect(routersContent).toContain("Reporting");
      expect(routersContent).toContain("Planification");
      expect(routersContent).toContain("Programmation");
      expect(routersContent).toContain("Archives");
    });

    it("devrait préciser que Google Chrome est obligatoire", () => {
      expect(routersContent).toContain("Google Chrome");
    });
  });

  describe("Création de projet OPEX", () => {
    it("devrait contenir la procédure complète de création", () => {
      expect(routersContent).toContain("Créer un projet OPEX dans Connect'Immo");
      expect(routersContent).toContain('bouton radio "Projets"');
      expect(routersContent).toContain('Cliquer sur "+"');
    });

    it("devrait lister tous les champs obligatoires", () => {
      expect(routersContent).toContain("DIT*");
      expect(routersContent).toContain("Région*");
      expect(routersContent).toContain("Agence*");
      expect(routersContent).toContain("UT*");
      expect(routersContent).toContain("Bien*");
      expect(routersContent).toContain("Intitulé du projet*");
      expect(routersContent).toContain("Origine*");
      expect(routersContent).toContain("Sous-types*");
      expect(routersContent).toContain("Gérants de programme*");
      expect(routersContent).toContain("Attributaire*");
    });

    it("devrait mentionner la vérification via la Loupe", () => {
      expect(routersContent).toContain("Loupe");
      expect(routersContent).toContain("même UT_BAT");
    });

    it("devrait mentionner la commande par défaut automatique", () => {
      expect(routersContent).toContain("commande par défaut est AUTOMATIQUEMENT créée");
    });

    it("devrait mentionner l'astuce MULTI", () => {
      expect(routersContent).toContain('"MULTI"');
      expect(routersContent).toContain("_MULTI");
    });

    it("devrait mentionner le switch données budgétaires", () => {
      expect(routersContent).toContain("Afficher les données budgétaires");
    });

    it("devrait mentionner le format ID projet", () => {
      expect(routersContent).toContain("P-XX-XXXXXX");
      expect(routersContent).toContain("P-23-001168");
    });
  });

  describe("Onglets du projet", () => {
    it("devrait contenir les 7 onglets", () => {
      expect(routersContent).toContain("Onglet Emergence");
      expect(routersContent).toContain("Onglet Prévision pluriannuelle");
      expect(routersContent).toContain("Onglet Ouverture AT/OS");
      expect(routersContent).toContain("Onglet Démolition");
      expect(routersContent).toContain("Onglet Synthèse commande(s)");
      expect(routersContent).toContain("Onglet Demande de devis");
      expect(routersContent).toContain("Onglet Vie de la commande");
    });

    it("devrait détailler les switches de l'onglet Emergence", () => {
      expect(routersContent).toContain("Démolition, Locatif, Mise en sécurité ferroviaire, Risques Ferroviaires, Pollution");
    });

    it("devrait mentionner la règle d'unicité AT/OS", () => {
      expect(routersContent).toContain("RÈGLE D'UNICITÉ");
      expect(routersContent).toContain("UN SEUL projet");
    });

    it("devrait mentionner les 4 numéros du statut commande", () => {
      expect(routersContent).toContain("N° de devis, N° DA, N° CDA, N° de réception");
      expect(routersContent).toContain("quartiers colorés du statut");
    });

    it("devrait mentionner la bonne pratique Axe local/central", () => {
      expect(routersContent).toContain("Axe local");
      expect(routersContent).toContain("Axe central");
      expect(routersContent).toContain("Référence du contrat");
    });
  });

  describe("Chantiers", () => {
    it("devrait contenir la procédure de création de chantier", () => {
      expect(routersContent).toContain("Créer un nouveau chantier");
      expect(routersContent).toContain('Bouton radio "Chantier"');
    });

    it("devrait mentionner la règle un projet = un chantier", () => {
      expect(routersContent).toContain("UN SEUL chantier");
    });

    it("devrait mentionner la mise à jour de chantier existant", () => {
      expect(routersContent).toContain("Mise à jour du chantier existant");
    });

    it("devrait mentionner la suppression automatique chantier vide", () => {
      expect(routersContent).toContain("automatiquement supprimé si ce projet est dissocié");
    });
  });

  describe("Consultation et recherche", () => {
    it("devrait contenir les 3 vues de consultation", () => {
      expect(routersContent).toContain("Vue Projets");
      expect(routersContent).toContain("Vue Commandes");
      expect(routersContent).toContain("Vue My Horizon");
    });

    it("devrait mentionner que CAPEX est en consultation uniquement", () => {
      expect(routersContent).toContain("CONSULTATION uniquement");
    });

    it("devrait contenir la modification en masse", () => {
      expect(routersContent).toContain("Filtrer par région");
      expect(routersContent).toContain("Filtrer par pilote");
    });
  });

  describe("UT_BAT", () => {
    it("devrait contenir la procédure de modification UT_BAT projet", () => {
      expect(routersContent).toContain("Modifier l'UT_BAT d'un projet");
      expect(routersContent).toContain('Bouton "Crayon"');
    });

    it("devrait contenir la procédure de modification UT_BAT commande", () => {
      expect(routersContent).toContain("Modifier l'UT_BAT d'une commande");
    });

    it("devrait mentionner que les commandes existantes ne sont pas mises à jour auto", () => {
      expect(routersContent).toContain("FUTURES commandes");
      expect(routersContent).toContain("mettre à jour chaque commande séparément");
    });
  });

  describe("Budget et rapports", () => {
    it("devrait contenir le calcul du budget disponible", () => {
      expect(routersContent).toContain("Principe de calcul du budget disponible");
      expect(routersContent).toContain("Perf'Eco");
    });

    it("devrait contenir les 3 rapports OPEX", () => {
      expect(routersContent).toContain("Tableau complet des données en cours");
      expect(routersContent).toContain("Tableau complet des données projets");
      expect(routersContent).toContain("données antérieures");
    });

    it("devrait mentionner la procédure d'export", () => {
      expect(routersContent).toContain("Exporter des données");
    });
  });

  describe("Archivage", () => {
    it("devrait mentionner l'archivage automatique au 31 juillet", () => {
      expect(routersContent).toContain("31 juillet");
    });

    it("devrait mentionner la condition de date de fin des travaux", () => {
      expect(routersContent).toContain("Date de fin des travaux");
    });
  });

  describe("Statut Transféré vers MyH", () => {
    it("devrait mentionner le lien avec myHorizon", () => {
      expect(routersContent).toContain("Transféré vers MyH");
      expect(routersContent).toContain("ID_MyH");
    });

    it("devrait mentionner la disparition du tableau programmateur", () => {
      expect(routersContent).toContain("disparaissent du tableau du programmateur");
    });
  });

  describe("Astuces et bonnes pratiques", () => {
    it("devrait contenir les astuces importantes", () => {
      expect(routersContent).toContain("Astuces importantes Connect'Immo");
    });

    it("devrait mentionner les champs A renseigner par défaut", () => {
      expect(routersContent).toContain("Gestionnaire d'actifs");
      expect(routersContent).toContain("Occupant bénéficiaire");
    });

    it("devrait mentionner les 3 cas du gérant de programme", () => {
      expect(routersContent).toContain("3 cas pour le Gérant de programme");
    });

    it("devrait contenir les 5 cas d'usage", () => {
      expect(routersContent).toContain("5 cas d'usage Connect'Immo");
      expect(routersContent).toContain("AT régionale sans UT-BAT");
      expect(routersContent).toContain("AT régionale avec UT-BAT au niveau commande");
    });
  });

  describe("Suppression", () => {
    it("devrait mentionner les règles de suppression", () => {
      expect(routersContent).toContain("Suppression dans Connect'Immo");
      expect(routersContent).toContain("supprime le projet ET TOUTES ses commandes");
      expect(routersContent).toContain("1 projet = minimum 1 CDA");
    });
  });
});
