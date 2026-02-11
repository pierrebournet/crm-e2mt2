import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Download, Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { STATUSES, CRITICALITIES } from "../../../shared/e2mt2";

function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("Aucune donnée à exporter");
    return;
  }

  const headers = [
    "Référence", "Bâtiment", "Code Bâtiment", "Lot", "Région", "Portefeuille",
    "Type Travaux (Code)", "Type Travaux", "Criticité", "Type Maintenance",
    "Titre", "Statut", "Date Planifiée", "Date Début", "Date Fin",
    "Durée (min)", "D1 Respecté", "D2 Respecté", "Assigné à", "Date Création"
  ];

  const formatDate = (ts: any) => {
    if (!ts) return "";
    return new Date(Number(ts)).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const rows = data.map((row: any) => [
    row.reference,
    row.buildingName,
    row.buildingCode || "",
    row.lotCode || "",
    row.lotRegion || "",
    row.portfolio || "",
    row.workTypeCode || "",
    row.workTypeName || "",
    row.criticality,
    row.maintenanceType,
    row.title,
    row.status,
    formatDate(row.plannedDate),
    formatDate(row.startDate),
    formatDate(row.endDate),
    row.durationMinutes || "",
    row.d1Met === 1 ? "Oui" : row.d1Met === 0 ? "Non" : "",
    row.d2Met === 1 ? "Oui" : row.d2Met === 0 ? "Non" : "",
    row.assignedTo || "",
    row.createdAt ? new Date(row.createdAt).toLocaleDateString("fr-FR") : "",
  ]);

  const BOM = "\uFEFF";
  const csvContent = BOM + [
    headers.join(";"),
    ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(";")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`Export réussi : ${data.length} ligne(s)`);
}

export default function ExportPage() {
  const [filters, setFilters] = useState({
    lotId: undefined as number | undefined,
    workTypeId: undefined as number | undefined,
    criticality: undefined as string | undefined,
    status: undefined as string | undefined,
    startDateFrom: "",
    startDateTo: "",
  });

  const { data: lotsData } = trpc.lots.list.useQuery();
  const { data: workTypesData } = trpc.workTypes.list.useQuery();

  const exportQuery = trpc.export.interventions.useQuery({
    lotId: filters.lotId,
    workTypeId: filters.workTypeId,
    criticality: filters.criticality,
    status: filters.status,
    startDateFrom: filters.startDateFrom ? new Date(filters.startDateFrom).getTime() : undefined,
    startDateTo: filters.startDateTo ? new Date(filters.startDateTo).getTime() : undefined,
  }, { enabled: false });

  const handleExport = async () => {
    const result = await exportQuery.refetch();
    if (result.data) {
      const now = new Date().toISOString().slice(0, 10);
      downloadCSV(result.data, `export-interventions-e2mt2-${now}.csv`);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Export des données</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Exportez les interventions au format CSV (compatible Excel)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres d'export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Lot géographique</Label>
              <Select value={filters.lotId ? String(filters.lotId) : "all"} onValueChange={(v) => setFilters({ ...filters, lotId: v === "all" ? undefined : Number(v) })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Tous les lots" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les lots</SelectItem>
                  {lotsData?.map((lot: any) => (
                    <SelectItem key={lot.id} value={String(lot.id)}>{lot.code} - {lot.region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de travaux</Label>
              <Select value={filters.workTypeId ? String(filters.workTypeId) : "all"} onValueChange={(v) => setFilters({ ...filters, workTypeId: v === "all" ? undefined : Number(v) })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Tous les types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {workTypesData?.map((wt: any) => (
                    <SelectItem key={wt.id} value={String(wt.id)}>{wt.code} - {wt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Criticité</Label>
              <Select value={filters.criticality || "all"} onValueChange={(v) => setFilters({ ...filters, criticality: v === "all" ? undefined : v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="C1">C1 - Urgente</SelectItem>
                  <SelectItem value="C2">C2 - Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? undefined : v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date début (à partir de)</Label>
              <Input
                type="date"
                value={filters.startDateFrom}
                onChange={(e) => setFilters({ ...filters, startDateFrom: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Date début (jusqu'à)</Label>
              <Input
                type="date"
                value={filters.startDateTo}
                onChange={(e) => setFilters({ ...filters, startDateTo: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700" disabled={exportQuery.isFetching}>
              <Download className="h-4 w-4 mr-2" />
              {exportQuery.isFetching ? "Export en cours..." : "Exporter en CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Format d'export</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Le fichier CSV utilise le séparateur point-virgule (;) et l'encodage UTF-8 avec BOM pour une compatibilité optimale avec Microsoft Excel.
                Les colonnes incluent : référence, bâtiment, lot, type de travaux, criticité, statut, dates, durées et conformité des délais D1/D2.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
