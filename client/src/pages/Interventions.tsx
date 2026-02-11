import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Wrench, Eye, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { STATUSES, CRITICALITIES, MAINTENANCE_TYPES } from "../../../shared/e2mt2";

function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find((st) => st.code === status);
  const colors: Record<string, string> = {
    planifie: "bg-blue-50 text-blue-700 border-blue-200",
    en_cours: "bg-amber-50 text-amber-700 border-amber-200",
    termine: "bg-emerald-50 text-emerald-700 border-emerald-200",
    annule: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || "bg-gray-50 text-gray-500"}`}>
      {s?.name || status}
    </span>
  );
}

function DelayIndicator({ met, label }: { met: number | null; label: string }) {
  if (met === null || met === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return met === 1 ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      ✓ {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      ✗ {label}
    </span>
  );
}

function formatDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}min`;
}

export default function Interventions() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    search: "",
    workTypeId: undefined as number | undefined,
    criticality: undefined as string | undefined,
    maintenanceType: undefined as string | undefined,
    status: undefined as string | undefined,
    lotId: undefined as number | undefined,
  });
  const [page, setPage] = useState(1);

  const { data: lotsData } = trpc.lots.list.useQuery();
  const { data: workTypesData } = trpc.workTypes.list.useQuery();
  const { data, isLoading } = trpc.interventions.list.useQuery({
    ...filters,
    search: filters.search || undefined,
    page,
    limit: 20,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  const updateFilter = (key: string, value: any) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interventions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ?? 0} intervention(s) enregistrée(s)
          </p>
        </div>
        <Button className="bg-[#E05206] hover:bg-[#c44705]" onClick={() => setLocation("/interventions/new")}>
          <Wrench className="h-4 w-4 mr-2" />
          Nouvelle intervention
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <Select value={filters.lotId ? String(filters.lotId) : "all"} onValueChange={(v) => updateFilter("lotId", v === "all" ? undefined : Number(v))}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Lot" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les lots</SelectItem>
                {lotsData?.map((lot: any) => (
                  <SelectItem key={lot.id} value={String(lot.id)}>{lot.code} - {lot.region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.workTypeId ? String(filters.workTypeId) : "all"} onValueChange={(v) => updateFilter("workTypeId", v === "all" ? undefined : Number(v))}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {workTypesData?.map((wt: any) => (
                  <SelectItem key={wt.id} value={String(wt.id)}>{wt.code} - {wt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.criticality || "all"} onValueChange={(v) => updateFilter("criticality", v === "all" ? undefined : v)}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Criticité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="C1">C1 - Urgente</SelectItem>
                <SelectItem value="C2">C2 - Standard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status || "all"} onValueChange={(v) => updateFilter("status", v === "all" ? undefined : v)}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Interventions Table */}
      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="p-6"><div className="h-64 bg-muted rounded" /></CardContent>
        </Card>
      ) : data?.items && data.items.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Référence</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Titre</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Bâtiment</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Type</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Criticité</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Statut</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Durée</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">D1</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">D2</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setLocation(`/interventions/${item.id}`)}>
                    <td className="p-3">
                      <span className="font-mono text-xs font-medium text-[#0C1E3C]">{item.reference}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium max-w-[200px] truncate block">{item.title}</span>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="text-sm">{item.buildingName}</span>
                        <span className="text-xs text-muted-foreground block">Lot {item.lotCode}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{item.workTypeCode}</Badge>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.criticality === "C1" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {item.criticality}
                      </span>
                    </td>
                    <td className="p-3"><StatusBadge status={item.status} /></td>
                    <td className="p-3">
                      <span className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDuration(item.durationMinutes)}
                      </span>
                    </td>
                    <td className="p-3"><DelayIndicator met={item.d1Met} label="D1" /></td>
                    <td className="p-3"><DelayIndicator met={item.d2Met} label="D2" /></td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setLocation(`/interventions/${item.id}`); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Aucune intervention trouvée</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Créez votre première intervention ou modifiez vos filtres.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
