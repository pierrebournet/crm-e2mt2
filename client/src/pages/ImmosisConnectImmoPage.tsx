import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Copy, CheckCircle2, AlertCircle, Database, Globe, Loader2, X, Info, ListPlus } from "lucide-react";
import { Streamdown } from "streamdown";

interface TrameResult {
  immosis: {
    gerant: string;
    type: string;
    nom: string;
    region: string;
    etat: string;
    exercice: string;
    debut: string;
    fin: string;
    ut: string;
    batIf: string;
    nature: string;
    codeNature: string;
    ventilationBD: string;
    pourcentageBD: string;
    montant: string;
    description: string;
    strategie: string;
    priorite: string;
  };
  connectImmo: {
    intituleProjet: string;
    dit: string;
    region: string;
    agence: string;
    ut: string;
    bien: string;
    origine: string;
    sousType: string;
    gerantProgramme: string;
    attributaire: string;
    estimation: string;
    debutExercice: string;
    finExercice: string;
    debutTravaux: string;
    finTravaux: string;
    priorite: string;
    urgence: string;
    fournisseur: string;
    typeFournisseur: string;
    pilote: string;
    responsableBudget: string;
  };
  notes: string;
  warnings: string[];
}

export default function ImmosisConnectImmoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TrameResult | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.assistant.uploadFile.useMutation();
  const askMutation = trpc.assistant.ask.useMutation();
  const suiviAutoMutation = trpc.suiviAuto.createFromDevis.useMutation();
  const [suiviCreated, setSuiviCreated] = useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Format non supporté. Utilisez PDF, PNG, JPEG ou WebP.");
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 20 Mo).");
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setRawMarkdown(null);
    setIsUploading(true);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const uploadResult = await uploadMutation.mutateAsync({
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileBase64: base64.split(",")[1],
      });

      setFileUrl(uploadResult.url);
      toast.success("Devis uploadé avec succès !");
    } catch {
      toast.error("Erreur lors de l'upload du fichier.");
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!fileUrl || !file) return;

    setIsAnalyzing(true);
    try {
      const prompt = `GÉNÈRE LES TRAMES IMMOSIS ET CONNECT'IMMO pour ce devis.

Analyse le devis ci-joint et pré-remplis TOUS les champs nécessaires pour :
1. Créer l'AT dans IMMOSIS (NETiKA)
2. Créer le projet dans Connect'Immo V11

IMPORTANT : Réponds UNIQUEMENT avec un bloc JSON valide (sans markdown, sans texte avant/après).
Structure exacte attendue :
{"immosis":{"gerant":"[gérant de programme]","type":"[type AT selon gérant]","nom":"[nom AT format 47-26-xxxx]","region":"[région SNCF]","etat":"PROPOSE","exercice":"2026","debut":"[date début JJ/MM/AAAA]","fin":"[date fin JJ/MM/AAAA]","ut":"[code UT]","batIf":"[code BAT/IF]","nature":"[libellé nature 83xx-89xx]","codeNature":"[code 4 chiffres]","ventilationBD":"[B/D propriétaire]","pourcentageBD":"100","montant":"[montant HT]","description":"[description travaux]","strategie":"NON DEFINIE","priorite":"3"},"connectImmo":{"intituleProjet":"[intitulé conforme nommage]","dit":"DIT Grand Sud","region":"[région]","agence":"[agence]","ut":"[code UT]","bien":"[code bien UT_B xxx]","origine":"[origine parmi liste]","sousType":"[sous-type Connect Immo]","gerantProgramme":"[gérant programme]","attributaire":"DIT","estimation":"[montant HT]","debutExercice":"2026","finExercice":"2026","debutTravaux":"[date]","finTravaux":"[date]","priorite":"1","urgence":"U3","fournisseur":"[nom fournisseur du devis]","typeFournisseur":"ABE","pilote":"[à renseigner]","responsableBudget":"EDT"},"notes":"[explications sur les choix effectués]","warnings":["[liste des points nécessitant vérification manuelle]"]}`;

      const isImage = file.type.startsWith("image/");
      const attachments: { url: string; fileName: string; mimeType: string }[] = [{
        url: fileUrl,
        fileName: file.name,
        mimeType: file.type,
      }];

      const response = await askMutation.mutateAsync({
        question: prompt,
        attachments,
      });

      // Parse JSON from the response
      try {
        let jsonStr = response.answer;
        // Remove markdown code fences if present
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        // Try to find JSON object
        const jsonStart = jsonStr.indexOf("{");
        const jsonEnd = jsonStr.lastIndexOf("}");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        }
        const parsed = JSON.parse(jsonStr) as TrameResult;
        setResult(parsed);
        setRawMarkdown(response.answer);
      } catch {
        // If JSON parsing fails, show raw markdown
        setRawMarkdown(response.answer);
        toast.info("Résultat affiché en format texte.");
      }
      toast.success("Trames générées avec succès !");
    } catch {
      toast.error("Erreur lors de l'analyse du devis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papier !`);
  };

  const formatImmosisText = () => {
    if (!result) return "";
    const i = result.immosis;
    return `IMMOSIS — Ajout AT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gérant de programmes : ${i.gerant}
Type : ${i.type}
Nom : ${i.nom}
Exercice : ${i.exercice}
Début : ${i.debut}
Fin : ${i.fin}
Région : ${i.region}
Etat : ${i.etat}
Stratégie : ${i.strategie}
Priorité : ${i.priorite}

— Localisation —
UT : ${i.ut}
BAT/IF : ${i.batIf}

— Nature —
Code : ${i.codeNature}
Libellé : ${i.nature}

— Ventilation B/D —
${i.ventilationBD} : ${i.pourcentageBD}%
Montant : ${i.montant} €

— Description —
${i.description}`;
  };

  const formatConnectImmoText = () => {
    if (!result) return "";
    const c = result.connectImmo;
    return `CONNECT'IMMO — Créer une opération
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIT : ${c.dit}
Région : ${c.region}
Agence : ${c.agence}
UT : ${c.ut}
Bien : ${c.bien}
Intitulé du projet : ${c.intituleProjet}
Origine : ${c.origine}
Sous-Types : ${c.sousType}
Gérant de programme : ${c.gerantProgramme}
Attributaire : ${c.attributaire}

— Données budgétaires —
Estimation : ${c.estimation} €
Début exercice : ${c.debutExercice}
Fin exercice : ${c.finExercice}
Début travaux : ${c.debutTravaux}
Fin travaux : ${c.finTravaux}

— Informations complémentaires —
Priorité : ${c.priorite}
Urgence : ${c.urgence}
Fournisseur : ${c.fournisseur}
Type fournisseur : ${c.typeFournisseur}
Pilote : ${c.pilote}
Responsable budget : ${c.responsableBudget}`;
  };

  const resetForm = () => {
    setFile(null);
    setFileUrl(null);
    setResult(null);
    setRawMarkdown(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Immosis & Connect'Immo
          </h1>
          <p className="text-muted-foreground mt-1">
            Uploadez un devis pour générer automatiquement les trames de saisie Immosis et Connect'Immo
          </p>
        </div>
        {result && (
          <Button variant="outline" onClick={resetForm}>
            <X className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        )}
      </div>

      {/* Upload Zone */}
      {!result && !rawMarkdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importer un devis
            </CardTitle>
            <CardDescription>
              Formats acceptés : PDF, PNG, JPEG, WebP (max 20 Mo)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) handleFileSelect(droppedFile);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                  <p className="text-sm text-muted-foreground">Upload en cours...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="h-10 w-10 text-green-600" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Glissez votre devis ici ou cliquez pour sélectionner</p>
                  <p className="text-sm text-muted-foreground">
                    Le devis sera analysé pour pré-remplir Immosis et Connect'Immo
                  </p>
                </div>
              )}
            </div>

            {file && fileUrl && !isAnalyzing && (
              <div className="mt-4 flex justify-center">
                <Button onClick={handleAnalyze} size="lg" className="gap-2">
                  <Database className="h-5 w-5" />
                  Générer les trames Immosis & Connect'Immo
                </Button>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Analyse du devis et génération des trames en cours...
                </p>
                <p className="text-xs text-muted-foreground">
                  (Identification UT-BAT, gérant, nature, sous-type, ventilation B/D...)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Raw markdown fallback when JSON parsing failed */}
      {!result && rawMarkdown && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Résultat de l'analyse</CardTitle>
            <Button variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-2" />
              Nouveau devis
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <Streamdown>{rawMarkdown}</Streamdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Structured Results */}
      {result && (
        <>
          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">Points d'attention</p>
                    <ul className="mt-1 text-sm text-amber-700 space-y-1">
                      {result.warnings.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs Immosis / Connect'Immo */}
          <Tabs defaultValue="immosis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="immosis" className="gap-2">
                <Database className="h-4 w-4" />
                Immosis (AT)
              </TabsTrigger>
              <TabsTrigger value="connectimmo" className="gap-2">
                <Globe className="h-4 w-4" />
                Connect'Immo
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2">
                <Info className="h-4 w-4" />
                Détails & Notes
              </TabsTrigger>
            </TabsList>

            {/* IMMOSIS Tab */}
            <TabsContent value="immosis" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      Trame IMMOSIS — Ajout AT
                    </CardTitle>
                    <CardDescription>
                      Champs pré-remplis pour la création d'une Action Technique dans NETiKA
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formatImmosisText(), "Trame Immosis")}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copier tout
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Identification */}
                    <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                      <h3 className="font-semibold text-sm uppercase text-slate-600">Identification</h3>
                      <FieldRow label="Gérant de programmes" value={result.immosis.gerant} />
                      <FieldRow label="Type" value={result.immosis.type} />
                      <FieldRow label="Nom" value={result.immosis.nom} highlight />
                      <FieldRow label="Exercice" value={result.immosis.exercice} />
                      <FieldRow label="Début" value={result.immosis.debut} />
                      <FieldRow label="Fin" value={result.immosis.fin} />
                      <FieldRow label="Région" value={result.immosis.region} />
                      <FieldRow label="Etat" value={result.immosis.etat} />
                      <FieldRow label="Stratégie" value={result.immosis.strategie} />
                      <FieldRow label="Priorité" value={result.immosis.priorite} />
                    </div>

                    {/* Localisation + Nature + Ventilation */}
                    <div className="space-y-4">
                      <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                        <h3 className="font-semibold text-sm uppercase text-slate-600">Localisation</h3>
                        <FieldRow label="UT" value={result.immosis.ut} />
                        <FieldRow label="BAT/IF" value={result.immosis.batIf} />
                      </div>

                      <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-sm uppercase text-blue-600">Nature</h3>
                        <FieldRow label="Code" value={result.immosis.codeNature} />
                        <FieldRow label="Libellé" value={result.immosis.nature} />
                      </div>

                      <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold text-sm uppercase text-green-600">Ventilation B/D</h3>
                        <FieldRow label="B/D Propriétaire" value={result.immosis.ventilationBD} />
                        <FieldRow label="%" value={`${result.immosis.pourcentageBD}%`} />
                        <FieldRow label="Montant" value={`${result.immosis.montant} €`} highlight />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-semibold text-sm uppercase text-slate-600 mb-2">Description détaillée</h3>
                    <p className="text-sm whitespace-pre-wrap">{result.immosis.description}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONNECT'IMMO Tab */}
            <TabsContent value="connectimmo" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-indigo-600" />
                      Trame Connect'Immo — Créer une opération
                    </CardTitle>
                    <CardDescription>
                      Champs pré-remplis pour la création d'un projet dans Connect'Immo V11
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formatConnectImmoText(), "Trame Connect'Immo")}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copier tout
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Localisation */}
                    <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                      <h3 className="font-semibold text-sm uppercase text-slate-600">Localisation & Identification</h3>
                      <FieldRow label="DIT" value={result.connectImmo.dit} />
                      <FieldRow label="Région" value={result.connectImmo.region} />
                      <FieldRow label="Agence" value={result.connectImmo.agence} />
                      <FieldRow label="UT" value={result.connectImmo.ut} />
                      <FieldRow label="Bien" value={result.connectImmo.bien} />
                      <FieldRow label="Intitulé du projet" value={result.connectImmo.intituleProjet} highlight />
                    </div>

                    {/* Classification */}
                    <div className="space-y-3 p-4 bg-indigo-50 rounded-lg">
                      <h3 className="font-semibold text-sm uppercase text-indigo-600">Classification</h3>
                      <FieldRow label="Origine" value={result.connectImmo.origine} />
                      <FieldRow label="Sous-Types" value={result.connectImmo.sousType} />
                      <FieldRow label="Gérant de programme" value={result.connectImmo.gerantProgramme} />
                      <FieldRow label="Attributaire" value={result.connectImmo.attributaire} />
                      <FieldRow label="Fournisseur" value={result.connectImmo.fournisseur} />
                      <FieldRow label="Type fournisseur" value={result.connectImmo.typeFournisseur} />
                    </div>
                  </div>

                  {/* Budget & Planning */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-sm uppercase text-green-600">Budget</h3>
                      <FieldRow label="Estimation" value={`${result.connectImmo.estimation} €`} highlight />
                      <FieldRow label="Début exercice" value={result.connectImmo.debutExercice} />
                      <FieldRow label="Fin exercice" value={result.connectImmo.finExercice} />
                      <FieldRow label="Responsable budget" value={result.connectImmo.responsableBudget} />
                    </div>

                    <div className="space-y-3 p-4 bg-amber-50 rounded-lg">
                      <h3 className="font-semibold text-sm uppercase text-amber-600">Planning & Pilotage</h3>
                      <FieldRow label="Début travaux" value={result.connectImmo.debutTravaux} />
                      <FieldRow label="Fin travaux" value={result.connectImmo.finTravaux} />
                      <FieldRow label="Priorité" value={result.connectImmo.priorite} />
                      <FieldRow label="Urgence" value={result.connectImmo.urgence} />
                      <FieldRow label="Pilote" value={result.connectImmo.pilote} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-slate-600" />
                    Notes et explications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.notes ? (
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{result.notes}</Streamdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune note supplémentaire.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bouton Ajouter au suivi */}
          {!suiviCreated && (
            <Button
              onClick={async () => {
                if (!result) return;
                try {
                  const res = await suiviAutoMutation.mutateAsync({
                    prestataire: result.connectImmo.fournisseur || undefined,
                    ut: result.immosis.ut || undefined,
                    bat: result.immosis.batIf || undefined,
                    intitule: result.connectImmo.intituleProjet || undefined,
                    montant: result.immosis.montant || undefined,
                    numAT: result.immosis.nom || undefined,
                    dateDevis: result.immosis.debut || undefined,
                    devisUrl: fileUrl || undefined,
                    devisFilename: file?.name || undefined,
                    commentaires: `Généré automatiquement depuis Immosis/Connect'Immo`,
                  });
                  if (res.alreadyExists) {
                    toast.info("Cette entrée existe déjà dans le tableau de suivi.");
                  } else {
                    toast.success("Ligne ajoutée au tableau de suivi !");
                  }
                  setSuiviCreated(true);
                } catch {
                  toast.error("Erreur lors de l'ajout au suivi.");
                }
              }}
              variant="outline"
              className="w-full gap-2"
              disabled={suiviAutoMutation.isPending}
            >
              <ListPlus className="h-4 w-4" />
              {suiviAutoMutation.isPending ? "Ajout en cours..." : "Ajouter au tableau de suivi"}
            </Button>
          )}
          {suiviCreated && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Ajouté au tableau de suivi</span>
            </div>
          )}

          {/* Quick Info */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Rappel du workflow</p>
                  <p className="mt-1">
                    1. Créer l'AT dans <strong>Immosis</strong> (génère l'axe local + axe central) →
                    2. Créer le projet dans <strong>Connect'Immo</strong> (renseigner AT/OS + axes) →
                    3. Créer la DA dans <strong>ERP PeopleSoft</strong> (avec les axes Immosis)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function FieldRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const copyValue = () => {
    navigator.clipboard.writeText(value);
    toast.success(`"${value}" copié !`);
  };

  return (
    <div className="flex items-center justify-between gap-2 group">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-sm text-right ${highlight ? "font-semibold text-blue-700" : ""}`}>
          {value || <span className="text-amber-500 italic">À renseigner</span>}
        </span>
        {value && (
          <button
            onClick={copyValue}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-200"
            title="Copier"
          >
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
