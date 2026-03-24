import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search, Plus, Download, Edit2, Trash2, Eye, ChevronLeft, ChevronRight,
  FileSpreadsheet, Building2, User, Hash, Calendar, Euro, FileText, MapPin,
  Paperclip, Upload, X, ExternalLink, File, Loader2
} from "lucide-react";

const COLUMNS = [
  { key: "prestataire", label: "Prestataire", icon: User },
  { key: "ut", label: "UT", icon: Hash },
  { key: "bat", label: "BAT", icon: Building2 },
  { key: "intitule", label: "Intitulé", icon: FileText },
  { key: "numDevis", label: "N° Devis", icon: Hash },
  { key: "dateDevis", label: "Date", icon: Calendar },
  { key: "montant", label: "Montant", icon: Euro },
  { key: "validationKnitiv", label: "Validation Knitiv", icon: FileText },
  { key: "numConnectImmo", label: "N° Connect Immo", icon: Hash },
  { key: "numDA", label: "N° DA", icon: Hash },
  { key: "numCDA", label: "N° CDA", icon: Hash },
  { key: "pv", label: "PV", icon: FileText },
  { key: "numReception", label: "N° Réception", icon: Hash },
  { key: "numAT", label: "N° AT", icon: Hash },
  { key: "axeLocal", label: "Axe Local", icon: MapPin },
  { key: "axeCentral", label: "Axe Central", icon: MapPin },
  { key: "dateDacia", label: "Date Dacia", icon: Calendar },
  { key: "clotureAT", label: "Clôture AT", icon: Calendar },
  { key: "commentaires", label: "Commentaires", icon: FileText },
];

type SuiviEntry = { id: number; devisUrl?: string | null; devisFilename?: string | null; [key: string]: any };

function emptyForm() {
  const obj: Record<string, string> = {};
  COLUMNS.forEach((c) => (obj[c.key] = ""));
  return obj;
}

export default function SuiviPage() {
  const [search, setSearch] = useState("");
  const [prestataire, setPrestataire] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<SuiviEntry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [uploadingDevisId, setUploadingDevisId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const limit = 50;

  const { data, isLoading, refetch } = trpc.suivi.list.useQuery({
    search: search || undefined,
    prestataire: prestataire !== "all" ? prestataire : undefined,
    page,
    limit,
  });

  const createMutation = trpc.suivi.create.useMutation({
    onSuccess: () => { toast.success("Ligne ajoutée"); refetch(); setShowForm(false); setForm(emptyForm()); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.suivi.update.useMutation({
    onSuccess: () => { toast.success("Ligne modifiée"); refetch(); setShowForm(false); setEditingId(null); setForm(emptyForm()); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.suivi.delete.useMutation({
    onSuccess: () => { toast.success("Ligne supprimée"); refetch(); setShowDetail(false); setSelectedEntry(null); },
    onError: (err) => toast.error(err.message),
  });

  const uploadDevisMutation = trpc.suivi.uploadDevis.useMutation({
    onSuccess: (result) => {
      toast.success(`Devis "${result.fileName}" importé`);
      refetch();
      setUploadingDevisId(null);
      // Refresh detail if open
      if (selectedEntry) {
        setSelectedEntry({ ...selectedEntry, devisUrl: result.url, devisFilename: result.fileName });
      }
    },
    onError: (err) => { toast.error("Erreur upload : " + err.message); setUploadingDevisId(null); },
  });

  const removeDevisMutation = trpc.suivi.removeDevis.useMutation({
    onSuccess: () => {
      toast.success("Devis supprimé");
      refetch();
      if (selectedEntry) {
        setSelectedEntry({ ...selectedEntry, devisUrl: null, devisFilename: null });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: exportData } = trpc.suivi.exportAll.useQuery({
    prestataire: prestataire !== "all" ? prestataire : undefined,
    search: search || undefined,
  });

  const prestataires = useMemo(() => {
    if (!data?.items) return [];
    const set = new Set<string>();
    data.items.forEach((item: any) => { if (item.prestataire) set.add(item.prestataire); });
    return Array.from(set).sort();
  }, [data?.items]);

  const handleExportCSV = () => {
    if (!exportData || exportData.length === 0) { toast.error("Aucune donnée à exporter"); return; }
    const headers = [...COLUMNS.map((c) => c.label), "Devis PJ"];
    const rows = exportData.map((entry: any) =>
      [...COLUMNS.map((c) => `"${String(entry[c.key] ?? "").replace(/"/g, '""')}"`), `"${entry.devisFilename || ""}"`]
    );
    const csv = [headers.join(";"), ...rows.map((r: string[]) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tableau_suivi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const handleSubmit = () => {
    if (editingId) { updateMutation.mutate({ id: editingId, ...form }); }
    else { createMutation.mutate(form); }
  };

  const handleEdit = (entry: SuiviEntry) => {
    setEditingId(entry.id);
    const f: Record<string, string> = {};
    COLUMNS.forEach((c) => (f[c.key] = entry[c.key] ?? ""));
    setForm(f);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer cette ligne du tableau de suivi ?")) { deleteMutation.mutate({ id }); }
  };

  const handleUploadDevis = (entryId: number) => {
    setUploadingDevisId(entryId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDevisId) return;

    // Vérifier taille (max 16 MB)
    if (file.size > 16 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 16 Mo)");
      setUploadingDevisId(null);
      return;
    }

    // Vérifier type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".pdf") && !file.name.endsWith(".xlsx")) {
      toast.error("Format non supporté. Utilisez PDF, JPG, PNG ou XLSX.");
      setUploadingDevisId(null);
      return;
    }

    // Lire en base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadDevisMutation.mutate({
        id: uploadingDevisId,
        fileBase64: base64,
        fileName: file.name,
        contentType: file.type || "application/pdf",
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  const handleRemoveDevis = (entryId: number) => {
    if (confirm("Supprimer la pièce jointe du devis ?")) {
      removeDevisMutation.mutate({ id: entryId });
    }
  };

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  const totalMontant = useMemo(() => {
    if (!data?.items) return 0;
    return data.items.reduce((sum: number, item: any) => {
      const val = item.montant ? parseFloat(String(item.montant).replace(",", ".").replace(/\s/g, "")) : 0;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [data?.items]);

  const DevisIndicator = ({ entry }: { entry: SuiviEntry }) => {
    if (entry.devisUrl) {
      return (
        <div className="flex items-center gap-1">
          <a
            href={entry.devisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title={entry.devisFilename || "Télécharger le devis"}
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span className="text-xs max-w-[80px] truncate">{entry.devisFilename || "Devis"}</span>
          </a>
        </div>
      );
    }
    return <span className="text-muted-foreground text-xs">-</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hidden file input for devis upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx"
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de Suivi</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Suivi administratif et financier des interventions — {data?.total ?? 0} entrée(s)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-2" />Nouvelle ligne
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Lignes</p>
                <p className="text-xl font-bold">{data?.total ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Montant total</p>
                <p className="text-xl font-bold">
                  {totalMontant.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Prestataires</p>
                <p className="text-xl font-bold">{prestataires.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
              </div>
              <Select value={prestataire} onValueChange={(v) => { setPrestataire(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Prestataire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les prestataires</SelectItem>
                  {prestataires.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <ScrollArea className="w-full">
            <div className="min-w-[2400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="px-3 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" />Devis PJ
                      </div>
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={COLUMNS.length + 2} className="text-center py-12 text-muted-foreground">Chargement...</td></tr>
                  ) : !data?.items?.length ? (
                    <tr><td colSpan={COLUMNS.length + 2} className="text-center py-12 text-muted-foreground">
                      <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-40" />Aucune entrée trouvée
                    </td></tr>
                  ) : (
                    data.items.map((entry: any) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => { setSelectedEntry(entry); setShowDetail(true); }}>
                        {COLUMNS.map((col) => (
                          <td key={col.key} className="px-3 py-2.5 whitespace-nowrap max-w-[200px] truncate">
                            {col.key === "montant" && entry[col.key] ? (
                              <span className="font-medium text-green-700">{entry[col.key]} €</span>
                            ) : col.key === "validationKnitiv" ? (
                              <Badge variant={entry[col.key] === "OUI" ? "default" : entry[col.key] === "NON" ? "destructive" : "secondary"} className="text-xs">
                                {entry[col.key] || "-"}
                              </Badge>
                            ) : col.key === "pv" ? (
                              entry[col.key] === "OUI" ? <Badge variant="default" className="text-xs">OUI</Badge>
                                : entry[col.key] === "NON" ? <Badge variant="destructive" className="text-xs">NON</Badge>
                                : <span className="text-muted-foreground">-</span>
                            ) : (
                              <span className={entry[col.key] ? "" : "text-muted-foreground"}>{entry[col.key] || "-"}</span>
                            )}
                          </td>
                        ))}
                        {/* Devis PJ column */}
                        <td className="px-3 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {uploadDevisMutation.isPending && uploadingDevisId === entry.id ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span className="text-xs">Upload...</span>
                            </div>
                          ) : entry.devisUrl ? (
                            <DevisIndicator entry={entry} />
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleUploadDevis(entry.id)}
                            >
                              <Upload className="h-3.5 w-3.5 mr-1" />Importer
                            </Button>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedEntry(entry); setShowDetail(true); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(entry)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(entry.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">Page {page} sur {totalPages} ({data?.total} entrées)</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Detail Dialog */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />Détail de l'entrée
              </DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{selectedEntry.intitule || "Sans intitulé"}</h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline">{selectedEntry.prestataire || "N/A"}</Badge>
                    <Badge variant="outline">UT: {selectedEntry.ut || "N/A"}</Badge>
                    <Badge variant="outline">BAT: {selectedEntry.bat || "N/A"}</Badge>
                  </div>
                </div>

                {/* Devis PJ section */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />Pièce jointe — Devis
                    </h4>
                  </div>
                  {selectedEntry.devisUrl ? (
                    <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <File className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedEntry.devisFilename || "Devis"}</p>
                        <p className="text-xs text-muted-foreground">Fichier importé</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={selectedEntry.devisUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-8">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />Ouvrir
                          </Button>
                        </a>
                        <a href={selectedEntry.devisUrl} download={selectedEntry.devisFilename || "devis"}>
                          <Button variant="outline" size="sm" className="h-8">
                            <Download className="h-3.5 w-3.5 mr-1.5" />Télécharger
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveDevis(selectedEntry.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4 border-2 border-dashed rounded-lg text-muted-foreground">
                      <Upload className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Aucun devis importé</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadDevis(selectedEntry.id)}
                        disabled={uploadDevisMutation.isPending}
                      >
                        {uploadDevisMutation.isPending && uploadingDevisId === selectedEntry.id ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Upload en cours...</>
                        ) : (
                          <><Upload className="h-4 w-4 mr-2" />Importer un devis (PDF, JPG, PNG, XLSX)</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COLUMNS.map((col) => (
                    <div key={col.key} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">{col.label}</p>
                      <p className="text-sm font-medium">
                        {col.key === "montant" && selectedEntry[col.key] ? `${selectedEntry[col.key]} €` : selectedEntry[col.key] || "-"}
                      </p>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(selectedEntry)}>
                    <Edit2 className="h-4 w-4 mr-2" />Modifier
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedEntry.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />Supprimer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create/Edit Form */}
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingId(null); setForm(emptyForm()); } }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier l'entrée" : "Nouvelle entrée"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {COLUMNS.map((col) => (
                <div key={col.key} className={col.key === "commentaires" || col.key === "intitule" ? "sm:col-span-2" : ""}>
                  <Label className="text-xs font-medium mb-1.5 block">{col.label}</Label>
                  {col.key === "commentaires" ? (
                    <Textarea value={form[col.key] ?? ""} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} placeholder={col.label} rows={3} />
                  ) : (
                    <Input value={form[col.key] ?? ""} onChange={(e) => setForm({ ...form, [col.key]: e.target.value })} placeholder={col.label} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Enregistrement..." : editingId ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
