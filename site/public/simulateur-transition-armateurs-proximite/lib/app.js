const {useState, useEffect, useCallback, useMemo} = React;
const {BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis} = Recharts;
const T = "#1B9AAA",
  D = "#1E2D3D",
  AC = "#E8634A",
  LB = "#EAF4F7",
  W = "#F59E0B",
  GR = "#10B981",
  PU = "#7C3AED";
const CL = [D, T, AC, PU];
const DEF_FUELS = [{
  id: "mdo",
  l: "MDO",
  cat: "Fossile",
  co2: 3.206,
  price: 750,
  pGr: 3,
  note: "Référence proximité"
}, {
  id: "b30",
  l: "B30 (blend 30%)",
  cat: "Drop-in",
  co2: 2.244,
  price: 900,
  pGr: 1,
  note: "Sans modif moteur"
}, {
  id: "fame",
  l: "Biodiesel FAME B100",
  cat: "Bio",
  co2: 0.641,
  price: 1400,
  pGr: 0,
  note: "Drop-in diesel"
}, {
  id: "hvo",
  l: "HVO",
  cat: "Bio",
  co2: 0.480,
  price: 1600,
  pGr: 0,
  note: "Drop-in sans modif"
}, {
  id: "elec",
  l: "Électricité batteries",
  cat: "Zéro émission",
  co2: 0,
  price: 150,
  pGr: 2,
  note: "€/MWh",
  unit: "MWh"
}, {
  id: "h2",
  l: "Hydrogène vert",
  cat: "e-fuel",
  co2: 0,
  price: 6000,
  pGr: -2,
  note: "Expérimental",
  adv: true
}, {
  id: "ops",
  l: "OPS (élect. quai)",
  cat: "Zéro quai",
  co2: 0,
  price: 120,
  pGr: 2,
  note: "À quai",
  unit: "MWh",
  adv: true
}];
const TECHS = [{
  id: "helice",
  l: "Hélice optimisée",
  gL: .03,
  gM: .05,
  gH: .08,
  ox: 5,
  retro: "2-4 sem.",
  n: "Tous profils",
  cat: "Efficacité"
}, {
  id: "antifouling",
  l: "Antifouling avancé",
  gL: .02,
  gM: .03,
  gH: .05,
  ox: 20,
  retro: "1-2 sem.",
  n: "Renouvelable",
  cat: "Efficacité"
}, {
  id: "slowsteam",
  l: "Réduction vitesse",
  gL: .10,
  gM: .15,
  gH: .25,
  ox: 0,
  retro: "Immédiat",
  n: "Impact temps",
  cat: "Opérationnel"
}, {
  id: "hybride",
  l: "Hybridation diesel-élect.",
  gL: .15,
  gM: .25,
  gH: .35,
  ox: 40,
  retro: "3-6 mois",
  n: "Charge variable",
  cat: "Électrification"
}, {
  id: "fullelec",
  l: "Électrification complète",
  gL: .90,
  gM: .95,
  gH: 1.0,
  ox: 30,
  retro: "6-12 mois",
  n: "Zéro émission directe",
  cat: "Électrification"
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
  adv: true
}, {
  id: "routage",
  l: "Routage marée/courant",
  gL: .08,
  gM: .15,
  gH: .20,
  ox: 5,
  retro: "1-2 mois",
  n: "Bacs de Seine : −17%",
  cat: "Efficacité",
  adv: true
}];
const VT = [{
  id: "bac",
  l: "Bac estuarien",
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
  l: "Ferry insulaire",
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
  l: "Crew Transfer Vessel",
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
  id: "remorqueur",
  l: "Remorqueur portuaire",
  adv: true,
  d: {
    loa: 30,
    gt: 350,
    pP: 3000,
    pA: 200,
    pPeak: 4500,
    spd: 12,
    fc: 120,
    pTr: 15,
    pMa: 65,
    pQu: 20,
    opD: 340,
    rD: 8,
    cDur: 30,
    qT: 60,
    pax: 0,
    veh: 0,
    opex: 600,
    crew: 500,
    ins: 90,
    dd: 200,
    ddC: 5,
    mktV: 6000,
    rev: 2500,
    debt: 0,
    dspR: 0,
    lifeR: 20
  }
}, {
  id: "fluvial",
  l: "Croisière fluviale",
  adv: true,
  d: {
    loa: 40,
    gt: 200,
    pP: 400,
    pA: 150,
    pPeak: 600,
    spd: 10,
    fc: 30,
    pTr: 75,
    pMa: 10,
    pQu: 15,
    opD: 220,
    rD: 2,
    cDur: 120,
    qT: 60,
    pax: 100,
    veh: 0,
    opex: 400,
    crew: 300,
    ins: 50,
    dd: 100,
    ddC: 5,
    mktV: 4000,
    rev: 1200,
    debt: 0,
    dspR: 0,
    lifeR: 25
  }
}, {
  id: "supply",
  l: "Supply vessel",
  adv: true,
  d: {
    loa: 30,
    gt: 300,
    pP: 2500,
    pA: 300,
    pPeak: 3500,
    spd: 12,
    fc: 150,
    pTr: 60,
    pMa: 15,
    pQu: 25,
    opD: 300,
    rD: 3,
    cDur: 60,
    qT: 60,
    pax: 12,
    veh: 0,
    opex: 800,
    crew: 600,
    ins: 120,
    dd: 200,
    ddC: 5,
    mktV: 8000,
    rev: 3500,
    debt: 0,
    dspR: 0,
    lifeR: 20
  }
}, {
  id: "drague",
  l: "Drague portuaire",
  adv: true,
  d: {
    loa: 65,
    gt: 950,
    pP: 1200,
    pA: 500,
    pPeak: 2000,
    spd: 8,
    fc: 200,
    pTr: 10,
    pMa: 70,
    pQu: 20,
    opD: 250,
    rD: 2,
    cDur: 120,
    qT: 60,
    pax: 0,
    veh: 0,
    opex: 1200,
    crew: 800,
    ins: 150,
    dd: 400,
    ddC: 5,
    mktV: 10000,
    rev: 4000,
    debt: 0,
    dspR: 0,
    lifeR: 25
  }
}, {
  id: "sablier",
  l: "Navire sablier",
  adv: true,
  d: {
    loa: 85,
    gt: 2500,
    pP: 3800,
    pA: 800,
    pPeak: 4500,
    spd: 12,
    fc: 400,
    pTr: 50,
    pMa: 35,
    pQu: 15,
    opD: 280,
    rD: 2,
    cDur: 180,
    qT: 120,
    pax: 0,
    veh: 0,
    opex: 2000,
    crew: 1200,
    ins: 250,
    dd: 600,
    ddC: 5,
    mktV: 20000,
    rev: 8000,
    debt: 0,
    dspR: 0,
    lifeR: 25
  }
}, {
  id: "barge",
  l: "Barge de travail",
  adv: true,
  d: {
    loa: 30,
    gt: 250,
    pP: 400,
    pA: 100,
    pPeak: 600,
    spd: 6,
    fc: 40,
    pTr: 15,
    pMa: 55,
    pQu: 30,
    opD: 250,
    rD: 2,
    cDur: 120,
    qT: 60,
    pax: 0,
    veh: 0,
    opex: 300,
    crew: 200,
    ins: 40,
    dd: 80,
    ddC: 5,
    mktV: 1500,
    rev: 600,
    debt: 0,
    dspR: 0,
    lifeR: 30
  }
}, {
  id: "pilotine",
  l: "Pilotine",
  adv: true,
  d: {
    loa: 16,
    gt: 50,
    pP: 750,
    pA: 50,
    pPeak: 900,
    spd: 22,
    fc: 60,
    pTr: 60,
    pMa: 25,
    pQu: 15,
    opD: 340,
    rD: 10,
    cDur: 15,
    qT: 30,
    pax: 6,
    veh: 0,
    opex: 250,
    crew: 300,
    ins: 50,
    dd: 80,
    ddC: 5,
    mktV: 2000,
    rev: 1000,
    debt: 0,
    dspR: 0,
    lifeR: 20
  }
}];
const AIDES = [{
  id: "ademe",
  nom: "ADEME — Décarbonation transports",
  taux: "30-50%",
  plf: "2 M€",
  cond: "Navire FR, CO₂ -30%",
  cal: "AAP annuel",
  del: "4-6 mois",
  cum: ["fv", "reg", "bpi"]
}, {
  id: "fv",
  nom: "Fonds vert",
  taux: "20-40%",
  plf: "Variable",
  cond: "Soutien collectivité",
  cal: "Permanent",
  del: "2-4 mois",
  cum: ["ademe", "reg"]
}, {
  id: "reg",
  nom: "Aides régionales",
  taux: "10-30%",
  plf: "Variable",
  cond: "Exploitation en région",
  cal: "Variable",
  del: "3-6 mois",
  cum: ["ademe", "fv", "feder", "bpi"]
}, {
  id: "feder",
  nom: "FEDER maritime",
  taux: "20-40%",
  plf: "5 M€",
  cond: "Zone éligible",
  cal: "2021-2027",
  del: "6-12 mois",
  cum: ["reg"]
}, {
  id: "cef",
  nom: "CEF Transport (UE)",
  taux: "30-50%",
  plf: "10 M€",
  cond: "Réseau RTE-T",
  cal: "Bisannuel",
  del: "12-18 mois",
  cum: []
}, {
  id: "f2030",
  nom: "France 2030",
  taux: "30-50%",
  plf: "Variable",
  cond: "Innovation",
  cal: "AAP",
  del: "6-12 mois",
  cum: ["ademe", "bpi"]
}, {
  id: "bpi",
  nom: "Prêt vert Bpifrance",
  taux: "2-3%",
  plf: "5 M€",
  cond: "PME/ETI",
  cal: "Permanent",
  del: "1-3 mois",
  cum: ["ademe", "reg", "f2030"]
}, {
  id: "bei",
  nom: "Garantie BEI",
  taux: "50-80%",
  plf: "Variable",
  cond: "Projet > 5 M€",
  cal: "Permanent",
  del: "6-12 mois",
  cum: ["cef"]
}, {
  id: "suram",
  nom: "Suramortissement fiscal",
  taux: "40%",
  plf: "—",
  cond: "Navire propre",
  cal: "Si actif",
  del: "Immédiat",
  cum: ["ademe", "reg", "fv", "bpi"]
}];
const ECO = [{
  cat: "⚓ Chantiers",
  items: [{
    n: "OCEA",
    s: "Alu, électrique, hybride",
    u: "ocea.fr"
  }, {
    n: "Piriou",
    s: "Travail, retrofit, HyDrOMer",
    u: "piriou.com"
  }, {
    n: "Socarenam",
    s: "Ferries, passagers",
    u: "socarenam.fr"
  }, {
    n: "Damen",
    s: "Ferries électriques",
    u: "damen.com"
  }, {
    n: "Merré",
    s: "Dragues, pontons, barges",
    u: "merre.fr"
  }]
}, {
  cat: "🔋 Batteries & propulsion",
  items: [{
    n: "Forsee Power",
    s: "Batteries maritimes",
    u: "forseepower.com"
  }, {
    n: "Corvus Energy",
    s: "Leader ESS",
    u: "corvusenergy.com"
  }, {
    n: "EST-Floattech",
    s: "Green Orca",
    u: "est-floattech.com"
  }, {
    n: "Torqeedo",
    s: "Petits navires",
    u: "torqeedo.com"
  }, {
    n: "Volvo Penta",
    s: "IPS Professional, hybride CTV",
    u: "volvopenta.com"
  }]
}, {
  cat: "💰 Financeurs",
  items: [{
    n: "NEOT e-Motion",
    s: "BaaS/RaaS maritime",
    u: "neotcapital.com"
  }, {
    n: "Bpifrance",
    s: "Prêts verts",
    u: "bpifrance.fr"
  }, {
    n: "Mirova",
    s: "Impact investing",
    u: "mirova.com"
  }, {
    n: "Caisse des Dépôts",
    s: "Transition",
    u: "caissedesdepots.fr"
  }]
}, {
  cat: "🏛 Institutions",
  items: [{
    n: "ADEME",
    s: "AAP maritime",
    u: "ademe.fr"
  }, {
    n: "DGAMPA",
    s: "Tutelle maritime",
    u: "mer.gouv.fr"
  }, {
    n: "Bureau Veritas",
    s: "Classification batteries NR 320/547",
    u: "bureauveritas.com"
  }, {
    n: "OPCO Mobilités",
    s: "Formation STCW",
    u: "opcomobilites.fr"
  }]
}, {
  cat: "📝 Bureaux d'études",
  items: [{
    n: "Mauric",
    s: "Architecture navale, pilotines",
    u: "mauric.fr"
  }, {
    n: "Stirling Design",
    s: "Conception navale, retrofit",
    u: "stirlingdesign.fr"
  }, {
    n: "Coprexma",
    s: "Ingénierie maritime",
    u: "coprexma.com"
  }, {
    n: "LMG Marin",
    s: "CFD, hydrodynamique",
    u: "lmgmarin.no"
  }]
}];
const RISKS = [{
  l: "Non-renouvellement DSP (crit. enviro.)",
  p: 3,
  i: 5,
  c: "Stratégique"
}, {
  l: "Pression réputationnelle",
  p: 4,
  i: 3,
  c: "Stratégique"
}, {
  l: "Effondrement VR navire fossile",
  p: 3,
  i: 4,
  c: "Financier"
}, {
  l: "Hausse durable prix MDO",
  p: 4,
  i: 3,
  c: "Financier"
}, {
  l: "Extension réglementation < 5000 GT",
  p: 2,
  i: 4,
  c: "Réglementaire"
}, {
  l: "Sous-performance technologique (70%)",
  p: 3,
  i: 3,
  c: "Technique"
}, {
  l: "Dégradation batteries accélérée",
  p: 3,
  i: 3,
  c: "Technique"
}, {
  l: "Faillite fournisseur",
  p: 2,
  i: 4,
  c: "Technique"
}, {
  l: "Indisponibilité réseau ENEDIS",
  p: 3,
  i: 4,
  c: "Opérationnel"
}, {
  l: "Dépassement budget chantier",
  p: 3,
  i: 3,
  c: "Construction"
}, {
  l: "Retard retrofit / livraison",
  p: 4,
  i: 3,
  c: "Construction"
}];
const DSCR_GRID = [{
  profil: "DSP longue (≥ 8 ans), TRL 9",
  dscr: "1,10x",
  ltv: "90-100%",
  dur: "15 ans"
}, {
  profil: "DSP moyenne (4-7 ans), TRL 8-9",
  dscr: "1,20x",
  ltv: "75-85%",
  dur: "10-12 ans"
}, {
  profil: "DSP courte (< 4 ans)",
  dscr: "1,30x",
  ltv: "60-75%",
  dur: "7-10 ans"
}, {
  profil: "Ligne commerciale sans DSP",
  dscr: "1,40x",
  ltv: "50-65%",
  dur: "5-7 ans"
}, {
  profil: "Technologie TRL ≤ 7",
  dscr: "1,40x+",
  ltv: "50-60%",
  dur: "5-7 ans"
}];
const FIN_MODES = [{
  mode: "Acquisition directe",
  actif: "Coque + énergie",
  bilan: "Au bilan",
  rv: "Armateur"
}, {
  mode: "Crédit-bail naval",
  actif: "Coque",
  bilan: "Hors bilan*",
  rv: "Crédit-bailleur"
}, {
  mode: "Affrètement coque nue",
  actif: "Navire complet",
  bilan: "Loyer opérationnel",
  rv: "Propriétaire"
}, {
  mode: "Location batteries (BaaS)",
  actif: "Batteries",
  bilan: "Redevance hors bilan",
  rv: "Investisseur"
}, {
  mode: "Retrofit en location (RaaS)",
  actif: "Retrofit complet",
  bilan: "Redevance",
  rv: "Investisseur"
}, {
  mode: "Recharge en service (CaaS)",
  actif: "Infra recharge",
  bilan: "Coût au kWh",
  rv: "Opérateur infra"
}];
const SURETES = [{
  s: "Hypothèque maritime",
  desc: "Porte sur le navire (coque + accessoires). Art. L.5114-2 C. transports."
}, {
  s: "Nantissement DSP",
  desc: "Cession des créances futures de la compensation DSP."
}, {
  s: "Cession Dailly",
  desc: "Cession de créances professionnelles (recettes billetterie/charter)."
}, {
  s: "Accord inter-créanciers",
  desc: "Règle la priorité entre prêteur coque et investisseur batteries."
}, {
  s: "Garantie de bonne fin",
  desc: "Garantie bancaire couvrant le risque construction (chantier naval)."
}, {
  s: "Ségrégation juridique batteries",
  desc: "Batteries amovibles = bien distinct hors hypothèque. Nécessite accord préalable."
}];
const INFRA_SHARE = [{
  item: "Bornes de recharge",
  arm: "✓",
  port: "✓",
  coll: "✓",
  inv: "CaaS"
}, {
  item: "Raccordement ENEDIS",
  arm: "✗",
  port: "✓",
  coll: "✓",
  inv: "✗"
}, {
  item: "Renforcement réseau",
  arm: "✗",
  port: "✗",
  coll: "✓",
  inv: "✗"
}, {
  item: "Stockage H₂",
  arm: "✓",
  port: "✓",
  coll: "✓",
  inv: "✓"
}, {
  item: "Pontons / rampes adaptés",
  arm: "✗",
  port: "✓",
  coll: "✓",
  inv: "✗"
}];
const RETEX = [{
  nom: "E-ferry Ellen (DK)",
  desc: "Ferry 100% électrique, 22 NM, 4,3 MWh, Ærø–Fynshav. En service depuis 2019.",
  impact: "Réduction 100% émissions directes, 2 200 tCO₂/an évitées."
}, {
  nom: "Ampere (NO)",
  desc: "Premier ferry électrique mondial, Lavik–Oppedal, 2015. 1 MWh, 34 voitures.",
  impact: "Pionniers : a prouvé la viabilité technico-économique."
}, {
  nom: "Maguelonne (FR)",
  desc: "Pilotine Sète, retrofit 100% électrique par SOPER/MGH. 2022.",
  impact: "Première pilotine électrique française."
}, {
  nom: "LAMELEC (FR)",
  desc: "Navire de lamanage 100% électrique OCEA/VEBRAT, Loire. En construction.",
  impact: "Premier lamaneur électrique français. Bpifrance + CMA CGM PULSE."
}, {
  nom: "Ginny Louise (UK)",
  desc: "CTV retrofit électrique Volvo Penta IPS, Mercurio. Annoncé 2024.",
  impact: "Premier CTV 100% électrique au monde."
}, {
  nom: "HyDrOMer (FR)",
  desc: "Drague Piriou + pile à combustible H₂, Région Occitanie.",
  impact: "Réduction 20% consommation diesel. Démonstrateur H₂ portuaire."
}];
const fmt = (n, d = 0) => typeof n === "number" ? n.toLocaleString("fr-FR", {
  maximumFractionDigits: d
}) : "—";
const fK = n => fmt(Math.round(n)) + " k€";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const emT = () => ({
  name: "",
  fuelMix: {},
  techs: {},
  iC: 0,
  iE: 0,
  iI: 0,
  gridCost: 0
});
const defP = () => ({
  id: Date.now().toString(36) + Math.random().toString(36).slice(2),
  name: "Nouveau projet",
  upd: new Date().toISOString(),
  v: {
    type: "bac",
    name: "",
    ...VT[0].d
  },
  p: {
    sy: 2026,
    dur: 10,
    disc: 5,
    cont: 12,
    fpG: 3
  },
  ref: {
    fuels: DEF_FUELS.map(f => ({
      id: f.id,
      price: f.price,
      co2: f.co2
    }))
  },
  trajs: [{
    ...emT(),
    name: "Trajectoire de référence",
    fuelMix: {
      mdo: 100
    }
  }, {
    ...emT(),
    name: "Alternative 1"
  }, {
    ...emT(),
    name: "Alternative 2"
  }, {
    ...emT(),
    name: "Alternative 3"
  }],
  ao: {
    poidsEnviro: 30
  },
  perf: [],
  customRisks: []
});
const SK = "gaspe5";
function ldL() {
  try {
    const r = localStorage.getItem(SK);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}
function svL(l) {
  try {
    localStorage.setItem(SK, JSON.stringify(l));
  } catch {}
}
function ldP(id) {
  try {
    const r = localStorage.getItem("g5:" + id);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}
function svP(p) {
  try {
    p.upd = new Date().toISOString();
    localStorage.setItem("g5:" + p.id, JSON.stringify(p));
    const l = ldL();
    const i = l.findIndex(x => x.id === p.id);
    const e = {
      id: p.id,
      name: p.name,
      upd: p.upd,
      vn: p.v.name,
      vt: p.v.type
    };
    if (i >= 0) l[i] = e;else l.push(e);
    svL(l);
  } catch {}
}
function rmP(id) {
  try {
    localStorage.removeItem("g5:" + id);
    svL(ldL().filter(x => x.id !== id));
  } catch {}
}
function getFuelPrice(proj, fid) {
  const ref = proj.ref?.fuels?.find(x => x.id === fid);
  return ref ? ref.price : DEF_FUELS.find(x => x.id === fid)?.price || 750;
}
function getFuelCO2(proj, fid) {
  const ref = proj.ref?.fuels?.find(x => x.id === fid);
  return ref ? ref.co2 : DEF_FUELS.find(x => x.id === fid)?.co2 || 3.206;
}
function getMixForYear(tj, yr) {
  const base = tj.fuelMix || {
    mdo: 100
  };
  const steps = (tj.mixSteps || []).sort((a, b) => a.year - b.year);
  if (steps.length === 0) return base;
  // Find surrounding steps for interpolation
  const allPts = [{
    year: -Infinity,
    mix: base
  }, ...steps];
  let prev = allPts[0],
    next = null;
  for (let i = 1; i < allPts.length; i++) {
    if (yr >= allPts[i].year) prev = allPts[i];else {
      next = allPts[i];
      break;
    }
  }
  if (!next || prev.year === next.year) return prev.mix;
  // Linear interpolation
  const t = Math.max(0, Math.min(1, (yr - prev.year) / (next.year - prev.year)));
  const allFuels = new Set([...Object.keys(prev.mix), ...Object.keys(next.mix)]);
  const interp = {};
  allFuels.forEach(f => {
    const a = prev.mix[f] || 0;
    const b = next.mix[f] || 0;
    const v = a + (b - a) * t;
    if (v > 0.1) interp[f] = Math.round(v * 10) / 10;
  });
  return interp;
}
function mixWeights(proj, mix) {
  const mixT = Object.values(mix).reduce((a, b) => a + b, 0) || 100;
  let wCO2 = 0,
    wCost = 0;
  Object.entries(mix).forEach(([fid, pct]) => {
    if (pct > 0) {
      const sh = pct / mixT;
      wCO2 += sh * (getFuelCO2(proj, fid) / 3.206);
      wCost += sh * (getFuelPrice(proj, fid) / 750);
    }
  });
  if (wCO2 === 0) {
    wCO2 = 1;
    wCost = 1;
  }
  return {
    wCO2,
    wCost
  };
}
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
        const fp = 750 * Math.pow(1 + fg, t);
        const mix = getMixForYear(tj, yr);
        const {
          wCO2,
          wCost
        } = mixWeights(proj, mix);
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
        const ins = v.ins + (ti === 0 ? 0 : insElec ? v.ins * 0.3 : 0);
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
function dimBatt(v) {
  const e = v.pP * v.cDur / 60 * 1.25;
  const pw = v.pPeak / 2;
  const kWh = Math.max(e, pw);
  const c = pw > e ? "puissance" : "energy";
  const cP = kWh / (v.qT / 60) * 1.1;
  const eTrip = v.pP * v.cDur / 60;
  const dod = Math.min(0.8, eTrip / kWh);
  const eqCyclesAn = v.rD * v.opD * dod / 0.8;
  const lifeCycles = 4000;
  const lifeYrs = Math.max(3, Math.round(lifeCycles / Math.max(1, eqCyclesAn)));
  const degradPctAn = Math.round(100 / lifeYrs);
  return {
    kWh: Math.round(kWh),
    constraint: c,
    chargePower: Math.round(cP),
    costBatt: Math.round(kWh * 500 / 1000),
    costCharger: Math.round(cP * 200 / 1000),
    gridConnect: cP > 500 ? 350 : cP > 200 ? 150 : 50,
    eqCyclesAn: Math.round(eqCyclesAn),
    dod: Math.round(dod * 100),
    lifeCycles,
    lifeYrs,
    degradPctAn
  };
}
function genDossier(proj, res) {
  const v = proj.v;
  const p = proj.p;
  const vt = VT.find(x => x.id === v.type);
  const bd = dimBatt(v);
  let t = "============================================================\n  DOSSIER COMPLET - SIMULATEUR TRANSITION ENERGETIQUE GASPE\n  " + proj.name + "\n  " + new Date().toLocaleDateString("fr-FR") + "\n============================================================\n\n";
  t += "1. NAVIRE : " + (v.name || "(non nommé)") + " (" + vt?.l + ")\n   LOA " + v.loa + "m | " + v.gt + " GT | " + v.pP + " kW | " + v.spd + " nds | " + v.rD + " rot/j\n   Profil de charge : Transit " + (v.pTr || 60) + "% / Manœuvre " + (v.pMa || 20) + "% / Quai " + (v.pQu || 20) + "%\n   DSP " + v.dspR + " ans | Recettes " + fK(v.rev) + "/an\n\n";
  t += "2. PARAMETRES : " + p.sy + "-" + (p.sy + p.dur) + " | Actu. " + p.disc + "% | Cont. " + p.cont + "% | Fuel +" + p.fpG + "%/an\n\n";
  t += "3. TRAJECTOIRES\n";
  res.forEach((r, i) => {
    t += "   " + r.name + " : CCV " + fK(r.base.ccv) + " (deg " + fK(r.deg.ccv) + ") | Invest " + fK(r.totI) + " | CO2 " + fmt(Math.round(r.base.co2)) + "t | Gain " + (r.gain.m * 100).toFixed(0) + "%\n";
    if (i > 0) {
      const d = r.base.ccv - res[0].base.ccv;
      const dC = res[0].base.co2 - r.base.co2;
      t += "      dCCV " + fK(d) + " | dCO2 " + fmt(Math.round(-dC)) + "t" + (dC > 0 ? " | CMA " + fmt(Math.round(d * 1000 / dC)) + " EUR/tCO2" : "") + "\n";
    }
  });
  t += "\n4. BATTERIES : " + bd.kWh + " kWh (" + bd.constraint + ") | Chargeur " + bd.chargePower + " kW | Est. " + fK(bd.costBatt + bd.costCharger + bd.gridConnect) + "\n   DoD/traversée : " + bd.dod + "% | Cycles équiv./an : " + bd.eqCyclesAn + " | Durée vie pack : " + bd.lifeYrs + " ans\n";
  t += "\n5. FINANCEMENT\n";
  res.slice(1).filter(r => r.totI > 0).forEach(r => {
    const ann = v.rev - v.opex - (r.base.yrs[1]?.en || 0) - v.crew - v.ins;
    t += "   " + r.name + " : FCF " + fK(ann) + " | DSCR " + (r.totI > 0 ? ann / (r.totI / p.dur) : 0).toFixed(2) + "x\n";
  });
  t += "\n6. AIDES\n";
  AIDES.forEach(a => {
    t += "   " + a.nom + " (" + a.taux + ", plf " + a.plf + ") " + a.cond + "\n";
  });
  t += "\n7. RISQUES\n";
  [...RISKS].sort((a, b) => b.p * b.i - a.p * a.i).forEach(r => {
    t += "   [" + r.c + "] " + r.l + " P:" + r.p + " I:" + r.i + " =" + r.p * r.i + "\n";
  });
  t += "\n8. ECOSYSTEME\n";
  ECO.forEach(s => {
    t += "   " + s.cat + "\n";
    s.items.forEach(e => {
      t += "     " + e.n + " - " + e.s + "\n";
    });
  });
  t += "\n9. RETOURS D'EXPERIENCE\n";
  RETEX.forEach(r => {
    t += "   " + r.nom + " : " + r.desc + "\n   -> " + r.impact + "\n";
  });
  t += "\n============================================================\nGASPE - Simulateur CCV V5 - " + new Date().toLocaleDateString("fr-FR") + "\n";
  return t;
}
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
      width: 15,
      height: 15,
      fontSize: 9,
      backgroundColor: T,
      cursor: "pointer",
      lineHeight: 1
    }
  }, "i"), o && /*#__PURE__*/React.createElement("div", {
    className: "absolute z-50 bottom-6 left-0 p-2.5 rounded-lg text-xs leading-relaxed",
    style: {
      width: 260,
      background: "#1E2D3D",
      color: "#e8ecef",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
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
  }, "✕"), text));
};
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
const Tbl = ({
  cols,
  rows,
  ws
}) => {
  const tw = ws.reduce((a, b) => a + b);
  return /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto -mx-1"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-xs"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: D,
      color: "white"
    }
  }, cols.map((c, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    className: "p-1.5 text-left",
    style: {
      width: ws[i] / tw * 100 + "%"
    }
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri,
    style: {
      background: ri % 2 ? LB : "white"
    }
  }, r.map((c, ci) => /*#__PURE__*/React.createElement("td", {
    key: ci,
    className: "p-1.5"
  }, c)))))));
};
function App() {
  const [prs, setPrs] = useState([]);
  const [proj, setProj] = useState(null);
  const [step, setStep] = useState(0);
  const [ld, setLd] = useState(true);
  const [sv, setSv] = useState(false);
  const [eT, setET] = useState(0);
  const [showAdv, setShowAdv] = useState(false);
  const [fleetPrs, setFleetPrs] = useState([]);
  const [wizStep, setWizStep] = useState(0);
  const [wiz, setWiz] = useState({
    type: "bac",
    name: "",
    ambition: "hybride",
    budget: "moyen",
    dsp: 10
  });
  const [showLex, setShowLex] = useState(false);
  useEffect(() => {
    setPrs(ldL());
    setLd(false);
  }, []);
  const save = useCallback(p => {
    svP(p);
    setSv(true);
    setTimeout(() => setSv(false), 1500);
    setPrs(ldL());
  }, []);
  const upd = useCallback(fn => {
    setProj(prev => {
      const next = typeof fn === "function" ? fn(prev) : {
        ...prev,
        ...fn
      };
      save(next);
      return next;
    });
  }, [save]);
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
  const uTj = useCallback((i, k, val) => upd(p => {
    const ts = [...p.trajs];
    ts[i] = {
      ...ts[i],
      [k]: val
    };
    return {
      ...p,
      trajs: ts
    };
  }), [upd]);
  const uRef = useCallback((fid, k, val) => upd(p => {
    const rf = p.ref?.fuels ? [...p.ref.fuels] : DEF_FUELS.map(f => ({
      id: f.id,
      price: f.price,
      co2: f.co2
    }));
    const i = rf.findIndex(x => x.id === fid);
    if (i >= 0) rf[i] = {
      ...rf[i],
      [k]: val
    };
    return {
      ...p,
      ref: {
        ...p.ref,
        fuels: rf
      }
    };
  }), [upd]);
  const res = useMemo(() => proj ? compute(proj) : null, [proj]);
  const batt = useMemo(() => proj ? dimBatt(proj.v) : null, [proj]);
  const newP = () => {
    const p = defP();
    svP(p);
    setProj(p);
    setStep(1);
    setPrs(ldL());
  };
  const openP = async id => {
    const p = ldP(id);
    if (p) {
      setProj(p);
      setStep(1);
    }
  };
  const expP = () => {
    if (!proj) return;
    const b = new Blob([JSON.stringify(proj, null, 2)], {
      type: "application/json"
    });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = proj.name.replace(/\s+/g, "_") + "_CCV.json";
    a.click();
  };
  const impP = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json";
    inp.onchange = async e => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const p = JSON.parse(await f.text());
        p.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        p.name += " (importé)";
        svP(p);
        setProj(p);
        setStep(1);
        setPrs(ldL());
      } catch {
        alert("Fichier invalide");
      }
    };
    inp.click();
  };
  const apDef = tid => {
    const vt = VT.find(x => x.id === tid);
    if (vt) upd(p => ({
      ...p,
      v: {
        ...p.v,
        type: tid,
        ...vt.d
      }
    }));
  };
  // Fleet loading
  const loadFleet = useCallback(() => {
    const all = ldL();
    const loaded = [];
    for (const e of all) {
      if (e.id !== proj?.id) {
        const p = ldP(e.id);
        if (p) {
          const r = compute(p);
          loaded.push({
            name: p.name,
            vt: p.v.type,
            res: r,
            p
          });
        }
      }
    }
    setFleetPrs(loaded);
  }, [proj]);
  const tabs = [{
    l: "Navire",
    i: "🚢"
  }, {
    l: "Réf.",
    i: "📚"
  }, {
    l: "Trajectoires",
    i: "🔀"
  }, {
    l: "Batteries",
    i: "🔋"
  }, {
    l: "CCV",
    i: "📊"
  }, {
    l: "Finance",
    i: "💰"
  }, {
    l: "Aides",
    i: "🏛"
  }, {
    l: "DSP & AO",
    i: "📜"
  }, {
    l: "Risques",
    i: "⚠"
  }, {
    l: "Flotte",
    i: "⚓"
  }, {
    l: "Écosyst.",
    i: "🌐"
  }, {
    l: "Suivi",
    i: "📈"
  }, {
    l: "Dossier",
    i: "📄"
  }];
  const Prev = ({
    to
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep(to),
    className: "px-3 py-2 rounded-lg font-bold text-sm",
    style: {
      color: T,
      border: "2px solid " + T
    }
  }, "←");
  const Next = ({
    to,
    l
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep(to),
    className: "px-3 py-2 rounded-lg font-bold text-white text-sm",
    style: {
      backgroundColor: T
    }
  }, l + " →");
  if (ld) return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center h-screen",
    style: {
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: T
    }
  }, "Chargement..."));
  if (step === 0 || !proj) return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      minHeight: "100vh",
      background: "linear-gradient(135deg," + D + ",#2a3f52)"
    }
  }, "", /*#__PURE__*/React.createElement("div", {
    className: "max-w-lg mx-auto px-4 py-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold tracking-widest mb-2",
    style: {
      color: T
    }
  }, "GASPE"), /*#__PURE__*/React.createElement("h1", {
    className: "text-xl font-bold mb-1",
    style: {
      fontFamily: "'DM Serif Display',serif",
      color: "white"
    }
  }, "Simulateur de Transition Énergétique"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-4",
    style: {
      color: "#9ab"
    }
  }, "Flottes Maritimes de Proximité — Modèle CCV"), /*#__PURE__*/React.createElement("div", {
    className: "text-left rounded-xl p-4 mb-6",
    style: {
      background: "rgba(255,255,255,0.06)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs leading-relaxed",
    style: {
      color: "#9ab"
    }
  }, "Le transport maritime de proximité a des besoins spécifiques : ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "white"
    }
  }, "cyclage intensif"), " (jusqu'à 100 rotations/jour), ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "white"
    }
  }, "infrastructure à terre déterminante"), ", ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "white"
    }
  }, "DSP et continuité territoriale"), ", et ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "white"
    }
  }, "PME comme structure dominante"), ". Ce simulateur calcule le Coût de Cycle de Vie complet et produit les dossiers pour vos financeurs et autorités délégantes."))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 mb-6"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: newP,
    className: "w-full rounded-xl p-4 text-left",
    style: {
      background: "linear-gradient(135deg," + T + ",#15828f)",
      color: "white"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold"
  }, "+ Nouveau projet"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs opacity-80"
  }, "13 volets — de la fiche navire au dossier complet")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setWizStep(1);
    },
    className: "w-full rounded-xl p-4 text-left",
    style: {
      background: "linear-gradient(135deg," + PU + ",#5b21b6)",
      color: "white"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold"
  }, "🧙 Mode guidé PME"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs opacity-80"
  }, "5 questions → premier scénario auto-généré")), /*#__PURE__*/React.createElement("button", {
    onClick: impP,
    className: "w-full rounded-xl p-4 text-left border-2 border-dashed",
    style: {
      borderColor: "rgba(255,255,255,0.2)",
      color: "white"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold"
  }, "📂 Importer JSON"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4 px-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: "#9ab"
    }
  }, "Segments étendus"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAdv(!showAdv),
    className: "text-xs px-3 py-1 rounded-full",
    style: {
      background: showAdv ? T : "rgba(255,255,255,0.1)",
      color: "white"
    }
  }, showAdv ? "✓ Activé" : "Activer")), prs.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xs font-bold tracking-widest mb-2",
    style: {
      color: "#9ab"
    }
  }, "PROJETS"), prs.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    className: "rounded-lg p-3 mb-2 flex items-center justify-between cursor-pointer",
    style: {
      backgroundColor: "rgba(255,255,255,0.06)"
    },
    onClick: () => openP(p.id)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-white text-sm"
  }, p.name), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#9ab"
    }
  }, VT.find(x => x.id === p.vt)?.l, " ", p.vn && "— " + p.vn)), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      {
        rmP(p.id);
        setPrs(ldL());
      }
    },
    className: "text-xs px-2",
    style: {
      color: "#f87171"
    }
  }, "✕")))), /*#__PURE__*/React.createElement("p", {
    className: "text-center text-xs mt-8",
    style: {
      color: "#567"
    }
  }, "GASPE — Outil ouvert à tous les armateurs de proximité"), wizStep > 0 && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold",
    style: {
      color: PU
    }
  }, "🧙 Mode guidé — Étape ", wizStep, "/5"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setWizStep(0),
    style: {
      color: "#999"
    }
  }, "✕")), wizStep === 1 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-3"
  }, "Quel type de navire exploitez-vous ?"), VT.filter(t => !t.adv).map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => {
      setWiz(w => ({
        ...w,
        type: t.id
      }));
      setWizStep(2);
    },
    className: "w-full text-left p-3 rounded-lg mb-2 text-sm",
    style: {
      background: wiz.type === t.id ? LB : "#f9f9f9",
      border: wiz.type === t.id ? "2px solid " + T : "2px solid transparent"
    }
  }, t.l))), wizStep === 2 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-3"
  }, "Nom de votre navire (ou de la liaison) ?"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: wiz.name,
    onChange: e => setWiz(w => ({
      ...w,
      name: e.target.value
    })),
    className: "w-full border rounded-lg px-3 py-2 text-sm mb-3",
    placeholder: "Ex: Le Pellerin, Liaison Brest-Ouessan…"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setWizStep(3),
    className: "px-4 py-2 rounded-lg text-white text-sm font-bold",
    style: {
      backgroundColor: PU
    }
  }, "Suivant")), wizStep === 3 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-3"
  }, "Quelle ambition de décarbonation ?"), [["bio", "Biocarburants drop-in (faible invest., gain CO₂ modéré)"], ["hybride", "Hybridation (invest. modéré, gain 25-35%)"], ["fullelec", "100% électrique (invest. fort, zéro émission)"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => {
      setWiz(w => ({
        ...w,
        ambition: k
      }));
      setWizStep(4);
    },
    className: "w-full text-left p-3 rounded-lg mb-2 text-sm",
    style: {
      background: wiz.ambition === k ? LB : "#f9f9f9",
      border: wiz.ambition === k ? "2px solid " + PU : "2px solid transparent"
    }
  }, l))), wizStep === 4 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-3"
  }, "DSP résiduelle ?"), [[15, "Longue (≥ 8 ans)"], [8, "Moyenne (4-7 ans)"], [3, "Courte (< 4 ans)"], [0, "Pas de DSP"]].map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => {
      setWiz(w => ({
        ...w,
        dsp: v
      }));
      setWizStep(5);
    },
    className: "w-full text-left p-3 rounded-lg mb-2 text-sm",
    style: {
      background: wiz.dsp === v ? LB : "#f9f9f9"
    }
  }, l))), wizStep === 5 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm mb-3"
  }, "Budget d'investissement ?"), [["petit", "< 500 k€"], ["moyen", "500 k€ – 2 M€"], ["grand", "> 2 M€"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => {
      setWiz(w => ({
        ...w,
        budget: k
      }));
    },
    className: "w-full text-left p-3 rounded-lg mb-2 text-sm",
    style: {
      background: wiz.budget === k ? LB : "#f9f9f9"
    }
  }, l)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const vt = VT.find(x => x.id === wiz.type);
      const d = vt?.d || VT[0].d;
      const p = defP();
      p.name = wiz.name || "Projet " + vt?.l;
      p.v = {
        ...p.v,
        type: wiz.type,
        name: wiz.name,
        ...d,
        dspR: wiz.dsp
      };
      const alt = {
        ...emT(),
        name: "Alternative 1"
      };
      if (wiz.ambition === "bio") {
        alt.fuelMix = {
          fame: 100
        };
        alt.techs = {
          antifouling: {
            a: true,
            year: 2026
          },
          helice: {
            a: true,
            year: 2027
          }
        };
        alt.iC = 50;
      } else if (wiz.ambition === "hybride") {
        alt.fuelMix = {
          mdo: 50,
          elec: 50
        };
        alt.techs = {
          hybride: {
            a: true,
            year: 2027
          },
          antifouling: {
            a: true,
            year: 2026
          }
        };
        const b = wiz.budget === "petit" ? 400 : wiz.budget === "moyen" ? 800 : 1500;
        alt.iE = b;
        alt.iI = b * 0.3;
        alt.gridCost = 150;
      } else {
        alt.fuelMix = {
          elec: 100
        };
        alt.techs = {
          fullelec: {
            a: true,
            year: 2028
          }
        };
        const b = wiz.budget === "petit" ? 800 : wiz.budget === "moyen" ? 1500 : 3000;
        alt.iE = b;
        alt.iI = b * 0.3;
        alt.gridCost = 300;
      }
      p.trajs[1] = alt;
      svP(p);
      setProj(p);
      setStep(1);
      setPrs(ldL());
      setWizStep(0);
    },
    className: "w-full mt-3 px-4 py-3 rounded-lg text-white font-bold",
    style: {
      backgroundColor: PU
    }
  }, "✨ Générer mon premier scénario"))))));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      minHeight: "100vh",
      background: "#f5f7f9"
    }
  }, "", /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-3 py-2",
    style: {
      backgroundColor: D,
      color: "white"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 min-w-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setProj(null);
      setStep(0);
    },
    className: "text-xs opacity-60 shrink-0"
  }, "⚓"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-sm truncate"
  }, proj.name)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 shrink-0"
  }, sv && /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: GR
    }
  }, "✓"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowLex(!showLex),
    className: "text-xs px-2 py-1 rounded",
    style: {
      backgroundColor: showLex ? "rgba(27,154,170,0.3)" : "rgba(255,255,255,0.05)",
      color: showLex ? T : "#ccc"
    },
    title: "Lexique"
  }, "📖"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAdv(!showAdv),
    className: "text-xs px-2 py-1 rounded",
    style: {
      backgroundColor: showAdv ? "rgba(27,154,170,0.3)" : "rgba(255,255,255,0.05)",
      color: showAdv ? T : "#888"
    }
  }, showAdv ? "⚙☆" : "⚙"), /*#__PURE__*/React.createElement("button", {
    onClick: expP,
    className: "text-xs px-2 py-1 rounded",
    style: {
      backgroundColor: "rgba(255,255,255,0.1)"
    }
  }, "JSON"))), showLex && /*#__PURE__*/React.createElement("div", {
    className: "px-3 py-3 text-xs overflow-y-auto",
    style: {
      background: LB,
      maxHeight: "60vh",
      borderBottom: "2px solid " + T
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-sm",
    style: {
      color: D
    }
  }, "📖 Lexique — tous les termes expliqués"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowLex(false),
    style: {
      color: "#999"
    }
  }, "✕ Fermer")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1"
  }, [["CCV", "Coût de Cycle de Vie (norme ISO 15686-5). Somme de tous les coûts sur la durée de vie : investissement + exploitation + énergie + équipage + assurance + arrêts − valeur résiduelle, ramenés en euros d’aujourd’hui (actualisés)."], ["DSP", "Délégation de Service Public. Contrat par lequel une collectivité confie l’exploitation d’une liaison maritime à un armateur privé. Durée typique : 7-15 ans."], ["AO", "Appel d’Offres. Procédure de mise en concurrence pour attribuer une DSP ou un marché public."], ["DSCR", "Debt Service Coverage Ratio. Ratio de couverture de la dette : flux de trésorerie disponible ÷ annuité de remboursement. > 1,2x = bancable."], ["FCF", "Free Cash Flow. Flux de trésorerie libre : recettes − OPEX − énergie − équipage − assurance. C’est ce qui reste pour rembourser la dette et investir."], ["LTV", "Loan-to-Value. Montant du prêt ÷ valeur du navire. Plus le LTV est élevé, plus le risque bancaire est fort. Max. 70-80%."], ["OPEX", "OPerational EXpenditure. Coûts d’exploitation courants (hors énergie et équipage) : entretien, pièces, frais de port, redevances."], ["NM", "Mille Nautique (1,852 km). Unité de distance maritime standard."], ["GT", "Gross Tonnage (jauge brute). Mesure du volume intérieur du navire. Ce n’est PAS un poids. Seuil réglementaire : 500 GT."], ["LOA", "Length Over All. Longueur hors tout du navire en mètres."], ["MDO", "Marine Diesel Oil. Gazole marin standard, carburant fossile de référence."], ["HVO", "Hydrotreated Vegetable Oil. Huile végétale hydrotraitée, biocarburant « drop-in » (utilisable sans modifier le moteur)."], ["FAME", "Fatty Acid Methyl Ester. Biodiesel B100. Nécessite parfois des adaptations joints/filtres."], ["B30", "Mélange 30% biodiesel + 70% MDO. Drop-in, sans modification moteur."], ["OPS", "Onshore Power Supply. Alimentation électrique à quai (branchement au réseau terrestre). Évite de faire tourner les moteurs au port."], ["kWh", "Kilowattheure. Unité d’énergie. 1 kWh = l’énergie consommée par un appareil de 1 kW pendant 1 heure."], ["DoD", "Depth of Discharge (profondeur de décharge). Pourcentage de la capacité batterie utilisé à chaque traversée. 80% DoD = standard LFP."], ["LFP", "Lithium Fer Phosphate. Chimie de batterie privilégiée en maritime : plus sûre (pas d’emballement thermique), 4 000 cycles de vie, mais densité plus faible que NMC."], ["BMS", "Battery Management System. Système électronique qui gère la charge, la décharge, la température et l’équilibrage des cellules."], ["ENEDIS", "Gestionnaire du réseau de distribution électrique en France. Incontournable pour le raccordement des bornes de charge quai."], ["IELEC", "Indice électricité. Indice de révision des prix de l’électricité, à intégrer dans la formule de révision DSP après électrification."], ["ESG", "Environnement, Social, Gouvernance. Critères de performance extra-financière utilisés par les investisseurs et les collectivités."], ["Taxonomie UE", "Classification européenne des activités économiques durables. Éligible si > 50% zéro émission. Ouvre l’accès aux financements verts."], ["Altmark", "Jurisprudence européenne (arrêt Altmark 2003). 4 critères permettant de qualifier une compensation de service public comme non-aide d’État."], ["De minimis", "Règle européenne : aides publiques < 200 k€ sur 3 exercices fiscaux = pas besoin de notification à la Commission."], ["CMA", "Coût Marginal d’Abattement. Coût supplémentaire pour éviter 1 tonne de CO₂. CMA = ΔCCV / ΔCO₂. Exprimé en €/tCO₂."], ["tCO₂", "Tonne de CO₂ équivalent. Unité de mesure des émissions de gaz à effet de serre. Le MDO émet ~3,2 tCO₂ par tonne brulée."], ["P&I", "Protection & Indemnity. Assurance responsabilité civile maritime (dommages aux tiers, pollution, passagers)."], ["H&M", "Hull & Machinery. Assurance corps et machine du navire (dommages au navire lui-même)."], ["Dry-dock", "Cale sèche. Passage obligatoire tous les 5 ans (Division 218) pour carénage, inspection sous-marine, traitements antifouling."], ["VR", "Valeur Résiduelle. Valeur estimée du navire en fin de période d’analyse. Déduite du CCV."], ["Contingency", "Provision pour aléas. Marge de sécurité ajoutée à l’investissement pour couvrir les imprévus. Standard maritime : 10-15%."], ["Actualisation", "Technique financière qui ramène les coûts futurs en euros d’aujourd’hui. Un euro dans 10 ans vaut moins qu’un euro aujourd’hui. Le taux d’actualisation (5% = standard) traduit ce « coût du temps »."]].map(([term, def], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "py-1 border-b",
    style: {
      borderColor: "#e0e0e0"
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: T
    }
  }, term), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: BODY
    }
  }, def))))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-0.5 px-2 py-1 overflow-x-auto",
    style: {
      background: "white",
      borderBottom: "1px solid #eee"
    }
  }, tabs.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setStep(i + 1),
    className: "px-2 py-1 rounded text-xs whitespace-nowrap shrink-0",
    style: {
      backgroundColor: step === i + 1 ? T : "transparent",
      color: step === i + 1 ? "white" : "#888",
      fontWeight: step === i + 1 ? 700 : 400
    }
  }, s.i, " ", s.l))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-3 py-3"
  }, step === 1 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "🚢 Fiche navire"), /*#__PURE__*/React.createElement(Cd, {
    title: "Identité"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-2"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Nom projet",
    v: proj.name,
    onChange: v => upd(p => ({
      ...p,
      name: v
    })),
    t: "text",
    h: "Le nom de votre étude de transition. Ex: «Transition Bac de Loire 2027» ou «Hybridation Navette Bréhat»."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Nom navire",
    v: proj.v.name,
    onChange: v => uV("name", v),
    t: "text",
    h: "Le nom officiel du navire, tel qu’inscrit au rôle d’équipage ou au certificat d’immatriculation. Si plusieurs navires, créez un projet par navire."
  }), /*#__PURE__*/React.createElement(Se, {
    l: "Type",
    v: proj.v.type,
    onChange: apDef,
    opts: VT.filter(t => showAdv || !t.adv).map(t => ({
      v: t.id,
      l: t.l
    })),
    h: "Le segment d’activité principal de votre navire. Ce choix pré-remplit tous les paramètres techniques avec des valeurs moyennes du segment. Vous pouvez les ajuster ensuite. Activez ⚙ pour les segments spécialisés (remorqueur, drague, etc.)."
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "Technique"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-2"
  }, /*#__PURE__*/React.createElement(In, {
    l: "LOA",
    v: proj.v.loa,
    onChange: v => uV("loa", v),
    u: "m",
    h: "Longueur hors tout du navire en mètres. Source : certificat de jauge ou permis de navigation."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Jauge",
    v: proj.v.gt,
    onChange: v => uV("gt", v),
    u: "GT",
    h: "Jauge brute (Gross Tonnage). Source : certificat international de jaugeage (ITC 69). Important pour la réglementation : seuil de 500 GT pour nombre d’inspections."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Puiss.",
    v: proj.v.pP,
    onChange: v => uV("pP", v),
    u: "kW",
    h: "Puissance propulsive installée en kW. Source : certificat moteur ou livret moteur. Si bi-motorisation, indiquer la somme des deux moteurs."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Pointe",
    v: proj.v.pPeak,
    onChange: v => uV("pPeak", v),
    u: "kW",
    n: "Dim. batteries",
    h: "Puissance maximale instantanée (pic de manœuvre, accostage, courant). Généralement 120-150% de la puissance nominale. Sert au dimensionnement des batteries (contrainte puissance)."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Vitesse",
    v: proj.v.spd,
    onChange: v => uV("spd", v),
    u: "nds",
    h: "Vitesse de croisière en nœuds (pas la vitesse max). Source : essais en mer ou programme d’exploitation. Sert au calcul des distances en NM."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Conso",
    v: proj.v.fc,
    onChange: v => uV("fc", v),
    u: "L/h",
    h: "Consommation horaire de MDO en litres par heure, en régime de croisière. Source : factures soutes ÷ heures moteur (compteur), ou relevés bord journaliers. En cas de doute, demandez à votre chef mécanicien."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Pax",
    v: proj.v.pax,
    onChange: v => uV("pax", v),
    h: "Capacité maximale passagers certifiée. Source : permis de navigation ou fiche de sécurité. Pour les navires de charge, laisser à 0."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Véh.",
    v: proj.v.veh,
    onChange: v => uV("veh", v),
    h: "Capacité véhicules (voitures particulières). Source : plan de chargement ou permis de navigation. Laisser à 0 pour les navettes passagers purs."
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "Exploitation"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 sm:grid-cols-5 gap-2"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Jours/an",
    v: proj.v.opD,
    onChange: v => uV("opD", v),
    h: "Nombre de jours d’exploitation par an. Source : calendrier DSP ou bilan d’exploitation. Déduisez les arrêts techniques et le chômage hivernal. Typiquement 280-340 j/an pour un bac, 220-280 pour une vedette saisonnière."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Rot/j",
    v: proj.v.rD,
    onChange: v => uV("rD", v),
    h: "Nombre de traversées (rotations) par jour. Source : programme horaire. Un bac estuarien fait typiquement 30-50 rot/j, un ferry 4-8, une navette 20-30. C’est le paramètre le plus sensible pour le modèle batteries."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Durée trav.",
    v: proj.v.cDur,
    onChange: v => uV("cDur", v),
    u: "min",
    h: "Durée d’une traversée en minutes, du largé des amarres à l’accostage. Source : horaires. Sert au calcul de la consommation et au dimensionnement énergétique des batteries."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Temps quai",
    v: proj.v.qT,
    onChange: v => uV("qT", v),
    u: "min",
    h: "Temps d’escale entre deux traversées (embarquement/débarquement). Détermine le temps de charge disponible pour les batteries. Un bac = 5-10 min, un ferry = 20-45 min."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Cycle DD",
    v: proj.v.ddC,
    onChange: v => uV("ddC", v),
    u: "ans",
    h: "Intervalle entre deux passages en cale sèche (dry-dock). Généralement 5 ans (réglementation Division 218). Source : plan de visite du navire."
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "Profil de charge (%)",
    accent: T
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2"
  }, /*#__PURE__*/React.createElement(In, {
    l: "% Transit",
    v: proj.v.pTr || 60,
    onChange: v => uV("pTr", v),
    u: "%",
    n: "Pleine puissance (" + proj.v.pP + " kW)",
    h: "Part du temps passé en navigation à vitesse de croisière. Le moteur tourne à régime nominal. Pour un ferry avec long transit, c’est 70%. Pour un bac avec courts trajets et beaucoup d’accostages, c’est 30-40%."
  }), /*#__PURE__*/React.createElement(In, {
    l: "% Manœuvre",
    v: proj.v.pMa || 20,
    onChange: v => uV("pMa", v),
    u: "%",
    n: "Pointe (" + proj.v.pPeak + " kW)",
    h: "Part du temps en manœuvre (accostage, appareillage, évitement). La puissance demandée est plus élevée (pointe). Les bacs et lamaneurs ont un % élevé (30-60%). Les ferries, 10-15%."
  }), /*#__PURE__*/React.createElement(In, {
    l: "% Quai / attente",
    v: proj.v.pQu || 20,
    onChange: v => uV("pQu", v),
    u: "%",
    n: "Auxiliaires (" + proj.v.pA + " kW)",
    h: "Part du temps à quai, rampe ouverte, moteurs au ralenti ou auxiliaires. Seuls les auxiliaires consomment. Le total des 3 modes doit faire 100%."
  })), (() => {
    const tot = (proj.v.pTr || 60) + (proj.v.pMa || 20) + (proj.v.pQu || 20);
    return tot !== 100 ? /*#__PURE__*/React.createElement("p", {
      className: "text-xs font-bold mt-1",
      style: {
        color: AC
      }
    }, "⚠", " Total: ", tot, "% (doit ", "ê", "tre 100%)") : null;
  })(), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1",
    style: {
      color: "#999"
    }
  }, "Le profil détermine la consommation réelle : un bac (30% manœuvre) consomme différemment d’un ferry (15% manœuvre). Facteur de charge calculé : ", /*#__PURE__*/React.createElement("b", null, ((proj.v.pTr || 60) / 100 + (proj.v.pMa || 20) / 100 * Math.min(proj.v.pPeak / proj.v.pP, 1.5) + (proj.v.pQu || 20) / 100 * (proj.v.pA / proj.v.pP)).toFixed(2)), " (remplace le coefficient 0,85 forfaitaire).")), /*#__PURE__*/React.createElement(Cd, {
    title: "Économie"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-2"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Val. marché",
    v: proj.v.mktV,
    onChange: v => uV("mktV", v),
    u: "k€",
    h: "Valeur vénale actuelle du navire (prix de revente). Source : estimation courtier maritime, ou valeur assurée. Sert au calcul de la valeur résiduelle en fin de période."
  }), /*#__PURE__*/React.createElement(In, {
    l: "OPEX/an",
    v: proj.v.opex,
    onChange: v => uV("opex", v),
    u: "k€",
    h: "Coûts d’exploitation annuels HORS énergie et équipage : entretien courant, pièces, peintures, consommables, frais de port, redevances. Source : bilan comptable (poste charges externes)."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Équipage",
    v: proj.v.crew,
    onChange: v => uV("crew", v),
    u: "k€",
    h: "Coût total annuel de l’équipage : salaires bruts + charges patronales + nourriture + remplacement congés. Source : bilan social ou masse salariale comptable du navire."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Assurance",
    v: proj.v.ins,
    onChange: v => uV("ins", v),
    u: "k€",
    h: "Prime annuelle d’assurance corps et machine (P&I + H&M). Source : appel de cotisation assureur. Attention : l’électrification peut générer une surprime de 20-40%."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Dry-dock",
    v: proj.v.dd,
    onChange: v => uV("dd", v),
    u: "k€",
    h: "Coût d’un arrêt technique complet en cale sèche : location bassin, carénage, traitements, main d’œuvre, expertise. Source : dernière facture de chantier naval."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Recettes",
    v: proj.v.rev,
    onChange: v => uV("rev", v),
    u: "k€",
    h: "Chiffre d’affaires annuel de la ligne : billetterie + subvention d’exploitation DSP + fret. Source : compte d’exploitation ou rapport du délégataire. Sert au calcul du FCF (flux de trésorerie)."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Dette",
    v: proj.v.debt,
    onChange: v => uV("debt", v),
    u: "k€",
    h: "Encours de dette résiduelle sur le navire (emprunt en cours). 0 si le navire est amorti. Source : tableau d’amortissement bancaire."
  }), /*#__PURE__*/React.createElement(In, {
    l: "DSP rest.",
    v: proj.v.dspR,
    onChange: v => uV("dspR", v),
    u: "ans",
    h: "Durée restante de la Délégation de Service Public. Source : contrat de DSP. Si pas de DSP (exploitation libre), mettre 0. La DSP conditionne l’horizon d’investissement."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Vie résid.",
    v: proj.v.lifeR,
    onChange: v => uV("lifeR", v),
    u: "ans",
    h: "Durée de vie résiduelle estimée du navire avant remplacement. Estimation du capitaine ou du bureau d’études. Sert au calcul de la valeur résiduelle en fin d’analyse."
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "Paramètres CCV"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 sm:grid-cols-5 gap-2"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Année",
    v: proj.p.sy,
    onChange: v => uP("sy", v),
    h: "Année de début de l’analyse. Généralement l’année en cours ou la date prévue de début des travaux de conversion."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Durée",
    v: proj.p.dur,
    onChange: v => uP("dur", v),
    u: "ans",
    h: "Horizon d’analyse en années. 10 ans est un standard pour le CCV maritime. Alignez sur la durée de la DSP si pertinent. Maximum 20-25 ans pour une durée de vie complète."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Actu.",
    v: proj.p.disc,
    onChange: v => uP("disc", v),
    u: "%",
    h: "Taux d’actualisation : représente le coût du temps (un euro demain vaut moins qu’un euro aujourd’hui). 5% est un taux courant pour les projets publics (recommandation France Stratégie). Baissez à 3-4% pour projets soutenus par collectivité."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Cont.",
    v: proj.p.cont,
    onChange: v => uP("cont", v),
    u: "%",
    h: "Provision pour aléas et imprévus, appliquée sur l’investissement total. 10-15% en phase étude, 5-10% en phase projet détaillé. Standard maritime : 12%."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Fuel",
    v: proj.p.fpG,
    onChange: v => uP("fpG", v),
    u: "%/an",
    h: "Hausse annuelle prévue du prix du MDO. 3% est une hypothèse conservatrice (moyenne historique). Montez à 5% pour un scénario de transition énergétique accélérée (taxe carbone)."
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement(Next, {
    to: 2,
    l: "Référentiel"
  }))), step === 2 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "📚 Référentiel éditable"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "Le référentiel contient les ", /*#__PURE__*/React.createElement("b", null, "prix des carburants"), " (en € par tonne) et les ", /*#__PURE__*/React.createElement("b", null, "facteurs d’émission CO₂"), " (tonnes de CO₂ émises par tonne de carburant brûlé). Les valeurs par défaut sont des moyennes 2025. Si vous connaissez le prix réel que vous payez chez votre souteur (fournisseur de carburant), remplacez-le ici."), /*#__PURE__*/React.createElement(Cd, {
    title: "Prix des carburants et facteurs CO₂"
  }, DEF_FUELS.filter(f => showAdv || !f.adv).map(f => {
    const ref = proj.ref?.fuels?.find(x => x.id === f.id);
    const p = ref?.price ?? f.price;
    const c = ref?.co2 ?? f.co2;
    return /*#__PURE__*/React.createElement("div", {
      key: f.id,
      className: "flex flex-wrap items-center gap-2 mb-2 p-2 rounded",
      style: {
        background: LB
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-bold w-32"
    }, f.l, f.adv ? " ☆" : ""), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1"
    }, /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: p,
      onChange: e => uRef(f.id, "price", parseFloat(e.target.value) || 0),
      className: "border rounded px-1 py-0.5 text-xs w-16",
      style: {
        borderColor: "#ddd"
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        color: "#999"
      }
    }, "€/", f.unit || "t")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1"
    }, /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: c,
      onChange: e => uRef(f.id, "co2", parseFloat(e.target.value) || 0),
      className: "border rounded px-1 py-0.5 text-xs w-16",
      style: {
        borderColor: "#ddd"
      },
      step: "0.001"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        color: "#999"
      }
    }, "tCO₂/t")), (p !== f.price || c !== f.co2) && /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        color: W
      }
    }, "• modifié"));
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => upd(p => ({
      ...p,
      ref: {
        fuels: DEF_FUELS.map(f => ({
          id: f.id,
          price: f.price,
          co2: f.co2
        }))
      }
    })),
    className: "text-xs px-3 py-1 rounded mt-2",
    style: {
      border: "1px solid #ddd"
    }
  }, "Réinitialiser les valeurs par défaut")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 1
  }), /*#__PURE__*/React.createElement(Next, {
    to: 3,
    l: "Trajectoires"
  }))), step === 3 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "🔀 Trajectoires"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "Une ", /*#__PURE__*/React.createElement("b", null, "trajectoire"), " est un scénario de transition. La première (« Référence ») représente la situation actuelle (100% MDO = gazole marin). Les 3 suivantes sont des alternatives que vous configurez : changement de carburant, ajout de technologies, investissements nécessaires. Le ", /*#__PURE__*/React.createElement("b", null, "mix énergétique"), " indique la répartition (en %) entre les carburants. Il peut évoluer dans le temps grâce aux ", /*#__PURE__*/React.createElement("b", null, "paliers de transition"), "."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1 mb-3 overflow-x-auto"
  }, proj.trajs.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setET(i),
    className: "px-2 py-1 rounded text-xs font-bold shrink-0",
    style: {
      backgroundColor: eT === i ? CL[i] : "white",
      color: eT === i ? "white" : CL[i],
      border: "2px solid " + CL[i]
    }
  }, t.name.slice(0, 12)))), (() => {
    const ti = eT;
    const tj = proj.trajs[ti];
    const mix = tj.fuelMix || {};
    return /*#__PURE__*/React.createElement(Cd, {
      accent: CL[ti]
    }, /*#__PURE__*/React.createElement(In, {
      l: "Nom",
      v: tj.name,
      onChange: v => uTj(ti, "name", v),
      t: "text",
      h: "Donnez un nom parlant à cette trajectoire. Ex: « Hybride B30+élec 2028 » ou « Full électrique 2030 ». Ce nom apparaîtra dans tous les graphiques et exports."
    }), /*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-xs mt-3 mb-1",
      style: {
        color: D
      }
    }, "Mix énergétique de départ (%)"), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 sm:grid-cols-4 gap-2"
    }, DEF_FUELS.filter(f => f.id !== "ops" && (showAdv || !f.adv)).map(f => /*#__PURE__*/React.createElement(In, {
      key: f.id,
      l: f.l + (f.adv ? " ☆" : ""),
      v: mix[f.id] || 0,
      onChange: v => {
        const m = {
          ...mix,
          [f.id]: v
        };
        uTj(ti, "fuelMix", m);
      },
      u: "%",
      n: f.note
    }))), (() => {
      const tot = Object.values(mix).reduce((a, b) => a + b, 0);
      return tot > 0 && tot !== 100 ? /*#__PURE__*/React.createElement("p", {
        className: "text-xs font-bold",
        style: {
          color: AC
        }
      }, "⚠ Total: ", tot, "%") : null;
    })(), ti > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-xs mt-3 mb-1",
      style: {
        color: D
      }
    }, "📅 Évolution temporelle du mix ", /*#__PURE__*/React.createElement("span", {
      className: "font-normal",
      style: {
        color: "#999"
      }
    }, "(optionnel — paliers par année)")), (tj.mixSteps || []).map((ms, si) => /*#__PURE__*/React.createElement("div", {
      key: si,
      className: "p-2 rounded mb-2",
      style: {
        background: LB,
        borderLeft: "3px solid " + T
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between mb-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-bold",
      style: {
        color: T
      }
    }, "À partir de ", ms.year), /*#__PURE__*/React.createElement("button", {
      onClick: () => uTj(ti, "mixSteps", (tj.mixSteps || []).filter((_, j) => j !== si)),
      className: "text-xs",
      style: {
        color: AC
      }
    }, "✕")), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 sm:grid-cols-4 gap-1"
    }, DEF_FUELS.filter(f => f.id !== "ops" && (showAdv || !f.adv)).map(f => /*#__PURE__*/React.createElement("div", {
      key: f.id,
      className: "flex items-center gap-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-xs w-12 truncate"
    }, f.l), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: ms.mix?.[f.id] || 0,
      onChange: e => {
        const steps = [...(tj.mixSteps || [])];
        steps[si] = {
          ...steps[si],
          mix: {
            ...steps[si].mix,
            [f.id]: parseFloat(e.target.value) || 0
          }
        };
        uTj(ti, "mixSteps", steps);
      },
      className: "border rounded px-1 py-0.5 text-xs w-12",
      style: {
        borderColor: "#ddd"
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        color: "#ccc"
      }
    }, "%")))), (() => {
      const t2 = Object.values(ms.mix || {}).reduce((a, b) => a + b, 0);
      return t2 > 0 && t2 !== 100 ? /*#__PURE__*/React.createElement("p", {
        className: "text-xs",
        style: {
          color: AC
        }
      }, "⚠ ", t2, "%") : null;
    })())), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        const nextY = proj.p.sy + Math.min(((tj.mixSteps || []).length + 1) * 3, proj.p.dur);
        uTj(ti, "mixSteps", [...(tj.mixSteps || []), {
          year: nextY,
          mix: {
            ...mix
          }
        }]);
      },
      className: "text-xs px-3 py-1 rounded mb-3",
      style: {
        border: "1px solid " + T,
        color: T
      }
    }, "+ Ajouter un palier de transition")), ti > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-xs mt-4 mb-1",
      style: {
        color: D
      }
    }, "Technologies"), TECHS.filter(t => showAdv || !t.adv).map(tech => {
      const cfg = tj.techs?.[tech.id] || {};
      return /*#__PURE__*/React.createElement("div", {
        key: tech.id,
        className: "flex flex-wrap items-center gap-2 p-1.5 rounded mb-1",
        style: {
          background: cfg.a ? LB : "transparent"
        }
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        checked: !!cfg.a,
        onChange: e => {
          const ts = {
            ...tj.techs
          };
          ts[tech.id] = {
            ...cfg,
            a: e.target.checked,
            year: cfg.year || proj.p.sy
          };
          uTj(ti, "techs", ts);
        }
      }), /*#__PURE__*/React.createElement("span", {
        className: "text-xs font-medium"
      }, tech.l, tech.adv ? " ☆" : ""), /*#__PURE__*/React.createElement("span", {
        className: "text-xs",
        style: {
          color: "#999"
        }
      }, (tech.gL * 100).toFixed(0), "-", (tech.gH * 100).toFixed(0), "%"), tech.n && /*#__PURE__*/React.createElement("span", {
        className: "text-xs",
        style: {
          color: W
        }
      }, tech.n), cfg.a && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
        className: "text-xs",
        style: {
          color: T
        }
      }, "⏱ ", tech.retro), /*#__PURE__*/React.createElement("input", {
        type: "number",
        value: cfg.year || proj.p.sy,
        onChange: e => {
          const ts = {
            ...tj.techs
          };
          ts[tech.id] = {
            ...cfg,
            year: parseInt(e.target.value) || proj.p.sy
          };
          uTj(ti, "techs", ts);
        },
        className: "border rounded px-1 py-0.5 text-xs w-16"
      })));
    }), /*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-xs mt-4 mb-1",
      style: {
        color: D
      }
    }, "Investissements (k€)"), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 sm:grid-cols-4 gap-2"
    }, /*#__PURE__*/React.createElement(In, {
      l: "Coque",
      v: tj.iC || 0,
      onChange: v => uTj(ti, "iC", v),
      u: "k€",
      h: "Investissement coque : travaux de modification structurelle du navire (renfort pont batterie, modification salle machine, intégration équipements). Source : devis chantier naval."
    }), /*#__PURE__*/React.createElement(In, {
      l: "Énergie",
      v: tj.iE || 0,
      onChange: v => uTj(ti, "iE", v),
      u: "k€",
      n: "Batteries",
      h: "Investissement système énergétique : batteries, convertisseurs, transformateurs, moteurs électriques, système de gestion (BMS). Source : devis fournisseur (Corvus, Leclanché, CATL...) ou bureau d’études."
    }), /*#__PURE__*/React.createElement(In, {
      l: "Infra terre",
      v: tj.iI || 0,
      onChange: v => uTj(ti, "iI", v),
      u: "k€",
      h: "Infrastructure à terre : poste de charge, câblage quai, armoire électrique, génie civil, bras de connexion automatique. Source : devis électricien portuaire ou bureau d’études."
    }), /*#__PURE__*/React.createElement(In, {
      l: "Réseau",
      v: tj.gridCost || 0,
      onChange: v => uTj(ti, "gridCost", v),
      u: "k€",
      n: "ENEDIS",
      h: "Raccordement au réseau électrique : étude ENEDIS/Enedis + travaux de renforcement si nécessaire. ATTENTION : délai 3-6 mois pour l’étude + 12-24 mois pour les travaux. C’est souvent le chemin critique du projet."
    }))));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 2
  }), /*#__PURE__*/React.createElement(Next, {
    to: 4,
    l: "Batteries"
  }))), step === 4 && batt && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "🔋 Batteries"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "Cet onglet calcule automatiquement la ", /*#__PURE__*/React.createElement("b", null, "taille des batteries"), " nécessaires et leur ", /*#__PURE__*/React.createElement("b", null, "durée de vie"), ". La capacité (en kWh = énergie stockable) dépend de votre traversée et de la puissance demandée. Le ", /*#__PURE__*/React.createElement("b", null, "DoD"), " (profondeur de décharge) est le % de batterie utilisé à chaque traversée — plus il est élevé, plus la batterie s’use vite. Les batteries ", /*#__PURE__*/React.createElement("b", null, "LFP"), " (Lithium Fer Phosphate) sont privilégiées en maritime car plus sûres."), /*#__PURE__*/React.createElement(Cd, {
    title: "Dimensionnement"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-3"
  }, /*#__PURE__*/React.createElement(St, {
    l: "Capacité",
    v: batt.kWh + " kWh",
    c: T
  }), /*#__PURE__*/React.createElement(St, {
    l: "Contrainte",
    v: batt.constraint === "puissance" ? "Puissance" : "Energy",
    c: batt.constraint === "puissance" ? AC : GR
  }), /*#__PURE__*/React.createElement(St, {
    l: "Chargeur",
    v: batt.chargePower + " kW"
  }), /*#__PURE__*/React.createElement(St, {
    l: "Temps charge",
    v: proj.v.qT + " min"
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 p-2 rounded text-xs",
    style: {
      background: LB
    }
  }, /*#__PURE__*/React.createElement("b", null, "Estimation :"), " Batteries ", fK(batt.costBatt), " + Chargeur ", fK(batt.costCharger), " + Réseau ", fK(batt.gridConnect), " = ", /*#__PURE__*/React.createElement("b", null, fK(batt.costBatt + batt.costCharger + batt.gridConnect)))), /*#__PURE__*/React.createElement(Cd, {
    title: "Modèle de dégradation par cyclage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-3"
  }, /*#__PURE__*/React.createElement(St, {
    l: "DoD par traversée",
    v: batt.dod + "%",
    c: batt.dod > 60 ? W : GR
  }), /*#__PURE__*/React.createElement(St, {
    l: "Cycles équiv./an",
    v: fmt(batt.eqCyclesAn),
    c: batt.eqCyclesAn > 3000 ? AC : batt.eqCyclesAn > 1500 ? W : GR
  }), /*#__PURE__*/React.createElement(St, {
    l: "Durée de vie pack",
    v: batt.lifeYrs + " ans",
    c: batt.lifeYrs < 6 ? AC : batt.lifeYrs < 10 ? W : GR
  }), /*#__PURE__*/React.createElement(St, {
    l: "Cycles vie LFP",
    v: "4 000",
    c: "#999"
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 text-xs",
    style: {
      color: "#666"
    }
  }, /*#__PURE__*/React.createElement("p", null, "Le DoD (Depth of Discharge) par traversée est de ", batt.dod, "% de la capacité installée. Les cycles équivalents intègrent ce DoD partiel : ", proj.v.rD, " rot/j × ", proj.v.opD, " j/an × ", batt.dod, "% DoD / 80% = ", fmt(batt.eqCyclesAn), " cycles équivalents/an. ", batt.lifeYrs < 8 ? "Prévoir 2 jeux de batteries sur la durée d’analyse." : "Compatible avec un seul jeu sur 10 ans."))), /*#__PURE__*/React.createElement(Cd, {
    title: "Risques électrification"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-1"
  }, /*#__PURE__*/React.createElement("p", null, "• ", /*#__PURE__*/React.createElement("b", null, "ENEDIS :"), " Étude 3-6 mois + renforcement 12-24 mois. Risque critique."), /*#__PURE__*/React.createElement("p", null, "• ", /*#__PURE__*/React.createElement("b", null, "Dégradation :"), " ", batt.eqCyclesAn, " cycles/an → remplacement tous les ", batt.lifeYrs, " ans (coût ~", fK(batt.costBatt * 0.7), "/remplacement)."), /*#__PURE__*/React.createElement("p", null, "• ", /*#__PURE__*/React.createElement("b", null, "Redondance :"), " Diesel secours obligatoire. +100-300 k€."), /*#__PURE__*/React.createElement("p", null, "• ", /*#__PURE__*/React.createElement("b", null, "Assurance :"), " Surprime +20-40% (emballement thermique)."))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 3
  }), /*#__PURE__*/React.createElement(Next, {
    to: 5,
    l: "CCV"
  }))), step === 5 && res && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "📊 Résultats CCV (Coût de Cycle de Vie)"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "Le ", /*#__PURE__*/React.createElement("b", null, "CCV"), " est la somme de tous les coûts sur la durée d’analyse (", proj.p.dur, " ans), ramenés en euros d’aujourd’hui grâce au taux d’actualisation (", proj.p.disc, "%). Chaque trajectoire est calculée en 3 scénarios : ", /*#__PURE__*/React.createElement("b", null, "Base"), " (hypothèses centrales), ", /*#__PURE__*/React.createElement("b", null, "Dégradé"), " (technologies moins performantes, -30%), ", /*#__PURE__*/React.createElement("b", null, "Favorable"), " (performances supérieures, +20%). Un CCV plus bas = une option plus économique sur la durée."), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3"
  }, res.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "rounded-xl p-3 text-center",
    style: {
      background: "white",
      borderTop: "3px solid " + CL[i]
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold truncate",
    style: {
      color: CL[i]
    }
  }, r.name), /*#__PURE__*/React.createElement("div", {
    className: "text-base font-bold"
  }, fK(r.base.ccv)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, fmt(Math.round(r.base.co2)), " tCO₂"), i > 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold",
    style: {
      color: r.base.ccv < res[0].base.ccv ? GR : AC
    }
  }, r.base.ccv < res[0].base.ccv ? "▼" : "▲", fK(Math.abs(r.base.ccv - res[0].base.ccv)))))), /*#__PURE__*/React.createElement(Cd, {
    title: "Décomposition"
  }, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 240
  }, /*#__PURE__*/React.createElement(BarChart, {
    data: res.map(r => ({
      n: r.name.slice(0, 8),
      I: Math.round(r.totI),
      E: Math.round(r.base.yrs.reduce((s, y) => s + y.ex, 0)),
      En: Math.round(r.base.yrs.reduce((s, y) => s + y.en, 0)),
      Cr: Math.round(r.base.yrs.reduce((s, y) => s + y.cr, 0)),
      As: Math.round(r.base.yrs.reduce((s, y) => s + y.ins, 0)),
      AT: Math.round(r.base.yrs.reduce((s, y) => s + y.dd, 0))
    }))
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "n",
    tick: {
      fontSize: 9
    }
  }), /*#__PURE__*/React.createElement(YAxis, {
    tick: {
      fontSize: 9
    }
  }), /*#__PURE__*/React.createElement(Tooltip, {
    formatter: v => fmt(v) + " k€"
  }), /*#__PURE__*/React.createElement(Legend, {
    wrapperStyle: {
      fontSize: 9
    }
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "I",
    name: "Invest.",
    stackId: "a",
    fill: D
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "E",
    name: "Exploit.",
    stackId: "a",
    fill: "#64748b"
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "En",
    name: "Énergie",
    stackId: "a",
    fill: T
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "Cr",
    name: "Équip.",
    stackId: "a",
    fill: PU
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "As",
    name: "Assur.",
    stackId: "a",
    fill: W
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "AT",
    name: "Arrêts",
    stackId: "a",
    fill: AC
  })))), /*#__PURE__*/React.createElement(Cd, {
    title: "Écarts cumulés"
  }, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 200
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: res[0].base.yrs.map((_, yi) => {
      const d = {
        yr: res[0].base.yrs[yi].yr
      };
      res.slice(1).forEach(r => {
        d[r.name.slice(0, 8)] = Math.round(r.base.yrs[yi].cC - res[0].base.yrs[yi].cC);
      });
      return d;
    })
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "yr",
    tick: {
      fontSize: 9
    }
  }), /*#__PURE__*/React.createElement(YAxis, {
    tick: {
      fontSize: 9
    }
  }), /*#__PURE__*/React.createElement(Tooltip, null), /*#__PURE__*/React.createElement(Legend, {
    wrapperStyle: {
      fontSize: 9
    }
  }), /*#__PURE__*/React.createElement(ReferenceLine, {
    y: 0,
    stroke: "#ccc"
  }), res.slice(1).map((r, i) => /*#__PURE__*/React.createElement(Line, {
    key: i,
    type: "monotone",
    dataKey: r.name.slice(0, 8),
    stroke: CL[i + 1],
    strokeWidth: 2,
    dot: false
  }))))), /*#__PURE__*/React.createElement(Cd, {
    title: "Stress tests"
  }, /*#__PURE__*/React.createElement(Tbl, {
    cols: ["Trajectoire", "Base", "Dégradé", "Favorable"],
    rows: res.map((r, i) => [/*#__PURE__*/React.createElement("b", {
      style: {
        color: CL[i]
      }
    }, r.name.slice(0, 12)), fK(r.base.ccv), fK(r.deg.ccv), fK(r.fav.ccv)]),
    ws: [3, 2, 2, 2]
  })), (proj.v.pax > 0 || proj.v.veh > 0) && /*#__PURE__*/React.createElement(Cd, {
    title: "Benchmark coût/pax-NM (ou véh-NM)"
  }, (() => {
    const u = proj.v.pax > 0 ? proj.v.pax : proj.v.veh;
    const ul = proj.v.pax > 0 ? "pax" : "véh";
    const dist = proj.v.cDur / 60 * proj.v.spd;
    const trAn = proj.v.rD * proj.v.opD;
    const paxNmAn = u * 0.65 * trAn * dist;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
      className: "text-xs mb-2",
      style: {
        color: "#999"
      }
    }, "Distance traversée estimée : ", dist.toFixed(1), " NM | ", fmt(trAn), " traversées/an | ", fmt(Math.round(paxNmAn)), " ", ul, "-NM/an"), /*#__PURE__*/React.createElement(Tbl, {
      cols: ["Trajectoire", "CCV/an", "€/" + ul + "-NM", "tCO₂/M " + ul + "-NM"],
      rows: res.map((r, i) => {
        const ccvAn = r.base.ccv / proj.p.dur;
        const cpnm = paxNmAn > 0 ? (ccvAn * 1000 / paxNmAn).toFixed(3) : "—";
        const co2pnm = paxNmAn > 0 ? (r.base.co2 / proj.p.dur / (paxNmAn / 1e6)).toFixed(1) : "—";
        return [/*#__PURE__*/React.createElement("b", {
          style: {
            color: CL[i]
          }
        }, r.name.slice(0, 12)), fK(ccvAn), cpnm, co2pnm];
      }),
      ws: [3, 2, 2, 2]
    }));
  })()), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 4
  }), /*#__PURE__*/React.createElement(Next, {
    to: 6,
    l: "Finance"
  }))), step === 6 && res && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "💰 Financement"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "Cet onglet évalue la ", /*#__PURE__*/React.createElement("b", null, "bancabilité"), " de votre projet. Le ", /*#__PURE__*/React.createElement("b", null, "FCF"), " (Free Cash Flow) est le flux de trésorerie restant après toutes les charges : recettes − OPEX − énergie − équipage − assurance. Le ", /*#__PURE__*/React.createElement("b", null, "DSCR"), " (ratio de couverture de dette) = FCF ÷ annuité de remboursement. Au-dessus de 1,2x, un banquier considère le projet finançable. Le ", /*#__PURE__*/React.createElement("b", null, "LTV"), " (Loan-to-Value) compare le montant emprunté à la valeur du navire."), /*#__PURE__*/React.createElement(Cd, {
    title: "Grille DSCR"
  }, /*#__PURE__*/React.createElement(Tbl, {
    cols: ["Profil", "DSCR", "LTV", "Maturité"],
    rows: DSCR_GRID.map(g => [g.profil, g.dscr, g.ltv, g.dur]),
    ws: [5, 2, 2, 2]
  })), res.filter((_, i) => i > 0 && res[i].totI > 0).map(r => {
    const v = proj.v;
    const tj = proj.trajs[r.idx];
    const ann = v.rev - v.opex - (r.base.yrs[1]?.en || 0) - v.crew - v.ins;
    const dscr = r.totI > 0 ? ann / (r.totI / proj.p.dur) : 0;
    const sub = r.totI * 0.25;
    const det = Math.min(r.totI * 0.7, ann * proj.p.dur * 0.8);
    const fp = Math.max(0, r.totI - det - sub);
    return /*#__PURE__*/React.createElement(Cd, {
      key: r.idx,
      title: r.name,
      accent: CL[r.idx]
    }, /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3"
    }, /*#__PURE__*/React.createElement(St, {
      l: "FCF/an",
      v: fK(ann),
      c: ann > 0 ? GR : AC
    }), /*#__PURE__*/React.createElement(St, {
      l: "DSCR",
      v: dscr.toFixed(2) + "x",
      c: dscr >= 1.2 ? GR : dscr >= 1 ? W : AC
    }), /*#__PURE__*/React.createElement(St, {
      l: "Invest.",
      v: fK(r.totI)
    }), /*#__PURE__*/React.createElement(St, {
      l: "LTV",
      v: det > 0 ? Math.round(det / v.mktV * 100) + "%" : "—"
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 gap-4 text-xs"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
      style: {
        color: "#999"
      }
    }, "EMPLOIS"), [["Coque", tj.iC || 0], ["Énergie", tj.iE || 0], ["Infra", tj.iI || 0], ["Réseau", tj.gridCost || 0], ["Cont.", r.totI - (tj.iC || 0) - (tj.iE || 0) - (tj.iI || 0) - (tj.gridCost || 0)]].map(([l, v], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "flex justify-between mt-0.5"
    }, /*#__PURE__*/React.createElement("span", null, l), /*#__PURE__*/React.createElement("span", null, fK(v))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
      style: {
        color: "#999"
      }
    }, "SOURCES"), [["Fonds propres", fp], ["Dette ~70%", det], ["Subventions ~25%", sub]].map(([l, v], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "flex justify-between mt-0.5"
    }, /*#__PURE__*/React.createElement("span", null, l), /*#__PURE__*/React.createElement("span", null, fK(v)))))));
  }), /*#__PURE__*/React.createElement(Cd, {
    title: "Modes de financement"
  }, /*#__PURE__*/React.createElement(Tbl, {
    cols: ["Mode", "Actif", "Bilan", "Risque VR"],
    rows: FIN_MODES.map(m => [/*#__PURE__*/React.createElement("b", null, m.mode), m.actif, m.bilan, m.rv]),
    ws: [3, 2, 3, 2]
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: "#999"
    }
  }, "* Art. L.5114-2 C. transports : batteries intégrées = accessoires du navire.")), /*#__PURE__*/React.createElement(Cd, {
    title: "Sûretés et montages juridiques"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-1.5"
  }, SURETES.map((s, i) => /*#__PURE__*/React.createElement("p", {
    key: i
  }, /*#__PURE__*/React.createElement("b", null, s.s, " :"), " ", s.desc)))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 5
  }), /*#__PURE__*/React.createElement(Next, {
    to: 7,
    l: "Aides"
  }))), step === 7 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "🏛 Aides publiques"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "9 dispositifs d’aide mobiliés. Le ", /*#__PURE__*/React.createElement("b", null, "taux"), " est le % du coût éligible couvert. Le ", /*#__PURE__*/React.createElement("b", null, "plafond"), " est le montant maximum. Certaines aides sont ", /*#__PURE__*/React.createElement("b", null, "cumulables"), " entre elles. Règle d’or : ", /*#__PURE__*/React.createElement("b", null, "déposer les demandes AVANT le début des travaux"), ", sinon le bénéfice est perdu. La règle ", /*#__PURE__*/React.createElement("b", null, "Altmark"), " (4 critères) permet de qualifier une compensation de DSP comme non-aide d’État. La règle ", /*#__PURE__*/React.createElement("b", null, "de minimis"), " autorise jusqu’à 200 k€ d’aides sur 3 ans sans notification à Bruxelles."), AIDES.map(a => /*#__PURE__*/React.createElement(Cd, {
    key: a.id
  }, /*#__PURE__*/React.createElement("h4", {
    className: "font-bold text-sm",
    style: {
      color: D
    }
  }, a.nom), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 mt-1 text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: T
    }
  }, "Taux:"), " ", a.taux), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: T
    }
  }, "Plafond:"), " ", a.plf), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: T
    }
  }, "Délai:"), " ", a.del)), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1"
  }, /*#__PURE__*/React.createElement("b", null, "Conditions:"), " ", a.cond, " | ", /*#__PURE__*/React.createElement("b", null, "Calendrier:"), " ", a.cal), a.cum.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-0.5",
    style: {
      color: GR
    }
  }, "✓ Cumulable: ", a.cum.map(c => AIDES.find(x => x.id === c)?.nom.split("—")[0]).join(", ")))), /*#__PURE__*/React.createElement(Cd, {
    title: "Règles",
    accent: W
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-1"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Altmark:"), " 4 critères pour compensation DSP."), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "De minimis:"), " 200k€/3 exercices."), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Antériorité:"), " Demande AVANT travaux."))), /*#__PURE__*/React.createElement(Cd, {
    title: "📅 Rétroplanning indicatif (mois avant début travaux)"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, (() => {
    const timeline = [{
      a: "ADEME",
      start: -10,
      dur: 5,
      c: T
    }, {
      a: "Fonds vert",
      start: -6,
      dur: 3,
      c: GR
    }, {
      a: "Régionales",
      start: -9,
      dur: 4,
      c: PU
    }, {
      a: "FEDER",
      start: -18,
      dur: 8,
      c: AC
    }, {
      a: "France 2030",
      start: -14,
      dur: 7,
      c: W
    }, {
      a: "Bpifrance",
      start: -4,
      dur: 2,
      c: T
    }, {
      a: "Suramort.",
      start: 0,
      dur: 1,
      c: "#999"
    }];
    const minM = -20;
    const range = 22;
    return /*#__PURE__*/React.createElement("div", {
      className: "relative",
      style: {
        minHeight: timeline.length * 28 + 30
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex text-xs mb-1",
      style: {
        color: "#999"
      }
    }, Array.from({
      length: Math.ceil(range / 3) + 1
    }, (_, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "text-center",
      style: {
        width: 3 / range * 100 + "%",
        minWidth: 30
      }
    }, minM + i * 3 >= 0 ? "T" : "M", Math.abs(minM + i * 3)))), timeline.map((t, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "flex items-center mb-1",
      style: {
        height: 22
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-xs w-20 shrink-0 truncate",
      style: {
        color: "#666"
      }
    }, t.a), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 relative h-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute rounded-full h-4",
      style: {
        left: (t.start - minM) / range * 100 + "%",
        width: t.dur / range * 100 + "%",
        backgroundColor: t.c,
        opacity: 0.7
      }
    })))), /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 bottom-0",
      style: {
        left: (0 - minM) / range * 100 + "%",
        width: 2,
        backgroundColor: AC,
        opacity: 0.5
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-center mt-1",
      style: {
        color: AC,
        marginLeft: (0 - minM) / range * 100 + "%"
      }
    }, "Début travaux"));
  })()), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: "#999"
    }
  }, "M = mois avant travaux. T = mois après. Déposer les demandes le plus tôt possible.")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 6
  }), /*#__PURE__*/React.createElement(Next, {
    to: 8,
    l: "DSP & AO"
  }))), step === 8 && res && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "📜 DSP, Autorité délégante & Préparation AO"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "La ", /*#__PURE__*/React.createElement("b", null, "DSP"), " (Délégation de Service Public) est le contrat entre la collectivité et l’armateur. L’", /*#__PURE__*/React.createElement("b", null, "AO"), " (Appel d’Offres) est la procédure d’attribution. Cet onglet calcule le ", /*#__PURE__*/React.createElement("b", null, "surcoût imputable"), " à la transition, propose une formule de révision intégrant l’électricité (", /*#__PURE__*/React.createElement("b", null, "IELEC"), "), et simule le ", /*#__PURE__*/React.createElement("b", null, "scoring environnemental"), " d’un AO avec 4 sous-critères pondérables : CO₂, NOx/particules, bruit, part renouvelable."), /*#__PURE__*/React.createElement(Cd, {
    title: "Surcoût imputable"
  }, res.slice(1).filter(r => r.totI > 0).map(r => {
    const d = r.base.ccv - res[0].base.ccv;
    const u = proj.v.pax > 0 ? proj.v.pax : proj.v.veh;
    const paxAn = u * proj.v.rD * proj.v.opD * 0.65;
    return /*#__PURE__*/React.createElement("div", {
      key: r.idx,
      className: "mb-2 p-2 rounded text-xs",
      style: {
        background: LB
      }
    }, /*#__PURE__*/React.createElement("b", {
      style: {
        color: CL[r.idx]
      }
    }, r.name), ": ", /*#__PURE__*/React.createElement("b", {
      style: {
        color: d > 0 ? AC : GR
      }
    }, fK(d)), " (", fK(d / proj.p.dur), "/an) | CO₂ ", /*#__PURE__*/React.createElement("b", {
      style: {
        color: GR
      }
    }, "-", fmt(Math.round(res[0].base.co2 - r.base.co2)), "t"), paxAn > 0 && /*#__PURE__*/React.createElement("span", null, " | ", (d / proj.p.dur * 1000 / paxAn).toFixed(2), "€/", proj.v.pax > 0 ? "pax" : "véh"));
  })), /*#__PURE__*/React.createElement(Cd, {
    title: "Simulation formule de révision DSP"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-2"
  }, /*#__PURE__*/React.createElement("p", null, "Formule actuelle type : ", /*#__PURE__*/React.createElement("code", null, "R = R0 × (a×IGP + b×IFUEL + c)")), /*#__PURE__*/React.createElement("p", null, "Formule proposée : ", /*#__PURE__*/React.createElement("code", null, "R = R0 × (a×IGP + b’×IFUEL + b’’×IELEC + c)")), /*#__PURE__*/React.createElement("p", {
    style: {
      color: W
    }
  }, "L’introduction d’un indice électricité (IELEC) dans la formule de révision est indispensable pour sécuriser l’équilibre économique post-transition."))), /*#__PURE__*/React.createElement(Cd, {
    title: "Partage investissements infra"
  }, /*#__PURE__*/React.createElement(Tbl, {
    cols: ["Investissement", "Armateur", "Port", "Collectivité", "Investisseur"],
    rows: INFRA_SHARE.map(r => [/*#__PURE__*/React.createElement("b", null, r.item), r.arm, r.port, r.coll, r.inv]),
    ws: [4, 1, 1, 2, 1]
  })), /*#__PURE__*/React.createElement(Cd, {
    title: "🏆 Scoring environnemental AO",
    accent: T
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Poids enviro. total",
    v: proj.ao?.poidsEnviro || 30,
    onChange: v => upd(p => ({
      ...p,
      ao: {
        ...p.ao,
        poidsEnviro: v
      }
    })),
    u: "%",
    n: "Part note technique",
    h: "Poids des critères environnementaux dans la note globale de l’appel d’offres DSP. Source : cahier des charges de l’AO. Typiquement 20-40%. Si vous ne connaissez pas la valeur, 30% est une estimation raisonnable."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Pond. CO₂",
    v: proj.ao?.wCO2 || 40,
    onChange: v => upd(p => ({
      ...p,
      ao: {
        ...p.ao,
        wCO2: v
      }
    })),
    u: "%",
    n: "Sous-critère",
    h: "Poids du sous-critère émissions de CO₂ dans la note environnementale. Alignez sur les sous-critères du cahier des charges. Le total des 4 sous-critères doit faire 100%."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Pond. NOx/part.",
    v: proj.ao?.wNOx || 20,
    onChange: v => upd(p => ({
      ...p,
      ao: {
        ...p.ao,
        wNOx: v
      }
    })),
    u: "%",
    h: "Poids du sous-critère qualité de l’air (NOx, particules fines). Pertinent pour les liaisons en zone portuaire urbaine."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Pond. bruit",
    v: proj.ao?.wBruit || 20,
    onChange: v => upd(p => ({
      ...p,
      ao: {
        ...p.ao,
        wBruit: v
      }
    })),
    u: "%",
    h: "Poids du sous-critère bruit à quai. L’électrification supprime le bruit moteur à quai — très apprécié en zone résidentielle et touristique."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Pond. renouvelable",
    v: proj.ao?.wRen || 20,
    onChange: v => upd(p => ({
      ...p,
      ao: {
        ...p.ao,
        wRen: v
      }
    })),
    u: "%",
    h: "Poids du sous-critère part d’énergie renouvelable dans le mix. Électricité + H₂ + biocarburants HVO/FAME comptent comme renouvelables."
  })), (() => {
    const wt = (proj.ao?.wCO2 || 40) + (proj.ao?.wNOx || 20) + (proj.ao?.wBruit || 20) + (proj.ao?.wRen || 20);
    return wt !== 100 ? /*#__PURE__*/React.createElement("p", {
      className: "text-xs font-bold mb-2",
      style: {
        color: AC
      }
    }, "⚠", " Sous-critères : ", wt, "% (doit être 100%)") : null;
  })(), /*#__PURE__*/React.createElement(Tbl, {
    cols: ["Trajectoire", "CO₂", "NOx/Part.", "Bruit", "Renouv.", "Score", "Impact note"],
    rows: res.slice(1).filter(r => r.totI > 0).map(r => {
      const mix = proj.trajs[r.idx].fuelMix || {};
      const hasElec = (mix.elec || 0) + (mix.h2 || 0);
      const redCO2 = Math.max(0, Math.round((1 - r.base.co2 / res[0].base.co2) * 100));
      const sCO2 = Math.min(100, redCO2 * 1.1);
      const sNOx = hasElec > 80 ? 95 : hasElec > 50 ? 70 : (mix.fame || 0) + (mix.hvo || 0) > 50 ? 50 : 20;
      const sBruit = hasElec > 80 ? 100 : hasElec > 50 ? 60 : 10;
      const sRen = Math.min(100, ((mix.elec || 0) + (mix.h2 || 0) + (mix.hvo || 0) + (mix.fame || 0)) * 1.1);
      const wCO2 = (proj.ao?.wCO2 || 40) / 100,
        wNOx = (proj.ao?.wNOx || 20) / 100,
        wBruit = (proj.ao?.wBruit || 20) / 100,
        wRen = (proj.ao?.wRen || 20) / 100;
      const score = Math.round(sCO2 * wCO2 + sNOx * wNOx + sBruit * wBruit + sRen * wRen);
      const impact = (score * (proj.ao?.poidsEnviro || 30) / 100).toFixed(1);
      return [/*#__PURE__*/React.createElement("b", {
        style: {
          color: CL[r.idx]
        }
      }, r.name.slice(0, 10)), sCO2 + "/100", sNOx + "/100", sBruit + "/100", Math.round(sRen) + "/100", /*#__PURE__*/React.createElement("b", {
        style: {
          color: score > 70 ? GR : score > 40 ? W : AC
        }
      }, score, "/100"), /*#__PURE__*/React.createElement("b", null, "+", impact, " pts")];
    }),
    ws: [2, 1, 1, 1, 1, 1, 1]
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: "#999"
    }
  }, "NOx/particules : zéro si électrique pur, réduit si biocarburants. Bruit : supprimé à quai si électrique.")), /*#__PURE__*/React.createElement(Cd, {
    title: "Argumentaire"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-1.5"
  }, /*#__PURE__*/React.createElement("p", null, "1. ", /*#__PURE__*/React.createElement("b", null, "Coût de l’inaction croissant"), " (risques quantifiés)."), /*#__PURE__*/React.createElement("p", null, "2. ", /*#__PURE__*/React.createElement("b", null, "Infra à terre"), " nécessite partage."), /*#__PURE__*/React.createElement("p", null, "3. ", /*#__PURE__*/React.createElement("b", null, "Révision DSP"), " à adapter (indice composite)."), /*#__PURE__*/React.createElement("p", null, "4. ", /*#__PURE__*/React.createElement("b", null, "Aides mobilisables"), "."), /*#__PURE__*/React.createElement("p", null, "5. ", /*#__PURE__*/React.createElement("b", null, "Bénéfices mesurables"), " : tCO₂, air, bruit."))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 7
  }), /*#__PURE__*/React.createElement(Next, {
    to: 9,
    l: "Risques"
  }))), step === 9 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "⚠ Risques"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "Chaque risque est évalué sur deux axes : ", /*#__PURE__*/React.createElement("b", null, "P"), " = probabilité d’occurrence (1 = improbable, 5 = quasi certain) et ", /*#__PURE__*/React.createElement("b", null, "I"), " = impact si le risque se matérialise (1 = négligeable, 5 = critique). Le ", /*#__PURE__*/React.createElement("b", null, "score"), " = P × I. Au-dessus de 12, le risque est critique et doit être traité en priorité. Vous pouvez ajouter vos propres risques spécifiques en bas de page."), /*#__PURE__*/React.createElement(Cd, {
    title: "Matrice"
  }, (() => {
    const allR = [...RISKS, ...(proj.customRisks || [])];
    return /*#__PURE__*/React.createElement(Tbl, {
      cols: ["Risque", "Cat.", "P", "I", "Score"],
      rows: [...allR].sort((a, b) => b.p * b.i - a.p * a.i).map(r => [r.l, r.c, r.p + "/5", r.i + "/5", /*#__PURE__*/React.createElement("b", {
        style: {
          color: r.p * r.i >= 12 ? AC : r.p * r.i >= 8 ? W : GR
        }
      }, r.p * r.i)]),
      ws: [5, 2, 1, 1, 1]
    });
  })()), /*#__PURE__*/React.createElement(Cd, {
    title: "Ajouter un risque personnalisé"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-2"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Description",
    v: proj._riskDraft?.l || "",
    onChange: v => setProj(p => ({
      ...p,
      _riskDraft: {
        ...(p._riskDraft || {}),
        l: v
      }
    })),
    t: "text",
    h: "Décrivez le risque en une phrase. Ex: « Retard livraison batteries fournisseur » ou « Rejet permis de construire borne »."
  }), /*#__PURE__*/React.createElement(Se, {
    l: "Catégorie",
    v: proj._riskDraft?.c || "Technique",
    onChange: v => setProj(p => ({
      ...p,
      _riskDraft: {
        ...(p._riskDraft || {}),
        c: v
      }
    })),
    opts: ["Stratégique", "Financier", "Opérationnel", "Technique", "Construction", "Réglementaire"].map(c => ({
      v: c,
      l: c
    })),
    h: "Classez le risque dans une catégorie. Cela permet de visualiser la répartition sur le radar."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Probabilité (1-5)",
    v: proj._riskDraft?.p || 3,
    onChange: v => setProj(p => ({
      ...p,
      _riskDraft: {
        ...(p._riskDraft || {}),
        p: Math.min(5, Math.max(1, v))
      }
    })),
    h: "1 = très improbable, 2 = peu probable, 3 = possible, 4 = probable, 5 = quasi certain. Évaluez la vraisemblance que ce risque se réalise."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Impact (1-5)",
    v: proj._riskDraft?.i || 3,
    onChange: v => setProj(p => ({
      ...p,
      _riskDraft: {
        ...(p._riskDraft || {}),
        i: Math.min(5, Math.max(1, v))
      }
    })),
    h: "1 = négligeable, 2 = mineur, 3 = modéré, 4 = majeur, 5 = critique (arrêt du projet). Évaluez la gravité si le risque survient."
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (proj._riskDraft?.l) {
        upd(p => ({
          ...p,
          customRisks: [...(p.customRisks || []), {
            l: p._riskDraft.l,
            c: p._riskDraft.c || "Technique",
            p: p._riskDraft.p || 3,
            i: p._riskDraft.i || 3
          }],
          _riskDraft: {}
        }));
      }
    },
    className: "text-xs px-3 py-1 rounded mt-2",
    style: {
      backgroundColor: T,
      color: "white"
    }
  }, "+ Ajouter"), (proj.customRisks || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mt-2"
  }, (proj.customRisks || []).map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex items-center justify-between text-xs p-1 rounded mb-1",
    style: {
      background: LB
    }
  }, /*#__PURE__*/React.createElement("span", null, r.l, " (", r.c, ") P:", r.p, " I:", r.i), /*#__PURE__*/React.createElement("button", {
    onClick: () => upd(p => ({
      ...p,
      customRisks: (p.customRisks || []).filter((_, j) => j !== i)
    })),
    style: {
      color: AC
    }
  }, "✕"))))), /*#__PURE__*/React.createElement(Cd, {
    title: "Radar"
  }, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 240
  }, /*#__PURE__*/React.createElement(RadarChart, {
    data: ["Stratégique", "Financier", "Opérationnel", "Technique", "Construction", "Réglementaire"].map(c => {
      const allR = [...RISKS, ...(proj.customRisks || [])].filter(r => r.c === c);
      return {
        c,
        s: allR.length > 0 ? Math.round(allR.reduce((s, r) => s + r.p * r.i, 0) / allR.length * 10) / 10 : 0
      };
    })
  }, /*#__PURE__*/React.createElement(PolarGrid, null), /*#__PURE__*/React.createElement(PolarAngleAxis, {
    dataKey: "c",
    tick: {
      fontSize: 8
    }
  }), /*#__PURE__*/React.createElement(PolarRadiusAxis, {
    domain: [0, 25]
  }), /*#__PURE__*/React.createElement(Radar, {
    dataKey: "s",
    stroke: AC,
    fill: AC,
    fillOpacity: 0.3
  })))), /*#__PURE__*/React.createElement(Cd, {
    title: "Coût de l'inaction",
    accent: AC
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-1"
  }, /*#__PURE__*/React.createElement("p", null, "🔴 ", /*#__PURE__*/React.createElement("b", null, "Non-renouvellement DSP")), /*#__PURE__*/React.createElement("p", null, "🟠 ", /*#__PURE__*/React.createElement("b", null, "VR navire fossile"), " en déclin"), /*#__PURE__*/React.createElement("p", null, "🟡 ", /*#__PURE__*/React.createElement("b", null, "MDO"), " +", proj.p.fpG, "%/an"), /*#__PURE__*/React.createElement("p", null, "🟡 ", /*#__PURE__*/React.createElement("b", null, "Réglementation"), " extension < 5000 GT"))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 8
  }), /*#__PURE__*/React.createElement(Next, {
    to: 10,
    l: "Flotte"
  }))), step === 10 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "⚓ Consolidation flotte"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "Si vous avez créé plusieurs projets (un par navire), cet onglet les regroupe pour une vision ", /*#__PURE__*/React.createElement("b", null, "flotte complète"), " : CCV total, investissement cumulé, CO₂ évitées, planning pluriannuel des retrofits, et ", /*#__PURE__*/React.createElement("b", null, "benchmark inter-navires"), " en coût par passager-mille nautique (pax-NM). Cliquez sur le bouton ci-dessous pour charger tous vos projets sauvegardés."), /*#__PURE__*/React.createElement("button", {
    onClick: loadFleet,
    className: "px-4 py-2 rounded-lg text-xs font-bold text-white mb-3",
    style: {
      backgroundColor: T
    }
  }, "Charger tous les projets"), fleetPrs.length > 0 && (() => {
    const all = [{
      name: proj.name,
      vt: proj.v.type,
      res,
      p: proj
    }, ...fleetPrs];
    const getBest = fp => {
      const r = fp.res;
      return r.slice(1).reduce((b, x) => x.base.ccv < b.base.ccv ? x : b, r[1] || r[0]);
    };
    const totRef = all.reduce((s, fp) => s + fp.res[0].base.ccv, 0);
    const totBest = all.reduce((s, fp) => {
      const b = getBest(fp);
      return s + (b?.base.ccv || fp.res[0].base.ccv);
    }, 0);
    const totCO2Ref = all.reduce((s, fp) => s + fp.res[0].base.co2, 0);
    const totCO2Best = all.reduce((s, fp) => {
      const b = getBest(fp);
      return s + (b?.base.co2 || fp.res[0].base.co2);
    }, 0);
    const totInv = all.reduce((s, fp) => s + (getBest(fp)?.totI || 0), 0);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Cd, {
      title: "Synthèse flotte"
    }, /*#__PURE__*/React.createElement(Tbl, {
      cols: ["Navire", "Type", "CCV Réf.", "CCV Alt.", "Invest.", "Δ CO₂"],
      rows: all.map(fp => {
        const r = fp.res;
        const best = getBest(fp);
        return [/*#__PURE__*/React.createElement("b", null, fp.name), VT.find(x => x.id === fp.vt)?.l?.slice(0, 10), fK(r[0].base.ccv), best ? fK(best.base.ccv) : "—", best ? fK(best.totI) : "—", best ? /*#__PURE__*/React.createElement("b", {
          style: {
            color: GR
          }
        }, "-", fmt(Math.round(r[0].base.co2 - best.base.co2)), "t") : "—"];
      }),
      ws: [3, 2, 2, 2, 2, 1]
    }), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3"
    }, /*#__PURE__*/React.createElement(St, {
      l: "CCV flotte réf.",
      v: fK(totRef)
    }), /*#__PURE__*/React.createElement(St, {
      l: "CCV flotte alt.",
      v: fK(totBest),
      c: totBest < totRef ? GR : AC
    }), /*#__PURE__*/React.createElement(St, {
      l: "Invest. total",
      v: fK(totInv),
      c: T
    }), /*#__PURE__*/React.createElement(St, {
      l: "CO₂ évitées",
      v: fmt(Math.round(totCO2Ref - totCO2Best)) + " t",
      c: GR
    }))), /*#__PURE__*/React.createElement(Cd, {
      title: "📅 Plan de retrofit pluriannuel"
    }, (() => {
      const minY = Math.min(...all.map(fp => fp.p.p?.sy || 2026));
      const maxY = Math.max(...all.map(fp => (fp.p.p?.sy || 2026) + (fp.p.p?.dur || 10)));
      const range = maxY - minY + 1;
      const colors = [T, AC, PU, GR, W, "#64748b", "#f472b6", "#a855f7", "#22d3ee"];
      return /*#__PURE__*/React.createElement("div", {
        className: "overflow-x-auto"
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          minWidth: 400
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex text-xs mb-1",
        style: {
          color: "#999"
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "w-24 shrink-0"
      }), Array.from({
        length: Math.min(range, 15)
      }, (_, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "flex-1 text-center"
      }, minY + i))), all.map((fp, fi) => {
        const sy = fp.p.p?.sy || 2026;
        const dur = fp.p.p?.dur || 10;
        const best = getBest(fp);
        const techs = Object.entries(best?.name ? fp.p.trajs?.[best.idx]?.techs || {} : {}).filter(([, x]) => x?.a);
        return /*#__PURE__*/React.createElement("div", {
          key: fi,
          className: "flex items-center mb-1",
          style: {
            height: 24
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "w-24 shrink-0 text-xs truncate pr-1",
          style: {
            color: "#666"
          }
        }, fp.name), /*#__PURE__*/React.createElement("div", {
          className: "flex-1 relative h-5"
        }, techs.map(([tid, cfg], ti) => {
          const techY = (cfg.year || sy) - minY;
          const techDur = Math.min(dur - (cfg.year || sy) + sy, maxY - (cfg.year || sy));
          const t = TECHS.find(x => x.id === tid);
          return /*#__PURE__*/React.createElement("div", {
            key: ti,
            className: "absolute rounded-full h-4 flex items-center px-1",
            style: {
              left: techY / range * 100 + "%",
              width: Math.max(2, techDur / range * 100) + "%",
              backgroundColor: colors[fi % colors.length],
              opacity: 0.7,
              top: ti * 2,
              fontSize: 8,
              color: "white",
              overflow: "hidden",
              whiteSpace: "nowrap"
            }
          }, t?.l?.slice(0, 8));
        })));
      })));
    })(), /*#__PURE__*/React.createElement("p", {
      className: "text-xs mt-1",
      style: {
        color: "#999"
      }
    }, "Chaque barre représente une technologie déployée sur un navire.")), /*#__PURE__*/React.createElement(Cd, {
      title: "📊 Benchmark inter-navires (coût/pax-NM ou véh-NM)"
    }, /*#__PURE__*/React.createElement(Tbl, {
      cols: ["Navire", "Type", "CCV/an", "Unités-NM/an", "Coût/unité-NM", "tCO₂/M unités-NM"],
      rows: all.map(fp => {
        const v2 = fp.p.v;
        const best = getBest(fp);
        const ccvAn = (best?.base?.ccv || 0) / (fp.p.p?.dur || 10);
        const u = v2.pax > 0 ? v2.pax : v2.veh;
        const ul = v2.pax > 0 ? "pax" : "véh";
        const dist = (v2.cDur || 10) / 60 * (v2.spd || 8);
        const trAn = (v2.rD || 1) * (v2.opD || 300);
        const uNmAn = u * 0.65 * trAn * dist;
        return [/*#__PURE__*/React.createElement("b", null, fp.name), VT.find(x => x.id === v2.type)?.l?.slice(0, 8), fK(ccvAn), uNmAn > 0 ? fmt(Math.round(uNmAn)) + " " + ul + "-NM" : "—", uNmAn > 0 ? (ccvAn * 1000 / uNmAn).toFixed(3) + " €" : "—", uNmAn > 0 ? ((best?.base?.co2 || 0) / (fp.p.p?.dur || 10) / (uNmAn / 1e6)).toFixed(1) : "—"];
      }),
      ws: [2, 2, 2, 2, 2, 2]
    })));
  })(), fleetPrs.length === 0 && /*#__PURE__*/React.createElement(Cd, null, /*#__PURE__*/React.createElement("p", {
    className: "text-center py-4 text-sm",
    style: {
      color: "#999"
    }
  }, "Créez plusieurs projets (un par navire) puis revenez ici pour consolider.")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 9
  }), /*#__PURE__*/React.createElement(Next, {
    to: 11,
    l: "Écosystème"
  }))), step === 11 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "🌐 Écosystème & retours d'expérience"), ECO.map(s => /*#__PURE__*/React.createElement(Cd, {
    key: s.cat,
    title: s.cat
  }, s.items.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex justify-between py-1.5 border-b last:border-0 text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, e.n), " — ", e.s), /*#__PURE__*/React.createElement("span", {
    style: {
      color: T
    }
  }, e.u))))), /*#__PURE__*/React.createElement(Cd, {
    title: "💡 Retours d'expérience",
    accent: GR
  }, RETEX.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "mb-2 p-2 rounded",
    style: {
      background: LB
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold",
    style: {
      color: D
    }
  }, r.nom), /*#__PURE__*/React.createElement("div", {
    className: "text-xs"
  }, r.desc), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: GR
    }
  }, "→ ", r.impact)))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 10
  }), /*#__PURE__*/React.createElement(Next, {
    to: 12,
    l: "Suivi"
  }))), step === 12 && res && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-3",
    style: {
      color: D
    }
  }, "📈 Suivi de performance"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#999"
    }
  }, "Après la mise en service, saisissez ici vos données ", /*#__PURE__*/React.createElement("b", null, "réelles"), " chaque année pour comparer au prévisionnel. Les indicateurs ", /*#__PURE__*/React.createElement("b", null, "ESG"), " (Environnement, Social, Gouvernance) et la conformité à la ", /*#__PURE__*/React.createElement("b", null, "taxonomie UE"), " (classification européenne des activités durables : éligible si > 50% zéro émission) sont calculés automatiquement."), /*#__PURE__*/React.createElement(Cd, {
    title: "Saisie annuelle"
  }, (proj.perf || []).map((pf, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "grid grid-cols-4 gap-2 mb-2"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Année",
    v: pf.year || proj.p.sy + i,
    onChange: v => upd(p => {
      const pfs = [...(p.perf || [])];
      pfs[i] = {
        ...pfs[i],
        year: v
      };
      return {
        ...p,
        perf: pfs
      };
    }),
    h: "L’année civile concernée par la saisie (ex: 2027, 2028...)."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Conso réelle",
    v: pf.fuelReal || 0,
    onChange: v => upd(p => {
      const pfs = [...(p.perf || [])];
      pfs[i] = {
        ...pfs[i],
        fuelReal: v
      };
      return {
        ...p,
        perf: pfs
      };
    }),
    u: "t MDO",
    h: "Consommation réelle de carburant sur l’année, en tonnes de MDO équivalent. Source : factures souteur ou relevé compteur."
  }), /*#__PURE__*/React.createElement(In, {
    l: "CO₂ réel",
    v: pf.co2Real || 0,
    onChange: v => upd(p => {
      const pfs = [...(p.perf || [])];
      pfs[i] = {
        ...pfs[i],
        co2Real: v
      };
      return {
        ...p,
        perf: pfs
      };
    }),
    u: "t",
    h: "Émissions CO₂ réelles mesurées ou calculées (consommation × facteur d’émission). Source : bilan carbone ou calcul depuis la conso."
  }), /*#__PURE__*/React.createElement(In, {
    l: "OPEX réel",
    v: pf.opexReal || 0,
    onChange: v => upd(p => {
      const pfs = [...(p.perf || [])];
      pfs[i] = {
        ...pfs[i],
        opexReal: v
      };
      return {
        ...p,
        perf: pfs
      };
    }),
    u: "k€",
    h: "Coûts d’exploitation réels constatés sur l’année (OPEX + énergie + équipage + assurance). Source : bilan comptable annuel."
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => upd(p => ({
      ...p,
      perf: [...(p.perf || []), {
        year: proj.p.sy + (p.perf || []).length,
        fuelReal: 0,
        co2Real: 0,
        opexReal: 0
      }]
    })),
    className: "text-xs px-3 py-1 rounded",
    style: {
      border: "1px solid " + T,
      color: T
    }
  }, "+ Ajouter une année")), (proj.perf || []).length > 0 && res[0] && /*#__PURE__*/React.createElement(Cd, {
    title: "Comparaison prévisionnel / réel"
  }, /*#__PURE__*/React.createElement(Tbl, {
    cols: ["Année", "CO₂ prévu", "CO₂ réel", "Écart", "OPEX prévu", "OPEX réel"],
    rows: (proj.perf || []).map((pf, i) => {
      const yr = res[0].base.yrs[i];
      return [pf.year, yr ? fmt(Math.round(yr.co2)) + " t" : "—", fmt(pf.co2Real) + " t", yr ? /*#__PURE__*/React.createElement("b", {
        style: {
          color: pf.co2Real <= yr.co2 ? GR : AC
        }
      }, pf.co2Real <= yr.co2 ? "▼" : "▲", fmt(Math.round(Math.abs(pf.co2Real - yr.co2))), "t") : "—", yr ? fK(yr.ex + yr.en + yr.cr + yr.ins) : "—", fK(pf.opexReal)];
    }),
    ws: [1, 2, 2, 2, 2, 2]
  })), /*#__PURE__*/React.createElement(Cd, {
    title: "Indicateurs ESG"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-1"
  }, /*#__PURE__*/React.createElement("p", null, "• ", /*#__PURE__*/React.createElement("b", null, "tCO₂ évitées (cumul) :"), " ", (proj.perf || []).length > 0 ? fmt(Math.round((proj.perf || []).reduce((s, pf, i) => {
    const yr = res[0]?.base.yrs[i];
    return s + (yr ? yr.co2 - pf.co2Real : 0);
  }, 0))) + " t" : "Saisir les données réelles"), /*#__PURE__*/React.createElement("p", null, "• ", /*#__PURE__*/React.createElement("b", null, "Part renouvelable du mix :"), " ", (() => {
    const mix = proj.trajs[1]?.fuelMix || {};
    const tot = Object.values(mix).reduce((a, b) => a + b, 0) || 100;
    const ren = (mix.elec || 0) + (mix.h2 || 0) + (mix.hvo || 0) + (mix.fame || 0);
    return tot > 0 ? (ren / tot * 100).toFixed(0) + "%" : "N/A";
  })()), /*#__PURE__*/React.createElement("p", null, "• ", /*#__PURE__*/React.createElement("b", null, "Conformité taxonomie UE :"), " ", (() => {
    const mix = proj.trajs[1]?.fuelMix || {};
    return (mix.elec || 0) + (mix.h2 || 0) > 50 ? "✓ Éligible (> 50% zéro émission)" : "✗ Non éligible";
  })()))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement(Prev, {
    to: 11
  }), /*#__PURE__*/React.createElement(Next, {
    to: 13,
    l: "Dossier"
  }))), step === 13 && res && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "📄 Dossier complet"), /*#__PURE__*/React.createElement(Cd, {
    title: "Synthèse"
  }, /*#__PURE__*/React.createElement(Tbl, {
    cols: ["", ...res.map(r => r.name.slice(0, 10))],
    rows: [["CCV base", ...res.map(r => fK(r.base.ccv))], ["CCV dég.", ...res.map(r => fK(r.deg.ccv))], ["Invest.", ...res.map(r => fK(r.totI))], ["CO₂", ...res.map(r => fmt(Math.round(r.base.co2)) + "t")], ["Gain", ...res.map(r => (r.gain.m * 100).toFixed(0) + "%")]],
    ws: [2, ...res.map(() => 2)]
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Cd, {
    title: "📥 Exports"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const v = proj.v;
      const p = proj.p;
      const vt = VT.find(x => x.id === v.type);
      const bd = dimBatt(v);
      const css = '@page{size:A4;margin:20mm 15mm 25mm 15mm}body{font-family:Arial,sans-serif;font-size:11pt;color:#000;line-height:1.5}h1{font-size:16pt;text-align:center;margin:0}h2{font-size:13pt;color:#1E2D3D;border-bottom:2px solid #1B9AAA;padding-bottom:4px;margin-top:20px}h3{font-size:11pt;color:#1B9AAA;margin-top:14px}table{width:100%;border-collapse:collapse;font-size:9pt;margin:8px 0}th{background:#1E2D3D;color:white;padding:6px 8px;text-align:left}td{padding:5px 8px;border-bottom:1px solid #eee}tr:nth-child(even){background:#EAF4F7}.header{text-align:center;border-bottom:2px solid #1B9AAA;padding-bottom:10px;margin-bottom:20px}.footer{position:fixed;bottom:0;width:100%;text-align:center;font-size:8pt;color:#444;border-top:1px solid #ddd;padding-top:5px}.accent{color:#1B9AAA}.warn{color:#E8634A}.ok{color:#10B981}.sub{font-size:9pt;color:#999}ul{padding-left:20px}li{margin-bottom:4px}@media print{.no-print{display:none}}';
      let h = '<html><head><title>' + esc(proj.name) + ' - Dossier GASPE</title><style>' + css + '</style></head><body>';
      h += '<div class="header"><div style="font-size:10pt;letter-spacing:3px;color:#1B9AAA;font-weight:bold">GASPE</div><h1>Dossier de Transition Énergétique</h1><div style="font-size:13pt;color:#1B9AAA;margin-top:5px">' + esc(proj.name) + '</div><div class="sub">Généré le ' + new Date().toLocaleDateString("fr-FR") + ' — Simulateur CCV GASPE</div></div>';
      h += '<h2>1. Navire</h2><table><tr><th>Caractéristique</th><th>Valeur</th></tr>';
      [["Nom", v.name || "(non nommé)"], ["Type", vt?.l], ["LOA", v.loa + " m"], ["Jauge", v.gt + " GT"], ["Puissance", v.pP + " kW (pointe " + v.pPeak + " kW)"], ["Vitesse", v.spd + " nœuds"], ["Conso référence", v.fc + " L/h MDO"], ["Profil de charge", "Transit " + (v.pTr || 60) + "% / Manœuvre " + (v.pMa || 20) + "% / Quai " + (v.pQu || 20) + "%"], ["Exploitation", v.opD + " j/an, " + v.rD + " rot/j, " + v.cDur + " min/trav."], ["DSP résiduelle", v.dspR + " ans"], ["Valeur marché", fK(v.mktV)], ["Recettes", fK(v.rev) + "/an"]].forEach(([k, val]) => {
        h += '<tr><td><b>' + k + '</b></td><td>' + val + '</td></tr>';
      });
      h += '</table>';
      h += '<h2>2. Trajectoires</h2><p class="sub">Période ' + p.sy + '–' + (p.sy + p.dur) + ' | Actualisation ' + p.disc + '% | Contingency ' + p.cont + '%</p>';
      h += '<table><tr><th>Trajectoire</th><th>CCV base</th><th>CCV dégradé</th><th>CCV favorable</th><th>Invest.</th><th>CO₂</th><th>Gain</th></tr>';
      res.forEach(r => {
        h += '<tr><td><b>' + r.name + '</b></td><td>' + fK(r.base.ccv) + '</td><td>' + fK(r.deg.ccv) + '</td><td>' + fK(r.fav.ccv) + '</td><td>' + fK(r.totI) + '</td><td>' + fmt(Math.round(r.base.co2)) + ' t</td><td>' + (r.gain.m * 100).toFixed(0) + '%</td></tr>';
      });
      h += '</table>';
      if (res.length > 1) {
        h += '<h3>Écarts vs référence</h3><ul>';
        res.slice(1).forEach(r => {
          const d = r.base.ccv - res[0].base.ccv;
          const dC = res[0].base.co2 - r.base.co2;
          h += '<li><b>' + r.name + '</b> : ΔCCV <span class="' + (d > 0 ? "warn" : "ok") + '">' + fK(d) + '</span> | ΔCO₂ ' + fmt(Math.round(-dC)) + ' t' + (dC > 0 ? ' | CMA ' + fmt(Math.round(d * 1000 / dC)) + ' €/tCO₂' : '') + '</li>';
        });
        h += '</ul>';
      }
      h += '<h2>3. Dimensionnement batteries</h2><p>Capacité : <b>' + bd.kWh + ' kWh</b> (contrainte ' + bd.constraint + ') | Chargeur : <b>' + bd.chargePower + ' kW</b> | Estimation : <b>' + fK(bd.costBatt + bd.costCharger + bd.gridConnect) + '</b></p>';
      h += '<h2>4. Structuration financière</h2>';
      res.slice(1).filter(r => r.totI > 0).forEach(r => {
        const ann = v.rev - v.opex - (r.base.yrs[1]?.en || 0) - v.crew - v.ins;
        const dscr = r.totI > 0 ? ann / (r.totI / p.dur) : 0;
        h += '<h3>' + r.name + '</h3><p>FCF annuel : <b>' + fK(ann) + '</b> | DSCR : <b>' + dscr.toFixed(2) + 'x</b> | Investissement : <b>' + fK(r.totI) + '</b></p>';
      });
      h += '<h2>5. Aides publiques</h2><table><tr><th>Dispositif</th><th>Taux</th><th>Plafond</th><th>Délai</th></tr>';
      AIDES.forEach(a => {
        h += '<tr><td><b>' + a.nom + '</b></td><td>' + a.taux + '</td><td>' + a.plf + '</td><td>' + a.del + '</td></tr>';
      });
      h += '</table>';
      h += '<h2>6. Risques</h2><table><tr><th>Risque</th><th>Cat.</th><th>P</th><th>I</th><th>Score</th></tr>';
      [...RISKS, ...(proj.customRisks || [])].sort((a, b) => b.p * b.i - a.p * a.i).forEach(r => {
        h += '<tr><td>' + r.l + '</td><td>' + r.c + '</td><td>' + r.p + '</td><td>' + r.i + '</td><td><b>' + r.p * r.i + '</b></td></tr>';
      });
      h += '</table>';
      h += '<h2>7. Argumentaire DSP</h2><ul><li>Coût de l’inaction croissant</li><li>Infra à terre : partage armateur/port/collectivité</li><li>Formule de révision DSP à adapter (indice IELEC)</li><li>Aides mobilisables</li><li>Bénéfices mesurables : tCO₂, qualité air, bruit</li></ul>';
      h += '<div class="footer">GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d’Eau<br>Maison de la Mer, Quai de la Fosse, 44000 Nantes – www.gaspe.fr</div>';
      h += '<div class="no-print" style="text-align:center;margin:30px"><button onclick="window.print()" style="padding:12px 30px;background:#1B9AAA;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer">🖨 Imprimer / Enregistrer en PDF</button></div>';
      h += '</body></html>';
      const w = window.open("", "_blank");
      w.document.write(h);
      w.document.close();
    },
    className: "w-full px-3 py-2.5 rounded-lg text-xs font-bold text-white",
    style: {
      backgroundColor: AC
    }
  }, "📄 Générer le dossier PDF charté GASPE"), /*#__PURE__*/React.createElement("button", {
    onClick: expP,
    className: "w-full px-3 py-2.5 rounded-lg text-xs font-bold text-white",
    style: {
      backgroundColor: T
    }
  }, "↓ Projet JSON (réimportable)"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const t = genDossier(proj, res);
      const b = new Blob([t], {
        type: "text/plain;charset=utf-8"
      });
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u;
      a.download = proj.name.replace(/\s+/g, "_") + "_DOSSIER.txt";
      a.click();
    },
    className: "w-full px-3 py-2.5 rounded-lg text-xs font-bold text-white",
    style: {
      backgroundColor: D
    }
  }, "📄 Dossier TXT"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      navigator.clipboard.writeText(genDossier(proj, res));
      alert("Copié !");
    },
    className: "w-full px-3 py-2.5 rounded-lg text-xs font-bold",
    style: {
      border: "2px solid " + T,
      color: T
    }
  }, "📋 Copier"))), /*#__PURE__*/React.createElement(Cd, {
    title: "Contenu"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-0.5"
  }, /*#__PURE__*/React.createElement("p", null, "✓ Fiche navire"), /*#__PURE__*/React.createElement("p", null, "✓ Référentiel (modifiable)"), /*#__PURE__*/React.createElement("p", null, "✓ 4 trajectoires × 3 cas"), /*#__PURE__*/React.createElement("p", null, "✓ Dimensionnement batteries"), /*#__PURE__*/React.createElement("p", null, "✓ Plan financement + sûretés"), /*#__PURE__*/React.createElement("p", null, "✓ 9 aides publiques"), /*#__PURE__*/React.createElement("p", null, "✓ 11 risques + radar"), /*#__PURE__*/React.createElement("p", null, "✓ Scoring AO DSP"), /*#__PURE__*/React.createElement("p", null, "✓ Consolidation flotte"), /*#__PURE__*/React.createElement("p", null, "✓ Suivi performance + ESG"), /*#__PURE__*/React.createElement("p", null, "✓ 6 retours d'expérience"), /*#__PURE__*/React.createElement("p", null, "✓ Annuaire écosystème")))), /*#__PURE__*/React.createElement(Cd, {
    title: "Prochaines étapes"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-1"
  }, /*#__PURE__*/React.createElement("p", null, "1. Affiner avec bureau d'études (CFD, dim. batteries)"), /*#__PURE__*/React.createElement("p", null, "2. Lancer raccordement ENEDIS (3-6 mois)"), /*#__PURE__*/React.createElement("p", null, "3. Déposer aides AVANT travaux"), /*#__PURE__*/React.createElement("p", null, "4. Contacter investisseur (voir Écosystème)"), /*#__PURE__*/React.createElement("p", null, "5. Argumentaire autorité délégante"), /*#__PURE__*/React.createElement("p", null, "6. Consulter chantiers (devis + planning)"))), /*#__PURE__*/React.createElement(Prev, {
    to: 12
  }))));
}
