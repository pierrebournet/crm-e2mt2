import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  ArrowDown,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface WorkflowStep {
  id: string;
  number: number;
  title: string;
  application: string;
  appColor: string;
  appBg: string;
  icon: string;
  summary: string;
  actor: string;
  details: string[];
  tips: string[];
  warnings: string[];
  outputs: string[];
  nextCondition?: string;
  branches?: { label: string; targetId: string; color: string }[];
}

// ─── Workflow Data ───────────────────────────────────────────────────────────
const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "besoin",
    number: 1,
    title: "Identification du besoin",
    application: "Terrain / Occupant",
    appColor: "text-amber-700",
    appBg: "bg-amber-50 border-amber-200",
    icon: "🔍",
    summary: "Un occupant constate un dysfonctionnement ou un besoin de maintenance sur un bâtiment.",
    actor: "Occupant / Pilote DIT",
    details: [
      "L'occupant constate une panne, un dysfonctionnement ou un besoin de maintenance",
      "Il peut contacter directement le pilote DIT ou créer une DI dans iGO",
      "Le pilote peut aussi identifier un besoin lors d'une visite de site ou d'un contrôle",
      "Évaluer la criticité : C1 (urgence vitale), C2 (urgence fonctionnelle), C3 (programmable), C4 (différable)",
    ],
    tips: [
      "Toujours demander un contact téléphonique à l'occupant pour faciliter l'intervention",
      "Prendre des photos si possible pour documenter le constat initial",
    ],
    warnings: [
      "En cas de danger immédiat (fuite de gaz, incendie, effondrement), appeler les secours AVANT de créer la DI",
    ],
    outputs: ["Constat du besoin identifié", "Criticité évaluée (C1 à C4)"],
  },
  {
    id: "di_igo",
    number: 2,
    title: "Création de la DI dans iGO",
    application: "iGO (Coswin)",
    appColor: "text-blue-700",
    appBg: "bg-blue-50 border-blue-200",
    icon: "📋",
    summary: "Saisir la Demande d'Intervention dans la GMAO iGO/Coswin avec toutes les informations nécessaires.",
    actor: "Occupant / Pilote DIT",
    details: [
      "Accueil iGO > \"Ajouter un OT\" (utiliser Firefox obligatoirement)",
      "Vérifier le nom du demandeur et le degré d'urgence",
      "Renseigner le CP gestionnaire (personne qui validera la DI)",
      "Bien équipement : flèche gauche > UT dans \"Entité\" > \"Géographique\" > Bâtiment dans \"Spécifique\" > double-clic UT-BAT",
      "Remplir le domaine puis le constat",
      "\"Précision sur la demande\" et \"Précision sur la localisation\" : ajouter un contact + téléphone",
      "Contrat : si connu le renseigner, sinon cocher \"Contrat non disponible\" + mettre 00000",
      "Valider la DI en cliquant sur la disquette rouge en haut de page",
    ],
    tips: [
      "Paramétrer iGO sur son périmètre dès la première connexion",
      "Créer 2 filtres : un quotidien (par N° UT) et un sans filtre pour les recherches",
      "Enregistrer ses filtres : \"+\" vert avec entonnoir puis disquette rouge",
    ],
    warnings: [
      "Si besoin urgent : on peut valider pour le CP gestionnaire via \"Sélection une action\" > \"Changer d'état\"",
    ],
    outputs: ["DI créée dans iGO avec N° de référence"],
  },
  {
    id: "validation_di",
    number: 3,
    title: "Validation de la DI → OT",
    application: "iGO (Coswin)",
    appColor: "text-blue-700",
    appBg: "bg-blue-50 border-blue-200",
    icon: "✅",
    summary: "Le CP Gestionnaire valide la DI, puis les 3C la transforment en Ordre de Travail (OT).",
    actor: "CP Gestionnaire / 3C",
    details: [
      "Le CP Gestionnaire reçoit la DI et la valide",
      "Les 3C (Centre de Contact Client) interviennent pour valider et transformer la DI en OT",
      "L'OT est affectée au mainteneur (AXIMA CONCEPT pour le lot 4.1)",
      "Le statut passe à 1 (Affecté)",
    ],
    tips: [
      "Suivre l'évolution des statuts : 1 Affecté → 3 En cours → 4 Terminé → 5 Clôturé → 6 Réceptionné",
      "Statut 7 = Non valide (refusé par le pilote), Statut 8 = À réviser (refusé par l'occupant)",
    ],
    warnings: [
      "Si la DI est mal orientée ou mal paramétrée, utiliser le filtre sans restriction pour la retrouver",
    ],
    outputs: ["OT créée et affectée au mainteneur", "N° OT attribué"],
    nextCondition: "Le mainteneur intervient et réalise les travaux",
  },
  {
    id: "intervention",
    number: 4,
    title: "Intervention du mainteneur",
    application: "Terrain / iGO",
    appColor: "text-green-700",
    appBg: "bg-green-50 border-green-200",
    icon: "🔧",
    summary: "Le mainteneur (AXIMA) intervient sur site, réalise les travaux et met à jour l'OT dans iGO.",
    actor: "Mainteneur (AXIMA CONCEPT)",
    details: [
      "Le technicien AXIMA se rend sur site dans les délais contractuels",
      "Délai D1 (diagnostic) : C1 = 8h, C2 = 8h ouvrées, C3 = 5 jours, C4 = 10 jours",
      "Réalisation des travaux de maintenance corrective",
      "Mise à jour du statut OT dans iGO : 3 (En cours) puis 4 (Terminé)",
      "Le technicien doit mettre des commentaires dans iGO pour documenter l'intervention",
    ],
    tips: [
      "Insister auprès d'AXIMA pour que les techniciens mettent systématiquement des commentaires",
      "Si réparation impossible immédiatement → mettre une date de réparation provisoire (demandé par QUADRIM)",
      "Si devis nécessaire → le mainteneur fournit un devis à analyser",
    ],
    warnings: [
      "Surveiller les délais D1 et D2 pour éviter les pénalités",
      "Si l'occupant n'est pas satisfait → statut 8 (À réviser) → retour au mainteneur",
    ],
    outputs: ["Travaux réalisés", "OT mise à jour (statut 4 Terminé)", "Commentaires dans iGO"],
    nextCondition: "Travaux terminés → besoin d'un devis ?",
    branches: [
      { label: "Devis nécessaire", targetId: "devis", color: "text-orange-600" },
      { label: "Pas de devis (contrat E2MT²)", targetId: "at_immosis", color: "text-emerald-600" },
    ],
  },
  {
    id: "devis",
    number: 5,
    title: "Analyse du devis",
    application: "CRM E2MT² / BPU",
    appColor: "text-purple-700",
    appBg: "bg-purple-50 border-purple-200",
    icon: "📊",
    summary: "Analyser le devis du mainteneur en le comparant au BPU contractuel pour vérifier la conformité des prix.",
    actor: "Pilote DIT",
    details: [
      "Réceptionner le devis du mainteneur (PDF ou papier)",
      "Utiliser l'outil Analyse de devis du CRM E2MT² pour comparer au BPU",
      "Vérifier chaque ligne : code prestation, prix unitaire, quantité",
      "Le CRM affiche un verdict : ✅ Conforme (vert), ⚠️ Écart (orange), ❌ Hors BPU (rouge)",
      "Si écart > 10% : demander une justification au mainteneur",
    ],
    tips: [
      "Le BPU contient 142 prestations référencées pour le lot 4.1",
      "Utiliser la page BPU du CRM pour rechercher les prix de référence",
    ],
    warnings: [
      "Ne jamais accepter un devis sans vérification BPU",
      "Les prix du BPU sont révisables annuellement selon la formule contractuelle",
    ],
    outputs: ["Devis analysé et validé/refusé", "Comparaison BPU documentée"],
  },
  {
    id: "at_immosis",
    number: 6,
    title: "Ouverture de l'AT dans IMMOSIS",
    application: "IMMOSIS",
    appColor: "text-indigo-700",
    appBg: "bg-indigo-50 border-indigo-200",
    icon: "📂",
    summary: "Créer l'Action Technique dans IMMOSIS pour le suivi budgétaire et la traçabilité.",
    actor: "Pilote DIT",
    details: [
      "Onglet TECHNIQUE dans IMMOSIS > Créer une nouvelle AT",
      "Nommer l'AT selon la convention : [Région]-[Année]-[SA]-[Sous-type]-[Description]-[UT]-[BAT]",
      "Exemple : 47-25-DI-VOY INDUS ISM-PTP E2MT-003818H-254",
      "Remplir : Gérant de programme, DIT, informations supplémentaires",
      "Choisir le type IMMOSIS parmi les 40 types répartis en 4 budgets (GE, Amiante/VR TVX, VR, CME/PTP)",
      "Contractualiser l'AT : renseigner le montant et les éléments budgétaires",
      "Changements d'état : CRÉÉE → EN COURS → CONTRACTUALISÉE",
    ],
    tips: [
      "Utiliser le Nommage AT du CRM pour générer automatiquement le nom normalisé",
      "Pour les AT annuelles (génériques) : le nom suit un format simplifié",
      "Vérifier l'axe local dans l'onglet Suivi Budgétaire",
    ],
    warnings: [
      "Ne pas oublier de contractualiser l'AT avant de passer à Connect'Immo",
      "Pour clôturer à 0€ : Contractualisation (montant 0€) + Suivi Budgétaire (montant 0€ + ventilation accostage global)",
    ],
    outputs: ["AT créée dans IMMOSIS avec N° AT", "AT contractualisée avec montant"],
  },
  {
    id: "connectimmo",
    number: 7,
    title: "Création du projet dans Connect'Immo",
    application: "Connect'Immo V3",
    appColor: "text-teal-700",
    appBg: "bg-teal-50 border-teal-200",
    icon: "🏗️",
    summary: "Créer ou rattacher la commande au projet OPEX dans Connect'Immo pour le suivi financier.",
    actor: "Pilote DIT",
    details: [
      "Accéder à Connect'Immo (Power Apps)",
      "Pour une AT générique : \"Modification en masse\" > Sélectionner région > N° ID PROJET",
      "Pour une AT ponctuelle : créer un nouveau projet OPEX",
      "Créer la commande : SYNTHÈSE COMMANDE > \"+\" > Crayon",
      "Remplacer \"MULTI\" par l'UT et le BIEN spécifiques",
      "Attendre la validation → renomination automatique de la commande",
      "Remplir les champs > Enregistrer > VIE DE LA COMMANDE > Montant",
      "Vérifier que l'axe central et l'axe local apparaissent dans la commande",
    ],
    tips: [
      "AT génériques 2025 : 47-25-0019 (DIVOY INDUS, 25k€), 47-25-0020 (DI-VOY PTP, 20k€)",
      "Le N° de projet Connect'Immo commence toujours par \"P-\"",
      "Utiliser les rapports Connect'Immo pour le suivi global des engagements",
    ],
    warnings: [
      "Toujours vérifier les axes central et local avant de valider",
      "Ne pas confondre AT générique et AT ponctuelle dans le rattachement",
    ],
    outputs: ["Commande créée dans Connect'Immo", "N° Projet (P-XX-XXXXXXX)", "Axes budgétaires vérifiés"],
  },
  {
    id: "da_dacia",
    number: 8,
    title: "Saisie de la DA dans DACIA",
    application: "DACIA",
    appColor: "text-rose-700",
    appBg: "bg-rose-50 border-rose-200",
    icon: "📝",
    summary: "Créer la Demande d'Achat dans DACIA en la rattachant au projet Connect'Immo.",
    actor: "Pilote DIT",
    details: [
      "Accéder à DACIA (Power Apps)",
      "Type de demande : choisir \"Maintenance\"",
      "Remplir avec le N° projet Connect'Immo (commençant par P)",
      "AT générique → N° projet de l'AT générique / Hors générique → N° projet précis",
      "Valider la DA",
      "Vérifier dans \"MES DA\" que la DA est bien présente",
      "Laisser Laurent RUIZ travailler (validation/traitement)",
    ],
    tips: [
      "Le N° projet DACIA doit correspondre exactement au N° projet Connect'Immo",
      "Vérifier régulièrement \"MES DA\" pour suivre l'avancement",
    ],
    warnings: [
      "Bien choisir \"Maintenance\" comme type de demande (pas \"Investissement\")",
    ],
    outputs: ["DA créée dans DACIA", "DA en attente de validation"],
  },
  {
    id: "da_erp",
    number: 9,
    title: "Traitement de la DA dans l'ERP",
    application: "ERP PeopleSoft",
    appColor: "text-cyan-700",
    appBg: "bg-cyan-50 border-cyan-200",
    icon: "💼",
    summary: "La DA est traitée dans l'ERP PeopleSoft : circuit d'approbation, puis transformation en Commande d'Achat (CDA).",
    actor: "Approbateurs / Acheteur",
    details: [
      "La DA arrive dans l'ERP via DACIA",
      "Circuit d'approbation selon les seuils : < 500€ HT (Pilote), < 5 000€ HT (Chef de pôle), etc.",
      "Suivre l'état : ERP > eProcurement > Gérer demande d'achat > N° DA > Rechercher",
      "En cas de refus : cliquer sur le lien du mail > \"Afficher commentaires\" pour voir la raison",
      "Pour modifier sans refaire la DA : Gérer DA > Option \"Modification\" > Détail ligne > Corriger > Resoumettre",
      "Une fois approuvée, la DA est transformée en CDA (Commande d'Achat)",
      "La CDA part automatiquement chez le mainteneur via DOCUSIGN",
    ],
    tips: [
      "Pour extraire le PDF de la DA : Gestion achats > DA > Statuts documents > Imprimante",
      "Le PDF fait 3 pages avec récapitulatif (N° DA, demandeur, infos comptables)",
      "Pour lister toutes ses DA : ne pas mettre de N°, juste son CP dans \"Demandeur\"",
    ],
    warnings: [
      "Entité (BUPO) : 01425 pour UA Grand Sud",
      "Si refus d'un approbateur, vérifier le commentaire avant de resoumettre",
    ],
    outputs: ["DA approuvée", "CDA générée et envoyée au mainteneur"],
  },
  {
    id: "reception",
    number: 10,
    title: "Réception dans l'ERP",
    application: "ERP PeopleSoft",
    appColor: "text-cyan-700",
    appBg: "bg-cyan-50 border-cyan-200",
    icon: "📦",
    summary: "Créer la réception dans l'ERP pour valider la prestation et déclencher le paiement.",
    actor: "Pilote DIT",
    details: [
      "ERP > Gestion des achats > Réceptions > Créer et mise à jour réception",
      "Mettre l'entité (01425) > Cliquer \"Créer\"",
      "Renseigner le N° de commande (pas obligé de mettre tous les 0)",
      "Supprimer les autres informations (hors entité d'achat)",
      "Cliquer \"Rechercher\" > Cocher la case devant l'entité > OK",
      "Enregistrer et valider les messages",
      "IMPORTANT : noter le numéro de réception",
    ],
    tips: [
      "Vérifier si une réception est nécessaire : Commandes d'achat > Consulter informations > Petite feuille",
      "Si \"Aucune réception obligatoire\" apparaît : pas de réception à faire",
      "Déposer le PV sur DACIA dans le petit carton de la ligne",
    ],
    warnings: [
      "Ne pas oublier de noter le numéro de réception !",
      "Vérifier que les travaux sont bien terminés avant de réceptionner",
    ],
    outputs: ["Réception créée dans l'ERP", "N° de réception noté", "PV déposé sur DACIA"],
  },
  {
    id: "cloture",
    number: 11,
    title: "Clôture de l'OT et de l'AT",
    application: "iGO + IMMOSIS",
    appColor: "text-slate-700",
    appBg: "bg-slate-50 border-slate-200",
    icon: "🏁",
    summary: "Clôturer l'OT dans iGO et l'AT dans IMMOSIS pour finaliser le cycle complet.",
    actor: "Pilote DIT",
    details: [
      "iGO : Mettre un commentaire final et passer l'OT au statut 5 (Clôturé) puis 6 (Réceptionné)",
      "IMMOSIS : Onglet \"Général\" > \"Action\" > \"Changer d'état\" > \"CLÔTURE\"",
      "Si modification du montant : Onglet \"Suivi Budgétaire\" > Modifier montant > puis clôturer",
      "Si clôture à 0€ : Contractualisation (montant 0€) + Suivi Budgétaire (montant 0€ + ventilation accostage global)",
      "Mettre à jour le tableau de suivi dans le CRM E2MT²",
    ],
    tips: [
      "Vérifier que tous les PV sont déposés avant de clôturer",
      "Mettre à jour le CRM E2MT² avec les dates réelles pour le suivi des délais",
    ],
    warnings: [
      "Une AT clôturée ne peut plus être modifiée",
      "Vérifier les montants finaux avant la clôture définitive",
    ],
    outputs: ["OT clôturée dans iGO", "AT clôturée dans IMMOSIS", "Cycle complet terminé"],
  },
];

// ─── Application colors for the flow diagram ────────────────────────────────
const APP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Terrain / Occupant": { bg: "bg-amber-500", text: "text-white", border: "border-amber-500" },
  "iGO (Coswin)": { bg: "bg-blue-500", text: "text-white", border: "border-blue-500" },
  "Terrain / iGO": { bg: "bg-green-500", text: "text-white", border: "border-green-500" },
  "CRM E2MT² / BPU": { bg: "bg-purple-500", text: "text-white", border: "border-purple-500" },
  "IMMOSIS": { bg: "bg-indigo-500", text: "text-white", border: "border-indigo-500" },
  "Connect'Immo V3": { bg: "bg-teal-500", text: "text-white", border: "border-teal-500" },
  "DACIA": { bg: "bg-rose-500", text: "text-white", border: "border-rose-500" },
  "ERP PeopleSoft": { bg: "bg-cyan-600", text: "text-white", border: "border-cyan-600" },
  "iGO + IMMOSIS": { bg: "bg-slate-600", text: "text-white", border: "border-slate-600" },
  "CP Gestionnaire / 3C": { bg: "bg-blue-500", text: "text-white", border: "border-blue-500" },
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function LogigrammePage() {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [isFullView, setIsFullView] = useState(false);

  const activeStepData = WORKFLOW_STEPS.find((s) => s.id === activeStep);

  const handleStepClick = useCallback((stepId: string) => {
    setActiveStep((prev) => (prev === stepId ? null : stepId));
  }, []);

  const goToNext = useCallback(() => {
    if (!activeStep) {
      setActiveStep(WORKFLOW_STEPS[0].id);
      return;
    }
    const idx = WORKFLOW_STEPS.findIndex((s) => s.id === activeStep);
    if (idx < WORKFLOW_STEPS.length - 1) {
      setActiveStep(WORKFLOW_STEPS[idx + 1].id);
    }
  }, [activeStep]);

  const goToPrev = useCallback(() => {
    if (!activeStep) return;
    const idx = WORKFLOW_STEPS.findIndex((s) => s.id === activeStep);
    if (idx > 0) {
      setActiveStep(WORKFLOW_STEPS[idx - 1].id);
    }
  }, [activeStep]);

  const resetView = useCallback(() => {
    setActiveStep(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Logigramme du flux de travail
          </h1>
          <p className="text-muted-foreground mt-1">
            De la Demande d'Intervention (DI) à la Réception — 11 étapes, 7 applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Vue globale
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullView(!isFullView)}
            className="gap-1.5"
          >
            {isFullView ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullView ? "Réduire" : "Agrandir"}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-medium text-muted-foreground mr-1">Applications :</span>
            {Object.entries(APP_COLORS).map(([app, colors]) => (
              <Badge
                key={app}
                className={`${colors.bg} ${colors.text} text-xs font-medium px-2 py-0.5`}
              >
                {app}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className={`grid gap-6 ${isFullView ? "grid-cols-1" : "lg:grid-cols-[1fr_420px]"}`}>
        {/* Flow Diagram */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Flux de travail DI → Réception</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="space-y-1">
              {WORKFLOW_STEPS.map((step, index) => {
                const colors = APP_COLORS[step.application] || { bg: "bg-gray-500", text: "text-white", border: "border-gray-500" };
                const isActive = activeStep === step.id;
                const isPast = activeStep
                  ? WORKFLOW_STEPS.findIndex((s) => s.id === activeStep) > index
                  : false;

                return (
                  <div key={step.id}>
                    {/* Step Node */}
                    <button
                      onClick={() => handleStepClick(step.id)}
                      className={`w-full text-left transition-all duration-200 rounded-xl border-2 p-3 group
                        ${isActive
                          ? `${step.appBg} border-current ring-2 ring-offset-1 ring-current/20 shadow-lg scale-[1.01]`
                          : isPast
                            ? "bg-muted/30 border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                            : "bg-card border-border hover:border-muted-foreground/40 hover:shadow-md"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Step number circle */}
                        <div
                          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                            ${isActive
                              ? `${colors.bg} ${colors.text}`
                              : isPast
                                ? "bg-muted-foreground/20 text-muted-foreground"
                                : `${colors.bg} ${colors.text}`
                            }`}
                        >
                          {step.number}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{step.icon}</span>
                            <h3 className={`font-semibold text-sm ${isActive ? step.appColor : "text-foreground"}`}>
                              {step.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${isActive ? colors.border + " " + step.appColor : ""}`}
                            >
                              {step.application}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {step.summary}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span>👤 {step.actor}</span>
                            <span>📤 {step.outputs.length} sortie{step.outputs.length > 1 ? "s" : ""}</span>
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <ChevronRight
                          className={`shrink-0 h-5 w-5 transition-transform ${isActive ? "rotate-90 " + step.appColor : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
                        />
                      </div>
                    </button>

                    {/* Connector Arrow */}
                    {index < WORKFLOW_STEPS.length - 1 && (
                      <div className="flex items-center justify-center py-0.5">
                        {step.branches ? (
                          <div className="flex items-center gap-4 py-1">
                            {step.branches.map((branch) => (
                              <button
                                key={branch.targetId}
                                onClick={() => handleStepClick(branch.targetId)}
                                className={`flex items-center gap-1 text-xs font-medium ${branch.color} hover:underline`}
                              >
                                <ArrowDown className="h-3 w-3" />
                                {branch.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {!isFullView && (
          <div className="space-y-4">
            {activeStepData ? (
              <>
                {/* Step Detail Card */}
                <Card className={`border-2 ${activeStepData.appBg}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{activeStepData.icon}</span>
                      <div>
                        <CardTitle className={`text-lg ${activeStepData.appColor}`}>
                          Étape {activeStepData.number} — {activeStepData.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activeStepData.application} • {activeStepData.actor}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground">{activeStepData.summary}</p>

                    {/* Detailed Steps */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Procédure détaillée
                      </h4>
                      <ol className="space-y-1.5">
                        {activeStepData.details.map((detail, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-foreground">{detail}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips */}
                    {activeStepData.tips.length > 0 && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Info className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-700">Astuces</span>
                        </div>
                        <ul className="space-y-1">
                          {activeStepData.tips.map((tip, i) => (
                            <li key={i} className="text-xs text-emerald-800 flex gap-1.5">
                              <span className="shrink-0">💡</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {activeStepData.warnings.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">Points d'attention</span>
                        </div>
                        <ul className="space-y-1">
                          {activeStepData.warnings.map((warning, i) => (
                            <li key={i} className="text-xs text-amber-800 flex gap-1.5">
                              <span className="shrink-0">⚠️</span>
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Outputs */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Sorties / Livrables
                      </h4>
                      <ul className="space-y-1">
                        {activeStepData.outputs.map((output, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="text-foreground">{output}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Branches */}
                    {activeStepData.branches && (
                      <div className="rounded-lg bg-muted/50 border p-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Embranchement
                        </h4>
                        <div className="space-y-1.5">
                          {activeStepData.branches.map((branch) => (
                            <button
                              key={branch.targetId}
                              onClick={() => handleStepClick(branch.targetId)}
                              className={`flex items-center gap-2 text-sm font-medium ${branch.color} hover:underline`}
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                              {branch.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrev}
                    disabled={WORKFLOW_STEPS.findIndex((s) => s.id === activeStep) === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {activeStepData.number} / {WORKFLOW_STEPS.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={WORKFLOW_STEPS.findIndex((s) => s.id === activeStep) === WORKFLOW_STEPS.length - 1}
                    className="gap-1"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              /* Placeholder when no step selected */
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="text-4xl mb-3">👈</div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Sélectionnez une étape
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Cliquez sur une étape du logigramme pour voir la procédure détaillée, les astuces et les points d'attention.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={goToNext}
                    className="mt-4 gap-1.5"
                  >
                    Commencer le parcours
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Summary Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Résumé du flux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <div className="text-2xl font-bold text-foreground">11</div>
                    <div className="text-[10px] text-muted-foreground">Étapes</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <div className="text-2xl font-bold text-foreground">7</div>
                    <div className="text-[10px] text-muted-foreground">Applications</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <div className="text-2xl font-bold text-foreground">4</div>
                    <div className="text-[10px] text-muted-foreground">Acteurs</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <div className="text-2xl font-bold text-foreground">1</div>
                    <div className="text-[10px] text-muted-foreground">Embranchement</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
