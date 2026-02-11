import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Search, Plus, Download, Eye, Pencil, Trash2, X, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// Colonnes exactes du tableau Excel
const COLUMNS = [
  { key: "prestataire", label: "PRESTATAIRE", width: "140px" },
  { key: "ut", label: "UT", width: "90px" },
  { key: "bat", label: "BAT", width: "60px" },
  { key: "intitule", label: "INTITULÉ", width: "200px" },
  { key: "numDevis", label: "N° DEVIS", width: "130px" },
  { key: "dateDevis", label: "DATE", width: "100px" },
  { key: "montant", label: "MONTANT", width: "110px" },
  { key: "validationKnitiv", label: "VALIDATION KNITIV", width: "150px" },
  { key: "numConnectImmo", label: "N° CONNECT IMMO", width: "140px" },
  { key: "numDA", label: "N° DA", width: "80px" },
  { key: "numCDA", label: "N° CDA", width: "80px" },
  { key: "pv", label: "PV", width: "80px" },
  { key: "numReception", label: "N° RÉCEPTION", width: "110px" },
  { key: "numAT", label: "N° AT", width: "120px" },
  { key: "axeLocal", label: "AXE LOCAL", width: "90px" },
  { key: "axeCentral", label: "AXE CENTRAL", width: "100px" },
  { key: "dateDacia", label: "DATE DACIA", width: "100px" },
  { key: "clotureAT", label: "CLÔTURE AT", width: "100px" },
  { key: "commentaires", label: "COMMENTAIRES", width: "200px" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

const emptyForm: Record<ColumnKey, string> = {
  prestataire: "", ut: "", bat: "", intitule: "", numDevis: "", dateDevis: "",
  montant: "", validationKnitiv: "", numConnectImmo: "", numDA: "", numCDA: "",
  pv: "", numReception: "", numAT: "", axeLocal: "", axeCentral: "",
  dateDacia: "", clotureAT: "", commentaires: "",
};

export default function SuiviPage() {
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<ColumnKey, string>>({ ...emptyForm });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const limit = 50;

  const { data, isLoading, refetch } = trpc.suivi.list.useQuery(
    { search: search || undefined, page, limit },
    { enabled: !!user }
  );

  const createMutation = trpc.suivi.create.useMutation({
    onSuccess: () => {
      toast.success("Ligne ajoutée avec succès");
      setShowForm(false);
      setForm({ ...emptyForm });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.suivi.update.useMutation({
    onSuccess: () => {
      toast.success("Ligne mise à jour");
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.suivi.delete.useMutation({
    onSuccess: () => {
      toast.success("Ligne supprimée");
      setShowDeleteConfirm(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: exportData } = trpc.suivi.exportAll.useQuery(
    { search: search || undefined },
    { enabled: false }
  );

  const utils = trpc.useUtils();

  const handleExport = async () => {
    try {
      const data = await utils.suivi.exportAll.fetch({ search: search || undefined });
      if (!data || data.length === 0) {
        toast.error("Aucune donnée à exporter");
        return;
      }
      // Build CSV with semicolons (French Excel format)
      const headers = COLUMNS.map(c => c.label).join(";");
      const rows = data.map((entry: any) =>
        COLUMNS.map(c => {
          const val = entry[c.key];
          if (val === null || val === undefined) return "";
          return String(val).replace(/;/g, ",");
        }).join(";")
      );
      const csv = "\uFEFF" + [headers, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tableau_suivi_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export CSV téléchargé");
    } catch (err) {
      toast.error("Erreur lors de l'export");
    }
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    const newForm: Record<ColumnKey, string> = { ...emptyForm };
    for (const col of COLUMNS) {
      newForm[col.key] = entry[col.key] ?? "";
    }
    setForm(newForm);
    setShowForm(true);
  };

  const handleRowClick = (entry: any) => {
    setSelectedEntry(entry);
    setShowDetail(true);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const totalMontant = useMemo(() => {
    if (!data?.items) return 0;
    return data.items.reduce((sum: number, e: any) => sum + (parseFloat(e.montant) || 0), 0);
  }, [data?.items]);

  if (authLoading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></DashboardLayout>;
  if (!user) return <DashboardLayout><div className="p-8 text-center text-muted-foreground">Veuillez vous connecter pour accéder au suivi.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de suivi</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Reproduction du tableau de suivi Excel — {data?.total ?? 0} ligne{(data?.total ?? 0) > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nouvelle ligne
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (prestataire, UT, BAT, intitulé, devis, commentaire...)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="secondary" className="font-mono">
            <FileSpreadsheet className="h-3 w-3 mr-1" />
            Total montant : {totalMontant.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </Badge>
        </div>

        {/* Table */}
        <Card className="border shadow-sm">
          <ScrollArea className="w-full">
            <div className="min-w-[2400px]">
              {/* Header row */}
              <div className="flex border-b bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                <div className="w-[80px] shrink-0 px-2 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Actions
                </div>
                {COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    className="shrink-0 px-2 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider border-l"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Chargement...</div>
              ) : !data?.items?.length ? (
                <div className="p-8 text-center text-muted-foreground">Aucune ligne de suivi trouvée</div>
              ) : (
                data.items.map((entry: any, idx: number) => (
                  <div
                    key={entry.id}
                    className={`flex border-b hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors ${
                      idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/50"
                    }`}
                    onClick={() => handleRowClick(entry)}
                  >
                    <div className="w-[80px] shrink-0 px-1 py-1.5 flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); handleEdit(entry); }}
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(entry.id); }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {COLUMNS.map((col) => (
                      <div
                        key={col.key}
                        className="shrink-0 px-2 py-1.5 text-sm border-l truncate"
                        style={{ width: col.width }}
                        title={entry[col.key] ?? ""}
                      >
                        {col.key === "montant" && entry[col.key]
                          ? parseFloat(entry[col.key]).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
                          : entry[col.key] ?? ""}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {totalPages} ({data?.total} lignes)
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Detail panel (click on row) */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Détail de la ligne de suivi</DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {COLUMNS.map((col) => (
                    <div key={col.key} className={col.key === "commentaires" || col.key === "intitule" ? "col-span-2" : ""}>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{col.label}</Label>
                      <p className="mt-0.5 text-sm font-medium">
                        {col.key === "montant" && selectedEntry[col.key]
                          ? parseFloat(selectedEntry[col.key]).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
                          : selectedEntry[col.key] || "—"}
                      </p>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowDetail(false); handleEdit(selectedEntry); }}>
                    <Pencil className="h-4 w-4 mr-1" /> Modifier
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create/Edit form dialog */}
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingId(null); setForm({ ...emptyForm }); } }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier la ligne" : "Nouvelle ligne de suivi"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              {COLUMNS.map((col) => (
                <div key={col.key} className={col.key === "commentaires" || col.key === "intitule" ? "col-span-2" : ""}>
                  <Label htmlFor={col.key} className="text-xs font-medium">{col.label}</Label>
                  {col.key === "commentaires" || col.key === "intitule" ? (
                    <textarea
                      id={col.key}
                      value={form[col.key]}
                      onChange={(e) => setForm(f => ({ ...f, [col.key]: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={col.label}
                    />
                  ) : (
                    <Input
                      id={col.key}
                      value={form[col.key]}
                      onChange={(e) => setForm(f => ({ ...f, [col.key]: e.target.value }))}
                      className="mt-1"
                      placeholder={col.label}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Enregistrement..." : editingId ? "Mettre à jour" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={showDeleteConfirm !== null} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Êtes-vous sûr de vouloir supprimer cette ligne ? Cette action est irréversible.</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => { if (showDeleteConfirm) deleteMutation.mutate({ id: showDeleteConfirm }); }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
