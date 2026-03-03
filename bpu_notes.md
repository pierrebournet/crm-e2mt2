# BPU Lot 4.1 - Notes d'analyse

## Constat important
Le BPU (Annexe 4 au CPS) est un document d'une seule page très dense qui liste les CODES PU et les TYPES de prestations pour les missions A, B, C (maintenance préventive par type d'équipement). 

Ce BPU couvre principalement les missions de maintenance préventive (Mission C) avec des prix unitaires annuels par équipement ou par m². Il ne contient PAS directement les taux horaires de main d'œuvre pour la maintenance corrective (Mission D) ni les coefficients de fournitures/sous-traitance.

## Missions identifiées dans le BPU :
- Mission A : Déploiement initial (A01A, A02A) - PU/m²
- Mission B : Coordination et suivi (B01A, B01B, B01C) - Taux en % de mission C
- Mission C1a : Maintenance installations CVC (C01A à C01AD)
- Mission C1b : Maintenance installations désenfumage (C01AE, C01AF)
- Mission C2 : Maintenance protection incendie (C02A à C02F)
- Mission C3 : Maintenance fermetures motorisées (C03A à C03G)
- Mission C4 : Maintenance systèmes GTC/GTB (C04A à C04C)
- Mission C5 : Maintenance systèmes sécurité incendie (C05A, C05B)
- Mission C6 : Maintenance clos et couvert (C06A, C06B)
- Mission C7 : Maintenance électricité courants forts (C07A à C07H)
- Mission C8 : Maintenance appareils de levage
- Mission C9 : Maintenance ascenseurs et monte-charges
- Mission C10 : Maintenance installations plomberie
- Mission C11 : Maintenance éclairage
- Mission C12 : Maintenance second œuvre
- Mission C13 : Maintenance installations électricité courants faibles
- Mission C14 : Maintenance serrurerie
- Mission D : PRESTATIONS CONNEXES (à chercher)
- Mission E : Management de l'énergie
- Mission E2 : Audit en exploitation

## PROBLÈME : Les PU ne sont pas remplis
Le BPU est une TRAME avec les codes et descriptions mais les colonnes de prix (PU en €HT) semblent vides dans l'extraction texte. Les prix réels sont probablement dans la version signée/complétée du marché.

## Ce qu'il faut vérifier pour les devis :
- Les taux horaires MO (70€/h, 62€/h, 55€/h) ne sont pas dans ce BPU - ils sont probablement dans le Schéma de Commande (SC) ou dans un document annexe de la Mission D
- Le coefficient FO/SST de 1,24 n'apparaît pas dans ce BPU
- Le prix ACC-01 nacelle (313,28€) n'apparaît pas dans ce BPU

## Missions pertinentes pour les devis analysés :
- Mission C10 : Plomberie (devis 2 RAYNAL)
- Mission C11 : Éclairage (devis 1 CAPDENAC)
- Mission C12 : Second œuvre (devis 3 TARBES)
- Mission C3 : Fermetures motorisées (devis 4 MONTREJEAU - rideau garage)
- Mission C14 : Serrurerie (devis 4 MONTREJEAU - contact à clé)
