import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  Calculator,
  ChevronDown,
  ChevronRight,
  Info,
  Euro,
  Clock,
  Shield,
  Scale,
  Percent,
  Building2,
  Wrench,
  Zap,
  Leaf,
  Package,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── MISSIONS DATA ──────────────────────────────────────────────────

type SubMission = {
  code: string;
  label: string;
  description?: string;
};

type Mission = {
  letter: string;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  commandType: string;
  remunerationMode: string;
  subMissions: SubMission[];
};

const missions: Mission[] = [
  {
    letter: "A",
    title: "Déploiement initial et prise en charge",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: Building2,
    commandType: "Bons de commande ponctuels",
    remunerationMode: "Prix unitaires par m² (BPU annexe 4)",
    subMissions: [
      { code: "A1", label: "Déploiement initial", description: "Mise en place des méthodes, organisation, inventaire, état des lieux, paramétrage GMAO" },
      { code: "A2", label: "Prise en charge de nouveaux bâtiments en cours de contrat", description: "Rémunération spécifique si périmètre > 50 équipements à créer dans la GMAO" },
    ],
  },
  {
    letter: "B",
    title: "Coordination et suivi des prestations opérationnelles",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    icon: ClipboardCheck,
    commandType: "Bons de commande annuels (1er janvier – 31 décembre)",
    remunerationMode: "Taux en % appliqué à la rémunération totale de la mission C",
    subMissions: [
      { code: "B", label: "Suivi et coordination", description: "Coordination opérationnelle, reporting, gestion des astreintes, plans de prévention" },
    ],
  },
  {
    letter: "C",
    title: "Exploitation / Maintenance",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: Wrench,
    commandType: "Bons de commande annuels (1er janvier – 31 décembre)",
    remunerationMode: "Prix unitaires par typologie d'équipement (BPU annexe 4)",
    subMissions: [
      { code: "C1a", label: "Chauffage, Ventilation, Climatisation" },
      { code: "C1a", label: "Désenfumage" },
      { code: "C2", label: "Protection incendie" },
      { code: "C3", label: "Fermetures motorisées" },
      { code: "C4", label: "GTC / GTB" },
      { code: "C5", label: "Sécurité incendie" },
      { code: "C6", label: "Clos et couvert" },
      { code: "C7", label: "Électricité courants forts" },
      { code: "C8", label: "Appareils de levage" },
      { code: "C9", label: "Ascenseurs et monte-charges" },
      { code: "C10", label: "Plomberie" },
      { code: "C11", label: "Éclairage" },
      { code: "C12", label: "Équipements et ouvrages de second œuvre" },
      { code: "C13", label: "Électricité courants faibles" },
      { code: "C14", label: "Extincteurs" },
    ],
  },
  {
    letter: "D",
    title: "Prestations connexes",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: Package,
    commandType: "Bons de commande ponctuels (devis) ou récapitulatifs mensuels",
    remunerationMode: "Propositions tarifaires (devis) acceptées par La Société",
    subMissions: [
      { code: "D", label: "Prestations connexes", description: "Audits, travaux complémentaires. Réception obligatoire ≥ 8 000 €HT, possible entre 1 500 et 8 000 €HT sur demande SNCF." },
    ],
  },
  {
    letter: "E",
    title: "Management de l'énergie",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: Leaf,
    commandType: "Ponctuels (audit initial) + annuels (suivi exploitation)",
    remunerationMode: "Bons de commande spécifiques, récapitulatifs annuels communs B/C/E",
    subMissions: [
      { code: "E", label: "Management de l'énergie", description: "Audit énergétique initial et suivi en exploitation des consommations" },
    ],
  },
];

// ─── PÉNALITÉS DATA ──────────────────────────────────────────────────

type Penalite = {
  numero: string;
  objet: string;
  categorie: string;
  description: string;
  seuil: string;
  montant: string;
  montantMin: string;
  cumulable: boolean;
};

const penalites: Penalite[] = [
  { numero: "P1*", objet: "Documents", categorie: "documents", description: "Non-respect délais création/remise/MAJ documents ou bases de données", seuil: "Au-delà des délais fixés au contrat", montant: "100 €HT / document / jour ouvré de retard", montantMin: "100 €HT", cumulable: false },
  { numero: "P1*", objet: "Documents", categorie: "documents", description: "Retard transmission proposition tarifaire (Mission D)", seuil: "Hors délais contractuels de dépannage (MCOR) ou 10 jours (petits travaux)", montant: "100 €HT / jour ouvré de retard", montantMin: "100 €HT", cumulable: false },
  { numero: "P1*", objet: "Documents", categorie: "documents", description: "Non-respect règles contractuelles établissement proposition tarifaire (Mission D)", seuil: "Par constat (limité à 1 par devis)", montant: "100 €HT / anomalie", montantMin: "100 €HT", cumulable: false },
  { numero: "P1*", objet: "Documents", categorie: "documents", description: "Non-signature plan de prévention par Prestataire (10j) ou sous-traitants (30j)", seuil: "Retard > 10j calendaires (Prestataire) ou 30j (sous-traitants)", montant: "100 €HT / jour calendaire de retard", montantMin: "100 €HT", cumulable: false },
  { numero: "P1*", objet: "Documents", categorie: "documents", description: "Non tenue à jour / non présentation documents ou bases de données", seuil: "Par constat", montant: "100 €HT / document / constat", montantMin: "100 €HT", cumulable: false },
  { numero: "P2*", objet: "Attestations", categorie: "documents", description: "Non transmission attestation de vérification, contrôle… sur demande SNCF", seuil: "Par constat", montant: "100 €HT / attestation manquante dans la GED", montantMin: "100 €HT", cumulable: false },
  { numero: "P3", objet: "Documents / Consignes", categorie: "consignes", description: "Non-respect consignes ou dispositions d'un document (PAQ, règlement intérieur, plan de prévention…)", seuil: "Par constat", montant: "250 €HT / constat", montantMin: "250 €HT", cumulable: true },
  { numero: "P4*", objet: "Retard maintenance corrective", categorie: "maintenance", description: "Réparation non effectuée dans les délais contractuels (intervention, dépannage et/ou remise en état définitive)", seuil: "Retard > 2 jours au-delà des délais contractuels", montant: "50 €HT / jour calendaire de retard", montantMin: "50 €HT", cumulable: false },
  { numero: "P5*", objet: "Interventions programmées", categorie: "maintenance", description: "Retard exécution intervention programmée par rapport au planning prévisionnel ou date fixée avec SNCF", seuil: "Retard > 10 jours calendaires", montant: "100 €HT / jour calendaire de retard au-delà des 10 premiers jours", montantMin: "100 €HT", cumulable: false },
  { numero: "P6*", objet: "Outils informatiques (GDI, GMAO, GED)", categorie: "outils", description: "Non tenue à jour d'un outil informatique et/ou de la base de données associée", seuil: "Par constat", montant: "100 €HT / document / constat", montantMin: "100 €HT", cumulable: false },
  { numero: "P7", objet: "Accompagnement bureau de contrôle", categorie: "controle", description: "Absence représentant(s) Prestataire à une visite programmée bureau de contrôle", seuil: "Non signalée au moins 48 heures à l'avance", montant: "150 €HT / constat", montantMin: "150 €HT", cumulable: true },
  { numero: "P8", objet: "Observations bureaux de contrôle / Délais", categorie: "controle", description: "Non-respect délais contractuels pour lever observations bureaux de contrôle", seuil: "Au-delà du délai prévu au contrat", montant: "100 €HT / observation / semaine de retard", montantMin: "100 €HT", cumulable: true },
  { numero: "P9", objet: "Non-conformité contrôles réglementaires / Délais", categorie: "controle", description: "Non-respect délais contractuels pour lever observations contrôles réglementaires réalisés par le Prestataire", seuil: "Au-delà du délai prévu au contrat", montant: "100 €HT / non-conformité / semaine de retard", montantMin: "100 €HT", cumulable: true },
  { numero: "P10", objet: "Période de chauffe", categorie: "exploitation", description: "Non-respect dates transmises par SNCF pour mise en service ou arrêt équipements chauffage ou climatisation", seuil: "Au-delà de 15 jours de retard", montant: "100 €HT / jour calendaire / installation", montantMin: "100 €HT", cumulable: true },
  { numero: "P11", objet: "Dérive énergétique", categorie: "exploitation", description: "Non identification dérive énergétique monitorée (compteur ou sous-compteur)", seuil: "Au-delà de 15 jours de retard suite au constat", montant: "100 €HT / jour calendaire / installation", montantMin: "100 €HT", cumulable: true },
  { numero: "P12", objet: "Confidentialité", categorie: "general", description: "Non-respect clause de confidentialité du contrat", seuil: "Par constat", montant: "1 500 €HT / défaillance constatée", montantMin: "1 500 €HT", cumulable: true },
  { numero: "P13", objet: "Recouvrement", categorie: "rh", description: "Non-respect obligations relatives au recouvrement des intervenants en cas d'évolution dans l'équipe", seuil: "Par personnel concerné", montant: "100 €HT / jour calendaire manquant", montantMin: "100 €HT", cumulable: true },
  { numero: "P14", objet: "Insertion activité économique", categorie: "insertion", description: "Non-respect obligations d'insertion et Prestataire ne démontre pas avoir mis en œuvre tous les moyens", seuil: "Non réalisation totalité heures d'insertion prévues", montant: "60 €HT / heure d'insertion non réalisée", montantMin: "60 €HT", cumulable: true },
  { numero: "P15", objet: "Insertion activité économique", categorie: "insertion", description: "Retard ou non validation par l'acheteur dans la transmission du reporting de suivi de l'obligation d'insertion", seuil: "Non transmission renseignements après mise en demeure SNCF", montant: "100 €HT / jour calendaire de retard", montantMin: "100 €HT", cumulable: true },
  { numero: "P16", objet: "Insertion activité économique", categorie: "insertion", description: "Retard dans la transmission du bilan de fin de contrat", seuil: "Non transmission du bilan après mise en demeure SNCF", montant: "300 €HT / jour calendaire de retard", montantMin: "300 €HT", cumulable: true },
  { numero: "P17", objet: "RFA – Communication du CA", categorie: "financier", description: "Retard dans la transmission des éléments nécessaires au calcul de la RFA", seuil: "Non communication du CA à l'échéance contractuelle", montant: "50 €HT / jour calendaire de retard", montantMin: "50 €HT", cumulable: true },
  { numero: "P18", objet: "RFA – Retard de paiement", categorie: "financier", description: "Retard dans le paiement de la RFA", seuil: "Non paiement de la RFA à l'échéance contractuelle", montant: "50 €HT / jour calendaire de retard", montantMin: "50 €HT", cumulable: true },
  { numero: "P19", objet: "Documents / Données Restitution", categorie: "documents", description: "Non restitution documents, logiciels, bases de données renseignées en fin de contrat", seuil: "Dernier jour du contrat : intégralité des documents et bases de données à jour", montant: "1/20ème du prix global des prestations missions A à C sur la durée entière du contrat", montantMin: "—", cumulable: true },
];

const categoriesPenalites = [
  { value: "all", label: "Toutes" },
  { value: "documents", label: "Documents" },
  { value: "consignes", label: "Consignes" },
  { value: "maintenance", label: "Maintenance" },
  { value: "outils", label: "Outils informatiques" },
  { value: "controle", label: "Contrôle / Bureau" },
  { value: "exploitation", label: "Exploitation" },
  { value: "general", label: "Général" },
  { value: "rh", label: "RH" },
  { value: "insertion", label: "Insertion" },
  { value: "financier", label: "Financier" },
];

// ─── LIVRABLES DATA ──────────────────────────────────────────────────

type Livrable = {
  phase: string;
  label: string;
  delai: string;
};

type LivrableGroup = {
  title: string;
  mission: string;
  livrables: Livrable[];
};

const livrablesGroups: LivrableGroup[] = [
  {
    title: "Mise en place des méthodes et de l'organisation",
    mission: "A1",
    livrables: [
      { phase: "Organisation", label: "Organigramme opérationnel des équipes de démarrage", delai: "15 jours calendaires" },
      { phase: "Organisation", label: "Liste des intervenants phase déploiement (CV + fiches poste)", delai: "15 jours calendaires" },
      { phase: "Organisation", label: "Planning général de déploiement", delai: "15 jours + MAJ mensuelle" },
      { phase: "Organisation", label: "Organigramme opérationnel équipes exploitation courante", delai: "3 mois" },
      { phase: "Organisation", label: "Liste des intervenants exploitation courante (CV + fiches poste)", delai: "4 mois" },
      { phase: "Organisation", label: "Plan de formation des intervenants exploitation courante", delai: "4 mois (formations dans 5 mois)" },
      { phase: "Organisation", label: "Plannings prévisionnels permanences sites ou conventions sites postes", delai: "5 mois" },
      { phase: "Sous-traitance", label: "Dossier de déclaration des sous-traitants", delai: "3 mois" },
      { phase: "Sous-traitance", label: "Tableau récapitulatif de la sous-traitance", delai: "5 mois" },
      { phase: "Qualité", label: "Plan d'assurance qualité", delai: "5 mois" },
      { phase: "Qualité", label: "Plan de réversibilité", delai: "3 mois" },
      { phase: "Sécurité", label: "Procédure d'astreinte", delai: "3 mois" },
      { phase: "Sécurité", label: "Guides d'astreinte", delai: "Trame type 2 mois, déploiement 5 mois" },
      { phase: "Sécurité", label: "Plans de prévention (concertation SNCF)", delai: "5 mois" },
      { phase: "Sécurité", label: "Tableau de suivi avancement plans de prévention", delai: "30 jours + MAJ mensuelle" },
    ],
  },
  {
    title: "Inventaire, état des lieux et prise en charge",
    mission: "A1",
    livrables: [
      { phase: "Prise en charge", label: "Note méthodologique de prise en charge", delai: "30 jours calendaires" },
      { phase: "Prise en charge", label: "Planning de prise en charge", delai: "30 jours + MAJ semestrielle" },
      { phase: "Prise en charge", label: "Restitution données prise en charge et état des lieux globaux", delai: "2 mois" },
      { phase: "Inventaire", label: "Ensemble inventaires équipements actualisés et complétés + état des lieux", delai: "4 mois" },
      { phase: "Inventaire", label: "Étiquetage des équipements", delai: "5 mois (ou lors 1ère maintenance)" },
      { phase: "Prise en charge", label: "Signature PV de prise en charge", delai: "5 mois maximum" },
    ],
  },
  {
    title: "GMAO et GED",
    mission: "A1",
    livrables: [
      { phase: "GMAO", label: "Liste de comptes à créer (selon profil)", delai: "2 mois" },
      { phase: "GMAO", label: "Données de paramétrage général", delai: "5 mois" },
      { phase: "GMAO", label: "Plan annuel de maintenance", delai: "5 mois" },
      { phase: "GMAO", label: "Trame des rapports (RLAM, RLAA, RMA, RAA)", delai: "5 mois" },
    ],
  },
  {
    title: "Prise en charge de nouveaux bâtiments en cours de contrat",
    mission: "A2",
    livrables: [
      { phase: "Organisation", label: "MAJ organisation opérationnelle (intervenants, plannings, permanences, outillage…)", delai: "Selon périmètre" },
      { phase: "Sous-traitance", label: "Dossiers déclaration sous-traitants et MAJ tableau récapitulatif", delai: "Selon périmètre" },
      { phase: "Sécurité", label: "Guide d'astreinte", delai: "30 jours (si périmètre > 50 équipements)" },
      { phase: "Sécurité", label: "Plan de prévention et MAJ tableau de suivi", delai: "30 jours (si périmètre > 50 équipements)" },
      { phase: "Inventaire", label: "Inventaire équipements, états des lieux, PV de prise en charge", delai: "120 mois maximum" },
      { phase: "GMAO", label: "Intégration GMAO", delai: "Selon périmètre" },
      { phase: "Général", label: "Ensemble des autres livrables et actions nécessaires à l'intégration du(des) site(s)", delai: "Selon périmètre" },
    ],
  },
];

// ─── COMPOSANTS ──────────────────────────────────────────────────

function MissionsTab() {
  const [expandedMission, setExpandedMission] = useState<string | null>("C");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Le contrat E2MT² est structuré en 5 missions (A à E). En tant que pilotes SNCF, nous émettons les bons de commande et contrôlons l'exécution.
        </p>
      </div>

      {missions.map((mission) => {
        const isExpanded = expandedMission === mission.letter;
        const Icon = mission.icon;
        return (
          <Card key={mission.letter} className={`border ${mission.borderColor} overflow-hidden transition-all`}>
            <button
              className={`w-full text-left ${mission.bgColor} px-5 py-4 flex items-center justify-between hover:opacity-90 transition-opacity`}
              onClick={() => setExpandedMission(isExpanded ? null : mission.letter)}
            >
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg bg-white/80 flex items-center justify-center shadow-sm`}>
                  <Icon className={`h-5 w-5 ${mission.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${mission.color} border-current font-bold text-sm px-2`}>
                      Mission {mission.letter}
                    </Badge>
                    <span className="font-semibold text-foreground">{mission.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{mission.commandType}</p>
                </div>
              </div>
              {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </button>

            {isExpanded && (
              <CardContent className="pt-4 pb-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Type de commande</p>
                    <p className="text-sm font-medium">{mission.commandType}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Mode de rémunération</p>
                    <p className="text-sm font-medium">{mission.remunerationMode}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sous-missions</p>
                  <div className="space-y-2">
                    {mission.subMissions.map((sub, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white border rounded-lg p-3">
                        <Badge variant="secondary" className="shrink-0 font-mono text-xs mt-0.5">{sub.code}</Badge>
                        <div>
                          <p className="text-sm font-medium">{sub.label}</p>
                          {sub.description && <p className="text-xs text-muted-foreground mt-1">{sub.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function PenalitesTab() {
  const [search, setSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("all");

  const filtered = useMemo(() => {
    return penalites.filter((p) => {
      const matchSearch = search === "" ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.objet.toLowerCase().includes(search.toLowerCase()) ||
        p.numero.toLowerCase().includes(search.toLowerCase());
      const matchCategorie = categorieFilter === "all" || p.categorie === categorieFilter;
      return matchSearch && matchCategorie;
    });
  }, [search, categorieFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <p className="text-sm text-muted-foreground">
          19 pénalités contractuelles (P1 à P19). Cumulables, plafonnées à <strong>20% du montant annuel HT des missions B+C+E</strong>. Les pénalités marquées * ne sont pas cumulables avec les indicateurs clés sur le même objet et le même mois.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une pénalité…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categoriesPenalites.map((cat) => (
            <Button
              key={cat.value}
              variant={categorieFilter === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCategorieFilter(cat.value)}
              className="text-xs h-8"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} pénalité{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
      </div>

      <div className="space-y-2">
        {filtered.map((p, i) => (
          <PenaliteCard key={i} penalite={p} />
        ))}
      </div>
    </div>
  );
}

function PenaliteCard({ penalite }: { penalite: Penalite }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${penalite.numero} - ${penalite.objet}\n${penalite.description}\nSeuil : ${penalite.seuil}\nPénalité : ${penalite.montant}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Pénalité copiée");
    setTimeout(() => setCopied(false), 2000);
  };

  const getMontantColor = () => {
    if (penalite.montant.includes("1 500") || penalite.montant.includes("1/20")) return "text-red-600 bg-red-50";
    if (penalite.montant.includes("250") || penalite.montant.includes("300")) return "text-orange-600 bg-orange-50";
    if (penalite.montant.includes("150")) return "text-amber-600 bg-amber-50";
    return "text-yellow-700 bg-yellow-50";
  };

  return (
    <Card className="border hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="font-mono text-xs shrink-0">{penalite.numero}</Badge>
              <span className="text-sm font-semibold text-foreground">{penalite.objet}</span>
              {!penalite.cumulable && (
                <Badge variant="secondary" className="text-[10px] shrink-0">Non cumulable avec ICP</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{penalite.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 rounded-md px-2.5 py-1.5">
                <span className="text-muted-foreground">Seuil : </span>
                <span className="font-medium">{penalite.seuil}</span>
              </div>
              <div className={`rounded-md px-2.5 py-1.5 font-semibold ${getMontantColor()}`}>
                {penalite.montant}
              </div>
              <div className="bg-slate-50 rounded-md px-2.5 py-1.5">
                <span className="text-muted-foreground">Minimum : </span>
                <span className="font-medium">{penalite.montantMin}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LivrablesTab() {
  const [expandedGroup, setExpandedGroup] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardCheck className="h-4 w-4 text-emerald-500" />
        <p className="text-sm text-muted-foreground">
          Livrables contractuels de la Mission A (déploiement et prise en charge). Tous les délais sont à compter de la date de prise d'effet de la mission concernée.
        </p>
      </div>

      {livrablesGroups.map((group, gi) => {
        const isExpanded = expandedGroup === gi;
        return (
          <Card key={gi} className="border overflow-hidden">
            <button
              className="w-full text-left bg-slate-50 px-5 py-3.5 flex items-center justify-between hover:bg-slate-100 transition-colors"
              onClick={() => setExpandedGroup(isExpanded ? null : gi)}
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs shrink-0">Mission {group.mission}</Badge>
                <span className="font-semibold text-sm">{group.title}</span>
                <Badge variant="secondary" className="text-xs">{group.livrables.length} livrables</Badge>
              </div>
              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </button>

            {isExpanded && (
              <CardContent className="p-0">
                <div className="divide-y">
                  {group.livrables.map((livrable, li) => (
                    <div key={li} className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">{livrable.phase}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{livrable.label}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{livrable.delai}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ChiffresClesTab() {
  const chiffres = [
    {
      icon: Shield,
      title: "Plafond des pénalités",
      value: "20%",
      description: "du montant annuel HT des missions B + C + E",
      detail: "Les pénalités sont cumulables et déduites du bon de commande annuel suivant. Pour la dernière année du contrat, elles font l'objet d'avoirs.",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      icon: Percent,
      title: "Remise de Fin d'Année (RFA)",
      value: "3%",
      description: "du CA global HT dès le 1er euro",
      detail: "Calculée à chaque date anniversaire du contrat. Le Titulaire transmet le déclaratif de CA dans un délai d'1 mois après la date anniversaire.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Clock,
      title: "Délai de paiement",
      value: "60 jours",
      description: "à compter de la réception de la facture",
      detail: "Paiement net par virement, après réception des prestations et vérification de la facture. La Société peut retenir d'office les créances liquides et exigibles.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: Euro,
      title: "Seuil réception Mission D",
      value: "8 000 €HT",
      description: "réception obligatoire pour opérations importantes",
      detail: "Possible entre 1 500 et 8 000 €HT sur demande SNCF. Réception tacite si pas de notification dans les 30 jours après achèvement.",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      icon: Scale,
      title: "Réfaction maintenance préventive",
      value: "Formule R",
      description: "R = (1 - taux réalisation) × (Montant B+C au T3) / 2",
      detail: "Taux calculé au 15 janvier N+1. Exemple : taux 97%, rémunération 100k€ → réfaction = 1 500 €HT. Opérations non clôturées au 15 janvier = non réalisées.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Zap,
      title: "Révision des prix",
      value: "Annuelle au 1er janvier",
      description: "Prix fixes jusqu'au 31/12/2026",
      detail: "Formule : P = P0 × [0,15 + 0,70 × (ICHTrevTS-IME / ICHTrevTS-IME₀) + 0,15 × (FSD2 / FSD2₀)]. Clause de sauvegarde si variation > 3%/an ou > 12% vs P0.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="h-4 w-4 text-blue-500" />
        <p className="text-sm text-muted-foreground">
          Paramètres financiers et contractuels clés du contrat E2MT². Ces chiffres sont issus du CPS et de ses annexes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chiffres.map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} className="border overflow-hidden hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl ${item.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.title}</p>
                    <p className={`text-2xl font-bold ${item.color} mt-0.5`}>{item.value}</p>
                    <p className="text-sm text-foreground font-medium mt-1">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Annexes du contrat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { num: "1", label: "Cahier des charges + sous-annexes (Ax 1.1 à 1.6)" },
              { num: "2", label: "Synthèse des livrables" },
              { num: "3", label: "Indicateurs clés de performance et Pénalités" },
              { num: "4", label: "BPU, Scénario de commande et Minimum Garanti" },
              { num: "5", label: "Évaluation de la charge de travail" },
              { num: "6", label: "Procès-verbal de réception" },
              { num: "7", label: "Reporting insertion" },
              { num: "8", label: "Sous-traitance données personnelles" },
              { num: "9", label: "Description traitement données personnelles" },
              { num: "10", label: "Fiche sécurité fournisseurs" },
              { num: "11", label: "Charte travaux et interventions en gare" },
              { num: "12", label: "Charte Chantier Vert + SOGED" },
            ].map((annexe) => (
              <div key={annexe.num} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-md hover:bg-slate-50">
                <Badge variant="outline" className="text-[10px] font-mono shrink-0 w-7 justify-center">
                  {annexe.num}
                </Badge>
                <span className="text-muted-foreground">{annexe.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────

export default function ReferentielContratPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0C1E3C] tracking-tight">Référentiel Contrat E2MT²</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Données contractuelles de référence — CPS, annexes, missions, pénalités et livrables
        </p>
      </div>

      <Tabs defaultValue="missions" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-11">
          <TabsTrigger value="missions" className="text-xs sm:text-sm gap-1.5">
            <Wrench className="h-4 w-4 hidden sm:block" />
            Missions
          </TabsTrigger>
          <TabsTrigger value="penalites" className="text-xs sm:text-sm gap-1.5">
            <AlertTriangle className="h-4 w-4 hidden sm:block" />
            Pénalités
          </TabsTrigger>
          <TabsTrigger value="livrables" className="text-xs sm:text-sm gap-1.5">
            <ClipboardCheck className="h-4 w-4 hidden sm:block" />
            Livrables
          </TabsTrigger>
          <TabsTrigger value="chiffres" className="text-xs sm:text-sm gap-1.5">
            <Calculator className="h-4 w-4 hidden sm:block" />
            Chiffres clés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="mt-4">
          <MissionsTab />
        </TabsContent>
        <TabsContent value="penalites" className="mt-4">
          <PenalitesTab />
        </TabsContent>
        <TabsContent value="livrables" className="mt-4">
          <LivrablesTab />
        </TabsContent>
        <TabsContent value="chiffres" className="mt-4">
          <ChiffresClesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
