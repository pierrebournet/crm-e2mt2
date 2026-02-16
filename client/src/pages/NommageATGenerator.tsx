import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Copy,
  CheckCircle2,
  FileText,
  Zap,
  Calendar,
  MapPin,
  Building2,
  Hash,
  ClipboardCheck,
  Table2,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════════
// DONNÉES : Convention de nommage AT
// ═══════════════════════════════════════════════════════════════════

const codesRegion = [
  { code: "47", label: "47 - Occitanie Ouest" },
  { code: "58", label: "58 - PACA" },
  { code: "59", label: "59 - Occitanie Est" },
];

const prestataires = [
  { code: "DI", label: "DI (Direction Immobilière)" },
  { code: "ESBE", label: "ESBE (Prestataire externe)" },
];

const portefeuilles = [
  // ── Réseau (patrimoine confié à TechniGares pour GE, CME/PTP, VR) ──
  { code: "Réseau Industriel", label: "Réseau Industriel", groupe: "Réseau" },
  { code: "Réseau ferroviaire", label: "Réseau Ferroviaire", groupe: "Réseau" },
  { code: "Réseau Tertiaire", label: "Réseau Tertiaire", groupe: "Réseau" },
  { code: "Réseau Social", label: "Réseau Social", groupe: "Réseau" },
  // ── ISM TGV (axes traversant le Grand Sud) ──
  { code: "ISM TGV Axe Atlantique", label: "ISM TGV Axe Atlantique", groupe: "ISM TGV" },
  { code: "ISM TGV Axe Sud Est", label: "ISM TGV Axe Sud Est", groupe: "ISM TGV" },
  { code: "HORS ISM TGV", label: "HORS ISM TGV", groupe: "ISM TGV" },
  // ── ISM TER (régions du Grand Sud) ──
  { code: "ISM TER Occitanie", label: "ISM TER Occitanie", groupe: "ISM TER" },
  { code: "ISM TER Provence Alpes Côte d'Azur", label: "ISM TER Provence Alpes Côte d'Azur", groupe: "ISM TER" },
  { code: "ISM TER Nouvelle aquitaine", label: "ISM TER Nouvelle Aquitaine", groupe: "ISM TER" },
  { code: "HORS ISM TER", label: "HORS ISM TER", groupe: "ISM TER" },
  // ── ISM Autres ──
  { code: "ISM INTERCITES", label: "ISM INTERCITES", groupe: "ISM Autres" },
  { code: "MATERIEL", label: "MATERIEL", groupe: "ISM Autres" },
  // ── Autre Voyageurs ──
  { code: "AUTRE VOYAGEURS", label: "AUTRE VOYAGEURS", groupe: "Autre Voyageurs" },
  // ── Énergie / Traction ──
  { code: "Combustible", label: "Combustible", groupe: "Énergie" },
  { code: "Traction", label: "Traction", groupe: "Énergie" },
  // ── Fret ──
  { code: "DI pour FRET", label: "DI pour FRET", groupe: "Fret" },
  { code: "FRET ISM", label: "FRET ISM", groupe: "Fret" },
  // ── SNCF (holding) ──
  { code: "SNCF", label: "SNCF", groupe: "SNCF" },
];

const typesDepenseAnnuels = [
  { code: "VRE", label: "VRE - Visites réglementaires énergie" },
  { code: "ACCOMP LINKY", label: "ACCOMP LINKY" },
  { code: "PTP E2MT²", label: "PTP E2MT² - Petits travaux E2MT²" },
  { code: "AMO QUADRIM", label: "AMO QUADRIM - AMO Quadrimestriel" },
  { code: "ASC", label: "ASC - Ascenseurs" },
  { code: "MPS ELEC", label: "MPS ELEC - Maintenance préventive électrique" },
  { code: "VG", label: "VG - Visites de gestion" },
  { code: "FORFAIT E2MT²", label: "FORFAIT E2MT²" },
  { code: "CHATEAU EAU", label: "CHATEAU EAU" },
  { code: "DEGRILLEUR", label: "DEGRILLEUR" },
  { code: "PPI", label: "PPI" },
];

const particularites = [
  { code: "", label: "(Aucune)" },
  { code: "OPS", label: "OPS - Optim'Services" },
  { code: "FRUG", label: "FRUG - Frugalité énergétique" },
  { code: "VG", label: "VG - Visite de Gestion" },
];

// ═══════════════════════════════════════════════════════════════════
// DONNÉES : Types IMMOSIS par budget
// ═══════════════════════════════════════════════════════════════════

type ImmosisType = {
  natureDepense: string;
  code: string;
  libelle: string;
  budget: string;
};

const immosisTypes: ImmosisType[] = [
  // Budget GE
  { budget: "GE", natureDepense: "GE - B5", code: "GE", libelle: "Gros Entretiens" },
  { budget: "GE", natureDepense: "GE - B5", code: "GE IST CCE", libelle: "Gros Entretien IST CCE" },
  { budget: "GE", natureDepense: "GE - B5", code: "GE_CMT", libelle: "Gros entretiens - CMT" },
  { budget: "GE", natureDepense: "GE - B5", code: "OGT_CSG", libelle: "Opération de gros travaux" },
  { budget: "GE", natureDepense: "GE - B5", code: "OTGT_CSG", libelle: "Opération de très gros travaux" },
  { budget: "GE", natureDepense: "Étude Faisabilité", code: "EF", libelle: "Étude de Faisabilité" },
  { budget: "GE", natureDepense: "Éco Énergie / DigiWatt / Linky / Audit Citron", code: "CA EE", libelle: "Campagne d'économies d'énergies" },
  { budget: "GE", natureDepense: "", code: "TDR", libelle: "Travaux DE ROBIEN" },
  { budget: "GE", natureDepense: "", code: "TDSC", libelle: "Dépollution des Sites Contaminés" },
  { budget: "GE", natureDepense: "Fréon", code: "TEGR", libelle: "Éradication du Gaz R22" },
  { budget: "GE", natureDepense: "", code: "TEPCB", libelle: "Élimination des PCB" },
  { budget: "GE", natureDepense: "", code: "TRHPE", libelle: "Réseaux Humides - Plan Écarlate" },
  { budget: "GE", natureDepense: "Plomb", code: "TRPB", libelle: "Retrait du Plomb" },
  { budget: "GE", natureDepense: "MEC E", code: "MEC_EE", libelle: "Mise en conformité énergie électrique" },
  { budget: "GE", natureDepense: "Sortie fuel", code: "TRCF", libelle: "Retrait des Cuves Fuel Simple Peau" },
  { budget: "GE", natureDepense: "Fuites / Gestion site", code: "GE", libelle: "Gros Entretiens" },
  // Budget Amiante / VR TVX
  { budget: "AM_VR_TVX", natureDepense: "DTA/DAAT - A3.2", code: "VTR AMIA INIT", libelle: "Diagnostic Initial Amiante" },
  { budget: "AM_VR_TVX", natureDepense: "Trx AM A3.2 / Trx RADON", code: "TDA", libelle: "Travaux de Désamiantage" },
  { budget: "AM_VR_TVX", natureDepense: "Trx AM A3.2", code: "TDANF", libelle: "Travaux Enlèvement Amiante Non Friable" },
  { budget: "AM_VR_TVX", natureDepense: "Expert AM", code: "EXP AMIA", libelle: "Contre Expertise Amiante" },
  { budget: "AM_VR_TVX", natureDepense: "Contr AM", code: "CP AMIA", libelle: "Contrôle Périodique Amiante" },
  { budget: "AM_VR_TVX", natureDepense: "", code: "VSG", libelle: "Visite de suivi de garanties" },
  { budget: "AM_VR_TVX", natureDepense: "RADON", code: "VTR ACC DIAG", libelle: "Accompagnement diagnostic" },
  // Budget VR
  { budget: "VR", natureDepense: "VR E / HT/BT", code: "VTR_EE", libelle: "Visite réglementaire énergie électrique" },
  { budget: "VR", natureDepense: "Visites de Gestion", code: "VTR G", libelle: "Visites de Gestion" },
  { budget: "VR", natureDepense: "BNC", code: "VTR GBNC", libelle: "Visites de Gestion des Bâtiments Non Courants" },
  { budget: "VR", natureDepense: "", code: "VTR GRP", libelle: "Groupes de Visites techniques et réglementaires" },
  { budget: "VR", natureDepense: "VR", code: "VTR PR", libelle: "Vérifications Réglementaires" },
  { budget: "VR", natureDepense: "", code: "VTR_OA_AI_GHV", libelle: "Visite réglementaire intermédiaire GHV, OA, abri" },
  // Budget CME_PTP
  { budget: "CME_PTP", natureDepense: "Forfait E2MT²", code: "CME_CMT", libelle: "Contrats de maintenance externe - CMT" },
  { budget: "CME_PTP", natureDepense: "AMOA", code: "CME", libelle: "Contrats de maintenance externe" },
  { budget: "CME_PTP", natureDepense: "Forfait E2MT² - ESBE", code: "CMI", libelle: "Contrats de Maintenance Interne" },
  { budget: "CME_PTP", natureDepense: "PTP", code: "PTP_CMT", libelle: "Petits travaux propriétaires - CMT" },
  { budget: "CME_PTP", natureDepense: "PTP H", code: "PTP", libelle: "Contrats Petits Travaux du Propriétaire" },
  { budget: "CME_PTP", natureDepense: "", code: "CVC", libelle: "Maintenance Élargie Chauffage Ventilation Climat." },
  { budget: "CME_PTP", natureDepense: "", code: "EE", libelle: "Maintenance Élargie Énergie Électrique" },
  { budget: "CME_PTP", natureDepense: "MPS E", code: "EE_MPS", libelle: "Énergie électrique MPS" },
  { budget: "CME_PTP", natureDepense: "Ascenseurs", code: "CME", libelle: "Contrats de maintenance externe" },
  { budget: "CME_PTP", natureDepense: "Château eau", code: "CME_CMT", libelle: "Contrats de maintenance externe - CMT" },
  { budget: "CME_PTP", natureDepense: "Dégrilleur / PPI", code: "CME", libelle: "Contrats de maintenance externe" },
];

const budgetLabels: Record<string, { label: string; color: string; description: string }> = {
  GE: {
    label: "GE (Gros Entretiens)",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Budget A2.2 / B5 / D2 / E2 / G5 — Gros entretiens, études, énergie, dépollution",
  },
  AM_VR_TVX: {
    label: "Amiante / VR TVX",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Budget A3.2 — Diagnostics amiante, désamiantage, radon, garanties",
  },
  VR: {
    label: "VR (Visites Réglementaires)",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Visites réglementaires énergie électrique, visites de gestion, vérifications",
  },
  CME_PTP: {
    label: "CME / PTP",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Contrats de maintenance externe, petits travaux propriétaires, MPS",
  },
};

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Générateur de noms AT
// ═══════════════════════════════════════════════════════════════════

interface ATNameGeneratorProps {
  assistantSousType?: { sousType: string; code: string } | null;
  onClearAssistant?: () => void;
}

function ATNameGenerator({ assistantSousType, onClearAssistant }: ATNameGeneratorProps) {
  const [typeAT, setTypeAT] = useState<"annuelle" | "ponctuelle">("ponctuelle");
  const [region, setRegion] = useState("58");
  const [annee, setAnnee] = useState(new Date().getFullYear().toString().slice(-2));
  const [prestataire, setPrestataire] = useState("DI");
  const [portefeuille, setPortefeuille] = useState("");
  const [typeDepense, setTypeDepense] = useState("");
  const [sousType, setSousType] = useState("");
  const [particularite, setParticularite] = useState("");
  const [utBat, setUtBat] = useState("");
  const [numDevis, setNumDevis] = useState("");
  const [descriptif, setDescriptif] = useState("");
  const [copied, setCopied] = useState(false);

  // Appliquer le sous-type de l'assistant quand il change
  useEffect(() => {
    if (assistantSousType) {
      // Mapper le code assistant vers un type de dépense annuel si applicable
      const codeMap: Record<string, string> = {
        "PTP": "PTP E2MT\u00b2",
        "CA PTP": "PTP E2MT\u00b2",
        "VRE": "VRE",
        "CA VRE": "VRE",
        "ASC": "ASC",
        "CA ASC": "ASC",
        "MPS": "MPS ELEC",
        "CA MPS": "MPS ELEC",
        "VG": "VG",
        "CA VG": "VG",
        "FORFAIT": "FORFAIT E2MT\u00b2",
        "CA EE": "",
        "CA GE": "",
        "CA AM": "",
      };
      const mappedType = codeMap[assistantSousType.code];
      if (mappedType !== undefined && mappedType !== "") {
        setTypeAT("annuelle");
        setTypeDepense(mappedType);
      } else {
        // Pour les types ponctuels, on met le sous-type dans le champ sous-type
        setTypeAT("ponctuelle");
        setSousType(assistantSousType.code || assistantSousType.sousType.substring(0, 20));
      }
      // Toujours remplir le sous-type pour référence
      setSousType(assistantSousType.code || "");
    }
  }, [assistantSousType]);

  const generatedName = useMemo(() => {
    const parts: string[] = [];

    // Partie commune
    parts.push(region);
    parts.push(annee);
    parts.push(prestataire);
    if (portefeuille) parts.push(portefeuille);

    if (typeAT === "annuelle") {
      if (typeDepense) parts.push(typeDepense);
      parts.push("ANNUEL");
    } else {
      // Ponctuelle
      if (sousType) parts.push(sousType);
      if (particularite) parts.push(particularite);
      if (utBat) parts.push(utBat);
      if (prestataire === "ESBE" && numDevis) parts.push(numDevis);
      if (descriptif) parts.push(descriptif);
    }

    return parts.join("-");
  }, [typeAT, region, annee, prestataire, portefeuille, typeDepense, sousType, particularite, utBat, numDevis, descriptif]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedName).then(() => {
      setCopied(true);
      toast.success("Nom AT copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isComplete = useMemo(() => {
    if (!portefeuille) return false;
    if (typeAT === "annuelle") return !!typeDepense;
    return !!utBat && !!descriptif;
  }, [typeAT, portefeuille, typeDepense, utBat, descriptif]);

  return (
    <div className="space-y-6">
      {/* Header explicatif */}
      <Card className="bg-gradient-to-r from-[#0C1E3C] to-[#1a3a5c] text-white">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 text-[#E05206]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Générateur de noms AT</h2>
              <p className="text-sm text-white/70 mt-1">
                Générez automatiquement le nom de votre AT selon la convention IMMOSIS.
                Chaque élément est séparé par un tiret (-). Remplissez les champs ci-dessous pour obtenir le nom normalisé.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type d'AT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card
          className={`cursor-pointer transition-all border-2 ${
            typeAT === "annuelle"
              ? "border-[#0C1E3C] bg-[#0C1E3C]/5 shadow-md"
              : "border-border hover:border-[#0C1E3C]/30"
          }`}
          onClick={() => setTypeAT("annuelle")}
        >
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                typeAT === "annuelle" ? "bg-[#0C1E3C]" : "bg-slate-100"
              }`}>
                <Calendar className={`h-5 w-5 ${typeAT === "annuelle" ? "text-white" : "text-slate-500"}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">AT Annuelle</p>
                <p className="text-xs text-muted-foreground">Forfait, maintenance récurrente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all border-2 ${
            typeAT === "ponctuelle"
              ? "border-[#E05206] bg-[#E05206]/5 shadow-md"
              : "border-border hover:border-[#E05206]/30"
          }`}
          onClick={() => setTypeAT("ponctuelle")}
        >
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                typeAT === "ponctuelle" ? "bg-[#E05206]" : "bg-slate-100"
              }`}>
                <Zap className={`h-5 w-5 ${typeAT === "ponctuelle" ? "text-white" : "text-slate-500"}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">AT Ponctuelle</p>
                <p className="text-xs text-muted-foreground">Intervention spécifique sur un bâtiment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Champs communs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#0C1E3C]" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Code région
              </Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {codesRegion.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Année (2 chiffres)
              </Label>
              <Input
                value={annee}
                onChange={(e) => setAnnee(e.target.value.slice(0, 2))}
                placeholder="26"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Prestataire
              </Label>
              <Select value={prestataire} onValueChange={setPrestataire}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prestataires.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Propriétaire et portefeuille
            </Label>
            <Select value={portefeuille} onValueChange={setPortefeuille}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un portefeuille" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const groups = Array.from(new Set(portefeuilles.map(p => p.groupe)));
                  return groups.map((groupe, gi) => (
                    <div key={groupe}>
                      {gi > 0 && <div className="h-px bg-border my-1" />}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {groupe}
                      </div>
                      {portefeuilles.filter(p => p.groupe === groupe).map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </div>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Champs spécifiques AT Annuelle */}
      {typeAT === "annuelle" && (
        <Card className="border-l-4 border-l-[#0C1E3C]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#0C1E3C]" />
              AT Annuelle — Type de dépense
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Type de dépense
              </Label>
              <Select value={typeDepense} onValueChange={setTypeDepense}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de dépense" />
                </SelectTrigger>
                <SelectContent>
                  {typesDepenseAnnuels.map((t) => (
                    <SelectItem key={t.code} value={t.code}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700">Exemples d'AT annuelles</span>
              </div>
              <p className="text-xs text-blue-600">
                59-23-ESBE-RES INDUS-MPS ELEC-ANNUEL<br />
                58-23-DI-FRET-PTP E2MT-ANNUEL
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Champs spécifiques AT Ponctuelle */}
      {typeAT === "ponctuelle" && (
        <Card className="border-l-4 border-l-[#E05206]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#E05206]" />
              AT Ponctuelle — Détails de l'intervention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sous-type / Nature (ex: PTP, GE, MEC_EE, VTR...)
              </Label>
              <Input
                value={sousType}
                onChange={(e) => setSousType(e.target.value.toUpperCase())}
                placeholder="PTP, GE, MEC_EE, CA AM, VTR..."
              />
              <p className="text-[10px] text-muted-foreground">
                Renseigné automatiquement depuis l'assistant, ou saisissez manuellement le code du sous-type.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Particularité (optionnel)
                </Label>
                <Select value={particularite} onValueChange={setParticularite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune particularité" />
                  </SelectTrigger>
                  <SelectContent>
                    {particularites.map((p) => (
                      <SelectItem key={p.code || "none"} value={p.code || "none"}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  UT-BAT (ex: 005737JB010)
                </Label>
                <Input
                  value={utBat}
                  onChange={(e) => setUtBat(e.target.value.toUpperCase())}
                  placeholder="005737JB010"
                />
              </div>
            </div>

            {prestataire === "ESBE" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  N° du devis (ESBE uniquement)
                </Label>
                <Input
                  value={numDevis}
                  onChange={(e) => setNumDevis(e.target.value)}
                  placeholder="MP 220 2022"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Descriptif de l'opération
              </Label>
              <Input
                value={descriptif}
                onChange={(e) => setDescriptif(e.target.value)}
                placeholder="Rplct 2 BAES CMPP"
              />
            </div>

            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <Info className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-semibold text-orange-700">Exemples d'AT ponctuelles</span>
              </div>
              <p className="text-xs text-orange-600">
                58-26-DI-ISM TER Occitanie-<strong>PTP</strong>-005737JB010-Rplct 2 BAES CMPP<br />
                59-26-DI-Réseau Industriel-<strong>GE</strong>-OPS-005654VB061-Brochage de fissures<br />
                58-26-ESBE-Réseau Ferroviaire-<strong>MEC_EE</strong>-005654VB061-MP 220 2022-MEC électrique
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultat généré */}
      <Card className={`border-2 transition-all ${isComplete ? "border-emerald-300 bg-emerald-50/30" : "border-dashed border-slate-200"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className={`h-5 w-5 ${isComplete ? "text-emerald-600" : "text-muted-foreground"}`} />
              Nom AT généré
            </CardTitle>
            {isComplete && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copier
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`rounded-xl p-6 text-center ${isComplete ? "bg-white border-2 border-emerald-200" : "bg-slate-50 border border-dashed border-slate-200"}`}>
            <p className={`font-mono leading-relaxed break-all ${
              isComplete ? "text-2xl font-extrabold text-[#0C1E3C]" : "text-lg text-muted-foreground"
            }`}>
              {generatedName || "Remplissez les champs ci-dessus…"}
            </p>
            {!isComplete && (
              <p className="text-xs text-muted-foreground mt-2">
                {!portefeuille
                  ? "Sélectionnez un portefeuille pour commencer"
                  : typeAT === "annuelle"
                  ? "Sélectionnez le type de dépense"
                  : "Renseignez l'UT-BAT et le descriptif"}
              </p>
            )}
          </div>

          {/* Structure visuelle */}
          {isComplete && (
            <div className="mt-4 flex flex-wrap items-center gap-1 justify-center">
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                Région
              </Badge>
              <span className="text-muted-foreground text-xs">-</span>
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                Année
              </Badge>
              <span className="text-muted-foreground text-xs">-</span>
              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                Prestataire
              </Badge>
              <span className="text-muted-foreground text-xs">-</span>
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                Portefeuille
              </Badge>
              <span className="text-muted-foreground text-xs">-</span>
              {typeAT === "annuelle" ? (
                <>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                    Type dépense
                  </Badge>
                  <span className="text-muted-foreground text-xs">-</span>
                  <Badge variant="outline" className="text-[10px] bg-[#0C1E3C] text-white">
                    ANNUEL
                  </Badge>
                </>
              ) : (
                <>
                  {sousType && (
                    <>
                      <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 font-bold">
                        Sous-type
                      </Badge>
                      <span className="text-muted-foreground text-xs">-</span>
                    </>
                  )}
                  {particularite && particularite !== "none" && (
                    <>
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        Particularité
                      </Badge>
                      <span className="text-muted-foreground text-xs">-</span>
                    </>
                  )}
                  <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">
                    UT-BAT
                  </Badge>
                  {prestataire === "ESBE" && numDevis && (
                    <>
                      <span className="text-muted-foreground text-xs">-</span>
                      <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                        N° Devis
                      </Badge>
                    </>
                  )}
                  <span className="text-muted-foreground text-xs">-</span>
                  <Badge variant="outline" className="text-[10px] bg-[#E05206]/10 text-[#E05206] border-[#E05206]/20">
                    Descriptif
                  </Badge>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT : Table des types IMMOSIS
// ═══════════════════════════════════════════════════════════════════

function ImmosisTypesTable() {
  const [search, setSearch] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<string>("all");
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set(["GE", "AM_VR_TVX", "VR", "CME_PTP"]));

  const filteredTypes = useMemo(() => {
    return immosisTypes.filter((t) => {
      const matchesSearch =
        !search ||
        t.code.toLowerCase().includes(search.toLowerCase()) ||
        t.libelle.toLowerCase().includes(search.toLowerCase()) ||
        t.natureDepense.toLowerCase().includes(search.toLowerCase());
      const matchesBudget = selectedBudget === "all" || t.budget === selectedBudget;
      return matchesSearch && matchesBudget;
    });
  }, [search, selectedBudget]);

  const groupedTypes = useMemo(() => {
    const groups: Record<string, ImmosisType[]> = {};
    for (const t of filteredTypes) {
      if (!groups[t.budget]) groups[t.budget] = [];
      groups[t.budget].push(t);
    }
    return groups;
  }, [filteredTypes]);

  const toggleBudget = (budget: string) => {
    setExpandedBudgets((prev) => {
      const next = new Set(prev);
      if (next.has(budget)) next.delete(budget);
      else next.add(budget);
      return next;
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success(`Code "${code}" copié`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#0C1E3C] to-[#1a3a5c] text-white">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Table2 className="h-6 w-6 text-[#E05206]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Types IMMOSIS</h2>
              <p className="text-sm text-white/70 mt-1">
                Table de référence des {immosisTypes.length} types IMMOSIS répartis en 4 budgets.
                Chaque type correspond à un code à sélectionner dans IMMOSIS lors de la création d'une AT.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un type, code ou nature de dépense…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedBudget} onValueChange={setSelectedBudget}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Tous les budgets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les budgets</SelectItem>
            {Object.entries(budgetLabels).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Résultats par budget */}
      {Object.entries(groupedTypes).map(([budget, types]) => {
        const cfg = budgetLabels[budget];
        if (!cfg) return null;
        const isExpanded = expandedBudgets.has(budget);

        return (
          <Card key={budget} className="overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => toggleBudget(budget)}
            >
              <div className="flex items-center gap-3">
                <Badge className={`${cfg.color} text-xs`}>{cfg.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {types.length} type{types.length > 1 ? "s" : ""}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {isExpanded && (
              <>
                <div className="px-5 pb-2">
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                </div>
                <div className="border-t">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Nature dépense
                          </th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Code IMMOSIS
                          </th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Libellé
                          </th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                            Copier
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {types.map((t, idx) => (
                          <tr
                            key={`${t.code}-${idx}`}
                            className="border-b last:border-0 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {t.natureDepense || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className="font-mono text-xs cursor-pointer hover:bg-[#0C1E3C] hover:text-white transition-colors"
                                onClick={() => handleCopyCode(t.code)}
                              >
                                {t.code}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground">
                              {t.libelle}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleCopyCode(t.code)}
                              >
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </Card>
        );
      })}

      {filteredTypes.length === 0 && (
        <div className="text-center py-12">
          <Table2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun type IMMOSIS trouvé</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT : Composant principal avec onglets
// ═══════════════════════════════════════════════════════════════════

interface NommageATSectionProps {
  assistantSousType?: { sousType: string; code: string } | null;
  onClearAssistant?: () => void;
}

export default function NommageATSection({ assistantSousType, onClearAssistant }: NommageATSectionProps) {
  return (
    <Tabs defaultValue="generateur" className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-auto">
        <TabsTrigger value="generateur" className="gap-1.5 text-xs sm:text-sm py-2">
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Générateur AT</span>
          <span className="sm:hidden">Générateur</span>
        </TabsTrigger>
        <TabsTrigger value="types" className="gap-1.5 text-xs sm:text-sm py-2">
          <Table2 className="h-4 w-4" />
          <span className="hidden sm:inline">Types IMMOSIS</span>
          <span className="sm:hidden">Types</span>
          <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{immosisTypes.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="generateur" className="mt-6">
        <ATNameGenerator assistantSousType={assistantSousType} onClearAssistant={onClearAssistant} />
      </TabsContent>

      <TabsContent value="types" className="mt-6">
        <ImmosisTypesTable />
      </TabsContent>
    </Tabs>
  );
}
