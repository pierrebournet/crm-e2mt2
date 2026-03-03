# Données extraites des CSV Annexes E2MT²

## Annexe 2 - Livrables Mission A (32 livrables)
Déjà intégrés dans le CRM (page Suivi Livrables). Les livrables couvrent :
- Documents de prise en charge (inventaires, plans, PV)
- Bases de données GMAO
- Documents réglementaires (registre sécurité, plans de prévention)
- Rapports et bilans

## Annexe 3 - Pénalités (19 pénalités P1-P19)
Données CSV structurées avec colonnes : N°, Objet, Description, Seuil, Pénalité, Minimum

### Données clés pour l'IA d'analyse de devis :
- P1 Documents : 100€HT/jour ouvré retard transmission devis (>10 jours)
- P1 Documents : 100€HT/anomalie par devis non conforme aux règles
- P4 Maintenance corrective : 50€HT/jour calendaire retard (>2 jours au-delà des délais)
- P6 Outils informatiques : 100€HT/constat non tenue à jour GMAO

## Annexe 5 - Charge de travail (Missions B à E)
Structure par lot géographique (18 lots). Les valeurs sont à 0 (trame vierge DCE).
Structure :
- Mission B : Coordinateur de Lot, Assistance technique, Services supports, Intervenants pilotage 2nd rang
- Missions C+D : Équipes opérationnelles hors SST, Sous-traitance estimée
- Mission E : Intervenants spécialisés énergie
- Hypothèse : 1 ETP = 1 600 h/an
