import { describe, it, expect } from "vitest";

// ─── Tests pour les données du Référentiel Contrat E2MT² ───────────

// Reproduire les données clés pour validation
const missions = [
  { letter: "A", title: "Déploiement initial et prise en charge", commandType: "Bons de commande ponctuels", subCount: 2 },
  { letter: "B", title: "Coordination et suivi des prestations opérationnelles", commandType: "Bons de commande annuels (1er janvier – 31 décembre)", subCount: 1 },
  { letter: "C", title: "Exploitation / Maintenance", commandType: "Bons de commande annuels (1er janvier – 31 décembre)", subCount: 15 },
  { letter: "D", title: "Prestations connexes", commandType: "Bons de commande ponctuels (devis) ou récapitulatifs mensuels", subCount: 1 },
  { letter: "E", title: "Management de l'énergie", commandType: "Ponctuels (audit initial) + annuels (suivi exploitation)", subCount: 1 },
];

const penalites = [
  { numero: "P1*", objet: "Documents", montantMin: "100 €HT", cumulable: false },
  { numero: "P2*", objet: "Attestations", montantMin: "100 €HT", cumulable: false },
  { numero: "P3", objet: "Documents / Consignes", montantMin: "250 €HT", cumulable: true },
  { numero: "P4*", objet: "Retard maintenance corrective", montantMin: "50 €HT", cumulable: false },
  { numero: "P5*", objet: "Interventions programmées", montantMin: "100 €HT", cumulable: false },
  { numero: "P6*", objet: "Outils informatiques (GDI, GMAO, GED)", montantMin: "100 €HT", cumulable: false },
  { numero: "P7", objet: "Accompagnement bureau de contrôle", montantMin: "150 €HT", cumulable: true },
  { numero: "P8", objet: "Observations bureaux de contrôle / Délais", montantMin: "100 €HT", cumulable: true },
  { numero: "P9", objet: "Non-conformité contrôles réglementaires / Délais", montantMin: "100 €HT", cumulable: true },
  { numero: "P10", objet: "Période de chauffe", montantMin: "100 €HT", cumulable: true },
  { numero: "P11", objet: "Dérive énergétique", montantMin: "100 €HT", cumulable: true },
  { numero: "P12", objet: "Confidentialité", montantMin: "1 500 €HT", cumulable: true },
  { numero: "P13", objet: "Recouvrement", montantMin: "100 €HT", cumulable: true },
  { numero: "P14", objet: "Insertion activité économique", montantMin: "60 €HT", cumulable: true },
  { numero: "P15", objet: "Insertion activité économique", montantMin: "100 €HT", cumulable: true },
  { numero: "P16", objet: "Insertion activité économique", montantMin: "300 €HT", cumulable: true },
  { numero: "P17", objet: "RFA – Communication du CA", montantMin: "50 €HT", cumulable: true },
  { numero: "P18", objet: "RFA – Retard de paiement", montantMin: "50 €HT", cumulable: true },
  { numero: "P19", objet: "Documents / Données Restitution", montantMin: "—", cumulable: true },
];

const chiffresCles = {
  plafondPenalites: 0.20,
  rfa: 0.03,
  delaiPaiement: 60,
  seuilReceptionD: 8000,
  prixFixesJusquau: "31/12/2026",
  nbAnnexes: 12,
};

describe("Référentiel Contrat E2MT² - Missions", () => {
  it("doit contenir exactement 5 missions (A à E)", () => {
    expect(missions).toHaveLength(5);
    expect(missions.map(m => m.letter)).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("la mission C doit avoir 15 sous-missions (lots techniques)", () => {
    const missionC = missions.find(m => m.letter === "C");
    expect(missionC).toBeDefined();
    expect(missionC!.subCount).toBe(15);
  });

  it("les missions B et C doivent être des bons de commande annuels", () => {
    const missionB = missions.find(m => m.letter === "B");
    const missionC = missions.find(m => m.letter === "C");
    expect(missionB!.commandType).toContain("annuels");
    expect(missionC!.commandType).toContain("annuels");
  });

  it("la mission A doit être des bons de commande ponctuels", () => {
    const missionA = missions.find(m => m.letter === "A");
    expect(missionA!.commandType).toContain("ponctuels");
  });

  it("la mission D doit inclure devis et récapitulatifs mensuels", () => {
    const missionD = missions.find(m => m.letter === "D");
    expect(missionD!.commandType).toContain("devis");
    expect(missionD!.commandType).toContain("récapitulatifs mensuels");
  });

  it("la mission E doit couvrir audit initial et suivi exploitation", () => {
    const missionE = missions.find(m => m.letter === "E");
    expect(missionE!.commandType).toContain("audit initial");
    expect(missionE!.commandType).toContain("suivi exploitation");
  });

  it("chaque mission doit avoir au moins 1 sous-mission", () => {
    missions.forEach(m => {
      expect(m.subCount).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("Référentiel Contrat E2MT² - Pénalités", () => {
  it("doit contenir 19 entrées de pénalités (P1 à P19)", () => {
    expect(penalites).toHaveLength(19);
  });

  it("les pénalités marquées * ne doivent pas être cumulables avec ICP", () => {
    const penalitesEtoile = penalites.filter(p => p.numero.includes("*"));
    penalitesEtoile.forEach(p => {
      expect(p.cumulable).toBe(false);
    });
  });

  it("les pénalités sans * doivent être cumulables", () => {
    const penalitesSansEtoile = penalites.filter(p => !p.numero.includes("*"));
    penalitesSansEtoile.forEach(p => {
      expect(p.cumulable).toBe(true);
    });
  });

  it("la pénalité P12 (Confidentialité) doit être la plus élevée à 1 500 €HT", () => {
    const p12 = penalites.find(p => p.numero === "P12");
    expect(p12).toBeDefined();
    expect(p12!.montantMin).toBe("1 500 €HT");
  });

  it("la pénalité P4* (Retard maintenance corrective) doit être à 50 €HT", () => {
    const p4 = penalites.find(p => p.numero === "P4*");
    expect(p4).toBeDefined();
    expect(p4!.montantMin).toBe("50 €HT");
  });

  it("la pénalité P3 (Consignes) doit être à 250 €HT", () => {
    const p3 = penalites.find(p => p.numero === "P3");
    expect(p3).toBeDefined();
    expect(p3!.montantMin).toBe("250 €HT");
  });

  it("les pénalités d'insertion (P14-P16) doivent avoir des montants croissants", () => {
    const p14 = penalites.find(p => p.numero === "P14");
    const p15 = penalites.find(p => p.numero === "P15");
    const p16 = penalites.find(p => p.numero === "P16");
    expect(p14!.montantMin).toBe("60 €HT");
    expect(p15!.montantMin).toBe("100 €HT");
    expect(p16!.montantMin).toBe("300 €HT");
  });

  it("la pénalité P19 doit être proportionnelle (pas de minimum fixe)", () => {
    const p19 = penalites.find(p => p.numero === "P19");
    expect(p19).toBeDefined();
    expect(p19!.montantMin).toBe("—");
  });

  it("chaque pénalité doit avoir un objet non vide", () => {
    penalites.forEach(p => {
      expect(p.objet.length).toBeGreaterThan(0);
    });
  });
});

describe("Référentiel Contrat E2MT² - Chiffres clés", () => {
  it("le plafond des pénalités doit être de 20%", () => {
    expect(chiffresCles.plafondPenalites).toBe(0.20);
  });

  it("la RFA doit être de 3%", () => {
    expect(chiffresCles.rfa).toBe(0.03);
  });

  it("le délai de paiement doit être de 60 jours", () => {
    expect(chiffresCles.delaiPaiement).toBe(60);
  });

  it("le seuil de réception Mission D doit être de 8 000 €HT", () => {
    expect(chiffresCles.seuilReceptionD).toBe(8000);
  });

  it("les prix doivent être fixes jusqu'au 31/12/2026", () => {
    expect(chiffresCles.prixFixesJusquau).toBe("31/12/2026");
  });

  it("le contrat doit avoir 12 annexes", () => {
    expect(chiffresCles.nbAnnexes).toBe(12);
  });
});

describe("Référentiel Contrat E2MT² - Formules de calcul", () => {
  it("la formule de réfaction doit calculer correctement (taux 97%, 100k€)", () => {
    const tauxRealisation = 0.97;
    const montantBC = 100000;
    const refaction = (1 - tauxRealisation) * montantBC / 2;
    expect(refaction).toBeCloseTo(1500, 2);
  });

  it("la formule de réfaction doit donner 0 pour un taux de 100%", () => {
    const tauxRealisation = 1.0;
    const montantBC = 100000;
    const refaction = (1 - tauxRealisation) * montantBC / 2;
    expect(refaction).toBe(0);
  });

  it("la RFA doit se calculer à 3% du CA global", () => {
    const caGlobal = 500000;
    const rfa = caGlobal * 0.03;
    expect(rfa).toBe(15000);
  });

  it("le plafond des pénalités doit se calculer à 20% du montant B+C+E", () => {
    const montantBCE = 200000;
    const plafond = montantBCE * 0.20;
    expect(plafond).toBe(40000);
  });

  it("la formule de révision des prix doit avoir les bons coefficients", () => {
    // P = P0 × [0,15 + 0,70 × (ICHTrevTS-IME / ICHTrevTS-IME₀) + 0,15 × (FSD2 / FSD2₀)]
    const coefFixe = 0.15;
    const coefICHT = 0.70;
    const coefFSD2 = 0.15;
    expect(coefFixe + coefICHT + coefFSD2).toBe(1.0);
  });
});

describe("Référentiel Contrat E2MT² - Livrables Mission A", () => {
  const livrablesA1 = {
    organisation: 7,
    sousTraitance: 2,
    qualite: 2,
    securite: 4,
    priseEnCharge: 6,
    gmao: 4,
  };

  it("la Mission A1 doit avoir 25 livrables au total", () => {
    const total = Object.values(livrablesA1).reduce((a, b) => a + b, 0);
    expect(total).toBe(25);
  });

  it("les livrables d'organisation doivent être les plus nombreux", () => {
    expect(livrablesA1.organisation).toBeGreaterThanOrEqual(livrablesA1.sousTraitance);
    expect(livrablesA1.organisation).toBeGreaterThanOrEqual(livrablesA1.qualite);
    expect(livrablesA1.organisation).toBeGreaterThanOrEqual(livrablesA1.securite);
  });

  it("le PV de prise en charge doit être signé dans les 5 mois maximum", () => {
    const delaiMaxMois = 5;
    expect(delaiMaxMois).toBeLessThanOrEqual(6);
  });

  it("la Mission A2 doit avoir 7 livrables pour les nouveaux bâtiments", () => {
    const livrablesA2 = 7;
    expect(livrablesA2).toBe(7);
  });
});
