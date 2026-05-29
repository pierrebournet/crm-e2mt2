import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Search,
  Filter,
  BarChart3,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export default function HistoriqueDecisionsPage() {
  const { data: decisions, isLoading } = trpc.decisions.listAll.useQuery({ limit: 200 });
  const { data: stats } = trpc.decisions.stats.useQuery();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMission, setFilterMission] = useState<string>("all");
  const [filterCharge, setFilterCharge] = useState<string>("all");
  const [filterFamille, setFilterFamille] = useState<string>("all");
  const [selectedDecision, setSelectedDecision] = useState<any>(null);

  // Filtered decisions
  const filteredDecisions = useMemo(() => {
    if (!decisions) return [];
    return decisions.filter((d) => {
      const matchSearch =
        searchTerm === "" ||
        d.missionLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.sousType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.sousTypeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.natureTravauxSelectionnee || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchMission = filterMission === "all" || d.mission === filterMission;
      const matchCharge = filterCharge === "all" || d.chargeType === filterCharge;
      const matchFamille = filterFamille === "all" || d.famillebudgetaire === filterFamille;
      return matchSearch && matchMission && matchCharge && matchFamille;
    });
  }, [decisions, searchTerm, filterMission, filterCharge, filterFamille]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredDecisions.length) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = [
      "Date",
      "Mission",
      "Mission (détail)",
      "Charge",
      "Charge (détail)",
      "Sous-type code",
      "Sous-type",
      "Famille budgétaire",
      "Code ZG",
      "MO facturable",
      "MO explication",
      "Nature travaux",
      "Montant devis (€)",
      "Recommandations",
    ];

    const rows = filteredDecisions.map((d) => [
      new Date(d.createdAt).toLocaleDateString("fr-FR"),
      d.mission,
      d.missionLabel,
      d.chargeType,
      d.chargeLabel,
      d.sousTypeCode,
      d.sousType,
      d.famillebudgetaire,
      d.codeZG,
      d.moFacturable ? "Oui" : "Non",
      d.moExplication || "",
      d.natureTravauxSelectionnee || "",
      d.montantDevis || "",
      Array.isArray(d.recommandations) ? (d.recommandations as string[]).join(" | ") : "",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historique-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredDecisions.length} décisions exportées en CSV`);
  };

  // Unique families for filter
  const uniqueFamilles = useMemo(() => {
    if (!decisions) return [];
    return Array.from(new Set(decisions.map((d) => d.famillebudgetaire))).sort();
  }, [decisions]);

  // Stats cards
  const thisMonthCount = useMemo(() => {
    if (!decisions) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return decisions.filter((d) => new Date(d.createdAt) >= startOfMonth).length;
  }, [decisions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Historique des Décisions</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique des Décisions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toutes les décisions de l'arbre de décision sauvegardées
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total décisions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.missionC ?? 0}</p>
                <p className="text-xs text-muted-foreground">Mission C</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.missionD ?? 0}</p>
                <p className="text-xs text-muted-foreground">Mission D</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{thisMonthCount}</p>
                <p className="text-xs text-muted-foreground">Ce mois</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-rose-500" />
              <div>
                <p className="text-2xl font-bold">
                  {stats ? Math.round(((stats.chargeProprietaire ?? 0) / Math.max(stats.total ?? 1, 1)) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Charge propriétaire</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (nature, sous-type, label...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterMission} onValueChange={setFilterMission}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Mission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="C">Mission C</SelectItem>
                  <SelectItem value="D">Mission D</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCharge} onValueChange={setFilterCharge}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Charge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="locataire">Locataire</SelectItem>
                  <SelectItem value="proprietaire">Propriétaire</SelectItem>
                  <SelectItem value="mixte">Mixte</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterFamille} onValueChange={setFilterFamille}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Famille" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {uniqueFamilles.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredDecisions.length} résultat{filteredDecisions.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredDecisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucune décision enregistrée</p>
              <p className="text-sm mt-1">
                Utilisez l'arbre de décision pour commencer à historiser vos analyses.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[80px]">Mission</TableHead>
                    <TableHead className="w-[100px]">Charge</TableHead>
                    <TableHead>Sous-type</TableHead>
                    <TableHead className="w-[80px]">Famille</TableHead>
                    <TableHead className="w-[80px]">Code ZG</TableHead>
                    <TableHead>Nature travaux</TableHead>
                    <TableHead className="w-[100px]">Montant</TableHead>
                    <TableHead className="w-[60px]">MO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDecisions.map((d) => (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setSelectedDecision(d)}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={d.mission === "C" ? "default" : "secondary"}
                          className={
                            d.mission === "C"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                              : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                          }
                        >
                          {d.mission}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            d.chargeType === "locataire"
                              ? "border-blue-300 text-blue-700"
                              : d.chargeType === "proprietaire"
                              ? "border-red-300 text-red-700"
                              : "border-purple-300 text-purple-700"
                          }
                        >
                          {d.chargeType === "proprietaire" ? "Proprio" : d.chargeType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {d.sousTypeCode}
                        <span className="text-muted-foreground ml-1">({d.sousType})</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {d.famillebudgetaire}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.codeZG}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {d.natureTravauxSelectionnee || "-"}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {d.montantDevis ? `${Number(d.montantDevis).toLocaleString("fr-FR")}€` : "-"}
                      </TableCell>
                      <TableCell>
                        {d.moFacturable ? (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Oui</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Non</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedDecision} onOpenChange={() => setSelectedDecision(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Détail de la décision
            </DialogTitle>
          </DialogHeader>
          {selectedDecision && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(selectedDecision.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Mission</p>
                  <Badge
                    className={
                      selectedDecision.mission === "C"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-orange-100 text-orange-800"
                    }
                  >
                    Mission {selectedDecision.mission}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Charge</p>
                  <p className="font-medium">{selectedDecision.chargeLabel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Sous-type</p>
                  <p className="font-mono text-sm">
                    {selectedDecision.sousTypeCode} — {selectedDecision.sousType}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Famille budgétaire</p>
                  <Badge variant="outline">{selectedDecision.famillebudgetaire}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Code ZG</p>
                  <p className="font-mono">{selectedDecision.codeZG}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">MO facturable</p>
                  <p className="font-medium">
                    {selectedDecision.moFacturable ? "Oui" : "Non"}
                  </p>
                </div>
                {selectedDecision.montantDevis && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Montant devis</p>
                    <p className="font-medium">
                      {Number(selectedDecision.montantDevis).toLocaleString("fr-FR")}€ HT
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Description mission</p>
                <p className="text-sm">{selectedDecision.missionLabel}</p>
              </div>

              {selectedDecision.moExplication && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Explication MO</p>
                  <p className="text-sm">{selectedDecision.moExplication}</p>
                </div>
              )}

              {selectedDecision.natureTravauxSelectionnee && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nature de travaux</p>
                  <p className="text-sm font-medium">{selectedDecision.natureTravauxSelectionnee}</p>
                </div>
              )}

              <Separator />

              {/* Parcours */}
              {selectedDecision.parcours && Array.isArray(selectedDecision.parcours) && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Parcours de décision</p>
                  <div className="space-y-1">
                    {(selectedDecision.parcours as any[]).map((step: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-[10px] w-6 h-5 justify-center p-0">
                          {i + 1}
                        </Badge>
                        <span className="text-muted-foreground">{step.label}</span>
                        <span className="font-medium">→ {step.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommandations */}
              {selectedDecision.recommandations && Array.isArray(selectedDecision.recommandations) && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Recommandations</p>
                  <ul className="space-y-1">
                    {(selectedDecision.recommandations as string[]).map((r: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
