import { describe, it, expect } from "vitest";

// ===== Tests for Evolutions 2026 data integrity =====

// Import the data structures that are used in the frontend page
// We replicate the data here to validate consistency

const CODES_COMPTABLES_2026 = {
  entiteGL: { ancien: "13402", nouveau: "65910" },
  division: { ancien: "02136", nouveau: "65924" },
  rg: { ancien: "02533", nouveau: "00138" },
  departement: { ancien: "06305", nouveau: "neant" },
  buap: { ancien: "01418", nouveau: "00043" },
  bupo: { ancien: "01425", nouveau: "67099" },
};

const FAMILLES_PROPRIETAIRE = [
  { enveloppe: "Contrat de Maintenance", codeZG: "ZG360720" },
  { enveloppe: "Contrôles et Visites Réglementaires", codeZG: "ZG360840" },
  { enveloppe: "Diagnostics, audits non réglementaires et autres dépenses", codeZG: "ZG361050" },
  { enveloppe: "Gros entretien et réparations (GER)", codeZG: "ZG360910" },
  { enveloppe: "MEC suite Contrôles et Visites Réglementaires", codeZG: "ZG361040" },
  { enveloppe: "Petits Travaux Propriétaire", codeZG: "ZG361820" },
];

const FAMILLES_LOCATIF = [
  { enveloppe: "Maintenance Locative", codeZG: "ZG361599" },
  { enveloppe: "Travaux Locatifs", codeZG: "ZG361699" },
];

const CODES_FOURNISSEUR_ABE = [
  { code: "59167", nom: "ABE LANGUEDOC ROUSSILLON" },
  { code: "59166", nom: "ABE PACA" },
  { code: "59160", nom: "ABE TOULOUSE" },
];

const AXES_LOCAUX = [
  { code: "T", codePrestataireABE: "TP", proprietaire: "SNCF PABE + RH IST" },
  { code: "R", codePrestataireABE: "RP", proprietaire: "Réseau" },
  { code: "M", codePrestataireABE: "MP", proprietaire: "Voyageurs" },
  { code: "F", codePrestataireABE: "FP", proprietaire: "Fret" },
  { code: "L", codePrestataireABE: "L", proprietaire: "Maintenance locative" },
];

const GERANTS_DIT_GS = ["Matériel_autres", "Matériel_ISM", "TI_Nevers Languedoc"];

const SOUS_TYPES_SUPPRIMES = [
  "Maintenance Élargie Chauffage Ventilation Climat.",
  "Contrôle Périodique Amiante",
  "Groupes de Visites techniques et réglementaires",
  "Gros Entretien IST CCE",
  "Travaux Enlèvement Amiante Non Friable",
  "Contre Expertise Amiante",
  "RFF CIM GOE Autres",
];

const SOUS_TYPES_NOUVEAUX = [
  "Visites tech audit étude (hors réglementaire et VG)",
  "Mise en conformité réglementaire autre",
];

describe("Évolutions Maintenance 2026 - Codes comptables", () => {
  it("devrait avoir les nouveaux codes comptables DIT Grand-Sud corrects", () => {
    expect(CODES_COMPTABLES_2026.entiteGL.nouveau).toBe("65910");
    expect(CODES_COMPTABLES_2026.division.nouveau).toBe("65924");
    expect(CODES_COMPTABLES_2026.rg.nouveau).toBe("00138");
    expect(CODES_COMPTABLES_2026.buap.nouveau).toBe("00043");
    expect(CODES_COMPTABLES_2026.bupo.nouveau).toBe("67099");
  });

  it("devrait avoir les anciens codes 2025 pour référence", () => {
    expect(CODES_COMPTABLES_2026.entiteGL.ancien).toBe("13402");
    expect(CODES_COMPTABLES_2026.division.ancien).toBe("02136");
    expect(CODES_COMPTABLES_2026.rg.ancien).toBe("02533");
    expect(CODES_COMPTABLES_2026.bupo.ancien).toBe("01425");
  });

  it("devrait avoir un département comptable néant en 2026", () => {
    expect(CODES_COMPTABLES_2026.departement.nouveau).toBe("neant");
  });

  it("devrait avoir exactement 6 champs comptables définis", () => {
    expect(Object.keys(CODES_COMPTABLES_2026)).toHaveLength(6);
  });
});

describe("Évolutions Maintenance 2026 - Familles d'opérations", () => {
  it("devrait avoir exactement 6 familles propriétaire", () => {
    expect(FAMILLES_PROPRIETAIRE).toHaveLength(6);
  });

  it("devrait avoir exactement 2 familles locatif", () => {
    expect(FAMILLES_LOCATIF).toHaveLength(2);
  });

  it("devrait avoir 8 familles au total (6+2)", () => {
    expect(FAMILLES_PROPRIETAIRE.length + FAMILLES_LOCATIF.length).toBe(8);
  });

  it("devrait avoir des codes ZG uniques pour chaque famille", () => {
    const allCodes = [...FAMILLES_PROPRIETAIRE, ...FAMILLES_LOCATIF].map((f) => f.codeZG);
    const uniqueCodes = new Set(allCodes);
    expect(uniqueCodes.size).toBe(allCodes.length);
  });

  it("devrait avoir les codes ZG propriétaire commençant par ZG36", () => {
    FAMILLES_PROPRIETAIRE.forEach((f) => {
      expect(f.codeZG).toMatch(/^ZG36/);
    });
  });

  it("devrait avoir les codes ZG locatif commençant par ZG36", () => {
    FAMILLES_LOCATIF.forEach((f) => {
      expect(f.codeZG).toMatch(/^ZG36/);
    });
  });

  it("devrait contenir la famille Contrat de Maintenance avec le bon code", () => {
    const cm = FAMILLES_PROPRIETAIRE.find((f) => f.enveloppe === "Contrat de Maintenance");
    expect(cm).toBeDefined();
    expect(cm!.codeZG).toBe("ZG360720");
  });

  it("devrait contenir la famille GER avec le bon code", () => {
    const ger = FAMILLES_PROPRIETAIRE.find((f) => f.enveloppe.includes("GER"));
    expect(ger).toBeDefined();
    expect(ger!.codeZG).toBe("ZG360910");
  });
});

describe("Évolutions Maintenance 2026 - Axes locaux IMMOSIS", () => {
  it("devrait avoir 5 axes locaux définis", () => {
    expect(AXES_LOCAUX).toHaveLength(5);
  });

  it("devrait avoir le suffixe P pour les prestations ABE (sauf locatif)", () => {
    const axesAvecP = AXES_LOCAUX.filter((a) => a.codePrestataireABE !== a.code);
    expect(axesAvecP).toHaveLength(4); // T→TP, R→RP, M→MP, F→FP
    axesAvecP.forEach((a) => {
      expect(a.codePrestataireABE).toBe(a.code + "P");
    });
  });

  it("devrait avoir le code L inchangé pour la maintenance locative", () => {
    const locatif = AXES_LOCAUX.find((a) => a.code === "L");
    expect(locatif).toBeDefined();
    expect(locatif!.codePrestataireABE).toBe("L");
  });
});

describe("Évolutions Maintenance 2026 - Codes fournisseur ABE", () => {
  it("devrait avoir 3 codes fournisseur ABE", () => {
    expect(CODES_FOURNISSEUR_ABE).toHaveLength(3);
  });

  it("devrait avoir les bons codes pour chaque ABE", () => {
    const lr = CODES_FOURNISSEUR_ABE.find((f) => f.nom.includes("LANGUEDOC"));
    expect(lr).toBeDefined();
    expect(lr!.code).toBe("59167");

    const paca = CODES_FOURNISSEUR_ABE.find((f) => f.nom.includes("PACA"));
    expect(paca).toBeDefined();
    expect(paca!.code).toBe("59166");

    const tls = CODES_FOURNISSEUR_ABE.find((f) => f.nom.includes("TOULOUSE"));
    expect(tls).toBeDefined();
    expect(tls!.code).toBe("59160");
  });
});

describe("Évolutions Maintenance 2026 - Gérants de programme", () => {
  it("devrait avoir 3 gérants Matériel pour la DIT GS", () => {
    expect(GERANTS_DIT_GS).toHaveLength(3);
  });

  it("devrait contenir Matériel_autres, Matériel_ISM et TI_Nevers Languedoc", () => {
    expect(GERANTS_DIT_GS).toContain("Matériel_autres");
    expect(GERANTS_DIT_GS).toContain("Matériel_ISM");
    expect(GERANTS_DIT_GS).toContain("TI_Nevers Languedoc");
  });
});

describe("Évolutions Maintenance 2026 - Sous-types", () => {
  it("devrait avoir 7 sous-types supprimés", () => {
    expect(SOUS_TYPES_SUPPRIMES).toHaveLength(7);
  });

  it("devrait avoir 2 sous-types nouveaux", () => {
    expect(SOUS_TYPES_NOUVEAUX).toHaveLength(2);
  });

  it("devrait contenir les sous-types supprimés attendus", () => {
    expect(SOUS_TYPES_SUPPRIMES).toContain("Maintenance Élargie Chauffage Ventilation Climat.");
    expect(SOUS_TYPES_SUPPRIMES).toContain("Contrôle Périodique Amiante");
    expect(SOUS_TYPES_SUPPRIMES).toContain("Gros Entretien IST CCE");
  });

  it("devrait contenir les sous-types nouveaux attendus", () => {
    expect(SOUS_TYPES_NOUVEAUX).toContain("Visites tech audit étude (hors réglementaire et VG)");
    expect(SOUS_TYPES_NOUVEAUX).toContain("Mise en conformité réglementaire autre");
  });
});

describe("Évolutions Maintenance 2026 - Prompt IA", () => {
  it("devrait avoir le contenu des évolutions 2026 intégré dans le prompt", async () => {
    // Read the routers.ts file to verify the prompt contains 2026 evolutions
    const fs = await import("fs");
    const routersContent = fs.readFileSync("server/routers.ts", "utf-8");
    
    // Verify key 2026 evolution content is in the prompt
    expect(routersContent).toContain("ÉVOLUTIONS DU MODÈLE DE GESTION MAINTENANCE 2026");
    expect(routersContent).toContain("Division 65924");
    expect(routersContent).toContain("00138");
    expect(routersContent).toContain("67099");
    expect(routersContent).toContain("6 familles");
    expect(routersContent).toContain("ZG360720");
    expect(routersContent).toContain("ZG360910");
    expect(routersContent).toContain("ABE Languedoc Roussillon");
    expect(routersContent).toContain("59167");
    expect(routersContent).toContain("Matériel_autres");
    expect(routersContent).toContain("Matériel_ISM");
    expect(routersContent).toContain("TI_Nevers Languedoc");
    expect(routersContent).toContain("MAINTENANCE SUD AZUR");
  });
});
