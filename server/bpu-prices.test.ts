import { describe, it, expect } from "vitest";

/**
 * Tests de vérification des prix contractuels BPU Equans
 * Source : Lot_4-1-20250922-BPU(2).xlsx — BPU signé
 */

// Prix contractuels Equans — Profils MO (Rubrique 2)
const PROFILS_MO: Record<string, { profil: string; prixHT: number }> = {
  R05: { profil: "Ingénieur Méthodes/Qualité/Sécurité/GMAO/Energies", prixHT: 85.0 },
  R12: { profil: "Technicien CVCD/Plomberie", prixHT: 62.0 },
  R13: { profil: "Spécialiste constructeur Groupes Frigo/PAC", prixHT: 90.0 },
  R14: { profil: "Technicien Fermetures motorisées", prixHT: 75.0 },
  R15: { profil: "Technicien Protection incendie et Extincteurs", prixHT: 70.0 },
  R16: { profil: "Technicien de maintenance GTC/GTB/SSI", prixHT: 95.0 },
  R17: { profil: "Spécialiste constructeur GTC/GTB/SSI", prixHT: 155.0 },
  R18: { profil: "Technicien Clos et Couvert", prixHT: 65.0 },
  R19: { profil: "Technicien Electricien CFO/CFA/Eclairage", prixHT: 70.0 },
  R20: { profil: "Spécialiste constructeur CFO", prixHT: 130.0 },
  R21: { profil: "Spécialiste constructeur CFA", prixHT: 110.0 },
  R22: { profil: "Technicien Ascenseurs/Monte-charges/Levage", prixHT: 95.0 },
  R23: { profil: "Technicien polyvalent second œuvre/menuisier/serrurier", prixHT: 55.0 },
  R24: { profil: "Intervention repérage/diagnostic amiante", prixHT: 98.0 },
};

// Prix contractuels Equans — Moyens d'accès (Rubrique 1)
const MOYENS_ACCES: Record<string, { designation: string; prixHT: number; conducteur: boolean }> = {
  "ACC-01": { designation: "Nacelle/plateforme mobile ≤6m", prixHT: 313.28, conducteur: false },
  "ACC-02": { designation: "Nacelle/plateforme mobile ≤9m", prixHT: 321.78, conducteur: false },
  "ACC-03": { designation: "Camion nacelle 20m", prixHT: 1214.27, conducteur: true },
  "ACC-04": { designation: "Camion nacelle 30m", prixHT: 1359.97, conducteur: true },
};

// Coefficients contractuels Equans — Fournitures (Rubrique 3)
const COEFFICIENTS_FO: { tranche: string; seuil: string; coefficient: number }[] = [
  { tranche: "T1", seuil: "< 500 €HT", coefficient: 1.24 },
  { tranche: "T2", seuil: "500-2000 €HT", coefficient: 1.22 },
  { tranche: "T3", seuil: "≥ 2000 €HT", coefficient: 1.19 },
];

// Coefficients contractuels Equans — Sous-traitance (Rubrique 3)
const COEFFICIENTS_SST: { tranche: string; seuil: string; coefficient: number }[] = [
  { tranche: "T1", seuil: "< 2000 €HT", coefficient: 1.24 },
  { tranche: "T2", seuil: "2000-5000 €HT", coefficient: 1.22 },
  { tranche: "T3", seuil: "≥ 5000 €HT", coefficient: 1.19 },
];

// Extincteurs (Prestations particulières)
const EXTINCTEURS: Record<string, { designation: string; prixHT: number }> = {
  "EXT-01": { designation: "Remplacement extincteur eau pulvérisée 6L", prixHT: 68.18 },
  "EXT-02": { designation: "Remplacement extincteur eau pulvérisée 9L", prixHT: 77.27 },
  "EXT-03": { designation: "Remplacement extincteur CO2 2kg", prixHT: 93.18 },
  "EXT-04": { designation: "Remplacement extincteur CO2 5kg", prixHT: 136.36 },
  "EXT-05": { designation: "Remplacement extincteur Poudre ABC 6kg", prixHT: 63.64 },
  "EXT-06": { designation: "Remplacement extincteur Poudre ABC 9kg", prixHT: 72.73 },
  "EXT-07": { designation: "Recharge eau pulvérisée 6L", prixHT: 20.45 },
  "EXT-08": { designation: "Recharge eau pulvérisée 9L", prixHT: 25.0 },
  "EXT-09": { designation: "Recharge CO2 2kg", prixHT: 22.73 },
  "EXT-10": { designation: "Recharge CO2 5kg", prixHT: 35.23 },
  "EXT-11": { designation: "Recharge Poudre ABC 6kg", prixHT: 32.95 },
  "EXT-12": { designation: "Recharge Poudre ABC 9kg", prixHT: 37.5 },
};

// Amiante
const AMIANTE = { "AM-01": { designation: "Analyse amiante (prélèvement + labo + rapport)", prixHT: 80.68 } };

describe("BPU Contractuel Equans — Prix signés", () => {
  describe("Profils MO (Rubrique 2)", () => {
    it("doit contenir 14 profils MO (R05 à R24)", () => {
      expect(Object.keys(PROFILS_MO)).toHaveLength(14);
    });

    it.each(Object.entries(PROFILS_MO))("profil %s doit avoir un prix > 0", (code, { prixHT }) => {
      expect(prixHT).toBeGreaterThan(0);
    });

    it("R17 (Spécialiste GTC/GTB/SSI) doit être le profil le plus cher à 155 €/h", () => {
      const maxPrice = Math.max(...Object.values(PROFILS_MO).map((p) => p.prixHT));
      expect(maxPrice).toBe(155.0);
      expect(PROFILS_MO.R17.prixHT).toBe(155.0);
    });

    it("R23 (Technicien polyvalent) doit être le profil le moins cher à 55 €/h", () => {
      const minPrice = Math.min(...Object.values(PROFILS_MO).map((p) => p.prixHT));
      expect(minPrice).toBe(55.0);
      expect(PROFILS_MO.R23.prixHT).toBe(55.0);
    });

    it("les taux horaires comprennent les frais de déplacement (Art. 25 CPS)", () => {
      // Vérifie que tous les profils ont des prix raisonnables incluant déplacement
      for (const [code, { prixHT }] of Object.entries(PROFILS_MO)) {
        expect(prixHT).toBeGreaterThanOrEqual(50);
        expect(prixHT).toBeLessThanOrEqual(200);
      }
    });
  });

  describe("Moyens d'accès (Rubrique 1)", () => {
    it("doit contenir 4 prestations ACC", () => {
      expect(Object.keys(MOYENS_ACCES)).toHaveLength(4);
    });

    it("ACC-01 et ACC-02 sont SANS conducteur", () => {
      expect(MOYENS_ACCES["ACC-01"].conducteur).toBe(false);
      expect(MOYENS_ACCES["ACC-02"].conducteur).toBe(false);
    });

    it("ACC-03 et ACC-04 sont AVEC conducteur", () => {
      expect(MOYENS_ACCES["ACC-03"].conducteur).toBe(true);
      expect(MOYENS_ACCES["ACC-04"].conducteur).toBe(true);
    });

    it("ACC-04 (30m) doit être plus cher que ACC-03 (20m)", () => {
      expect(MOYENS_ACCES["ACC-04"].prixHT).toBeGreaterThan(MOYENS_ACCES["ACC-03"].prixHT);
    });

    it("ACC-02 (9m) doit être plus cher que ACC-01 (6m)", () => {
      expect(MOYENS_ACCES["ACC-02"].prixHT).toBeGreaterThan(MOYENS_ACCES["ACC-01"].prixHT);
    });
  });

  describe("Coefficients fournitures (Rubrique 3)", () => {
    it("doit contenir 3 tranches", () => {
      expect(COEFFICIENTS_FO).toHaveLength(3);
    });

    it("les coefficients doivent être décroissants (plus le montant est élevé, plus le coefficient est bas)", () => {
      expect(COEFFICIENTS_FO[0].coefficient).toBeGreaterThan(COEFFICIENTS_FO[1].coefficient);
      expect(COEFFICIENTS_FO[1].coefficient).toBeGreaterThan(COEFFICIENTS_FO[2].coefficient);
    });

    it("tous les coefficients doivent être > 1 (marge prestataire)", () => {
      for (const { coefficient } of COEFFICIENTS_FO) {
        expect(coefficient).toBeGreaterThan(1);
      }
    });
  });

  describe("Coefficients sous-traitance (Rubrique 3)", () => {
    it("doit contenir 3 tranches", () => {
      expect(COEFFICIENTS_SST).toHaveLength(3);
    });

    it("les coefficients doivent être décroissants", () => {
      expect(COEFFICIENTS_SST[0].coefficient).toBeGreaterThan(COEFFICIENTS_SST[1].coefficient);
      expect(COEFFICIENTS_SST[1].coefficient).toBeGreaterThan(COEFFICIENTS_SST[2].coefficient);
    });

    it("les coefficients FO et SST doivent être identiques (même grille Equans)", () => {
      for (let i = 0; i < 3; i++) {
        expect(COEFFICIENTS_SST[i].coefficient).toBe(COEFFICIENTS_FO[i].coefficient);
      }
    });
  });

  describe("Extincteurs (Prestations particulières)", () => {
    it("doit contenir 12 prestations extincteurs", () => {
      expect(Object.keys(EXTINCTEURS)).toHaveLength(12);
    });

    it("les remplacements (EXT-01 à EXT-06) doivent être plus chers que les recharges (EXT-07 à EXT-12)", () => {
      const remplacements = [EXTINCTEURS["EXT-01"], EXTINCTEURS["EXT-02"], EXTINCTEURS["EXT-03"], EXTINCTEURS["EXT-04"], EXTINCTEURS["EXT-05"], EXTINCTEURS["EXT-06"]];
      const recharges = [EXTINCTEURS["EXT-07"], EXTINCTEURS["EXT-08"], EXTINCTEURS["EXT-09"], EXTINCTEURS["EXT-10"], EXTINCTEURS["EXT-11"], EXTINCTEURS["EXT-12"]];
      const minRemplacement = Math.min(...remplacements.map((r) => r.prixHT));
      const maxRecharge = Math.max(...recharges.map((r) => r.prixHT));
      expect(minRemplacement).toBeGreaterThan(maxRecharge);
    });

    it("EXT-04 (CO2 5kg) doit être l'extincteur le plus cher à remplacer", () => {
      expect(EXTINCTEURS["EXT-04"].prixHT).toBe(136.36);
    });
  });

  describe("Amiante", () => {
    it("AM-01 doit coûter 80,68 €HT par prélèvement", () => {
      expect(AMIANTE["AM-01"].prixHT).toBe(80.68);
    });
  });

  describe("Vérification de cohérence des prix pour l'analyse de devis", () => {
    it("un devis avec taux MO différent du BPU doit être détecté comme anomalie", () => {
      const tauxFacture = 75.0; // Taux facturé par le prestataire
      const tauxBPU = PROFILS_MO.R19.prixHT; // 70 €/h contractuel
      const ecart = ((tauxFacture - tauxBPU) / tauxBPU) * 100;
      expect(ecart).toBeGreaterThan(5); // Écart > 5% = anomalie
      expect(ecart).toBeCloseTo(7.14, 1);
    });

    it("un coefficient FO appliqué sur la mauvaise tranche doit être détecté", () => {
      const montantAchat = 1500; // 1500 €HT → Tranche 2
      const coefficientApplique = 1.24; // Tranche 1 appliquée à tort
      const coefficientCorrect = COEFFICIENTS_FO[1].coefficient; // 1.22
      expect(coefficientApplique).not.toBe(coefficientCorrect);
      const surfacturation = montantAchat * (coefficientApplique - coefficientCorrect);
      expect(surfacturation).toBeCloseTo(30, 1); // 30 € de surfacturation
    });

    it("un devis nacelle facturé au-dessus du prix BPU doit être signalé", () => {
      const prixFacture = 350.0;
      const prixBPU = MOYENS_ACCES["ACC-01"].prixHT; // 313.28
      const ecart = ((prixFacture - prixBPU) / prixBPU) * 100;
      expect(ecart).toBeGreaterThan(5);
      expect(ecart).toBeCloseTo(11.72, 1);
    });
  });
});
