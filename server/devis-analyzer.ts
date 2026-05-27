/**
 * Analyseur de devis complet
 * Détermine : charge locataire/propriétaire (IMMO 104), nommage AT (PPT 2026), ventilation budgétaire
 */

export interface DevisInput {
  // Informations de base
  numeroDevis: string;
  dateDevis: Date;
  montantHT: number;
  montantTTC: number;
  
  // Localisation
  utCode: string;
  batimentNumero: string;
  batimentNom?: string;
  ville?: string;
  
  // Nature du travail
  typesTravaux: string[]; // ex: ["Toiture", "Étanchéité"]
  description: string;
  
  // Contexte immobilier
  typeConvention: "Intra SA" | "Inter SA" | "PABE"; // Convention locative
  saPropietaire: "SNCF" | "VOYAGEURS" | "RÉSEAU" | "FRET" | "Gares & Connexions";
  saOccupante?: "SNCF" | "VOYAGEURS" | "RÉSEAU" | "FRET" | "Gares & Connexions" | "Tiers";
  
  // Statut du bien
  estVacant?: boolean;
  estLocatif?: boolean;
  
  // Classification travaux
  estDesamiantage?: boolean;
  estMiseEnConformite?: boolean;
  estMaintenanceContractuelle?: boolean;
  estVisiteReglementaire?: boolean;
  estDiagnostic?: boolean;
}

export interface AnalyseDevis {
  // IMMO 104
  chargeImmo104: "Locataire" | "Propriétaire" | "Mixte";
  justificationImmo104: string;
  
  // PPT 2026
  familleButgetaire: "GER" | "MEC" | "CME" | "PTP" | "ML" | "TL" | "VR" | "DIAG";
  sousType: string;
  caractereBudgetaire: "Non négociable" | "Négociable" | "Mixte";
  
  // Nommage AT
  intituleAT: string;
  descriptionAT: string;
  
  // Ventilation
  montantPropietaire: number;
  montantLocataire: number;
  
  // Immosis
  immosisData: {
    utCode: string;
    batimentNumero: string;
    sousType: string;
    montant: number;
    description: string;
  };
  
  // Connect'Immo
  connectImmoData: {
    intitule: string;
    sousType: string;
    montantHT: number;
    montantTTC: number;
    utCode: string;
    batimentNumero: string;
  };
  
  // Alertes
  alertes: string[];
}

/**
 * Analyse complète d'un devis
 */
export function analyserDevis(input: DevisInput): AnalyseDevis {
  const alertes: string[] = [];
  
  // ===== ÉTAPE 1 : DÉTERMINER CHARGE IMMO 104 =====
  const { chargeImmo104, justificationImmo104 } = determinerChargeImmo104(input, alertes);
  
  // ===== ÉTAPE 2 : DÉTERMINER FAMILLE BUDGÉTAIRE PPT 2026 =====
  const { familleButgetaire, sousType, caractereBudgetaire } = determinerFamilleBudgetaire(input, alertes);
  
  // ===== ÉTAPE 3 : GÉNÉRER NOMMAGE AT =====
  const { intituleAT, descriptionAT } = genererNommageAT(input, familleButgetaire);
  
  // ===== ÉTAPE 4 : VENTILER LES MONTANTS =====
  const { montantPropietaire, montantLocataire } = ventilerMontants(input, chargeImmo104);
  
  // ===== ÉTAPE 5 : PRÉPARER DONNÉES IMMOSIS =====
  const immosisData = preparerImmosisData(input, sousType, montantPropietaire);
  
  // ===== ÉTAPE 6 : PRÉPARER DONNÉES CONNECT'IMMO =====
  const connectImmoData = preparerConnectImmoData(input, intituleAT, sousType);
  
  return {
    chargeImmo104,
    justificationImmo104,
    familleButgetaire,
    sousType,
    caractereBudgetaire,
    intituleAT,
    descriptionAT,
    montantPropietaire,
    montantLocataire,
    immosisData,
    connectImmoData,
    alertes,
  };
}

/**
 * Détermine si c'est charge locataire ou propriétaire (IMMO 104)
 */
function determinerChargeImmo104(input: DevisInput, alertes: string[]): { chargeImmo104: "Locataire" | "Propriétaire" | "Mixte"; justificationImmo104: string } {
  // Cas 1 : Bien vacant → Propriétaire
  if (input.estVacant) {
    return {
      chargeImmo104: "Propriétaire",
      justificationImmo104: "Bien vacant : charges incombent au propriétaire (IMMO 104 § 9.1.5)",
    };
  }
  
  // Cas 2 : Travaux de désamiantage → Propriétaire (gros entretien)
  if (input.estDesamiantage) {
    return {
      chargeImmo104: "Propriétaire",
      justificationImmo104: "Désamiantage = gros entretien propriétaire (IMMO 104 § 9.1)",
    };
  }
  
  // Cas 3 : Mise en conformité réglementaire → Propriétaire
  if (input.estMiseEnConformite) {
    return {
      chargeImmo104: "Propriétaire",
      justificationImmo104: "Mise en conformité réglementaire = charge propriétaire (IMMO 104 § 9.1)",
    };
  }
  
  // Cas 4 : Visites réglementaires obligatoires → Propriétaire
  if (input.estVisiteReglementaire) {
    return {
      chargeImmo104: "Propriétaire",
      justificationImmo104: "Visites réglementaires = charge propriétaire (IMMO 104 § 9.1)",
    };
  }
  
  // Cas 5 : Diagnostics → Propriétaire
  if (input.estDiagnostic) {
    return {
      chargeImmo104: "Propriétaire",
      justificationImmo104: "Diagnostics = charge propriétaire (IMMO 104 § 9.1)",
    };
  }
  
  // Cas 6 : Maintenance contractuelle E2MT → Locataire (mission C)
  if (input.estMaintenanceContractuelle) {
    return {
      chargeImmo104: "Locataire",
      justificationImmo104: "Maintenance contractuelle E2MT = charge locataire (IMMO 104 § 9.3, Missions C)",
    };
  }
  
  // Cas 7 : Travaux locatifs > 3 500€ → Locataire
  if (input.montantHT > 3500 && input.estLocatif) {
    return {
      chargeImmo104: "Locataire",
      justificationImmo104: "Travaux locatifs > 3 500€ = charge locataire (IMMO 104 § 9.3, TL)",
    };
  }
  
  // Cas 8 : Entretien courant locatif ≤ 3 500€ → Locataire
  if (input.montantHT <= 3500 && input.estLocatif) {
    return {
      chargeImmo104: "Locataire",
      justificationImmo104: "Entretien locatif courant ≤ 3 500€ = charge locataire (IMMO 104 § 9.3, PTP)",
    };
  }
  
  // Cas 9 : Gros entretien > 3 500€ (hors désamiantage) → Propriétaire (30% refacturé)
  if (input.montantHT > 3500 && !input.estLocatif) {
    alertes.push("⚠️ Gros entretien : 30% du loyer nu peut être refacturé au locataire (IMMO 104 § 9.2.2)");
    return {
      chargeImmo104: "Mixte",
      justificationImmo104: "Gros entretien propriétaire : 30% peut être refacturisé au locataire (IMMO 104 § 9.2.2)",
    };
  }
  
  // Défaut : Propriétaire
  alertes.push("⚠️ Classification par défaut : Propriétaire. À vérifier selon contexte exact.");
  return {
    chargeImmo104: "Propriétaire",
    justificationImmo104: "Classification par défaut (à valider selon contexte exact)",
  };
}

/**
 * Détermine la famille budgétaire PPT 2026
 */
function determinerFamilleBudgetaire(input: DevisInput, alertes: string[]): { familleButgetaire: "GER" | "MEC" | "CME" | "PTP" | "ML" | "TL" | "VR" | "DIAG"; sousType: string; caractereBudgetaire: "Non négociable" | "Négociable" | "Mixte" } {
  // VR : Visites réglementaires
  if (input.estVisiteReglementaire) {
    return {
      familleButgetaire: "VR",
      sousType: "Vérifications Réglementaires",
      caractereBudgetaire: "Non négociable",
    };
  }
  
  // DIAG : Diagnostics
  if (input.estDiagnostic) {
    return {
      familleButgetaire: "DIAG",
      sousType: "Diagnostic Amiante",
      caractereBudgetaire: "Négociable",
    };
  }
  
  // MEC : Mise en conformité
  if (input.estMiseEnConformite) {
    return {
      familleButgetaire: "MEC",
      sousType: "Mise en conformité réglementaires autres",
      caractereBudgetaire: "Mixte",
    };
  }
  
  // CME : Contrats de maintenance
  if (input.estMaintenanceContractuelle) {
    return {
      familleButgetaire: "CME",
      sousType: "Contrats de Maintenance Externe",
      caractereBudgetaire: "Mixte",
    };
  }
  
  // GER : Gros entretien > 3 500€
  if (input.montantHT > 3500 && input.estDesamiantage) {
    return {
      familleButgetaire: "GER",
      sousType: "Travaux de Désamiantage",
      caractereBudgetaire: "Non négociable",
    };
  }
  
  if (input.montantHT > 3500 && !input.estLocatif && !input.estMiseEnConformite) {
    return {
      familleButgetaire: "GER",
      sousType: "Gros entretien et réparation GER",
      caractereBudgetaire: "Non négociable",
    };
  }
  
  // TL : Travaux locatifs > 3 500€
  if (input.montantHT > 3500 && input.estLocatif) {
    return {
      familleButgetaire: "TL",
      sousType: "Travaux Locatifs",
      caractereBudgetaire: "Mixte",
    };
  }
  
  // ML : Maintenance locative (entretien courant)
  if (input.estLocatif && input.montantHT <= 3500) {
    return {
      familleButgetaire: "ML",
      sousType: "Maintenance Locative",
      caractereBudgetaire: "Mixte",
    };
  }
  
  // PTP : Petits travaux propriétaire ≤ 3 500€
  if (input.montantHT <= 3500) {
    return {
      familleButgetaire: "PTP",
      sousType: "Contrats Petits Travaux du Propriétaire",
      caractereBudgetaire: "Négociable",
    };
  }
  
  // Défaut
  alertes.push("⚠️ Famille budgétaire par défaut : PTP. À vérifier.");
  return {
    familleButgetaire: "PTP",
    sousType: "Contrats Petits Travaux du Propriétaire",
    caractereBudgetaire: "Négociable",
  };
}

/**
 * Génère le nommage correct de l'AT
 */
function genererNommageAT(input: DevisInput, famille: string): { intituleAT: string; descriptionAT: string } {
  const typesTravaux = input.typesTravaux.join(" + ");
  const localisationBase = `UT ${input.utCode} - Bâtiment ${input.batimentNumero}`;
  const localisationComplete = input.ville ? `${localisationBase} - ${input.ville}` : localisationBase;
  
  // Construire intitulé explicite
  let intitule = "";
  
  if (input.estDesamiantage) {
    intitule = `Désamiantage - ${localisationComplete}`;
  } else if (input.estMiseEnConformite) {
    intitule = `Mise en conformité ${typesTravaux} - ${localisationComplete}`;
  } else if (input.estVisiteReglementaire) {
    intitule = `Visite réglementaire ${typesTravaux} - ${localisationComplete}`;
  } else if (input.estDiagnostic) {
    intitule = `Diagnostic ${typesTravaux} - ${localisationComplete}`;
  } else if (input.estMaintenanceContractuelle) {
    intitule = `Maintenance contractuelle ${typesTravaux} - ${localisationComplete}`;
  } else if (input.montantHT > 3500) {
    intitule = `Travaux ${typesTravaux} - ${localisationComplete}`;
  } else {
    intitule = `${typesTravaux} - ${localisationComplete}`;
  }
  
  return {
    intituleAT: intitule,
    descriptionAT: input.description,
  };
}

/**
 * Ventile les montants entre propriétaire et locataire
 */
function ventilerMontants(input: DevisInput, charge: string): { montantPropietaire: number; montantLocataire: number } {
  if (charge === "Propriétaire") {
    return {
      montantPropietaire: input.montantHT,
      montantLocataire: 0,
    };
  }
  
  if (charge === "Locataire") {
    return {
      montantPropietaire: 0,
      montantLocataire: input.montantHT,
    };
  }
  
  // Mixte : 30% locataire (refacturable), 70% propriétaire
  return {
    montantPropietaire: input.montantHT * 0.7,
    montantLocataire: input.montantHT * 0.3,
  };
}

/**
 * Prépare les données pour Immosis
 */
function preparerImmosisData(input: DevisInput, sousType: string, montant: number) {
  return {
    utCode: input.utCode,
    batimentNumero: input.batimentNumero,
    sousType,
    montant,
    description: input.description,
  };
}

/**
 * Prépare les données pour Connect'Immo
 */
function preparerConnectImmoData(input: DevisInput, intitule: string, sousType: string) {
  return {
    intitule,
    sousType,
    montantHT: input.montantHT,
    montantTTC: input.montantTTC,
    utCode: input.utCode,
    batimentNumero: input.batimentNumero,
  };
}
