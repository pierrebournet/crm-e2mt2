import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Building2, Wrench, MessageSquare, History, Play, CheckCircle, XCircle, Euro, Plus, Trash2, FileText, Package } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

function formatDate(ts: number | null | undefined) {
  if (!ts) return "—";
  return new Date(Number(ts)).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}min`;
}

function formatPrice(price: string | number | null | undefined) {
  if (price === null || price === undefined) return "—";
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(num);
}

const STATUS_LABELS: Record<string, string> = {
  planifie: "Planifié", en_cours: "En cours", termine: "Terminé", annule: "Annulé",
};

const FIELD_LABELS: Record<string, string> = {
  status: "Statut", startDate: "Date de début", endDate: "Date de fin",
  durationMinutes: "Durée", assignedTo: "Assigné à", contractor: "Prestataire",
  description: "Description", title: "Titre", d1Met: "Délai D1", d2Met: "Délai D2",
  quoteNumber: "N° Devis", amount: "Montant", validationKnitiv: "Validation Knitiv",
  connectImmoRef: "Réf. Connect Immo", daNumber: "N° DA", cdaNumber: "N° CDA",
  pvNumber: "N° PV", receptionNumber: "N° Réception", atNumber: "N° AT",
  axeLocal: "Axe Local", axeCentral: "Axe Central",
};

export default function InterventionDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = Number(params.id);
  const [comment, setComment] = useState("");
  const [showBpuDialog, setShowBpuDialog] = useState(false);
  const [bpuSearch, setBpuSearch] = useState("");
  const [bpuCategory, setBpuCategory] = useState("");
  const [bpuQuantity, setBpuQuantity] = useState("1");
  const [selectedBpuItem, setSelectedBpuItem] = useState<any>(null);
  const [editingAdmin, setEditingAdmin] = useState(false);
  const [adminFields, setAdminFields] = useState<Record<string, string>>({});

  const { data: intervention, isLoading, refetch } = trpc.interventions.getById.useQuery({ id });
  const { data: commentsData, refetch: refetchComments } = trpc.interventions.comments.useQuery({ interventionId: id });
  const { data: historyData } = trpc.interventions.history.useQuery({ interventionId: id });
  const { data: bpuLines, refetch: refetchBpu } = trpc.bpu.interventionLines.useQuery({ interventionId: id });
  const { data: bpuSearchResults } = trpc.bpu.list.useQuery({ search: bpuSearch || undefined, category: bpuCategory || undefined, limit: 20 }, { enabled: showBpuDialog });
  const { data: bpuCategories } = trpc.bpu.categories.useQuery(undefined, { enabled: showBpuDialog });

  const updateMutation = trpc.interventions.update.useMutation({
    onSuccess: () => { toast.success("Intervention mise à jour"); refetch(); setEditingAdmin(false); },
    onError: (err) => toast.error(err.message),
  });

  const addCommentMutation = trpc.interventions.addComment.useMutation({
    onSuccess: () => { toast.success("Commentaire ajouté"); setComment(""); refetchComments(); },
    onError: (err) => toast.error(err.message),
  });

  const addBpuLineMutation = trpc.bpu.addLine.useMutation({
    onSuccess: () => { toast.success("Prestation BPU ajoutée"); refetchBpu(); setShowBpuDialog(false); setSelectedBpuItem(null); setBpuQuantity("1"); },
    onError: (err) => toast.error(err.message),
  });

  const removeBpuLineMutation = trpc.bpu.removeLine.useMutation({
    onSuccess: () => { toast.success("Ligne supprimée"); refetchBpu(); },
    onError: (err) => toast.error(err.message),
  });

  const totalBpu = useMemo(() => {
    if (!bpuLines) return 0;
    return bpuLines.reduce((sum: number, l: any) => sum + parseFloat(l.totalHT || "0"), 0);
  }, [bpuLines]);

  const handleAddBpuLine = () => {
    if (!selectedBpuItem) return;
    const qty = parseFloat(bpuQuantity) || 1;
    const unitPrice = parseFloat(selectedBpuItem.priceHT);
    const total = qty * unitPrice;
    addBpuLineMutation.mutate({
      interventionId: id,
      bpuItemId: selectedBpuItem.id,
      quantity: qty.toFixed(2),
      unitPriceHT: unitPrice.toFixed(2),
      totalHT: total.toFixed(2),
    });
  };

  const handleSaveAdmin = () => {
    const updates: any = { id };
    for (const [key, val] of Object.entries(adminFields)) {
      if (val !== undefined && val !== "") updates[key] = val;
    }
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Intervention non trouvée</h2>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/interventions")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux interventions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/interventions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">{intervention.reference}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                intervention.criticality === "C1" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>{intervention.criticality}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                intervention.status === "planifie" ? "bg-blue-50 text-blue-700 border-blue-200" :
                intervention.status === "en_cours" ? "bg-amber-50 text-amber-700 border-amber-200" :
                intervention.status === "termine" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                "bg-gray-50 text-gray-500 border-gray-200"
              }`}>{STATUS_LABELS[intervention.status] || intervention.status}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{intervention.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {intervention.status === "planifie" && (
            <Button className="bg-[#E05206] hover:bg-[#c44705]" onClick={() => updateMutation.mutate({ id, status: "en_cours", startDate: Date.now() })} disabled={updateMutation.isPending}>
              <Play className="h-4 w-4 mr-2" /> Démarrer
            </Button>
          )}
          {intervention.status === "en_cours" && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateMutation.mutate({ id, status: "termine", endDate: Date.now() })} disabled={updateMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" /> Terminer
            </Button>
          )}
          {(intervention.status === "planifie" || intervention.status === "en_cours") && (
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => updateMutation.mutate({ id, status: "annule" })} disabled={updateMutation.isPending}>
              <XCircle className="h-4 w-4 mr-2" /> Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Détails de l'intervention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Bâtiment</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />{intervention.buildingName}
                </p>
                {intervention.buildingCode && <p className="text-xs text-muted-foreground">{intervention.buildingCode}</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Lot</p>
                <p className="text-sm font-medium mt-1">Lot {intervention.lotCode} - {intervention.lotRegion}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Type de travaux</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />{intervention.workTypeCode} - {intervention.workTypeName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Type de maintenance</p>
                <p className="text-sm font-medium mt-1">{intervention.maintenanceType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Assigné à</p>
                <p className="text-sm font-medium mt-1">{intervention.assignedTo || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Portefeuille</p>
                <p className="text-sm font-medium mt-1">{intervention.portfolio || "—"}</p>
              </div>
            </div>
            {intervention.description && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm whitespace-pre-wrap">{intervention.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Délais et conformité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Date de début</p>
              <p className="text-sm font-medium">{formatDate(intervention.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date de fin</p>
              <p className="text-sm font-medium">{formatDate(intervention.endDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durée réelle</p>
              <p className="text-sm font-bold">{formatDuration(intervention.durationMinutes)}</p>
            </div>
            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Échéance D1 (dépannage)</p>
                <p className="text-xs">{formatDate(intervention.d1Deadline)}</p>
                {intervention.d1Met !== null && intervention.d1Met !== undefined && (
                  <div className={`mt-1 px-3 py-2 rounded-lg text-sm font-medium ${intervention.d1Met === 1 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {intervention.d1Met === 1 ? "✓ Délai D1 respecté" : "✗ Délai D1 dépassé"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Échéance D2 (remise en état)</p>
                <p className="text-xs">{formatDate(intervention.d2Deadline)}</p>
                {intervention.d2Met !== null && intervention.d2Met !== undefined && (
                  <div className={`mt-1 px-3 py-2 rounded-lg text-sm font-medium ${intervention.d2Met === 1 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {intervention.d2Met === 1 ? "✓ Délai D2 respecté" : "✗ Délai D2 dépassé"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bpu">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="bpu" className="gap-2">
            <Package className="h-4 w-4" /> BPU ({bpuLines?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <FileText className="h-4 w-4" /> Suivi admin
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Commentaires ({commentsData?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> Historique ({historyData?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* BPU Tab */}
        <TabsContent value="bpu" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Prestations BPU</CardTitle>
              <Button size="sm" className="bg-[#0C1E3C] hover:bg-[#162d52]" onClick={() => setShowBpuDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              {bpuLines && bpuLines.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Prestation</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">PU HT</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bpuLines.map((line: any) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-mono text-sm">{line.bpuCode}</TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate">{line.bpuName}</TableCell>
                          <TableCell className="text-right">{parseFloat(line.quantity)}</TableCell>
                          <TableCell className="text-right">{formatPrice(line.unitPriceHT)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatPrice(line.totalHT)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                              onClick={() => removeBpuLineMutation.mutate({ id: line.id })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total HT</p>
                      <p className="text-xl font-bold text-primary">{formatPrice(totalBpu)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune prestation BPU associée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Suivi administratif et financier</CardTitle>
              {!editingAdmin ? (
                <Button size="sm" variant="outline" onClick={() => {
                  setAdminFields({
                    contractor: (intervention as any).contractor || "",
                    quoteNumber: (intervention as any).quoteNumber || "",
                    amount: (intervention as any).amount || "",
                    validationKnitiv: (intervention as any).validationKnitiv || "",
                    connectImmoRef: (intervention as any).connectImmoRef || "",
                    daNumber: (intervention as any).daNumber || "",
                    cdaNumber: (intervention as any).cdaNumber || "",
                    pvNumber: (intervention as any).pvNumber || "",
                    receptionNumber: (intervention as any).receptionNumber || "",
                    atNumber: (intervention as any).atNumber || "",
                    axeLocal: (intervention as any).axeLocal || "",
                    axeCentral: (intervention as any).axeCentral || "",
                  });
                  setEditingAdmin(true);
                }}>Modifier</Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingAdmin(false)}>Annuler</Button>
                  <Button size="sm" className="bg-[#0C1E3C] hover:bg-[#162d52]" onClick={handleSaveAdmin} disabled={updateMutation.isPending}>Enregistrer</Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editingAdmin ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: "contractor", label: "Prestataire" },
                    { key: "quoteNumber", label: "N° Devis" },
                    { key: "amount", label: "Montant (€)" },
                    { key: "validationKnitiv", label: "Validation Knitiv" },
                    { key: "connectImmoRef", label: "Réf. Connect Immo" },
                    { key: "daNumber", label: "N° DA" },
                    { key: "cdaNumber", label: "N° CDA" },
                    { key: "pvNumber", label: "N° PV" },
                    { key: "receptionNumber", label: "N° Réception" },
                    { key: "atNumber", label: "N° AT" },
                    { key: "axeLocal", label: "Axe Local" },
                    { key: "axeCentral", label: "Axe Central" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-xs">{label}</Label>
                      <Input
                        value={adminFields[key] || ""}
                        onChange={(e) => setAdminFields(prev => ({ ...prev, [key]: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                  {[
                    { label: "Prestataire", value: (intervention as any).contractor },
                    { label: "N° Devis", value: (intervention as any).quoteNumber },
                    { label: "Montant", value: (intervention as any).amount ? formatPrice((intervention as any).amount) : null },
                    { label: "Validation Knitiv", value: (intervention as any).validationKnitiv },
                    { label: "Réf. Connect Immo", value: (intervention as any).connectImmoRef },
                    { label: "N° DA", value: (intervention as any).daNumber },
                    { label: "N° CDA", value: (intervention as any).cdaNumber },
                    { label: "N° PV", value: (intervention as any).pvNumber },
                    { label: "N° Réception", value: (intervention as any).receptionNumber },
                    { label: "N° AT", value: (intervention as any).atNumber },
                    { label: "Axe Local", value: (intervention as any).axeLocal },
                    { label: "Axe Central", value: (intervention as any).axeCentral },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium mt-1">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="mt-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-3">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire..." rows={3} className="flex-1" />
                <Button className="bg-[#0C1E3C] hover:bg-[#162d52] self-end"
                  onClick={() => { if (!comment.trim()) return; addCommentMutation.mutate({ interventionId: id, content: comment }); }}
                  disabled={addCommentMutation.isPending || !comment.trim()}>Envoyer</Button>
              </div>
              {commentsData && commentsData.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {commentsData.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{c.userName || "Utilisateur"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun commentaire</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-5">
              {historyData && historyData.length > 0 ? (
                <div className="space-y-3">
                  {historyData.map((h: any) => (
                    <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <History className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{h.userName || "Système"}</span>
                          <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-sm mt-1">
                          <span className="font-medium">{FIELD_LABELS[h.field] || h.field}</span> modifié :
                          <span className="text-muted-foreground"> {h.oldValue || "—"}</span>
                          <span className="mx-1">→</span>
                          <span className="font-medium">{h.newValue || "—"}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune modification enregistrée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* BPU Selection Dialog */}
      <Dialog open={showBpuDialog} onOpenChange={setShowBpuDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajouter une prestation BPU</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Input placeholder="Rechercher par code ou description..." value={bpuSearch} onChange={(e) => setBpuSearch(e.target.value)} className="flex-1" />
            <Select value={bpuCategory} onValueChange={(v) => setBpuCategory(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {bpuCategories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 overflow-auto mt-3 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Prestation</TableHead>
                  <TableHead className="text-right">Prix HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bpuSearchResults?.items.map((item) => (
                  <TableRow key={item.id} className={`cursor-pointer ${selectedBpuItem?.id === item.id ? "bg-primary/10" : "hover:bg-muted/30"}`}
                    onClick={() => setSelectedBpuItem(item)}>
                    <TableCell>
                      <div className={`h-4 w-4 rounded-full border-2 ${selectedBpuItem?.id === item.id ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="text-sm max-w-[350px] truncate">{item.name}</TableCell>
                    <TableCell className="text-right font-semibold">{formatPrice(item.priceHT)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {selectedBpuItem && (
            <div className="flex items-end gap-4 mt-3 pt-3 border-t">
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedBpuItem.code} — {selectedBpuItem.name.substring(0, 80)}...</p>
                <p className="text-xs text-muted-foreground">Prix unitaire : {formatPrice(selectedBpuItem.priceHT)}</p>
              </div>
              <div className="w-24">
                <Label className="text-xs">Quantité</Label>
                <Input type="number" value={bpuQuantity} onChange={(e) => setBpuQuantity(e.target.value)} min="0.01" step="0.01" className="mt-1" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total HT</p>
                <p className="text-lg font-bold text-primary">{formatPrice((parseFloat(bpuQuantity) || 0) * parseFloat(selectedBpuItem.priceHT))}</p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setShowBpuDialog(false)}>Annuler</Button>
            <Button className="bg-[#0C1E3C] hover:bg-[#162d52]" onClick={handleAddBpuLine} disabled={!selectedBpuItem || addBpuLineMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
