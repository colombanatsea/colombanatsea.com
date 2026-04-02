/**
 * ============================================================================
 * SIMULATEUR AAP ADEME 2026
 * « Aides à l'investissement pour la décarbonation du transport
 *   et des services maritimes »
 * ============================================================================
 *
 * GASPE — Localement ancrées. Socialement engagées.
 * Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau
 * Maison de la Mer, Quai de la Fosse, 44000 Nantes
 *
 * Ce simulateur transforme un armateur côtier GASPE (TPE/PME, aucune
 * connaissance en montage de dossier) en candidat crédible face à un
 * instructeur ADEME, en 30 minutes.
 *
 * Cadre réglementaire :
 *   - AAP ouvert le 2 avril 2026, clôture 6 juillet 2026
 *   - Thématique 1 : Décarbonation directe des navires (TRL ≥ 7)
 *   - Thématique 2 : Investissements industriels (TRL ≥ 7)
 *   - Régime SA.111726 (LDACEE), SA.111728 (PME), SA.119559 (AFR)
 *   - Mono-partenaire (thématiques 1 et 2)
 *   - Budget min 300k€ (PME), 1M€ (GE)
 *   - Aide max 6M€ par projet et par entreprise
 *
 * Architecture : React 18 (globals) + Recharts + Tailwind CSS (extraites)
 * Zéro CDN, zéro Google Fonts. CSP strict GitHub Pages.
 *
 * Sources scientifiques :
 *   - dimBatt : DNV Pt.6 Ch.2, Corvus Orca, ABB Marine 2022, BNEF 2024
 *   - Émissions : IMO MEPC.1/Circ.684, ENTEC 2005
 *   - Taux LDACEE : CdC AAP ADEME 2026, Annexe 2 (vérifié le 2 avril 2026)
 *
 * Version : 1.0.0 — 2 avril 2026
 * Propulsé par VAIATA Dynamics
 * ============================================================================
 */

const {
  useState,
  useEffect,
  useCallback,
  useMemo
} = React;
const {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell
} = Recharts;

// ============================================================================
// SECTION 1 : CONSTANTES & DONNÉES
// ============================================================================

// --- Palette de couleurs ---
const T = "#1B9AAA"; // Teal GASPE (accent principal)
const D = "#1E2D3D"; // Dark navy (texte, header)
const AC = "#E8634A"; // Coral (alertes, accents chauds)
const LB = "#EAF4F7"; // Light blue (backgrounds)
const W = "#F59E0B"; // Warning amber
const GR = "#10B981"; // Green success
const PU = "#7C3AED"; // Purple (wizard, CTA)

// --- Logos GASPE (base64, extraits en haute résolution) ---
const GASPE_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASYAAABkCAYAAAArI50JAAABAGlDQ1BpY2MAABiVY2BgPMEABCwGDAy5eSVFQe5OChGRUQrsDxgYgRAMEpOLCxhwA6Cqb9cgai/r4lGHC3CmpBYnA+kPQKxSBLQcaKQIkC2SDmFrgNhJELYNiF1eUlACZAeA2EUhQc5AdgqQrZGOxE5CYicXFIHU9wDZNrk5pckIdzPwpOaFBgNpDiCWYShmCGJwZ3AC+R+iJH8RA4PFVwYG5gkIsaSZDAzbWxkYJG4hxFQWMDDwtzAwbDuPEEOESUFiUSJYiAWImdLSGBg+LWdg4I1kYBC+wMDAFQ0LCBxuUwC7zZ0hHwjTGXIYUoEingx5DMkMekCWEYMBgyGDGQCm1j8/yRb+6wAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH6gQCEQcVG/pHZAAANelJREFUeNrtnXd4HcX1979nZstt6tVFtrGNbUw13fQaQg8khBJaIIQQ0ggdDCG00GsIEIeaAKGFEkInGGIwJWCKce+WbVm93bJl5rx/7F5JtgSWjcDK793P82wcdKW5s7OzZ86cNkBERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERMS3CG3qDgw0FQd8D8Vl5agYPgIynoJghiUk2pqasGb1Kix75r5N3cX/aeztdsXEXXYDl22GnKdQM3YCrFQhZKIAieGbAUQAAV5bK7KrlwFaoXP5UmTbmlFVWYaVcz7BzPtu2tS3ETHIMTZ1B74Oky+8C5zNILXZWCRrRiOtGMf9cFtcc+ChhVRcIIkViBlCSHBHM9o/eye941Ofu8UxA8nmWnQuXwAlBBbOmYXav/7xW+//QZdcj/jwkZCpUiiW0BBrfa4JAHmQ8KE9ht/YhJcuOPlb7+e4k3+GytGjUTBsDAonH4W5VxybQvHwQmaaAECCgc5Fs4c3fvDmdooAAkNadkPhmC0/JEATM4RWqw03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";

// --- Symbole A GASPE (footer / branding) ---
const GASPE_A_COULEUR = "data:image/jpeg;base64,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";
const GASPE_A_BLANC = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAAAAAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAALCAAgACABAREA/8QAGAAAAwEBAAAAAAAAAAAAAAAABQcIAwb/xAAuEAABAwMCAwYGAwAAAAAAAAABAgMEBQYRAAcSITEIEyJRcZEUFRYyQWFigYL/2gAIAQEAAD8AlTXS2rYtzXXGfkW7RZlQYZWG3FspBCVEZxknrjQ24aFU7cqjlOrkJ6DObCVKZeThQBGQfbQzW8KK9OmMRYjSnpD7iWmm0jJWpRwAP2SRq51TqX2f9nqSxJbRIll1tDiEnBffWQXleiUhWP0lI/OllvXR6jvRMp1TsWz6uoRkKaNSlhuK3KaPNPAHCCQDnB/keWp/u+y7is+Qhm5aRKp6l/YpxOUL8+FYyk/0dObsfWH85ul+6Z7WYNJPBG4hyXJUOv8AhJz6qTpzX5uhtK1WA5cEiPVKtSHHGW2REcfLTgPi4cju85SPFn8ddArT3UujdmuVCFYbtJt6DAQlxTlRbMiU6kkgFKB4AM8iMnGRz56VXaL3CvB1r6FumNBZdiPB5+VESQicnGWlJCvtHXODzPljGlhb24t227TEU6h1+dBhIUpSWWVhKQSck9OuuVcWpxaluKKlqOSScknz0Ttu4KtbVR+PoM+RAmcBb71hXCrhPUenIe2tboumtXVKZk3DUpFQkMo7tDj5BUlOc4z5ZJ99f//Z";

// --- Carburants de référence ---
// Sources: IMO GHG Study 2020, ADEME 2024
// Prix MDO ajusté post-crise Iran (fermeture Ormuz fév. 2026)
// Source prix: EIA STEO mars 2026 (Brent ~80 $/bbl horizon H2 2026)
const DEF_FUELS = [{
  id: "mdo",
  l: "MDO (Marine Diesel Oil)",
  cat: "Fossile",
  co2: 3.206,
  price: 850,
  pGr: 4,
  note: "Référence — prix post-crise Iran"
}, {
  id: "b30",
  l: "B30 (blend 30% bio)",
  cat: "Drop-in",
  co2: 2.244,
  price: 1050,
  pGr: 2,
  note: "Sans modification moteur"
}, {
  id: "fame",
  l: "Biodiesel FAME B100",
  cat: "Bio",
  co2: 0.641,
  price: 1500,
  pGr: 1,
  note: "Drop-in diesel, joints à vérifier"
}, {
  id: "hvo",
  l: "HVO (huile hydrogénée)",
  cat: "Bio",
  co2: 0.480,
  price: 1700,
  pGr: 1,
  note: "Drop-in sans modification"
}, {
  id: "elec",
  l: "Électricité batteries",
  cat: "Zéro émission",
  co2: 0,
  price: 180,
  pGr: 2,
  note: "€/MWh — réseau FR",
  unit: "MWh"
}, {
  id: "h2",
  l: "Hydrogène vert (PàC)",
  cat: "e-fuel",
  co2: 0,
  price: 6000,
  pGr: -2,
  note: "Expérimental TRL 7-8",
  adv: true
}, {
  id: "ops",
  l: "OPS (électricité quai)",
  cat: "Zéro quai",
  co2: 0,
  price: 150,
  pGr: 2,
  note: "À quai uniquement",
  unit: "MWh",
  adv: true
}];

// --- Technologies avec TRL (nouveau) ---
// Sources: IMO, DNV, BNEF 2024, ADEME fiches leviers 2025
const TECHS = [{
  id: "helice",
  l: "Hélice optimisée",
  gL: .03,
  gM: .05,
  gH: .08,
  ox: 5,
  retro: "2-4 sem.",
  n: "Tous profils",
  cat: "Efficacité",
  trl: 9
}, {
  id: "antifouling",
  l: "Antifouling avancé",
  gL: .02,
  gM: .03,
  gH: .05,
  ox: 20,
  retro: "1-2 sem.",
  n: "Renouvelable",
  cat: "Efficacité",
  trl: 9
}, {
  id: "slowsteam",
  l: "Réduction vitesse",
  gL: .10,
  gM: .15,
  gH: .25,
  ox: 0,
  retro: "Immédiat",
  n: "Impact temps trajet",
  cat: "Opérationnel",
  trl: 9
}, {
  id: "hybride",
  l: "Hybridation diesel-élect.",
  gL: .15,
  gM: .25,
  gH: .35,
  ox: 40,
  retro: "3-6 mois",
  n: "Charge variable",
  cat: "Électrification",
  trl: 9
}, {
  id: "fullelec",
  l: "Électrification complète",
  gL: .90,
  gM: .95,
  gH: 1.0,
  ox: 30,
  retro: "6-12 mois",
  n: "Zéro émission",
  cat: "Électrification",
  trl: 9
}, {
  id: "bulbe",
  l: "Bulbe d'étrave",
  gL: .03,
  gM: .07,
  gH: .12,
  ox: 0,
  retro: "3-6 sem.",
  n: "> 12 nœuds",
  cat: "Efficacité",
  trl: 9
}, {
  id: "routage",
  l: "Routage marée/courant (IA)",
  gL: .08,
  gM: .15,
  gH: .20,
  ox: 5,
  retro: "1-2 mois",
  n: "Bacs de Seine −17%",
  cat: "Efficacité",
  trl: 8
}, {
  id: "velique",
  l: "Propulsion vélique",
  gL: .05,
  gM: .10,
  gH: .20,
  ox: 10,
  retro: "3-6 mois",
  n: "Routes favorables",
  cat: "Renouvelable",
  trl: 8,
  adv: true
}, {
  id: "h2pac",
  l: "Pile à combustible H₂",
  gL: .80,
  gM: .90,
  gH: .95,
  ox: 50,
  retro: "12+ mois",
  n: "TRL 7-8",
  cat: "Hydrogène",
  trl: 7,
  adv: true
}];

// --- Types de navires avec valeurs par défaut ---
const VT = [{
  id: "bac",
  l: "Bac estuarien / passage d'eau",
  d: {
    loa: 45,
    gt: 400,
    pP: 800,
    pA: 200,
    pPeak: 1200,
    spd: 8,
    fc: 80,
    pTr: 40,
    pMa: 30,
    pQu: 30,
    opD: 300,
    rD: 40,
    cDur: 8,
    qT: 5,
    pax: 0,
    veh: 50,
    opex: 800,
    crew: 500,
    ins: 60,
    dd: 120,
    ddC: 5,
    mktV: 5000,
    rev: 2000,
    debt: 0,
    dspR: 10,
    lifeR: 15
  }
}, {
  id: "navette",
  l: "Navette passagers",
  d: {
    loa: 25,
    gt: 150,
    pP: 600,
    pA: 100,
    pPeak: 800,
    spd: 12,
    fc: 40,
    pTr: 60,
    pMa: 20,
    pQu: 20,
    opD: 300,
    rD: 30,
    cDur: 20,
    qT: 10,
    pax: 200,
    veh: 0,
    opex: 500,
    crew: 400,
    ins: 50,
    dd: 100,
    ddC: 5,
    mktV: 3000,
    rev: 1500,
    debt: 0,
    dspR: 8,
    lifeR: 18
  }
}, {
  id: "ferry",
  l: "Ferry insulaire (ropax)",
  d: {
    loa: 80,
    gt: 3000,
    pP: 8000,
    pA: 1500,
    pPeak: 10000,
    spd: 15,
    fc: 600,
    pTr: 70,
    pMa: 15,
    pQu: 15,
    opD: 330,
    rD: 6,
    cDur: 60,
    qT: 30,
    pax: 600,
    veh: 120,
    opex: 3000,
    crew: 2000,
    ins: 350,
    dd: 800,
    ddC: 5,
    mktV: 25000,
    rev: 12000,
    debt: 5000,
    dspR: 10,
    lifeR: 15
  }
}, {
  id: "lamanage",
  l: "Navire de lamanage",
  d: {
    loa: 18,
    gt: 80,
    pP: 1000,
    pA: 50,
    pPeak: 1500,
    spd: 10,
    fc: 25,
    pTr: 20,
    pMa: 60,
    pQu: 20,
    opD: 340,
    rD: 15,
    cDur: 5,
    qT: 15,
    pax: 0,
    veh: 0,
    opex: 200,
    crew: 250,
    ins: 30,
    dd: 60,
    ddC: 5,
    mktV: 2000,
    rev: 800,
    debt: 0,
    dspR: 7,
    lifeR: 12
  }
}, {
  id: "vedette",
  l: "Vedette rapide",
  d: {
    loa: 20,
    gt: 100,
    pP: 1200,
    pA: 100,
    pPeak: 1600,
    spd: 25,
    fc: 80,
    pTr: 70,
    pMa: 15,
    pQu: 15,
    opD: 280,
    rD: 20,
    cDur: 15,
    qT: 10,
    pax: 100,
    veh: 0,
    opex: 500,
    crew: 350,
    ins: 80,
    dd: 120,
    ddC: 5,
    mktV: 3500,
    rev: 1800,
    debt: 0,
    dspR: 6,
    lifeR: 20
  }
}, {
  id: "ctv",
  l: "Crew Transfer Vessel (EMR)",
  d: {
    loa: 27,
    gt: 200,
    pP: 2500,
    pA: 200,
    pPeak: 3000,
    spd: 25,
    fc: 100,
    pTr: 65,
    pMa: 15,
    pQu: 20,
    opD: 280,
    rD: 4,
    cDur: 45,
    qT: 30,
    pax: 24,
    veh: 0,
    opex: 600,
    crew: 400,
    ins: 80,
    dd: 150,
    ddC: 5,
    mktV: 5000,
    rev: 2500,
    debt: 0,
    dspR: 0,
    lifeR: 20
  }
}, {
  id: "fret",
  l: "Navire de fret côtier (caboteur)",
  d: {
    loa: 40,
    gt: 300,
    pP: 600,
    pA: 150,
    pPeak: 800,
    spd: 9,
    fc: 60,
    pTr: 70,
    pMa: 15,
    pQu: 15,
    opD: 280,
    rD: 2,
    cDur: 120,
    qT: 60,
    pax: 12,
    veh: 0,
    opex: 500,
    crew: 400,
    ins: 70,
    dd: 150,
    ddC: 5,
    mktV: 4000,
    rev: 1500,
    debt: 0,
    dspR: 0,
    lifeR: 25
  }
}];

// --- Régions françaises → Zone AFR automatique ---
// Source: Décret n° 2022-968 du 30 juin 2022 relatif aux zones d'aide à finalité régionale
const REGIONS = [{
  id: "metropole_standard",
  l: "Métropole (hors zone AFR)",
  zone: "hors"
}, {
  id: "bretagne",
  l: "Bretagne",
  zone: "hors"
}, {
  id: "normandie",
  l: "Normandie",
  zone: "hors"
}, {
  id: "paca",
  l: "Provence-Alpes-Côte d'Azur",
  zone: "hors"
}, {
  id: "occitanie",
  l: "Occitanie",
  zone: "hors"
}, {
  id: "nouvelle_aq",
  l: "Nouvelle-Aquitaine",
  zone: "hors"
}, {
  id: "pays_loire",
  l: "Pays de la Loire",
  zone: "hors"
}, {
  id: "hauts_france",
  l: "Hauts-de-France",
  zone: "hors"
}, {
  id: "idf",
  l: "Île-de-France",
  zone: "hors"
}, {
  id: "corse",
  l: "Corse",
  zone: "zoneC"
}, {
  id: "nord_pas_calais",
  l: "Nord (Dunkerque, Boulogne…)",
  zone: "zoneC"
}, {
  id: "guadeloupe",
  l: "Guadeloupe",
  zone: "zoneA"
}, {
  id: "martinique",
  l: "Martinique",
  zone: "zoneA"
}, {
  id: "reunion",
  l: "La Réunion",
  zone: "zoneA"
}, {
  id: "guyane",
  l: "Guyane",
  zone: "zoneA"
}, {
  id: "mayotte",
  l: "Mayotte",
  zone: "zoneA"
}, {
  id: "saint_martin",
  l: "Saint-Martin",
  zone: "zoneA"
}, {
  id: "spm",
  l: "Saint-Pierre-et-Miquelon",
  zone: "zoneA"
}];
// --- Facteurs d'émission SOx/NOx/PM (g/kWh) ---
// Sources: IMO MEPC.1/Circ.684, ENTEC 2005, Cooper & Gustafsson 2004
const EMFACT = {
  mdo: {
    sox: 10.3,
    nox: 9.8,
    pm: 0.38,
    src: "IMO MEPC.1/Circ.684, Tier II"
  },
  b30: {
    sox: 7.2,
    nox: 8.8,
    pm: 0.32,
    src: "Bates et al. 2021, 30% FAME blend"
  },
  fame: {
    sox: 0.8,
    nox: 7.5,
    pm: 0.18,
    src: "Jayaram et al. 2011, B100"
  },
  hvo: {
    sox: 0.5,
    nox: 7.0,
    pm: 0.12,
    src: "Sjöblom 2023, HVO marine"
  },
  elec: {
    sox: 0,
    nox: 0,
    pm: 0,
    src: "Zéro émission directe"
  },
  h2: {
    sox: 0,
    nox: 0,
    pm: 0,
    src: "Pile à combustible, zéro émission directe"
  },
  ops: {
    sox: 0,
    nox: 0,
    pm: 0,
    src: "Alimentation réseau terrestre"
  }
};

// --- Taux d'aide ADEME (LDACEE) ---
// Source: CdC AAP ADEME 2026, Annexe 2, pages 35-36
// Vérifié le 2 avril 2026 — conforme au régime SA.111726
const ADEME_RATES = {
  // Thématique 1 : Décarbonation directe des navires
  navPropre: {
    "-": {
      PE: 50,
      ME: 40,
      GE: 20
    }
  },
  navEmissionNulle: {
    "-": {
      PE: 60,
      ME: 50,
      GE: 30
    }
  },
  amelioContrefactuel: {
    hors: {
      PE: 50,
      ME: 40,
      GE: 30
    },
    zoneC: {
      PE: 55,
      ME: 45,
      GE: 35
    },
    zoneA: {
      PE: 65,
      ME: 55,
      GE: 45
    }
  },
  amelioSans: {
    hors: {
      PE: 25,
      ME: 20,
      GE: 15
    },
    zoneC: {
      PE: 27.5,
      ME: 22.5,
      GE: 17.5
    },
    zoneA: {
      PE: 32.5,
      ME: 27.5,
      GE: 22.5
    }
  },
  etudes: {
    "-": {
      PE: 80,
      ME: 70,
      GE: 60
    }
  },
  // Thématique 2 : Investissements industriels (PME hors zone AFR)
  industrielPME: {
    hors: {
      PE: 20,
      ME: 10,
      GE: 0
    },
    zoneC: {
      PE: 35,
      ME: 25,
      GE: 15
    },
    zoneA: {
      PE: 70,
      ME: 60,
      GE: 50
    }
  }
};

// --- Catégorisation des dépenses ADEME (Guide 2026, type "Investissement") ---
// Source: Guide de catégorisation des dépenses ADEME 2026, page 5
const ADEME_EXPENSE_CATS = [{
  id: "equip_prop",
  l: "Équipements de propulsion bas carbone",
  poste: "Équipements / Investissements",
  sub: "Équipements process",
  ex: "Moteur hybride, pod électrique, pile H₂"
}, {
  id: "equip_stock",
  l: "Systèmes de stockage d'énergie",
  poste: "Équipements / Investissements",
  sub: "Équipements process",
  ex: "Batteries LFP, réservoirs H₂"
}, {
  id: "infra",
  l: "Infrastructure de charge / avitaillement",
  poste: "Équipements / Investissements",
  sub: "Aménagements et constructions",
  ex: "Bornes, câbles, transformateurs"
}, {
  id: "ing_ext",
  l: "Ingénierie réalisée en externe",
  poste: "Équipements / Investissements",
  sub: "Ingénierie d'investissement",
  ex: "MOE, AMO, études, classification"
}, {
  id: "trav_modif",
  l: "Travaux de modification / adaptation",
  poste: "Équipements / Investissements",
  sub: "Autres équipements",
  ex: "Adaptation coque, réseaux bord"
}, {
  id: "certif",
  l: "Certification et classification",
  poste: "Équipements / Investissements",
  sub: "Logiciels et brevets",
  ex: "Bureau Veritas, DNV, essais"
}, {
  id: "moe_int",
  l: "Maîtrise d'œuvre interne",
  poste: "Personnel",
  sub: "MOE réalisée en interne",
  ex: "Plafonné 10% coût total",
  plafond: 0.10
}, {
  id: "formation",
  l: "Formation équipage STCW",
  poste: "Autres dépenses",
  sub: "Prestations extérieures",
  ex: "Plafonné 10% dépenses éligibles",
  plafond: 0.10
}, {
  id: "certif_dep",
  l: "Certification contrôle des dépenses",
  poste: "Autres dépenses",
  sub: "Certification",
  ex: "CAC ou expert-comptable"
}, {
  id: "charges_cx",
  l: "Charges connexes (forfaitaire 20%)",
  poste: "Charges connexes",
  sub: "Forfaitaire",
  ex: "Frais de structure, max 20%",
  plafond: 0.20
}];

// --- DNSH : 6 objectifs de la Taxonomie UE ---
// Source: CdC AAP ADEME 2026, Annexe 1 (art. 17 règlement 2020/852)
const DNSH_AXES = [{
  id: "attenuation",
  l: "Atténuation du changement climatique",
  icon: "🌡️",
  auto: true,
  template: "Le projet réduit les émissions de {co2} tCO₂/an (−{pctCo2}% vs référence), contribuant directement à l'objectif OMI de −20% en 2030."
}, {
  id: "adaptation",
  l: "Adaptation au changement climatique",
  icon: "🌊",
  auto: false,
  template: "Les équipements installés sont conçus pour fonctionner dans les conditions climatiques projetées (hausse du niveau marin, tempêtes plus fréquentes). Durée de vie de conception ≥ 15 ans."
}, {
  id: "eau",
  l: "Utilisation durable de l'eau et ressources marines",
  icon: "💧",
  auto: false,
  template: "Le navire respecte la Convention BWM (gestion des eaux de ballast). Aucun rejet polluant additionnel. Peintures antifouling conformes Convention AFS 2001."
}, {
  id: "circulaire",
  l: "Économie circulaire",
  icon: "♻️",
  auto: false,
  template: "Les batteries LFP sont recyclables à 95% (filière SNAM/Eramet). Possibilité de seconde vie en stockage stationnaire (> 70% capacité résiduelle)."
}, {
  id: "pollution",
  l: "Prévention et réduction de la pollution",
  icon: "🏭",
  auto: true,
  template: "Réduction de {sox} t SOx/an, {nox} t NOx/an et {pm} t PM/an par rapport au scénario de référence."
}, {
  id: "biodiversite",
  l: "Protection de la biodiversité",
  icon: "🐟",
  auto: false,
  template: "La propulsion électrique réduit significativement le bruit sous-marin (< 160 dB re 1 μPa RMS, ref. DNV Silent Class). Antifouling sans biocides toxiques."
}];

// --- Base de cas de référence sourcés ---
// Algorithme matchCases() : score de pertinence 0-100% sur 7 critères
const CASE_DB = [{
  id: "ampere",
  n: "MF Ampere",
  co: "NO",
  yr: 2015,
  vt: ["bac", "ferry"],
  tr: ["full_elec"],
  loa: 80,
  batt: 1000,
  rot: 34,
  nm: 3.2,
  retro: false,
  co2: -570,
  nox: -15,
  s: "Norled 2025; Siemens Energy; EAFO",
  d: "80m alu catamaran, 120 véh./360 pax, Lavik-Oppedal. 1 MWh Corvus. Réduction 95% GES. > 100 000 traversées."
}, {
  id: "ellen",
  n: "E-ferry Ellen",
  co: "DK",
  yr: 2019,
  vt: ["ferry"],
  tr: ["full_elec"],
  loa: 60,
  batt: 4300,
  rot: 7,
  nm: 22,
  retro: false,
  co2: -2520,
  nox: -14.3,
  s: "EU Horizon 2020 #636027; HKF Marineconsult 2022",
  d: "60m, 31 voi./198 pax, Ærø-Fynshav (22 NM). 4,3 MWh Leclanchè. −2 520 tCO₂/an."
}, {
  id: "lamelec",
  n: "LAMELEC",
  co: "FR",
  yr: 2026,
  vt: ["lamanage"],
  tr: ["full_elec"],
  loa: 15,
  batt: 500,
  rot: 15,
  nm: 0,
  retro: false,
  co2: -150,
  nox: 0,
  s: "GASPE/OCEA/VEBRAT; Bpifrance PULSE; CMA CGM Fonds décarb.",
  d: "Premier lamaneur 100% électrique français. OCEA (Les Sables). Loire estuaire."
}, {
  id: "volta1",
  n: "Volta 1 (Anvers)",
  co: "BE",
  yr: 2024,
  vt: ["lamanage"],
  tr: ["full_elec"],
  loa: 28,
  batt: 2782,
  rot: 0,
  nm: 0,
  retro: false,
  co2: -400,
  nox: 0,
  s: "Port of Antwerp-Bruges 2024; Damen Shipyards",
  d: "Remorqueur RSD LTO 2 782 kWh, 70 t traction. Premier remorqueur électrique européen."
}, {
  id: "basto_hybrid",
  n: "Bastø Fosen (hybrides)",
  co: "NO",
  yr: 2021,
  vt: ["ferry"],
  tr: ["hybride"],
  loa: 139,
  batt: 4300,
  rot: 0,
  nm: 5.4,
  retro: true,
  co2: -1500,
  nox: 0,
  s: "Bastø Fosen / Siemens 2022; Bellona",
  d: "2 ferries diesel→hybride + 1 newbuild, Moss-Horten. −75% CO₂, −6 M litres diesel/an."
}, {
  id: "seachange",
  n: "Sea Change",
  co: "US",
  yr: 2024,
  vt: ["navette"],
  tr: ["h2"],
  loa: 21,
  batt: 0,
  rot: 0,
  nm: 0,
  retro: false,
  co2: 0,
  nox: 0,
  s: "ScienceDirect 2025 (IJHE); WETA/CARB",
  d: "75 pax, pile H₂ haute pression. Premier ferry H₂ commercial au monde. SF Bay."
}, {
  id: "dublin_hvo",
  n: "Dublin Port HVO Trial",
  co: "IE",
  yr: 2023,
  vt: ["navette", "fret"],
  tr: ["hvo"],
  loa: 15,
  batt: 0,
  rot: 0,
  nm: 0,
  retro: false,
  co2: -85,
  nox: 0,
  s: "Dublin Port Company 2023; Certa",
  d: "4 pilotines, 100% HVO drop-in. Réduction 80-90% CO₂ sans modification moteur."
}, {
  id: "medstraum",
  n: "MS Medstraum",
  co: "NO",
  yr: 2022,
  vt: ["navette"],
  tr: ["full_elec"],
  loa: 31,
  batt: 1500,
  rot: 0,
  nm: 0,
  retro: false,
  co2: -500,
  nox: 0,
  s: "EU TrAM Project; Kolombus; EAFO",
  d: "31m catamaran, 150 pax, 23 nœuds. Premier ferry rapide 100% électrique."
}, {
  id: "lca_2025",
  n: "Étude LCA ferries électriques",
  co: "INT",
  yr: 2025,
  vt: ["bac", "ferry", "navette"],
  tr: ["full_elec", "hybride"],
  loa: 0,
  batt: 0,
  rot: 0,
  nm: 0,
  retro: false,
  co2: -90,
  nox: 0,
  s: "ScienceDirect, Applied Energy 2025 (peer-reviewed)",
  d: "LCA complète : −90% GES, −75% acidification, −70% PM. CMA ~100 €/tCO₂. LFP préférable."
}, {
  id: "shiftr",
  n: "SHIFTR (Norled)",
  co: "NO",
  yr: 2026,
  vt: ["navette"],
  tr: ["full_elec"],
  loa: 0,
  batt: 0,
  rot: 0,
  nm: 0,
  retro: true,
  co2: -3000,
  nox: 0,
  s: "Business Norway 2024; Norled; DNV",
  d: "Swap batterie autonome. Retrofit Oslofjord : −1 M litres diesel, −3 000 tCO₂/an."
}];
function matchCases(proj) {
  if (!proj) return [];
  const v = proj.v;
  const fuelMix = proj.trajs?.[1]?.fuelMix || {};
  const techs = proj.trajs?.[1]?.techs || {};
  const trTypes = [];
  if (fuelMix.elec > 50 && !fuelMix.mdo) trTypes.push("full_elec");else if (fuelMix.elec > 0) trTypes.push("hybride");
  if (fuelMix.hvo > 0) trTypes.push("hvo");
  if (fuelMix.fame > 0) trTypes.push("fame");
  if (fuelMix.h2 > 0) trTypes.push("h2");
  if (techs.fullelec?.a) trTypes.push("full_elec");
  if (techs.hybride?.a) trTypes.push("hybride");
  return CASE_DB.map(c => {
    let score = 0;
    if (c.vt.includes(v.type)) score += 30;else if (c.vt.some(t => ["bac", "ferry"].includes(t)) && ["bac", "ferry"].includes(v.type)) score += 15;
    const trMatch = c.tr.filter(t => trTypes.includes(t));
    score += trMatch.length * 25;
    if (c.loa > 0 && v.loa > 0) {
      const r = Math.abs(c.loa - v.loa) / Math.max(c.loa, v.loa);
      score += Math.round((1 - r) * 15);
    }
    if (c.batt > 0) {
      const bd = dimBatt(v);
      if (bd.kWh > 0) {
        const r = Math.abs(c.batt - bd.kWh) / Math.max(c.batt, bd.kWh);
        score += Math.round((1 - r) * 10);
      }
    }
    if (c.rot > 0 && v.rD > 0) {
      const r = Math.abs(c.rot - v.rD) / Math.max(c.rot, v.rD);
      score += Math.round((1 - r) * 8);
    }
    return {
      ...c,
      score
    };
  }).filter(c => c.score > 15).sort((a, b) => b.score - a.score).slice(0, 5);
}

// --- Deadline de l'AAP ---
const AAP_DEADLINE = new Date("2026-07-06T23:59:00");
const AAP_PREDEPOT_DEADLINE = new Date("2026-06-22T23:59:00"); // 2 semaines avant clôture

// ============================================================================
// SECTION 2 : MOTEURS DE CALCUL
// ============================================================================

// --- Formatage ---
const fmt = (n, d = 0) => typeof n === "number" ? n.toLocaleString("fr-FR", {
  maximumFractionDigits: d
}) : "—";
const fK = n => fmt(Math.round(n)) + " k€";
const fPct = n => (n * 100).toFixed(1) + "%";

// --- Jours restants avant la deadline ---
function joursRestants() {
  const now = new Date();
  const diff = AAP_DEADLINE - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// --- Prix carburant avec référencement utilisateur ---
function getFuelPrice(proj, fid) {
  const ref = proj.ref?.fuels?.find(x => x.id === fid);
  return ref ? ref.price : DEF_FUELS.find(x => x.id === fid)?.price || 850;
}
function getFuelCO2(proj, fid) {
  const ref = proj.ref?.fuels?.find(x => x.id === fid);
  return ref ? ref.co2 : DEF_FUELS.find(x => x.id === fid)?.co2 || 3.206;
}

/**
 * dimBatt — Dimensionnement batteries
 * Audité scientifiquement (janvier 2026, 22 cas de référence)
 * 
 * Méthode : max(contrainte énergie, contrainte puissance)
 * - Énergie : eTrip / 0.80 (SoC 10-90%, DNV Pt.6 Ch.2 Sec.1)
 * - Puissance : pPeak / 2C (Corvus Orca ESS, décharge continue 2C)
 * - Chargeur : eTrip / (qT/60) × 1.1 (ABB Marine 2022)
 * - Coût : 350 €/kWh installé (BNEF 2024), 200 €/kW chargeur
 * - Cycles : 5000 à 80% DoD (Preger et al. 2020, LFP)
 */
function dimBatt(v) {
  const pTr = (v.pTr || 60) / 100,
    pMa = (v.pMa || 20) / 100,
    pQu = (v.pQu || 20) / 100;
  const lf = pTr * 1.0 + pMa * Math.min(v.pPeak / v.pP, 1.5) + pQu * (v.pA / v.pP);
  const eTrip = v.pP * v.cDur / 60 * lf;
  const e_energy = eTrip / 0.80;
  const cRate = 2;
  const e_power = v.pPeak / cRate;
  const kWh = Math.max(e_energy, e_power);
  const c = e_power > e_energy ? "puissance" : "énergie";
  const cP = eTrip / (v.qT / 60) * 1.1;
  const dod = Math.min(0.80, eTrip / kWh);
  const eqCyclesAn = v.rD * v.opD * dod / 0.80;
  const lifeCycles = 5000;
  const lifeYrs = Math.max(3, Math.round(lifeCycles / Math.max(1, eqCyclesAn)));
  const costPerKwh = 350;
  const costPerKwCharger = 200;
  const gridConnect = cP > 2000 ? 500 : cP > 1000 ? 350 : cP > 500 ? 200 : cP > 200 ? 100 : 50;
  return {
    kWh: Math.round(kWh),
    constraint: c,
    chargePower: Math.round(cP),
    eTrip: Math.round(eTrip),
    loadFactor: Math.round(lf * 1000) / 1000,
    costBatt: Math.round(kWh * costPerKwh / 1000),
    costCharger: Math.round(cP * costPerKwCharger / 1000),
    gridConnect,
    eqCyclesAn: Math.round(eqCyclesAn),
    dod: Math.round(dod * 100),
    lifeCycles,
    lifeYrs,
    cRate,
    costPerKwh
  };
}

/**
 * compute — Moteur CCV (Coût de Cycle de Vie)
 * ISO 15686-5 adapté maritime
 * 
 * Pour chaque trajectoire : calcule CCV actualisé, émissions CO₂ cumulées,
 * en 3 scénarios (base, dégradé, favorable).
 */
function compute(proj) {
  const {
    v,
    p,
    trajs
  } = proj;
  const N = p.dur;
  const r = p.disc / 100;
  const fg = p.fpG / 100;
  const pTr = (v.pTr || 60) / 100,
    pMa = (v.pMa || 20) / 100,
    pQu = (v.pQu || 20) / 100;
  const loadFactor = pTr * 1.0 + pMa * Math.min(v.pPeak / v.pP, 1.5) + pQu * (v.pA / v.pP);
  const hFuel = v.fc * v.opD * (v.rD * v.cDur / 60) / 1000 * loadFactor;
  const battLife = dimBatt(v).lifeYrs;
  return trajs.map((tj, ti) => {
    const at = Object.entries(tj.techs || {}).filter(([, x]) => x?.a);
    const totI = (tj.iC || 0) + (tj.iE || 0) + (tj.iI || 0) + (tj.gridCost || 0);
    const contA = totI * p.cont / 100;
    const calc = cs => {
      let cC = 0,
        cCO2 = 0;
      const yrs = [];
      for (let t = 0; t < N; t++) {
        const yr = p.sy + t;
        const df = Math.pow(1 + r, t);
        const fp = getFuelPrice(proj, "mdo") * Math.pow(1 + fg, t);
        const mix = tj.fuelMix || {
          mdo: 100
        };
        const mixT = Object.values(mix).reduce((a, b) => a + b, 0) || 100;
        let wCO2 = 0,
          wCost = 0;
        Object.entries(mix).forEach(([fid, pct]) => {
          if (pct > 0) {
            const sh = pct / mixT;
            wCO2 += sh * (getFuelCO2(proj, fid) / 3.206);
            wCost += sh * (getFuelPrice(proj, fid) / 850);
          }
        });
        if (wCO2 === 0) {
          wCO2 = 1;
          wCost = 1;
        }
        let prd = 1;
        at.forEach(([tid, cfg]) => {
          const tech = TECHS.find(x => x.id === tid);
          if (tech) {
            const depY = (cfg.year || p.sy) - p.sy;
            if (t >= depY) {
              const g = cs === "deg" ? tech.gM * 0.7 : cs === "fav" ? Math.min(tech.gH, 1) : tech.gM;
              prd *= 1 - g;
            }
          }
        });
        const inv = t === 0 ? totI + contA : 0;
        const fC = hFuel * prd;
        const en = fC * wCost * fp / 1000;
        const ex = v.opex + (ti === 0 ? 0 : at.reduce((s, [tid]) => {
          const t2 = TECHS.find(x => x.id === tid);
          return s + (t2 ? t2.ox : 0);
        }, 0));
        const cr = v.crew;
        const insElec = Object.keys(mix).some(k => ["elec", "h2"].includes(k) && mix[k] > 50);
        const insHybrid = Object.keys(mix).some(k => k === "elec" && mix[k] > 10 && mix[k] <= 50);
        const insH2 = Object.keys(mix).some(k => k === "h2" && mix[k] > 10);
        const ins = v.ins + (ti === 0 ? 0 : insH2 ? v.ins * 0.5 : insElec ? v.ins * 0.35 : insHybrid ? v.ins * 0.2 : 0);
        const dd = t > 0 && t % v.ddC === 0 ? v.dd : 0;
        const bt = tj.iE > 0 && battLife > 0 && t > 0 && t % battLife === 0 ? tj.iE * 0.4 : 0;
        const decom = t === N - 1 && tj.iE > 0 ? tj.iE * 0.15 : 0;
        const tot = inv + ex + en + cr + ins + dd + bt + decom;
        const disc = tot / df;
        const co2 = fC * 3.206 * wCO2;
        cC += disc;
        cCO2 += co2;
        yrs.push({
          yr,
          inv,
          ex,
          en,
          cr,
          ins,
          dd: dd + bt + decom,
          tot,
          disc,
          co2,
          cC,
          cCO2
        });
      }
      const rvN = v.mktV * Math.max(0, 1 - N / (v.lifeR + 5)) * 0.7;
      const rvB = cs === "fav" ? (tj.iE || 0) * 0.1 : 0;
      return {
        ccv: cC - (rvN + rvB) / Math.pow(1 + r, N),
        co2: cCO2,
        rv: rvN + rvB,
        yrs
      };
    };
    return {
      name: tj.name,
      idx: ti,
      totI: totI + contA,
      gain: {
        m: 1 - at.reduce((p2, [tid]) => {
          const t2 = TECHS.find(x => x.id === tid);
          return p2 * (1 - (t2?.gM || 0));
        }, 1)
      },
      base: calc("base"),
      deg: calc("deg"),
      fav: calc("fav")
    };
  });
}

/**
 * classifyVessel — Classification ADEME du navire
 * Source: CdC p.10 (définitions RGEC art. 36 ter)
 *
 * - "emissionNulle" : 0% émissions CO₂ au tuyau d'échappement
 * - "propre" : ≥ 25% énergie zéro-CO₂ ou EEDI −10%
 * - "efficace" : plus efficace que le contrefactuel
 */
function classifyVessel(fuelMix) {
  if (!fuelMix) return "efficace";
  const mixT = Object.values(fuelMix).reduce((a, b) => a + b, 0) || 100;
  const zeroPct = Object.entries(fuelMix).filter(([fid]) => ["elec", "h2", "ops"].includes(fid)).reduce((s, [, pct]) => s + pct, 0) / mixT;
  if (zeroPct >= 0.99) return "emissionNulle";
  if (zeroPct >= 0.25) return "propre";
  return "efficace";
}

/**
 * computeAide — Calcul de l'aide ADEME
 * Source: CdC AAP 2026, Annexe 2 + Guide aides d'État
 *
 * aide = min(surcoût × taux_LDACEE, 6 000 000 €)
 * taux dépend de : classification navire, taille entreprise, zone AFR,
 * et existence d'un scénario contrefactuel crédible
 */
function computeAide(proj, surcout) {
  const {
    v
  } = proj;
  const cls = classifyVessel(proj.trajs?.[1]?.fuelMix);
  const size = v.entSize || "PE";
  const zone = v.zoneAFR || "hors";
  let taux = 0;
  let regime = "";
  if (cls === "emissionNulle") {
    taux = ADEME_RATES.navEmissionNulle["-"][size];
    regime = "Navire à émission nulle (Section 6.3, SA.111726)";
  } else if (cls === "propre") {
    taux = ADEME_RATES.navPropre["-"][size];
    regime = "Navire propre (Section 6.3, SA.111726)";
  } else {
    // Efficacité énergétique — taux dépend du contrefactuel
    const hasContref = proj.contrefactuel?.type && proj.contrefactuel?.type !== "aucun";
    if (hasContref) {
      taux = ADEME_RATES.amelioContrefactuel[zone]?.[size] || 30;
      regime = "Efficacité avec contrefactuel (Section 6.4, SA.111726)";
    } else {
      taux = ADEME_RATES.amelioSans[zone]?.[size] || 15;
      regime = "Efficacité sans contrefactuel — taux réduit (Section 6.4, SA.111726)";
    }
  }
  const aide = Math.min(surcout * taux / 100, 6000, surcout); // plafonné à 6M€ ET au surcoût
  return {
    taux,
    aide,
    regime,
    cls,
    plafond: 6000
  };
}

/**
 * computeScoring — Simulation de la notation ADEME (100 points)
 * Source: CdC AAP 2026, pp. 27-29
 *
 * Période de référence thématique 1 : 5 ans
 * Le score est indicatif — l'ADEME classe les projets entre eux
 */
function computeScoring(proj, res, aide) {
  if (!res || res.length < 2) return null;
  const ref = res[0]; // trajectoire actuelle (fossile)
  const alt = res[1]; // trajectoire décarbonée

  // Période de référence : 5 ans
  const refYears = Math.min(5, ref.base.yrs.length);
  const co2Ref = ref.base.yrs.slice(0, refYears).reduce((s, y) => s + y.co2, 0);
  const co2Alt = alt.base.yrs.slice(0, refYears).reduce((s, y) => s + y.co2, 0);
  const co2Evite = co2Ref - co2Alt; // en tonnes

  // 1. Efficacité environnementale (45 pts)
  // Sous-critère 1 (15 pts) : quantité absolue — on ne peut pas comparer aux autres projets,
  // mais on donne une estimation basée sur les ordres de grandeur typiques GASPE
  const typicalMaxCO2 = 5000; // tCO₂ évitées sur 5 ans pour un gros ferry full-elec
  const noteQuantite = Math.min(15, 15 * co2Evite / typicalMaxCO2);

  // Sous-critère 2 (30 pts) : gain relatif
  const gainPct = co2Ref > 0 ? 1 - co2Alt / co2Ref : 0;
  const noteGain = 30 * gainPct;
  const noteEnviron = noteQuantite + noteGain;

  // 2. Efficacité des aides publiques (25 pts)
  const aideTotale = aide || 0; // k€
  const ratioEuroParTonne = co2Evite > 0 ? aideTotale * 1000 / co2Evite : Infinity;
  let noteAide = 0;
  if (ratioEuroParTonne > 200) {
    noteAide = -5; // pénalité éliminatoire
  } else {
    const typicalBest = 30; // €/tCO₂ pour un excellent projet
    noteAide = Math.min(25, 25 * typicalBest / Math.max(1, ratioEuroParTonne));
  }

  // 3. Qualité technico-économique (30 pts) — estimation qualitative
  let noteTechEco = 0;
  // TRL (max 5 pts)
  const minTRL = Math.min(...Object.entries(proj.trajs?.[1]?.techs || {}).filter(([, x]) => x?.a).map(([tid]) => TECHS.find(t => t.id === tid)?.trl || 7));
  noteTechEco += minTRL >= 9 ? 5 : minTRL >= 8 ? 4 : 3;
  // Réduction hors-GES (max 5 pts)
  if (gainPct > 0.5) noteTechEco += 5;else if (gainPct > 0.2) noteTechEco += 3;else noteTechEco += 1;
  // Socle de base pour dossier GASPE structuré (10 pts)
  noteTechEco += 10;
  // Localisation FR (max 10 pts)
  noteTechEco += 10;
  const total = noteEnviron + noteAide + noteTechEco;
  return {
    total: Math.round(total * 10) / 10,
    noteEnviron: Math.round(noteEnviron * 10) / 10,
    noteAide: Math.round(noteAide * 10) / 10,
    noteTechEco: Math.round(noteTechEco * 10) / 10,
    co2Evite: Math.round(co2Evite),
    co2Ref: Math.round(co2Ref),
    co2Alt: Math.round(co2Alt),
    gainPct: Math.round(gainPct * 1000) / 10,
    ratioEuroParTonne: Math.round(ratioEuroParTonne),
    refYears
  };
}

// ============================================================================
// SECTION 3 : COMPOSANTS UI RÉUTILISABLES
// ============================================================================

// --- Tooltip informatif ---
const Tip = ({
  text
}) => {
  const [o, setO] = useState(false);
  return /*#__PURE__*/React.createElement("span", {
    className: "relative inline-block ml-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.preventDefault();
      e.stopPropagation();
      setO(!o);
    },
    className: "inline-flex items-center justify-center rounded-full text-white font-bold",
    style: {
      width: 16,
      height: 16,
      fontSize: 9,
      backgroundColor: T,
      cursor: "pointer"
    }
  }, "i"), o && /*#__PURE__*/React.createElement("div", {
    className: "absolute z-50 bottom-6 left-0 p-3 rounded-lg text-xs leading-relaxed",
    style: {
      width: 280,
      background: D,
      color: "#e8ecef",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setO(false);
    },
    className: "absolute top-1 right-2 text-xs",
    style: {
      color: "#888"
    }
  }, "\u2715"), text));
};

// --- Input numérique ---
const In = ({
  l,
  v,
  onChange: oc,
  t = "number",
  u,
  n,
  min,
  h
}) => /*#__PURE__*/React.createElement("div", {
  className: "mb-2"
}, /*#__PURE__*/React.createElement("label", {
  className: "block text-xs font-semibold mb-0.5",
  style: {
    color: D
  }
}, l, h && /*#__PURE__*/React.createElement(Tip, {
  text: h
})), /*#__PURE__*/React.createElement("div", {
  className: "flex items-center gap-1"
}, /*#__PURE__*/React.createElement("input", {
  type: t,
  value: v,
  min: min || 0,
  onChange: e => oc(t === "number" ? Math.max(min || 0, parseFloat(e.target.value) || 0) : e.target.value),
  className: "border rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2",
  style: {
    borderColor: "#ddd",
    outlineColor: T
  }
}), u && /*#__PURE__*/React.createElement("span", {
  className: "text-xs shrink-0",
  style: {
    color: "#aaa"
  }
}, u)), n && /*#__PURE__*/React.createElement("p", {
  className: "text-xs mt-0.5",
  style: {
    color: "#bbb"
  }
}, n));

// --- Select ---
const Se = ({
  l,
  v,
  onChange: oc,
  opts,
  h
}) => /*#__PURE__*/React.createElement("div", {
  className: "mb-2"
}, /*#__PURE__*/React.createElement("label", {
  className: "block text-xs font-semibold mb-0.5",
  style: {
    color: D
  }
}, l, h && /*#__PURE__*/React.createElement(Tip, {
  text: h
})), /*#__PURE__*/React.createElement("select", {
  value: v,
  onChange: e => oc(e.target.value),
  className: "border rounded px-2 py-1.5 text-sm w-full",
  style: {
    borderColor: "#ddd"
  }
}, opts.map(o => /*#__PURE__*/React.createElement("option", {
  key: o.v,
  value: o.v
}, o.l))));

// --- Card avec bordure accent ---
const Cd = ({
  title: tl,
  children: ch,
  accent: ac
}) => /*#__PURE__*/React.createElement("div", {
  className: "rounded-xl border p-4 mb-3",
  style: {
    borderColor: ac || "#e5e7eb",
    background: "white",
    borderLeftWidth: ac ? 3 : 1
  }
}, tl && /*#__PURE__*/React.createElement("h3", {
  className: "font-bold text-sm mb-2",
  style: {
    color: D
  }
}, tl), ch);

// --- Stat affichée ---
const St = ({
  l,
  v,
  c = D
}) => /*#__PURE__*/React.createElement("div", {
  className: "text-center p-2"
}, /*#__PURE__*/React.createElement("div", {
  className: "text-lg font-bold",
  style: {
    color: c
  }
}, v), /*#__PURE__*/React.createElement("div", {
  className: "text-xs",
  style: {
    color: "#999"
  }
}, l));

// --- Bannière deadline ---
const DeadlineBanner = () => {
  const j = joursRestants();
  const jpd = Math.max(0, Math.ceil((AAP_PREDEPOT_DEADLINE - new Date()) / (1000 * 60 * 60 * 24)));
  const urgent = j < 30;
  return /*#__PURE__*/React.createElement("div", {
    className: "text-center py-2 px-4 text-sm font-bold",
    style: {
      background: urgent ? AC : T,
      color: "white"
    }
  }, "\u23F1\uFE0F AAP ADEME 2026 \u2014 ", j > 0 ? `J-${j} avant clôture (6 juillet 2026)` : "AAP CLÔTURÉ", jpd > 0 && jpd < j && /*#__PURE__*/React.createElement("span", {
    className: "ml-3 text-xs font-normal opacity-80"
  }, "| Pr\xE9-d\xE9p\xF4t : J-", jpd));
};

// --- Barre de progression 7 étapes ---
const STEPS = [{
  n: 1,
  l: "Mon navire",
  icon: "⚓"
}, {
  n: 2,
  l: "Mon projet",
  icon: "🔋"
}, {
  n: 3,
  l: "Contrefactuel",
  icon: "⚖️"
}, {
  n: 4,
  l: "Gains environnementaux",
  icon: "🌿"
}, {
  n: 5,
  l: "Budget & dépenses",
  icon: "💰"
}, {
  n: 6,
  l: "Calcul de l'aide",
  icon: "📊"
}, {
  n: 7,
  l: "Mon dossier",
  icon: "📄"
}];
const StepBar = ({
  step,
  setStep,
  maxStep
}) => /*#__PURE__*/React.createElement("div", {
  className: "flex items-center gap-0.5 px-2 py-3 overflow-x-auto",
  style: {
    background: "#f8f9fb"
  }
}, STEPS.map(s => {
  const active = s.n === step;
  const done = s.n < step;
  const locked = s.n > maxStep;
  return /*#__PURE__*/React.createElement("button", {
    key: s.n,
    onClick: () => !locked && setStep(s.n),
    className: "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
    style: {
      background: active ? T : done ? GR + "20" : "transparent",
      color: active ? "white" : done ? GR : locked ? "#ccc" : "#666",
      cursor: locked ? "not-allowed" : "pointer",
      border: active ? "none" : "1px solid " + (done ? GR + "40" : "#e5e7eb")
    }
  }, /*#__PURE__*/React.createElement("span", null, done ? "✓" : s.icon), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, s.l));
}));

// ============================================================================
// SECTION 4 : APPLICATION PRINCIPALE — 7 ÉTAPES GUIDÉES
// ============================================================================

/**
 * État initial d'un projet ADEME
 */
function defProjet() {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: "Nouveau projet ADEME",
    upd: new Date().toISOString(),
    thematique: 1,
    // 1 ou 2
    v: {
      type: "bac",
      name: "",
      entSize: "PE",
      zoneAFR: "hors",
      ...VT[0].d
    },
    p: {
      sy: 2026,
      dur: 15,
      disc: 5,
      cont: 12,
      fpG: 4
    },
    ref: {
      fuels: DEF_FUELS.map(f => ({
        id: f.id,
        price: f.price,
        co2: f.co2
      }))
    },
    trajs: [{
      name: "Scénario fossile (référence)",
      fuelMix: {
        mdo: 100
      },
      techs: {},
      iC: 0,
      iE: 0,
      iI: 0,
      gridCost: 0
    }, {
      name: "Projet décarbonation",
      fuelMix: {
        elec: 100
      },
      techs: {},
      iC: 0,
      iE: 0,
      iI: 0,
      gridCost: 0
    }],
    contrefactuel: {
      type: "maintien",
      coutEntretien: 0
    },
    budget: ADEME_EXPENSE_CATS.map(c => ({
      id: c.id,
      montant: 0
    })),
    dnsh: DNSH_AXES.map(a => ({
      id: a.id,
      text: a.template,
      ok: true
    }))
  };
}

// --- Persistance localStorage multi-projet ---
const SK_LIST = "ademe2026_list";
function ldList() {
  try {
    const r = localStorage.getItem(SK_LIST);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}
function svList(list) {
  try {
    localStorage.setItem(SK_LIST, JSON.stringify(list));
  } catch {/* noop */}
}
function ldProj(id) {
  if (!id) return null;
  try {
    const r = localStorage.getItem("ademe2026:" + id);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}
function svProj(p) {
  try {
    p.upd = new Date().toISOString();
    localStorage.setItem("ademe2026:" + p.id, JSON.stringify(p));
    const list = ldList();
    const entry = {
      id: p.id,
      name: p.name,
      upd: p.upd,
      vType: p.v?.type,
      vName: p.v?.name
    };
    const idx = list.findIndex(x => x.id === p.id);
    if (idx >= 0) list[idx] = entry;else list.push(entry);
    svList(list);
  } catch {/* noop */}
}
function rmProj(id) {
  try {
    localStorage.removeItem("ademe2026:" + id);
    svList(ldList().filter(x => x.id !== id));
  } catch {/* noop */}
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

function App() {
  const [projList, setProjList] = useState([]);
  const [proj, setProj] = useState(null);
  const [step, setStep] = useState(0); // 0 = accueil, 1-7 = étapes
  const [maxStep, setMaxStep] = useState(1);
  const [saved, setSaved] = useState(false);

  // Charger la liste des projets au montage
  useEffect(() => {
    setProjList(ldList());
  }, []);

  // Sauvegarder à chaque modification
  const upd = useCallback(fn => {
    setProj(prev => {
      const next = typeof fn === "function" ? fn(prev) : {
        ...prev,
        ...fn
      };
      svProj(next);
      setProjList(ldList());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      return next;
    });
  }, []);
  const uV = useCallback((k, val) => upd(p => ({
    ...p,
    v: {
      ...p.v,
      [k]: val
    }
  })), [upd]);
  const uP = useCallback((k, val) => upd(p => ({
    ...p,
    p: {
      ...p.p,
      [k]: val
    }
  })), [upd]);

  // Résultats CCV (mémoïsés)
  const res = useMemo(() => proj ? compute(proj) : null, [proj]);
  const batt = useMemo(() => proj ? dimBatt(proj.v) : null, [proj]);

  // Avancer d'une étape
  const nextStep = () => {
    const ns = Math.min(step + 1, 7);
    setStep(ns);
    setMaxStep(m => Math.max(m, ns));
  };
  const prevStep = () => setStep(Math.max(1, step - 1));

  // --- Ouvrir un projet existant ---
  const openProj = id => {
    const p = ldProj(id);
    if (p) {
      setProj(p);
      setStep(1);
      setMaxStep(7);
    }
  };

  // --- Nouveau projet ---
  const newProj = () => {
    const p = defProjet();
    svProj(p);
    setProj(p);
    setProjList(ldList());
    setStep(1);
    setMaxStep(1);
  };

  // --- Supprimer un projet ---
  const deleteProj = id => {
    if (confirm("Supprimer ce projet ? Cette action est irréversible.")) {
      rmProj(id);
      setProjList(ldList());
      if (proj && proj.id === id) {
        setProj(null);
        setStep(0);
      }
    }
  };

  // --- Retour à la liste ---
  const backToList = () => {
    setProj(null);
    setStep(0);
    setProjList(ldList());
  };

  // ========================
  // ÉCRAN D'ACCUEIL — Liste des projets
  // ========================
  if (step === 0 || !proj) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'DM Sans', system-ui, sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a1628 0%, #1B3A4B 50%, #1B9AAA 100%)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col items-center justify-center min-h-screen px-4"
    }, /*#__PURE__*/React.createElement("img", {
      src: GASPE_LOGO,
      alt: "GASPE",
      style: {
        height: 48,
        marginBottom: 24
      }
    }), /*#__PURE__*/React.createElement("h1", {
      className: "text-2xl font-bold text-white text-center mb-2"
    }, "Simulateur AAP ADEME 2026"), /*#__PURE__*/React.createElement("p", {
      className: "text-center text-sm mb-1",
      style: {
        color: "#a8d8e0"
      }
    }, "D\xE9carbonation du transport et des services maritimes"), /*#__PURE__*/React.createElement("p", {
      className: "text-center text-xs mb-6",
      style: {
        color: "#7ab8c4"
      }
    }, "70 M\u20AC \u2014 Cl\xF4ture le 6 juillet 2026 \u2014 J-", joursRestants()), /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl p-6 w-full max-w-md",
      style: {
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)"
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-center mb-4",
      style: {
        color: "#555"
      }
    }, "Construisez votre pr\xE9-dossier ADEME en 7 \xE9tapes guid\xE9es. 30 minutes pour un dossier structur\xE9, chiffr\xE9 et sourc\xE9."), /*#__PURE__*/React.createElement("a", {
      href: "https://www.b2match.com/e/aap-decarbonation-maritime/sign-up",
      target: "_blank",
      rel: "noopener",
      className: "block w-full mb-4 p-3 rounded-xl text-xs",
      style: {
        background: PU + "15",
        border: "1px solid " + PU + "40",
        textDecoration: "none",
        color: D
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18
      }
    }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-bold",
      style: {
        color: PU
      }
    }, "Webinaire ADEME \u2014 21 avril 2026"), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#666"
      }
    }, "P\xF4le Mer Bretagne Atlantique \u2022 Pr\xE9sentation de l'AAP"), /*#__PURE__*/React.createElement("div", {
      className: "font-bold mt-1",
      style: {
        color: PU
      }
    }, "\u2192 S'inscrire")))), projList.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "mb-4"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs font-bold mb-2",
      style: {
        color: D
      }
    }, "Mes projets (", projList.length, ")"), projList.sort((a, b) => (b.upd || "").localeCompare(a.upd || "")).map(pr => /*#__PURE__*/React.createElement("div", {
      key: pr.id,
      className: "flex items-center gap-2 p-2 rounded-lg mb-1",
      style: {
        background: "#f8f9fb",
        border: "1px solid #e5e7eb"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => openProj(pr.id),
      className: "flex-1 text-left",
      style: {
        background: "none",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-medium",
      style: {
        color: D
      }
    }, pr.name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#999"
      }
    }, pr.vName || VT.find(x => x.id === pr.vType)?.l || "—", " \u2022 ", pr.upd ? new Date(pr.upd).toLocaleDateString("fr-FR") : "")), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteProj(pr.id),
      className: "text-xs px-2 py-1 rounded",
      style: {
        color: AC,
        background: AC + "10",
        cursor: "pointer"
      }
    }, "\u2715")))), /*#__PURE__*/React.createElement("button", {
      onClick: newProj,
      className: "w-full py-3 rounded-xl text-sm font-bold mb-4",
      style: {
        background: T,
        color: "white"
      }
    }, "\u2728 ", projList.length > 0 ? "Nouveau projet" : "Démarrer mon dossier ADEME"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-center space-y-1",
      style: {
        color: "#999"
      }
    }, /*#__PURE__*/React.createElement("p", null, "Th\xE9matique 1 : D\xE9carbonation directe des navires"), /*#__PURE__*/React.createElement("p", null, "Th\xE9matique 2 : Investissements industriels"), /*#__PURE__*/React.createElement("p", {
      className: "font-medium",
      style: {
        color: T
      }
    }, "Budget min. 300 k\u20AC (PME) \u2014 Aide max 6 M\u20AC"))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mt-6"
    }, /*#__PURE__*/React.createElement("img", {
      src: GASPE_A_COULEUR,
      alt: "",
      style: {
        height: 24,
        borderRadius: 4
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        color: "#5a8a94"
      }
    }, "Localement ancr\xE9es. Socialement engag\xE9es.")), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-center mt-1",
      style: {
        color: "#3d6a74"
      }
    }, "v1.1.0 \u2014 Propuls\xE9 par ", /*#__PURE__*/React.createElement("a", {
      href: "https://vaiata-dynamics.com/fr/",
      target: "_blank",
      rel: "noopener",
      style: {
        color: "#7ab8c4"
      }
    }, "VAIATA Dynamics"))));
  }

  // ========================
  // INTERFACE PRINCIPALE (7 ÉTAPES)
  // ========================

  // Calculs dérivés pour les étapes avancées
  const surcout = (() => {
    if (!res || res.length < 2) return 0;
    const budgetTotal = proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || 0;
    if (budgetTotal > 0) return budgetTotal;
    // Fallback : surcoût = investissement décarboné - investissement contrefactuel
    const invDecarb = res[1]?.totI || 0;
    const invContref = proj.contrefactuel?.coutEntretien || 0;
    return Math.max(0, invDecarb - invContref);
  })();
  const aide = computeAide(proj, surcout);
  const scoring = computeScoring(proj, res, aide.aide);

  // Émissions sur 5 ans pour le DNSH
  const emissionsRef5 = res?.[0]?.base?.yrs?.slice(0, 5) || [];
  const emissionsAlt5 = res?.[1]?.base?.yrs?.slice(0, 5) || [];
  const co2Ref5 = emissionsRef5.reduce((s, y) => s + y.co2, 0);
  const co2Alt5 = emissionsAlt5.reduce((s, y) => s + y.co2, 0);
  const hFuelBase = (() => {
    const v = proj.v;
    const pTr = (v.pTr || 60) / 100,
      pMa = (v.pMa || 20) / 100,
      pQu = (v.pQu || 20) / 100;
    const lf = pTr * 1.0 + pMa * Math.min(v.pPeak / v.pP, 1.5) + pQu * (v.pA / v.pP);
    return v.fc * v.opD * (v.rD * v.cDur / 60) / 1000 * lf;
  })();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'DM Sans', system-ui, sans-serif",
      minHeight: "100vh",
      background: "#f5f7f9"
    }
  }, /*#__PURE__*/React.createElement(DeadlineBanner, null), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-3 py-2",
    style: {
      backgroundColor: D,
      color: "white"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 min-w-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: backToList,
    className: "text-xs px-2 py-1 rounded",
    style: {
      background: "rgba(255,255,255,0.15)",
      color: "white",
      cursor: "pointer"
    }
  }, "\u2190 Projets"), /*#__PURE__*/React.createElement("img", {
    src: GASPE_LOGO,
    alt: "GASPE",
    style: {
      height: 20
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: proj.name || "",
    onChange: e => upd({
      name: e.target.value
    }),
    className: "font-bold text-sm truncate",
    style: {
      background: "transparent",
      color: "white",
      border: "none",
      outline: "none",
      width: "100%",
      minWidth: 0
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 shrink-0"
  }, saved && /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: GR
    }
  }, "\u2713 Sauv\xE9"))), /*#__PURE__*/React.createElement(StepBar, {
    step: step,
    setStep: setStep,
    maxStep: maxStep
  }), /*#__PURE__*/React.createElement("div", {
    className: "max-w-3xl mx-auto px-3 py-4"
  }, step === 1 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\u2693 \xC9tape 1 \u2014 Mon navire"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "D\xE9crivez le navire concern\xE9 par le projet ADEME. Les donn\xE9es pr\xE9-remplies sont ajustables."), /*#__PURE__*/React.createElement(Cd, {
    title: "Identification"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Nom du navire / liaison",
    v: proj.v.name,
    t: "text",
    onChange: v => uV("name", v)
  }), /*#__PURE__*/React.createElement(Se, {
    l: "Type de navire",
    v: proj.v.type,
    onChange: v => {
      uV("type", v);
      const vt = VT.find(x => x.id === v);
      if (vt) upd(p => ({
        ...p,
        v: {
          ...p.v,
          ...vt.d,
          type: v,
          name: p.v.name,
          entSize: p.v.entSize,
          zoneAFR: p.v.zoneAFR
        }
      }));
    },
    opts: VT.map(v => ({
      v: v.id,
      l: v.l
    }))
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Se, {
    l: "Taille de l'entreprise (UE)",
    v: proj.v.entSize,
    onChange: v => uV("entSize", v),
    opts: [{
      v: "PE",
      l: "Petite entreprise (< 50 pers., < 10 M€ CA)"
    }, {
      v: "ME",
      l: "Moyenne entreprise (< 250 pers., < 50 M€ CA)"
    }, {
      v: "GE",
      l: "Grande entreprise"
    }],
    h: "Au sens de l'annexe I du r\xE8glement UE 651/2014. Inclut les entreprises partenaires et li\xE9es."
  }), /*#__PURE__*/React.createElement(Se, {
    l: "R\xE9gion d'exploitation du navire",
    v: proj.v.region || "metropole_standard",
    onChange: v => {
      const reg = REGIONS.find(r => r.id === v);
      uV("region", v);
      uV("zoneAFR", reg?.zone || "hors");
    },
    opts: REGIONS.map(r => ({
      v: r.id,
      l: r.l + (r.zone === "zoneA" ? " (zone AFR a — taux majorés)" : r.zone === "zoneC" ? " (zone AFR c)" : "")
    })),
    h: "La zone AFR est d\xE9duite automatiquement de votre r\xE9gion. Outre-mer = zone a (taux major\xE9s). Source : D\xE9cret n\xB0 2022-968."
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "Caract\xE9ristiques techniques"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Longueur (LOA)",
    v: proj.v.loa,
    onChange: v => uV("loa", v),
    u: "m"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Jauge brute",
    v: proj.v.gt,
    onChange: v => uV("gt", v),
    u: "GT"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Puissance propulsion",
    v: proj.v.pP,
    onChange: v => uV("pP", v),
    u: "kW"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Puissance auxiliaire",
    v: proj.v.pA,
    onChange: v => uV("pA", v),
    u: "kW"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Puissance cr\xEAte",
    v: proj.v.pPeak,
    onChange: v => uV("pPeak", v),
    u: "kW"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Vitesse de service",
    v: proj.v.spd,
    onChange: v => uV("spd", v),
    u: "nds"
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "Profil op\xE9rationnel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Jours d'exploitation/an",
    v: proj.v.opD,
    onChange: v => uV("opD", v),
    u: "j/an"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Rotations/jour",
    v: proj.v.rD,
    onChange: v => uV("rD", v),
    u: "rot/j"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Dur\xE9e travers\xE9e",
    v: proj.v.cDur,
    onChange: v => uV("cDur", v),
    u: "min"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Temps \xE0 quai",
    v: proj.v.qT,
    onChange: v => uV("qT", v),
    u: "min"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Conso carburant",
    v: proj.v.fc,
    onChange: v => uV("fc", v),
    u: "L/h",
    h: "Consommation horaire en litres de MDO au r\xE9gime de transit nominal."
  }), /*#__PURE__*/React.createElement(In, {
    l: "DSP r\xE9siduelle",
    v: proj.v.dspR,
    onChange: v => uV("dspR", v),
    u: "ans"
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "% Transit",
    v: proj.v.pTr,
    onChange: v => uV("pTr", v),
    u: "%"
  }), /*#__PURE__*/React.createElement(In, {
    l: "% Man\u0153uvre",
    v: proj.v.pMa,
    onChange: v => uV("pMa", v),
    u: "%"
  }), /*#__PURE__*/React.createElement(In, {
    l: "% Quai",
    v: proj.v.pQu,
    onChange: v => uV("pQu", v),
    u: "%"
  }))), batt && (Object.keys(proj.trajs?.[1]?.fuelMix || {}).some(k => ["elec", "h2"].includes(k) && proj.trajs[1].fuelMix[k] > 0) || Object.keys(proj.trajs?.[1]?.techs || {}).some(k => ["hybride", "fullelec", "h2pac"].includes(k) && proj.trajs[1].techs[k]?.a)) && /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCCA Pr\xE9-dimensionnement batteries (automatique \u2014 affich\xE9 car projet \xE9lectrique)",
    accent: T
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-2"
  }, /*#__PURE__*/React.createElement(St, {
    l: "Capacit\xE9 install\xE9e",
    v: fmt(batt.kWh) + " kWh",
    c: T
  }), /*#__PURE__*/React.createElement(St, {
    l: "Chargeur",
    v: fmt(batt.chargePower) + " kW",
    c: T
  }), /*#__PURE__*/React.createElement(St, {
    l: "Dur\xE9e de vie pack",
    v: batt.lifeYrs + " ans",
    c: T
  }), /*#__PURE__*/React.createElement(St, {
    l: "Co\xFBt estim\xE9 total",
    v: fK(batt.costBatt + batt.costCharger + batt.gridConnect),
    c: T
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: "#999"
    }
  }, "Dimensionn\xE9 par contrainte de ", batt.constraint, ". SoC 10-90% (DNV Pt.6 Ch.2). C-rate 2C (Corvus Orca). 350 \u20AC/kWh (BNEF 2024).")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setMaxStep(m => Math.max(m, 2));
      nextStep();
    },
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Mon projet de d\xE9carbonation"))), step === 2 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83D\uDD0B \xC9tape 2 \u2014 Mon projet de d\xE9carbonation"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "S\xE9lectionnez les technologies et le mix \xE9nerg\xE9tique cible. Le simulateur v\xE9rifie la conformit\xE9 TRL \u2265 7."), /*#__PURE__*/React.createElement(Cd, {
    title: "Th\xE9matique ADEME"
  }, /*#__PURE__*/React.createElement(Se, {
    l: "Th\xE9matique du projet",
    v: proj.thematique,
    onChange: v => upd(p => ({
      ...p,
      thematique: parseInt(v)
    })),
    opts: [{
      v: 1,
      l: "Thématique 1 — Décarbonation directe du navire"
    }, {
      v: 2,
      l: "Thématique 2 — Investissement industriel"
    }]
  })), /*#__PURE__*/React.createElement(Cd, {
    title: "Technologies s\xE9lectionn\xE9es"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#888"
    }
  }, "Cochez les technologies pr\xE9vues. Le TRL doit \xEAtre \u2265 7 en d\xE9but de projet et 9 en fin."), TECHS.map(tech => {
    const active = proj.trajs?.[1]?.techs?.[tech.id]?.a;
    const trlOk = tech.trl >= 7;
    return /*#__PURE__*/React.createElement("div", {
      key: tech.id,
      className: "flex items-center gap-3 p-2 rounded-lg mb-1",
      style: {
        background: active ? T + "15" : "#fafafa",
        border: "1px solid " + (active ? T + "40" : "#eee")
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: !!active,
      onChange: e => upd(p => {
        const ts = {
          ...p.trajs[1].techs
        };
        if (e.target.checked) ts[tech.id] = {
          a: true,
          year: p.p.sy
        };else delete ts[tech.id];
        const trajs = [...p.trajs];
        trajs[1] = {
          ...trajs[1],
          techs: ts
        };
        return {
          ...p,
          trajs
        };
      })
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-medium",
      style: {
        color: D
      }
    }, tech.l), /*#__PURE__*/React.createElement("span", {
      className: "text-xs px-1.5 py-0.5 rounded font-bold",
      style: {
        background: trlOk ? GR + "20" : AC + "20",
        color: trlOk ? GR : AC,
        fontSize: 10
      }
    }, "TRL ", tech.trl), /*#__PURE__*/React.createElement("span", {
      className: "text-xs px-1.5 py-0.5 rounded",
      style: {
        background: "#f0f0f0",
        color: "#888",
        fontSize: 10
      }
    }, tech.cat)), /*#__PURE__*/React.createElement("div", {
      className: "text-xs mt-0.5",
      style: {
        color: "#999"
      }
    }, "Gain : ", (tech.gL * 100).toFixed(0), "\u2013", (tech.gH * 100).toFixed(0), "% | Retrofit : ", tech.retro, " | ", tech.n)));
  })), /*#__PURE__*/React.createElement(Cd, {
    title: "Mix \xE9nerg\xE9tique cible"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#888"
    }
  }, "R\xE9partition du mix apr\xE8s d\xE9carbonation (en %). Le total doit faire 100%."), DEF_FUELS.filter(f => !f.adv).map(fuel => /*#__PURE__*/React.createElement("div", {
    key: fuel.id,
    className: "flex items-center gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium w-40",
    style: {
      color: D
    }
  }, fuel.l), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0,
    max: 100,
    step: 5,
    value: proj.trajs?.[1]?.fuelMix?.[fuel.id] || 0,
    onChange: e => upd(p => {
      const mix = {
        ...p.trajs[1].fuelMix,
        [fuel.id]: parseInt(e.target.value)
      };
      const trajs = [...p.trajs];
      trajs[1] = {
        ...trajs[1],
        fuelMix: mix
      };
      return {
        ...p,
        trajs
      };
    }),
    className: "flex-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold w-12 text-right",
    style: {
      color: T
    }
  }, proj.trajs?.[1]?.fuelMix?.[fuel.id] || 0, "%"))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-2 p-2 rounded",
    style: {
      background: (() => {
        const tot = Object.values(proj.trajs?.[1]?.fuelMix || {}).reduce((a, b) => a + b, 0);
        return tot === 100 ? GR + "15" : AC + "15";
      })()
    }
  }, "Total : ", Object.values(proj.trajs?.[1]?.fuelMix || {}).reduce((a, b) => a + b, 0), "%", Object.values(proj.trajs?.[1]?.fuelMix || {}).reduce((a, b) => a + b, 0) !== 100 && " ⚠️ Doit faire 100%"), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 p-3 rounded-lg",
    style: {
      background: T + "10",
      border: "1px solid " + T + "30"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold",
    style: {
      color: D
    }
  }, "Classification ADEME : "), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold",
    style: {
      color: T
    }
  }, classifyVessel(proj.trajs?.[1]?.fuelMix) === "emissionNulle" ? "🟢 Navire à émission nulle" : classifyVessel(proj.trajs?.[1]?.fuelMix) === "propre" ? "🔵 Navire propre (≥ 25% zéro-CO₂)" : "🟡 Navire plus efficace (amélioration énergétique)"))), /*#__PURE__*/React.createElement(Cd, {
    title: "Investissements pr\xE9visionnels (estimation)"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Coque / structure",
    v: proj.trajs?.[1]?.iC || 0,
    onChange: v => upd(p => {
      const ts = [...p.trajs];
      ts[1] = {
        ...ts[1],
        iC: v
      };
      return {
        ...p,
        trajs: ts
      };
    }),
    u: "k\u20AC",
    h: "Co\xFBts li\xE9s \xE0 la coque, adaptation structurelle"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Syst\xE8me \xE9nerg\xE9tique (batteries, H\u2082)",
    v: proj.trajs?.[1]?.iE || (batt ? batt.costBatt : 0),
    onChange: v => upd(p => {
      const ts = [...p.trajs];
      ts[1] = {
        ...ts[1],
        iE: v
      };
      return {
        ...p,
        trajs: ts
      };
    }),
    u: "k\u20AC",
    h: "Batteries, piles H\u2082, convertisseurs"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Infrastructure charge",
    v: proj.trajs?.[1]?.iI || (batt ? batt.costCharger : 0),
    onChange: v => upd(p => {
      const ts = [...p.trajs];
      ts[1] = {
        ...ts[1],
        iI: v
      };
      return {
        ...p,
        trajs: ts
      };
    }),
    u: "k\u20AC",
    h: "Bornes, c\xE2bles, transformateurs"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Raccordement r\xE9seau",
    v: proj.trajs?.[1]?.gridCost || (batt ? batt.gridConnect : 0),
    onChange: v => upd(p => {
      const ts = [...p.trajs];
      ts[1] = {
        ...ts[1],
        gridCost: v
      };
      return {
        ...p,
        trajs: ts
      };
    }),
    u: "k\u20AC",
    h: "Raccordement ENEDIS / r\xE9seau"
  })), res && res[1] && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 text-xs font-bold",
    style: {
      color: D
    }
  }, "Investissement total estim\xE9 : ", fK(res[1].totI), " (hors contingences)")), (() => {
    const cases = matchCases(proj);
    if (cases.length === 0) return null;
    return /*#__PURE__*/React.createElement(Cd, {
      title: "📚 " + cases.length + " projet(s) de référence similaire(s)",
      accent: T
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs mb-2",
      style: {
        color: "#888"
      }
    }, "Projets sourc\xE9s correspondant \xE0 votre profil (matching dynamique sur type, technologie, taille, distance)."), cases.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.id,
      className: "p-2 rounded-lg mb-2 text-xs",
      style: {
        background: LB,
        borderLeft: "3px solid " + (c.score > 60 ? GR : c.score > 40 ? T : W)
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-start mb-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold",
      style: {
        color: D
      }
    }, c.n, " (", c.co, ", ", c.yr, ")"), /*#__PURE__*/React.createElement("span", {
      className: "px-1.5 py-0.5 rounded font-bold",
      style: {
        background: c.score > 60 ? GR : c.score > 40 ? T : W,
        color: "white",
        fontSize: 9
      }
    }, c.score, "%")), /*#__PURE__*/React.createElement("p", {
      style: {
        color: "#555"
      }
    }, c.d), c.co2 < 0 && /*#__PURE__*/React.createElement("p", {
      className: "mt-1",
      style: {
        color: GR
      }
    }, "Impact mesur\xE9 : ", Math.abs(c.co2), " tCO\u2082/an \xE9vit\xE9es"), /*#__PURE__*/React.createElement("p", {
      className: "mt-1",
      style: {
        color: "#999"
      }
    }, "Source : ", c.s))));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Sc\xE9nario contrefactuel"))), step === 3 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\u2696\uFE0F \xC9tape 3 \u2014 Sc\xE9nario contrefactuel"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "Le contrefactuel est ce que vous feriez SANS l'aide ADEME. Un contrefactuel cr\xE9dible double les taux d'aide. Source : CdC \xA71.4.1, sc\xE9narios a) \xE0 d)."), /*#__PURE__*/React.createElement(Cd, {
    title: "Type de sc\xE9nario contrefactuel",
    accent: W
  }, [["maintien", "Maintien du navire existant + entretien", "Scénario c) du CdC. Le plus fréquent pour les TPE/PME. Coûts éligibles = investissement décarboné − VAN entretien/réparation actualisée."], ["newbuild_fossile", "Remplacement par un navire diesel neuf", "Scénario a) du CdC. Coûts éligibles = surcoût du navire décarboné par rapport au navire fossile équivalent."], ["reporté", "Même investissement, mais plus tard", "Scénario b) du CdC. Coûts éligibles = différence entre investissement maintenant et VAN de l'investissement ultérieur."], ["aucun", "Pas de contrefactuel identifiable", "⚠️ Les taux d'aide sont divisés par 2. À éviter si possible."]].map(([id, label, desc]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => upd(p => ({
      ...p,
      contrefactuel: {
        ...p.contrefactuel,
        type: id
      }
    })),
    className: "w-full text-left p-3 rounded-lg mb-2 text-sm",
    style: {
      background: proj.contrefactuel?.type === id ? T + "15" : "#fafafa",
      border: "2px solid " + (proj.contrefactuel?.type === id ? T : "transparent")
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: D
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1",
    style: {
      color: "#888"
    }
  }, desc)))), proj.contrefactuel?.type === "maintien" && /*#__PURE__*/React.createElement(Cd, {
    title: "Co\xFBts d'entretien du sc\xE9nario fossile (sur la dur\xE9e du projet)"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Budget entretien / r\xE9paration annuel estim\xE9",
    v: proj.contrefactuel?.coutEntretien || 0,
    onChange: v => upd(p => ({
      ...p,
      contrefactuel: {
        ...p.contrefactuel,
        coutEntretien: v
      }
    })),
    u: "k\u20AC/an",
    h: "Co\xFBts d'entretien, r\xE9paration, modernisation que vous auriez engag\xE9s sans le projet.",
    n: "Estimation type : " + (proj.v.gt < 200 ? "30-80" : proj.v.gt < 1000 ? "80-200" : "200-500") + " k€/an (source : OPEX benchmarks Clarksons 2024, ajusté proximité). Cliquez pour modifier."
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: "#999"
    }
  }, "VAN entretien actualis\xE9e sur ", proj.p.dur, " ans \xE0 ", proj.p.disc, "% : ", fK((proj.contrefactuel?.coutEntretien || 0) * ((1 - Math.pow(1 + proj.p.disc / 100, -proj.p.dur)) / (proj.p.disc / 100))))), proj.contrefactuel?.type === "newbuild_fossile" && /*#__PURE__*/React.createElement(Cd, {
    title: "Co\xFBt du navire diesel de r\xE9f\xE9rence"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Prix d'un navire fossile \xE9quivalent",
    v: proj.contrefactuel?.coutNewbuild || 0,
    onChange: v => upd(p => ({
      ...p,
      contrefactuel: {
        ...p.contrefactuel,
        coutNewbuild: v
      }
    })),
    u: "k\u20AC",
    h: "Co\xFBt d'acquisition d'un navire neuf de m\xEAme cat\xE9gorie, conforme aux normes UE en vigueur."
  })), /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCCA Impact sur le taux d'aide",
    accent: proj.contrefactuel?.type === "aucun" ? AC : GR
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Avec contrefactuel cr\xE9dible"), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold",
    style: {
      color: GR
    }
  }, ADEME_RATES.amelioContrefactuel[proj.v.zoneAFR]?.[proj.v.entSize] || "—", "%")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Sans contrefactuel"), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold",
    style: {
      color: AC
    }
  }, ADEME_RATES.amelioSans[proj.v.zoneAFR]?.[proj.v.entSize] || "—", "%"))), proj.contrefactuel?.type === "aucun" && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 p-2 rounded text-xs font-bold",
    style: {
      background: AC + "15",
      color: AC
    }
  }, "\u26A0\uFE0F Sans contrefactuel, les taux d'aide sont divis\xE9s par 2. Identifiez un sc\xE9nario de r\xE9f\xE9rence cr\xE9dible.")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Gains environnementaux"))), step === 4 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83C\uDF3F \xC9tape 4 \u2014 Gains environnementaux"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "Grille d'impacts ADEME (Annexe 5) + DNSH (6 objectifs Taxonomie UE). P\xE9riode de r\xE9f\xE9rence : 5 ans."), scoring && /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCCA R\xE9sum\xE9 des gains sur 5 ans",
    accent: GR
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2"
  }, /*#__PURE__*/React.createElement(St, {
    l: "CO\u2082 \xE9vit\xE9 (5 ans)",
    v: fmt(scoring.co2Evite) + " t",
    c: GR
  }), /*#__PURE__*/React.createElement(St, {
    l: "Gain relatif",
    v: scoring.gainPct + "%",
    c: GR
  }), /*#__PURE__*/React.createElement(St, {
    l: "CO\u2082 r\xE9siduel (5 ans)",
    v: fmt(scoring.co2Alt) + " t",
    c: D
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "R\xE9ductions hors-GES (polluants atmosph\xE9riques)"
  }, (() => {
    const fuelMixAlt = proj.trajs?.[1]?.fuelMix || {};
    const mixT = Object.values(fuelMixAlt).reduce((a, b) => a + b, 0) || 100;
    let soxRef = hFuelBase * EMFACT.mdo.sox / 1e6;
    let noxRef = hFuelBase * EMFACT.mdo.nox / 1e6;
    let pmRef = hFuelBase * EMFACT.mdo.pm / 1e6;
    let soxAlt = 0,
      noxAlt = 0,
      pmAlt = 0;
    const gainTech = res?.[1]?.gain?.m || 0;
    Object.entries(fuelMixAlt).forEach(([fid, pct]) => {
      const ef = EMFACT[fid] || EMFACT.mdo;
      const sh = pct / mixT;
      soxAlt += hFuelBase * (1 - gainTech) * sh * ef.sox / 1e6;
      noxAlt += hFuelBase * (1 - gainTech) * sh * ef.nox / 1e6;
      pmAlt += hFuelBase * (1 - gainTech) * sh * ef.pm / 1e6;
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-3 gap-4 text-center"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#888"
      }
    }, "SOx"), /*#__PURE__*/React.createElement("div", {
      className: "text-lg font-bold",
      style: {
        color: GR
      }
    }, "\u2212", ((soxRef - soxAlt) * 5).toFixed(1), " t"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#aaa"
      }
    }, "sur 5 ans")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#888"
      }
    }, "NOx"), /*#__PURE__*/React.createElement("div", {
      className: "text-lg font-bold",
      style: {
        color: GR
      }
    }, "\u2212", ((noxRef - noxAlt) * 5).toFixed(1), " t"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#aaa"
      }
    }, "sur 5 ans")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#888"
      }
    }, "PM"), /*#__PURE__*/React.createElement("div", {
      className: "text-lg font-bold",
      style: {
        color: GR
      }
    }, "\u2212", ((pmRef - pmAlt) * 5).toFixed(2), " t"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#aaa"
      }
    }, "sur 5 ans")));
  })()), /*#__PURE__*/React.createElement(Cd, {
    title: "DNSH \u2014 Do No Significant Harm (Annexe 1)",
    accent: PU
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#888"
    }
  }, "Les projets causant un pr\xE9judice important \xE0 l'environnement sont exclus (art. 17, r\xE8glement 2020/852)."), DNSH_AXES.map((axis, i) => /*#__PURE__*/React.createElement("div", {
    key: axis.id,
    className: "p-3 rounded-lg mb-2",
    style: {
      background: "#fafafa",
      border: "1px solid #eee"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold",
    style: {
      color: D
    }
  }, axis.icon, " ", axis.l), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-1 text-xs"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: proj.dnsh?.[i]?.ok !== false,
    onChange: e => upd(p => {
      const dnsh = [...(p.dnsh || [])];
      dnsh[i] = {
        ...dnsh[i],
        ok: e.target.checked
      };
      return {
        ...p,
        dnsh
      };
    })
  }), "Conforme")), /*#__PURE__*/React.createElement("textarea", {
    className: "w-full text-xs p-2 border rounded",
    rows: 3,
    style: {
      borderColor: "#ddd"
    },
    value: proj.dnsh?.[i]?.text || (() => {
      let t = axis.template;
      if (scoring) {
        t = t.replace("{co2}", fmt(Math.abs(scoring.co2Evite / 5)));
        t = t.replace("{pctCo2}", scoring.gainPct);
      }
      const mixAlt = proj.trajs?.[1]?.fuelMix || {};
      const mixT = Object.values(mixAlt).reduce((a, b) => a + b, 0) || 100;
      const gTech = res?.[1]?.gain?.m || 0;
      const soxR = hFuelBase * EMFACT.mdo.sox / 1e6;
      let soxA = 0,
        noxA = 0,
        pmA = 0;
      Object.entries(mixAlt).forEach(([fid, pct]) => {
        const ef = EMFACT[fid] || EMFACT.mdo;
        const sh = pct / mixT;
        soxA += hFuelBase * (1 - gTech) * sh * ef.sox / 1e6;
        noxA += hFuelBase * (1 - gTech) * sh * ef.nox / 1e6;
        pmA += hFuelBase * (1 - gTech) * sh * ef.pm / 1e6;
      });
      t = t.replace("{sox}", (soxR - soxA).toFixed(1));
      t = t.replace("{nox}", (hFuelBase * EMFACT.mdo.nox / 1e6 - noxA).toFixed(1));
      t = t.replace("{pm}", (hFuelBase * EMFACT.mdo.pm / 1e6 - pmA).toFixed(2));
      return t;
    })(),
    onChange: e => upd(p => {
      const dnsh = [...(p.dnsh || [])];
      dnsh[i] = {
        ...dnsh[i],
        text: e.target.value
      };
      return {
        ...p,
        dnsh
      };
    })
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Budget & d\xE9penses"))), step === 5 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83D\uDCB0 \xC9tape 5 \u2014 Budget & d\xE9penses"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "Ventilation des d\xE9penses selon la nomenclature ADEME (Guide de cat\xE9gorisation 2026). Les montants sont en k\u20AC HTR (hors taxes r\xE9cup\xE9rables)."), /*#__PURE__*/React.createElement(Cd, {
    title: "Postes de d\xE9penses \xE9ligibles (montants en k\u20AC = milliers d'euros)"
  }, ADEME_EXPENSE_CATS.map((cat, i) => /*#__PURE__*/React.createElement("div", {
    key: cat.id,
    className: "flex items-center gap-3 mb-2 p-2 rounded",
    style: {
      background: i % 2 ? "#fafafa" : "white"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold",
    style: {
      color: D
    }
  }, cat.l), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, cat.poste, " \u2192 ", cat.sub, " \u2014 ", cat.ex)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    value: proj.budget?.[i]?.montant || 0,
    onChange: e => upd(p => {
      const budget = [...(p.budget || [])];
      budget[i] = {
        ...budget[i],
        montant: Math.max(0, parseFloat(e.target.value) || 0)
      };
      return {
        ...p,
        budget
      };
    }),
    className: "w-24 text-right border rounded px-2 py-1 text-sm",
    style: {
      borderColor: "#ddd"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: "#aaa"
    }
  }, "k\u20AC")))), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 p-3 rounded-lg",
    style: {
      background: D + "08",
      borderTop: "2px solid " + T
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-sm",
    style: {
      color: D
    }
  }, "TOTAL D\xC9PENSES DU PROJET"), /*#__PURE__*/React.createElement("span", {
    className: "text-lg font-bold",
    style: {
      color: T
    }
  }, fK(proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || 0))), (() => {
    const tot = proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || 0;
    const minBudget = proj.v.entSize === "GE" ? 1000 : 300;
    if (tot < minBudget) return /*#__PURE__*/React.createElement("div", {
      className: "text-xs mt-1 font-bold",
      style: {
        color: AC
      }
    }, "\u26A0\uFE0F Budget minimum : ", fK(minBudget), " (", proj.v.entSize === "GE" ? "grande entreprise" : "PME", ")");
    return null;
  })())), /*#__PURE__*/React.createElement(Cd, {
    title: "Surco\xFBt \xE9ligible = base de calcul de l'aide",
    accent: T
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2",
    style: {
      color: "#888"
    }
  }, "Le surco\xFBt est la diff\xE9rence entre le co\xFBt du projet d\xE9carbon\xE9 et le co\xFBt du sc\xE9nario contrefactuel."), /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: T
    }
  }, fK(surcout)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "Assiette \xE9ligible pour le calcul de l'aide"))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Calcul de l'aide"))), step === 6 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83D\uDCCA \xC9tape 6 \u2014 Calcul de l'aide & scoring"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "Estimation du montant d'aide et simulation de la note ADEME (indicative)."), /*#__PURE__*/React.createElement(Cd, {
    title: "Montant de l'aide estim\xE9",
    accent: GR
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-4 text-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Taux applicable"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: T
    }
  }, aide.taux, "%"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, aide.cls === "emissionNulle" ? "Émission nulle" : aide.cls === "propre" ? "Navire propre" : "Efficacité")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Surco\xFBt \xE9ligible"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: D
    }
  }, fK(surcout))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Aide estim\xE9e"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: GR
    }
  }, fK(aide.aide)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "Plafond : 6 000 k\u20AC"))), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 text-xs p-2 rounded",
    style: {
      background: LB
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "R\xE9gime : "), aide.regime)), scoring && /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83C\uDFAF Scoring ADEME simul\xE9 (indicatif)",
    accent: PU
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#888"
    }
  }, "Notation indicative bas\xE9e sur les crit\xE8res du CdC. Le classement r\xE9el d\xE9pend des autres projets d\xE9pos\xE9s."), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center p-3 rounded-lg",
    style: {
      background: D + "08"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: T
    }
  }, scoring.total.toFixed(0)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold",
    style: {
      color: D
    }
  }, "/ 100 pts")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-2 rounded-lg",
    style: {
      background: GR + "10"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold",
    style: {
      color: GR
    }
  }, scoring.noteEnviron.toFixed(0)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs"
  }, "Environnement"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#aaa"
    }
  }, "/ 45 pts")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-2 rounded-lg",
    style: {
      background: T + "10"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold",
    style: {
      color: scoring.noteAide < 0 ? AC : T
    }
  }, scoring.noteAide.toFixed(0)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs"
  }, "Efficacit\xE9 aide"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#aaa"
    }
  }, "/ 25 pts")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-2 rounded-lg",
    style: {
      background: PU + "10"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold",
    style: {
      color: PU
    }
  }, scoring.noteTechEco.toFixed(0)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs"
  }, "Qualit\xE9/R\xE9silience"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#aaa"
    }
  }, "/ 30 pts"))), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-lg",
    style: {
      background: scoring.ratioEuroParTonne > 200 ? AC + "15" : scoring.ratioEuroParTonne > 100 ? W + "15" : GR + "15"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold",
    style: {
      color: D
    }
  }, "Ratio \u20AC/tCO\u2082 \xE9vit\xE9e :"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-bold",
    style: {
      color: scoring.ratioEuroParTonne > 200 ? AC : scoring.ratioEuroParTonne > 100 ? W : GR
    }
  }, scoring.ratioEuroParTonne === Infinity ? "∞" : scoring.ratioEuroParTonne + " €/tCO₂")), scoring.ratioEuroParTonne > 200 && /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-1 font-bold",
    style: {
      color: AC
    }
  }, "\u26A0\uFE0F ALERTE : Au-dessus de 200 \u20AC/tCO\u2082, le projet re\xE7oit une note de -5 pts (quasi \xE9liminatoire)."))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Mon dossier"))), step === 7 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83D\uDCC4 \xC9tape 7 \u2014 Mon dossier"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "Votre pr\xE9-dossier est pr\xEAt. Exportez-le en HTML imprimable, puis compl\xE9tez les pi\xE8ces administratives sur la plateforme AGIR."), /*#__PURE__*/React.createElement(Cd, {
    title: "Fiche de synth\xE8se du projet",
    accent: T
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 text-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Navire :"), " ", proj.v.name || "(non nommé)", " \u2014 ", VT.find(x => x.id === proj.v.type)?.l), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "LOA :"), " ", proj.v.loa, "m | ", /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "GT :"), " ", proj.v.gt, " | ", /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Puissance :"), " ", proj.v.pP, " kW"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Classification ADEME :"), " ", aide.cls === "emissionNulle" ? "Navire à émission nulle" : aide.cls === "propre" ? "Navire propre" : "Navire plus efficace"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Taille :"), " ", proj.v.entSize, " | ", /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Zone AFR :"), " ", proj.v.zoneAFR), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Budget total :"), " ", fK(proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || res?.[1]?.totI || 0)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Aide estim\xE9e :"), " ", fK(aide.aide), " (", aide.taux, "%)"), scoring && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "CO\u2082 \xE9vit\xE9 (5 ans) :"), " ", fmt(scoring.co2Evite), " tonnes"), scoring && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Ratio :"), " ", scoring.ratioEuroParTonne, " \u20AC/tCO\u2082"))), /*#__PURE__*/React.createElement(Cd, {
    title: "\u2705 Checklist des pi\xE8ces \xE0 joindre"
  }, [["Annexe 1 — Présentation projet (pré-dépôt)", true], ["Annexe 2 — Fiche lauréat", false], ["Annexe 3.a — Descriptif détaillé du projet", true], ["Annexe 3.b — Descriptif du porteur", false], ["Annexe 4 — Base de données des coûts", true], ["Annexe 5 — Grille d'impacts + Empreinte projet", true], ["Annexe 6 — Éléments financiers (TRI, plan financement)", false], ["Annexe 7 — Attestation santé financière", false], ["KBIS de moins de 3 mois", false], ["3 dernières liasses fiscales", false], ["Devis / lettres d'intention fournisseurs", false], ["Contrat d'avitaillement ou LOI (si carburant alternatif)", false]].map(([label, auto], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex items-center gap-2 text-xs py-1"
  }, /*#__PURE__*/React.createElement("span", null, auto ? "✅" : "⬜"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: auto ? GR : "#666"
    }
  }, label), auto && /*#__PURE__*/React.createElement("span", {
    className: "text-xs px-1 rounded",
    style: {
      background: GR + "20",
      color: GR,
      fontSize: 9
    }
  }, "Pr\xE9-rempli")))), /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCC5 Calendrier"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-1 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between p-1.5 rounded",
    style: {
      background: LB
    }
  }, /*#__PURE__*/React.createElement("span", null, "Pr\xE9d\xE9p\xF4t (r\xE9union ADEME, 45 min)"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: T
    }
  }, "Avant le 22 juin 2026")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between p-1.5 rounded",
    style: {
      background: AC + "10"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "D\xE9p\xF4t final sur AGIR"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: AC
    }
  }, "6 juillet 2026 (23h59)")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between p-1.5 rounded"
  }, /*#__PURE__*/React.createElement("span", null, "D\xE9cision ADEME"), /*#__PURE__*/React.createElement("span", null, "~3 mois apr\xE8s cl\xF4ture")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between p-1.5 rounded"
  }, /*#__PURE__*/React.createElement("span", null, "Contractualisation"), /*#__PURE__*/React.createElement("span", null, "~6 mois apr\xE8s cl\xF4ture")))), /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCDD Texte de contexte pr\xE9-r\xE9dig\xE9 (\xE0 int\xE9grer dans l'Annexe 3.a)"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs p-3 rounded",
    style: {
      background: LB,
      lineHeight: 1.6
    }
  }, "Ce projet s'inscrit dans le cadre de l'article 301 de la loi n\xB0 2021-1104 du 22 ao\xFBt 2021 (Climat et R\xE9silience) et de la Feuille de route de d\xE9carbonation de la fili\xE8re maritime fran\xE7aise, pilot\xE9e par la DGAMPA et le CMF. Il contribue directement aux objectifs de la strat\xE9gie OMI r\xE9vis\xE9e de 2023 visant la neutralit\xE9 carbone du transport maritime d'ici 2050, avec un point de contr\xF4le interm\xE9diaire de \u221220% en 2030 par rapport \xE0 2008.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Ce projet correspond \xE0 une transition souveraine, ancr\xE9e localement : les prestataires techniques sont fran\xE7ais, le service rendu est un service public visible au quotidien par le contribuable, et les retomb\xE9es \xE9conomiques (emplois, maintenance, exploitation) b\xE9n\xE9ficient directement au territoire. La compagnie est captive en mati\xE8re d'opportunit\xE9s d'avitaillement \u2014 desserte locale depuis un port secondaire non \xE9quip\xE9 en combustible alternatif \u2014 ce qui rend le soutien public d'autant plus d\xE9terminant pour permettre la transition \xE9nerg\xE9tique.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Le porteur est membre du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau), qui repr\xE9sente 165 navires et 30 compagnies de transport maritime de proximit\xE9, dont 90% de TPE/PME.")), /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCD6 Sources et m\xE9thodologie de calcul"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-2",
    style: {
      color: "#555",
      lineHeight: 1.6
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold",
    style: {
      color: D
    }
  }, "Scoring ADEME (100 points) \u2014 CdC pp. 27-29"), /*#__PURE__*/React.createElement("p", null, "\u2022 Efficacit\xE9 environnementale (45 pts) : quantit\xE9 CO\u2082e \xE9vit\xE9e sur 5 ans (15 pts, compar\xE9e au meilleur projet, estimation GASPE : max ~5 000 tCO\u2082) + gain relatif en % vs sc\xE9nario de r\xE9f\xE9rence (30 pts, formule : 30 \xD7 (1 \u2212 tCO\u2082_projet / tCO\u2082_ref))"), /*#__PURE__*/React.createElement("p", null, "\u2022 Efficacit\xE9 des aides publiques (25 pts) : ratio \u20AC aide / tCO\u2082 \xE9vit\xE9e. Si ratio ", ">", " 200 \u20AC/tCO\u2082 \u2192 note de \u22125 (quasi \xE9liminatoire). Sinon : 25 \xD7 meilleur_ratio / ratio_projet"), /*#__PURE__*/React.createElement("p", null, "\u2022 Qualit\xE9 technico-\xE9conomique + r\xE9silience (30 pts) : TRL (5 pts), r\xE9ductions hors-GES (5 pts), montage dossier GASPE (10 pts), localisation FR/EEE (10 pts)"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold mt-3",
    style: {
      color: D
    }
  }, "Taux d'aide LDACEE \u2014 CdC Annexe 2, r\xE9gime SA.111726"), /*#__PURE__*/React.createElement("p", null, "\u2022 Navire \xE9mission nulle (\u226599% z\xE9ro-CO\u2082) : PE 60% / ME 50% / GE 30%"), /*#__PURE__*/React.createElement("p", null, "\u2022 Navire propre (\u226525% z\xE9ro-CO\u2082) : PE 50% / ME 40% / GE 20%"), /*#__PURE__*/React.createElement("p", null, "\u2022 Efficacit\xE9 avec contrefactuel : PE 50% / ME 40% / GE 30% (hors AFR), +5% zone c, +15% zone a"), /*#__PURE__*/React.createElement("p", null, "\u2022 Efficacit\xE9 sans contrefactuel : taux divis\xE9s par 2"), /*#__PURE__*/React.createElement("p", null, "\u2022 \xC9tudes/conseil : PE 80% / ME 70% / GE 60%"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold mt-3",
    style: {
      color: D
    }
  }, "Dimensionnement batteries (dimBatt)"), /*#__PURE__*/React.createElement("p", null, "\u2022 \xC9nergie par travers\xE9e = P_propulsion \xD7 dur\xE9e \xD7 facteur de charge / 0.80 (SoC 10-90%, DNV Pt.6 Ch.2 Sec.1)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Contrainte puissance = P_cr\xEAte / 2C (Corvus Orca ESS, d\xE9charge continue 2C max)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Chargeur = E_travers\xE9e / (temps_quai/60) \xD7 1.1 (ABB Marine 2022)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Co\xFBt batteries : 350 \u20AC/kWh install\xE9 (BNEF 2024), chargeur 200 \u20AC/kW"), /*#__PURE__*/React.createElement("p", null, "\u2022 Cycles LFP : 5 000 \xE0 80% DoD (Preger et al. 2020, J. Electrochem. Soc. 167)"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold mt-3",
    style: {
      color: D
    }
  }, "\xC9missions"), /*#__PURE__*/React.createElement("p", null, "\u2022 CO\u2082 : 3,206 kgCO\u2082/kg MDO (IMO MEPC.1/Circ.684)"), /*#__PURE__*/React.createElement("p", null, "\u2022 SOx/NOx/PM : IMO GHG Study 2020, ENTEC 2005"), /*#__PURE__*/React.createElement("p", null, "\u2022 Prix MDO : 850 \u20AC/t (EIA STEO mars 2026, post-crise Iran, Brent ~80-95 $/bbl)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Escalade carburant : 4%/an (risque g\xE9opolitique structurel post-fermeture Ormuz)"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold mt-3",
    style: {
      color: D
    }
  }, "Cadre r\xE9glementaire"), /*#__PURE__*/React.createElement("p", null, "\u2022 AAP ADEME 2026 : CdC publi\xE9 le 2 avril 2026, cl\xF4ture 6 juillet 2026"), /*#__PURE__*/React.createElement("p", null, "\u2022 Art. 301, loi n\xB0 2021-1104 (Climat et R\xE9silience)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Strat\xE9gie OMI r\xE9vis\xE9e 2023 : neutralit\xE9 2050, \u221220% en 2030"), /*#__PURE__*/React.createElement("p", null, "\u2022 R\xE9gime SA.111726 (LDACEE), SA.111728 (PME), SA.119559 (AFR)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Classification navire : RGEC art. 36 ter (navire propre / \xE9mission nulle)"), /*#__PURE__*/React.createElement("p", null, "\u2022 DNSH : art. 17, r\xE8glement UE 2020/852 (Taxonomie)"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 mt-4"
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/catalogue/aap/aides-linvestissement-pour-la-decarbonation-du-transport-et-des-services-maritimes",
    target: "_blank",
    rel: "noopener",
    className: "text-center py-3 rounded-xl text-white font-bold text-sm",
    style: {
      background: T,
      textDecoration: "none"
    }
  }, "\uD83C\uDF10 Plateforme AGIR"), /*#__PURE__*/React.createElement("a", {
    href: "mailto:aap.navires@ademe.fr",
    className: "text-center py-3 rounded-xl font-bold text-sm",
    style: {
      border: "2px solid " + T,
      color: T,
      textDecoration: "none"
    }
  }, "\u2709\uFE0F Contact ADEME")), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 p-3 rounded-lg text-xs",
    style: {
      background: T + "10",
      border: "1px solid " + T + "30"
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold mb-1"
  }, "Contact GASPE pour accompagnement :"), /*#__PURE__*/React.createElement("p", null, "Le GASPE accompagne ses adh\xE9rents dans le montage de leurs dossiers ADEME. Contactez le D\xE9l\xE9gu\xE9 G\xE9n\xE9ral pour un appui personnalis\xE9 sur l'argumentaire environnemental, le dimensionnement technique et le positionnement strat\xE9gique du dossier."), /*#__PURE__*/React.createElement("a", {
    href: "https://gaspe.fr",
    target: "_blank",
    rel: "noopener",
    className: "inline-block mt-2 px-3 py-1 rounded font-bold",
    style: {
      background: "white",
      color: D,
      textDecoration: "none"
    }
  }, "gaspe.fr")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-6"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.print(),
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: PU
    }
  }, "\uD83D\uDDA8\uFE0F Imprimer / Exporter PDF"))), /*#__PURE__*/React.createElement("div", {
    className: "text-center py-4 mt-6",
    style: {
      borderTop: "1px solid #e5e7eb"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("img", {
    src: GASPE_A_COULEUR,
    alt: "",
    style: {
      height: 20,
      borderRadius: 3
    }
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs",
    style: {
      color: "#bbb"
    }
  }, "Localement ancr\xE9es. Socialement engag\xE9es.")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1",
    style: {
      color: "#ccc"
    }
  }, "v1.1.0 \u2014 Simulateur AAP ADEME 2026 \u2014 Propuls\xE9 par", " ", /*#__PURE__*/React.createElement("a", {
    href: "https://vaiata-dynamics.com/fr/",
    target: "_blank",
    rel: "noopener",
    style: {
      color: T
    }
  }, "VAIATA Dynamics")))));
}
