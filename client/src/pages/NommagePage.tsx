import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Search,
  CheckCircle2,
  XCircle,
  Tag,
  ArrowLeft,
  Layers,
  Hammer,
  AlertTriangle,
  Info,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Data Types ──────────────────────────────────────────────────
type NomenclatureItem = {
  id: number;
  name: string;
  code: string;
  category: "sous-type" | "nature";
  status: "actif" | "ne_plus_utiliser" | "usage_gc";
  bonnesPratiques: string[];
  mauvaisesPratiques: string[];
  anciennement?: string;
  note?: string;
};

// ─── Sous-types Data ─────────────────────────────────────────────
const sousTypes: NomenclatureItem[] = [
  {
    id: 1, name: "Accompagnement diagnostic", code: "VTR ACC DIAG", category: "sous-type", status: "actif",
    bonnesPratiques: ["Accompagnement par ABE pour des missions pour lesquelles l'accompagnement n'est pas inclus dans la rémunération (voir COGC), que cela soit dans le cadre de visites réglementaires ou non."],
    mauvaisesPratiques: ["Utiliser pour l'accompagnement des VRE (inclus dans la rémunération des VRE, voir COGC)."],
  },
  {
    id: 2, name: "Contrats de Maintenance Externe", code: "CME", category: "sous-type", status: "actif",
    bonnesPratiques: ["Contrat de maintenance externe autre que l'E2MT.", "Exemple : ascenseurs.", "Par extension : contrat externe d'AMO Quadrim, contrat externe de service (nettoyage, gardiennage), location benne ou bungalow…"],
    mauvaisesPratiques: ["Forfait ou travaux E2MT."],
  },
  {
    id: 3, name: "Contrats de Maintenance Externe - E2MT", code: "CME_CMT", category: "sous-type", status: "actif",
    anciennement: "Contrats de Maintenance Externe - CMT",
    bonnesPratiques: ["Forfait et prise en charge E2MT uniquement."],
    mauvaisesPratiques: ["Travaux connexes via le marché E2MT (utiliser \"Gros Entretiens - par E2MT\")."],
  },
  {
    id: 4, name: "Contrats de Maintenance Interne", code: "CMI", category: "sous-type", status: "ne_plus_utiliser",
    bonnesPratiques: ["Ne plus utiliser."],
    mauvaisesPratiques: ["MPS, PAM, maintenance postes HT/BT (utiliser \"Energie Electrique MPS\")."],
  },
  {
    id: 5, name: "Contrats Petits Travaux du Propriétaire", code: "PTP", category: "sous-type", status: "actif",
    bonnesPratiques: ["Enveloppe de petits travaux (inférieur à 3 500 €, voir COGC) réalisés hors contrat E2MT (travaux connexes)."],
    mauvaisesPratiques: ["Travaux de plus de 3 500 €."],
  },
  {
    id: 6, name: "Diagnostic Amiante", code: "VTR AMIA INIT", category: "sous-type", status: "actif",
    anciennement: "Diagnostic Initiale Amiante",
    bonnesPratiques: ["À utiliser pour tous les diagnostics amiantes : DTA, DAAT et diagnostic initial amiante."],
    mauvaisesPratiques: [],
  },
  {
    id: 7, name: "Economies d'énergie, décarbonation", code: "CA EE", category: "sous-type", status: "actif",
    anciennement: "Campagne d'économie d'énergies",
    bonnesPratiques: ["Télérelève (tous fluides : élec, gaz, rcu, fuel, eau…), plan de comptage.", "Audits énergétiques, étude thermique, relamping, passage en LED, sortie du fuel, mise en place PAC, RCU, GTB, isolation…", "Recherche de fuites."],
    mauvaisesPratiques: [],
  },
  {
    id: 8, name: "Energie Electrique MPS", code: "EE_MPS", category: "sous-type", status: "actif",
    bonnesPratiques: ["Maintenance préventive dans le domaine électrique (HT et BT) : MPS, PAM.", "Entretien poste HT/BT."],
    mauvaisesPratiques: [],
  },
  {
    id: 9, name: "Gros Entretiens", code: "GE", category: "sous-type", status: "actif",
    bonnesPratiques: ["Tous les travaux sur installations et équipements réalisés en dehors du contrat E2MT (travaux connexes).", "Par extension : élagage, abattage, débroussaillage…"],
    mauvaisesPratiques: ["Locations diverses, nettoyage, élagage, gardiennage (utiliser \"Contrats de Maintenance Externe\").", "MEC (utiliser \"Mise en conformité réglementaire autre\").", "Études et diagnostics (utiliser \"Visite tech audit étude\").", "Contrat de service comme nettoyage et gardiennage (utiliser \"Contrat de Maintenance Externe\")."],
  },
  {
    id: 10, name: "Gros Entretiens - par E2MT", code: "GE_CMT", category: "sous-type", status: "actif",
    anciennement: "Gros Entretiens - CMT",
    bonnesPratiques: ["Tous les travaux sur installations et équipements réalisés avec le contrat E2MT (travaux connexes)."],
    mauvaisesPratiques: ["Travaux réalisés en dehors de l'E2MT.", "Prise en charge ou forfait E2MT (utiliser \"Contrats de Maintenance Externe - E2MT\").", "Locations diverses, nettoyage, élagage, gardiennage (utiliser \"Contrats de Maintenance Externe\").", "MEC (utiliser \"Mise en conformité réglementaire autre\"), ou MEC EE pour MEC électriques.", "Études et diagnostics (utiliser \"Visite tech audit étude\").", "Contrat de service comme nettoyage et gardiennage (utiliser \"Contrat de Maintenance Externe\")."],
  },
  {
    id: 11, name: "Maintenance Elargie Energie Electrique", code: "EE", category: "sous-type", status: "ne_plus_utiliser",
    bonnesPratiques: ["Ne plus utiliser."],
    mauvaisesPratiques: ["MPS, PAM, maintenance postes HT/BT (utiliser \"Energie Electrique MPS\")."],
  },
  {
    id: 12, name: "Maintenance Locative", code: "ML", category: "sous-type", status: "actif",
    bonnesPratiques: ["Maintenance locative."],
    mauvaisesPratiques: ["Travaux locatifs (utiliser \"Travaux locatifs\")."],
  },
  {
    id: 13, name: "Mise en conformité énergie électrique", code: "MEC_EE", category: "sous-type", status: "actif",
    bonnesPratiques: ["MEC suite à VRE ou MPS."],
    mauvaisesPratiques: ["Autre nature de MEC (utiliser \"Mise en conformité réglementaire autre\")."],
  },
  {
    id: 14, name: "Mise en conformité réglementaire autre", code: "MEC_RAU", category: "sous-type", status: "actif",
    bonnesPratiques: ["Autres Mise En Conformité que les MEC électriques (incendie, ascenseurs, chauffage…etc.)."],
    mauvaisesPratiques: ["MEC Electriques."],
  },
  {
    id: 15, name: "Petits Travaux Propriétaires - E2MT", code: "PTP_CMT", category: "sous-type", status: "actif",
    anciennement: "Petits Travaux Propriétaires - CMT",
    bonnesPratiques: ["Enveloppe de petits travaux (inférieur à 3 500 €, voir COGC) réalisés avec le contrat E2MT (travaux connexes)."],
    mauvaisesPratiques: ["Inclure cette enveloppe dans la même AT que le forfait de maintenance E2MT \"Contrats de Maintenance Externe - E2MT\".", "Travaux de plus de 3 500 €.", "Travaux locatifs."],
  },
  {
    id: 16, name: "Travaux de Désamiantage", code: "TDA", category: "sous-type", status: "actif",
    bonnesPratiques: ["Désamiantage, traitement DVA, encapsulage…", "On associera en nature de travaux au sous-type \"Travaux de Désamiantage\" les équipements ou la partie de bâtiment concerné (clos, couvert, chauffage, sanitaire…)."],
    mauvaisesPratiques: ["DTA, DAAT et diagnostic initial amiante (utiliser \"Diagnostic Amiante\")."],
  },
  {
    id: 17, name: "Travaux locatifs", code: "TL", category: "sous-type", status: "actif",
    bonnesPratiques: ["Travaux locatifs."],
    mauvaisesPratiques: ["Maintenance locative."],
  },
  {
    id: 18, name: "Vérifications Réglementaires", code: "VTR", category: "sous-type", status: "actif",
    bonnesPratiques: ["Vérifications réglementaires."],
    mauvaisesPratiques: [],
  },
  {
    id: 19, name: "Visite réglementaire énergie électrique", code: "VTR_EE", category: "sous-type", status: "actif",
    bonnesPratiques: ["Uniquement les visites réglementaires électriques."],
    mauvaisesPratiques: ["MEC électriques (utiliser \"Mise en conformité énergie électrique\")."],
  },
  {
    id: 20, name: "Visite tech audit étude (hors réglementaire et VG)", code: "VTRNR", category: "sous-type", status: "actif",
    bonnesPratiques: ["Toutes les visites techniques, études, audits qui ne rapportent pas à des obligations réglementaires ou à une Visite de Gestion."],
    mauvaisesPratiques: ["Audit énergétique (utiliser \"Economies d'énergie, décarbonation\")."],
  },
  {
    id: 21, name: "Visites de Gestion", code: "VTRNR", category: "sous-type", status: "actif",
    bonnesPratiques: ["À utiliser pour les VG et autres diagnostics structurels sur les bâtiments classiques."],
    mauvaisesPratiques: ["Travaux de structure (utiliser \"Gros Entretiens\")."],
  },
  {
    id: 22, name: "Visites de Gestion des Bâtiments Non Courants", code: "VGBNC", category: "sous-type", status: "actif",
    bonnesPratiques: ["À utiliser pour les VG et autres diagnostics structurels sur les bâtiments particuliers (ouvrages d'art, grandes halles, verrières…)."],
    mauvaisesPratiques: [],
  },
];

// ─── Natures de travaux Data ─────────────────────────────────────
const naturesTravaux: NomenclatureItem[] = [
  {
    id: 101, name: "Abris de quai et mobilier scellé", code: "", category: "nature", status: "usage_gc",
    bonnesPratiques: ["À ne pas utiliser, usage G&C."],
    mauvaisesPratiques: [],
  },
  {
    id: 102, name: "Aménagements intérieurs", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Usage sous-type locatif : reprise de peinture, nouveau cloisonnement, traitement faux plafond, escalier escamotable d'accès à des combles…"],
    mauvaisesPratiques: ["Réfection douche (à mettre en \"Plomberie, sanitaire\").", "Isolation de comble : concerne la mise hors d'air donc le \"Clos\"."],
  },
  {
    id: 103, name: "Assainissement Voierie Réseau Divers, déchet, eau", code: "", category: "nature", status: "actif",
    anciennement: "Assainissement et Hygiène",
    bonnesPratiques: ["Collecte, traitement et évacuation des eaux usées et pluviales.", "Réalisation ou rénovation de réseaux d'évacuation (égouts, siphons, canalisations).", "Mise en place de stations d'épuration ou d'installations de traitement des eaux.", "Création de fosses septiques ou de systèmes de traitement individuel.", "Bitumage, enrobage, réfection route, gestion de déchets, curage canalisation."],
    mauvaisesPratiques: ["Reprise d'infiltration mur, diagnostic humidité : relève du \"Clos\".", "Inertage de fosse septique : à mettre en \"Plomberie, sanitaire\".", "Inertage cuve fioul : concerne par association le CVC."],
  },
  {
    id: 104, name: "Audits et Etudes Energétiques", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Audits réglementaires énergétiques ou études énergétiques à la demande."],
    mauvaisesPratiques: [],
  },
  {
    id: 105, name: "Clos", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Carcasse du bâtiment : structure principale, murs, menuiseries extérieures (hors d'eau et hors d'air).", "Isolation de comble (mise hors d'air).", "Ravalement de façade."],
    mauvaisesPratiques: [],
  },
  {
    id: 106, name: "Courant faible (téléphonie, automatisme, GTB…)", code: "", category: "nature", status: "actif",
    anciennement: "Lignes téléphoniques et Câblages informatiques",
    bonnesPratiques: ["GTB, portes automatiques, domotique…"],
    mauvaisesPratiques: [],
  },
  {
    id: 107, name: "Couvert", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Toiture : réfection, reprise d'étanchéité et sécurisation, démoussage…"],
    mauvaisesPratiques: ["Descente d'EP : à mettre en \"Assainissement VRD\"."],
  },
  {
    id: 108, name: "Démolitions - suppressions bâtiments équipements", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["À utiliser pour les déconstructions sélectives."],
    mauvaisesPratiques: [],
  },
  {
    id: 109, name: "Distribution HT et MT - Postes de livr./transf.", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Exclusivement la Haute Tension et Moyenne Tension en amont des TGBT.", "Travaux et maintenance électriques sur poste HT, remplacement d'un câble, PAM HT…"],
    mauvaisesPratiques: ["Remplacement batteries onduleurs, remplacement tableau électrique : à mettre en \"Eclairage et installations électriques BT\".", "Travaux sur un bâtiment de type poste HT/BT mais relevant d'autre nature (clos, couvert…)."],
  },
  {
    id: 110, name: "Eclairage et installations électriques BT", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Remplacement luminaire, relamping, mise en conformité électriques basse tension, PAM BT, MEC EE…", "Mise en place de compteurs de type télérelève sur les consommations électriques."],
    mauvaisesPratiques: ["Les VRE : à placer dans \"Visite de surveillance, contrôle, diag., étude\".", "Changement de convecteur : à mettre en \"Installations chauffage, ventil. climatisation\".", "MEC BAES : à mettre en \"Equipements de sécurité incendie\"."],
  },
  {
    id: 111, name: "Entretien quais voyageurs", code: "", category: "nature", status: "usage_gc",
    bonnesPratiques: ["À ne pas utiliser, usage G&C."],
    mauvaisesPratiques: [],
  },
  {
    id: 112, name: "Accessibilité (Asc, escalier mécanique…) élévateur", code: "", category: "nature", status: "actif",
    anciennement: "Equipement Accessibilité",
    bonnesPratiques: ["Travaux, maintenance concernant ascenseurs, escaliers mécaniques, élévateurs.", "Les monte-charges peuvent être associés à cette rubrique."],
    mauvaisesPratiques: ["Escalier escamotable d'accès à des combles : relève de \"Aménagement intérieur\".", "Remplacement de portes, fenêtres : relèvent du \"Clos\".", "Réfections de portail : relèvent de \"Espaces extérieurs\" ou \"Courant faible\" si motorisation."],
  },
  {
    id: 113, name: "Equipements de sécurité incendie", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Poteau incendie, extincteurs, RIA, sprinkler, bâche à eau et autre dispositif de lutte contre l'incendie (BAES notamment).", "Maintenance, travaux, MEC des équipements de sécurité incendie.", "Audit incendie."],
    mauvaisesPratiques: [],
  },
  {
    id: 114, name: "Espaces extérieurs dont élagage, abattage", code: "", category: "nature", status: "actif",
    anciennement: "Espaces extérieurs",
    bonnesPratiques: ["Traitement des espaces verts : nettoyage, élagage, abattage.", "Travaux de parking : traçage, barrières, bornes de recharge… (La réfection d'enrobé relève de la VRD.)"],
    mauvaisesPratiques: ["Installation de caniveaux : relève du VRD.", "Intervention sur un pylône : relève de \"Eclairage et installations électriques BT\".", "Travaux, maintenance sur portail ou clôtures (utiliser \"Vidéosurveillance, gardiennage, sécurisation\")."],
  },
  {
    id: 115, name: "Installation hydraulique", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Pompes de relevage, récupérateur eau de pluie et autres installations hydrauliques autres que VRD et plomberie."],
    mauvaisesPratiques: ["Recherche ou résorption de fuites d'eau en externe : à mettre en \"Assainissement VRD\".", "Recherche ou résorption de fuites d'eau en interne : à mettre en \"Plomberie\".", "Intervention sur un adoucisseur : à mettre en \"Plomberie, sanitaire\"."],
  },
  {
    id: 116, name: "Installations chauffage, ventil. climatisation", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Maintenance, travaux, MEC, études, diagnostics de tous types de chauffage : chaudières, aérothermes, VMC, pompe à chaleur, clim réversible, groupe froid, clim, RCU, etc."],
    mauvaisesPratiques: ["Utiliser pour le forfait E2MT : utiliser \"Maintenance multi techniques - forfait E2MT\".", "Pour le PTP E2MT : utiliser \"Petits Travaux Propriétaire\"."],
  },
  {
    id: 117, name: "Interventions anti-graffiti", code: "", category: "nature", status: "usage_gc",
    bonnesPratiques: ["À ne pas utiliser, usage G&C."],
    mauvaisesPratiques: [],
  },
  {
    id: 118, name: "Interventions anti-vandalisme", code: "", category: "nature", status: "usage_gc",
    bonnesPratiques: ["À ne pas utiliser, usage G&C."],
    mauvaisesPratiques: [],
  },
  {
    id: 119, name: "Maintenance multi techniques - forfait E2MT", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["À utiliser uniquement pour le sous-type \"Contrats de Maintenance Externe - E2MT\"."],
    mauvaisesPratiques: ["Utiliser cette nature de travaux pour un contrat de maintenance autre que le marché E2MT."],
  },
  {
    id: 120, name: "Petits Travaux Propriétaire", code: "", category: "nature", status: "actif",
    anciennement: "Forfait Petit Entretien",
    bonnesPratiques: ["À utiliser uniquement pour le sous-type \"Contrats Petits Travaux du Propriétaire\" et \"Petits Travaux Propriétaires - E2MT\"."],
    mauvaisesPratiques: ["Utiliser cette nature de travaux pour un contrat de maintenance autre que le marché E2MT."],
  },
  {
    id: 121, name: "Plomberie, sanitaire", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Robinetterie, douches, WC, inertage fosse septique.", "Mise en place de compteurs de type télérelève sur les consommations d'eau.", "Recherche ou résorption de fuites d'eau à l'intérieur du bâtiment."],
    mauvaisesPratiques: ["Recherche ou résorption de fuites d'eau à l'extérieur des bâtiments : utiliser \"Assainissement VRD\".", "Réfection ou interventions sur une conduite de gaz : utiliser \"Installations chauffage, ventil. climatisation\"."],
  },
  {
    id: 122, name: "Réhabilitation globale", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Utilisation très rare (CAPEX). Pour une réhabilitation globale emportant plusieurs natures de travaux (clos, couvert et électricité par exemple)."],
    mauvaisesPratiques: ["Petits travaux sur un équipement."],
  },
  {
    id: 123, name: "Structure", code: "", category: "nature", status: "actif",
    bonnesPratiques: ["Travaux, inspection et études de sécurisation de la structure ou de surveillance de son état.", "Étaiement, traitement fissure, épaufrure, purge, pose de filets…"],
    mauvaisesPratiques: ["Réfection dallage (utiliser \"Aménagement intérieur\").", "Déconstructions (utiliser \"Démolition\").", "Réfection toiture (utiliser \"Couvert\").", "Réfection chéneaux (utiliser \"Assainissement VRD\" ou \"Couvert\").", "Création issue de secours (utiliser \"Clos\").", "Réfection faux plafond (utiliser \"Aménagement intérieur\")."],
  },
  {
    id: 124, name: "Vidéosurveillance, gardiennage, sécurisation", code: "", category: "nature", status: "actif",
    anciennement: "Télésurveillance, sûreté",
    bonnesPratiques: ["Mise sous alarme, travaux concernant la vidéo, gardiennage.", "Maintenance et travaux sur les portails et les clôtures."],
    mauvaisesPratiques: [],
  },
  {
    id: 125, name: "Visite de surveillance, contrôle, diag., étude", code: "", category: "nature", status: "actif",
    anciennement: "Visite de surveillance et contrôle",
    bonnesPratiques: ["S'utilise DANS LA MESURE OÙ la visite, l'étude, le diagnostic ou le contrôle ne peut se rattacher à une autre nature de travaux spécifique.", "Ex : une VG touchant à plusieurs corps d'état (clos, couvert, plomberie…) et divers équipements."],
    mauvaisesPratiques: ["Utiliser cette nature de travaux alors qu'elle pourrait être associée à une nature spécifique : clos, couvert, BT, structure.", "Ex : une AT du sous-type VRE doit se rattacher à \"Eclairage et installations électriques BT\".", "Un audit incendie se rattache à \"Equipements de sécurité incendie\".", "Les audits énergétiques rentrent dans \"Audits et Etudes Energétiques\"."],
  },
];

// ─── Sous-types figés/supprimés ──────────────────────────────────
const sousTypesFiges = [
  { name: "Contre expertise amiante", redirect: "Diagnostic Amiante", reason: "Détail inutile pour les reportings" },
  { name: "Contrôle périodique amiante", redirect: "Diagnostic Amiante", reason: "Détail inutile pour les reportings" },
  { name: "Gros Entretien IST CCE", redirect: "Gros Entretien + gérant IST", reason: "Détail inutile" },
  { name: "Groupe de visites techniques et réglementaires", redirect: "", reason: "Utilisation réduite et sans objet" },
  { name: "Maintenance élargie chauffage ventilation climat.", redirect: "", reason: "Utilisation réduite et sans objet" },
  { name: "RFF CIME GOE Autres", redirect: "", reason: "Plus utilisé et sans objet" },
  { name: "Travaux Enlèvement Amiante Non Friable", redirect: "Travaux de Désamiantage", reason: "Niveau de détail inutile" },
];

const statusConfig = {
  actif: { label: "Actif", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  ne_plus_utiliser: { label: "Ne plus utiliser", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  usage_gc: { label: "Usage G&C", color: "bg-gray-100 text-gray-500 border-gray-200", icon: Info },
};

// ═══════════════════════════════════════════════════════════════════
// ASSISTANT DE NOMMAGE - Arbre de décision interactif
// ═══════════════════════════════════════════════════════════════════

type WizardStep = {
  id: string;
  question: string;
  helpText?: string;
  options: {
    label: string;
    description?: string;
    nextStep?: string;
    result?: { sousType: string; code: string; nature: string; explication: string };
  }[];
};

const wizardSteps: WizardStep[] = [
  {
    id: "start",
    question: "Quelle est la nature générale de votre intervention ?",
    helpText: "Choisissez la catégorie qui correspond le mieux à votre besoin.",
    options: [
      { label: "Travaux / Réparation / Remplacement", description: "Intervention physique sur un équipement ou un bâtiment", nextStep: "travaux_type" },
      { label: "Maintenance préventive / Forfait", description: "Entretien planifié, contrat de maintenance", nextStep: "maintenance_type" },
      { label: "Visite / Diagnostic / Étude / Audit", description: "Inspection, contrôle, vérification réglementaire", nextStep: "visite_type" },
      { label: "Mise en conformité (MEC)", description: "Suite à un rapport de visite ou une obligation réglementaire", nextStep: "mec_type" },
      { label: "Amiante", description: "Diagnostic amiante ou travaux de désamiantage", nextStep: "amiante_type" },
      { label: "Énergie / Décarbonation", description: "Audit énergétique, relamping LED, GTB, isolation, PAC…", nextStep: "energie_result" },
    ],
  },
  {
    id: "travaux_type",
    question: "Les travaux sont-ils réalisés via le contrat E2MT² ?",
    helpText: "Le contrat E2MT² est le marché de maintenance multi-technique. Si les travaux sont réalisés par un autre prestataire, choisissez 'Hors E2MT'.",
    options: [
      { label: "Oui, via le contrat E2MT²", description: "Travaux connexes réalisés par le prestataire E2MT", nextStep: "travaux_e2mt_montant" },
      { label: "Non, hors E2MT²", description: "Travaux réalisés par un prestataire externe", nextStep: "travaux_hors_e2mt_montant" },
    ],
  },
  {
    id: "travaux_e2mt_montant",
    question: "Le montant des travaux est-il inférieur à 3 500 € HT ?",
    helpText: "Le seuil de 3 500 € HT détermine s'il s'agit de Petits Travaux Propriétaire (PTP) ou de Gros Entretiens (GE). Voir COGC pour les détails.",
    options: [
      { label: "Oui, inférieur à 3 500 € HT", description: "Petits travaux via E2MT", nextStep: "travaux_e2mt_ptp_domaine" },
      { label: "Non, supérieur ou égal à 3 500 € HT", description: "Gros travaux via E2MT", nextStep: "travaux_e2mt_ge_domaine" },
    ],
  },
  {
    id: "travaux_hors_e2mt_montant",
    question: "Le montant des travaux est-il inférieur à 3 500 € HT ?",
    helpText: "Le seuil de 3 500 € HT détermine s'il s'agit de Petits Travaux Propriétaire (PTP) ou de Gros Entretiens (GE).",
    options: [
      { label: "Oui, inférieur à 3 500 € HT", description: "Petits travaux hors E2MT", nextStep: "travaux_hors_ptp_domaine" },
      { label: "Non, supérieur ou égal à 3 500 € HT", description: "Gros travaux hors E2MT", nextStep: "travaux_hors_ge_domaine" },
    ],
  },
  {
    id: "travaux_e2mt_ptp_domaine",
    question: "Quel est le domaine technique des travaux ?",
    options: [
      { label: "CVC (chauffage, ventilation, climatisation)", result: { sousType: "Petits Travaux Propriétaires - E2MT", code: "PTP_CMT", nature: "Installations chauffage, ventil. climatisation", explication: "Petits travaux < 3 500 € via E2MT dans le domaine CVC." } },
      { label: "Électricité BT (éclairage, prises, tableaux)", result: { sousType: "Petits Travaux Propriétaires - E2MT", code: "PTP_CMT", nature: "Eclairage et installations électriques BT", explication: "Petits travaux < 3 500 € via E2MT dans le domaine électrique BT." } },
      { label: "Plomberie / Sanitaire", result: { sousType: "Petits Travaux Propriétaires - E2MT", code: "PTP_CMT", nature: "Plomberie, sanitaire", explication: "Petits travaux < 3 500 € via E2MT dans le domaine plomberie." } },
      { label: "Sécurité incendie", result: { sousType: "Petits Travaux Propriétaires - E2MT", code: "PTP_CMT", nature: "Equipements de sécurité incendie", explication: "Petits travaux < 3 500 € via E2MT sur les équipements incendie." } },
      { label: "Autre / Multi-domaine", result: { sousType: "Petits Travaux Propriétaires - E2MT", code: "PTP_CMT", nature: "Petits Travaux Propriétaire", explication: "Petits travaux < 3 500 € via E2MT, nature générique PTP." } },
    ],
  },
  {
    id: "travaux_e2mt_ge_domaine",
    question: "Quel est le domaine technique des travaux ?",
    options: [
      { label: "CVC (chauffage, ventilation, climatisation)", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Installations chauffage, ventil. climatisation", explication: "Gros travaux ≥ 3 500 € via E2MT dans le domaine CVC." } },
      { label: "Électricité BT", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Eclairage et installations électriques BT", explication: "Gros travaux ≥ 3 500 € via E2MT dans le domaine électrique BT." } },
      { label: "Plomberie / Sanitaire", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Plomberie, sanitaire", explication: "Gros travaux ≥ 3 500 € via E2MT dans le domaine plomberie." } },
      { label: "Clos (murs, menuiseries, façade)", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Clos", explication: "Gros travaux ≥ 3 500 € via E2MT sur le clos du bâtiment." } },
      { label: "Couvert (toiture, étanchéité)", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Couvert", explication: "Gros travaux ≥ 3 500 € via E2MT sur la toiture." } },
      { label: "Sécurité incendie", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Equipements de sécurité incendie", explication: "Gros travaux ≥ 3 500 € via E2MT sur les équipements incendie." } },
      { label: "Espaces extérieurs / Élagage", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Espaces extérieurs dont élagage, abattage", explication: "Gros travaux ≥ 3 500 € via E2MT sur les espaces extérieurs." } },
      { label: "VRD / Assainissement", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Assainissement Voierie Réseau Divers, déchet, eau", explication: "Gros travaux ≥ 3 500 € via E2MT en VRD." } },
      { label: "Structure", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Structure", explication: "Gros travaux ≥ 3 500 € via E2MT sur la structure du bâtiment." } },
      { label: "Accessibilité (ascenseur, escalier méca.)", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Accessibilité (Asc, escalier mécanique…) élévateur", explication: "Gros travaux ≥ 3 500 € via E2MT sur les équipements d'accessibilité." } },
      { label: "Aménagement intérieur", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Aménagements intérieurs", explication: "Gros travaux ≥ 3 500 € via E2MT en aménagement intérieur." } },
      { label: "Courant faible / GTB", result: { sousType: "Gros Entretiens - par E2MT", code: "GE_CMT", nature: "Courant faible (téléphonie, automatisme, GTB…)", explication: "Gros travaux ≥ 3 500 € via E2MT en courant faible." } },
    ],
  },
  {
    id: "travaux_hors_ptp_domaine",
    question: "Quel est le domaine technique des travaux ?",
    options: [
      { label: "CVC (chauffage, ventilation, climatisation)", result: { sousType: "Contrats Petits Travaux du Propriétaire", code: "PTP", nature: "Installations chauffage, ventil. climatisation", explication: "Petits travaux < 3 500 € hors E2MT dans le domaine CVC." } },
      { label: "Électricité BT", result: { sousType: "Contrats Petits Travaux du Propriétaire", code: "PTP", nature: "Eclairage et installations électriques BT", explication: "Petits travaux < 3 500 € hors E2MT dans le domaine électrique BT." } },
      { label: "Plomberie / Sanitaire", result: { sousType: "Contrats Petits Travaux du Propriétaire", code: "PTP", nature: "Plomberie, sanitaire", explication: "Petits travaux < 3 500 € hors E2MT dans le domaine plomberie." } },
      { label: "Sécurité incendie", result: { sousType: "Contrats Petits Travaux du Propriétaire", code: "PTP", nature: "Equipements de sécurité incendie", explication: "Petits travaux < 3 500 € hors E2MT sur les équipements incendie." } },
      { label: "Autre / Multi-domaine", result: { sousType: "Contrats Petits Travaux du Propriétaire", code: "PTP", nature: "Petits Travaux Propriétaire", explication: "Petits travaux < 3 500 € hors E2MT, nature générique PTP." } },
    ],
  },
  {
    id: "travaux_hors_ge_domaine",
    question: "Quel est le domaine technique des travaux ?",
    options: [
      { label: "CVC (chauffage, ventilation, climatisation)", result: { sousType: "Gros Entretiens", code: "GE", nature: "Installations chauffage, ventil. climatisation", explication: "Gros travaux ≥ 3 500 € hors E2MT dans le domaine CVC." } },
      { label: "Électricité BT", result: { sousType: "Gros Entretiens", code: "GE", nature: "Eclairage et installations électriques BT", explication: "Gros travaux ≥ 3 500 € hors E2MT dans le domaine électrique BT." } },
      { label: "Plomberie / Sanitaire", result: { sousType: "Gros Entretiens", code: "GE", nature: "Plomberie, sanitaire", explication: "Gros travaux ≥ 3 500 € hors E2MT dans le domaine plomberie." } },
      { label: "Clos (murs, menuiseries, façade)", result: { sousType: "Gros Entretiens", code: "GE", nature: "Clos", explication: "Gros travaux ≥ 3 500 € hors E2MT sur le clos du bâtiment." } },
      { label: "Couvert (toiture, étanchéité)", result: { sousType: "Gros Entretiens", code: "GE", nature: "Couvert", explication: "Gros travaux ≥ 3 500 € hors E2MT sur la toiture." } },
      { label: "Sécurité incendie", result: { sousType: "Gros Entretiens", code: "GE", nature: "Equipements de sécurité incendie", explication: "Gros travaux ≥ 3 500 € hors E2MT sur les équipements incendie." } },
      { label: "Espaces extérieurs / Élagage", result: { sousType: "Gros Entretiens", code: "GE", nature: "Espaces extérieurs dont élagage, abattage", explication: "Gros travaux ≥ 3 500 € hors E2MT sur les espaces extérieurs." } },
      { label: "VRD / Assainissement", result: { sousType: "Gros Entretiens", code: "GE", nature: "Assainissement Voierie Réseau Divers, déchet, eau", explication: "Gros travaux ≥ 3 500 € hors E2MT en VRD." } },
      { label: "Structure", result: { sousType: "Gros Entretiens", code: "GE", nature: "Structure", explication: "Gros travaux ≥ 3 500 € hors E2MT sur la structure." } },
      { label: "Accessibilité (ascenseur, escalier méca.)", result: { sousType: "Gros Entretiens", code: "GE", nature: "Accessibilité (Asc, escalier mécanique…) élévateur", explication: "Gros travaux ≥ 3 500 € hors E2MT sur les équipements d'accessibilité." } },
      { label: "Démolition / Déconstruction", result: { sousType: "Gros Entretiens", code: "GE", nature: "Démolitions - suppressions bâtiments équipements", explication: "Déconstruction sélective hors E2MT." } },
      { label: "Réhabilitation globale (multi-corps d'état)", result: { sousType: "Gros Entretiens", code: "GE", nature: "Réhabilitation globale", explication: "Réhabilitation globale emportant plusieurs natures de travaux, hors E2MT." } },
    ],
  },
  {
    id: "maintenance_type",
    question: "De quel type de maintenance s'agit-il ?",
    options: [
      { label: "Forfait E2MT² (maintenance multi-technique)", description: "Prise en charge annuelle E2MT", result: { sousType: "Contrats de Maintenance Externe - E2MT", code: "CME_CMT", nature: "Maintenance multi techniques - forfait E2MT", explication: "Forfait de maintenance multi-technique du contrat E2MT²." } },
      { label: "Contrat externe (ascenseurs, nettoyage, gardiennage…)", description: "Autre contrat de maintenance que l'E2MT", result: { sousType: "Contrats de Maintenance Externe", code: "CME", nature: "Visite de surveillance, contrôle, diag., étude", explication: "Contrat de maintenance externe autre que l'E2MT (ascenseurs, nettoyage, gardiennage, location…)." } },
      { label: "Maintenance préventive électrique (MPS/PAM)", description: "Entretien postes HT/BT", result: { sousType: "Energie Electrique MPS", code: "EE_MPS", nature: "Distribution HT et MT - Postes de livr./transf.", explication: "Maintenance préventive électrique (MPS, PAM) sur postes HT/BT." } },
      { label: "Maintenance locative", description: "Entretien à la charge du locataire", result: { sousType: "Maintenance Locative", code: "ML", nature: "Visite de surveillance, contrôle, diag., étude", explication: "Maintenance à la charge du locataire." } },
      { label: "Travaux locatifs", description: "Travaux à la charge du locataire", result: { sousType: "Travaux locatifs", code: "TL", nature: "Aménagements intérieurs", explication: "Travaux à la charge du locataire." } },
    ],
  },
  {
    id: "visite_type",
    question: "De quel type de visite ou diagnostic s'agit-il ?",
    options: [
      { label: "Visite réglementaire électrique (VRE)", description: "Contrôle réglementaire des installations électriques", result: { sousType: "Visite réglementaire énergie électrique", code: "VTR_EE", nature: "Eclairage et installations électriques BT", explication: "Visite réglementaire électrique (VRE). La nature de travaux est \"Eclairage et installations électriques BT\"." } },
      { label: "Autre vérification réglementaire", description: "Ascenseurs, incendie, gaz, chauffage…", nextStep: "vtr_domaine" },
      { label: "Visite de Gestion (VG)", description: "Diagnostic structurel sur bâtiment classique", result: { sousType: "Visites de Gestion", code: "VTRNR", nature: "Visite de surveillance, contrôle, diag., étude", explication: "Visite de Gestion sur bâtiment classique." } },
      { label: "Visite de Gestion Bâtiment Non Courant", description: "Ouvrage d'art, grande halle, verrière…", result: { sousType: "Visites de Gestion des Bâtiments Non Courants", code: "VGBNC", nature: "Structure", explication: "VG sur bâtiment particulier (ouvrage d'art, grande halle, verrière…)." } },
      { label: "Visite technique / Étude / Audit (non réglementaire)", description: "Hors obligations réglementaires et hors VG", result: { sousType: "Visite tech audit étude (hors réglementaire et VG)", code: "VTRNR", nature: "Visite de surveillance, contrôle, diag., étude", explication: "Visite technique, étude ou audit non réglementaire et hors Visite de Gestion." } },
      { label: "Accompagnement diagnostic (ABE)", description: "Accompagnement par ABE hors VRE", result: { sousType: "Accompagnement diagnostic", code: "VTR ACC DIAG", nature: "Visite de surveillance, contrôle, diag., étude", explication: "Accompagnement par ABE pour des missions hors VRE." } },
    ],
  },
  {
    id: "vtr_domaine",
    question: "Quel domaine concerne la vérification réglementaire ?",
    options: [
      { label: "Ascenseurs", result: { sousType: "Vérifications Réglementaires", code: "VTR", nature: "Accessibilité (Asc, escalier mécanique…) élévateur", explication: "Vérification réglementaire sur ascenseurs." } },
      { label: "Sécurité incendie", result: { sousType: "Vérifications Réglementaires", code: "VTR", nature: "Equipements de sécurité incendie", explication: "Vérification réglementaire sur les équipements de sécurité incendie." } },
      { label: "CVC / Chauffage / Gaz", result: { sousType: "Vérifications Réglementaires", code: "VTR", nature: "Installations chauffage, ventil. climatisation", explication: "Vérification réglementaire CVC / chauffage / gaz." } },
      { label: "Autre domaine", result: { sousType: "Vérifications Réglementaires", code: "VTR", nature: "Visite de surveillance, contrôle, diag., étude", explication: "Vérification réglementaire dans un domaine non spécifique." } },
    ],
  },
  {
    id: "mec_type",
    question: "La mise en conformité concerne-t-elle le domaine électrique ?",
    helpText: "Les MEC électriques (suite à VRE ou MPS) ont un sous-type dédié.",
    options: [
      { label: "Oui, MEC électrique (suite VRE ou MPS)", result: { sousType: "Mise en conformité énergie électrique", code: "MEC_EE", nature: "Eclairage et installations électriques BT", explication: "Mise en conformité électrique suite à VRE ou MPS." } },
      { label: "Non, autre MEC (incendie, ascenseurs, chauffage…)", nextStep: "mec_autre_domaine" },
    ],
  },
  {
    id: "mec_autre_domaine",
    question: "Quel domaine concerne la mise en conformité ?",
    options: [
      { label: "Sécurité incendie", result: { sousType: "Mise en conformité réglementaire autre", code: "MEC_RAU", nature: "Equipements de sécurité incendie", explication: "MEC sur les équipements de sécurité incendie." } },
      { label: "Ascenseurs / Accessibilité", result: { sousType: "Mise en conformité réglementaire autre", code: "MEC_RAU", nature: "Accessibilité (Asc, escalier mécanique…) élévateur", explication: "MEC sur les ascenseurs ou équipements d'accessibilité." } },
      { label: "CVC / Chauffage", result: { sousType: "Mise en conformité réglementaire autre", code: "MEC_RAU", nature: "Installations chauffage, ventil. climatisation", explication: "MEC sur les installations CVC / chauffage." } },
      { label: "Autre domaine", result: { sousType: "Mise en conformité réglementaire autre", code: "MEC_RAU", nature: "Visite de surveillance, contrôle, diag., étude", explication: "MEC dans un domaine non spécifique." } },
    ],
  },
  {
    id: "amiante_type",
    question: "S'agit-il d'un diagnostic ou de travaux de désamiantage ?",
    options: [
      { label: "Diagnostic amiante (DTA, DAAT, diagnostic initial)", result: { sousType: "Diagnostic Amiante", code: "VTR AMIA INIT", nature: "Visite de surveillance, contrôle, diag., étude", explication: "Diagnostic amiante : DTA, DAAT ou diagnostic initial." } },
      { label: "Travaux de désamiantage / encapsulage / DVA", nextStep: "desamiantage_domaine" },
    ],
  },
  {
    id: "desamiantage_domaine",
    question: "Quelle partie du bâtiment est concernée par le désamiantage ?",
    helpText: "On associe la nature de travaux à la partie du bâtiment ou l'équipement concerné.",
    options: [
      { label: "Clos (murs, menuiseries)", result: { sousType: "Travaux de Désamiantage", code: "TDA", nature: "Clos", explication: "Désamiantage sur le clos du bâtiment." } },
      { label: "Couvert (toiture)", result: { sousType: "Travaux de Désamiantage", code: "TDA", nature: "Couvert", explication: "Désamiantage sur la toiture." } },
      { label: "CVC / Chauffage", result: { sousType: "Travaux de Désamiantage", code: "TDA", nature: "Installations chauffage, ventil. climatisation", explication: "Désamiantage sur les installations CVC." } },
      { label: "Plomberie / Sanitaire", result: { sousType: "Travaux de Désamiantage", code: "TDA", nature: "Plomberie, sanitaire", explication: "Désamiantage sur les installations de plomberie." } },
      { label: "Autre / Général", result: { sousType: "Travaux de Désamiantage", code: "TDA", nature: "Visite de surveillance, contrôle, diag., étude", explication: "Désamiantage général ou multi-domaine." } },
    ],
  },
  {
    id: "energie_result",
    question: "Quel type d'action énergie / décarbonation ?",
    options: [
      { label: "Audit énergétique / Étude thermique", result: { sousType: "Economies d'énergie, décarbonation", code: "CA EE", nature: "Audits et Etudes Energétiques", explication: "Audit énergétique ou étude thermique." } },
      { label: "Relamping / Passage en LED", result: { sousType: "Economies d'énergie, décarbonation", code: "CA EE", nature: "Eclairage et installations électriques BT", explication: "Relamping ou passage en LED dans le cadre de la décarbonation." } },
      { label: "Télérelève / Plan de comptage", result: { sousType: "Economies d'énergie, décarbonation", code: "CA EE", nature: "Installations chauffage, ventil. climatisation", explication: "Mise en place de télérelève ou plan de comptage." } },
      { label: "GTB / Régulation", result: { sousType: "Economies d'énergie, décarbonation", code: "CA EE", nature: "Courant faible (téléphonie, automatisme, GTB…)", explication: "Installation ou mise à jour de GTB / régulation." } },
      { label: "Isolation / PAC / RCU / Sortie fuel", result: { sousType: "Economies d'énergie, décarbonation", code: "CA EE", nature: "Installations chauffage, ventil. climatisation", explication: "Travaux d'isolation, PAC, RCU ou sortie du fuel." } },
      { label: "Recherche de fuites", result: { sousType: "Economies d'énergie, décarbonation", code: "CA EE", nature: "Plomberie, sanitaire", explication: "Recherche de fuites dans le cadre des économies d'énergie." } },
    ],
  },
];

// ─── Wizard Component ────────────────────────────────────────────
function NommageWizard() {
  const [, setLocation] = useLocation();
  const [currentStepId, setCurrentStepId] = useState("start");
  const [history, setHistory] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<{ sousType: string; code: string; nature: string; explication: string } | null>(null);

  const currentStep = wizardSteps.find((s) => s.id === currentStepId);
  const progressPercent = Math.min(100, ((history.length + 1) / 5) * 100);

  const handleNext = () => {
    if (selectedOption === null || !currentStep) return;
    const option = currentStep.options[parseInt(selectedOption)];
    if (!option) return;

    if (option.result) {
      setResult(option.result);
    } else if (option.nextStep) {
      setHistory([...history, currentStepId]);
      setCurrentStepId(option.nextStep);
      setSelectedOption(null);
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentStepId(prev);
    setSelectedOption(null);
    setResult(null);
  };

  const handleReset = () => {
    setCurrentStepId("start");
    setHistory([]);
    setSelectedOption(null);
    setResult(null);
  };

  if (result) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-emerald-800">Nommage recommandé</CardTitle>
                <p className="text-sm text-emerald-600 mt-0.5">Voici le sous-type et la nature de travaux à utiliser</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-[#0C1E3C]" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sous-type</span>
                </div>
                <p className="text-base font-bold text-[#0C1E3C]">{result.sousType}</p>
                <Badge variant="outline" className="font-mono text-xs mt-2">{result.code}</Badge>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Hammer className="h-4 w-4 text-[#E05206]" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nature de travaux</span>
                </div>
                <p className="text-base font-bold text-[#0C1E3C]">{result.nature}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Explication</span>
              </div>
              <p className="text-sm text-foreground">{result.explication}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Nouvelle recherche
          </Button>
          <Button
            onClick={() => {
              const params = new URLSearchParams();
              params.set("sousType", result.sousType);
              params.set("sousTypeCode", result.code);
              params.set("nature", result.nature);
              params.set("explication", result.explication);
              setLocation(`/interventions/new?${params.toString()}`);
            }}
            className="gap-2 bg-[#0C1E3C] hover:bg-[#162d52]"
          >
            <PlusCircle className="h-4 w-4" />
            Créer une intervention avec ce nommage
          </Button>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Étape {history.length + 1}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0C1E3C] to-[#E05206] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <Card className="border-l-4 border-l-[#0C1E3C]">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#0C1E3C] flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base text-[#0C1E3C]">{currentStep.question}</CardTitle>
              {currentStep.helpText && (
                <p className="text-sm text-muted-foreground mt-1">{currentStep.helpText}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedOption ?? ""}
            onValueChange={(val) => setSelectedOption(val)}
            className="space-y-2"
          >
            {currentStep.options.map((option, idx) => (
              <div key={idx} className="relative">
                <Label
                  htmlFor={`option-${idx}`}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-[#E05206]/50 hover:bg-orange-50/30 ${
                    selectedOption === String(idx)
                      ? "border-[#E05206] bg-orange-50/50 shadow-sm"
                      : "border-border"
                  }`}
                >
                  <RadioGroupItem value={String(idx)} id={`option-${idx}`} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                    {option.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={history.length > 0 ? handleBack : handleReset}
          className="gap-2"
          disabled={history.length === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedOption === null}
          className="gap-2 bg-[#0C1E3C] hover:bg-[#162d52]"
        >
          Suivant
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function NommagePage() {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<NomenclatureItem | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const filteredSousTypes = useMemo(() => {
    return sousTypes.filter((item) => {
      const matchesSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.bonnesPratiques.some(bp => bp.toLowerCase().includes(search.toLowerCase()));
      const matchesActive = !showOnlyActive || item.status === "actif";
      return matchesSearch && matchesActive;
    });
  }, [search, showOnlyActive]);

  const filteredNatures = useMemo(() => {
    return naturesTravaux.filter((item) => {
      const matchesSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.bonnesPratiques.some(bp => bp.toLowerCase().includes(search.toLowerCase()));
      const matchesActive = !showOnlyActive || item.status === "actif";
      return matchesSearch && matchesActive;
    });
  }, [search, showOnlyActive]);

  if (selectedItem) {
    const cfg = statusConfig[selectedItem.status];
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setSelectedItem(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#E05206] transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la nomenclature
          </button>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${selectedItem.category === "sous-type" ? "bg-[#0C1E3C]" : "bg-[#E05206]"}`}>
              {selectedItem.category === "sous-type" ? (
                <Layers className="h-6 w-6 text-white" />
              ) : (
                <Hammer className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0C1E3C]">{selectedItem.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {selectedItem.code && (
                  <Badge variant="outline" className="font-mono text-xs">{selectedItem.code}</Badge>
                )}
                <Badge variant="outline" className={cfg.color}>
                  <cfg.icon className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Badge>
                <Badge variant="outline">
                  {selectedItem.category === "sous-type" ? "Sous-type" : "Nature de travaux"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {selectedItem.anciennement && (
          <Card className="border-l-4 border-l-amber-400">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Anciennement :</span> {selectedItem.anciennement}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Bonnes pratiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem.bonnesPratiques.length > 0 ? (
                <div className="space-y-2">
                  {selectedItem.bonnesPratiques.map((bp, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <p className="text-sm text-foreground">{bp}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Aucune bonne pratique spécifique.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Mauvaises pratiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem.mauvaisesPratiques.length > 0 ? (
                <div className="space-y-2">
                  {selectedItem.mauvaisesPratiques.map((mp, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <p className="text-sm text-foreground">{mp}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Aucune mauvaise pratique identifiée.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0C1E3C]">Nommage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Nomenclature Immosis 2026 — Sous-types et natures de travaux
        </p>
      </div>

      <Tabs defaultValue="assistant" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="assistant" className="gap-1.5 text-xs sm:text-sm py-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Assistant</span>
          </TabsTrigger>
          <TabsTrigger value="sous-types" className="gap-1.5 text-xs sm:text-sm py-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Sous-types</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{sousTypes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="natures" className="gap-1.5 text-xs sm:text-sm py-2">
            <Hammer className="h-4 w-4" />
            <span className="hidden sm:inline">Natures</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{naturesTravaux.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="supprimes" className="gap-1.5 text-xs sm:text-sm py-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Figés</span>
          </TabsTrigger>
        </TabsList>

        {/* Assistant de nommage */}
        <TabsContent value="assistant" className="mt-6">
          <Card className="mb-6 bg-gradient-to-r from-[#0C1E3C] to-[#1a3a5c] text-white">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-[#E05206]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Assistant de nommage</h2>
                  <p className="text-sm text-white/70 mt-1">
                    Répondez aux questions ci-dessous pour obtenir le bon sous-type et la bonne nature de travaux Immosis.
                    L'assistant vous guide étape par étape en fonction de la nature de l'intervention, du montant, du contrat E2MT² et du domaine technique.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <NommageWizard />
        </TabsContent>

        {/* Sous-types Tab */}
        <TabsContent value="sous-types" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un sous-type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showOnlyActive ? "default" : "outline"}
              onClick={() => setShowOnlyActive(!showOnlyActive)}
              size="sm"
              className={showOnlyActive ? "bg-[#0C1E3C]" : ""}
            >
              Actifs uniquement
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSousTypes.map((item) => {
              const cfg = statusConfig[item.status];
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer hover:shadow-md transition-all hover:border-[#0C1E3C]/30 group ${item.status === "ne_plus_utiliser" ? "opacity-60" : ""}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className={cfg.color + " text-[10px] px-1.5 py-0"}>
                            {cfg.label}
                          </Badge>
                          {item.code && (
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">{item.code}</Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-[#0C1E3C] group-hover:text-[#E05206] transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.bonnesPratiques[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <span className="text-emerald-500">{item.bonnesPratiques.length}</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span className="text-red-500 ml-1">{item.mauvaisesPratiques.length}</span>
                        <XCircle className="h-3 w-3 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {filteredSousTypes.length === 0 && (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun sous-type trouvé</p>
            </div>
          )}
        </TabsContent>

        {/* Natures de travaux Tab */}
        <TabsContent value="natures" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une nature de travaux…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showOnlyActive ? "default" : "outline"}
              onClick={() => setShowOnlyActive(!showOnlyActive)}
              size="sm"
              className={showOnlyActive ? "bg-[#0C1E3C]" : ""}
            >
              Actifs uniquement
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredNatures.map((item) => {
              const cfg = statusConfig[item.status];
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer hover:shadow-md transition-all hover:border-[#E05206]/30 group ${item.status === "usage_gc" ? "opacity-60" : ""}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className={cfg.color + " text-[10px] px-1.5 py-0"}>
                            {cfg.label}
                          </Badge>
                          {item.anciennement && (
                            <span className="text-[10px] text-muted-foreground italic">ex: {item.anciennement}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-[#0C1E3C] group-hover:text-[#E05206] transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.bonnesPratiques[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <span className="text-emerald-500">{item.bonnesPratiques.length}</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span className="text-red-500 ml-1">{item.mauvaisesPratiques.length}</span>
                        <XCircle className="h-3 w-3 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {filteredNatures.length === 0 && (
            <div className="text-center py-12">
              <Hammer className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucune nature de travaux trouvée</p>
            </div>
          )}
        </TabsContent>

        {/* Figés / Supprimés Tab */}
        <TabsContent value="supprimes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Sous-types figés ou supprimés
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ces sous-types ne doivent plus être utilisés. Utilisez les alternatives indiquées.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sousTypesFiges.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground line-through decoration-red-400">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                      {item.redirect && (
                        <p className="text-xs mt-1">
                          <span className="text-muted-foreground">→ Utiliser : </span>
                          <span className="font-medium text-emerald-600">{item.redirect}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
