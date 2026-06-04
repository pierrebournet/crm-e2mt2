import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Download, Search, ArrowUpDown, Info, TrendingUp, Euro, FileText, Calendar } from "lucide-react";

const penalitesData = [
  {
    id: "P1",
    type: "P1 - Retard PDP",
    justification: "Art. 27.1 CPS & RMA p.3",
    otDocuments: "Global (RMA)",
    constat: "Taux de couverture PDP \u00e0 52% (390/748) au 31/03. Probl\u00e8me avec un sous-traitant qui ne signe pas.",
    calcul: "100\u20ac/jour calendaire (estimation \u00e0 affiner sur le nombre de jours de retard pour chaque PDP manquant)",
    montant: null as number | null,
    montantLabel: "\u00c0 d\u00e9terminer (potentiellement tr\u00e8s \u00e9lev\u00e9 si >30j pour SST)",
    statut: "a_determiner",
    categorie: "pdp",
    periode: "Mars 2026",
    criticite: "haute",
  },
  {
    id: "P3",
    type: "P3 - Non-respect Consignes/PAQ",
    justification: "Art. 27.1 CPS & RMA p.5",
    otDocuments: "Incident Toulouse Matabiau (UT 003818H-B 285)",
    constat: "Application d'un \"STOP\" par EQUANS pour op\u00e9ration dangereuse (escabeau sur pont roulant).",
    calcul: "250\u20ac/constat",
    montant: 250,
    montantLabel: "250 \u20ac",
    statut: "appliquee",
    categorie: "securite",
    periode: "Mars 2026",
    criticite: "moyenne",
  },
  {
    id: "P4",
    type: "P4 - Retard Maintenance Corrective",
    justification: "Art. 27.1 CPS & D\u00e9lais contractuels",
    otDocuments: "51 OT COR pour UT 003816S-B 299",
    constat: "Retard de 10 jours de p\u00e9nalit\u00e9 par OT par rapport au d\u00e9lai D2 (8 jours ouvr\u00e9s).",
    calcul: "51 OT x 10 jours x 50\u20ac/jour",
    montant: 25500,
    montantLabel: "25 500 \u20ac",
    statut: "appliquee",
    categorie: "corrective",
    periode: "Mars-Mai 2026",
    criticite: "haute",
  },
  {
    id: "P5-MPREV",
    type: "P5 - Retard Maintenance Pr\u00e9ventive",
    justification: "Art. 27.1 CPS & D\u00e9lais contractuels (100\u20ac/jour calendaire si >10j)",
    otDocuments: "12 OT MPREV en retard (>10 jours) sur 41 UT-BAT",
    constat: "Les retards varient de 15 \u00e0 30 jours calendaires apr\u00e8s la date planifi\u00e9e.",
    calcul: "12 OT \u00d7 moyenne 20 jours \u00d7 100\u20ac/jour",
    montant: 24000,
    montantLabel: "24 000 \u20ac",
    statut: "estimee",
    categorie: "preventive",
    periode: "Mars-Mai 2026",
    criticite: "haute",
  },
  {
    id: "P5-MREG",
    type: "P5 - Retard Maintenance R\u00e9glementaire",
    justification: "Art. 27.1 CPS & D\u00e9lais contractuels (100\u20ac/jour calendaire si >10j)",
    otDocuments: "8 OT MREG en retard (>10 jours) sur 41 UT-BAT",
    constat: "Les retards varient de 12 \u00e0 25 jours calendaires apr\u00e8s la date planifi\u00e9e.",
    calcul: "8 OT \u00d7 moyenne 18 jours \u00d7 100\u20ac/jour",
    montant: 14400,
    montantLabel: "14 400 \u20ac",
    statut: "estimee",
    categorie: "reglementaire",
    periode: "Mars-Mai 2026",
    criticite: "haute",
  },
  {
    id: "P6",
    type: "P6 - Outils Informatiques (GED/Kiz\u00e9o)",
    justification: "Art. 27.1 CPS & RMA p.6 & 7",
    otDocuments: "Absence formulaires Kiz\u00e9o + Fonction \"renommer\" KNITIV",
    constat: "Absence de mise \u00e0 disposition des anciens formulaires Kiz\u00e9o. Fonction \"renommer\" un fichier ne fonctionne pas dans KNITIV.",
    calcul: "100\u20ac/document/constat",
    montant: 200,
    montantLabel: "200 \u20ac",
    statut: "appliquee",
    categorie: "outils",
    periode: "Mars-Mai 2026",
    criticite: "faible",
  },
  {
    id: "REF",
    type: "R\u00e9factions MPREV/MREG",
    justification: "Art. 27.2 CPS",
    otDocuments: "Global (RMA p.18)",
    constat: "Taux de r\u00e9alisation annuel MREG \u00e0 47%, MPREV \u00e0 66%. PAM global \u00e0 60%.",
    calcul: "(1 - taux) \u00d7 (Montant B+C au T3) / 2 (calcul annuel)",
    montant: null as number | null,
    montantLabel: "\u00c0 anticiper (risque \u00e9lev\u00e9 de r\u00e9faction significative en fin d'ann\u00e9e)",
    statut: "a_anticiper",
    categorie: "refaction",
    periode: "Annuel 2026",
    criticite: "haute",
  },
];

const utBatPerimetre = [
  "003818H-B 129", "004714Y-B 030", "114881T-B 001", "003818H-B 254", "003818H-B 122",
  "003780H-B 006", "004714Y-B 017", "111182D-B 001", "004441Z-B 056", "003818H-B 117",
  "004714Y-B 032", "003806Y-B035", "004714Y-B 037", "110160N-B 002", "003778E-B 047",
  "113001V-B 001", "003816S-B 299", "003286L-B 001", "003280M-B 027", "003818H-B 121",
  "003806Y-B 034", "003816S-B 297", "003816S-B 186", "003280M-B 019", "003260A-B 021",
  "003260A-B 012", "003778E-B 009", "003818H-B 293", "003816S-B 284", "003841U-B 016",
  "003816S-B 185", "004687A-B 003", "003828B-B 050", "003260A-B 022", "003816S-B 192",
  "003816S-B 283", "003816S-B 187", "004441Z-B 019", "003818H-B 118", "003816S-B 191",
  "003816S-B 190",
];

type SortField = "type" | "montant" | "criticite" | "periode";
type SortDir = "asc" | "desc";

export default function PenalitesTableauPage() {
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterCriticite, setFilterCriticite] = useState("all");
  const [sortField, setSortField] = useState<SortField>("montant");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedPenalite, setSelectedPenalite] = useState<typeof penalitesData[0] | null>(null);
  const [showPerimetre, setShowPerimetre] = useState(false);

  const filtered = useMemo(() => {
    let result = penalitesData.filter((p) => {
      const matchSearch = search === "" ||
        p.type.toLowerCase().includes(search.toLowerCase()) ||
        p.constat.toLowerCase().includes(search.toLowerCase()) ||
        p.otDocuments.toLowerCase().includes(search.toLowerCase());
      const matchCategorie = filterCategorie === "all" || p.categorie === filterCategorie;
      const matchStatut = filterStatut === "all" || p.statut === filterStatut;
      const matchCriticite = filterCriticite === "all" || p.criticite === filterCriticite;
      return matchSearch && matchCategorie && matchStatut && matchCriticite;
    });

    result.sort((a, b) => {
      if (sortField === "montant") {
        const aVal = a.montant ?? 999999;
        const bVal = b.montant ?? 999999;
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (sortField === "criticite") {
        const order: Record<string, number> = { haute: 3, moyenne: 2, faible: 1 };
        const aVal = order[a.criticite] ?? 0;
        const bVal = order[b.criticite] ?? 0;
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aVal = String(a[sortField] ?? "");
      const bVal = String(b[sortField] ?? "");
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return result;
  }, [search, filterCategorie, filterStatut, filterCriticite, sortField, sortDir]);

  const totalChiffre = useMemo(() => {
    return penalitesData.reduce((sum, p) => sum + (p.montant ?? 0), 0);
  }, []);

  const totalP5 = useMemo(() => {
    return penalitesData
      .filter((p) => p.id.startsWith("P5"))
      .reduce((sum, p) => sum + (p.montant ?? 0), 0);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const exportCSV = () => {
    const headers = ["Type", "Justification", "OT/Documents", "Constat", "Calcul", "Montant HT", "Statut", "Criticit\u00e9", "P\u00e9riode"];
    const rows = filtered.map((p) => [
      p.type, p.justification, p.otDocuments, p.constat, p.calcul, p.montantLabel, p.statut, p.criticite, p.periode
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `penalites-cosui-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "appliquee": return <Badge className="bg-red-100 text-red-800 border-red-200">Appliqu\u00e9e</Badge>;
      case "estimee": return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Estim\u00e9e</Badge>;
      case "a_determiner": return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">\u00c0 d\u00e9terminer</Badge>;
      case "a_anticiper": return <Badge className="bg-purple-100 text-purple-800 border-purple-200">\u00c0 anticiper</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getCriticiteBadge = (criticite: string) => {
    switch (criticite) {
      case "haute": return <Badge className="bg-red-500 text-white">Haute</Badge>;
      case "moyenne": return <Badge className="bg-orange-500 text-white">Moyenne</Badge>;
      case "faible": return <Badge className="bg-green-500 text-white">Faible</Badge>;
      default: return <Badge variant="outline">{criticite}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              P\u00e9nalit\u00e9s Potentielles COSUI
            </h1>
            <p className="text-slate-600 mt-1">
              DIT Grand Sud — P\u00e9riode Mars \u00e0 Mai 2026 — P\u00e9rim\u00e8tre : 41 UT-BAT Tertiaire & Social
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPerimetre(true)}>
              <Info className="h-4 w-4 mr-1" /> P\u00e9rim\u00e8tre
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-xs text-red-600 font-medium">Total Estim\u00e9 (hors P1 & r\u00e9factions)</p>
                  <p className="text-2xl font-bold text-red-900">{totalChiffre.toLocaleString("fr-FR")} \u20ac</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs text-orange-600 font-medium">P\u00e9nalit\u00e9s P5 (Pr\u00e9ventif + R\u00e9glementaire)</p>
                  <p className="text-2xl font-bold text-orange-900">{totalP5.toLocaleString("fr-FR")} \u20ac</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Nombre de p\u00e9nalit\u00e9s identifi\u00e9es</p>
                  <p className="text-2xl font-bold text-blue-900">{penalitesData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-medium">P\u00e9rim\u00e8tre UT-BAT</p>
                  <p className="text-2xl font-bold text-purple-900">41</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategorie} onValueChange={setFilterCategorie}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Cat\u00e9gorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes cat\u00e9gories</SelectItem>
                  <SelectItem value="pdp">PDP</SelectItem>
                  <SelectItem value="securite">S\u00e9curit\u00e9</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="preventive">Pr\u00e9ventive</SelectItem>
                  <SelectItem value="reglementaire">R\u00e9glementaire</SelectItem>
                  <SelectItem value="outils">Outils</SelectItem>
                  <SelectItem value="refaction">R\u00e9faction</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="appliquee">Appliqu\u00e9e</SelectItem>
                  <SelectItem value="estimee">Estim\u00e9e</SelectItem>
                  <SelectItem value="a_determiner">\u00c0 d\u00e9terminer</SelectItem>
                  <SelectItem value="a_anticiper">\u00c0 anticiper</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCriticite} onValueChange={setFilterCriticite}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Criticit\u00e9" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="moyenne">Moyenne</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      <button className="flex items-center gap-1 hover:text-blue-600" onClick={() => handleSort("type")}>
                        Type <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Justification</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">OT / Documents</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Statut</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      <button className="flex items-center gap-1 hover:text-blue-600" onClick={() => handleSort("criticite")}>
                        Criticit\u00e9 <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      <button className="flex items-center gap-1 justify-end hover:text-blue-600" onClick={() => handleSort("montant")}>
                        Montant HT <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">D\u00e9tail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.type}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{p.justification}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[200px] truncate" title={p.otDocuments}>{p.otDocuments}</td>
                      <td className="px-4 py-3">{getStatutBadge(p.statut)}</td>
                      <td className="px-4 py-3">{getCriticiteBadge(p.criticite)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {p.montant ? `${p.montant.toLocaleString("fr-FR")} \u20ac` : <span className="text-amber-600 text-xs font-normal">\u00c0 d\u00e9terminer</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPenalite(p)}>
                          <Info className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 font-bold text-slate-900">
                      TOTAL ESTIM\u00c9 (hors P1 & r\u00e9factions annuelles)
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-700 text-lg">
                      {totalChiffre.toLocaleString("fr-FR")} \u20ac
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Synth\u00e8se P5 */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Synth\u00e8se des OT MPREV/MREG en retard (P5)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">OT MPREV en retard (&gt;10 jours)</h4>
                <div className="space-y-1 text-sm text-orange-800">
                  <p><strong>Nombre :</strong> 12 OT identifi\u00e9s</p>
                  <p><strong>Retards :</strong> 15 \u00e0 30 jours calendaires</p>
                  <p><strong>Calcul :</strong> 12 OT \u00d7 20j (moy.) \u00d7 100\u20ac/j</p>
                  <p className="text-lg font-bold mt-2">= 24 000 \u20ac</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">OT MREG en retard (&gt;10 jours)</h4>
                <div className="space-y-1 text-sm text-red-800">
                  <p><strong>Nombre :</strong> 8 OT identifi\u00e9s</p>
                  <p><strong>Retards :</strong> 12 \u00e0 25 jours calendaires</p>
                  <p><strong>Calcul :</strong> 8 OT \u00d7 18j (moy.) \u00d7 100\u20ac/j</p>
                  <p className="text-lg font-bold mt-2">= 14 400 \u20ac</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center bg-slate-100 rounded-lg p-4">
              <span className="font-semibold text-slate-700">Total P5 (MPREV + MREG)</span>
              <span className="text-2xl font-bold text-red-700">38 400 \u20ac</span>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800">
              <strong>Note :</strong> Les montants P1 (PDP) et les r\u00e9factions annuelles (Art. 27.2 CPS) ne sont pas inclus dans le total estim\u00e9.
              Le risque de r\u00e9faction est \u00e9lev\u00e9 compte tenu des taux de r\u00e9alisation actuels (MREG 47%, MPREV 66%, PAM 60%).
              Le total avec P1 et r\u00e9factions pourrait \u00eatre significativement sup\u00e9rieur.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dialog d\u00e9tail */}
      <Dialog open={!!selectedPenalite} onOpenChange={() => setSelectedPenalite(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {selectedPenalite?.type}
            </DialogTitle>
          </DialogHeader>
          {selectedPenalite && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getStatutBadge(selectedPenalite.statut)}
                {getCriticiteBadge(selectedPenalite.criticite)}
                <Badge variant="outline">{selectedPenalite.periode}</Badge>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">Justification / R\u00e9f\u00e9rence</p>
                  <p className="text-slate-600">{selectedPenalite.justification}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">OT / Documents concern\u00e9s</p>
                  <p className="text-slate-600">{selectedPenalite.otDocuments}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Constat / D\u00e9tails</p>
                  <p className="text-slate-600">{selectedPenalite.constat}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Calcul</p>
                  <p className="text-slate-600 font-mono bg-slate-50 p-2 rounded">{selectedPenalite.calcul}</p>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Montant estim\u00e9 (HT)</span>
                  <span className="text-xl font-bold text-red-700">{selectedPenalite.montantLabel}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog p\u00e9rim\u00e8tre */}
      <Dialog open={showPerimetre} onOpenChange={setShowPerimetre}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>P\u00e9rim\u00e8tre : 41 UT-BAT Tertiaire & Social</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {utBatPerimetre.map((ut) => (
              <div key={ut} className="bg-slate-50 px-2 py-1 rounded border">{ut}</div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
