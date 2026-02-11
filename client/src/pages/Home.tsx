import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Wrench, CheckCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  planifie: "#3b82f6",
  en_cours: "#f59e0b",
  termine: "#10b981",
  annule: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

export default function Home() {
  const [lotId, setLotId] = useState<number | undefined>(undefined);
  const { data: lotsData } = trpc.lots.list.useQuery();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(
    lotId ? { lotId } : undefined
  );

  const d1Rate = useMemo(() => {
    if (!stats) return 0;
    const total = stats.d1Met + stats.d1Failed;
    return total > 0 ? Math.round((stats.d1Met / total) * 100) : 0;
  }, [stats]);

  const d2Rate = useMemo(() => {
    if (!stats) return 0;
    const total = stats.d2Met + stats.d2Failed;
    return total > 0 ? Math.round((stats.d2Met / total) * 100) : 0;
  }, [stats]);

  const statusData = useMemo(() => {
    if (!stats?.byStatus) return [];
    return stats.byStatus.map((s: any) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      fill: STATUS_COLORS[s.status] || "#6b7280",
    }));
  }, [stats]);

  const workTypeData = useMemo(() => {
    if (!stats?.byWorkType) return [];
    return stats.byWorkType
      .filter((w: any) => w.count > 0)
      .map((w: any) => ({
        name: w.code || "N/A",
        fullName: w.name,
        count: w.count,
      }));
  }, [stats]);

  const durationData = useMemo(() => {
    if (!stats?.avgDurations) return [];
    return stats.avgDurations
      .filter((d: any) => d.count > 0)
      .map((d: any) => ({
        name: d.code || "N/A",
        fullName: d.name,
        avg: Math.round(Number(d.avgDuration) || 0),
        min: Number(d.minDuration) || 0,
        max: Number(d.maxDuration) || 0,
      }));
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue d'ensemble des interventions de maintenance E2MT²
          </p>
        </div>
        <Select
          value={lotId ? String(lotId) : "all"}
          onValueChange={(v) => setLotId(v === "all" ? undefined : Number(v))}
        >
          <SelectTrigger className="w-[220px] bg-white">
            <SelectValue placeholder="Tous les lots" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les lots</SelectItem>
            {lotsData?.map((lot: any) => (
              <SelectItem key={lot.id} value={String(lot.id)}>
                {lot.code} - {lot.region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0C1E3C]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bâtiments</p>
                <p className="text-3xl font-bold mt-1">{stats?.totalBuildings ?? 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[#0C1E3C]/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-[#0C1E3C]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#E05206]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interventions</p>
                <p className="text-3xl font-bold mt-1">{stats?.totalInterventions ?? 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[#E05206]/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-[#E05206]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taux D1 respecté</p>
                <p className={`text-3xl font-bold mt-1 ${d1Rate >= 80 ? "text-emerald-600" : d1Rate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {d1Rate}%
                </p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${d1Rate >= 80 ? "bg-emerald-100" : d1Rate >= 50 ? "bg-amber-100" : "bg-red-100"}`}>
                <CheckCircle className={`h-6 w-6 ${d1Rate >= 80 ? "text-emerald-600" : d1Rate >= 50 ? "text-amber-600" : "text-red-600"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taux D2 respecté</p>
                <p className={`text-3xl font-bold mt-1 ${d2Rate >= 80 ? "text-emerald-600" : d2Rate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {d2Rate}%
                </p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${d2Rate >= 80 ? "bg-emerald-100" : d2Rate >= 50 ? "bg-amber-100" : "bg-red-100"}`}>
                <TrendingUp className={`h-6 w-6 ${d2Rate >= 80 ? "text-emerald-600" : d2Rate >= 50 ? "text-amber-600" : "text-red-600"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, "Interventions"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Type Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Interventions par type de travaux</CardTitle>
          </CardHeader>
          <CardContent>
            {workTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={workTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [value, "Interventions"]}
                    labelFormatter={(label: any) => {
                      const item = workTypeData.find((w: any) => w.name === label);
                      return item ? `${label} - ${item.fullName}` : label;
                    }}
                  />
                  <Bar dataKey="count" fill="#0C1E3C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Duration Comparison */}
      {durationData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Durées moyennes par type de travaux (minutes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    const labels: Record<string, string> = { avg: "Moyenne", min: "Minimum", max: "Maximum" };
                    return [`${value} min`, labels[name] || name];
                  }}
                  labelFormatter={(label: any) => {
                    const item = durationData.find((d: any) => d.name === label);
                    return item ? `${label} - ${item.fullName}` : label;
                  }}
                />
                <Legend formatter={(value: string) => {
                  const labels: Record<string, string> = { avg: "Moyenne", min: "Minimum", max: "Maximum" };
                  return labels[value] || value;
                }} />
                <Bar dataKey="min" fill="#93c5fd" radius={[2, 2, 0, 0]} />
                <Bar dataKey="avg" fill="#0C1E3C" radius={[2, 2, 0, 0]} />
                <Bar dataKey="max" fill="#E05206" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Criticality & Compliance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Conformité des délais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Délai D1 (dépannage)</span>
                  <span className="text-sm font-bold">{stats?.d1Met ?? 0} / {(stats?.d1Met ?? 0) + (stats?.d1Failed ?? 0)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${d1Rate >= 80 ? "bg-emerald-500" : d1Rate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${d1Rate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Délai D2 (remise en état)</span>
                  <span className="text-sm font-bold">{stats?.d2Met ?? 0} / {(stats?.d2Met ?? 0) + (stats?.d2Failed ?? 0)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${d2Rate >= 80 ? "bg-emerald-500" : d2Rate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${d2Rate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Par criticité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.byCriticality?.map((c: any) => (
                <div key={c.criticality} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${c.criticality === "C1" ? "bg-red-500" : "bg-amber-500"}`} />
                    <span className="font-medium">
                      {c.criticality === "C1" ? "Criticité C1 (Urgente)" : "Criticité C2 (Standard)"}
                    </span>
                  </div>
                  <span className="text-lg font-bold">{c.count}</span>
                </div>
              ))}
              {(!stats?.byCriticality || stats.byCriticality.length === 0) && (
                <div className="text-center text-muted-foreground py-4">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
