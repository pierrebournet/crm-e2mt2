import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  Building2,
  FileText,
  Hash,
  Layers,
  Users,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// ===== DATA =====

interface CodeComparison {
  champ: string;
  ancien2025: string;
  nouveau2026: string;
  description?: string;
}

const CODES_COMPTABLES: CodeComparison[] = [
  { champ: "Entité GL", ancien2025: "13402 (DI Prestataires)", nouveau2026: "65910 (CSP Autres)" },
  { champ: "Division", ancien2025: "02136 (DI FM Env Travail)", nouveau2026: "65924 (DI)" },
  { champ: "RG (Responsabilité de gestion)", ancien2025: "02533 (ET Grand Sud)", nouveau2026: "00138 (Optimisat Gest Tech DIT Sud)" },
  { champ: "Département comptable", ancien2025: "06305 (Multitech GS)", nouveau2026: "néant" },
  { champ: "BUAP", ancien2025: "01418 (Factures)", nouveau2026: "00043 (Factures)" },
  { champ: "BUPO", ancien2025: "01425 (DA/CDA/RECEP)", nouveau2026: "67099 (DA/CDA/RECEP)" },
];

interface FamilleTravaux {
  enveloppe: string;
  codeZG: string;
  libelleZG: string;
  type: "proprietaire" | "locatif";
}

const FAMILLES_TRAVAUX: FamilleTravaux[] = [
  { enveloppe: "Contrat de Maintenance", codeZG: "ZG360720", libelleZG: "P - Contrats de maintenance", type: "proprietaire" },
  { enveloppe: "Contrôles et Visites Réglementaires", codeZG: "ZG360840", libelleZG: "P - Contrôles et Visites Réglementaires", type: "proprietaire" },
  { enveloppe: "Diagnostics, audits non réglementaires et autres dépenses", codeZG: "ZG361050", libelleZG: "P - Diagnostics / Audits non réglementaires / Autres", type: "proprietaire" },
  { enveloppe: "Gros entretien et réparations (GER)", codeZG: "ZG360910", libelleZG: "P - Gros entretiens", type: "proprietaire" },
  { enveloppe: "MEC suite Contrôles et Visites Réglementaires", codeZG: "ZG361040", libelleZG: "P - MEC suite Contrôles et Visites Réglementaires", type: "proprietaire" },
  { enveloppe: "Petits Travaux Propriétaire", codeZG: "ZG361820", libelleZG: "P - Petits travaux propriétaire", type: "proprietaire" },
  { enveloppe: "Maintenance Locative", codeZG: "ZG361599", libelleZG: "L - Maintenance locative", type: "locatif" },
  { enveloppe: "Travaux Locatifs", codeZG: "ZG361699", libelleZG: "L - Travaux locatifs", type: "locatif" },
];

interface SousType {
  libelle: string;
  ancienneEnveloppe: string;
  nouvelleFamille: string;
  statut: "ok" | "renomme" | "nouveau" | "supprime";
  ancienNom?: string;
}

const SOUS_TYPES: SousType[] = [
  { libelle: "Contrats de Maintenance Externe", ancienneEnveloppe: "CME/PTP", nouvelleFamille: "Contrat de Maintenance", statut: "ok" },
  { libelle: "Contrats de maintenance externe - E2MT²", ancienneEnveloppe: "CME/PTP", nouvelleFamille: "Contrat de Maintenance", statut: "renomme", ancienNom: "Contrats de maintenance - CMT" },
  { libelle: "Contrats de Maintenance Interne", ancienneEnveloppe: "CME/PTP", nouvelleFamille: "Contrat de Maintenance", statut: "ok" },
  { libelle: "Maintenance Élargie Énergie Électrique", ancienneEnveloppe: "CME/PTP", nouvelleFamille: "Contrat de Maintenance", statut: "ok" },
  { libelle: "Énergie Électrique MPS", ancienneEnveloppe: "CME/PTP", nouvelleFamille: "Contrat de Maintenance", statut: "ok" },
  { libelle: "Accompagnement diagnostic", ancienneEnveloppe: "VR", nouvelleFamille: "Contrôle et Visites Réglementaires", statut: "ok" },
  { libelle: "Diagnostic amiante", ancienneEnveloppe: "AM", nouvelleFamille: "Contrôle et Visites Réglementaires", statut: "renomme", ancienNom: "Diagnostic Initial Amiante" },
  { libelle: "Vérifications Réglementaires", ancienneEnveloppe: "VR", nouvelleFamille: "Contrôle et Visites Réglementaires", statut: "ok" },
  { libelle: "Visite réglementaire énergie électrique", ancienneEnveloppe: "VR", nouvelleFamille: "Contrôle et Visites Réglementaires", statut: "ok" },
  { libelle: "Visites de Gestion des Bâtiments Non Courants", ancienneEnveloppe: "VR", nouvelleFamille: "Contrôle et Visites Réglementaires", statut: "ok" },
  { libelle: "Économies d'énergie, décarbonation", ancienneEnveloppe: "GE", nouvelleFamille: "Diag, VG, audit non réglementaires", statut: "renomme", ancienNom: "Campagne d'économies d'énergies" },
  { libelle: "Visites de Gestion", ancienneEnveloppe: "VR", nouvelleFamille: "Diag, VG, audit non réglementaires", statut: "ok" },
  { libelle: "Visites tech audit étude (hors réglementaire et VG)", ancienneEnveloppe: "VR", nouvelleFamille: "Gros entretien et réparation GER", statut: "nouveau" },
  { libelle: "Gros Entretiens", ancienneEnveloppe: "GE", nouvelleFamille: "Gros entretien et réparation GER", statut: "ok" },
  { libelle: "Gros entretiens - par E2MT²", ancienneEnveloppe: "GE", nouvelleFamille: "Gros entretien et réparation GER", statut: "renomme", ancienNom: "Gros entretiens - CMT" },
  { libelle: "Travaux de Désamiantage", ancienneEnveloppe: "AM", nouvelleFamille: "Gros entretien et réparation GER", statut: "ok" },
  { libelle: "Mise en conformité énergie électrique", ancienneEnveloppe: "GE", nouvelleFamille: "MEC suite Contrôles et Visites Réglementaires", statut: "ok" },
  { libelle: "Mise en conformité réglementaire autre", ancienneEnveloppe: "GE", nouvelleFamille: "MEC suite Contrôles et Visites Réglementaires", statut: "nouveau" },
  { libelle: "Contrats Petits Travaux du Propriétaire", ancienneEnveloppe: "CME/PTP", nouvelleFamille: "Petits Travaux Propriétaire", statut: "ok" },
  { libelle: "Petits travaux propriétaires - E2MT²", ancienneEnveloppe: "CME/PTP", nouvelleFamille: "Petits Travaux Propriétaire", statut: "renomme", ancienNom: "Petits travaux propriétaires - CMT" },
  { libelle: "Maintenance Locative", ancienneEnveloppe: "ML", nouvelleFamille: "Maintenance Locative", statut: "ok" },
  { libelle: "Travaux Locatifs", ancienneEnveloppe: "TL", nouvelleFamille: "Travaux Locatif", statut: "ok" },
  { libelle: "Déconstructions Sélectives SNCF", ancienneEnveloppe: "DS", nouvelleFamille: "DS", statut: "ok" },
  // Supprimés
  { libelle: "Maintenance Élargie Chauffage Ventilation Climat.", ancienneEnveloppe: "CME/PTP", nouvelleFamille: "Contrat de Maintenance", statut: "supprime" },
  { libelle: "Contrôle Périodique Amiante", ancienneEnveloppe: "AM", nouvelleFamille: "Contrôle et Visites Réglementaires", statut: "supprime" },
  { libelle: "Groupes de Visites techniques et réglementaires", ancienneEnveloppe: "VR", nouvelleFamille: "Contrôle et Visites Réglementaires", statut: "supprime" },
  { libelle: "Gros Entretien IST CCE", ancienneEnveloppe: "GE", nouvelleFamille: "Gros entretien et réparation GER", statut: "supprime" },
  { libelle: "Travaux Enlèvement Amiante Non Friable", ancienneEnveloppe: "AM", nouvelleFamille: "Gros entretien et réparation GER", statut: "supprime" },
  { libelle: "Contre Expertise Amiante", ancienneEnveloppe: "AM", nouvelleFamille: "Contrôle, VR et VG", statut: "supprime" },
  { libelle: "RFF CIM GOE Autres", ancienneEnveloppe: "GE", nouvelleFamille: "Gros entretien et réparation GER", statut: "supprime" },
];

interface AxeLocal {
  code: string;
  codePrestataireABE: string;
  proprietaire: string;
  description: string;
}

const AXES_LOCAUX: AxeLocal[] = [
  { code: "T", codePrestataireABE: "TP", proprietaire: "SNCF PABE + RH IST", description: "T pour TIERS, TP pour prestataire ABE" },
  { code: "R", codePrestataireABE: "RP", proprietaire: "Réseau", description: "R pour TIERS, RP pour prestataire ABE" },
  { code: "M", codePrestataireABE: "MP", proprietaire: "Voyageurs", description: "M pour TIERS, MP pour prestataire ABE (N peut aussi être utilisé)" },
  { code: "F", codePrestataireABE: "FP", proprietaire: "Fret", description: "F pour TIERS, FP pour prestataire ABE" },
  { code: "L", codePrestataireABE: "L", proprietaire: "Maintenance locative", description: "Pas de changement" },
];

const CODES_FOURNISSEUR_ABE = [
  { code: "59167", nom: "ABE LANGUEDOC ROUSSILLON" },
  { code: "59166", nom: "ABE PACA" },
  { code: "59160", nom: "ABE TOULOUSE" },
];

interface GerantGroupe {
  categorie: "GP PROPRIETAIRES" | "GP LOCATIFS";
  sa: string;
  gerants: { nom: string; concerneDITGS: boolean }[];
}

const GERANTS_PROGRAMME: GerantGroupe[] = [
  {
    categorie: "GP PROPRIETAIRES",
    sa: "SA VOYAGEURS",
    gerants: [
      { nom: "AUTRES VOYAGEURS", concerneDITGS: true },
      { nom: "COMBUSTIBLE", concerneDITGS: true },
      { nom: "TRACTION", concerneDITGS: true },
      { nom: "DI POUR RHL", concerneDITGS: true },
      { nom: "VOYAGEURS TRAVAUX A LA DEMANDE", concerneDITGS: true },
      { nom: "ISM TER PROVENCE ALPES COTE D'AZUR", concerneDITGS: true },
      { nom: "ISM TER OCCITANIE", concerneDITGS: true },
      { nom: "HORS ISM TER", concerneDITGS: true },
      { nom: "ISM TGV AXE SUD EST", concerneDITGS: true },
      { nom: "ISM TGV AXE ATLANTIQUE", concerneDITGS: true },
      { nom: "HORS ISM TGV", concerneDITGS: true },
      { nom: "MATERIEL TI NEVERS LANGUEDOC", concerneDITGS: true },
      { nom: "MATERIEL ISM", concerneDITGS: true },
      { nom: "MATERIEL AUTRES", concerneDITGS: true },
      { nom: "ISM INTERCITES", concerneDITGS: false },
      { nom: "ISM TRANSILIEN", concerneDITGS: false },
      { nom: "HORS ISM TRANSILIEN", concerneDITGS: false },
      { nom: "ISM TER GRAND EST", concerneDITGS: false },
      { nom: "ISM TER HAUTS DE France", concerneDITGS: false },
      { nom: "ISM TER NORMANDIE", concerneDITGS: false },
      { nom: "ISM TER CENTRE VAL DE LOIRE", concerneDITGS: false },
      { nom: "ISM TER PAYS DE LOIRE", concerneDITGS: false },
      { nom: "ISM TER BRETAGNE", concerneDITGS: false },
      { nom: "ISM TER AUVERGNE RHONE ALPES", concerneDITGS: false },
      { nom: "ISM TER BOURGOGNE FRANCHE COMTE", concerneDITGS: false },
      { nom: "ISM TER NOUVELLE AQUITAINE", concerneDITGS: false },
      { nom: "ISM TGV AXE EST", concerneDITGS: false },
      { nom: "ISM TGV AXE NORD", concerneDITGS: false },
      { nom: "MATERIEL TI BISCHHEIM", concerneDITGS: false },
      { nom: "MATERIEL TI ROMILLY", concerneDITGS: false },
      { nom: "MATERIEL TI HELLEMMES", concerneDITGS: false },
      { nom: "MATERIEL TI ROUEN QUATRE-MARES", concerneDITGS: false },
      { nom: "MATERIEL TI PICARDIE", concerneDITGS: false },
      { nom: "MATERIEL TI RENNES", concerneDITGS: false },
      { nom: "MATERIEL TI SPDC", concerneDITGS: false },
      { nom: "MATERIEL TI VENISSIEUX", concerneDITGS: false },
      { nom: "MATERIEL TICP PERIGUEUX", concerneDITGS: false },
      { nom: "MATERIEL TICP SAINTES", concerneDITGS: false },
    ],
  },
  {
    categorie: "GP PROPRIETAIRES",
    sa: "EX FRET",
    gerants: [
      { nom: "C32", concerneDITGS: true },
      { nom: "TECHNIS", concerneDITGS: true },
      { nom: "HEXAFRET", concerneDITGS: true },
    ],
  },
  {
    categorie: "GP PROPRIETAIRES",
    sa: "SA RESEAU",
    gerants: [
      { nom: "RESEAU FERROVIAIRE", concerneDITGS: true },
      { nom: "RESEAU INDUSTRIEL", concerneDITGS: true },
      { nom: "RESEAU SOCIAL", concerneDITGS: true },
      { nom: "RESEAU TERTIAIRE", concerneDITGS: true },
      { nom: "RESEAU TRAVAUX A LA DEMANDE", concerneDITGS: true },
    ],
  },
  {
    categorie: "GP PROPRIETAIRES",
    sa: "SA SNCF",
    gerants: [
      { nom: "SNCF", concerneDITGS: true },
      { nom: "DI POUR RH IST", concerneDITGS: true },
    ],
  },
  {
    categorie: "GP PROPRIETAIRES",
    sa: "TIERS",
    gerants: [
      { nom: "MAINTENANCE LOCATIVE SUD AZUR", concerneDITGS: true },
      { nom: "MAINTENANCE LOCATIVE ETOILE D'AMIENS", concerneDITGS: false },
      { nom: "MAINTENANCE LOCATIVE VAL DE LOIRE", concerneDITGS: false },
    ],
  },
  {
    categorie: "GP PROPRIETAIRES",
    sa: "SNCF OPTIM SERVICES",
    gerants: [
      { nom: "GIE", concerneDITGS: true },
    ],
  },
  {
    categorie: "GP LOCATIFS",
    sa: "GP LOCATIF",
    gerants: [
      { nom: "MAINTENANCE LOCATIVE INDUSTRIEL & FERROVIAIRE", concerneDITGS: true },
      { nom: "MAINTENANCE LOCATIVE TERTIAIRE & SOCIAL", concerneDITGS: true },
    ],
  },
];

const TOTAL_GERANTS = GERANTS_PROGRAMME.reduce((acc, g) => acc + g.gerants.length, 0);
const TOTAL_CONCERNES = GERANTS_PROGRAMME.reduce((acc, g) => acc + g.gerants.filter((x) => x.concerneDITGS).length, 0);

// ===== COMPONENT =====

type TabId = "codes" | "familles" | "soustypes" | "axes" | "gerants";

export default function Evolutions2026Page() {
  const [activeTab, setActiveTab] = useState<TabId>("codes");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast.success(`${label} copié !`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "codes", label: "Codes comptables", icon: <Hash className="h-4 w-4" /> },
    { id: "familles", label: "6+2 Familles", icon: <Layers className="h-4 w-4" />, count: 8 },
    { id: "soustypes", label: "Sous-types", icon: <FileText className="h-4 w-4" />, count: SOUS_TYPES.length },
    { id: "axes", label: "Axes locaux", icon: <Building2 className="h-4 w-4" /> },
    { id: "gerants", label: "Gérants", icon: <Users className="h-4 w-4" />, count: TOTAL_GERANTS },
  ];

  // Filter sous-types by search
  const filteredSousTypes = useMemo(() => {
    if (!searchQuery) return SOUS_TYPES;
    const q = searchQuery.toLowerCase();
    return SOUS_TYPES.filter(
      (st) =>
        st.libelle.toLowerCase().includes(q) ||
        st.nouvelleFamille.toLowerCase().includes(q) ||
        st.ancienneEnveloppe.toLowerCase().includes(q) ||
        st.statut.toLowerCase().includes(q) ||
        (st.ancienNom && st.ancienNom.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const statutCounts = useMemo(() => {
    return {
      ok: SOUS_TYPES.filter((s) => s.statut === "ok").length,
      renomme: SOUS_TYPES.filter((s) => s.statut === "renomme").length,
      nouveau: SOUS_TYPES.filter((s) => s.statut === "nouveau").length,
      supprime: SOUS_TYPES.filter((s) => s.statut === "supprime").length,
    };
  }, []);

  return (
    <div className="container py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Évolutions Maintenance 2026
            </h1>
            <p className="text-sm text-muted-foreground">
              Nouvelles règles applicables depuis le 1er janvier 2026
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
            <Calendar className="h-3 w-3 mr-1" />
            Applicable depuis 01/01/2026
          </Badge>
          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
            <Info className="h-3 w-3 mr-1" />
            Source : Pôle Exploitation - 05/01/2026
          </Badge>
        </div>
      </div>

      {/* Alert banner */}
      <Card className="mb-6 border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">
                Changement majeur : nouvelle division comptable
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Toutes les commandes liées à l'entretien maintenance doivent désormais être créées dans la{" "}
                <strong>DI historique - Division 65924</strong> (et non plus dans la division 02136).
                Les commandes 2025 pluriannuelles se clôturent normalement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery("");
            }}
            className="gap-1.5"
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {tab.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "codes" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-600" />
                Codes comptables DIT Grand-Sud : 2025 → 2026
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Champ</th>
                      <th className="text-left p-3 font-semibold text-red-600">Ancien (2025)</th>
                      <th className="text-center p-3 w-10"></th>
                      <th className="text-left p-3 font-semibold text-green-600">Nouveau (2026)</th>
                      <th className="text-center p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {CODES_COMPTABLES.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{row.champ}</td>
                        <td className="p-3 text-red-600/80 line-through">{row.ancien2025}</td>
                        <td className="p-3 text-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground inline" />
                        </td>
                        <td className="p-3 font-semibold text-green-700">{row.nouveau2026}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => copyToClipboard(row.nouveau2026.split(" ")[0], row.champ)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copier le code"
                          >
                            {copiedCode === row.champ ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Transition rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Règles de transition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-green-800">
                  Les commandes ouvertes sur 2025 (division 02136) pluriannuelles seront à clôturer normalement en 2026.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  Toutes les nouvelles commandes 2026 doivent être créées sur la <strong>division 65924</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  Les RG renseignées doivent être identiques à celles du champ donneur d'ordre de l'AT dans IMMOSIS.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <XCircle className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">
                  <strong>Non concerné :</strong> Déconstructions sélectives et dépenses mandatées ESSET.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "familles" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-600" />
                6 familles d'opérations propriétaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Enveloppe budgétaire 2026</th>
                      <th className="text-left p-3 font-semibold">Code ZG</th>
                      <th className="text-left p-3 font-semibold">Libellé ZG</th>
                      <th className="text-center p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {FAMILLES_TRAVAUX.filter((f) => f.type === "proprietaire").map((f, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{f.enveloppe}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {f.codeZG}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{f.libelleZG}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => copyToClipboard(f.codeZG, f.enveloppe)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copier le code ZG"
                          >
                            {copiedCode === f.enveloppe ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-600" />
                2 familles locatif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Enveloppe budgétaire 2026</th>
                      <th className="text-left p-3 font-semibold">Code ZG</th>
                      <th className="text-left p-3 font-semibold">Libellé ZG</th>
                      <th className="text-center p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {FAMILLES_TRAVAUX.filter((f) => f.type === "locatif").map((f, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{f.enveloppe}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {f.codeZG}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{f.libelleZG}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => copyToClipboard(f.codeZG, f.enveloppe)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copier le code ZG"
                          >
                            {copiedCode === f.enveloppe ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "soustypes" && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {statutCounts.ok} conservés
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100">
              <Info className="h-3 w-3 mr-1" />
              {statutCounts.renomme} renommés
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {statutCounts.nouveau} nouveaux
            </Badge>
            <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
              <XCircle className="h-3 w-3 mr-1" />
              {statutCounts.supprime} supprimés
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un sous-type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Sous-type</th>
                      <th className="text-left p-3 font-semibold">Anc. enveloppe</th>
                      <th className="text-left p-3 font-semibold">Nouvelle famille 2026</th>
                      <th className="text-center p-3 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSousTypes.map((st, i) => (
                      <tr
                        key={i}
                        className={`border-b hover:bg-muted/30 transition-colors ${
                          st.statut === "supprime" ? "opacity-60" : ""
                        }`}
                      >
                        <td className="p-3">
                          <div>
                            <span className={`font-medium ${st.statut === "supprime" ? "line-through text-red-600" : ""}`}>
                              {st.libelle}
                            </span>
                            {st.ancienNom && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                ex : {st.ancienNom}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {st.ancienneEnveloppe}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{st.nouvelleFamille}</td>
                        <td className="p-3 text-center">
                          {st.statut === "ok" && (
                            <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px]">OK</Badge>
                          )}
                          {st.statut === "renomme" && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">Renommé</Badge>
                          )}
                          {st.statut === "nouveau" && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px]">Nouveau</Badge>
                          )}
                          {st.statut === "supprime" && (
                            <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">Supprimé</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredSousTypes.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Aucun sous-type ne correspond à votre recherche.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "axes" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Axes locaux IMMOSIS 2026
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Nouveauté 2026 :</strong> Le suffixe <strong>P</strong> en 2ème caractère identifie les prestations réalisées par Gares & Connexion / prestataire ABE.
                  Maintenance propriétaire et locative HORS déconstruction sélective.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Propriétaire</th>
                      <th className="text-center p-3 font-semibold">Code TIERS</th>
                      <th className="text-center p-3 font-semibold">Code ABE (nouveau)</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AXES_LOCAUX.map((axe, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{axe.proprietaire}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="font-mono text-sm font-bold">
                            {axe.code}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {axe.codePrestataireABE !== axe.code ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-sm font-bold">
                              {axe.codePrestataireABE}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">inchangé</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{axe.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Codes fournisseur ABE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {CODES_FOURNISSEUR_ABE.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-mono font-bold text-lg">{f.code}</p>
                      <p className="text-xs text-muted-foreground">{f.nom}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(f.code, f.nom)}
                      className="p-1.5 hover:bg-background rounded transition-colors"
                      title="Copier"
                    >
                      {copiedCode === f.nom ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "gerants" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100">
              <Users className="h-3 w-3 mr-1" />
              {TOTAL_GERANTS} gérants au total
            </Badge>
            <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {TOTAL_CONCERNES} concernent la DIT GS
            </Badge>
            <Badge className="bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-100">
              <Info className="h-3 w-3 mr-1" />
              {TOTAL_GERANTS - TOTAL_CONCERNES} hors périmètre DIT GS
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un gérant de programme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Grouped by SA */}
          {GERANTS_PROGRAMME.map((groupe, gi) => {
            const filteredGerants = searchQuery
              ? groupe.gerants.filter((g) => g.nom.toLowerCase().includes(searchQuery.toLowerCase()) || groupe.sa.toLowerCase().includes(searchQuery.toLowerCase()))
              : groupe.gerants;
            if (filteredGerants.length === 0) return null;
            return (
              <Card key={gi}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge
                      className={groupe.categorie === "GP PROPRIETAIRES"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-teal-100 text-teal-800 border-teal-300"
                      }
                    >
                      {groupe.categorie === "GP PROPRIETAIRES" ? "Propriétaire" : "Locatif"}
                    </Badge>
                    <span>{groupe.sa}</span>
                    <span className="text-xs text-muted-foreground font-normal">({filteredGerants.length} gérant{filteredGerants.length > 1 ? "s" : ""})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2.5 font-semibold">Gérant de programme</th>
                          <th className="text-center p-2.5 font-semibold w-28">DIT Grand-Sud</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGerants.map((g, i) => (
                          <tr
                            key={i}
                            className={`border-b hover:bg-muted/30 transition-colors ${
                              !g.concerneDITGS ? "opacity-50" : ""
                            }`}
                          >
                            <td className="p-2.5">
                              <span className={`font-medium ${!g.concerneDITGS ? "text-muted-foreground" : ""}`}>
                                {g.nom}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              {g.concerneDITGS ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 inline" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground/40 inline" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Info box */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Rappel :</strong> Les AT pluriannuelles ouvertes sur l'ancien gérant MATERIEL sont à clôturer et à refaire sur le bon gérant.</p>
                  <p>Les gérants grisés (hors périmètre DIT Grand-Sud) sont affichés à titre informatif.</p>
                  <p>Le gérant <strong>MAINTENANCE SUD AZUR</strong> a été créé depuis 2025 et doit être utilisé avec la famille travaux correspondante (propriétaire ou locatif).</p>
                  <p>Le gérant <strong>GIE</strong> est nouveau en 2026 (SNCF Optim Services).</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
