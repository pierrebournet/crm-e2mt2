import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  Plus,
  Download,
  FileText,
  Calendar,
  ChevronRight,
  X,
  Bell,
  TrendingUp,
  Package,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

// ─── STATUS CONFIG ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  a_venir: { label: "À venir", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20", icon: Clock },
  en_cours: { label: "En cours", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20", icon: TrendingUp },
  livre: { label: "Livré", color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  en_retard: { label: "En retard", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20", icon: AlertTriangle },
  non_applicable: { label: "N/A", color: "text-zinc-400", bgColor: "bg-zinc-500/10 border-zinc-500/20", icon: Minus },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  haute: { label: "Haute", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  moyenne: { label: "Moyenne", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  basse: { label: "Basse", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

const MISSIONS = ["A1", "A2"];
const CATEGORIES = ["Organisation", "Qualité", "Astreinte", "Sécurité", "Inventaire", "GMAO/GED", "Intégration"];

function formatDate(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function getDaysRemaining(dueDate: number | null | undefined): { days: number; label: string; urgency: string } | null {
  if (!dueDate) return null;
  const now = Date.now();
  const diff = dueDate - now;
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days < 0) return { days, label: `${Math.abs(days)}j de retard`, urgency: "critical" };
  if (days === 0) return { days, label: "Aujourd'hui", urgency: "critical" };
  if (days <= 3) return { days, label: `${days}j restants`, urgency: "warning" };
  if (days <= 7) return { days, label: `${days}j restants`, urgency: "attention" };
  return { days, label: `${days}j restants`, urgency: "ok" };
}

export default function LivrablesPage() {
  const [search, setSearch] = useState("");
  const [missionFilter, setMissionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Queries
  const { data: listData, isLoading, refetch } = trpc.deliverables.list.useQuery({
    mission: missionFilter !== "all" ? missionFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    search: search || undefined,
    limit: 100,
  });

  const { data: stats } = trpc.deliverables.stats.useQuery();
  const { data: selectedItem } = trpc.deliverables.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );
  const { data: exportData } = trpc.deliverables.exportAll.useQuery({
    mission: missionFilter !== "all" ? missionFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
  }, { enabled: false });

  // Mutations
  const seedMutation = trpc.deliverables.seed.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} livrables contractuels importés`);
      refetch();
    },
    onError: () => toast.error("Erreur lors de l'import"),
  });

  const createMutation = trpc.deliverables.create.useMutation({
    onSuccess: () => {
      toast.success("Livrable créé");
      setShowAddDialog(false);
      refetch();
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateMutation = trpc.deliverables.update.useMutation({
    onSuccess: () => {
      toast.success("Livrable mis à jour");
      setShowEditDialog(false);
      setEditingItem(null);
      refetch();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = trpc.deliverables.delete.useMutation({
    onSuccess: () => {
      toast.success("Livrable supprimé");
      setSelectedId(null);
      refetch();
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const items = listData?.items ?? [];
  const total = listData?.total ?? 0;

  // Export CSV
  const handleExport = async () => {
    try {
      const allItems = items; // Use current filtered items
      if (allItems.length === 0) {
        toast.error("Aucune donnée à exporter");
        return;
      }
      const headers = ["Code", "Mission", "Catégorie", "Titre", "Délai contractuel", "Date échéance", "Date livraison", "Statut", "Priorité", "Responsable", "Notes"];
      const rows = allItems.map((item: any) => [
        item.code,
        item.mission,
        item.category,
        item.title,
        item.contractualDelay,
        item.dueDate ? new Date(Number(item.dueDate)).toLocaleDateString("fr-FR") : "",
        item.deliveredDate ? new Date(Number(item.deliveredDate)).toLocaleDateString("fr-FR") : "",
        STATUS_CONFIG[item.status]?.label ?? item.status,
        PRIORITY_CONFIG[item.priority]?.label ?? item.priority,
        item.responsable ?? "",
        item.notes ?? "",
      ]);
      const csv = [headers.join(";"), ...rows.map(r => r.map((c: string) => `"${(c ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `livrables_e2mt2_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export CSV téléchargé");
    } catch {
      toast.error("Erreur lors de l'export");
    }
  };

  // Quick status update
  const handleQuickStatusUpdate = (id: number, newStatus: string) => {
    const updateData: any = { id, status: newStatus };
    if (newStatus === "livre") {
      updateData.deliveredDate = Date.now();
    }
    updateMutation.mutate(updateData);
  };

  // Count alerts (items due within 7 days)
  const alertItems = useMemo(() => {
    return items.filter((item: any) => {
      if (item.status === "livre" || item.status === "non_applicable") return false;
      const remaining = getDaysRemaining(item.dueDate ? Number(item.dueDate) : null);
      return remaining && (remaining.urgency === "critical" || remaining.urgency === "warning");
    });
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <ClipboardCheck className="h-6 w-6 text-indigo-400" />
            </div>
            Suivi des Livrables
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Suivi des livrables contractuels E2MT² — Missions A1 et A2
          </p>
        </div>
        <div className="flex items-center gap-2">
          {total === 0 && (
            <Button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Package className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? "Import..." : "Importer livrables contractuels"}
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="border-zinc-700">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats?.total ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-1">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats?.livre ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-1">Livrés</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats?.enCours ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-1">En cours</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats?.aVenir ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-1">À venir</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats?.enRetard ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-1">En retard</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats?.alertes ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1">
              <Bell className="h-3 w-3" /> Alertes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {stats && stats.total > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Progression globale</span>
              <span className="text-sm font-medium text-white">
                {Math.round(((stats.livre + stats.nonApplicable) / stats.total) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(stats.livre / stats.total) * 100}%` }}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${(stats.enCours / stats.total) * 100}%` }}
              />
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${(stats.enRetard / stats.total) * 100}%` }}
              />
              <div
                className="h-full bg-zinc-600 transition-all duration-500"
                style={{ width: `${(stats.nonApplicable / stats.total) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Livrés</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> En cours</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> En retard</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-600" /> N/A</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts banner */}
      {alertItems.length > 0 && (
        <Card className="bg-red-950/30 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-sm font-semibold text-red-300">
                {alertItems.length} livrable{alertItems.length > 1 ? "s" : ""} nécessitant une attention immédiate
              </span>
            </div>
            <div className="space-y-2">
              {alertItems.slice(0, 5).map((item: any) => {
                const remaining = getDaysRemaining(item.dueDate ? Number(item.dueDate) : null);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded bg-red-950/40 cursor-pointer hover:bg-red-950/60 transition-colors"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-red-500/30 text-red-300">{item.code}</Badge>
                      <span className="text-sm text-zinc-300 truncate max-w-md">{item.title}</span>
                    </div>
                    <span className={`text-xs font-medium ${remaining?.urgency === "critical" ? "text-red-400" : "text-amber-400"}`}>
                      {remaining?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Rechercher un livrable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-700"
          />
        </div>
        <Select value={missionFilter} onValueChange={setMissionFilter}>
          <SelectTrigger className="w-[130px] bg-zinc-900/50 border-zinc-700">
            <SelectValue placeholder="Mission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes missions</SelectItem>
            {MISSIONS.map(m => (
              <SelectItem key={m} value={m}>Mission {m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-zinc-900/50 border-zinc-700">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] bg-zinc-900/50 border-zinc-700">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="text-left p-3 text-zinc-400 font-medium">Code</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Titre</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Catégorie</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Échéance</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Statut</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Priorité</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                  Aucun livrable trouvé. Cliquez sur "Importer livrables contractuels" pour commencer.
                </td></tr>
              ) : (
                items.map((item: any) => {
                  const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.a_venir;
                  const priorityCfg = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.moyenne;
                  const remaining = getDaysRemaining(item.dueDate ? Number(item.dueDate) : null);
                  const StatusIcon = statusCfg.icon;

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors ${
                        selectedId === item.id ? "bg-zinc-800/50" : ""
                      }`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td className="p-3">
                        <Badge variant="outline" className="font-mono text-xs border-zinc-700 text-zinc-300">
                          {item.code}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-zinc-200 max-w-xs truncate">{item.title}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Mission {item.mission}</div>
                      </td>
                      <td className="p-3 text-zinc-400">{item.category}</td>
                      <td className="p-3">
                        {item.dueDate ? (
                          <div>
                            <div className="text-zinc-300 text-xs">{formatDate(Number(item.dueDate))}</div>
                            {remaining && item.status !== "livre" && item.status !== "non_applicable" && (
                              <div className={`text-xs mt-0.5 ${
                                remaining.urgency === "critical" ? "text-red-400 font-medium" :
                                remaining.urgency === "warning" ? "text-amber-400" :
                                remaining.urgency === "attention" ? "text-yellow-400" :
                                "text-zinc-500"
                              }`}>
                                {remaining.label}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">Non définie</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${statusCfg.bgColor}`}>
                          <StatusIcon className={`h-3 w-3 ${statusCfg.color}`} />
                          <span className={statusCfg.color}>{statusCfg.label}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-xs ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {item.status !== "livre" && item.status !== "non_applicable" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handleQuickStatusUpdate(item.id, "livre")}
                              title="Marquer comme livré"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-300"
                            onClick={() => {
                              setEditingItem(item);
                              setShowEditDialog(true);
                            }}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <div className="p-3 border-t border-zinc-800 text-xs text-zinc-500 text-center">
            {total} livrable{total > 1 ? "s" : ""} au total
          </div>
        )}
      </Card>

      {/* Detail Panel */}
      {selectedId && selectedItem && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-400" />
                Détail — {selectedItem.code}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="text-zinc-400">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Titre</div>
                  <div className="text-sm text-zinc-200">{selectedItem.title}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Mission</div>
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-300">Mission {selectedItem.mission}</Badge>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Catégorie</div>
                  <div className="text-sm text-zinc-300">{selectedItem.category}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Délai contractuel</div>
                  <div className="text-sm text-zinc-300 bg-zinc-800/50 p-2 rounded">{selectedItem.contractualDelay}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Statut</div>
                  {(() => {
                    const cfg = STATUS_CONFIG[selectedItem.status] ?? STATUS_CONFIG.a_venir;
                    const Icon = cfg.icon;
                    return (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${cfg.bgColor}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                        <span className={cfg.color}>{cfg.label}</span>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Priorité</div>
                  {(() => {
                    const cfg = PRIORITY_CONFIG[selectedItem.priority] ?? PRIORITY_CONFIG.moyenne;
                    return <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>;
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Date d'échéance</div>
                    <div className="text-sm text-zinc-300 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(selectedItem.dueDate ? Number(selectedItem.dueDate) : null)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Date de livraison</div>
                    <div className="text-sm text-zinc-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {formatDate(selectedItem.deliveredDate ? Number(selectedItem.deliveredDate) : null)}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Responsable</div>
                  <div className="text-sm text-zinc-300">{selectedItem.responsable || "Non assigné"}</div>
                </div>
                {selectedItem.notes && (
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Notes</div>
                    <div className="text-sm text-zinc-300 bg-zinc-800/50 p-2 rounded">{selectedItem.notes}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700"
                onClick={() => {
                  setEditingItem(selectedItem);
                  setShowEditDialog(true);
                }}
              >
                <Edit className="h-4 w-4 mr-1" /> Modifier
              </Button>
              {selectedItem.status !== "livre" && selectedItem.status !== "non_applicable" && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleQuickStatusUpdate(selectedItem.id, "livre")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Marquer livré
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
                onClick={() => {
                  if (confirm("Supprimer ce livrable ?")) {
                    deleteMutation.mutate({ id: selectedItem.id });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <DeliverableFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Ajouter un livrable"
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />

      {/* Edit Dialog */}
      {editingItem && (
        <DeliverableFormDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setEditingItem(null);
          }}
          title="Modifier le livrable"
          initialData={editingItem}
          onSubmit={(data) => updateMutation.mutate({ id: editingItem.id, ...data })}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── FORM DIALOG ────────────────────────────────────────────────────

function DeliverableFormDialog({
  open,
  onOpenChange,
  title,
  initialData,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialData?: any;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [code, setCode] = useState(initialData?.code ?? "");
  const [mission, setMission] = useState(initialData?.mission ?? "A1");
  const [category, setCategory] = useState(initialData?.category ?? "Organisation");
  const [titleField, setTitleField] = useState(initialData?.title ?? "");
  const [contractualDelay, setContractualDelay] = useState(initialData?.contractualDelay ?? "");
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(Number(initialData.dueDate)).toISOString().slice(0, 10) : "");
  const [deliveredDate, setDeliveredDate] = useState(initialData?.deliveredDate ? new Date(Number(initialData.deliveredDate)).toISOString().slice(0, 10) : "");
  const [status, setStatus] = useState(initialData?.status ?? "a_venir");
  const [priority, setPriority] = useState(initialData?.priority ?? "moyenne");
  const [responsable, setResponsable] = useState(initialData?.responsable ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [alertDays, setAlertDays] = useState(String(initialData?.alertDaysBefore ?? 7));

  const handleSubmit = () => {
    if (!code || !titleField || !contractualDelay) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    const data: any = {
      code,
      mission,
      category,
      title: titleField,
      contractualDelay,
      status,
      priority,
      alertDaysBefore: parseInt(alertDays) || 7,
    };
    if (dueDate) data.dueDate = new Date(dueDate).getTime();
    if (deliveredDate) data.deliveredDate = new Date(deliveredDate).getTime();
    if (responsable) data.responsable = responsable;
    if (notes) data.notes = notes;
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-900 border-zinc-800 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs">Code *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="A1-01" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Mission *</Label>
              <Select value={mission} onValueChange={setMission}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MISSIONS.map(m => <SelectItem key={m} value={m}>Mission {m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Catégorie *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Titre *</Label>
            <Input value={titleField} onChange={(e) => setTitleField(e.target.value)} placeholder="Titre du livrable" className="bg-zinc-800 border-zinc-700" />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Délai contractuel *</Label>
            <Input value={contractualDelay} onChange={(e) => setContractualDelay(e.target.value)} placeholder="Ex: 15 jours calendaires..." className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs">Date d'échéance</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-zinc-800 border-zinc-700" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Date de livraison</Label>
              <Input type="date" value={deliveredDate} onChange={(e) => setDeliveredDate(e.target.value)} className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-zinc-400 text-xs">Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Priorité</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Alerte (jours avant)</Label>
              <Input type="number" value={alertDays} onChange={(e) => setAlertDays(e.target.value)} className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Responsable</Label>
            <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nom du responsable" className="bg-zinc-800 border-zinc-700" />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes complémentaires..." className="bg-zinc-800 border-zinc-700" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700">Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
            {isPending ? "En cours..." : initialData ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
