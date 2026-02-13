import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Compass,
  Search,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  BookMarked,
  ListChecks,
  FileText,
} from "lucide-react";
import { useState, useMemo } from "react";

// ─── Tutorial Data ───────────────────────────────────────────────
type Tutorial = {
  id: number;
  title: string;
  shortTitle: string;
  summary: string;
  category: "procedure" | "formation" | "guide";
  icon: typeof GraduationCap;
  color: string;
  steps: string;
  rules: string;
  glossary: string;
};

const tutorials: Tutorial[] = [
  {
    id: 1,
    title: "Procédure application PERIMETRES",
    shortTitle: "App PERIMETRES",
    summary:
      "Cette procédure décrit l'utilisation de l'application \"PERIMETRES\", qui sert à configurer le périmètre géographique du contrat E2MT². L'application permet d'affecter des missions techniques aux bâtiments et installations foncières issus d'Immosis.",
    category: "procedure",
    icon: Compass,
    color: "bg-blue-500",
    steps: `### Sélectionner un lot géographique
1. Si votre profil le permet, sélectionnez le lot à afficher via le sélecteur présent en haut à gauche de l'écran.

### Consulter la fiche d'un bien
1. Sélectionnez le bien dans la liste présente à gauche de l'écran.
2. Utilisez le champ de recherche pour filtrer la liste si nécessaire.

### Modifier la fiche d'un bien
1. Assurez-vous de disposer d'un profil « pilote » ou « administrateur ».
2. Accédez à la fiche du bien à modifier.
3. Cliquez sur le bouton de modification présent en haut à droite de la fiche.
4. Modifiez les informations autorisées.
5. Validez ou annulez la modification en cliquant sur les boutons situés en haut à droite.
6. Saisissez un commentaire de suivi explicite, qui est obligatoire pour valider la modification.

### Réaliser un export Excel
1. Filtrez la liste des biens via le champ « rechercher » si vous ne souhaitez pas exporter l'ensemble du lot.
2. Cliquez sur le bouton d'export situé en haut à droite de l'écran pour télécharger le fichier.`,
    rules: `- Les terrains (T) ne sont pas gérés dans l'application.
- Il n'est pas possible d'afficher les biens de plusieurs lots géographiques simultanément.
- Seul le profil administrateur peut déplacer un bien d'un lot à l'autre.
- Les informations provenant d'Immosis ne sont pas modifiables dans cette application et doivent être corrigées à la source.
- La mission B se déclenche automatiquement dès qu'une autre mission technique est activée.
- Un commentaire de suivi est obligatoire pour toute validation de modification d'une fiche.`,
    glossary: `**Administrateur** : Profil avec accès en consultation et modification sans aucune restriction.
**Pilote** : Profil avec accès en consultation et modification, restreint à un périmètre de donneur d'ordre et/ou à un ou plusieurs lots géographiques.
**Prestataire** : Profil avec accès en consultation uniquement, restreint à un ou plusieurs lots géographiques.
**B** : Bâtiment.
**IF** : Installation Foncière.
**Immosis** : Système d'information source pour les données des biens (bâtiments et installations foncières).
**Lot géographique** : Division territoriale issue du contrat E2MT². Il en existe 18.
**Donneur d'ordre** : Entité qui commande les prestations.`,
  },
  {
    id: 2,
    title: "Procédure saisie Kizéo PEC",
    shortTitle: "Saisie Kizéo",
    summary:
      "Ce document détaille la procédure d'état des lieux des équipements pour le projet E2MT², en utilisant l'application Kizéo Forms. Il explique comment les prestataires doivent relever les informations sur les équipements pour alimenter la GMAO IGO.",
    category: "procedure",
    icon: ClipboardCheck,
    color: "bg-emerald-500",
    steps: `### Procédure générale

1. **Utilisation du formulaire KIZEO**
   - Installer l'application Kizéo Forms depuis l'Apple Store ou Google Play Store.
   - Se connecter avec le code entreprise, l'identifiant et le mot de passe fournis par la SNCF.
   - Sélectionner le formulaire correspondant à la mission et à la zone.
   - Compléter les champs obligatoires (marqués d'un astérisque rouge) de manière fiable.
   - Utiliser le bouton "Brouillon" pour sauvegarder un formulaire incomplet.

2. **Téléchargement et vérification via le backoffice**
   - Accéder au backoffice sur https://www.kizeoforms.com.
   - Aller dans le menu "Données" > "Historique".
   - Sélectionner le formulaire pour afficher les enregistrements.
   - Sélectionner les enregistrements et cliquer sur "Sélection" > "Excel Liste" pour les exporter.
   - Consolider les données des 5 formulaires dans des fichiers Excel distincts sans modifier la structure.

3. **Transmission des données et injection dans la GMAO**
   - Déposer les fichiers Excel des UT-BIEN terminés à 100% sur le SharePoint dédié avant le 1er ou le 15 du mois.

### Le formulaire étape par étape

1. **Choix de l'équipement**
   - Si l'équipement est dans la liste : le sélectionner dans "EQUIPEMENTS IGO", vérifier le libellé.
   - Si l'équipement n'existe plus : le sélectionner et cocher "Demande de mise au rebut".
   - Si l'équipement n'est pas dans la liste : cocher "L'équipement n'est pas dans la liste ?", renseigner le modèle souhaité.

2. **Les données techniques**
   - Vérifier et ajuster la quantité si nécessaire (généralement 1).
   - Vérifier la date de mise en service et la corriger si besoin.
   - Déterminer si l'équipement est "process" ou non.
   - Renseigner obligatoirement la géolocalisation.

3. **Les attributs**
   - Renseigner tous les attributs obligatoires (marqués d'un astérisque rouge).
   - Si l'équipement est dans la liste, vérifier les attributs préremplis et les corriger si nécessaire.

4. **L'état des lieux**
   - Renseigner le statut et l'état de l'équipement (Satisfaisant, Acceptable, Moyen, Insuffisant, Non concerné).
   - Si l'état est "Moyen" ou "Insuffisant", ajouter des précisions sur les problématiques constatées.

5. **L'enregistrement**
   - Enregistrer le formulaire pour l'envoyer sur le serveur.
   - Possibilité de copier un formulaire pour des équipements identiques non présents dans IGO.`,
    rules: `- La rémunération du prestataire est basée sur les unités d'œuvre relevées lors de la phase d'inventaire.
- L'utilisation de l'outil KIZEO est imposée pour garantir la suffisance des données.
- Les données marquées d'un astérisque rouge sont obligatoires.
- Un formulaire validé dans l'application ne peut plus être supprimé.
- La structure du fichier Excel exporté depuis le backoffice ne doit pas être modifiée.
- Seuls les inventaires des UT-BIEN terminés à 100% doivent être transmis.
- Les fichiers Excel doivent être déposés sur un SharePoint dédié avant le 1er ou le 15 du mois.
- La géolocalisation de chaque équipement est obligatoire.
- Si l'état est "Moyen" ou "Insuffisant", il faut fournir des précisions.`,
    glossary: `**BAES** : Bloc Autonome d'Eclairage de Sécurité.
**CFO** : Courants Forts.
**CVC** : Chauffage, Ventilation, Climatisation.
**E2MT²** : Environnement de Maintenance des Equipements et des Trains du Technicentre.
**EPMR** : Equipement pour Personnes à Mobilité Réduite.
**GMAO IGO** : Gestion de la Maintenance Assistée par Ordinateur "IGO".
**GTB/GTC** : Gestion Technique du Bâtiment / Gestion Technique Centralisée.
**KIZEO** : Application mobile utilisée pour la saisie de formulaires numériques sur le terrain.
**PEC** : Prise En Charge.
**SSI** : Système de Sécurité Incendie.
**UNIFORMAT II** : Système de classification standardisé pour les éléments de construction.
**UT-BIEN** : Unité Territoriale - Bien.`,
  },
  {
    id: 3,
    title: "Formation : Connaître le contrat E2MT²",
    shortTitle: "Connaître E2MT²",
    summary:
      "Support de formation présentant les évolutions majeures du contrat E2MT², incluant les nouveaux périmètres techniques, les modalités financières, les procédures de réversibilité et de prise en charge, les outils SI (IGO, Hub de données) et les règles d'analyse des devis.",
    category: "formation",
    icon: BookOpen,
    color: "bg-amber-500",
    steps: `### Phase de Réversibilité (Contrat sortant)
1. **Programmation** : La phase de réversibilité est programmée 3 mois avant la fin du contrat.
2. **Continuité de service** : Le prestataire sortant doit maintenir le personnel nécessaire.
3. **Accompagnement du prestataire entrant** :
   - Communication des plans, documents et instructions.
   - Formation du personnel du nouveau prestataire.
   - Transmission des clés, badges et codes d'accès.
4. **État des lieux de sortie** : Visite contradictoire avec SNCF, prestataire sortant et entrant, suivie de la signature d'un PV.
5. **Restitution des documents** : Au plus tard 2 mois avant la fin du contrat, dépôt de toute la documentation en version dématérialisée sur la GED.

### Phase de Prise en Charge (Mission A1 - Contrat entrant)
1. **Mise en place des méthodes et de l'organisation** :
   - Constitution des équipes de déploiement et d'exploitation.
   - Établissement des dossiers de déclaration pour chaque sous-traitant.
2. **Mise en place des plans de prévention (PdP)** :
   - Mise en œuvre d'un PdP-OR par contrat.
   - Réalisation d'analyses de risques locales avant la première intervention.
3. **Inventaire, état des lieux et prise en charge des installations** :
   - Visites systématiquement accompagnées, planifiées par bâtiment.
   - Inventaire via formulaire Kizéo.
   - Évaluation selon la méthode SAMI.
   - Étiquetage obligatoire de tous les équipements après import dans IGO.
4. **Initialisation de la GMAO (IGO) et de la GED** :
   - Création des comptes utilisateurs sur IGO.
   - Association des équipements aux interventions.
   - Formation et habilitation des intervenants à la nouvelle GED.
5. **Initialisation du reporting** :
   - Préparation des trames pour les rapports (RMA, RAA, RLMA, RLAA).

### Pilotage du contrat
1. **Suivi des prestations** : Le gestionnaire de site assure la relation avec les occupants.
2. **Gestion des demandes d'intervention** : Via la GMAO IGO.
3. **Réception des OT correctifs** : Le gestionnaire réceptionne les OT dans IGO.
4. **Suivi des contrôles réglementaires** : OT de VR et MEC suivis dans IGO.
5. **Contrôles qualité** : Formulaire unique KN1 pour tracer les contrôles.

### Gestion des prestations connexes (Devis)
1. **Dépôt du devis** : Le prestataire dépose son devis via le workflow dédié.
2. **Analyse** : Le devis est analysé par l'AMO et/ou le pilote SNCF.
3. **Décision** : Le pilote accepte, refuse ou demande une correction.
4. **Suivi de la réalisation** : Processus de commande, facturation et réception.`,
    rules: `- La durée du contrat est de 4 ans fermes + 3 ans optionnels.
- La franchise pour les pièces détachées passe de 200 €HT à 300 €HT.
- La réversibilité du contrat s'effectue sur 6 mois (contre 3 auparavant).
- La mission de prise en charge (A1) dure 5 mois, du 1er août au 31 décembre.
- L'étiquetage de toutes les installations selon le format SNCF est obligatoire.
- Les pénalités ne peuvent excéder 20% du montant annuel des prestations B+C+E.
- Une mise en concurrence est obligatoire pour les travaux dépassant 100 k€.
- Le prestataire doit réaliser au moins 5 auto-contrôles d'équipements par mois.
- Les devis pour prestations connexes doivent passer par le workflow de l'outil dédié.`,
    glossary: `**AMO** : Assistance à Maîtrise d'Ouvrage.
**BPU** : Bordereau des Prix Unitaires.
**CdC** : Cahier des Charges.
**COPIL** : Comité de Pilotage.
**COSUI** : Comité de Suivi.
**CVC** : Chauffage Ventilation Climatisation.
**E2MT²** : Contrat de maintenance multi-technique de SNCF Immobilier.
**GED** : Gestion Électronique des Documents.
**GMAO** : Gestion de Maintenance Assistée par Ordinateur.
**IGO** : Outil de GMAO de la SNCF.
**MEC** : Mise En Conformité.
**OT** : Ordre de Travail.
**PdP-OR** : Plan de Prévention pour les Opérations Répétitives.
**PEC** : Prise En Charge.
**RAA** : Rapport Annuel d'Activité.
**RMA** : Rapport Mensuel d'Activité.
**SAMI** : Méthode d'évaluation (Satisfaisant, Acceptable, Moyen, Insuffisant).
**VR** : Vérification Réglementaire.`,
  },
  {
    id: 4,
    title: "Formation : Découvrir le contrat E2MT²",
    shortTitle: "Découvrir E2MT²",
    summary:
      "Support de formation expliquant le fonctionnement et le périmètre des contrats E2MT². Il détaille la structure des contrats, les différentes missions de maintenance, les étapes de démarrage, les modalités de pilotage, de suivi et de facturation.",
    category: "formation",
    icon: BookOpen,
    color: "bg-violet-500",
    steps: `### Mission A1 : Démarrage des nouveaux contrats (5 mois)

1. **Mise en place des méthodes et de l'organisation** : Le prestataire constitue ses équipes, fournit un organigramme, la liste des intervenants et un planning général de déploiement.
2. **Déclaration de la sous-traitance** : Dossier de déclaration pour chaque sous-traitant.
3. **Mise en place des documents d'astreinte** : Procédure d'astreinte avec numéro unique et guides d'astreinte par UT.
4. **Mise en place des plans de prévention (PdP)** : ICP représentative pour créer un PdP-OR unique par contrat. Analyses de risques locales via Kizéo.
5. **Inventaire, état des lieux et PEC** : Inventaire des équipements accompagné par la SNCF. État des lieux selon méthode SAMI.
6. **Étiquetage des installations** : Après import dans IGO, étiquetage de toutes les installations.
7. **Initialisation de la GMAO et de la GED** : Création du PAM, import des équipements dans IGO, lissage des interventions.
8. **Signature du PV de fin de prise en charge** : Avec ou sans réserve.

### Pilotage du contrat (Missions B, C, E)

1. **Suivi des prestations** : Via réunions et rapports.
2. **Organisation des réunions** :
   - Mensuelles : COSUI (lot) et COTECH (sites renforcés).
   - Annuelles : COPIL (lot) et CODIR (sites renforcés).
3. **Production des rapports** :
   - Mensuels : RMA et RLMA.
   - Annuels : RAA et RLAA.
4. **Gestion de la maintenance corrective** : Suivi des demandes, respect des délais, traitement des devis.
5. **Contrôles qualité** : Au moins 5 auto-contrôles par mois. Formulaire Kizéo KN1.
6. **Mise à jour du plan pluriannuel de travaux** : Tous les 6 mois.

### Mécanismes de facturation

1. **Calcul de la rémunération forfaitaire** : Prix unitaires BPU appliqués à des quantitatifs.
2. **Commande annuelle** : Fichier de chiffrage pour construire la commande.
3. **Mise à jour et facturation** : Mise à jour trimestrielle. Facturation mensuelle.
4. **Régularisation** : En fin d'exercice annuel.
5. **Gestion des prestations supplémentaires (Mission D)** : Devis pour travaux hors forfait.
6. **Application de la franchise** : Franchise déduite du prix des pièces si dépassement du seuil.`,
    rules: `- Les contrats sont communs avec Gares & Connexions, couvrant 18 lots géographiques.
- Le contrat définit les niveaux de maintenance inclus dans le forfait.
- Le modèle PdP-OR ne s'applique qu'à la maintenance, pas aux travaux.
- Un équipement "Moyen" ou "Insuffisant" doit faire l'objet d'une réserve.
- Les délais d'intervention sont stricts et dépendent du niveau de criticité.
- Pénalités plafonnées à 20% du montant annuel.
- Franchise déduite du coût des pièces si prix unitaire dépasse le seuil.
- Le suivi repose sur IGO, 1.4 Démat, Hub de données, Kizéo, Power BI.`,
    glossary: `**BPU** : Bordereau des Prix Unitaires.
**COSUI** : Comité de Suivi (réunion mensuelle).
**COPIL** : Comité de Pilotage (réunion annuelle).
**CPS** : Cahier des Prescriptions Spéciales.
**CVC** : Chauffage / Ventilation / Climatisation.
**GED** : Gestion Électronique des Documents.
**GMAO** : Gestion de la Maintenance Assistée par Ordinateur (IGO).
**GTB / GTC** : Gestion Technique du Bâtiment / Centralisée.
**ICP** : Inspection Commune Préalable.
**IGO** : GMAO utilisée par la SNCF.
**Kizéo** : Application mobile pour formulaires terrain.
**KN1** : Formulaire de contrôle qualité sur Kizéo.
**PAM** : Plan Annuel de Maintenance.
**PdP-OR** : Plan de Prévention Opérations Répétitives.
**PEC** : Prise En Charge.
**RAA / RMA** : Rapport Annuel / Mensuel d'Activité.
**SAMI** : Satisfaisant, A améliorer, Moyen, Insuffisant.
**SSI** : Système de Sécurité Incendie.
**UT** : Unité Territoriale.`,
  },
  {
    id: 5,
    title: "Formation : Maîtriser le contrat E2MT²",
    shortTitle: "Maîtriser E2MT²",
    summary:
      "Support de formation destiné aux référents et pilotes. Il présente les évolutions entre E2MT et E2MT², la nouvelle structure contractuelle, les périmètres techniques et géographiques, la forme des prix, les phases de réversibilité et de prise en charge, et les procédures d'analyse des devis.",
    category: "formation",
    icon: BookOpen,
    color: "bg-rose-500",
    steps: `### Organisation de la réversibilité du contrat E2MT

1. **Préparation à la fin du contrat** :
   - Le prestataire sortant assure la continuité du service jusqu'au dernier jour.
   - Phase de réversibilité de 6 mois avant la fin du contrat.

2. **Accompagnement du prestataire entrant** :
   - Communication des plans, documents techniques et instructions.
   - Formation du personnel du nouveau prestataire.
   - Transmission de tous les accès : codes, clés, badges.

3. **Réalisation de l'état des lieux de sortie** :
   - Visite contradictoire avec SNCF, prestataire sortant et entrant.
   - Signature d'un PV d'état des lieux de sortie.
   - Délai d'un mois pour lever les non-conformités.

4. **Restitution des données et documents** :
   - Dépôt sur la GED au plus tard 2 mois avant la fin du contrat.
   - Inclut : données GMAO/GED, inventaire, attestations, fichiers de suivi, reportings.

### Organisation de la prise en charge (Mission A1) - 5 mois

1. **Mise en place des méthodes et de l'organisation** :
   - Constitution des équipes de déploiement et d'exploitation.
   - Organigramme opérationnel, liste des intervenants (CV, habilitations).
   - Planning général de déploiement.
   - Validation des sous-traitants.
   - Procédure d'astreinte avec numéro unique.

2. **Mise en place des plans de prévention** :
   - PdP-OR via une ICP représentative.
   - PdP-OR unique par contrat.
   - Analyses de risques locales via Kizéo.

3. **Inventaire, état des lieux et prise en charge** :
   - Note méthodologique par le prestataire.
   - Accompagnement SNCF lors de toutes les visites.
   - Formulaires Kizéo pour l'inventaire.
   - 3 photos par équipement (vue de près, vue d'ensemble, plaque signalétique).
   - Méthode SAMI pour l'état des lieux.
   - Étiquetage de toutes les installations.

4. **Initialisation de la GMAO (IGO) et de la GED** :
   - Ouverture des comptes IGO.
   - Création des couples équipement/intervention.
   - Plans de maintenance pluriannuels.
   - Formation des intervenants à la nouvelle GED.

5. **Mise en place du reporting** :
   - Préparation de l'ensemble des reportings prévus au contrat.
   - Signature du PV de fin de prise en charge.`,
    rules: `- La phase de réversibilité dure 6 mois avec collaboration étroite entre les parties.
- La mission A1 dure 5 mois avec réunions de suivi bimensuelles.
- Les PdP-OR simplifient la gestion de la sécurité pour les interventions récurrentes.
- L'ensemble du périmètre bascule sur la GMAO IGO.
- La méthode SAMI est utilisée pour évaluer l'état des équipements.
- La franchise pour les interventions correctives passe de 200 €HT à 300 €HT.
- Les ascenseurs sont désormais entièrement intégrés au contrat E2MT².
- Une nouvelle mission E optionnelle pour le management de l'énergie.
- Le pilotage local est renforcé avec de nouvelles réunions (COTECH) et rapports locaux (RLMA).`,
    glossary: `**E2MT²** : Nouveau contrat de maintenance multitechnique de la SNCF.
**GMAO** : Gestion de la Maintenance Assistée par Ordinateur (outil : IGO).
**IGO** : La GMAO utilisée pour le contrat E2MT².
**GED** : Gestion Électronique des Documents (remplacée par "Hub de données").
**PdP-OR** : Plan de Prévention - Opérations Répétitives.
**ICP** : Inspection Commune Préalable.
**UT** : Unité Territoriale.
**SAMI** : Satisfaisant, A améliorer, Moyen, Insuffisant.
**MCO** : Maintien en Condition Opérationnelle.
**BPU** : Bordereau des Prix Unitaires.
**COSUI** : Comité de Suivi (mensuel).
**COPIL** : Comité de Pilotage (annuel).
**COTECH** : Comité Technique (sites renforcés).
**RMA** : Rapport Mensuel d'Activité.
**RAA** : Rapport Annuel d'Activité.`,
  },
  {
    id: 6,
    title: "Guide du Pilote E2MT²",
    shortTitle: "Guide Pilote",
    summary:
      "Guide pratique destiné aux pilotes E2MT² de la SNCF. Il fournit des repères clairs, des bonnes pratiques et une vue d'ensemble des processus contractuels, techniques et organisationnels pour optimiser la performance immobilière et la satisfaction des occupants.",
    category: "guide",
    icon: BookMarked,
    color: "bg-cyan-500",
    steps: `### FP01 - Réversibilité du prestataire sortant (E2MT)

1. **3 mois avant la fin du contrat** :
   - Initier les processus de réversibilité sortante.
   - Présenter la méthodologie et les livrables à récupérer au COSUI.
   - Préparer les visites d'état des lieux de sortie.

2. **2 mois avant la fin du contrat** :
   - Assurer la transmission régulière des documents.
   - Réaliser les visites d'état des lieux de sortie.
   - Suivi rapproché avec tableau de suivi et pourcentages d'avancement.

3. **À la fin du contrat** :
   - Finaliser la réversibilité après récupération des derniers éléments.
   - Signer un PV de sortie et procéder au paiement.

### FP02 - Déploiement initial (Mission A1)

1. **Dès la prise d'effet** :
   - Initialiser les processus de déploiement.
   - Présenter la méthodologie et les livrables au nouveau prestataire.
   - Préparer et organiser les visites de prise en charge.
   - Suivi régulier tous les 15 jours avec check-list.

2. **15 jours après** : Le prestataire présente les intervenants et le planning.

3. **1 mois après** :
   - Prise en charge : note de méthodologie et planning.
   - Plan de prévention : planification des ICP.
   - GMAO & Outils : liste des comptes à créer.

4. **2 mois après** :
   - Remise des données des "sites pilotes" pour validation.
   - Validation des trames des guides d'astreinte.

5. **3 mois après** :
   - Présentation de l'organigramme opérationnel.
   - Paramétrage général de la GMAO & GED.

6. **4 mois après** :
   - Liste des intervenants (CV, fiches de poste) et plan de formation.
   - Finalisation de l'inventaire et des états des lieux.

7. **5 mois après** :
   - Étiquetage des équipements.
   - Plan annuel de maintenance.
   - Déclaration de la sous-traitance.
   - Validation des trames des rapports.
   - Signature de tous les plans de prévention.
   - Inventaire des stocks de pièces SNCF.
   - Remise des procédures, codes et mots de passe.`,
    rules: `- Les contrats E2MT² impliquent une obligation de résultat, complétée par une obligation de moyens minimaux.
- Un prestataire secondaire est désigné pour chaque lot (délai de reprise de 3 à 6 mois).
- Pour qu'un bien soit maintenu, la mission technique doit être ralliée et le bien inventorié dans la GMAO.
- Franchise pour pièces : coût inférieur à 300€ HT à la charge du prestataire.
- Les délais D1 et D2 sont stricts et varient selon la criticité (C1 ou C2).
- Mesures conservatoires en cas de C1 : prises en charge jusqu'à 5 000€ HT par incident.
- Rapports RMA et RAA obligatoires, plus RLAM et RLAA pour les sites en pilotage renforcé.
- COSUI mensuels et COPIL annuels pour piloter le contrat.
- Plan pluriannuel de travaux soumis tous les six mois.`,
    glossary: `**Accord-cadre** : Contrat définissant les termes pour des bons de commande futurs.
**AMO** : Assistant à Maîtrise d'Ouvrage.
**BPU** : Bordereau des Prix Unitaires.
**CODIR** : Comité de Direction (annuel, sites renforcés).
**COPIL** : Comité de Pilotage (annuel).
**COSUI** : Comité de Suivi (mensuel).
**COTECH** : Comité Technique (mensuel, sites renforcés).
**E2MT²** : Entretien, Exploitation et Maintenance des installations Techniques des bâtiments.
**GED** : Gestion Électronique des Documents.
**GMAO** : Gestion de la Maintenance Assistée par Ordinateur (IGO).
**GTC / GTB** : Gestion Technique Centralisée / du Bâtiment.
**KPI** : Indicateurs clés de performance.
**MG** : Minimum Garanti.
**Pilote** : Représentant des donneurs d'ordre SNCF.
**RAA** : Rapport Annuel d'Activité.
**RLAA** : Rapport Local d'Activité Annuel.
**RLAM** : Rapport Local d'Activité Mensuel.
**RMA** : Rapport Mensuel d'Activité.`,
  },
];

const categoryLabels: Record<string, { label: string; color: string; icon: typeof GraduationCap }> = {
  procedure: { label: "Procédures", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ClipboardCheck },
  formation: { label: "Formations", color: "bg-amber-100 text-amber-700 border-amber-200", icon: GraduationCap },
  guide: { label: "Guides", color: "bg-cyan-100 text-cyan-700 border-cyan-200", icon: BookMarked },
};

// ─── Markdown-like renderer ──────────────────────────────────────
function renderContent(text: string) {
  const lines = text.split("\n");
  const elements: React.JSX.Element[] = [];
  let stepCounter = 0;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // H3 headers
    if (trimmed.startsWith("### ") || trimmed.startsWith("_## ")) {
      const title = trimmed.replace(/^[_#]+\s*/, "").replace(/_$/, "");
      elements.push(
        <div key={idx} className="mt-6 mb-3 first:mt-0">
          <h3 className="text-base font-semibold text-[#0C1E3C] flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#E05206]" />
            {title}
          </h3>
          <Separator className="mt-2" />
        </div>
      );
      stepCounter = 0;
      return;
    }

    // Numbered steps (top level)
    const stepMatch = trimmed.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*:?\s*(.*)/);
    if (stepMatch) {
      stepCounter++;
      elements.push(
        <div key={idx} className="flex gap-3 mt-3 items-start">
          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#0C1E3C] text-white flex items-center justify-center text-xs font-bold mt-0.5">
            {stepCounter}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm text-[#0C1E3C]">{stepMatch[2]}</span>
            {stepMatch[3] && <span className="text-sm text-muted-foreground ml-1">{stepMatch[3]}</span>}
          </div>
        </div>
      );
      return;
    }

    // Numbered steps (simple)
    const simpleStepMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (simpleStepMatch && !trimmed.startsWith("   ")) {
      stepCounter++;
      elements.push(
        <div key={idx} className="flex gap-3 mt-3 items-start">
          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#0C1E3C] text-white flex items-center justify-center text-xs font-bold mt-0.5">
            {stepCounter}
          </div>
          <p className="text-sm text-foreground flex-1 min-w-0 mt-1">{simpleStepMatch[2]}</p>
        </div>
      );
      return;
    }

    // Sub-items (bullets)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("   -") || trimmed.startsWith("   *")) {
      const content = trimmed.replace(/^[\s\-\*]+/, "");
      // Bold sub-items
      const boldMatch = content.match(/^\*\*(.+?)\*\*\s*:?\s*(.*)/);
      if (boldMatch) {
        elements.push(
          <div key={idx} className="ml-10 mt-1.5 flex items-start gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-[#E05206] mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              <span className="font-medium text-foreground">{boldMatch[1]}</span>
              {boldMatch[2] && <span className="text-muted-foreground"> : {boldMatch[2]}</span>}
            </p>
          </div>
        );
      } else {
        elements.push(
          <div key={idx} className="ml-10 mt-1.5 flex items-start gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{content}</p>
          </div>
        );
      }
      return;
    }

    // Default text
    elements.push(
      <p key={idx} className="text-sm text-muted-foreground ml-10 mt-1">
        {trimmed}
      </p>
    );
  });

  return elements;
}

function renderRules(text: string) {
  const lines = text.split("\n").filter((l) => l.trim());
  return lines.map((line, idx) => {
    const content = line.replace(/^[\s\-\*]+/, "");
    return (
      <div key={idx} className="flex items-start gap-3 py-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-foreground">{content}</p>
      </div>
    );
  });
}

function renderGlossary(text: string) {
  const lines = text.split("\n").filter((l) => l.trim());
  return lines.map((line, idx) => {
    const content = line.replace(/^[\s\-\*]+/, "");
    const match = content.match(/^\*\*(.+?)\*\*\s*:?\s*(.*)/);
    if (match) {
      return (
        <div key={idx} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
          <Badge variant="outline" className="font-mono text-xs shrink-0 mt-0.5">
            {match[1]}
          </Badge>
          <p className="text-sm text-muted-foreground">{match[2]}</p>
        </div>
      );
    }
    return (
      <p key={idx} className="text-sm text-muted-foreground py-1">
        {content}
      </p>
    );
  });
}

// ─── Main Component ──────────────────────────────────────────────
export default function TutorielsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const filteredTutorials = useMemo(() => {
    return tutorials.filter((t) => {
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.summary.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tutorials.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0C1E3C] tracking-tight">
              {selectedTutorial ? (
                <button
                  onClick={() => setSelectedTutorial(null)}
                  className="flex items-center gap-2 hover:text-[#E05206] transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Tutoriels & Guides
                </button>
              ) : (
                "Tutoriels & Guides"
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedTutorial
                ? selectedTutorial.title
                : "Procédures, formations et guides pour maîtriser le contrat E2MT²"}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {tutorials.length} documents
          </Badge>
        </div>

        {selectedTutorial ? (
          /* ─── Tutorial Detail View ─── */
          <div className="space-y-4">
            {/* Summary Card */}
            <Card className="border-l-4" style={{ borderLeftColor: selectedTutorial.color.includes("blue") ? "#3b82f6" : selectedTutorial.color.includes("emerald") ? "#10b981" : selectedTutorial.color.includes("amber") ? "#f59e0b" : selectedTutorial.color.includes("violet") ? "#8b5cf6" : selectedTutorial.color.includes("rose") ? "#f43f5e" : "#06b6d4" }}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl ${selectedTutorial.color} flex items-center justify-center flex-shrink-0`}>
                    <selectedTutorial.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <Badge className={categoryLabels[selectedTutorial.category].color + " mb-2"} variant="outline">
                      {categoryLabels[selectedTutorial.category].label}
                    </Badge>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedTutorial.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Accordion */}
            <Accordion type="multiple" defaultValue={["steps"]} className="space-y-3">
              <AccordionItem value="steps" className="border rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#0C1E3C] flex items-center justify-center">
                      <ListChecks className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#0C1E3C]">Étapes & Procédures</p>
                      <p className="text-xs text-muted-foreground font-normal">Guide pas-à-pas détaillé</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-0">{renderContent(selectedTutorial.steps)}</div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rules" className="border rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#0C1E3C]">Règles clés à retenir</p>
                      <p className="text-xs text-muted-foreground font-normal">Points importants et obligations</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="divide-y divide-border/50">{renderRules(selectedTutorial.rules)}</div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="glossary" className="border rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#0C1E3C]">Glossaire</p>
                      <p className="text-xs text-muted-foreground font-normal">Termes techniques et abréviations</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div>{renderGlossary(selectedTutorial.glossary)}</div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ) : (
          /* ─── Tutorial List View ─── */
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un tutoriel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className={selectedCategory === null ? "bg-[#0C1E3C] hover:bg-[#162d52]" : ""}
                >
                  Tous ({tutorials.length})
                </Button>
                {Object.entries(categoryLabels).map(([key, { label, icon: Icon }]) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                    className={selectedCategory === key ? "bg-[#0C1E3C] hover:bg-[#162d52]" : ""}
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    {label} ({categoryCounts[key] || 0})
                  </Button>
                ))}
              </div>
            </div>

            {/* Tutorial Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTutorials.map((tutorial) => (
                <Card
                  key={tutorial.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-[#E05206]/30 group"
                  onClick={() => setSelectedTutorial(tutorial)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-xl ${tutorial.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                        <tutorial.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <Badge className={categoryLabels[tutorial.category].color + " mb-1.5"} variant="outline">
                          {categoryLabels[tutorial.category].label}
                        </Badge>
                        <CardTitle className="text-sm font-semibold text-[#0C1E3C] leading-tight">
                          {tutorial.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {tutorial.summary}
                    </p>
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ListChecks className="h-3.5 w-3.5" />
                        <span>{tutorial.steps.split("\n").filter((l) => l.match(/^\d+\./)).length} étapes</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{tutorial.rules.split("\n").filter((l) => l.trim()).length} règles</span>
                      </div>
                      <div className="ml-auto">
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#E05206] transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTutorials.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun tutoriel trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>
  );
}
