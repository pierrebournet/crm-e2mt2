/**
 * Base de connaissances structurée pour Immosis et Connect'Immo
 * Contient toutes les listes déroulantes, règles métier et correspondances
 * nécessaires au pré-remplissage automatique des trames depuis un devis
 */

// ============================================================
// CONNECT'IMMO — Listes déroulantes V11 PRODUCTION
// ============================================================

export const CONNECTIMMO_ORIGINES = [
  "ABE",
  "Activité / Occupant",
  "Administration",
  "Agence EDT",
  "DTA",
  "Fluides",
  "Gestion Immobilière",
  "Gestionnaire",
  "Mainteneur",
  "Référent Environnement",
  "Référent RTSII",
  "Référent TE",
  "Sinistre",
  "Tiers",
  "VGT",
  "VR",
  "Proposition GT",
  "Valorisation",
  "Connect-IS",
  "Gestionnaire d'actif",
  "FEX",
] as const;

export const CONNECTIMMO_SOUS_TYPES = [
  "Accompagnement diagnostic",
  "Assistance Programmation des visites",
  "B1. Gestion du risque incendie",
  "B2. Gestion du risque amiante",
  "C4. Connaissance des actifs",
  "Compte sinistre",
  "Contrats de Maintenance Externe",
  "Contrats de Maintenance Externe - E2MT",
  "Contrats de Maintenance Interne",
  "Contrats Petits Travaux du Propriétaire",
  "D2. Contrats locatifs",
  "Déconstructions Sélectives SNCF",
  "Diagnostic Amiante",
  "Economies d'énergie, décarbonation",
  "Energie Electrique MPS",
  "Gros Entretien IST CCE",
  "Gros Entretiens",
  "Gros Entretiens - par E2MT",
  "Investissement",
  "Maintenance Elargie Energie Electrique",
  "Maintenance Locative",
  "Mise en conformité énergie électrique",
  "Mise en conformité réglementaire autre",
  "Petits Travaux Propriétaires - E2MT",
  "Travaux de Désamiantage",
  "Travaux Locatifs",
  "Vérifications Réglementaires",
  "Visite cellule APE",
  "Visite réglementaire énergie électrique",
  "Visite tech audit étude (hors réglementaire et VG)",
  "Visites de Gestion",
] as const;

export const CONNECTIMMO_GERANTS_PROGRAMME = [
  "A DETERMINER",
  "AUTRE VOYAGEURS",
  "C32",
  "COMBUSTIBLE",
  "DI pour RH L",
  "DI pour RH/IST",
  "HEXAFRET",
  "HORS ISM TER",
  "HORS ISM TGV",
  "ISM TER Occitanie",
  "ISM TER Provence Alpes Côte d Azur",
  "ISM TGV Axe Atlantique",
  "ISM TGV Axe Sud Est",
  "Maintenance locative Industriel & Ferroviaire",
  "Maintenance locative Tertaire & Social",
  "Maintenance Sud Azur",
  "Matériel autres",
  "Matériel ISM",
  "Matériel TI Nevers Languedoc",
  "Optim Services",
  "RESEAU Ferroviaire",
  "RESEAU Industriel",
  "RESEAU Social",
  "RESEAU Tertiaire",
  "RESEAU Travaux a la demande",
  "SNCF",
  "TECHNIS",
  "TRACTION",
  "VOYAGEURS Travaux a la demande",
] as const;

export const CONNECTIMMO_ATTRIBUTAIRES = [
  "ABE",
  "Gestionnaire",
  "DIT",
  "A renseigner",
] as const;

// ============================================================
// IMMOSIS — Listes déroulantes (NETiKA - Référentiel Immobilier)
// ============================================================

export const IMMOSIS_GERANTS_PROGRAMME = [
  "AUTRE VOYAGEUR",
  "C32",
  "COMBUSTIBLE",
  "DI POUR RH L",
  "DI POUR RH/IST",
  "FRET ISM",
  "HEXAFRET",
  "HORS ISM TER",
  "HORS ISM TGV",
  "ISM INTERCITE",
  "ISM TER OCCITANIE",
  "ISM TER PROVENCE ALPES COTE D AZUR",
  "ISM TGV AXE ATLANTIQUE",
  "ISM TGV AXE SUD EST",
  "MAINTENANCE LOCATIVE INDUSTRIEL ET FERROVIAIRE",
  "MAINTENANCE LOCATIVE TERTIAIRE ET SOCIAL",
  "MAINTENANCE SUD AZUR",
  "MATERIEL AUTRES",
  "MATERIEL ISM",
  "MATERIEL TI NEVERS LANGUEDOC",
  "OPTIM SERVICES",
  "RESEAU FERROVIAIRE",
  "RESEAU INDUSTRIEL",
  "RESEAU SOCIAL",
  "RESEAU TERTIAIRE",
  "RESEAU TRAVAUX A LA DEMANDE",
  "TECHNIS",
  "TRACTION",
  "VOYAGEURS TRAVAUX A LA DEMANDE",
] as const;

export const IMMOSIS_NATURES = [
  { code: "8301", libelle: "Assainissement Voierie Réseau Divers, déchet, eau" },
  { code: "8302", libelle: "Installation hydraulique" },
  { code: "8303", libelle: "Plomberie sanitaire" },
  { code: "8311", libelle: "Distribution HTetMT - Postes de livr./transf." },
  { code: "8312", libelle: "Eclairage et installations électriques BT" },
  { code: "8313", libelle: "Courant faible (téléphonie, automatisme, GTB?)" },
  { code: "8320", libelle: "Installations chauffage, ventil. climatisation" },
  { code: "8330", libelle: "Accessibilité (Asc, escalier mécanique?) élévateur" },
  { code: "8341", libelle: "Equipements de sécurité incendie" },
  { code: "8342", libelle: "Vidéosurveillance, gardiennage, sécurisation" },
  { code: "8350", libelle: "Audits et Etudes Energétiques" },
  { code: "8410", libelle: "Espaces extérieurs dont élagage, abattage" },
  { code: "8420", libelle: "Entretien quais voyageurs" },
  { code: "8430", libelle: "Abris de quai et mobilier scellé" },
  { code: "8501", libelle: "Structure" },
  { code: "8502", libelle: "Clos" },
  { code: "8503", libelle: "Couvert" },
  { code: "8510", libelle: "Aménagements intérieurs" },
  { code: "8550", libelle: "Interventions anti-graffiti" },
  { code: "8560", libelle: "Interventions anti-vandalisme" },
  { code: "8600", libelle: "Petits Travaux Propriétaire" },
  { code: "8610", libelle: "Maintenance multitechniques - forfait E2MT" },
  { code: "8700", libelle: "Visite de surveillance, contrôle, diag., étude" },
  { code: "8800", libelle: "Démolitions - suppressions bâtiments équipements" },
  { code: "8900", libelle: "Réhabilitation globale" },
] as const;

export const IMMOSIS_VENTILATION_BD = [
  "DIRECTION DE L'IMMOBILIER",
  "EC RH DIRECTIONS",
  "FRET TRANSPORTS LOGISTIQUE",
  "GARES CONNEXIONS",
  "ILE DE FRANCE",
  "RFF",
  "EC RH LOGEMENT",
  "SNCF",
  "SNCF VOYAGEURS",
  "SNCF RESEAU",
  "DI CGVI",
  "RH IST 13405 02133 02451",
  "Logement Patrimoine 13405 02132 02463",
  "Service Médical SNCF 66157 66161 67069",
  "DI SA VOYAGEURS",
  "MOBILITES GARES & CONNEXIONS",
  "MOBILITES FRET",
  "FT Immobilier LOGEMENTS 13335 19595 01052",
  "RESEAU DIVISION IMMOBILIERE",
  "RESEAU EIV ET ABORDS",
  "RESEAU AUTRE 13345 65213 01620",
  "PABE S2FIT",
  "SNCF GARES & CONNEXIONS",
  "FRET IMMO",
  "G&C IMMOBILIER",
  "G&C RESEAU",
] as const;

// ============================================================
// RÈGLES MÉTIER — Correspondances et logique de remplissage
// ============================================================

/**
 * Règle OPTIM SERVICES (ex GIE) :
 * - Les AT doivent être saisies sur le gérant OPTIM SERVICES (pas de gérant "GIE")
 * - Dépenses locatives OU propriétaires → toujours sous OPTIM SERVICES
 * - B/D = 100% DIRECTION DE L'IMMOBILIER
 */
export const REGLE_OPTIM_SERVICES = {
  gerant: "OPTIM SERVICES",
  ventilationBD: "DIRECTION DE L'IMMOBILIER",
  pourcentage: 100,
  note: "Ex GIE - pas de gérant GIE existant. Locatif et propriétaire sous même gérant.",
};

/**
 * Nommage AT pour le périmètre DIT Grand Sud Lot 4.1 :
 * - Toujours DI (pas ABE)
 * - Format : 47-26-xxxx (47 = code région Occitanie, 26 = année 2026)
 * - Le numéro est séquentiel
 */
export const NOMMAGE_AT_CONFIG = {
  prefixe: "47-26-",
  codeRegion: "47",
  annee: "26",
  emetteur: "DI", // Toujours DI, jamais ABE
  dtiDex: "DTI Méditerranée",
  note: "Format : [code région]-[année]-[numéro séquentiel]. Ex: 47-26-0205",
};

/**
 * Correspondance sous-type IMMOSIS ↔ sous-type Connect'Immo
 * (les libellés diffèrent légèrement entre les deux outils)
 */
export const CORRESPONDANCE_SOUS_TYPES: Record<string, string> = {
  // Sous-type IMMOSIS → Sous-type Connect'Immo
  "GE": "Gros Entretiens - par E2MT",
  "PTP": "Petits Travaux Propriétaires - E2MT",
  "CME": "Contrats de Maintenance Externe - E2MT",
  "VRE": "Vérifications Réglementaires",
  "MEC": "Mise en conformité réglementaire autre",
  "ML": "Maintenance Locative",
  "TL": "Travaux Locatifs",
  "VTR_G_BNC": "Gros Entretiens",
  "EE_MPS": "Energie Electrique MPS",
  "AM_VR_TVX": "Travaux de Désamiantage",
  "C4": "C4. Connaissance des actifs",
  "B1": "B1. Gestion du risque incendie",
  "B2": "B2. Gestion du risque amiante",
};

/**
 * Correspondance Gérant de programme ↔ SA (Société Anonyme)
 * pour déterminer la ventilation B/D propriétaire
 */
export const GERANT_VERS_SA: Record<string, { sa: string; bd: string }> = {
  "ISM TER OCCITANIE": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "ISM TER PROVENCE ALPES COTE D AZUR": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "ISM TGV AXE ATLANTIQUE": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "ISM TGV AXE SUD EST": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "AUTRE VOYAGEUR": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "MAINTENANCE SUD AZUR": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "VOYAGEURS TRAVAUX A LA DEMANDE": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "MAINTENANCE LOCATIVE INDUSTRIEL ET FERROVIAIRE": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "MAINTENANCE LOCATIVE TERTIAIRE ET SOCIAL": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "MATERIEL ISM": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "MATERIEL AUTRES": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "MATERIEL TI NEVERS LANGUEDOC": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "ISM INTERCITE": { sa: "SA_VOYAGEURS", bd: "SNCF VOYAGEURS" },
  "RESEAU FERROVIAIRE": { sa: "SA_RESEAU", bd: "SNCF RESEAU" },
  "RESEAU INDUSTRIEL": { sa: "SA_RESEAU", bd: "SNCF RESEAU" },
  "RESEAU SOCIAL": { sa: "SA_RESEAU", bd: "SNCF RESEAU" },
  "RESEAU TERTIAIRE": { sa: "SA_RESEAU", bd: "SNCF RESEAU" },
  "RESEAU TRAVAUX A LA DEMANDE": { sa: "SA_RESEAU", bd: "SNCF RESEAU" },
  "HEXAFRET": { sa: "SAS_FRET", bd: "FRET TRANSPORTS LOGISTIQUE" },
  "FRET ISM": { sa: "SAS_FRET", bd: "FRET TRANSPORTS LOGISTIQUE" },
  "C32": { sa: "SAS_FRET", bd: "FRET TRANSPORTS LOGISTIQUE" },
  "TECHNIS": { sa: "SAS_FRET", bd: "FRET TRANSPORTS LOGISTIQUE" },
  "COMBUSTIBLE": { sa: "SA_SNCF", bd: "SNCF" },
  "TRACTION": { sa: "SA_SNCF", bd: "SNCF" },
  "DI POUR RH L": { sa: "SA_SNCF", bd: "SNCF" },
  "DI POUR RH/IST": { sa: "SA_SNCF", bd: "SNCF" },
  "OPTIM SERVICES": { sa: "SA_SNCF", bd: "DIRECTION DE L'IMMOBILIER" },
};

/**
 * Codes BUPO par SA (pour l'ERP PeopleSoft)
 */
export const BUPO_PAR_SA: Record<string, string> = {
  "SA_SNCF": "67858",
  "SA_VOYAGEURS": "05335",
  "SA_RESEAU": "00077",
  "SAS_FRET": "00059",
};

/**
 * Les 7 onglets de Connect'Immo à remplir dans l'ordre
 */
export const CONNECTIMMO_ONGLETS = [
  {
    numero: 1,
    nom: "Emergence",
    champs: [
      "Intitulé du projet*",
      "Statut du projet",
      "Attributaire",
      "Origine*",
      "Sous-Types*",
      "Priorité",
      "Présence FEX",
      "Urgence (U1/U2/U3)",
      "Début/Fin d'exercice",
      "Début/Fin des travaux",
      "Responsable budget",
      "Estimation (€)",
      "Valo",
      "Gestionnaire d'actif",
      "Toggles: Démolition, Locatif, Mise en sécurité ferroviaire, Risques Ferroviaires, Pollution",
    ],
  },
  {
    numero: 2,
    nom: "Emergence (suite)",
    champs: [
      "Pilote du projet",
      "Personne(s) à informer",
      "Date initiale de planification",
      "Occupant bénéficiaire projet",
      "Regroupement transverse",
      "Commentaire production",
      "Pièce(s) jointe(s)",
      "Commentaire Programmation / URL",
    ],
  },
  {
    numero: 3,
    nom: "Prévision pluriannuelle",
    champs: [
      "Début/Fin d'exercice",
      "Estimation (€)",
      "Tableau prévisionnel par année",
    ],
  },
  {
    numero: 4,
    nom: "Ouverture AT/OS",
    champs: [
      "Numéro AT/OS",
      "Montant AT/OS (€)",
      "Date AT",
      "Etat AT (CONTRACTUALISE/EN COURS/...)",
      "Gérant de programme",
      "Pièce jointe",
      "Commentaires",
    ],
  },
  {
    numero: 5,
    nom: "Synthèse commande(s)",
    champs: [
      "ID CDA",
      "Intitulé CDA",
      "Pilote CDA",
      "Montant du devis",
      "Axe central (donné par Immosis)",
      "Axe local (donné par Immosis)",
      "Numéro AT (lien)",
      "UT / Bien",
      "Statut CDA",
    ],
  },
  {
    numero: 6,
    nom: "Demande de devis",
    champs: [
      "Toggles: Amiante, CSPS, MECi, ECO NRJ, Plan de prévention, RSE",
      "Intitulé CDA",
      "Numéro de devis",
      "Date de devis",
      "Statut CDA",
      "Attributaire CDA",
      "Détail fournisseur",
      "Montant avenant / Montant devis",
      "Occupant bénéficiaire CDA",
      "Pilote CDA",
      "Typologie de travaux",
      "Commentaires CDA / Pièces jointes CDA",
    ],
  },
  {
    numero: 7,
    nom: "Vie de la commande",
    champs: [
      "Intitulé CDA",
      "Axe local (Immosis)",
      "Axe central (Immosis)",
      "Statut CDA",
      "Date de réalisation",
      "Numéro DA",
      "Date DA",
      "Attributaire CDA",
      "Date CDA",
      "Montant CDA (€)",
      "Numéro CDA",
      "Détail fournisseur",
      "Numéro de réception",
      "Date de dernière réception",
      "DTA mis à jour",
      "Pilote CDA",
      "PV réception Tx",
      "Référence du contrat",
    ],
  },
] as const;

/**
 * Champs de la page 1 Immosis (Ajout d'une action technique AT)
 */
export const IMMOSIS_CHAMPS_AT = {
  identification: [
    "Utilisateur",
    "Gérant de programmes*",
    "Type*",
    "Nom*",
    "Stratégie*",
    "Priorité",
    "Class. Reg.",
    "Exercice",
    "Début*",
    "Fin",
    "Fin effective",
    "DTI/DEX",
    "Région*",
    "Etat*",
    "Référence",
  ],
  localisation: [
    "Région (checkbox)",
    "UT",
    "BAT/IF",
    "Locaux",
    "Equipement",
  ],
  repartition: [
    "Type* (Manuel)",
    "Tantièmes* (Surface Développée)",
    "Date de calcul",
  ],
  ventilation: "B/D Propriétaire avec % et Montant",
  montants: "Section Montants",
  nature: "Code nature (83xx-89xx)",
  tva: "TVA applicable / Taux TVA",
  description: "Description détaillée",
  suiviMoaMoe: "Suivi MOA/MOE",
};

/**
 * Correspondance nature de travaux (texte devis) → code nature Immosis
 */
export const NATURE_TRAVAUX_VERS_CODE: Record<string, string> = {
  "plomberie": "8303",
  "sanitaire": "8303",
  "chauffage": "8320",
  "climatisation": "8320",
  "ventilation": "8320",
  "cvc": "8320",
  "électricité": "8312",
  "éclairage": "8312",
  "courant fort": "8312",
  "courant faible": "8313",
  "téléphonie": "8313",
  "gtb": "8313",
  "automatisme": "8313",
  "incendie": "8341",
  "ssi": "8341",
  "détection": "8341",
  "extincteur": "8341",
  "vidéosurveillance": "8342",
  "sécurisation": "8342",
  "gardiennage": "8342",
  "ascenseur": "8330",
  "élévateur": "8330",
  "escalier mécanique": "8330",
  "accessibilité": "8330",
  "structure": "8501",
  "gros oeuvre": "8501",
  "fondation": "8501",
  "clos": "8502",
  "menuiserie extérieure": "8502",
  "façade": "8502",
  "couvert": "8503",
  "toiture": "8503",
  "étanchéité": "8503",
  "couverture": "8503",
  "aménagement intérieur": "8510",
  "peinture": "8510",
  "sol": "8510",
  "faux plafond": "8510",
  "cloison": "8510",
  "anti-graffiti": "8550",
  "graffiti": "8550",
  "anti-vandalisme": "8560",
  "vandalisme": "8560",
  "espace extérieur": "8410",
  "élagage": "8410",
  "abattage": "8410",
  "quai voyageur": "8420",
  "quai": "8420",
  "abri de quai": "8430",
  "mobilier scellé": "8430",
  "petits travaux": "8600",
  "maintenance multitechnique": "8610",
  "e2mt": "8610",
  "visite": "8700",
  "contrôle": "8700",
  "diagnostic": "8700",
  "audit": "8350",
  "étude énergétique": "8350",
  "démolition": "8800",
  "déconstruction": "8800",
  "réhabilitation": "8900",
  "assainissement": "8301",
  "voirie": "8301",
  "hydraulique": "8302",
  "distribution ht": "8311",
  "poste de livraison": "8311",
  "transformateur": "8311",
};
