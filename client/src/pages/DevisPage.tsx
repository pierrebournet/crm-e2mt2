import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Loader2,
  Eye, Trash2, RefreshCw, ChevronLeft, ChevronRight, ArrowLeft,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function VerdictBadge({ verdict }: { verdict: string }) {
  const config: Record<string, { icon: any; label: string; className: string }> = {
    valide: { icon: CheckCircle2, label: "Validé", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    a_reverifier: { icon: AlertTriangle, label: "À revérifier", className: "bg-amber-50 text-amber-700 border-amber-200" },
    rejete: { icon: XCircle, label: "Rejeté", className: "bg-red-50 text-red-700 border-red-200" },
    en_cours: { icon: Loader2, label: "Analyse en cours", className: "bg-blue-50 text-blue-700 border-blue-200" },
  };
  const c = config[verdict] || config.en_cours;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.className}`}>
      <Icon className={`h-3.5 w-3.5 ${verdict === "en_cours" ? "animate-spin" : ""}`} />
      {c.label}
    </span>
  );
}

function LineStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    conforme: { label: "Conforme", className: "bg-emerald-100 text-emerald-800" },
    ecart_faible: { label: "Écart faible", className: "bg-amber-100 text-amber-800" },
    ecart_fort: { label: "Écart fort", className: "bg-red-100 text-red-800" },
    non_trouve: { label: "Non trouvé", className: "bg-gray-100 text-gray-600" },
  };
  const c = config[status] || config.non_trouve;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.className}`}>{c.label}</span>;
}

function formatCurrency(val: any) {
  if (val === null || val === undefined || val === "") return "—";
  return Number(val).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function formatPct(val: any) {
  if (val === null || val === undefined || val === "") return "—";
  const n = Number(val);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

// ===== DEVIS LIST =====
function DevisList() {
  const [, setLocation] = useLocation();
  const [verdictFilter, setVerdictFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = trpc.devis.list.useQuery({
    verdict: verdictFilter,
    page,
    limit: 20,
  });

  const uploadMutation = trpc.devis.upload.useMutation({
    onSuccess: (result) => {
      toast.success("Devis uploadé, analyse en cours...");
      refetch();
      // Poll for analysis completion
      setTimeout(() => refetch(), 5000);
      setTimeout(() => refetch(), 15000);
      setTimeout(() => refetch(), 30000);
    },
    onError: (err) => toast.error(`Erreur d'upload: ${err.message}`),
  });

  const deleteMutation = trpc.devis.delete.useMutation({
    onSuccess: () => {
      toast.success("Devis supprimé");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Le fichier est trop volumineux (max 10 Mo)");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PDF, JPEG, PNG ou WebP.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        fileName: file.name,
        fileBase64: base64,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [uploadMutation]);

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analyse de devis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Uploadez un devis pour l'analyser automatiquement et le comparer au BPU contractuel
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            className="bg-[#E05206] hover:bg-[#c44705]"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploadMutation.isPending ? "Upload en cours..." : "Uploader un devis"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Select value={verdictFilter || "all"} onValueChange={(v) => { setVerdictFilter(v === "all" ? undefined : v); setPage(1); }}>
              <SelectTrigger className="w-[200px] bg-white"><SelectValue placeholder="Tous les verdicts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les verdicts</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="a_reverifier">À revérifier</SelectItem>
                <SelectItem value="rejete">Rejeté</SelectItem>
                <SelectItem value="en_cours">En cours d'analyse</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{data?.total ?? 0} devis</span>
          </div>
        </CardContent>
      </Card>

      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-[#E05206]/40 transition-colors cursor-pointer bg-muted/20"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files[0];
          if (file) {
            const input = fileInputRef.current;
            if (input) {
              const dt = new DataTransfer();
              dt.items.add(file);
              input.files = dt.files;
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        }}
      >
        <Upload className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Glissez-déposez un devis ici ou cliquez pour sélectionner
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Formats acceptés : PDF, JPEG, PNG, WebP (max 10 Mo)
        </p>
      </div>

      {/* Devis List */}
      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="p-6"><div className="h-48 bg-muted rounded" /></CardContent>
        </Card>
      ) : data?.items && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((devis: any) => (
            <Card key={devis.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{devis.fileName}</h3>
                        <VerdictBadge verdict={devis.verdict} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {devis.contractor && <span>Prestataire : {devis.contractor}</span>}
                        {devis.devisNumber && <span>N° {devis.devisNumber}</span>}
                        {devis.totalHT && <span className="font-medium text-foreground">{formatCurrency(devis.totalHT)} HT</span>}
                        {devis.ecartGlobalPct != null && (
                          <span className={`font-medium ${Number(devis.ecartGlobalPct) > 15 ? "text-red-600" : Number(devis.ecartGlobalPct) > 5 ? "text-amber-600" : "text-emerald-600"}`}>
                            Écart BPU : {formatPct(devis.ecartGlobalPct)}
                          </span>
                        )}
                        <span>{new Date(devis.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setLocation(`/devis/${devis.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Supprimer ce devis ?")) deleteMutation.mutate({ id: devis.id });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Aucun devis analysé</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Uploadez votre premier devis pour lancer l'analyse automatique.
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

// ===== DEVIS DETAIL =====
function DevisDetail({ id }: { id: number }) {
  const [, setLocation] = useLocation();
  const { data: devis, isLoading, refetch } = trpc.devis.getById.useQuery({ id });

  const reanalyzeMutation = trpc.devis.reanalyze.useMutation({
    onSuccess: () => {
      toast.success("Ré-analyse lancée...");
      refetch();
      setTimeout(() => refetch(), 5000);
      setTimeout(() => refetch(), 15000);
      setTimeout(() => refetch(), 30000);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateVerdictMutation = trpc.devis.updateVerdict.useMutation({
    onSuccess: () => {
      toast.success("Verdict mis à jour");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!devis) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold">Devis non trouvé</h2>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/devis")}>Retour</Button>
      </div>
    );
  }

  const lines = (devis as any).lines || [];
  const conformeCount = lines.filter((l: any) => l.lineStatus === "conforme").length;
  const ecartFaibleCount = lines.filter((l: any) => l.lineStatus === "ecart_faible").length;
  const ecartFortCount = lines.filter((l: any) => l.lineStatus === "ecart_fort").length;
  const nonTrouveCount = lines.filter((l: any) => l.lineStatus === "non_trouve").length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/devis")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground truncate">{devis.fileName}</h1>
            <VerdictBadge verdict={devis.verdict} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Uploadé le {new Date(devis.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => reanalyzeMutation.mutate({ id })} disabled={reanalyzeMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${reanalyzeMutation.isPending ? "animate-spin" : ""}`} />
            Ré-analyser
          </Button>
          {devis.fileUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={devis.fileUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-1" />
                Voir le fichier
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Prestataire</p>
            <p className="text-lg font-semibold mt-1">{devis.contractor || "—"}</p>
            {devis.devisNumber && <p className="text-xs text-muted-foreground">N° {devis.devisNumber}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total HT</p>
            <p className="text-lg font-semibold mt-1">{formatCurrency(devis.totalHT)}</p>
            {devis.totalTTC && <p className="text-xs text-muted-foreground">TTC : {formatCurrency(devis.totalTTC)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Écart BPU global</p>
            <p className={`text-lg font-semibold mt-1 ${devis.ecartGlobalPct != null ? (Number(devis.ecartGlobalPct) > 15 ? "text-red-600" : Number(devis.ecartGlobalPct) > 5 ? "text-amber-600" : "text-emerald-600") : ""}`}>
              {formatPct(devis.ecartGlobalPct)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Lignes analysées</p>
            <p className="text-lg font-semibold mt-1">{lines.length}</p>
            <div className="flex items-center gap-2 mt-1 text-xs">
              {conformeCount > 0 && <span className="text-emerald-600">{conformeCount} OK</span>}
              {ecartFaibleCount > 0 && <span className="text-amber-600">{ecartFaibleCount} faible</span>}
              {ecartFortCount > 0 && <span className="text-red-600">{ecartFortCount} fort</span>}
              {nonTrouveCount > 0 && <span className="text-gray-500">{nonTrouveCount} N/A</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verdict Reason */}
      {devis.verdictReason && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                devis.verdict === "valide" ? "bg-emerald-50" : devis.verdict === "rejete" ? "bg-red-50" : "bg-amber-50"
              }`}>
                {devis.verdict === "valide" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
                 devis.verdict === "rejete" ? <XCircle className="h-4 w-4 text-red-600" /> :
                 <AlertTriangle className="h-4 w-4 text-amber-600" />}
              </div>
              <div>
                <p className="text-sm font-medium">Analyse IA</p>
                <p className="text-sm text-muted-foreground mt-1">{devis.verdictReason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Verdict Override */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Modifier le verdict manuellement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className={devis.verdict === "valide" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : ""}
              onClick={() => updateVerdictMutation.mutate({ id, verdict: "valide", verdictReason: "Validé manuellement" })}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" /> Valider
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={devis.verdict === "a_reverifier" ? "bg-amber-50 border-amber-300 text-amber-700" : ""}
              onClick={() => updateVerdictMutation.mutate({ id, verdict: "a_reverifier", verdictReason: "Marqué à revérifier manuellement" })}
            >
              <AlertTriangle className="h-4 w-4 mr-1" /> À revérifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={devis.verdict === "rejete" ? "bg-red-50 border-red-300 text-red-700" : ""}
              onClick={() => updateVerdictMutation.mutate({ id, verdict: "rejete", verdictReason: "Rejeté manuellement" })}
            >
              <XCircle className="h-4 w-4 mr-1" /> Rejeter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lines Table */}
      {lines.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Détail des lignes de prestation</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Description</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Qté</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">PU Devis</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Total</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Code BPU</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">PU BPU</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Écart</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Statut</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground p-3 uppercase tracking-wider">Confiance</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <span className="text-sm max-w-[250px] block truncate" title={line.description}>{line.description}</span>
                      {line.unit && <span className="text-xs text-muted-foreground">{line.unit}</span>}
                    </td>
                    <td className="p-3 text-right text-sm">{line.quantity ?? "—"}</td>
                    <td className="p-3 text-right text-sm font-medium">{formatCurrency(line.unitPrice)}</td>
                    <td className="p-3 text-right text-sm font-medium">{formatCurrency(line.totalPrice)}</td>
                    <td className="p-3">
                      {line.matchedBpuCode ? (
                        <Badge variant="outline" className="text-xs font-mono">{line.matchedBpuCode}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-sm">{formatCurrency(line.bpuUnitPrice)}</td>
                    <td className="p-3 text-right">
                      <span className={`text-sm font-medium ${
                        line.ecartPct != null
                          ? Math.abs(Number(line.ecartPct)) > 15 ? "text-red-600" : Math.abs(Number(line.ecartPct)) > 5 ? "text-amber-600" : "text-emerald-600"
                          : ""
                      }`}>
                        {formatPct(line.ecartPct)}
                      </span>
                    </td>
                    <td className="p-3 text-center"><LineStatusBadge status={line.lineStatus} /></td>
                    <td className="p-3 text-center">
                      {line.matchConfidence != null ? (
                        <span className="text-xs text-muted-foreground">{Number(line.matchConfidence).toFixed(0)}%</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ===== MAIN EXPORT =====
export default function DevisPage({ params }: { params?: { id?: string } }) {
  if (params?.id) {
    return <DevisDetail id={Number(params.id)} />;
  }
  return <DevisList />;
}

export function DevisDetailPage({ params }: { params: { id: string } }) {
  return <DevisDetail id={Number(params.id)} />;
}
