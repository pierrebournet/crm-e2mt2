import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Building2, Wrench, AlertTriangle, MessageSquare, History, Play, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
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

const STATUS_LABELS: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

const FIELD_LABELS: Record<string, string> = {
  status: "Statut",
  startDate: "Date de début",
  endDate: "Date de fin",
  durationMinutes: "Durée",
  assignedTo: "Assigné à",
  description: "Description",
  title: "Titre",
  d1Met: "Délai D1",
  d2Met: "Délai D2",
};

export default function InterventionDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = Number(params.id);
  const [comment, setComment] = useState("");

  const { data: intervention, isLoading, refetch } = trpc.interventions.getById.useQuery({ id });
  const { data: commentsData, refetch: refetchComments } = trpc.interventions.comments.useQuery({ interventionId: id });
  const { data: historyData } = trpc.interventions.history.useQuery({ interventionId: id });

  const updateMutation = trpc.interventions.update.useMutation({
    onSuccess: () => {
      toast.success("Intervention mise à jour");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const addCommentMutation = trpc.interventions.addComment.useMutation({
    onSuccess: () => {
      toast.success("Commentaire ajouté");
      setComment("");
      refetchComments();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleStartIntervention = () => {
    updateMutation.mutate({ id, status: "en_cours", startDate: Date.now() });
  };

  const handleCompleteIntervention = () => {
    updateMutation.mutate({ id, status: "termine", endDate: Date.now() });
  };

  const handleCancelIntervention = () => {
    updateMutation.mutate({ id, status: "annule" });
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
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux interventions
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
              }`}>
                {intervention.criticality}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                intervention.status === "planifie" ? "bg-blue-50 text-blue-700 border-blue-200" :
                intervention.status === "en_cours" ? "bg-amber-50 text-amber-700 border-amber-200" :
                intervention.status === "termine" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                "bg-gray-50 text-gray-500 border-gray-200"
              }`}>
                {STATUS_LABELS[intervention.status] || intervention.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{intervention.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {intervention.status === "planifie" && (
            <Button className="bg-[#E05206] hover:bg-[#c44705]" onClick={handleStartIntervention} disabled={updateMutation.isPending}>
              <Play className="h-4 w-4 mr-2" />
              Démarrer
            </Button>
          )}
          {intervention.status === "en_cours" && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCompleteIntervention} disabled={updateMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Terminer
            </Button>
          )}
          {(intervention.status === "planifie" || intervention.status === "en_cours") && (
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleCancelIntervention} disabled={updateMutation.isPending}>
              <XCircle className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Détails de l'intervention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Bâtiment</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {intervention.buildingName}
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
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  {intervention.workTypeCode} - {intervention.workTypeName}
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

        {/* Timing & Compliance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Délais et conformité
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
                {intervention.d1Met !== null && intervention.d1Met !== undefined ? (
                  <div className={`mt-1 px-3 py-2 rounded-lg text-sm font-medium ${intervention.d1Met === 1 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {intervention.d1Met === 1 ? "✓ Délai D1 respecté" : "✗ Délai D1 dépassé"}
                  </div>
                ) : null}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Échéance D2 (remise en état)</p>
                <p className="text-xs">{formatDate(intervention.d2Deadline)}</p>
                {intervention.d2Met !== null && intervention.d2Met !== undefined ? (
                  <div className={`mt-1 px-3 py-2 rounded-lg text-sm font-medium ${intervention.d2Met === 1 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {intervention.d2Met === 1 ? "✓ Délai D2 respecté" : "✗ Délai D2 dépassé"}
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Comments & History */}
      <Tabs defaultValue="comments">
        <TabsList>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Commentaires ({commentsData?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historique ({historyData?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  rows={3}
                  className="flex-1"
                />
                <Button
                  className="bg-[#0C1E3C] hover:bg-[#162d52] self-end"
                  onClick={() => {
                    if (!comment.trim()) return;
                    addCommentMutation.mutate({ interventionId: id, content: comment });
                  }}
                  disabled={addCommentMutation.isPending || !comment.trim()}
                >
                  Envoyer
                </Button>
              </div>
              {commentsData && commentsData.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {commentsData.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{c.userName || "Utilisateur"}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
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
                          <span className="text-xs text-muted-foreground">
                            {new Date(h.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
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
    </div>
  );
}
