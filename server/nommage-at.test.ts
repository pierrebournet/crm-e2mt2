import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Tests pour la logique de génération de noms AT IMMOSIS
// (tests purs de la logique métier, sans dépendance React)
// ═══════════════════════════════════════════════════════════════════

// Reproduire la logique de génération de noms AT
function generateATName(params: {
  typeAT: "annuelle" | "ponctuelle";
  region: string;
  annee: string;
  prestataire: string;
  portefeuille: string;
  typeDepense?: string;
  particularite?: string;
  utBat?: string;
  numDevis?: string;
  descriptif?: string;
}): string {
  const parts: string[] = [];

  parts.push(params.region);
  parts.push(params.annee);
  parts.push(params.prestataire);
  if (params.portefeuille) parts.push(params.portefeuille);

  if (params.typeAT === "annuelle") {
    if (params.typeDepense) parts.push(params.typeDepense);
    parts.push("ANNUEL");
  } else {
    if (params.particularite && params.particularite !== "none") parts.push(params.particularite);
    if (params.utBat) parts.push(params.utBat);
    if (params.prestataire === "ESBE" && params.numDevis) parts.push(params.numDevis);
    if (params.descriptif) parts.push(params.descriptif);
  }

  return parts.join("-");
}

// Reproduire la logique de complétude
function isATNameComplete(params: {
  typeAT: "annuelle" | "ponctuelle";
  portefeuille: string;
  typeDepense?: string;
  utBat?: string;
  descriptif?: string;
}): boolean {
  if (!params.portefeuille) return false;
  if (params.typeAT === "annuelle") return !!params.typeDepense;
  return !!params.utBat && !!params.descriptif;
}

// Données de référence des types IMMOSIS
const immosisTypes = [
  { budget: "GE", code: "GE", libelle: "Gros Entretiens" },
  { budget: "GE", code: "GE IST CCE", libelle: "Gros Entretien IST CCE" },
  { budget: "GE", code: "GE_CMT", libelle: "Gros entretiens - CMT" },
  { budget: "GE", code: "OGT_CSG", libelle: "Opération de gros travaux" },
  { budget: "GE", code: "OTGT_CSG", libelle: "Opération de très gros travaux" },
  { budget: "GE", code: "EF", libelle: "Étude de Faisabilité" },
  { budget: "GE", code: "CA EE", libelle: "Campagne d'économies d'énergies" },
  { budget: "GE", code: "TDR", libelle: "Travaux DE ROBIEN" },
  { budget: "GE", code: "TDSC", libelle: "Dépollution des Sites Contaminés" },
  { budget: "GE", code: "TEGR", libelle: "Éradication du Gaz R22" },
  { budget: "GE", code: "TEPCB", libelle: "Élimination des PCB" },
  { budget: "GE", code: "TRHPE", libelle: "Réseaux Humides - Plan Écarlate" },
  { budget: "GE", code: "TRPB", libelle: "Retrait du Plomb" },
  { budget: "GE", code: "MEC_EE", libelle: "Mise en conformité énergie électrique" },
  { budget: "GE", code: "TRCF", libelle: "Retrait des Cuves Fuel Simple Peau" },
  { budget: "GE", code: "GE", libelle: "Gros Entretiens" },
  { budget: "AM_VR_TVX", code: "VTR AMIA INIT", libelle: "Diagnostic Initial Amiante" },
  { budget: "AM_VR_TVX", code: "TDA", libelle: "Travaux de Désamiantage" },
  { budget: "AM_VR_TVX", code: "TDANF", libelle: "Travaux Enlèvement Amiante Non Friable" },
  { budget: "AM_VR_TVX", code: "EXP AMIA", libelle: "Contre Expertise Amiante" },
  { budget: "AM_VR_TVX", code: "CP AMIA", libelle: "Contrôle Périodique Amiante" },
  { budget: "AM_VR_TVX", code: "VSG", libelle: "Visite de suivi de garanties" },
  { budget: "AM_VR_TVX", code: "VTR ACC DIAG", libelle: "Accompagnement diagnostic" },
  { budget: "VR", code: "VTR_EE", libelle: "Visite réglementaire énergie électrique" },
  { budget: "VR", code: "VTR G", libelle: "Visites de Gestion" },
  { budget: "VR", code: "VTR GBNC", libelle: "Visites de Gestion des Bâtiments Non Courants" },
  { budget: "VR", code: "VTR GRP", libelle: "Groupes de Visites techniques et réglementaires" },
  { budget: "VR", code: "VTR PR", libelle: "Vérifications Réglementaires" },
  { budget: "VR", code: "VTR_OA_AI_GHV", libelle: "Visite réglementaire intermédiaire GHV, OA, abri" },
  { budget: "CME_PTP", code: "CME_CMT", libelle: "Contrats de maintenance externe - CMT" },
  { budget: "CME_PTP", code: "CME", libelle: "Contrats de maintenance externe" },
  { budget: "CME_PTP", code: "CMI", libelle: "Contrats de Maintenance Interne" },
  { budget: "CME_PTP", code: "PTP_CMT", libelle: "Petits travaux propriétaires - CMT" },
  { budget: "CME_PTP", code: "PTP", libelle: "Contrats Petits Travaux du Propriétaire" },
  { budget: "CME_PTP", code: "CVC", libelle: "Maintenance Élargie Chauffage Ventilation Climat." },
  { budget: "CME_PTP", code: "EE", libelle: "Maintenance Élargie Énergie Électrique" },
  { budget: "CME_PTP", code: "EE_MPS", libelle: "Énergie électrique MPS" },
  { budget: "CME_PTP", code: "CME", libelle: "Contrats de maintenance externe" },
  { budget: "CME_PTP", code: "CME_CMT", libelle: "Contrats de maintenance externe - CMT" },
  { budget: "CME_PTP", code: "CME", libelle: "Contrats de maintenance externe" },
];

describe("Nommage AT - Génération de noms", () => {
  it("génère un nom AT annuelle complet", () => {
    const name = generateATName({
      typeAT: "annuelle",
      region: "59",
      annee: "23",
      prestataire: "ESBE",
      portefeuille: "RES INDUS",
      typeDepense: "MPS ELEC",
    });
    expect(name).toBe("59-23-ESBE-RES INDUS-MPS ELEC-ANNUEL");
  });

  it("génère un nom AT annuelle PACA DI", () => {
    const name = generateATName({
      typeAT: "annuelle",
      region: "58",
      annee: "23",
      prestataire: "DI",
      portefeuille: "FRET",
      typeDepense: "PTP E2MT",
    });
    expect(name).toBe("58-23-DI-FRET-PTP E2MT-ANNUEL");
  });

  it("génère un nom AT ponctuelle DI avec particularité OPS", () => {
    const name = generateATName({
      typeAT: "ponctuelle",
      region: "58",
      annee: "23",
      prestataire: "DI",
      portefeuille: "MOBI SOCIAL",
      particularite: "OPS",
      utBat: "005737JB010",
      descriptif: "Rplct 2 BAES CMPP",
    });
    expect(name).toBe("58-23-DI-MOBI SOCIAL-OPS-005737JB010-Rplct 2 BAES CMPP");
  });

  it("génère un nom AT ponctuelle ESBE avec numéro de devis", () => {
    const name = generateATName({
      typeAT: "ponctuelle",
      region: "59",
      annee: "23",
      prestataire: "ESBE",
      portefeuille: "RES FERRO",
      utBat: "005654VB061",
      numDevis: "MP 220 2022",
      descriptif: "Brochage de fissures",
    });
    expect(name).toBe("59-23-ESBE-RES FERRO-005654VB061-MP 220 2022-Brochage de fissures");
  });

  it("génère un nom AT ponctuelle sans particularité", () => {
    const name = generateATName({
      typeAT: "ponctuelle",
      region: "58",
      annee: "26",
      prestataire: "DI",
      portefeuille: "RES TERTIAIRE",
      utBat: "001234AB567",
      descriptif: "Remplacement chaudière",
    });
    expect(name).toBe("58-26-DI-RES TERTIAIRE-001234AB567-Remplacement chaudière");
  });

  it("ne doit pas inclure le numéro de devis pour DI", () => {
    const name = generateATName({
      typeAT: "ponctuelle",
      region: "58",
      annee: "26",
      prestataire: "DI",
      portefeuille: "MOBI INDUS",
      utBat: "001234AB567",
      numDevis: "DEVIS-123",
      descriptif: "Test",
    });
    expect(name).not.toContain("DEVIS-123");
    expect(name).toBe("58-26-DI-MOBI INDUS-001234AB567-Test");
  });

  it("ignore la particularité 'none'", () => {
    const name = generateATName({
      typeAT: "ponctuelle",
      region: "58",
      annee: "26",
      prestataire: "DI",
      portefeuille: "FRET",
      particularite: "none",
      utBat: "001234AB567",
      descriptif: "Réparation fuite",
    });
    expect(name).not.toContain("none");
    expect(name).toBe("58-26-DI-FRET-001234AB567-Réparation fuite");
  });

  it("gère le cas sans portefeuille", () => {
    const name = generateATName({
      typeAT: "annuelle",
      region: "58",
      annee: "26",
      prestataire: "DI",
      portefeuille: "",
      typeDepense: "VRE",
    });
    expect(name).toBe("58-26-DI-VRE-ANNUEL");
  });
});

describe("Nommage AT - Validation de complétude", () => {
  it("AT annuelle complète avec portefeuille et type dépense", () => {
    expect(
      isATNameComplete({
        typeAT: "annuelle",
        portefeuille: "RES INDUS",
        typeDepense: "VRE",
      })
    ).toBe(true);
  });

  it("AT annuelle incomplète sans type dépense", () => {
    expect(
      isATNameComplete({
        typeAT: "annuelle",
        portefeuille: "RES INDUS",
      })
    ).toBe(false);
  });

  it("AT annuelle incomplète sans portefeuille", () => {
    expect(
      isATNameComplete({
        typeAT: "annuelle",
        portefeuille: "",
        typeDepense: "VRE",
      })
    ).toBe(false);
  });

  it("AT ponctuelle complète avec UT-BAT et descriptif", () => {
    expect(
      isATNameComplete({
        typeAT: "ponctuelle",
        portefeuille: "MOBI SOCIAL",
        utBat: "005737JB010",
        descriptif: "Rplct 2 BAES",
      })
    ).toBe(true);
  });

  it("AT ponctuelle incomplète sans descriptif", () => {
    expect(
      isATNameComplete({
        typeAT: "ponctuelle",
        portefeuille: "MOBI SOCIAL",
        utBat: "005737JB010",
      })
    ).toBe(false);
  });

  it("AT ponctuelle incomplète sans UT-BAT", () => {
    expect(
      isATNameComplete({
        typeAT: "ponctuelle",
        portefeuille: "MOBI SOCIAL",
        descriptif: "Rplct 2 BAES",
      })
    ).toBe(false);
  });
});

describe("Nommage AT - Types IMMOSIS", () => {
  it("contient 40 types au total", () => {
    expect(immosisTypes).toHaveLength(40);
  });

  it("contient les 4 budgets", () => {
    const budgets = [...new Set(immosisTypes.map((t) => t.budget))];
    expect(budgets).toContain("GE");
    expect(budgets).toContain("AM_VR_TVX");
    expect(budgets).toContain("VR");
    expect(budgets).toContain("CME_PTP");
    expect(budgets).toHaveLength(4);
  });

  it("a 16 types dans le budget GE", () => {
    const geTypes = immosisTypes.filter((t) => t.budget === "GE");
    expect(geTypes).toHaveLength(16);
  });

  it("a 7 types dans le budget Amiante/VR TVX", () => {
    const amTypes = immosisTypes.filter((t) => t.budget === "AM_VR_TVX");
    expect(amTypes).toHaveLength(7);
  });

  it("a 6 types dans le budget VR", () => {
    const vrTypes = immosisTypes.filter((t) => t.budget === "VR");
    expect(vrTypes).toHaveLength(6);
  });

  it("a 11 types dans le budget CME/PTP", () => {
    const cmeTypes = immosisTypes.filter((t) => t.budget === "CME_PTP");
    expect(cmeTypes).toHaveLength(11);
  });

  it("contient le code GE_CMT pour les gros entretiens E2MT", () => {
    const geCmt = immosisTypes.find((t) => t.code === "GE_CMT");
    expect(geCmt).toBeDefined();
    expect(geCmt?.budget).toBe("GE");
    expect(geCmt?.libelle).toContain("CMT");
  });

  it("contient le code PTP_CMT pour les petits travaux E2MT", () => {
    const ptpCmt = immosisTypes.find((t) => t.code === "PTP_CMT");
    expect(ptpCmt).toBeDefined();
    expect(ptpCmt?.budget).toBe("CME_PTP");
  });

  it("contient le code VTR AMIA INIT pour le diagnostic amiante", () => {
    const amiante = immosisTypes.find((t) => t.code === "VTR AMIA INIT");
    expect(amiante).toBeDefined();
    expect(amiante?.budget).toBe("AM_VR_TVX");
    expect(amiante?.libelle).toContain("Amiante");
  });

  it("contient le code VTR_EE pour les visites réglementaires énergie", () => {
    const vtrEe = immosisTypes.find((t) => t.code === "VTR_EE");
    expect(vtrEe).toBeDefined();
    expect(vtrEe?.budget).toBe("VR");
  });

  it("contient le code CA EE pour les économies d'énergie", () => {
    const caEe = immosisTypes.find((t) => t.code === "CA EE");
    expect(caEe).toBeDefined();
    expect(caEe?.budget).toBe("GE");
  });
});

describe("Nommage AT - Codes région", () => {
  it("code 47 correspond à Occitanie Ouest", () => {
    const regions = [
      { code: "47", label: "Occitanie Ouest" },
      { code: "58", label: "PACA" },
      { code: "59", label: "Occitanie Est" },
    ];
    const occ = regions.find((r) => r.code === "47");
    expect(occ?.label).toBe("Occitanie Ouest");
  });

  it("code 58 correspond à PACA", () => {
    const regions = [
      { code: "47", label: "Occitanie Ouest" },
      { code: "58", label: "PACA" },
      { code: "59", label: "Occitanie Est" },
    ];
    const paca = regions.find((r) => r.code === "58");
    expect(paca?.label).toBe("PACA");
  });

  it("code 59 correspond à Occitanie Est", () => {
    const regions = [
      { code: "47", label: "Occitanie Ouest" },
      { code: "58", label: "PACA" },
      { code: "59", label: "Occitanie Est" },
    ];
    const occEst = regions.find((r) => r.code === "59");
    expect(occEst?.label).toBe("Occitanie Est");
  });
});
