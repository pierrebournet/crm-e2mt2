import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquarePlus, CheckCircle2, Archive, Clock, AlertCircle, Trash2, Edit, MessageSquare } from "lucide-react";

export default function CotechQuestionsPage() {
  const [newQuestion, setNewQuestion] = useState("");
  const [newReference, setNewReference] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState<"haute" | "moyenne" | "basse">("moyenne");
  const [reponseDialogOpen, setReponseDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [reponseText, setReponseText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const utils = trpc.useUtils();
  const activeQuestions = trpc.cotech.list.useQuery({ archived: false });
  const archivedQuestions = trpc.cotech.list.useQuery({ archived: true });

  const createMutation = trpc.cotech.create.useMutation({
    onSuccess: () => {
      utils.cotech.list.invalidate();
      setNewQuestion("");
      setNewReference("");
      setNewCategory("");
      setNewPriority("moyenne");
      toast.success("Question ajoutée !");
    },
  });

  const updateMutation = trpc.cotech.update.useMutation({
    onSuccess: () => {
      utils.cotech.list.invalidate();
      toast.success("Question mise à jour !");
    },
  });

  const deleteMutation = trpc.cotech.delete.useMutation({
    onSuccess: () => {
      utils.cotech.list.invalidate();
      toast.success("Question supprimée !");
    },
  });

  const archiveResolvedMutation = trpc.cotech.archiveResolved.useMutation({
    onSuccess: (data) => {
      utils.cotech.list.invalidate();
      toast.success(`${data.archivedCount} question(s) archivée(s) !`);
    },
  });

  const handleCreate = () => {
    if (!newQuestion.trim()) return;
    createMutation.mutate({
      question: newQuestion.trim(),
      reference: newReference.trim() || undefined,
      category: newCategory.trim() || undefined,
      priority: newPriority,
    });
  };

  const handleToggleResolved = (q: any) => {
    updateMutation.mutate({
      id: q.id,
      resolved: q.resolved === 0,
    });
  };

  const handleSaveReponse = () => {
    if (!selectedQuestion) return;
    updateMutation.mutate({
      id: selectedQuestion.id,
      reponse: reponseText.trim() || null,
    });
    setReponseDialogOpen(false);
    setSelectedQuestion(null);
    setReponseText("");
  };

  const handleArchive = (q: any) => {
    updateMutation.mutate({ id: q.id, archived: true });
  };

  const handleUnarchive = (q: any) => {
    updateMutation.mutate({ id: q.id, archived: false });
  };

  const openReponseDialog = (q: any) => {
    setSelectedQuestion(q);
    setReponseText(q.reponse || "");
    setReponseDialogOpen(true);
  };

  const filterQuestions = (questions: any[]) => {
    if (!searchTerm) return questions;
    const term = searchTerm.toLowerCase();
    return questions.filter((q: any) =>
      q.question.toLowerCase().includes(term) ||
      (q.reference && q.reference.toLowerCase().includes(term)) ||
      (q.category && q.category.toLowerCase().includes(term))
    );
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "haute": return <Badge variant="destructive" className="text-xs">Haute</Badge>;
      case "moyenne": return <Badge variant="secondary" className="text-xs">Moyenne</Badge>;
      case "basse": return <Badge variant="outline" className="text-xs">Basse</Badge>;
      default: return null;
    }
  };

  const resolvedCount = activeQuestions.data?.filter((q: any) => q.resolved === 1).length || 0;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            Questions COTECH
          </h1>
          <p className="text-muted-foreground mt-1">
            Notez vos questions pour la prochaine réunion COTECH et suivez les réponses
          </p>
        </div>
        {resolvedCount > 0 && (
          <Button
            variant="outline"
            onClick={() => archiveResolvedMutation.mutate()}
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            Archiver les résolues ({resolvedCount})
          </Button>
        )}
      </div>

      {/* Formulaire d'ajout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquarePlus className="h-5 w-5" />
            Nouvelle question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              placeholder="Votre question pour le COTECH..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Référence (OT, devis...)"
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
              />
              <Input
                placeholder="Catégorie"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="moyenne">Moyenne</SelectItem>
                  <SelectItem value="basse">Basse</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} disabled={!newQuestion.trim()} className="gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recherche */}
      <Input
        placeholder="Rechercher dans les questions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {/* Tabs En cours / Archivées */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Clock className="h-4 w-4" />
            En cours ({activeQuestions.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            <Archive className="h-4 w-4" />
            Archivées ({archivedQuestions.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {activeQuestions.isLoading ? (
            <p className="text-muted-foreground text-center py-8">Chargement...</p>
          ) : filterQuestions(activeQuestions.data || []).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune question en cours. Ajoutez-en une ci-dessus !
              </CardContent>
            </Card>
          ) : (
            filterQuestions(activeQuestions.data || []).map((q: any) => (
              <QuestionCard
                key={q.id}
                question={q}
                onToggleResolved={() => handleToggleResolved(q)}
                onOpenReponse={() => openReponseDialog(q)}
                onArchive={() => handleArchive(q)}
                onDelete={() => deleteMutation.mutate({ id: q.id })}
                priorityBadge={priorityBadge}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-3 mt-4">
          {archivedQuestions.isLoading ? (
            <p className="text-muted-foreground text-center py-8">Chargement...</p>
          ) : filterQuestions(archivedQuestions.data || []).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune question archivée.
              </CardContent>
            </Card>
          ) : (
            filterQuestions(archivedQuestions.data || []).map((q: any) => (
              <QuestionCard
                key={q.id}
                question={q}
                onToggleResolved={() => handleToggleResolved(q)}
                onOpenReponse={() => openReponseDialog(q)}
                onUnarchive={() => handleUnarchive(q)}
                onDelete={() => deleteMutation.mutate({ id: q.id })}
                priorityBadge={priorityBadge}
                isArchived
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Réponse */}
      <Dialog open={reponseDialogOpen} onOpenChange={setReponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réponse à la question</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium">{selectedQuestion.question}</p>
                {selectedQuestion.reference && (
                  <p className="text-xs text-muted-foreground mt-1">Réf: {selectedQuestion.reference}</p>
                )}
              </div>
              <Textarea
                placeholder="Notez la réponse obtenue en COTECH..."
                value={reponseText}
                onChange={(e) => setReponseText(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReponseDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveReponse}>Enregistrer la réponse</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuestionCard({
  question: q,
  onToggleResolved,
  onOpenReponse,
  onArchive,
  onUnarchive,
  onDelete,
  priorityBadge,
  isArchived,
}: {
  question: any;
  onToggleResolved: () => void;
  onOpenReponse: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete: () => void;
  priorityBadge: (p: string) => React.ReactNode;
  isArchived?: boolean;
}) {
  return (
    <Card className={`transition-all ${q.resolved === 1 ? "border-green-200 bg-green-50/30" : ""}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={onToggleResolved}
            className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              q.resolved === 1
                ? "bg-green-500 border-green-500 text-white"
                : "border-slate-300 hover:border-green-400"
            }`}
          >
            {q.resolved === 1 && <CheckCircle2 className="h-3 w-3" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${q.resolved === 1 ? "line-through text-muted-foreground" : "font-medium"}`}>
              {q.question}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {priorityBadge(q.priority)}
              {q.reference && (
                <Badge variant="outline" className="text-xs">{q.reference}</Badge>
              )}
              {q.category && (
                <Badge variant="outline" className="text-xs bg-blue-50">{q.category}</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(q.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>

            {/* Réponse */}
            {q.reponse && (
              <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                <p className="text-xs font-medium text-blue-700">Réponse :</p>
                <p className="text-sm text-blue-900 mt-0.5">{q.reponse}</p>
                {q.reponseDate && (
                  <p className="text-xs text-blue-500 mt-1">
                    {new Date(Number(q.reponseDate)).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={onOpenReponse} title="Répondre">
              <Edit className="h-4 w-4" />
            </Button>
            {!isArchived && onArchive && (
              <Button variant="ghost" size="sm" onClick={onArchive} title="Archiver">
                <Archive className="h-4 w-4" />
              </Button>
            )}
            {isArchived && onUnarchive && (
              <Button variant="ghost" size="sm" onClick={onUnarchive} title="Désarchiver">
                <Clock className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onDelete} title="Supprimer" className="text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
