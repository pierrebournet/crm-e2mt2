import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Sparkles, Layers, Hammer, Info, Tag } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { MAINTENANCE_TYPES } from "../../../shared/e2mt2";

export default function NewIntervention() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);

  // Récupérer les paramètres de l'assistant de nommage
  const nommage = useMemo(() => {
    const sousType = searchParams.get("sousType");
    const sousTypeCode = searchParams.get("sousTypeCode");
    const nature = searchParams.get("nature");
    const explication = searchParams.get("explication");
    if (sousType && sousTypeCode && nature) {
      return { sousType, sousTypeCode, nature, explication: explication || "" };
    }
    return null;
  }, [searchParams]);

  const { data: workTypesData } = trpc.workTypes.list.useQuery();
  const { data: buildingsData } = trpc.buildings.list.useQuery({ page: 1, limit: 500 });

  const createMutation = trpc.interventions.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Intervention ${data.reference} créée avec succès`);
      setLocation(`/interventions/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Pré-remplir le titre avec le nommage si disponible
  const defaultTitle = nommage
    ? `${nommage.sousType} — ${nommage.nature}`
    : "";

  const [form, setForm] = useState({
    buildingId: 0,
    workTypeId: 0,
    criticality: "" as "C1" | "C2" | "",
    maintenanceType: "" as "MPREV" | "MREG" | "MCOR" | "",
    title: defaultTitle,
    description: nommage?.explication || "",
    assignedTo: "",
    contractor: "",
    startNow: false,
    // Champs nommage Immosis
    sousType: nommage?.sousType || "",
    sousTypeCode: nommage?.sousTypeCode || "",
    natureTravaux: nommage?.nature || "",
  });

  const handleSubmit = () => {
    if (!form.buildingId || !form.workTypeId || !form.criticality || !form.maintenanceType || !form.title) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    createMutation.mutate({
      buildingId: form.buildingId,
      workTypeId: form.workTypeId,
      criticality: form.criticality as "C1" | "C2",
      maintenanceType: form.maintenanceType as "MPREV" | "MREG" | "MCOR",
      title: form.title,
      description: form.description || undefined,
      assignedTo: form.assignedTo || undefined,
      startDate: form.startNow ? Date.now() : undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/interventions")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouvelle intervention</h1>
          <p className="text-sm text-muted-foreground mt-1">Enregistrer une nouvelle intervention de maintenance</p>
        </div>
      </div>

      {/* Bandeau nommage Immosis si pré-rempli */}
      {nommage && (
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-800">Nommage Immosis pré-rempli par l'assistant</h3>
                <p className="text-xs text-emerald-600 mt-0.5">Les champs ci-dessous ont été automatiquement renseignés.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-emerald-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers className="h-3.5 w-3.5 text-[#0C1E3C]" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sous-type</span>
                </div>
                <p className="text-sm font-semibold text-[#0C1E3C]">{nommage.sousType}</p>
                <Badge variant="outline" className="font-mono text-[10px] mt-1">{nommage.sousTypeCode}</Badge>
              </div>
              <div className="bg-white rounded-lg p-3 border border-emerald-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Hammer className="h-3.5 w-3.5 text-[#E05206]" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nature de travaux</span>
                </div>
                <p className="text-sm font-semibold text-[#0C1E3C]">{nommage.nature}</p>
              </div>
            </div>
            {nommage.explication && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-emerald-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Explication</span>
                </div>
                <p className="text-xs text-foreground">{nommage.explication}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bouton pour lancer l'assistant si pas de nommage */}
      {!nommage && (
        <Card className="border border-dashed border-[#0C1E3C]/30 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setLocation("/nommage")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#0C1E3C]/10 flex items-center justify-center flex-shrink-0">
                <Tag className="h-5 w-5 text-[#0C1E3C]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0C1E3C]">Besoin d'aide pour le nommage Immosis ?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Utilisez l'assistant de nommage pour déterminer le bon sous-type et la bonne nature de travaux, puis revenez ici avec les champs pré-remplis.
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-[#E05206] flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Titre de l'intervention *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Nettoyage climatisation bureau 3ème étage"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Bâtiment *</Label>
              <Select value={form.buildingId ? String(form.buildingId) : ""} onValueChange={(v) => setForm({ ...form, buildingId: Number(v) })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner un bâtiment" /></SelectTrigger>
                <SelectContent>
                  {buildingsData?.items?.map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name} {b.code ? `(${b.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de travaux E2MT² *</Label>
              <Select value={form.workTypeId ? String(form.workTypeId) : ""} onValueChange={(v) => setForm({ ...form, workTypeId: Number(v) })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
                <SelectContent>
                  {workTypesData?.map((wt: any) => (
                    <SelectItem key={wt.id} value={String(wt.id)}>
                      {wt.code} - {wt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Champs nommage Immosis (éditables) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#0C1E3C]" />
                Sous-type Immosis
              </Label>
              <Input
                value={form.sousType}
                onChange={(e) => setForm({ ...form, sousType: e.target.value })}
                placeholder="Ex: Gros Entretiens - par E2MT"
                className="mt-1"
              />
              {form.sousTypeCode && (
                <Badge variant="outline" className="font-mono text-[10px] mt-1">{form.sousTypeCode}</Badge>
              )}
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <Hammer className="h-3.5 w-3.5 text-[#E05206]" />
                Nature de travaux Immosis
              </Label>
              <Input
                value={form.natureTravaux}
                onChange={(e) => setForm({ ...form, natureTravaux: e.target.value })}
                placeholder="Ex: Installations chauffage, ventil. climatisation"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Criticité *</Label>
              <Select value={form.criticality} onValueChange={(v) => setForm({ ...form, criticality: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="C1">C1 - Urgente (dépannage 8h)</SelectItem>
                  <SelectItem value="C2">C2 - Standard (dépannage 8h ouvrées)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de maintenance *</Label>
              <Select value={form.maintenanceType} onValueChange={(v) => setForm({ ...form, maintenanceType: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((mt) => (
                    <SelectItem key={mt.code} value={mt.code}>{mt.code} - {mt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Assigné à</Label>
              <Input
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                placeholder="Nom du technicien"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Prestataire</Label>
              <Input
                value={form.contractor}
                onChange={(e) => setForm({ ...form, contractor: e.target.value })}
                placeholder="Entreprise prestataire"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Détails de l'intervention, contexte, observations..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <input
              type="checkbox"
              id="startNow"
              checked={form.startNow}
              onChange={(e) => setForm({ ...form, startNow: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="startNow" className="text-sm">
              Démarrer l'intervention immédiatement (les délais D1/D2 commenceront à courir)
            </label>
          </div>

          {form.criticality === "C1" && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 font-medium">
                Intervention critique C1 : une alerte sera automatiquement envoyée aux responsables.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Délai D1 (dépannage) : 8 heures | Délai D2 (remise en état) : 2 jours ouvrés
              </p>
            </div>
          )}

          {form.criticality === "C2" && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700">
                Délai D1 (dépannage) : 8 heures ouvrées | Délai D2 (remise en état) : 8 jours ouvrés
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} className="bg-[#0C1E3C] hover:bg-[#162d52]" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Création..." : "Créer l'intervention"}
            </Button>
            <Button variant="outline" onClick={() => setLocation("/interventions")}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
