// Données de référence E2MT²

export const LOTS = [
  { code: "1.1", name: "Lot 1.1", region: "Hauts de France" },
  { code: "1.2", name: "Lot 1.2", region: "Normandie" },
  { code: "2.1", name: "Lot 2.1", region: "Champagne-Ardenne-Lorraine" },
  { code: "2.2", name: "Lot 2.2", region: "Alsace" },
  { code: "3.1", name: "Lot 3.1", region: "Auvergne-Rhône-Alpes" },
  { code: "3.2", name: "Lot 3.2", region: "Bourgogne-Franche-Comté" },
  { code: "4.1", name: "Lot 4.1", region: "Occitanie" },
  { code: "4.2", name: "Lot 4.2", region: "Provence-Alpes-Côte d'Azur" },
  { code: "5.1", name: "Lot 5.1", region: "Aquitaine" },
  { code: "5.2", name: "Lot 5.2", region: "Poitou-Charentes-Limousin" },
  { code: "6.1", name: "Lot 6.1", region: "Bretagne – Pays de la Loire" },
  { code: "6.2", name: "Lot 6.2", region: "Centre" },
  { code: "7.1", name: "Lot 7.1", region: "Saint-Denis" },
  { code: "7.2", name: "Lot 7.2", region: "Paris Rive-Gauche" },
  { code: "8.1", name: "Lot 8.1", region: "Paris Nord" },
  { code: "8.2", name: "Lot 8.2", region: "Paris Saint Lazare" },
  { code: "9.1", name: "Lot 9.1", region: "Paris Est" },
  { code: "9.2", name: "Lot 9.2", region: "Paris Sud Est" },
] as const;

export const WORK_TYPES = [
  { code: "C1a", name: "CVC", description: "Chauffage, Ventilation et Climatisation" },
  { code: "C1b", name: "Désenfumage", description: "Installations de désenfumage" },
  { code: "C2", name: "Protection incendie", description: "Installations de protection incendie" },
  { code: "C3", name: "Fermetures motorisées", description: "Fermetures motorisées" },
  { code: "C4", name: "GTC/GTB", description: "Systèmes GTC / GTB" },
  { code: "C5", name: "Sécurité incendie", description: "Systèmes de sécurité incendie" },
  { code: "C6", name: "Clos et couvert", description: "Clos et couvert" },
  { code: "C7", name: "Électricité CF", description: "Électricité courants forts" },
  { code: "C8", name: "Appareils de levage", description: "Appareils de levage" },
  { code: "C9", name: "Ascenseurs", description: "Ascenseurs et monte-charges" },
  { code: "C10", name: "Plomberie", description: "Installations de plomberie" },
  { code: "C11", name: "Éclairage", description: "Installations d'éclairage" },
  { code: "C12", name: "Second œuvre", description: "Équipements et ouvrages de second œuvre" },
  { code: "C13", name: "Électricité Cf", description: "Électricité courants faibles" },
  { code: "C14", name: "Extincteurs", description: "Extincteurs" },
] as const;

export const PORTFOLIOS = ["Industriel", "Ferroviaire", "Gares", "Tertiaire", "Social"] as const;

export const CRITICALITIES = ["C1", "C2"] as const;

export const MAINTENANCE_TYPES = [
  { code: "MPREV", name: "Préventive systématique" },
  { code: "MREG", name: "Préventive réglementaire" },
  { code: "MCOR", name: "Corrective" },
] as const;

export const STATUSES = [
  { code: "planifie", name: "Planifié", color: "blue" },
  { code: "en_cours", name: "En cours", color: "orange" },
  { code: "termine", name: "Terminé", color: "green" },
  { code: "annule", name: "Annulé", color: "gray" },
] as const;

// Délais contractuels en minutes
export const CONTRACTUAL_DELAYS = {
  C1: {
    d1: 8 * 60,        // 8 heures (temps réel calendaire)
    d2: 2 * 8 * 60,    // 2 jours ouvrés (16h ouvrées)
    arrivalOnSite: 2 * 60, // 2 heures
    arrivalIfPresent: 15,   // 15 minutes
  },
  C2: {
    d1: 8 * 60,        // 8 heures ouvrées
    d2: 8 * 8 * 60,    // 8 jours ouvrés (64h ouvrées)
    arrivalOnSite: 4 * 60, // 4 heures ouvrées
  },
} as const;

// Délai spécial ascenseurs (C8/C9) personne bloquée
export const ELEVATOR_EMERGENCY_D1 = 45; // 45 minutes
