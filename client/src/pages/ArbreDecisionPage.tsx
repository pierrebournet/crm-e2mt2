import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TreePine,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Send,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// Types
interface Question {
  id: string;
  text: string;
  helpText?: string;
  options: Option[];
}

interface Option {
  label: string;
  value: string;
  nextQuestion?: string;
  result?: DecisionResult;
  badge?: "info" | "warning" | "success" | "destructive";
}

interface DecisionResult {
  mission: "C" | "D";
  missionLabel: string;
  chargeType: "locataire" | "proprietaire" | "mixte";
  chargeLabel: string;
  sousType: string;
  sousTypeCode: string;
  natureTravauxSuggestions: string[];
  famillebudgetaire: string;
  codeZG: string;
  moFacturable: boolean;
  moExplication: string;
  recommandations: string[];
}

// Arbre de décision basé sur Q1-Q8
const questions: Record<string, Question> = {
  q1: {
    id: "q1",
    text: "L'intervention fait-elle suite à un acte de vandalisme ?",
    helpText: "Dégradation volontaire par un tiers (graffiti, bris de vitre, effraction...)",
    options: [
      { label: "Oui", value: "oui", nextQuestion: "q1_vandalisme" },
      { label: "Non", value: "non", nextQuestion: "q2" },
    ],
  },
  q1_vandalisme: {
    id: "q1_vandalisme",
    text: "Le vandalisme est-il couvert par l'assurance du propriétaire ?",
    helpText: "Vérifier si le sinistre a été déclaré et pris en charge par l'assurance SNCF Immobilier",
    options: [
      {
        label: "Oui (assurance propriétaire)",
        value: "oui",
        result: {
          mission: "D",
          missionLabel: "Mission D — Travaux correctifs (vandalisme assuré)",
          chargeType: "proprietaire",
          chargeLabel: "Charge Propriétaire (assurance)",
          sousType: "Gros Entretiens",
          sousTypeCode: "GE",
          natureTravauxSuggestions: ["Selon corps d'état concerné (Clos, BT, Aménagement intérieur...)"],
          famillebudgetaire: "GER",
          codeZG: "ZG360910",
          moFacturable: true,
          moExplication: "MO facturable car Mission D (travaux correctifs)",
          recommandations: [
            "Joindre le PV de constat / dépôt de plainte",
            "Vérifier la déclaration de sinistre auprès de l'assurance",
            "Mentionner le n° de sinistre dans l'intitulé AT",
          ],
        },
      },
      {
        label: "Non (charge locataire)",
        value: "non",
        result: {
          mission: "D",
          missionLabel: "Mission D — Travaux correctifs (vandalisme non assuré)",
          chargeType: "locataire",
          chargeLabel: "Charge Locataire",
          sousType: "Maintenance Locative",
          sousTypeCode: "ML",
          natureTravauxSuggestions: ["Selon corps d'état concerné"],
          famillebudgetaire: "ML",
          codeZG: "ZG361599",
          moFacturable: true,
          moExplication: "MO facturable car Mission D (travaux correctifs)",
          recommandations: [
            "Facturer au locataire (SA occupante)",
            "Joindre le PV de constat si disponible",
          ],
        },
      },
    ],
  },
  q2: {
    id: "q2",
    text: "L'intervention vise-t-elle une mise en conformité réglementaire ?",
    helpText: "Suite à un rapport de bureau de contrôle, VRE, audit incendie, accessibilité PMR...",
    options: [
      { label: "Oui", value: "oui", nextQuestion: "q2_type_mec" },
      { label: "Non", value: "non", nextQuestion: "q3" },
    ],
  },
  q2_type_mec: {
    id: "q2_type_mec",
    text: "Quel type de mise en conformité ?",
    helpText: "Distinguer les MEC électriques des autres types",
    options: [
      {
        label: "MEC Électrique (suite VRE ou MPS)",
        value: "elec",
        result: {
          mission: "D",
          missionLabel: "Mission D — Mise en conformité électrique",
          chargeType: "proprietaire",
          chargeLabel: "Charge Propriétaire",
          sousType: "Mise en conformité énergie électrique",
          sousTypeCode: "MEC_EE",
          natureTravauxSuggestions: ["Eclairage et installations électriques BT", "Distribution HT et MT"],
          famillebudgetaire: "MEC",
          codeZG: "ZG361040",
          moFacturable: true,
          moExplication: "MO facturable car Mission D (travaux correctifs)",
          recommandations: [
            "Joindre le rapport VRE ou MPS ayant identifié la non-conformité",
            "Référencer le n° d'observation du bureau de contrôle",
            "Vérifier le délai de levée de réserve",
          ],
        },
      },
      {
        label: "MEC Autre (incendie, ascenseur, chauffage...)",
        value: "autre",
        result: {
          mission: "D",
          missionLabel: "Mission D — Mise en conformité réglementaire autre",
          chargeType: "proprietaire",
          chargeLabel: "Charge Propriétaire",
          sousType: "Mise en conformité réglementaire autre",
          sousTypeCode: "RAU",
          natureTravauxSuggestions: [
            "Equipements de sécurité incendie",
            "Accessibilité (Asc, escalier méca)",
            "Installations chauffage, ventil. climatisation",
          ],
          famillebudgetaire: "MEC",
          codeZG: "ZG361040",
          moFacturable: true,
          moExplication: "MO facturable car Mission D (travaux correctifs)",
          recommandations: [
            "Joindre le rapport du bureau de contrôle",
            "Identifier le type de non-conformité (incendie, accessibilité, thermique...)",
            "Vérifier le délai réglementaire de mise en conformité",
          ],
        },
      },
    ],
  },
  q3: {
    id: "q3",
    text: "L'intervention concerne-t-elle un équipement de niveau 5 (remplacement complet) ?",
    helpText: "Niveau 5 = rénovation, reconstruction, remplacement complet d'un équipement ou système. Ex: remplacement chaudière, réfection toiture complète, changement tableau électrique",
    options: [
      {
        label: "Oui (niveau 5 — remplacement complet)",
        value: "oui",
        nextQuestion: "q3_batiment_type",
      },
      { label: "Non (niveaux 1 à 4)", value: "non", nextQuestion: "q4" },
    ],
  },
  q3_batiment_type: {
    id: "q3_batiment_type",
    text: "Le bâtiment est-il un ouvrage d'art, une grande halle ou un bâtiment non courant (BNC) ?",
    helpText: "BNC = bâtiments atypiques : ouvrages d'art (ponts, tunnels, viaducs), grandes halles industrielles, bâtiments classés, structures exceptionnelles nécessitant des compétences spécifiques",
    options: [
      {
        label: "Oui (Bâtiment Non Courant — ouvrage d'art, grande halle, structure atypique)",
        value: "oui",
        result: {
          mission: "D",
          missionLabel: "Mission D — Remplacement complet sur Bâtiment Non Courant (BNC)",
          chargeType: "proprietaire",
          chargeLabel: "Charge Propriétaire",
          sousType: "Visite technique Gros Bâtiments Non Courants",
          sousTypeCode: "VTR G BNC",
          natureTravauxSuggestions: ["Structure", "Couvert", "Clos", "Selon corps d'état principal concerné"],
          famillebudgetaire: "GER",
          codeZG: "ZG360910",
          moFacturable: true,
          moExplication: "MO facturable car Mission D (travaux correctifs niveau 5 sur BNC)",
          recommandations: [
            "Sous-type VTR G BNC réservé aux bâtiments non courants (ouvrages d'art, grandes halles)",
            "Vérifier si le montant dépasse 15 000€ (seuil réception formelle)",
            "Si > 3 500€ : nécessite validation GP",
            "Joindre le diagnostic justifiant le remplacement complet",
            "Vérifier si des compétences spécifiques sont nécessaires (bureau d'études structure)",
          ],
        },
      },
      {
        label: "Non (bâtiment courant — bureaux, ateliers, gares standards)",
        value: "non",
        result: {
          mission: "D",
          missionLabel: "Mission D — Remplacement complet (niveau 5)",
          chargeType: "proprietaire",
          chargeLabel: "Charge Propriétaire",
          sousType: "Gros Entretiens",
          sousTypeCode: "GE",
          natureTravauxSuggestions: ["Selon corps d'état principal concerné"],
          famillebudgetaire: "GER",
          codeZG: "ZG360910",
          moFacturable: true,
          moExplication: "MO facturable car Mission D (travaux correctifs niveau 5)",
          recommandations: [
            "Vérifier si le montant dépasse 15 000€ (seuil réception formelle)",
            "Si > 3 500€ : nécessite validation GP",
            "Joindre le diagnostic justifiant le remplacement complet",
          ],
        },
      },
    ],
  },
  q4: {
    id: "q4",
    text: "L'intervention porte-t-elle sur une Pièce Détachée (PD) ou un Équipement complet ?",
    helpText: "PD = composant remplaçable (filtre, courroie, joint, plaque, ampoule). Équipement = système complet (moteur, pompe, tableau, chaudière)",
    options: [
      { label: "Pièce Détachée (PD)", value: "pd", nextQuestion: "q5_pd" },
      { label: "Équipement complet", value: "equipement", nextQuestion: "q5_equip" },
    ],
  },
  q5_pd: {
    id: "q5_pd",
    text: "La pièce détachée est-elle un consommable ou une pièce d'usure normale ?",
    helpText: "Consommable/usure = filtre, courroie, joint, ampoule, fusible. Pièce cassée/défaillante = carte électronique, vanne, contacteur",
    options: [
      {
        label: "Oui (consommable / usure normale)",
        value: "oui",
        result: {
          mission: "C",
          missionLabel: "Mission C — Maintenance préventive (PD consommable)",
          chargeType: "locataire",
          chargeLabel: "Charge Locataire (inclus forfait E2MT²)",
          sousType: "Contrats de Maintenance Externe - E2MT",
          sousTypeCode: "CME_CMT",
          natureTravauxSuggestions: ["Maintenance multi techniques - forfait E2MT"],
          famillebudgetaire: "CME",
          codeZG: "ZG360720",
          moFacturable: false,
          moExplication: "MO INCLUSE au forfait E2MT² (Mission C, PD consommable)",
          recommandations: [
            "Vérifier la franchise 300€ sur les pièces",
            "MO non facturable — incluse dans le forfait",
            "Si le prestataire facture la MO → REFUSER",
            "Pièces < 300€ unitaire → à charge du Titulaire (franchise)",
          ],
        },
      },
      {
        label: "Non (pièce cassée / défaillante prématurément)",
        value: "non",
        nextQuestion: "q6_dvt",
      },
    ],
  },
  q5_equip: {
    id: "q5_equip",
    text: "L'équipement a-t-il dépassé sa Durée de Vie Théorique (DVT) ?",
    helpText: "DVT = durée de vie attendue de l'équipement. Ex: chaudière 20 ans, pompe 15 ans, moteur VMC 10 ans",
    options: [
      {
        label: "Oui (DVT dépassée — vétusté)",
        value: "oui",
        result: {
          mission: "D",
          missionLabel: "Mission D — Remplacement équipement vétuste (DVT dépassée)",
          chargeType: "proprietaire",
          chargeLabel: "Charge Propriétaire",
          sousType: "Gros Entretiens",
          sousTypeCode: "GE",
          natureTravauxSuggestions: ["Selon corps d'état principal concerné"],
          famillebudgetaire: "GER",
          codeZG: "ZG360910",
          moFacturable: true,
          moExplication: "MO facturable car Mission D (remplacement équipement vétuste)",
          recommandations: [
            "Joindre justificatif de la DVT (fiche technique, date d'installation)",
            "Si montant > 3 500€ : validation GP requise",
            "Vérifier si un remplacement à l'identique ou une amélioration est prévu",
          ],
        },
      },
      {
        label: "Non (DVT non dépassée — panne prématurée)",
        value: "non",
        nextQuestion: "q7_cause",
      },
    ],
  },
  q6_dvt: {
    id: "q6_dvt",
    text: "La pièce a-t-elle dépassé sa durée de vie théorique ?",
    helpText: "Vérifier si la pièce a atteint ou dépassé sa durée de vie normale",
    options: [
      {
        label: "Oui (usure normale au-delà de la DVT)",
        value: "oui",
        result: {
          mission: "D",
          missionLabel: "Mission D — Remplacement PD vétuste",
          chargeType: "proprietaire",
          chargeLabel: "Charge Propriétaire (si > 300€)",
          sousType: "Gros Entretiens - par E2MT",
          sousTypeCode: "GE_CMT",
          natureTravauxSuggestions: ["Selon corps d'état principal concerné"],
          famillebudgetaire: "GER",
          codeZG: "ZG360910",
          moFacturable: true,
          moExplication: "MO facturable car Mission D (remplacement PD vétuste)",
          recommandations: [
            "Vérifier le montant : si < 3 500€ → sous-type PTP_CMT possible",
            "Joindre justificatif de vétusté si possible",
          ],
        },
      },
      {
        label: "Non (casse prématurée)",
        value: "non",
        result: {
          mission: "D",
          missionLabel: "Mission D — Remplacement PD défaillante (casse prématurée)",
          chargeType: "locataire",
          chargeLabel: "Charge Locataire",
          sousType: "Gros Entretiens - par E2MT",
          sousTypeCode: "GE_CMT",
          natureTravauxSuggestions: ["Selon corps d'état principal concerné"],
          famillebudgetaire: "GER",
          codeZG: "ZG360910",
          moFacturable: true,
          moExplication: "MO facturable car Mission D (travaux correctifs)",
          recommandations: [
            "Charge locataire car casse prématurée (pas de vétusté)",
            "Vérifier si la garantie constructeur est encore active",
            "Franchise 300€ applicable sur les pièces",
          ],
        },
      },
    ],
  },
  q7_cause: {
    id: "q7_cause",
    text: "Quelle est la cause de la panne de l'équipement ?",
    helpText: "Identifier la cause racine pour déterminer la responsabilité",
    options: [
      {
        label: "Défaut de maintenance (entretien non réalisé)",
        value: "defaut_maintenance",
        result: {
          mission: "D",
          missionLabel: "Mission D — Panne suite défaut de maintenance",
          chargeType: "locataire",
          chargeLabel: "Charge Locataire (responsabilité maintenance)",
          sousType: "Gros Entretiens - par E2MT",
          sousTypeCode: "GE_CMT",
          natureTravauxSuggestions: ["Selon corps d'état principal concerné"],
          famillebudgetaire: "GER",
          codeZG: "ZG360910",
          moFacturable: true,
          moExplication: "MO facturable car Mission D",
          recommandations: [
            "Vérifier le carnet d'entretien de l'équipement",
            "Documenter le défaut de maintenance (photos, historique)",
            "Envisager pénalité P4 si le Titulaire est responsable du défaut",
          ],
        },
      },
      {
        label: "Défaut intrinsèque / vice caché",
        value: "vice",
        result: {
          mission: "D",
          missionLabel: "Mission D — Panne (défaut intrinsèque)",
          chargeType: "proprietaire",
          chargeLabel: "Charge Propriétaire",
          sousType: "Gros Entretiens",
          sousTypeCode: "GE",
          natureTravauxSuggestions: ["Selon corps d'état principal concerné"],
          famillebudgetaire: "GER",
          codeZG: "ZG360910",
          moFacturable: true,
          moExplication: "MO facturable car Mission D",
          recommandations: [
            "Vérifier la garantie constructeur",
            "Documenter le vice caché (rapport technique)",
            "Envisager un recours contre le fabricant/installateur",
          ],
        },
      },
      {
        label: "Cause indéterminée",
        value: "indetermine",
        result: {
          mission: "D",
          missionLabel: "Mission D — Panne (cause indéterminée)",
          chargeType: "proprietaire",
          chargeLabel: "Charge Propriétaire (par défaut)",
          sousType: "Gros Entretiens - par E2MT",
          sousTypeCode: "GE_CMT",
          natureTravauxSuggestions: ["Selon corps d'état principal concerné"],
          famillebudgetaire: "GER",
          codeZG: "ZG360910",
          moFacturable: true,
          moExplication: "MO facturable car Mission D",
          recommandations: [
            "En l'absence de preuve de responsabilité locataire → charge propriétaire par défaut",
            "Demander un diagnostic complémentaire si le montant est élevé",
          ],
        },
      },
    ],
  },
};

// Vérification croisée sous-type ↔ nature de travaux
const compatibilitesSousTypeNature: Record<string, { compatibles: string[]; exclusives?: boolean; message?: string }> = {
  CME_CMT: {
    compatibles: ["Maintenance multi techniques - forfait E2MT"],
    exclusives: true,
    message: "CME_CMT est EXCLUSIVEMENT réservé à la nature 'Maintenance multi techniques - forfait E2MT'",
  },
  PTP_CMT: {
    compatibles: [
      "Aménagements intérieurs", "Clos", "Couvert", "Eclairage et installations électriques BT",
      "Installations chauffage, ventil. climatisation", "Plomberie, sanitaire", "Structure",
      "Accessibilité (Asc, escalier méca) élévateur", "Equipements de sécurité incendie",
      "Courant faible (téléphonie, automatisme, GTB)", "Espaces extérieurs dont élagage, abattage",
      "Assainissement Voierie Réseau Divers, déchet, eau", "Vidéosurveillance, gardiennage, sécurisation",
      "Distribution HTetMT - Postes de livr./transf.",
    ],
    exclusives: false,
    message: "PTP_CMT : toutes natures sauf celles réservées G&C ou E2MT",
  },
  GE_CMT: {
    compatibles: [
      "Aménagements intérieurs", "Clos", "Couvert", "Eclairage et installations électriques BT",
      "Installations chauffage, ventil. climatisation", "Plomberie, sanitaire", "Structure",
      "Accessibilité (Asc, escalier méca) élévateur", "Equipements de sécurité incendie",
      "Courant faible (téléphonie, automatisme, GTB)", "Espaces extérieurs dont élagage, abattage",
      "Assainissement Voierie Réseau Divers, déchet, eau", "Vidéosurveillance, gardiennage, sécurisation",
      "Distribution HTetMT - Postes de livr./transf.", "Démolitions - suppressions bâtiments équipements",
    ],
    exclusives: false,
    message: "GE_CMT : toutes natures sauf celles réservées G&C",
  },
  MEC_EE: {
    compatibles: ["Eclairage et installations électriques BT", "Distribution HTetMT - Postes de livr./transf."],
    exclusives: true,
    message: "MEC_EE est réservé aux natures électriques (BT ou HT/MT)",
  },
  RAU: {
    compatibles: [
      "Equipements de sécurité incendie", "Accessibilité (Asc, escalier méca) élévateur",
      "Installations chauffage, ventil. climatisation", "Plomberie, sanitaire",
    ],
    exclusives: false,
    message: "RAU : natures liées à la conformité réglementaire (incendie, accessibilité, thermique)",
  },
  ML: {
    compatibles: [
      "Aménagements intérieurs", "Clos", "Eclairage et installations électriques BT",
      "Plomberie, sanitaire", "Espaces extérieurs dont élagage, abattage",
    ],
    exclusives: false,
    message: "ML : natures courantes pour maintenance locative",
  },
  "VTR G BNC": {
    compatibles: ["Structure", "Couvert", "Clos", "Aménagements intérieurs"],
    exclusives: false,
    message: "VTR G BNC : natures liées aux bâtiments non courants (structure, couvert, clos)",
  },
  VTR_EE: {
    compatibles: ["Eclairage et installations électriques BT", "Distribution HTetMT - Postes de livr./transf."],
    exclusives: true,
    message: "VTR_EE est réservé aux natures électriques",
  },
  "CA EE": {
    compatibles: ["Eclairage et installations électriques BT", "Distribution HTetMT - Postes de livr./transf."],
    exclusives: true,
    message: "CA EE est réservé aux natures électriques",
  },
  EE_MPS: {
    compatibles: ["Eclairage et installations électriques BT", "Distribution HTetMT - Postes de livr./transf."],
    exclusives: true,
    message: "EE_MPS est réservé aux natures électriques",
  },
  "VTR ACC DIAG": {
    compatibles: ["Visite de surveillance, contrôle, diag., étude"],
    exclusives: true,
    message: "VTR ACC DIAG est EXCLUSIVEMENT réservé à la nature 'Visite de surveillance, contrôle, diag., étude'",
  },
  VIR: {
    compatibles: ["Visite de surveillance, contrôle, diag., étude", "Audits et Etudes Energétiques"],
    exclusives: true,
    message: "VIR est réservé aux natures de visite/audit hors réglementaire",
  },
};

// Fonction de vérification croisée
function verifierCompatibilite(sousTypeCode: string, natureSelectionnee: string): {
  compatible: boolean;
  message: string;
  naturesCompatibles: string[];
} {
  const regle = compatibilitesSousTypeNature[sousTypeCode];
  if (!regle) {
    return { compatible: true, message: "Aucune restriction connue pour ce sous-type", naturesCompatibles: [] };
  }
  const estCompatible = regle.compatibles.some(n => natureSelectionnee.includes(n) || n.includes(natureSelectionnee));
  return {
    compatible: estCompatible,
    message: estCompatible
      ? `✅ Compatible : ${regle.message}`
      : `⚠️ INCOMPATIBLE : ${regle.message}. Natures autorisées : ${regle.compatibles.join(", ")}`,
    naturesCompatibles: regle.compatibles,
  };
}

// Nature de travaux helper
const naturesParCorpsEtat: Record<string, string[]> = {
  "Électricité BT": ["Eclairage et installations électriques BT"],
  "Électricité HT/MT": ["Distribution HTetMT - Postes de livr./transf."],
  "CVC (Chauffage/Ventilation/Clim)": ["Installations chauffage, ventil. climatisation"],
  "Plomberie / Sanitaire": ["Plomberie, sanitaire"],
  "Couverture / Toiture": ["Couvert"],
  "Menuiseries / Façade / Murs": ["Clos"],
  "Aménagement intérieur (peinture, faux plafond, cloisons)": ["Aménagements intérieurs"],
  "Structure (béton, charpente)": ["Structure"],
  "Ascenseur / Monte-charge": ["Accessibilité (Asc, escalier méca) élévateur"],
  "Sécurité incendie": ["Equipements de sécurité incendie"],
  "Espaces verts / Extérieurs": ["Espaces extérieurs dont élagage, abattage"],
  "VRD / Assainissement": ["Assainissement / VRD / déchet / eau"],
  "Vidéosurveillance / Sécurité": ["Vidéosurveillance, gardiennage, sécurisation"],
  "Courant faible / GTB / Automatisme": ["Courant faible (téléphonie, automatisme, GTB)"],
  "Énergie / Décarbonation": ["Audits et Etudes Energétiques"],
  "Désamiantage": ["Démolitions - suppressions bâtiments équipements"],
};

export default function ArbreDecisionPage() {
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("q1");
  const [answers, setAnswers] = useState<{ questionId: string; answer: string; label: string }[]>([]);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [selectedNature, setSelectedNature] = useState<string>("");
  const [showCorpsEtat, setShowCorpsEtat] = useState(false);
  const [, setLocation] = useLocation();
  const [montantDevis, setMontantDevis] = useState<string>("");
  const [montantApplied, setMontantApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveMutation = trpc.decisions.save.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Décision sauvegardée dans l'historique");
    },
    onError: () => {
      // Silently fail - non-blocking
    },
  });

  // Affinage du sous-type selon le montant
  const adjustedResult = useMemo(() => {
    if (!result || !montantApplied) return result;
    const montant = parseFloat(montantDevis);
    if (isNaN(montant) || montant <= 0) return result;

    // Règles d'affinage selon le montant
    if (result.mission === "D") {
      if (montant <= 3500) {
        // < 3500€ : PTP (Petits Travaux Ponctuels)
        if (result.sousTypeCode === "GE" || result.sousTypeCode === "GE_CMT") {
          return {
            ...result,
            sousType: result.sousTypeCode === "GE_CMT" ? "Petits Travaux Ponctuels - par E2MT" : "Petits Travaux Ponctuels",
            sousTypeCode: result.sousTypeCode === "GE_CMT" ? "PTP_CMT" : "PTP",
            famillebudgetaire: "PTP",
            codeZG: "ZG361510",
            recommandations: [
              ...result.recommandations.filter(r => !r.includes("3 500")),
              `Montant ${montant.toLocaleString("fr-FR")}€ ≤ 3 500€ → sous-type PTP (pas de validation GP requise)`,
            ],
          };
        }
      } else if (montant > 3500 && montant <= 15000) {
        // 3500€ - 15000€ : GE avec validation GP
        return {
          ...result,
          recommandations: [
            ...result.recommandations.filter(r => !r.includes("3 500") && !r.includes("15 000")),
            `Montant ${montant.toLocaleString("fr-FR")}€ > 3 500€ → validation GP requise`,
            `Montant ${montant.toLocaleString("fr-FR")}€ ≤ 15 000€ → pas de réception formelle`,
          ],
        };
      } else if (montant > 15000) {
        // > 15000€ : GE avec réception formelle
        return {
          ...result,
          recommandations: [
            ...result.recommandations.filter(r => !r.includes("3 500") && !r.includes("15 000")),
            `Montant ${montant.toLocaleString("fr-FR")}€ > 15 000€ → réception formelle obligatoire`,
            `Montant ${montant.toLocaleString("fr-FR")}€ > 3 500€ → validation GP requise`,
          ],
        };
      }
    }
    return result;
  }, [result, montantDevis, montantApplied]);

  // Sauvegarde automatique quand un résultat est déterminé
  const autoSaveRef = useRef(false);
  useEffect(() => {
    if (result && !autoSaveRef.current && !saved) {
      autoSaveRef.current = true;
      // Sauvegarder automatiquement après un court délai pour laisser le rendu se stabiliser
      const timer = setTimeout(() => {
        saveMutation.mutate({
          mission: result.mission,
          missionLabel: result.missionLabel,
          chargeType: result.chargeType,
          chargeLabel: result.chargeLabel,
          sousTypeCode: result.sousTypeCode,
          sousType: result.sousType,
          famillebudgetaire: result.famillebudgetaire,
          codeZG: result.codeZG,
          moFacturable: result.moFacturable,
          moExplication: result.moExplication,
          natureTravauxSelectionnee: result.natureTravauxSuggestions[0] || "",
          montantDevis: undefined,
          parcours: answers,
          recommandations: result.recommandations,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [result]);

  // Reset autoSave ref on reset
  useEffect(() => {
    if (!result) {
      autoSaveRef.current = false;
    }
  }, [result]);

  const currentQuestion = questions[currentQuestionId];

  const handleAnswer = (option: Option) => {
    const newAnswers = [...answers, { questionId: currentQuestionId, answer: option.value, label: option.label }];
    setAnswers(newAnswers);

    if (option.result) {
      setResult(option.result);
    } else if (option.nextQuestion) {
      setCurrentQuestionId(option.nextQuestion);
    }
  };

  const handleBack = () => {
    if (answers.length === 0) return;
    const newAnswers = [...answers];
    newAnswers.pop();
    setAnswers(newAnswers);
    setResult(null);

    if (newAnswers.length === 0) {
      setCurrentQuestionId("q1");
    } else {
      // Find the question that led to the current one
      const lastAnswer = newAnswers[newAnswers.length - 1];
      setCurrentQuestionId(lastAnswer.questionId);
      // Actually we need to replay from start
      let qId = "q1";
      for (let i = 0; i < newAnswers.length; i++) {
        const q = questions[qId];
        const opt = q.options.find((o) => o.value === newAnswers[i].answer);
        if (opt?.nextQuestion) {
          qId = opt.nextQuestion;
        }
      }
      setCurrentQuestionId(qId);
    }
  };

  const handleReset = () => {
    setCurrentQuestionId("q1");
    setAnswers([]);
    setResult(null);
    setSelectedNature("");
    setShowCorpsEtat(false);
    setMontantDevis("");
    setMontantApplied(false);
    setSaved(false);
  };

  const handleSaveDecision = () => {
    const r = adjustedResult;
    if (!r) return;
    saveMutation.mutate({
      mission: r.mission,
      missionLabel: r.missionLabel,
      chargeType: r.chargeType,
      chargeLabel: r.chargeLabel,
      sousTypeCode: r.sousTypeCode,
      sousType: r.sousType,
      famillebudgetaire: r.famillebudgetaire,
      codeZG: r.codeZG,
      moFacturable: r.moFacturable,
      moExplication: r.moExplication,
      natureTravauxSelectionnee: selectedNature || r.natureTravauxSuggestions[0] || "",
      montantDevis: montantApplied ? montantDevis : undefined,
      parcours: answers,
      recommandations: r.recommandations,
    });
  };

  const handleCopyResult = () => {
    const r = adjustedResult;
    if (!r) return;
    const text = `
═══ RÉSULTAT ARBRE DE DÉCISION ═══

📋 MISSION : ${r.mission} — ${r.missionLabel}
💰 CHARGE : ${r.chargeLabel}
📁 SOUS-TYPE : ${r.sousTypeCode} — ${r.sousType}
🏷️ FAMILLE BUDGÉTAIRE : ${r.famillebudgetaire} (${r.codeZG})
👷 MO : ${r.moFacturable ? "FACTURABLE" : "NON FACTURABLE (incluse forfait)"}
   → ${r.moExplication}
${montantApplied ? `💶 MONTANT DEVIS : ${parseFloat(montantDevis).toLocaleString("fr-FR")}€ HT` : ""}

📌 NATURE DE TRAVAUX SUGGÉRÉE :
${r.natureTravauxSuggestions.map((n) => `   • ${n}`).join("\n")}
${selectedNature ? `   ✅ Sélectionnée : ${selectedNature}` : ""}

⚠️ RECOMMANDATIONS :
${r.recommandations.map((rec) => `   • ${rec}`).join("\n")}

═══ PARCOURS DE DÉCISION ═══
${answers.map((a, i) => `${i + 1}. ${questions[a.questionId]?.text} → ${a.label}`).join("\n")}
`.trim();
    navigator.clipboard.writeText(text);
    toast.success("Résultat copié dans le presse-papier");
  };

  const handleSendToAssistant = () => {
    const r = adjustedResult;
    if (!r) return;
    const context = `
Résultat arbre de décision :
- Mission : ${r.mission} (${r.missionLabel})
- Charge : ${r.chargeLabel}
- Sous-type : ${r.sousTypeCode} (${r.sousType})
- Famille budgétaire : ${r.famillebudgetaire} (${r.codeZG})
- MO : ${r.moFacturable ? "Facturable" : "Non facturable"}
- Nature de travaux : ${selectedNature || r.natureTravauxSuggestions[0]}
${montantApplied ? `- Montant devis : ${parseFloat(montantDevis).toLocaleString("fr-FR")}€ HT` : ""}

Analyse le devis en tenant compte de ces paramètres.
`.trim();
    // Navigate to assistant with pre-filled context
    sessionStorage.setItem("assistant_prefill", context);
    setLocation("/assistant");
    toast.success("Contexte envoyé à l'Assistant IA");
  };

  const progress = useMemo(() => {
    // Estimate progress (max ~4 questions typically)
    return Math.min((answers.length / 4) * 100, result ? 100 : 90);
  }, [answers.length, result]);

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <TreePine className="h-7 w-7 text-emerald-600" />
            Arbre de Décision
          </h1>
          <p className="text-slate-500 mt-1">
            Déterminez la Mission C/D, le sous-type IMMOSIS et la nature de travaux
          </p>
        </div>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Recommencer
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Parcours (breadcrumb) */}
      {answers.length > 0 && (
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="font-medium">Parcours :</span>
            </div>
            <div className="space-y-1">
              {answers.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
                    Q{i + 1}
                  </Badge>
                  <span className="text-slate-600">{questions[a.questionId]?.text}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 shrink-0 mt-1" />
                  <span className="font-medium text-slate-800">{a.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question courante */}
      {!result && currentQuestion && (
        <Card className="border-emerald-200 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                Question {answers.length + 1}
              </Badge>
            </div>
            <CardTitle className="text-lg text-slate-900 mt-2">
              {currentQuestion.text}
            </CardTitle>
            {currentQuestion.helpText && (
              <CardDescription className="text-sm text-slate-500 mt-1">
                💡 {currentQuestion.helpText}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option)}
                className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group flex items-center justify-between"
              >
                <span className="font-medium text-slate-700 group-hover:text-emerald-800">
                  {option.label}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </button>
            ))}

            {answers.length > 0 && (
              <Button variant="ghost" onClick={handleBack} className="gap-2 mt-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" />
                Revenir à la question précédente
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Résultat */}
      {result && (
        <div className="space-y-4">
          {/* Seuil montant */}
          {result.mission === "D" && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-medium text-blue-700 uppercase tracking-wide block mb-1">
                      Montant du devis HT (optionnel)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={montantDevis}
                        onChange={(e) => {
                          setMontantDevis(e.target.value);
                          setMontantApplied(false);
                        }}
                        placeholder="Ex: 2500"
                        className="w-40 px-3 py-2 rounded-md border border-blue-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="text-sm text-blue-600 font-medium">€ HT</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMontantApplied(true)}
                        disabled={!montantDevis || parseFloat(montantDevis) <= 0}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Appliquer
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600">
                    <p>• ≤ 3 500€ → PTP (pas de validation GP)</p>
                    <p>• 3 500€ - 15 000€ → GE + validation GP</p>
                    <p>• &gt; 15 000€ → GE + réception formelle</p>
                  </div>
                </div>
                {montantApplied && adjustedResult && adjustedResult.sousTypeCode !== result.sousTypeCode && (
                  <div className="mt-3 p-2 rounded bg-blue-100 border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">
                      ✅ Sous-type ajusté : <span className="font-bold">{result.sousTypeCode}</span> → <span className="font-bold">{adjustedResult.sousTypeCode}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Résultat principal */}
          <Card className="border-2 border-emerald-300 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <CardTitle className="text-xl text-emerald-800">Résultat de l'analyse</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Mission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Mission</div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        result.mission === "C"
                          ? "bg-blue-100 text-blue-800 border-blue-200 text-lg px-3 py-1"
                          : "bg-orange-100 text-orange-800 border-orange-200 text-lg px-3 py-1"
                      }
                    >
                      Mission {result.mission}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{result.missionLabel}</p>
                </div>

                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Charge</div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        result.chargeType === "proprietaire"
                          ? "bg-purple-100 text-purple-800 border-purple-200 text-lg px-3 py-1"
                          : result.chargeType === "locataire"
                          ? "bg-amber-100 text-amber-800 border-amber-200 text-lg px-3 py-1"
                          : "bg-slate-100 text-slate-800 border-slate-200 text-lg px-3 py-1"
                      }
                    >
                      {result.chargeLabel}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sous-type et famille */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Sous-type IMMOSIS</div>
                  <div className="font-bold text-lg text-slate-900">{(adjustedResult || result).sousTypeCode}</div>
                  <p className="text-sm text-slate-600">{(adjustedResult || result).sousType}</p>
                  {montantApplied && adjustedResult && adjustedResult.sousTypeCode !== result.sousTypeCode && (
                    <Badge className="mt-1 bg-blue-100 text-blue-700 border-blue-200 text-xs">Ajusté par montant</Badge>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Famille budgétaire</div>
                  <div className="font-bold text-lg text-slate-900">{(adjustedResult || result).famillebudgetaire}</div>
                  <p className="text-sm text-slate-600">{(adjustedResult || result).codeZG}</p>
                </div>
              </div>

              {/* MO */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  (adjustedResult || result).moFacturable
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {(adjustedResult || result).moFacturable ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-bold text-lg">
                    MO {(adjustedResult || result).moFacturable ? "FACTURABLE" : "NON FACTURABLE"}
                  </span>
                </div>
                <p className="text-sm text-slate-700 ml-7">{(adjustedResult || result).moExplication}</p>
              </div>

              <Separator />

              {/* Nature de travaux */}
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Nature de travaux suggérée
                </div>
                <div className="space-y-2">
                  {result.natureTravauxSuggestions.map((nature, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedNature(nature)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedNature === nature
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      <span className="text-sm font-medium">{nature}</span>
                    </div>
                  ))}
                </div>

                {/* Vérification croisée */}
                {selectedNature && (adjustedResult || result) && (() => {
                  const check = verifierCompatibilite((adjustedResult || result)!.sousTypeCode, selectedNature);
                  return (
                    <div className={`mt-3 p-3 rounded-lg border ${check.compatible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                      <div className="flex items-center gap-2">
                        {check.compatible ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${check.compatible ? "text-green-800" : "text-red-800"}`}>
                          {check.compatible ? "Nature compatible" : "Nature INCOMPATIBLE"}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${check.compatible ? "text-green-700" : "text-red-700"}`}>
                        {check.message}
                      </p>
                      {!check.compatible && check.naturesCompatibles.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs font-medium text-red-700 mb-1">Natures autorisées :</p>
                          <div className="flex flex-wrap gap-1">
                            {check.naturesCompatibles.map((n, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedNature(n)}
                                className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Sélection par corps d'état */}
                <button
                  onClick={() => setShowCorpsEtat(!showCorpsEtat)}
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 mt-3 font-medium"
                >
                  {showCorpsEtat ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Sélectionner par corps d'état
                </button>

                {showCorpsEtat && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(naturesParCorpsEtat).map(([corps, natures]) => (
                      <button
                        key={corps}
                        onClick={() => setSelectedNature(natures[0])}
                        className={`text-left p-2 rounded border text-xs transition-all ${
                          selectedNature === natures[0]
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        <div className="font-medium text-slate-700">{corps}</div>
                        <div className="text-slate-500">{natures[0]}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Recommandations */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Recommandations
                  </span>
                </div>
                <ul className="space-y-1">
                  {(adjustedResult || result).recommandations.map((rec, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCopyResult} variant="outline" className="gap-2">
              <Copy className="h-4 w-4" />
              Copier le résultat
            </Button>
            <Button onClick={handleSendToAssistant} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Send className="h-4 w-4" />
              Envoyer à l'Assistant IA pour analyse de devis
            </Button>
            <Button
              onClick={handleSaveDecision}
              variant="outline"
              className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              disabled={saved || saveMutation.isPending}
            >
              {saved ? (
                <><CheckCircle2 className="h-4 w-4" /> Sauvegardé automatiquement</>
              ) : saveMutation.isPending ? (
                <>Sauvegarde...</>
              ) : (
                <>Sauvegarder (mise à jour)</>
              )}
            </Button>
            <Button variant="ghost" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Nouvelle analyse
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
