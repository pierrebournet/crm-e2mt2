import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

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

const allItems = [...sousTypes, ...naturesTravaux];

const statusConfig = {
  actif: { label: "Actif", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  ne_plus_utiliser: { label: "Ne plus utiliser", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  usage_gc: { label: "Usage G&C", color: "bg-gray-100 text-gray-500 border-gray-200", icon: Info },
};

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
          {/* Bonnes pratiques */}
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
                <p className="text-sm text-muted-foreground italic">Aucune bonne pratique spécifiée.</p>
              )}
            </CardContent>
          </Card>

          {/* Mauvaises pratiques */}
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
                <p className="text-sm text-muted-foreground italic">Aucune mauvaise pratique spécifiée.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0C1E3C] tracking-tight">Nommage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nomenclature des sous-types et natures de travaux Immosis — Bon usage 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Layers className="h-3 w-3 mr-1" />
            {sousTypes.length} sous-types
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Hammer className="h-3 w-3 mr-1" />
            {naturesTravaux.length} natures
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un sous-type, une nature de travaux ou un mot-clé…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showOnlyActive ? "default" : "outline"}
          size="sm"
          onClick={() => setShowOnlyActive(!showOnlyActive)}
          className={showOnlyActive ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          Actifs uniquement
        </Button>
      </div>

      <Tabs defaultValue="sous-types">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sous-types" className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Sous-types ({filteredSousTypes.length})
          </TabsTrigger>
          <TabsTrigger value="natures" className="flex items-center gap-1.5">
            <Hammer className="h-3.5 w-3.5" />
            Natures de travaux ({filteredNatures.length})
          </TabsTrigger>
          <TabsTrigger value="supprimes" className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Figés / Supprimés
          </TabsTrigger>
        </TabsList>

        {/* Sous-types Tab */}
        <TabsContent value="sous-types" className="mt-4">
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
