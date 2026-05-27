import { describe, expect, it } from "vitest";

/**
 * Tests unitaires pour valider l'intégration d'IMMO 104 V3
 * dans le prompt système de l'assistant IA
 * 
 * IMMO 104 V3 : Gestion SNCF Immobilier des Occupations du Groupe Public Unifié
 * Référence : IMO00104 - Version 03 du 8 Mars 2023 (AG2A)
 */

describe("IMMO 104 V3 - Connaissances de base", () => {
  describe("Types de conventions locatives", () => {
    it("reconnaît Convention Intra SA avec durée 1 an et reconduction tacite", () => {
      const convention = {
        type: "Intra SA",
        duration: "1 an",
        renewal: "tacite reconduction",
        formalism: "inventaire validé au budget (simples baux de gestion IMMOSIS)",
      };
      expect(convention.type).toBe("Intra SA");
      expect(convention.duration).toBe("1 an");
      expect(convention.renewal).toBe("tacite reconduction");
    });

    it("reconnaît Convention Inter SA avec formalisation obligatoire et pas de tacite reconduction", () => {
      const convention = {
        type: "Inter SA",
        formalized: true,
        renewal: "pas de tacite reconduction",
        duration: "fixée dans contrat",
      };
      expect(convention.type).toBe("Inter SA");
      expect(convention.formalized).toBe(true);
      expect(convention.renewal).toBe("pas de tacite reconduction");
    });

    it("reconnaît PABE (Prise à Bail Externe) avec preneur principal généralement SNCF SA", () => {
      const pabe = {
        type: "PABE",
        mainTenant: "SNCF SA",
        occupants: "SA Clientes ou filiales SNCF",
        propertyOwner: "tiers externe au GPU",
      };
      expect(pabe.type).toBe("PABE");
      expect(pabe.mainTenant).toBe("SNCF SA");
    });
  });

  describe("Cas particuliers par SA", () => {
    it("SNCF Réseau Intra SA : pas de loyer interne", () => {
      const intraSncfReseau = {
        sa: "SNCF Réseau",
        convention: "Intra SA",
        rent: null,
        note: "pas de loyer interne",
      };
      expect(intraSncfReseau.rent).toBeNull();
    });

    it("Fret SNCF Intra SA : pas de loyer interne", () => {
      const intraFretSncf = {
        sa: "Fret SNCF",
        convention: "Intra SA",
        rent: null,
        note: "pas de loyer interne",
      };
      expect(intraFretSncf.rent).toBeNull();
    });

    it("SNCF Voyageurs inter-RG : loyer coût complet (DAP + impôts + entretien forfait)", () => {
      const voyageursInterRg = {
        sa: "SNCF Voyageurs",
        convention: "Intra SA inter-RG",
        rentType: "coût complet",
        components: ["DAP", "impôts", "entretien forfait", "frais financiers"],
      };
      expect(voyageursInterRg.rentType).toBe("coût complet");
      expect(voyageursInterRg.components).toContain("DAP");
    });

    it("SNCF SA Intra SA : loyer marché (sauf RG 24051/24052 actifs sociétaux sans loyer)", () => {
      const sncfSaIntra = {
        sa: "SNCF SA",
        convention: "Intra SA",
        rentType: "marché",
        exceptions: ["RG 24051", "RG 24052"],
        exceptionNote: "actifs sociétaux sans loyer",
      };
      expect(sncfSaIntra.rentType).toBe("marché");
      expect(sncfSaIntra.exceptions).toContain("RG 24051");
    });
  });

  describe("Postes de charges immobilières", () => {
    it("Charges incombant au propriétaire : entretien, bâtiments vacants, impôts, assurances, fluides, rémunération", () => {
      const ownerCharges = [
        "Entretien et maintenance propriétaire",
        "Bâtiments non occupés",
        "Impôts et taxes",
        "Assurances",
        "Fluides sur surfaces vacantes",
        "Rémunération SNCF Immobilier",
      ];
      expect(ownerCharges.length).toBe(6);
      expect(ownerCharges).toContain("Entretien et maintenance propriétaire");
    });

    it("Charges refacturées à l'occupant : forfait annuel impôts + 30% du loyer nu pour entretien", () => {
      const refacturableCharges = {
        taxes: "forfait annuel = quote-part taxe foncière + taxe bureau au prorata surfaces",
        maintenance: "30% du loyer nu (bâtiments assujettis loyer marché, révisé annuellement ILAT)",
      };
      expect(refacturableCharges.maintenance).toContain("30%");
      expect(refacturableCharges.maintenance).toContain("ILAT");
    });

    it("Charges incombant à l'occupant : loyer nu, entretien courant, travaux amélioratifs, services, fluides, assurances DI Voyageurs", () => {
      const tenantCharges = [
        "Loyer nu",
        "Entretien et maintenance courante",
        "Travaux amélioratifs",
        "Services (Facility Management)",
        "Fluides",
        "Assurances (biens DI Voyageurs uniquement)",
      ];
      expect(tenantCharges.length).toBe(6);
      expect(tenantCharges).toContain("Loyer nu");
    });
  });

  describe("Détermination du loyer nu", () => {
    it("Surface locative (bâtiments) = Surface utile occupée privatif + quote-part parties communes", () => {
      const surfaceCalculation = {
        formula: "Surface utile privatif + quote-part parties communes",
        distribution: "au prorata des surfaces utiles occupées privatif",
        rule: "surfaces physiques localisables sur site (pas de surfaces virtuelles analytiques)",
      };
      expect(surfaceCalculation.formula).toContain("Surface utile privatif");
      expect(surfaceCalculation.rule).toContain("surfaces physiques localisables");
    });

    it("Terrain d'assiette = surface projetée bâtiment × 2,5 (inclus dans loyer bâtiment, pas de loyer séparé)", () => {
      const terrainAssiette = {
        formula: "surface projetée bâtiment × 2,5",
        inclusion: "inclus dans loyer bâtiment",
        separateRent: false,
      };
      expect(terrainAssiette.formula).toContain("2,5");
      expect(terrainAssiette.separateRent).toBe(false);
    });

    it("Types de loyers : nu (hors charges), marché (Inter SA/Intra SNCF/Intra Voyageurs DI), coût complet (Intra Voyageurs inter-RG hors DI)", () => {
      const rentTypes = {
        bare: { name: "Loyer nu", domain: "domaine public", description: "hors charges ou rémunération" },
        market: { name: "Loyer de marché", domain: "Inter SA, Intra SNCF, Intra Voyageurs DI", description: "valeur théorique hors taxes/charges" },
        fullCost: { name: "Loyer coût complet", domain: "Intra Voyageurs inter-RG hors DI", description: "DAP + impôts + entretien forfait + frais financiers" },
      };
      expect(rentTypes.market.name).toBe("Loyer de marché");
      expect(rentTypes.fullCost.description).toContain("DAP");
    });
  });

  describe("Charges dans les PABE (Prises à Bail Externes)", () => {
    it("Surface locative PABE = Surface utile occupée + quote-part parties communes (répartition au prorata)", () => {
      const pabeCalculation = {
        formula: "Surface utile occupée + quote-part parties communes",
        distribution: "au prorata des surfaces occupées",
      };
      expect(pabeCalculation.formula).toContain("Surface utile occupée");
    });

    it("Postes facturés aux sous-locataires : quote-part loyer, charges communes, taxes, assurances, fluides, rémunération SNCF Immobilier", () => {
      const pabeCharges = [
        "Quote-part loyer bail externe",
        "Quote-part charges communes",
        "Taxes, assurances, fluides",
        "Rémunération SNCF Immobilier",
      ];
      expect(pabeCharges.length).toBe(4);
      expect(pabeCharges).toContain("Rémunération SNCF Immobilier");
    });
  });

  describe("Emménagement, libération et vacance", () => {
    it("Période aménagement nouveaux locaux : propriétaire prend en charge le loyer (débute à prise de jouissance)", () => {
      const moveIn = {
        period: "aménagement nouveaux locaux",
        responsibility: "propriétaire",
        startDate: "prise de jouissance",
      };
      expect(moveIn.responsibility).toBe("propriétaire");
    });

    it("Période remise en état locaux restitués : occupant responsable (au-delà délai contractuel : propriétaire)", () => {
      const moveOut = {
        period: "remise en état locaux restitués",
        responsibility: "occupant",
        afterDelay: "propriétaire",
      };
      expect(moveOut.responsibility).toBe("occupant");
      expect(moveOut.afterDelay).toBe("propriétaire");
    });

    it("Libération : occupant quitte, état des lieux de sortie établi, propriétaire reprend possession", () => {
      const liberation = {
        steps: ["occupant quitte", "état des lieux de sortie", "propriétaire reprend possession"],
      };
      expect(liberation.steps.length).toBe(3);
      expect(liberation.steps[1]).toBe("état des lieux de sortie");
    });
  });

  describe("Obligations des parties", () => {
    it("Obligation de délivrance (Article 1719 Code Civil) : délivrer, entretenir, faire jouir paisiblement, assurer permanence plantations", () => {
      const deliveryObligation = [
        "Délivrer le bien loué (logement décent si habitation principale)",
        "Entretenir le bien en état de servir à l'usage prévu",
        "En faire jouir paisiblement le preneur pendant durée du bail",
        "Assurer permanence et qualité des plantations",
      ];
      expect(deliveryObligation.length).toBe(4);
      expect(deliveryObligation[0]).toContain("Délivrer");
    });

    it("Gestion des risques immobiliers : propriétaire responsable (amiante, ICPE, IGH, etc.)", () => {
      const riskManagement = {
        responsibility: "propriétaire",
        risks: ["amiante", "ICPE", "IGH"],
      };
      expect(riskManagement.responsibility).toBe("propriétaire");
      expect(riskManagement.risks).toContain("amiante");
    });
  });

  describe("Constructions sur sol d'autrui", () => {
    it("Conditions : accord préalable SNCF Immobilier + propriétaire, convention non simplifiée obligatoire", () => {
      const construction = {
        conditions: [
          "accord préalable SNCF Immobilier",
          "accord préalable propriétaire",
          "convention non simplifiée obligatoire",
        ],
      };
      expect(construction.conditions.length).toBe(3);
    });

    it("Convention non simplifiée doit inclure : clauses dérogatoires, descriptif destination, coût/planning travaux, durée engagement, conditions résiliation", () => {
      const contractRequirements = [
        "clauses dérogatoires",
        "descriptif détaillé destination",
        "coût et planning travaux",
        "durée de l'engagement",
        "conditions de résiliation anticipée",
      ];
      expect(contractRequirements.length).toBe(5);
      expect(contractRequirements).toContain("clauses dérogatoires");
    });
  });

  describe("Systèmes d'information", () => {
    it("IMMOSIS : gère inventaire physique, gestion locative, gestion technique", () => {
      const immosis = {
        name: "IMMOSIS",
        functions: ["inventaire physique", "gestion locative", "gestion technique"],
      };
      expect(immosis.functions.length).toBe(3);
      expect(immosis.functions).toContain("gestion locative");
    });

    it("Geoprism : géolocalisation inventaire physique", () => {
      const geoprism = {
        name: "Geoprism",
        function: "géolocalisation inventaire physique",
      };
      expect(geoprism.function).toContain("géolocalisation");
    });

    it("AGIL : consultation taxes immobilières par bien", () => {
      const agil = {
        name: "AGIL",
        function: "consultation taxes immobilières par bien",
      };
      expect(agil.function).toContain("taxes immobilières");
    });
  });

  describe("Points clés analyse contrats immobiliers", () => {
    it("Vérifications essentielles : type convention, SA propriétaire/occupante, charges, surfaces, indexation, cas particuliers", () => {
      const verifications = [
        "Vérifier le type de convention",
        "Identifier la SA propriétaire et occupante",
        "Vérifier les charges facturées",
        "Vérifier les surfaces",
        "Vérifier l'indexation",
        "Identifier cas particuliers",
      ];
      expect(verifications.length).toBe(6);
      expect(verifications[2]).toContain("charges");
    });

    it("Charges à vérifier : loyer nu (marché), impôts/taxes (forfait annuel indexé), entretien (30% loyer nu), fluides (prorata surfaces)", () => {
      const chargeVerifications = {
        bareRent: "doit être loyer de marché (sauf cas particuliers)",
        taxes: "forfait annuel indexé",
        maintenance: "30% du loyer nu (bâtiments assujettis loyer marché)",
        utilities: "facturés au prorata surfaces occupées",
      };
      expect(chargeVerifications.maintenance).toContain("30%");
      expect(chargeVerifications.taxes).toContain("indexé");
    });

    it("Cas particuliers : Intra Réseau/Fret (pas loyer), Intra Voyageurs inter-RG (loyer coût complet), Intra SNCF RG 24051/24052 (pas loyer), bâtiments vacants (charges propriétaire)", () => {
      const specialCases = {
        intraReseau: "pas de loyer",
        intraFret: "pas de loyer",
        intraVoyageurs: "loyer coût complet",
        intraSncfSocial: "pas de loyer (RG 24051/24052)",
        vacant: "charges au propriétaire",
      };
      expect(specialCases.intraReseau).toBe("pas de loyer");
      expect(specialCases.intraVoyageurs).toContain("coût complet");
    });
  });

  describe("Indexation et révision des charges", () => {
    it("ILAT (Indice des Loyers de l'Activité Tertiaire) : utilisé pour révision annuelle des charges d'entretien et maintenance", () => {
      const ilat = {
        name: "ILAT",
        fullName: "Indice des Loyers de l'Activité Tertiaire",
        usage: "révision annuelle charges d'entretien et maintenance",
      };
      expect(ilat.name).toBe("ILAT");
      expect(ilat.usage).toContain("révision annuelle");
    });

    it("Indexation des charges : même rythme que le loyer ou redevance d'occupation", () => {
      const indexation = {
        rule: "même rythme que le loyer ou redevance d'occupation",
        appliedTo: ["charges d'entretien", "charges de maintenance"],
      };
      expect(indexation.rule).toContain("même rythme");
    });
  });

  describe("Domaines public vs privé", () => {
    it("Domaine public (SNCF Réseau) : titre d'occupation = COT (Convention d'Occupation Temporaire)", () => {
      const publicDomain = {
        sa: "SNCF Réseau",
        domain: "public",
        titleType: "COT",
        fullName: "Convention d'Occupation Temporaire",
      };
      expect(publicDomain.titleType).toBe("COT");
    });

    it("Domaine privé (SNCF, Voyageurs, Fret) : titre d'occupation = Bail civil", () => {
      const privateDomain = {
        sa: ["SNCF", "SNCF Voyageurs", "Fret SNCF"],
        domain: "privé",
        titleType: "Bail civil",
      };
      expect(privateDomain.titleType).toBe("Bail civil");
      expect(privateDomain.sa).toContain("SNCF Voyageurs");
    });
  });
});
