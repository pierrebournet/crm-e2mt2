import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Building2,
  ShoppingCart,
  Shield,
  Zap,
  MapPin,
  Wrench,
  FileText,
  MessageSquare,
  FolderArchive,
  BarChart3,
  ClipboardList,
  AlertTriangle,
  Smartphone,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ===== DATA =====

interface AppMetier {
  id: string;
  name: string;
  fullName: string;
  category: string;
  categoryIcon: any;
  categoryColor: string;
  description: string;
  features: string[];
  workflow: string[];
  integrations: string[];
  tips: string[];
}

const APPS_METIER: AppMetier[] = [
  {
    id: "immosis",
    name: "IMMOSIS",
    fullName: "Gestion du Référentiel Immobilier",
    category: "Patrimoine",
    categoryIcon: Building2,
    categoryColor: "bg-blue-100 text-blue-800",
    description: "Outil central de gestion du référentiel immobilier SNCF. Permet de gérer l'ensemble du cycle de vie des actifs immobiliers (bâtiments, terrains), incluant les informations techniques, locatives et financières. C'est le référentiel de base pour la création des AT (axes locaux).",
    features: [
      "Gestion du référentiel immobilier (bâtiments, terrains, locaux)",
      "Gestion locative et technique",
      "Suivi des consommations (CONSOS)",
      "Gestion des visites et équipements",
      "Suivi de l'amiante",
      "Cartographie et géolocalisation des biens",
      "Création des axes locaux pour les AT",
    ],
    workflow: [
      "Se connecter à IMMOSIS pour consulter les informations d'un bâtiment",
      "Accéder à la fiche du bâtiment (plans, contrats de maintenance, rapports de visites)",
      "Pour des travaux, initier une demande d'achat via l'ERP interfacé",
      "Suivre l'avancement des interventions",
      "Mettre à jour les données du patrimoine après les interventions",
    ],
    integrations: ["GÉO-IMMOSIS (cartographie)", "GINGEMBRE (GMAO)", "ERP PeopleSoft", "Qlik (BI)"],
    tips: [
      "L'axe local de la clé comptable est créé dans IMMOSIS lors de la création de l'AT",
      "Vérifier les données UT-BAT dans IMMOSIS avant de créer une commande dans Connect'Immo",
    ],
  },
  {
    id: "erp",
    name: "ERP PeopleSoft",
    fullName: "Système de Gestion des Achats",
    category: "Achat/Finance",
    categoryIcon: ShoppingCart,
    categoryColor: "bg-green-100 text-green-800",
    description: "Système de gestion des achats de la SNCF. Permet de créer et suivre les demandes d'achat (DA) et les commandes d'achat (CDA) pour les contrats de maintenance. La clé comptable (Compte Général, Entité PC, Projet, Activité, Axe Central, Axe Local) est renseignée dès la création de la DA.",
    features: [
      "Création et suivi des demandes d'achat (DA)",
      "Transformation DA en commandes d'achat (CDA)",
      "Gestion des fournisseurs et contrats-cadres",
      "Suivi budgétaire des achats",
      "Workflow de validation hiérarchique et comptable",
      "Gestion des réceptions",
    ],
    workflow: [
      "Identifier le besoin de maintenance sur un bâtiment",
      "Se connecter à l'ERP et créer une DA (Demande Spéciale pour travaux/prestations)",
      "Renseigner : BUPO (entité), fournisseur/contrat, catégorie d'achat, groupe d'achat",
      "Compléter la ligne comptable : Destinataire/Site, Entité GL, Entité PC, Projet, Activité",
      "Soumettre la DA → circuit d'approbation (contrôleur de gestion + hiérarchique)",
      "DA approuvée → transformation en CDA par le gestionnaire de commandes",
    ],
    integrations: ["IMMOSIS", "DACIA", "Connect'Immo"],
    tips: [
      "BUPO selon SA : SNCF=67858, Voyageurs=05335, Réseau=00077, Fret=00059",
      "Groupe d'achat : <40k€ = 67099_004 DIT GS, 40-90k€ = 67099_014 CADI, >90k€ = CAI locale",
      "Seuils : 600€-25k€ = 1 devis min, 25k€-40k€ = 3 fournisseurs min, >40k€ = appel d'offre",
      "Petits achats <50€ : note de frais (pas dans l'ERP)",
      "Hors contrat cadre : commande ERP obligatoire à partir de 600€ HT",
    ],
  },
  {
    id: "dacia",
    name: "DACIA",
    fullName: "Gestion des Données Patrimoine",
    category: "Patrimoine",
    categoryIcon: Building2,
    categoryColor: "bg-blue-100 text-blue-800",
    description: "Application de centralisation et fiabilisation des données du patrimoine immobilier. Offre des tableaux de bord, du reporting et de la cartographie des actifs pour optimiser la gestion, la maintenance et la valorisation du patrimoine.",
    features: [
      "Centralisation des données patrimoniales",
      "Tableaux de bord et reporting",
      "Cartographie des actifs",
      "Suivi des indicateurs de performance",
      "Historique des interventions de maintenance",
    ],
    workflow: [
      "Consulter le portefeuille de bâtiments gérés",
      "Rechercher un bâtiment pour préparer une visite ou un audit",
      "Consulter les données techniques et réglementaires",
      "Analyser les données de maintenance E2MT² pour identifier des anomalies",
      "Exporter les données pour les rapports de pilotage",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "Outils de GMAO"],
    tips: [
      "Utiliser DACIA pour croiser les données de maintenance avec les données patrimoniales",
    ],
  },
  {
    id: "connectimmo",
    name: "Connect'Immo",
    fullName: "Suivi des Opérations OPEX",
    category: "Patrimoine",
    categoryIcon: Building2,
    categoryColor: "bg-blue-100 text-blue-800",
    description: "Application centrale de suivi des opérations OPEX (dépenses d'exploitation) pour SNCF Immobilier. La refonte V3 hiérarchise les données : Projet Alpha → Projet principal (AT/OS) → Lignes commandes. Permet de suivre les projets, commandes et budgets de maintenance.",
    features: [
      "Écran d'accueil avec vue synthétique des opérations",
      "Suivi des opérations OPEX",
      "Gestion des projets principaux et commandes (AT/OS)",
      "Sélection multiple OPEX avec indicateurs statistiques",
      "Rapport OPEX",
      "Module des Traces (historique des modifications)",
    ],
    workflow: [
      "Consulter l'écran d'accueil pour une vue d'ensemble des opérations",
      "Accéder au suivi des opérations OPEX pour le détail",
      "Créer/modifier un projet principal (référence à une AT ou un OS)",
      "Gérer les lignes de commandes rattachées au projet",
      "Utiliser la sélection multiple pour les indicateurs statistiques",
      "Générer des rapports OPEX",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "DACIA"],
    tips: [
      "Un projet principal = une AT ou un OS",
      "Un projet crée dispose automatiquement d'une première commande",
      "5 cas d'usage : AT régionale (avec/sans UT-BAT), AT non-régionale (avec/sans BAT/UT)",
      "L'UT-BAT renseigné au niveau du projet principal est hérité au niveau de la commande",
      "La notion de 'projets' dans la V2 correspond aux 'commandes' dans la V3",
    ],
  },
  {
    id: "connectis",
    name: "Connect IS",
    fullName: "Portail Centralisé Information Système",
    category: "Patrimoine",
    categoryIcon: Globe,
    categoryColor: "bg-blue-100 text-blue-800",
    description: "Portail centralisé pour la gestion du patrimoine immobilier. Consolide les données de différentes applications métiers pour offrir une vue d'ensemble aux pilotes DIT.",
    features: [
      "Consultation du référentiel patrimoine",
      "Suivi des contrats de maintenance",
      "Gestion des demandes d'achat et suivi budgétaire",
      "Suivi des vérifications réglementaires",
      "Reporting et tableaux de bord",
    ],
    workflow: [
      "Se connecter pour une vue d'ensemble du portefeuille d'actifs",
      "Sélectionner un bâtiment pour consulter sa fiche détaillée",
      "Créer une demande d'intervention ou d'achat",
      "Suivre l'avancement des travaux et prestations",
      "Valider la fin des travaux et le paiement des factures",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "DACIA"],
    tips: [],
  },
  {
    id: "digiprev",
    name: "DIGIPREV-GROUPE",
    fullName: "Digitalisation des Plans de Prévention",
    category: "Sécurité",
    categoryIcon: Shield,
    categoryColor: "bg-red-100 text-red-800",
    description: "Application de dématérialisation des plans de prévention pour les travaux de maintenance. Assure la sécurité des opérations et la conformité réglementaire via la création, validation et signature électronique des plans.",
    features: [
      "Création et édition numérique des plans de prévention",
      "Validation et signature électronique",
      "Bibliothèque de modèles",
      "Consultation et partage en temps réel",
      "Suivi de la mise en œuvre des mesures de sécurité",
      "Génération de rapports de prévention",
    ],
    workflow: [
      "Initier un nouveau plan de prévention pour une opération de maintenance",
      "Collaborer avec le prestataire pour définir risques et mesures préventives",
      "Soumettre à validation interne par les responsables sécurité",
      "Signer électroniquement le plan (pilote DIT + prestataire)",
      "Archiver et partager avec les équipes terrain (consultation sur tablette)",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "DACIA"],
    tips: [
      "Le plan de prévention doit être validé AVANT le lancement des travaux",
      "Les plans sont accessibles sur tablette pour les équipes terrain",
    ],
  },
  {
    id: "econso",
    name: "eCONSO DeepKi",
    fullName: "Suivi des Consommations Énergétiques",
    category: "Énergie",
    categoryIcon: Zap,
    categoryColor: "bg-yellow-100 text-yellow-800",
    description: "Plateforme de suivi des consommations énergétiques (électricité, gaz, eau) pour plus de 33 000 bâtiments SNCF. Développée avec Deepki, elle permet d'identifier les gisements d'économies et de contribuer aux objectifs de décarbonation.",
    features: [
      "Collecte automatisée des données (900+ fournisseurs)",
      "Tableaux de bord et analyses visuelles",
      "Détection d'alertes et anomalies",
      "Suivi des émissions CO2 et trajectoires de décarbonation",
      "Reporting réglementaire et personnalisé",
      "Benchmarking entre bâtiments similaires",
    ],
    workflow: [
      "Consulter les données du portefeuille de bâtiments",
      "Analyser les tableaux de bord pour identifier les sites énergivores",
      "Investiguer les alertes (fuite d'eau, déréglage équipement)",
      "Suivre l'impact des travaux de rénovation énergétique",
      "Extraire des rapports pour la hiérarchie ou les audits",
    ],
    integrations: ["Fournisseurs d'énergie (900+)", "ERP (refacturation)", "IMMOSIS"],
    tips: [
      "Utiliser les alertes pour détecter rapidement les dérives de consommation",
      "Croiser les données de consommation avec les interventions de maintenance",
    ],
  },
  {
    id: "efiche",
    name: "eFICHE_DEMOL",
    fullName: "Gestion des Fiches de Démolition",
    category: "Patrimoine",
    categoryIcon: Building2,
    categoryColor: "bg-blue-100 text-blue-800",
    description: "Application de gestion dématérialisée des fiches de démolition des bâtiments du parc immobilier ferroviaire. Standardise et archive le processus de démolition de la demande initiale à la finalisation des travaux.",
    features: [
      "Création et gestion des fiches de démolition",
      "Saisie des informations techniques et administratives",
      "Suivi des étapes du projet de démolition",
      "Centralisation et archivage des documents",
      "Workflow de validation",
    ],
    workflow: [
      "Créer une fiche suite à l'identification d'un bâtiment à démolir",
      "Renseigner les détails du bâtiment et les motifs de démolition",
      "Soumettre pour validation (hiérarchie, experts techniques)",
      "Suivre l'avancement du projet de démolition",
      "Clôturer et archiver la fiche une fois la démolition terminée",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "DACIA"],
    tips: [],
  },
  {
    id: "geoprism",
    name: "Géoprism",
    fullName: "Système d'Information Géographique (SIG)",
    category: "Cartographie",
    categoryIcon: MapPin,
    categoryColor: "bg-purple-100 text-purple-800",
    description: "SIG de SNCF Immobilier pour la gestion et valorisation du patrimoine foncier et immobilier. Permet de visualiser et analyser les actifs sur une carte, servant de référentiel géographique pour les autres applications.",
    features: [
      "Visualisation cartographique du patrimoine",
      "Mise à jour de l'inventaire des biens",
      "Analyse de données géospatiales",
      "Recherche de documents techniques géolocalisés (DTA)",
    ],
    workflow: [
      "Localiser précisément un bâtiment et visualiser son environnement",
      "Accéder aux informations du patrimoine (limites de propriété, plans)",
      "Consulter les documents techniques associés",
      "Planifier l'intervention et évaluer les contraintes",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "DACIA", "PAM (DTA)"],
    tips: [
      "Utiliser la recherche cartographique pour les DTA (Dossiers Techniques Amiante)",
    ],
  },
  {
    id: "carnet",
    name: "Carnet de Santé",
    fullName: "Vision 360° des Bâtiments",
    category: "Patrimoine",
    categoryIcon: ClipboardList,
    categoryColor: "bg-blue-100 text-blue-800",
    description: "Outil offrant une vision à 360° des données d'un bâtiment. Centralise et consolide les informations patrimoniales avec possibilité de saisie terrain (mode déconnecté) et géolocalisation.",
    features: [
      "Consultation des données bâtimentaires (état, plans, contrats)",
      "Saisie de données sur le terrain (vétusté, relevés, photos)",
      "Géolocalisation des bâtiments",
      "Mode déconnecté pour utilisation hors ligne",
      "Tableau de bord personnalisable",
      "Partage d'informations et commentaires",
    ],
    workflow: [
      "Consulter la fiche d'un bâtiment pour préparer une visite",
      "Utiliser l'application sur le terrain (plans, informations techniques)",
      "Saisir les comptes-rendus d'intervention, photos et relevés",
      "Créer des alertes ou demandes d'intervention",
      "Suivre les indicateurs de maintenance via les tableaux de bord",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "QlikView"],
    tips: [
      "Le mode déconnecté permet de travailler sur le terrain même sans réseau",
    ],
  },
  {
    id: "gaia",
    name: "GAÏA",
    fullName: "Gestion des Achats et Interventions",
    category: "Achat/Finance",
    categoryIcon: ShoppingCart,
    categoryColor: "bg-green-100 text-green-800",
    description: "Application de gestion des achats et des interventions pour SNCF Immobilier. Permet de suivre les processus d'achat et les interventions de maintenance de manière intégrée.",
    features: [
      "Gestion des processus d'achat",
      "Suivi des interventions",
      "Tableaux de bord et reporting",
    ],
    workflow: [
      "Consulter les processus d'achat en cours",
      "Suivre les interventions associées",
      "Générer des rapports de suivi",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft"],
    tips: [],
  },
  {
    id: "knitiv",
    name: "Knitiv",
    fullName: "GED Maintenance (Facility Manager)",
    category: "Maintenance",
    categoryIcon: Wrench,
    categoryColor: "bg-orange-100 text-orange-800",
    description: "Plateforme de Gestion Électronique de Documents (GED) spécialisée pour la maintenance immobilière. Interface collaborative entre SNCF Immobilier et ses prestataires pour centraliser, partager et piloter les documents et informations de maintenance.",
    features: [
      "Gestion centralisée des documents (contrats, rapports, plans)",
      "Suivi des projets de maintenance et interventions",
      "Gestion des droits et accès (SNCF, mainteneurs)",
      "Traçabilité complète des échanges et modifications",
      "Tableaux de bord conformité réglementaire",
    ],
    workflow: [
      "Consulter les demandes d'intervention et plannings de maintenance préventive",
      "Suivre en temps réel l'avancement des prestations des mainteneurs",
      "Réceptionner et valider les livrables (rapports, photos, devis)",
      "Échanger avec les mainteneurs pour questions ou précisions",
      "Utiliser les données consolidées pour piloter les contrats et préparer les reportings",
    ],
    integrations: ["ERP PeopleSoft", "IMMOSIS"],
    tips: [
      "Knitiv est l'outil principal d'échange avec les prestataires E2MT²",
      "Valider les livrables dans Knitiv avant de procéder au paiement",
    ],
  },
  {
    id: "mais",
    name: "MAÏS",
    fullName: "Maîtrise de l'Archivage et de l'Information Stratégique",
    category: "Archives",
    categoryIcon: FolderArchive,
    categoryColor: "bg-gray-100 text-gray-800",
    description: "Application de gestion et recherche dans les archives historiques de la SNCF. Permet d'accéder au fonds documentaire du Centre des Archives Historiques (CAH), incluant les archives immobilières (plans anciens, historique des travaux, servitudes).",
    features: [
      "Recherche dans les archives historiques",
      "Consultation des fonds documentaires",
      "Gestion de l'archivage et de l'information stratégique",
    ],
    workflow: [
      "Identifier un besoin d'information sur un bâtiment ou terrain",
      "Contacter le Centre des Archives Historiques (CAH)",
      "L'archiviste effectue la recherche dans MAÏS",
      "Les documents pertinents sont extraits et transmis",
    ],
    integrations: [],
    tips: [
      "L'accès se fait via les archivistes du CAH, pas en accès direct",
      "Utile pour retrouver des plans anciens ou l'historique des travaux",
    ],
  },
  {
    id: "myhorizon",
    name: "myHorizon",
    fullName: "Gestion de Projets Immobilier",
    category: "Projets",
    categoryIcon: BarChart3,
    categoryColor: "bg-indigo-100 text-indigo-800",
    description: "Application de gestion de projets pour SNCF Immobilier. Aide les pilotes DIT à planifier, suivre et gérer les projets de maintenance et de valorisation du patrimoine avec une perspective à long terme.",
    features: [
      "Planification et suivi des projets",
      "Gestion des tâches et des ressources",
      "Suivi budgétaire et financier",
      "Gestion documentaire des projets",
      "Tableaux de bord et reporting",
    ],
    workflow: [
      "Créer un nouveau projet de maintenance ou de valorisation",
      "Définir les objectifs, le budget et le calendrier",
      "Affecter les ressources et tâches aux équipes/prestataires",
      "Suivre l'avancement des travaux et mettre à jour les statuts",
      "Valider les livrables et factures",
      "Clôturer le projet et archiver les documents",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "DACIA"],
    tips: [],
  },
  {
    id: "mypim",
    name: "myPIM",
    fullName: "Gestion de l'Information Patrimoine",
    category: "Patrimoine",
    categoryIcon: Building2,
    categoryColor: "bg-blue-100 text-blue-800",
    description: "Application centralisant les données techniques, administratives et financières des actifs immobiliers pour faciliter la gestion et le pilotage du patrimoine.",
    features: [
      "Consultation des fiches descriptives du patrimoine",
      "Suivi des données de maintenance et d'exploitation",
      "Gestion des contrats et des baux",
      "Cartographie du patrimoine",
      "Reporting et tableaux de bord",
    ],
    workflow: [
      "Consulter le portefeuille de bâtiments de son périmètre",
      "Rechercher un bâtiment pour accéder à sa fiche détaillée",
      "Analyser les données de maintenance pour préparer un appel d'offres",
      "Exporter les données patrimoniales pour un rapport de gestion",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "DACIA"],
    tips: [],
  },
  {
    id: "pam",
    name: "PAM",
    fullName: "Plan Amiante",
    category: "Réglementaire",
    categoryIcon: AlertTriangle,
    categoryColor: "bg-amber-100 text-amber-800",
    description: "Outil de gestion et suivi du risque amiante dans le patrimoine immobilier SNCF. Centralise les informations relatives à la présence d'amiante (diagnostics, rapports de repérage, plans de retrait) pour garantir la sécurité et la conformité réglementaire.",
    features: [
      "Centralisation des Dossiers Techniques Amiante (DTA)",
      "Identification et localisation des matériaux contenant de l'amiante",
      "Suivi des contrôles périodiques et mesures d'empoussièrement",
      "Aide à la planification des travaux de retrait ou confinement",
      "Traçabilité des interventions sur sites amiantés",
    ],
    workflow: [
      "Vérifier la présence d'un DTA pour un bâtiment concerné par une intervention",
      "Analyser le DTA pour identifier les zones à risque avant un appel d'offres",
      "Saisir ou mettre à jour les informations suite à un diagnostic ou désamiantage",
      "Planifier les contrôles réglementaires périodiques",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "SMAJIC"],
    tips: [
      "TOUJOURS vérifier le DTA dans PAM avant de lancer des travaux sur un bâtiment",
      "Le DTA est obligatoire pour tout bâtiment construit avant le 1er juillet 1997",
    ],
  },
  {
    id: "smajic",
    name: "SMAJIC",
    fullName: "Gestion des Sinistres Majeurs",
    category: "Maintenance",
    categoryIcon: AlertTriangle,
    categoryColor: "bg-orange-100 text-orange-800",
    description: "Application de Gestion Électronique de Documents (GED) spécialisée dans la gestion des sinistres majeurs affectant le patrimoine immobilier. Centralise et suit l'ensemble des informations et documents liés à un sinistre.",
    features: [
      "Gestion électronique des documents liés aux sinistres",
      "Suivi de l'avancement des dossiers de sinistre",
      "Interface avec IMMOSIS, PAM, SPA",
      "Déploiement de WebServices SOAP pour l'intégration",
    ],
    workflow: [
      "Signaler un sinistre majeur sur un bâtiment",
      "Créer un nouveau dossier de sinistre dans SMAJIC",
      "Téléverser les pièces justificatives (rapports, photos, devis)",
      "Suivre l'évolution du dossier jusqu'à sa clôture",
      "Partager les données avec les applications tierces",
    ],
    integrations: ["IMMOSIS", "PAM", "SPA"],
    tips: [
      "Documenter immédiatement le sinistre avec photos et rapports",
    ],
  },
  {
    id: "spa",
    name: "SPA",
    fullName: "Simplification des Plans d'Actions",
    category: "Maintenance",
    categoryIcon: ClipboardList,
    categoryColor: "bg-orange-100 text-orange-800",
    description: "Application de création, pilotage et suivi des plans d'actions. Sert à structurer les démarches de gestion du patrimoine : maintenance des bâtiments, mise en conformité réglementaire, gestion des processus de cessions immobilières.",
    features: [
      "Création et gestion de plans d'actions",
      "Suivi de l'avancement des tâches et échéances",
      "Assignation des actions à des responsables",
      "Centralisation et mutualisation des plans d'actions",
      "Reporting et tableaux de bord",
    ],
    workflow: [
      "Identifier un besoin (maintenance, travaux, mise en conformité)",
      "Créer un nouveau plan d'action avec objectif et parties prenantes",
      "Détailler les actions, délais et assigner les tâches",
      "Suivre l'avancement et mettre à jour les statuts",
      "Clôturer le plan d'action une fois toutes les actions terminées",
    ],
    integrations: ["ERP PeopleSoft", "IMMOSIS", "DACIA"],
    tips: [],
  },
  {
    id: "kizeo",
    name: "Kizéo Forms",
    fullName: "Formulaires Terrain Mobile (PEC)",
    category: "Maintenance",
    categoryIcon: Smartphone,
    categoryColor: "bg-orange-100 text-orange-800",
    description: "Application mobile et web de digitalisation des formulaires papier et collecte de données terrain. Utilisée pour dématérialiser les processus de maintenance et gestion du patrimoine, notamment les PEC (Prises En Charge) et contrôles réglementaires.",
    features: [
      "Création de formulaires numériques personnalisés",
      "Collecte de données enrichies (photos, signatures, géolocalisation)",
      "Mode hors-ligne",
      "Automatisation de la génération et envoi de rapports PDF",
      "Workflows de validation",
      "Intégration via API",
    ],
    workflow: [
      "Créer et configurer les formulaires (pilote DIT)",
      "Les techniciens accèdent aux formulaires sur mobile",
      "Remplissage du formulaire sur le terrain",
      "Soumission et synchronisation → rapport PDF automatique",
      "Envoi instantané au pilote DIT pour validation",
      "Intégration des données dans les outils de gestion SNCF",
    ],
    integrations: ["IMMOSIS", "ERP PeopleSoft", "DACIA"],
    tips: [
      "Configurer les formulaires avec les champs obligatoires pour garantir la qualité des données",
      "Le mode hors-ligne permet de travailler dans les zones sans réseau",
    ],
  },
  {
    id: "teams",
    name: "Teams Microsoft",
    fullName: "Collaboration et Communication",
    category: "Communication",
    categoryIcon: MessageSquare,
    categoryColor: "bg-cyan-100 text-cyan-800",
    description: "Plateforme de communication et collaboration unifiée. Hub central pour le pilotage des projets et contrats E2MT², facilitant les échanges en temps réel, le partage de documents et l'organisation de réunions.",
    features: [
      "Messagerie instantanée (chat individuel et groupe)",
      "Création d'équipes et canaux dédiés par projet/contrat",
      "Visioconférence et appels audio",
      "Partage et co-édition de fichiers (Word, Excel)",
      "Intégration d'applications Microsoft 365 (Planner, OneNote, SharePoint)",
    ],
    workflow: [
      "Créer une Équipe dédiée pour le contrat E2MT² Grand Sud",
      "Mettre en place des canaux par sujet (Suivi interventions, Validations réglementaires, Budget)",
      "Communiquer quotidiennement avec prestataires et équipes internes",
      "Organiser des réunions vidéo hebdomadaires de suivi",
      "Stocker les documents contractuels dans l'onglet Fichiers",
      "Utiliser Tasks/Planner pour assigner et suivre les actions",
    ],
    integrations: ["Power Platform (Power Apps, Power BI)", "SharePoint", "Planner", "OneNote"],
    tips: [
      "Créer des canaux séparés pour chaque sujet majeur du contrat",
      "Utiliser l'onglet Fichiers pour centraliser les documents partagés",
      "Intégrer Power BI pour afficher des données directement dans Teams",
    ],
  },
];

const CATEGORIES = [
  { id: "all", label: "Toutes", count: APPS_METIER.length },
  { id: "Patrimoine", label: "Patrimoine", count: APPS_METIER.filter(a => a.category === "Patrimoine").length },
  { id: "Achat/Finance", label: "Achat/Finance", count: APPS_METIER.filter(a => a.category === "Achat/Finance").length },
  { id: "Maintenance", label: "Maintenance", count: APPS_METIER.filter(a => a.category === "Maintenance").length },
  { id: "Sécurité", label: "Sécurité", count: APPS_METIER.filter(a => a.category === "Sécurité").length },
  { id: "Réglementaire", label: "Réglementaire", count: APPS_METIER.filter(a => a.category === "Réglementaire").length },
  { id: "Énergie", label: "Énergie", count: APPS_METIER.filter(a => a.category === "Énergie").length },
  { id: "Cartographie", label: "Cartographie", count: APPS_METIER.filter(a => a.category === "Cartographie").length },
  { id: "Projets", label: "Projets", count: APPS_METIER.filter(a => a.category === "Projets").length },
  { id: "Archives", label: "Archives", count: APPS_METIER.filter(a => a.category === "Archives").length },
  { id: "Communication", label: "Communication", count: APPS_METIER.filter(a => a.category === "Communication").length },
];

// ===== COMPONENT =====

function AppCard({ app }: { app: AppMetier }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = app.categoryIcon;

  return (
    <Card className="border border-border/50 hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${app.categoryColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold">{app.name}</CardTitle>
              <CardDescription className="text-xs truncate">{app.fullName}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 text-xs ${app.categoryColor} border-0`}>
            {app.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>

        {/* Features summary */}
        <div className="flex flex-wrap gap-1.5">
          {app.features.slice(0, 3).map((f, i) => (
            <Badge key={i} variant="secondary" className="text-xs font-normal">
              {f.length > 40 ? f.slice(0, 37) + "..." : f}
            </Badge>
          ))}
          {app.features.length > 3 && (
            <Badge variant="secondary" className="text-xs font-normal">
              +{app.features.length - 3}
            </Badge>
          )}
        </div>

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Masquer les détails
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Voir le workflow et les détails
            </>
          )}
        </Button>

        {expanded && (
          <div className="space-y-4 pt-2 border-t">
            {/* Fonctionnalités */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Fonctionnalités
              </h4>
              <ul className="space-y-1">
                {app.features.map((f, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Workflow */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                Workflow Pilote DIT
              </h4>
              <ol className="space-y-1.5">
                {app.workflow.map((step, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center shrink-0 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Intégrations */}
            {app.integrations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  Intégrations
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {app.integrations.map((integ, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {integ}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {app.tips.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold mb-1.5 text-amber-800">
                  Conseils pratiques
                </h4>
                <ul className="space-y-1">
                  {app.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <span className="mt-0.5">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== LOGIGRAMME TAB =====

function LogigrammeTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logigramme : Processus de Demande d'Achat (DA)</CardTitle>
          <CardDescription>Circuit complet de la DA dans l'ERP PeopleSoft</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {[
              { step: "1", label: "Identification du besoin", detail: "Le pilote DIT identifie un besoin de maintenance sur un bâtiment", color: "bg-blue-500" },
              { step: "2", label: "Création de la DA dans l'ERP", detail: "Sélectionner Demande Spéciale → Prestations/Travaux → Renseigner BUPO, fournisseur, catégorie d'achat", color: "bg-blue-500" },
              { step: "3", label: "Ligne comptable", detail: "Renseigner : Destinataire/Site, Entité GL, Entité PC, Projet, Activité → RG et Division remontent automatiquement", color: "bg-blue-500" },
              { step: "4", label: "Groupe d'achat", detail: "<40k€ → DIT GS (67099_004) | 40-90k€ → CADI (67099_014) | >90k€ → CAI locale", color: "bg-amber-500" },
              { step: "5", label: "Soumission", detail: "DA soumise → statut 'en attente d'approbation'", color: "bg-blue-500" },
              { step: "6", label: "Approbation comptable", detail: "Le contrôleur de gestion vérifie et approuve la clé comptable", color: "bg-green-500" },
              { step: "7", label: "Approbation hiérarchique", detail: "L'approbateur hiérarchique valide la DA", color: "bg-green-500" },
              { step: "8", label: "Transformation en CDA", detail: "DA approuvée → le gestionnaire de commandes transforme en Commande d'Achat", color: "bg-emerald-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`${item.color} text-white rounded-full h-8 w-8 flex items-center justify-center shrink-0 text-sm font-bold`}>
                  {item.step}
                </div>
                <div className="flex-1 border rounded-lg p-3 bg-card">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
                {i < 7 && (
                  <div className="absolute left-[19px] mt-8 h-2 w-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logigramme : Seuils de Consultation</CardTitle>
          <CardDescription>Obligations selon le montant de l'achat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <p className="text-sm font-bold text-green-800">&lt; 50€</p>
              <p className="text-xs text-green-700 mt-1">Note de frais</p>
              <p className="text-xs text-green-600 mt-0.5">Pas dans l'ERP</p>
            </div>
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <p className="text-sm font-bold text-blue-800">600€ - 25k€</p>
              <p className="text-xs text-blue-700 mt-1">1 devis minimum</p>
              <p className="text-xs text-blue-600 mt-0.5">Commande ERP obligatoire</p>
            </div>
            <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
              <p className="text-sm font-bold text-amber-800">25k€ - 40k€</p>
              <p className="text-xs text-amber-700 mt-1">Consultation simplifiée</p>
              <p className="text-xs text-amber-600 mt-0.5">3 fournisseurs minimum</p>
            </div>
            <div className="border rounded-lg p-4 bg-red-50 border-red-200">
              <p className="text-sm font-bold text-red-800">&gt; 40k€</p>
              <p className="text-xs text-red-700 mt-1">Appel d'offre</p>
              <p className="text-xs text-red-600 mt-0.5">Par DI ou CAI</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logigramme : Connect'Immo — Hiérarchie des données</CardTitle>
          <CardDescription>Architecture V3 : Projet Alpha → Projet principal → Commandes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 border">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-purple-100 border-2 border-purple-400 rounded-lg px-6 py-3 text-center">
                  <p className="text-sm font-bold text-purple-800">Projet Alpha</p>
                  <p className="text-xs text-purple-600">Regroupement de projets principaux</p>
                </div>
                <div className="h-6 w-0.5 bg-purple-300" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {[
                    { label: "OS.1", type: "Ordre de Service", cmds: ["Cmd.1A"] },
                    { label: "OS.2", type: "Ordre de Service", cmds: ["Cmd.2A", "Cmd.2B", "Cmd.2C"] },
                    { label: "AT.1", type: "Autorisation de Travaux", cmds: ["Cmd.1A", "Cmd.1B"] },
                  ].map((proj, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="bg-blue-100 border-2 border-blue-400 rounded-lg px-4 py-2 text-center w-full">
                        <p className="text-sm font-bold text-blue-800">{proj.label}</p>
                        <p className="text-xs text-blue-600">{proj.type}</p>
                      </div>
                      <div className="h-4 w-0.5 bg-blue-300" />
                      <div className="flex flex-col gap-1 w-full">
                        {proj.cmds.map((cmd, j) => (
                          <div key={j} className="bg-green-50 border border-green-300 rounded px-3 py-1.5 text-center">
                            <p className="text-xs font-medium text-green-800">{cmd}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border rounded-lg p-3 bg-card">
                <p className="text-sm font-semibold">Règles clés</p>
                <ul className="mt-2 space-y-1">
                  <li className="text-xs text-muted-foreground">• Un projet principal = une AT ou un OS</li>
                  <li className="text-xs text-muted-foreground">• Un projet crée dispose automatiquement d'une 1ère commande</li>
                  <li className="text-xs text-muted-foreground">• L'UT-BAT du projet est hérité au niveau de la commande</li>
                </ul>
              </div>
              <div className="border rounded-lg p-3 bg-card">
                <p className="text-sm font-semibold">5 cas d'usage</p>
                <ul className="mt-2 space-y-1">
                  <li className="text-xs text-muted-foreground">1. AT régionale sans UT-BAT (forfaitaires/EMT)</li>
                  <li className="text-xs text-muted-foreground">2. AT régionale avec UT-BAT au niveau commande (PTP)</li>
                  <li className="text-xs text-muted-foreground">3. AT non-régionale avec UT, sans BAT</li>
                  <li className="text-xs text-muted-foreground">4. AT non-régionale avec UT et BAT au niveau commande</li>
                  <li className="text-xs text-muted-foreground">5. AT non-régionale avec UT-BAT hérité du projet</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logigramme : BUPO par SA</CardTitle>
          <CardDescription>Codes entité selon la Société Anonyme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { sa: "SA SNCF", code: "67858", color: "bg-slate-100 border-slate-300" },
              { sa: "SA Voyageurs", code: "05335", color: "bg-blue-50 border-blue-300" },
              { sa: "SA Réseau", code: "00077", color: "bg-green-50 border-green-300" },
              { sa: "SAS Fret", code: "00059", color: "bg-orange-50 border-orange-300" },
            ].map((item, i) => (
              <div key={i} className={`border rounded-lg p-4 text-center ${item.color}`}>
                <p className="text-sm font-bold">{item.sa}</p>
                <p className="text-2xl font-mono font-bold mt-2">{item.code}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sites Destinataires Grand Sud</CardTitle>
          <CardDescription>Codes sites pour les 3 régions du périmètre E2MT²</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { ville: "Marseille", code: "SD001", region: "58 - PACA" },
              { ville: "Montpellier", code: "SD002", region: "59 - Occitanie Est" },
              { ville: "Toulouse", code: "SD003", region: "47 - Occitanie Ouest" },
            ].map((item, i) => (
              <div key={i} className="border rounded-lg p-4 text-center bg-card">
                <p className="text-lg font-bold">{item.ville}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.region}</p>
                <p className="text-xl font-mono font-bold mt-2 text-primary">{item.code}</p>
                <p className="text-xs text-muted-foreground mt-1">67099 ou 00077 ou 05335 {item.code}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== MAIN PAGE =====

export default function ReferentielOutilsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredApps = useMemo(() => {
    return APPS_METIER.filter((app) => {
      const matchesSearch =
        !search ||
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.fullName.toLowerCase().includes(search.toLowerCase()) ||
        app.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || app.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Référentiel Outils Métier</h1>
        <p className="text-sm text-muted-foreground mt-1">
          20 applications métier SNCF Immobilier utilisées par le pilote DIT — descriptions, workflows et logigrammes
        </p>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Applications ({APPS_METIER.length})</TabsTrigger>
          <TabsTrigger value="logigrammes">Logigrammes & Procédures</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une application..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter(c => c.count > 0).map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label} ({cat.count})
              </Button>
            ))}
          </div>

          {/* Apps grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>Aucune application trouvée pour cette recherche.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logigrammes">
          <LogigrammeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
