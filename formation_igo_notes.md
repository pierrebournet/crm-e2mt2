# Formation IGO E2MT² - SNCF IMMO (109 pages) - Synthèse complète

## Profils IGO
- Prestataire : exécute les OT, traite les interventions
- Pilote E2MT : valide DI, clôture OT, supervise
- Référent VR : valide/refuse créations et mises au rebut d'équipements

## LEXIQUE IGO
- IGO = Intégration Gestion des Opérations (GMAO)
- UT = Unité Topographique (frontière géographique des propriétés SNCF)
- DI = Demande d'Intervention (signaler une anomalie)
- OT = Ordre de Travail (attribuer une action à une équipe/personne)
- OT COR = OT Correctif (suite à DI)
- OT TVX = OT Travaux (suite à devis)
- OT VR = OT Vérification Réglementaire
- OT MPS = OT Maintenance Préventive Systématique
- OT MPREV = OT Maintenance Préventive
- OT MREG = OT Maintenance Réglementaire
- OT AUTRE = OT suite à Non-Conformité (NC)
- Emergence MEC = Demande travaux si NC > 0 lors clôture OT VR
- OT MEC = OT Mise en Conformité (suite à émergence MEC)
- SAMI = Satisfait/Acceptable/Moyen/Insatisfait (enquête satisfaction)
- Cockpit = Indicateur mettant en évidence une info utile au métier

## CIRCUIT CORRECTIF DI → OT COR

### Statuts DI
- 0. Créée → 11. DI Validée (ou 5. DI Annulée) → 3. En cours → 9. Terminée → 8. Réceptionnée
- Alternative : 10. Refusée (si clôture non acceptée)

### Statuts OT COR
- 0. Créé → 1. Affecté (ou 9. Annulé) → 3. En cours → 4. Terminé → 5. Clôturé → 6. Réceptionné
- Alternative : 8. A réviser (si DI refusée) → 7. Non validé

### Workflow DI → OT COR
1. Demandeur crée la DI (module Demande d'Intervention)
2. Champs obligatoires (fond jaune) : urgence, demandeur, équipement/bien, domaine, constat, précision demande, localisation, destinataire ABE, gestionnaire valideur
3. Onglet paiement : sélectionner le contrat associé (obligatoire) ou cocher "Contrat non disponible" + RG client
4. Onglet description : texte détaillé + pièces jointes (photos, PDF)
5. Gestionnaire valide la DI (module "DI à valider")
6. Guichet 3C verrouille la DI et crée l'OT COR ("Sélect une action → Créer un OT")
7. DI passe à 3-En cours, numéro OT attribué automatiquement
8. 3C affecte l'équipe secteur → OT passe à 1-Affecté
9. Prestataire prend en charge → 3-En cours
10. Prestataire termine → 4-Terminé
11. Pilote clôture → 5-Clôturé → DI passe à 9-Terminée
12. Demandeur réceptionne la DI → 8-Réceptionnée + enquête SAMI
13. Si refus : DI → 10-Refusée, OT → 8-A réviser

### Points clés DI
- L'identifiant DI est attribué automatiquement après enregistrement
- Le champ "Précision sur la demande" devient le titre de la DI
- Urgence : 1-Urgent, 2-Norme de service, 3-A programmer
- Commentaires non supprimables ni modifiables une fois enregistrés
- Si contrat relié au bien/équipement → sélectionner dans onglet paiement
- Si mauvaise affectation, l'équipe peut remettre OT à 0-Créé

## GESTION DES ÉQUIPEMENTS

### Cycle de vie
- Chaque équipement est rattaché à un modèle (famille + classe d'attributs)
- Classe d'attributs = caractéristiques types (puissance, volume, fournisseur...)
- Actions possibles : Créer, Modifier, Mettre au rebut

### Création d'équipement
1. Création dans IGO → mail envoyé au référent métier avec lien cliquable
2. Référent valide → équipement passe à "Actif"
3. Référent refuse → équipement passe à "Rebut" (motif obligatoire)

### Mise au rebut
- Demande via "Sélect une action → Faire une demande de mise au rebut"
- Commentaire justificatif obligatoire
- ATTENTION : équipements avec DI/OT/Devis en cours ne peuvent PAS être mis au rebut
- Référent valide → Rebut / Refuse → reste Actif (motif obligatoire)

### Validation/Refus
- Via cockpit "Équipements à valider" ou lien email
- Référent vérifie les informations puis valide ou refuse

## APPLICATION NOMAD (Mobile)

### Modules
- Module OT : récupérer et traiter OT MPREV, MREG en mobilité
- Module Équipement : tous les équipements référencés
- Module Supprimer : supprimer données locales

### Synchronisations
- Sync Totale : resynchronise tout (ATTENTION : vide Nomad, puis resync OT-DI nécessaire)
- Sync OT-DI : récupère tous les OT en cours
- Sync Contextuelle : selon critères (type, équipe, etc.)

### Fonctionnalités OT Nomad
- Voir image équipement lié à l'OT
- Aller à la fiche équipement depuis l'OT
- Traiter les actions (changer statut)
- Ajouter commentaires (dictée vocale possible via micro)
- Ajouter pièces jointes, signature, photo, vidéo
- Télécharger documents liés

### Notifications
- Pop-up téléphone quand OT attribué (champ "Employé Notifié")
- Activation via menu Identification

## PLANS DE MAINTENANCE ET OCCURRENCES

### Principe
- Chaque équipement rattaché à un modèle
- Chaque modèle a des interventions associées (MPREV + MREG)
- Couple Équipement/Intervention caractérisé par fréquence + date prochaine exécution
- Plans génèrent automatiquement les occurrences (OT)

### Exemple Chaudière D302003-CHAU-003
- MPREV-CHAU-003-1A-01 : entretien annuel
- MPREV-CHAU-003-1A-03 : conduit fumée annuel
- MPREV-CHAU-003-1M-01 : entretien mensuel
- MREG-CHAU-003-1A-01 : ramonage gaz annuel
- MREG-CHAU-003-2A-01 : concentration polluants biennal
- MREG-CHAU-003-3M-01 : analyse combustion trimestriel
- MREG-CHAU-003-6M-01 : ramonage fioul semestriel

### Génération OT
- Occurrence génère un OT 2 mois avant la date planifiée
- SEULEMENT SI l'OT précédent est à un statut archivable (9-Annulé / 11-Non réalisé / 6-Réceptionné)

## CIRCUIT OT MPREV / MREG

### Statuts
- Plan créé → 1. Affecté → 3. En cours → 4. Terminé → 5. Clôturé → 6. Réceptionné
- Alternative : 7. Non validé / 8. A réviser

### Workflow
1. Plan génère OT → statut 1-Affecté automatiquement
2. Prestataire prend en charge → 3-En cours
3. Prestataire réalise les actions (onglet Actions)
4. Pendant traitement : renseigner champ "Non-conformité" si besoin (modifiable jusqu'à statut 4)
5. Prestataire termine → 4-Terminé
6. Pilote clôture → 5-Clôturé (ou 7-Non validé si mal fait)
7. Réception → 6-Réceptionné (automatique après 1 mois)
8. Passage auto : 4→5 au bout d'1 mois, puis 5→6 au bout d'1 mois

### Non-conformités (NC)
- Si nombre NC > 0 lors du passage à 6-Réceptionné → OT AUTRE généré automatiquement
- Possibilité de créer OT AUTRE manuellement si OT au statut 3, 4 ou 5 ET NC > 0

## CIRCUIT OT AUTRE (Non-conformités)

### Statuts
- 0. Créé → 1. Affecté → 3. En cours → 4. Terminé → 5. Clôturé → 6. Réceptionné
- Alternative : 7. Non validé / 9. Annulé (possible aux statuts 0, 1, 3, 7)
- Passage auto 5→6 après 1 mois

### Workflow
1. OT AUTRE créé automatiquement ou manuellement depuis OT MPREV/MREG
2. Récupère automatiquement : équipement, équipe, sous-traitant, imputation, OT père, nombre NC
3. Date planifiée = date fin OT père + 30 jours
4. OT AUTRE et OT MPREV/MREG vivent indépendamment
5. Un seul OT AUTRE par OT MPREV/MREG
6. Champ "Nombre de NC réalisées" modifiable du statut 0 à 3
7. Au passage à 4-Terminé : NC réalisées obligatoire, ≥ 0, ≤ nombre NC total

## E-LEARNING DISPONIBLES
- IGODESKEQP : Gestion des équipements
- IGODESKPE : Profil & Ergonomie
- IGODESKPLM : Plan de maintenance
- IGODESKCEI : Création couple équipement/intervention
