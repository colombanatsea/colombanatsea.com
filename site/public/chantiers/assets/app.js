/* Chantiers navals français · VAIATA Intelligence navale */
(() => {
  "use strict";

  const PERIM_COLORS = {
    "construction-neuve": "#004272",
    "reparation-refit": "#1F9AA8",
    "naval-defense": "#2B3550",
    "plaisance": "#E08A1E",
  };
  // Ordre de priorité pour la couleur du marqueur (chantier multi-périmètre).
  const PERIM_PRIORITY = ["naval-defense", "construction-neuve", "reparation-refit", "plaisance"];

  // Familles de propulsion : libellé + couleur (vert = décarboné, gris = thermique).
  const PROPULSION = {
    "hydrogene-h2": { label: "Hydrogène H₂", color: "#0a9e6e" },
    "ammoniac": { label: "Ammoniac", color: "#1aa3a3" },
    "methanol": { label: "Méthanol", color: "#2aa1c8" },
    "electrique-batterie": { label: "Électrique batterie", color: "#16a34a" },
    "hybride": { label: "Hybride", color: "#5bb35b" },
    "gnl": { label: "GNL", color: "#7aa0c4" },
    "velique": { label: "Vélique", color: "#3b82c4" },
    "diesel-electrique": { label: "Diesel-électrique", color: "#9aa7b4" },
    "nucleaire": { label: "Nucléaire", color: "#b08968" },
    "diesel-mdo": { label: "Diesel / MDO", color: "#8a96a3" },
    "autre": { label: "Autre", color: "#aab4be" },
  };
  // Ordre d'affichage des facettes propulsion (du plus décarboné au thermique).
  const PROPULSION_ORDER = ["hydrogene-h2", "ammoniac", "methanol", "electrique-batterie", "hybride", "gnl", "velique", "diesel-electrique", "nucleaire", "diesel-mdo", "autre"];
  const propLabel = (p) => (PROPULSION[p] || { label: p }).label;
  const propColor = (p) => (PROPULSION[p] || { color: "#aab4be" }).color;
  const propChips = (arr) => (arr || []).map((p) =>
    `<span class="prop-chip" style="--pc:${propColor(p)}">${propLabel(p)}</span>`).join("");

  // Forme courte du prix pour le badge de tuile (le libellé complet reste en fiche + au survol).
  // On garde la tête (montant + devise + éventuel « /unité »), on coupe avant le commentaire.
  const shortPrice = (s) => {
    if (!s) return "";
    let t = String(s).split(/ - | – |;|\(d[ée]riv|\(estimation|\(co[uû]t|\(prix|\(contexte/i)[0].trim();
    if (/\/unit|\bunit[ée]\b/i.test(s) && !/\/unit/i.test(t)) t += "/u.";
    return t.replace(/[,.\s]+$/, "");
  };
  // Affichage en euros. Le montant sourcé (devise d'origine) reste la vérité (fiche + survol) ;
  // on affiche une valeur en € pour comparer d'un coup d'œil (≈ si conversion, taux indicatifs).
  const isEurNative = (s) => /€|\beur\b/i.test(s) && !/£|gbp|\$|\busd\b|\bnok\b|\bsek\b|\bdkk\b|\brmb\b|\bfrf\b/i.test(s);
  const fmtEurM = (m) => {
    if (m == null) return "";
    if (m >= 1000) return (m / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " Md€";
    if (m >= 1) return m.toLocaleString("fr-FR", { maximumFractionDigits: m < 10 ? 1 : 0 }) + " M€";
    return Math.round(m * 1000).toLocaleString("fr-FR") + " k€";
  };
  // Extrait le premier montant monétaire propre d'une chaîne (sans le commentaire entre parenthèses).
  const MONEY_ONE = /(\d[\d  .,]*\s*(?:milliards?|millions?|mds?|bn|m|k)?\s*(?:€|£|\$|eur|usd|gbp|nok|sek|dkk|rmb|frf|kr))|(?:€|£|\$|usd|eur|gbp|nok|sek|dkk|rmb|frf)\s*\d[\d  .,]*\s*(?:milliards?|millions?|mds?|bn|m|k)?/i;
  const extractAmount = (s) => { const m = String(s).match(MONEY_ONE); return m ? m[0].trim() : shortPrice(s); };
  // Prix affiché en € : exact si déjà en €, sinon conversion approximative préfixée « ≈ ».
  const priceEur = (s) => {
    if (!s) return "";
    const unit = /\/unit|\bunit[ée]\b/i.test(s) ? "/u." : "";
    if (isEurNative(s)) return extractAmount(s) + unit;
    const m = parsePriceEurM(s);
    return m != null ? "≈ " + fmtEurM(m) + unit : shortPrice(s);
  };

  // Territoires d'outre-mer : hors emprise de la carte métropole, regroupés dans un index dédié.
  const OUTREMER_REGIONS = new Set([
    "Martinique", "Guadeloupe", "La Réunion", "Mayotte", "Guyane",
    "Polynésie française", "Nouvelle-Calédonie", "Saint-Pierre-et-Miquelon",
    "Saint-Martin", "Saint-Barthélemy", "Wallis-et-Futuna",
  ]);
  const isOutremer = (c) => OUTREMER_REGIONS.has(c.region);

  // Gazetteer des ports/escales cités par les dessertes (coordonnées approximatives, usage schématique).
  // Sert à tracer les lignes de desserte (faute d'AIS, trait direct entre escales). Clé = nom reconnu dans la chaîne.
  const PORTS = {
    "Fort-de-France": [14.602, -61.066], "Trois-Îlets": [14.539, -61.038], "Anse Mitan": [14.551, -61.052],
    "Anse à l'Ane": [14.548, -61.069], "Pointe du Bout": [14.548, -61.053], "Case-Pilote": [14.646, -61.135],
    "Audierne": [48.022, -4.539], "Sein": [48.038, -4.852], "Molène": [48.396, -4.959],
    "Ouessant": [48.459, -5.096], "Le Conquet": [48.360, -4.770], "Camaret": [48.277, -4.593], "Brest": [48.388, -4.490],
    "Basse-Indre": [47.199, -1.694], "Indret": [47.201, -1.661], "Le Pellerin": [47.197, -1.759], "Couëron": [47.214, -1.722],
    "Belle-Île": [47.347, -3.155], "Groix": [47.638, -3.450], "Houat": [47.391, -2.961], "Hoëdic": [47.343, -2.875],
    "Blaye": [45.127, -0.665], "Lamarque": [45.098, -0.693], "Le Verdon": [45.546, -1.062], "Verdon": [45.546, -1.062], "Royan": [45.624, -1.028],
    "Dzaoudzi": [-12.788, 45.270], "Mamoudzou": [-12.780, 45.228],
    "Fouras": [45.987, -1.090], "Aix": [46.010, -1.175],
    "Fromentine": [46.893, -2.143], "Port Joinville": [46.727, -2.345], "Yeu": [46.715, -2.349], "Saint-Gilles-Croix-de-Vie": [46.697, -1.943],
    "Salin-de-Giraud": [43.398, 4.730], "Port-Saint-Louis": [43.386, 4.801], "Saintes-Maries-de-la-Mer": [43.452, 4.428],
    "Granville": [48.837, -1.597], "Carteret": [49.376, -1.791], "Diélette": [49.553, -1.863], "Jersey": [49.187, -2.107], "Guernesey": [49.455, -2.576], "Aurigny": [49.713, -2.198],
    "Les Saintes": [15.867, -61.583], "Trois-Rivières": [15.989, -61.640],
    "Port d'Hyères": [43.091, 6.156], "Hyères": [43.091, 6.156], "Levant": [43.030, 6.468], "Port-Cros": [43.005, 6.392],
    "Tour Fondue": [43.034, 6.158], "Porquerolles": [43.000, 6.213],
    "Sables d'Olonne": [46.497, -1.794], "Port-Louis": [47.708, -3.358], "Gâvres": [47.692, -3.404],
    "Duclair": [49.482, 0.873], "Berville": [49.461, 0.770], "Quillebeuf": [49.470, 0.519],
    "Saint-Pierre": [46.781, -56.172], "Langlade": [46.862, -56.343], "Miquelon": [47.097, -56.380], "Fortune": [47.067, -55.842],
    "Saint-Vaast-la-Hougue": [49.589, -1.266], "Tatihou": [49.598, -1.251],
    "Vannes": [47.658, -2.760], "Séné": [47.622, -2.752], "Île d'Arz": [47.594, -2.799],
    "Vieux-Port": [43.295, 5.371], "Frioul": [43.281, 5.304], "Minimes": [46.149, -1.169], "Médiathèque": [43.298, 5.364],
    "rade de Brest": [48.330, -4.470], "rade de Lorient": [47.730, -3.370], "rade de Toulon": [43.110, 5.930], "Lorient": [47.745, -3.367],
  };
  // Localisation des cabinets d'architecture / ensembliers navals (siège), pour la carte Architectes.
  // Sièges sourcés ; les clés correspondent aux noms canoniques (cf. pipeline merge-arch). Un cabinet
  // n'apparaît sur la carte que si au moins un navire le référence (agrégation depuis les navires).
  const ARCHITECTES_LIEUX = {
    "Alternatives Energies": { ville: "La Rochelle", region: "Nouvelle-Aquitaine", pays: "France", lat: 46.158, lon: -1.151 },
    "Mauric": { ville: "Marseille", region: "Provence-Alpes-Côte d'Azur", pays: "France", lat: 43.296, lon: 5.370 },
    "Stirling Design International": { ville: "Nantes", region: "Pays de la Loire", pays: "France", lat: 47.213, lon: -1.553 },
    "Marc Lombard": { ville: "La Rochelle", region: "Nouvelle-Aquitaine", pays: "France", lat: 46.160, lon: -1.149 },
    "VPLP Design": { ville: "Vannes", region: "Bretagne", pays: "France", lat: 47.658, lon: -2.760 },
    "Berret-Racoupeau": { ville: "La Rochelle", region: "Nouvelle-Aquitaine", pays: "France", lat: 46.156, lon: -1.153 },
    "LMG Marin": { ville: "Bergen", region: "Vestland", pays: "Norvège", lat: 60.391, lon: 5.322 },
    "Skipsteknisk": { ville: "Ålesund", region: "Møre og Romsdal", pays: "Norvège", lat: 62.472, lon: 6.155 },
    "Marin Teknikk": { ville: "Herøy", region: "Møre og Romsdal", pays: "Norvège", lat: 62.340, lon: 5.620 },
    "Salt Ship Design": { ville: "Stord", region: "Vestland", pays: "Norvège", lat: 59.781, lon: 5.500 },
    "Multi Maritime": { ville: "Førde", region: "Vestland", pays: "Norvège", lat: 61.452, lon: 5.857 },
    "Rolls-Royce Marine (UT design)": { ville: "Ulsteinvik", region: "Møre og Romsdal", pays: "Norvège", lat: 62.346, lon: 5.851 },
    "Wärtsilä Ship Design": { ville: "Fitjar", region: "Vestland", pays: "Norvège", lat: 59.925, lon: 5.308 },
    "Fjellstrand (design maison)": { ville: "Omastrand", region: "Vestland", pays: "Norvège", lat: 60.128, lon: 5.948 },
    "Oma Baatbyggeri": { ville: "Stord", region: "Vestland", pays: "Norvège", lat: 59.784, lon: 5.503 },
    "Møre Maritime": { ville: "Brattvåg", region: "Møre og Romsdal", pays: "Norvège", lat: 62.598, lon: 6.480 },
    "Marin Design": { ville: "Frøya", region: "Trøndelag", pays: "Norvège", lat: 63.712, lon: 8.700 },
    "Tomra Engineering": { ville: "Tomrefjord", region: "Møre og Romsdal", pays: "Norvège", lat: 62.580, lon: 6.930 },
    "Heimli Ship Design": { ville: "Fitjar", region: "Vestland", pays: "Norvège", lat: 59.927, lon: 5.310 },
    "Naval Consult": { ville: "Måløy", region: "Vestland", pays: "Norvège", lat: 61.937, lon: 5.113 },
    "Skipskompetanse": { ville: "Måløy", region: "Vestland", pays: "Norvège", lat: 61.939, lon: 5.115 },
    "Mer et Design": { ville: "Sophia Antipolis", region: "Provence-Alpes-Côte d'Azur", pays: "France", lat: 43.625, lon: 7.048 },
    "Ship-ST": { ville: "Lorient", region: "Bretagne", pays: "France", lat: 47.745, lon: -3.367 },
    "H&T Architecture Navale": { ville: "Nantes", region: "Pays de la Loire", pays: "France", lat: 47.215, lon: -1.555 },
    "Naval Group": { ville: "Lorient", region: "Bretagne", pays: "France", lat: 47.731, lon: -3.371 },
    "Xavier Faÿ": { ville: "La Rochelle", region: "Nouvelle-Aquitaine", pays: "France", lat: 46.157, lon: -1.150 },
    "Christophe Barreau": { ville: "La Rochelle", region: "Nouvelle-Aquitaine", pays: "France", lat: 46.159, lon: -1.152 },
    "Philippe Briand": { ville: "La Rochelle", region: "Nouvelle-Aquitaine", pays: "France", lat: 46.155, lon: -1.148 },
    "Finot-Conq": { ville: "Vannes", region: "Bretagne", pays: "France", lat: 47.661, lon: -2.758 },
    "Jean-François Delvoye": { ville: "Tréguier", region: "Bretagne", pays: "France", lat: 48.787, lon: -3.233 },
    "Barreau-Neuman": { ville: "Ivry-sur-Seine", region: "Île-de-France", pays: "France", lat: 48.813, lon: 2.389 },
    "Coprexma": { ville: "Pont-l'Abbé", region: "Bretagne", pays: "France", lat: 47.867, lon: -4.222 },
    "Pantocarène": { ville: "Arzon", region: "Bretagne", pays: "France", lat: 47.548, lon: -2.888 },
    "OCEA": { ville: "Les Sables-d'Olonne", region: "Pays de la Loire", pays: "France", lat: 46.497, lon: -1.783 },
    "Barracuda Yacht Design": { ville: "La Forêt-Fouesnant", region: "Bretagne", pays: "France", lat: 47.903, lon: -3.974 },
    "S.E.E. Merré": { ville: "Nort-sur-Erdre", region: "Pays de la Loire", pays: "France", lat: 47.438, lon: -1.500 },
    "Norwegian Ship Design": { ville: "Ålesund", region: "Møre og Romsdal", pays: "Norvège", lat: 62.469, lon: 6.162 },
    "Solstrand Trading": { ville: "Tomrefjord", region: "Møre og Romsdal", pays: "Norvège", lat: 62.582, lon: 6.928 },
    "Aker Yards Design": { ville: "Aukra", region: "Møre og Romsdal", pays: "Norvège", lat: 62.797, lon: 6.920 },
    "Ulstein Design": { ville: "Ulsteinvik", region: "Møre og Romsdal", pays: "Norvège", lat: 62.343, lon: 5.849 },
    "Vard Design": { ville: "Ålesund", region: "Møre og Romsdal", pays: "Norvège", lat: 62.466, lon: 6.150 },
    "Havyard Design": { ville: "Fosnavåg", region: "Møre og Romsdal", pays: "Norvège", lat: 62.339, lon: 5.553 },
    "Macduff Ship Design": { ville: "Macduff", region: "Aberdeenshire", pays: "Royaume-Uni", lat: 57.668, lon: -2.497 },
    "BMT": { ville: "Southampton", region: "Angleterre", pays: "Royaume-Uni", lat: 50.909, lon: -1.404 },
  };

  // Bases navales / ports de rattachement reconnus dans le champ opérateur (ex. « Marine nationale - base navale de Toulon »).
  // Sert à situer sur la carte Opérateurs les flottes de souveraineté sans ligne de desserte. Coordonnées du port.
  const NAVAL_BASES = {
    "toulon": [43.118, 5.930], "brest": [48.366, -4.494], "cherbourg": [49.645, -1.625],
    "lanveoc-poulmic": [48.283, -4.450], "lanveoc": [48.283, -4.450],
    "degrad-des-cannes": [4.852, -52.275], "saint-mandrier-sur-mer": [43.078, 5.929],
  };
  // Opérateurs : normalisation déterministe (suffixes juridiques + accents + parenthèses) puis fusions curées.
  // OP_EXCLUDE = libellés qui ne désignent pas un exploitant réel (statut / placeholder).
  const OP_EXCLUDE = /^(desarme|inconnu|en construction|en essais|yacht prive|charter|prive|particulier|non |reserve|aucun|divers|n\/?a$|a definir|loue|location)/;
  // OP_ALIAS = fusions explicites (clé après strip → libellé canonique). Ne JAMAIS fusionner deux marines d'État
  // distinctes : seules les variantes de la marine FRANÇAISE sont regroupées (les marines étrangères gardent leur clé).
  const OP_ALIAS = [
    { re: /^marine nationale( francaise| france)?$/, key: "marine-nationale-fr", label: "Marine nationale (France)" },
    { re: /^marine nationale -/, key: "marine-nationale-fr", label: "Marine nationale (France)" },
  ];
  const opNorm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const opStrip = (s) => opNorm(s).replace(/\([^)]*\)/g, " ")
    .replace(/\b(a\/s|asa|as|ab|sa|sas|sarl|ltd|limited|gmbh|b\.?v|n\.?v|plc|inc|llc|co|spa|ag|oy|oyj|aps|kg)\b\.?/g, " ")
    .replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  // Renvoie {key, label} canonique pour un opérateur brut, ou null si non-exploitant.
  function canonOperator(raw) {
    if (!raw || !raw.trim()) return null;
    const stripped = opStrip(raw);
    if (!stripped || OP_EXCLUDE.test(stripped)) return null;
    for (const a of OP_ALIAS) if (a.re.test(stripped)) return { key: a.key, label: a.label };
    // Libellé d'affichage : variante brute débarrassée du suffixe juridique de fin, casse/accents conservés.
    const label = raw.trim().replace(/\s+(AS|ASA|AB|A\/S|SA|SAS|SARL|Ltd\.?|Limited|GmbH|B\.?V\.?|N\.?V\.?|PLC|Inc\.?|LLC|Co\.?|SpA|AG|Oy|Oyj|ApS|KG)\.?$/i, "").trim();
    return { key: stripped, label };
  }
  // Pavillon nettoyé pour l'affichage (retire parenthèses/codes, déduplique accents/casse).
  const cleanFlag = (raw) => {
    if (!raw) return "";
    let t = String(raw).replace(/\([^)]*\)/g, "").replace(/\b[A-Z]{2,3}\b/g, "").replace(/[,;].*$/, "").replace(/\s+/g, " ").trim();
    return t;
  };
  // Ajoute un pavillon nettoyé à un Map de pays (clé sans accent → meilleure variante accentuée).
  const addFlag = (m, raw) => {
    const c = cleanFlag(raw); if (!c) return;
    const k = opNorm(c); const cur = m.get(k);
    if (!cur || (/[^\x00-\x7F]/.test(c) && !/[^\x00-\x7F]/.test(cur)) || c.length > cur.length) m.set(k, c);
  };

  // Base navale éventuellement nommée dans le champ opérateur (souveraineté sans desserte).
  function operatorBase(raw) {
    const m = opNorm(raw).match(/base (?:navale )?(?:de |d.)?([a-z\- ]+)/);
    if (!m) return null;
    const k = m[1].trim().split(/[)\/,]/)[0].trim().replace(/\s+/g, "-");
    return NAVAL_BASES[k] ? { name: m[1].trim().split(/[)\/,]/)[0].trim(), pt: NAVAL_BASES[k] } : null;
  }

  const state = {
    all: [],
    perimRef: {},
    typesRef: {},
    filters: { q: "", perims: new Set(), type: "", region: "", pays: "",
      navProps: new Set(), navCapTypes: new Set(), navCapMin: 0, navLenMin: 0, navLenMax: 0, navPriceMin: 0, navPriceMax: 0 },
    sort: { key: "nom", dir: 1 },
    entity: "chantiers", // chantiers | navires | dessertes | operateurs | architectes | equipementiers
    mode: "carte",       // annuaire | carte (navires = annuaire seul)
    activeId: null,
  };

  let map, markerLayer;
  const markers = new Map();

  const $ = (s) => document.querySelector(s);
  const norm = (s) => (s || "").toString().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "");

  const primaryPerim = (c) =>
    PERIM_PRIORITY.find((p) => c.perimetres.includes(p)) || c.perimetres[0];

  const perimLabel = (p) => state.perimRef[p] || p;
  const typeLabel = (t) => state.typesRef[t] || t;

  function tag(p) {
    return `<span class="tag tag--${p}">${perimLabel(p)}</span>`;
  }

  /* ---------- État d'un item : vivant, terminé, ou inconnu ---------- */
  // TROIS ÉTATS, PAS DEUX. Un chantier fermé et un chantier dont on ignore l'état
  // ne se disent pas de la même manière. La base porte 361 chantiers actifs, 70
  // fermés et 101 sans information ; les 24 équipementiers n'en portent aucune.
  // Afficher un item d'état inconnu comme s'il était vivant serait un instrument
  // faux, et un instrument faux est pire qu'aucun instrument.
  //
  // Côté navires, la lecture est asymétrique et c'est voulu : `fin_de_vie` établit
  // une fin, mais son absence n'établit PAS que le navire navigue. 137 coques sur
  // 6 691 portent une fin prouvée, les autres sont inconnues, jamais « en service ».
  //
  // UNE SEULE DÉFINITION POUR TOUTES LES SURFACES. Si la carte, la tuile et la
  // fiche décidaient chacune de leur côté, elles finiraient par se contredire.
  //
  // OÙ CHAQUE ÉTAT SE VOIT. `termine` se voit partout, y compris en simple mention
  // dans une autre page : c'est la demande. `inconnu` ne se voit QUE sur la fiche,
  // là où l'affirmation est faite ; le marquer sur les listes couvrirait 98 % du
  // corpus d'un badge sans information et noierait le signal utile.
  const ETATS = {
    termine: { cle: "termine", mot: "Fermé", titre: "Site fermé, ne construit plus" },
    inconnu: { cle: "inconnu", mot: "État non documenté", titre: "Activité non vérifiée à ce jour" },
    actif: { cle: "actif", mot: "En activité", titre: "Site en activité" },
  };
  // « Désarmé » n'est pas « Démoli » : le navire-musée existe, il ne navigue
  // plus. Arbitrage du 21/08, sur le Maillé-Brézé et Le Redoutable.
  const FINS = { demoli: "Démoli", deconstruit: "Déconstruit", naufrage: "Naufragé",
    desarme: "Désarmé" };
  const PHRASES = { desarme: "ne navigue plus, conservé à quai" };

  /** État d'un chantier, d'un équipementier ou d'un bureau d'études. */
  function etatSite(o) {
    if (!o) return ETATS.inconnu;
    if (o.actif === false) return ETATS.termine;
    if (o.actif === true) return ETATS.actif;
    return ETATS.inconnu;
  }

  /** État d'un navire. Une fin prouvée, ou rien : on ne déduit jamais « en service ». */
  function etatNavire(n) {
    if (!n || !n.fin_de_vie || !n.fin_de_vie.statut) return ETATS.inconnu;
    const f = n.fin_de_vie;
    const mot = FINS[f.statut] || "Hors flotte";
    return { cle: "termine", mot: f.annee ? mot + " en " + f.annee : mot,
      titre: "Navire " + mot.toLowerCase() + (f.annee ? " en " + f.annee : "")
        + ", " + (PHRASES[f.statut] || "il ne navigue plus") };
  }

  const estTermine = (e) => !!e && e.cle === "termine";

  /** Index nom de chantier -> fiche, pour les panneaux qui ne manipulent que des noms. */
  let _parNom = null;
  function siteParNom(nom) {
    if (!_parNom) {
      _parNom = new Map();
      (state.all || []).forEach((c) => { if (c.nom) _parNom.set(c.nom, c); });
    }
    return _parNom.get(nom) || null;
  }
  /** Rend une liste de NOMS de chantiers en marquant ceux qui sont fermés. */
  function listeSitesHtml(noms) {
    return [...noms].map((n) => {
      const e = etatSite(siteParNom(n));
      return estTermine(e)
        ? `<span class="is-termine">${esc(n)} ${badgeEtat(e)}</span>`
        : esc(n);
    }).join(", ");
  }
  /** Classe à poser sur une tuile, une ligne ou une mention. */
  const clsEtat = (e) => (estTermine(e) ? " is-termine" : "");
  /** Pastille visible. `force` l'affiche même pour un état inconnu (usage : fiche). */
  function badgeEtat(e, force) {
    if (!e || e.cle === "actif" || (e.cle === "inconnu" && !force)) return "";
    return '<span class="etat etat--' + e.cle + '" title="' + e.titre + '">' + e.mot + "</span>";
  }

  /* ---------- Data ---------- */
  async function load() {
    const res = await fetch("data/chantiers.json", { cache: "no-cache" });
    const data = await res.json();
    state.all = data.chantiers;
    // Bloc racine ajouté par l'option B. Absent des fichiers antérieurs, d'où
    // le repli sur un tableau vide : une version ancienne du JSON reste lisible.
    state.equipementiers = data.equipementiers || [];
    state.perimRef = data.meta.perimetres_ref || {};
    state.typesRef = data.meta.types_navires_ref || {};
    // Index plat des navires de référence (recherche par navire).
    state.navires = [];
    state.all.forEach((c) => (c.navires_references || []).forEach((n) => {
      if (n && (n.nom || n.type)) {
        n._idx = state.navires.length; n._cid = c.id; n._cnom = c.nom; n._cville = c.ville; n._cregion = c.region; n._cpays = c.pays;
        n._cperims = c.perimetres || []; n._ctypes = c.types_navires || [];
        n._cactif = c.actif;   // pour griser la MENTION du chantier depuis un navire
        state.navires.push(n);
      }
    }));
    buildDerived();
    // Fond de carte France, servi en local (aucune dépendance externe).
    let geo = null;
    try {
      const gr = await fetch("data/france-regions.geojson", { cache: "force-cache" });
      if (gr.ok) geo = await gr.json();
    } catch (e) { console.warn("Fond de carte indisponible", e); }
    // Contours d'outre-mer, servis en local (cartouches).
    state.omPolys = {};
    try {
      const or = await fetch("data/outremer.geojson", { cache: "force-cache" });
      if (or.ok) {
        const og = await or.json();
        (og.features || []).forEach((f) => {
          const terr = f.properties && f.properties.terr;
          if (!terr) return;
          const g = f.geometry;
          const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
          (state.omPolys[terr] = state.omPolys[terr] || []).push(...polys.map((p) => p[0]));
        });
      }
    } catch (e) { console.warn("Contours outre-mer indisponibles", e); }
    // FOND DU MONDE ENTIER, servi en local, dérivé de Natural Earth par
    // `pipeline/tools/gen-fond-monde.js`. Il remplace les deux fichiers tenus à la
    // main, `foreign-countries` (9 pays) et `foreign-countries-extra` (2) : tout pays
    // qui entrait par le parcours de graphe arrivait sur du VIDE, et un marqueur posé
    // sur du blanc ne se lit pas comme « fond manquant » mais comme « donnée fausse ».
    // Mesure du 21/08/2026 avant correction : 18 pays sans contour, 102 fiches
    // concernées, dont l'Allemagne et ses 38 chantiers.
    state.worldGeo = null;
    try {
      const wr = await fetch("data/world-countries.geojson", { cache: "force-cache" });
      if (wr.ok) state.worldGeo = await wr.json();
    } catch (e) { console.warn("Fond mondial indisponible", e); }
    buildControls();
    try { initMap(geo); } catch (e) { console.error("Carte indisponible", e); showMapFallback(); }
    syncViews();
    render();
  }

  /* ---------- Filtering / sorting ---------- */
  function filtered() {
    const { q, perims, type, region, pays } = state.filters;
    const nq = norm(q);
    return state.all.filter((c) => {
      if (pays && c.pays !== pays) return false;
      if (nq) {
        const inText = norm(c.nom).includes(nq) || norm(c.ville).includes(nq) || norm(c.groupe).includes(nq);
        const inNav = (c.navires_references || []).some((n) => norm(n.nom).includes(nq) || norm(n.type).includes(nq) || norm(n.client).includes(nq));
        if (!inText && !inNav) return false;
      }
      if (perims.size && !c.perimetres.some((p) => perims.has(p))) return false;
      if (type && !c.types_navires.includes(type)) return false;
      if (region && c.region !== region) return false;
      return true;
    });
  }

  /* ---------- Navires (recherche par navire) ---------- */
  const FAMILLES = ["ferry","bac","ropax","ro-ro","car-ferry","passagers","croisiere","paquebot","catamaran","trimaran","voilier","goelette","motoryacht","yacht","chalutier","thonier","ligneur","caseyeur","fileyeur","crevettier","peche","remorqueur","pousseur","peniche","patrouilleur","intercepteur","opv","fpb","osv","crew-boat","supply","fregate","corvette","aviso","sous-marin","ravitailleur","baliseur","pilotine","pilote","vedette","methanier","gazier","drague","barge","crewboat","servitude","hydrographique","scientifique","navire-ecole"];
  // Famille deduite du type ET du nom (le type peut rester generique). "" = inconnue.
  // Correspondance par mot entier : evite que "abaco"/"sarbacane" matchent "bac".
  const FAM_RE = FAMILLES.map((f) => ({ f, re: new RegExp("\\b" + norm(f).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b") }));
  const famille = (v) => {
    const n = norm((v && v.type) + " " + (v && v.nom));
    const hit = FAM_RE.find((x) => x.re.test(n));
    return hit ? hit.f : "";
  };

  // Valeur numérique d'une capacité par type (pax / veh / fret).
  const capVal = (n, t) => t === "pax" ? n.capacite_pax
    : t === "veh" ? n.capacite_vehicules
    : (n.capacite_fret != null ? parseInt(String(n.capacite_fret).replace(/[^\d]/g, ""), 10) : null);

  // Estimation du prix en M€ depuis le texte libre prix_acquisition (taux approximatifs, pour le filtre par fourchette).
  // Renvoie un nombre (M€) ou null si non interprétable.
  function parsePriceEurM(s) {
    if (!s) return null;
    const t = String(s).toLowerCase();
    const m = t.match(/(\d[\d  .,]*\d|\d)/);
    if (!m) return null;
    const idx = m.index, raw = m[1];
    let num = raw.replace(/[  ]/g, "");
    if (num.includes(",") && num.includes(".")) num = num.replace(/,/g, "");
    else if (num.includes(",")) num = num.replace(",", ".");
    const amount = parseFloat(num);
    if (isNaN(amount)) return null;
    // Fenêtre LOCALE autour du montant : on apparie le nombre à sa devise/échelle propres,
    // sans lire la parenthèse de conversion type « (~323 M USD) ».
    const before = t.slice(Math.max(0, idx - 8), idx);
    const after = t.slice(idx + raw.length, idx + raw.length + 16).split("(")[0];
    const win = before + " " + after;
    let scale = 1;
    if (/milliard|billion|\bbn\b|\bmd\b/.test(win)) scale = 1e9;
    else if (/million|m€|m£|m\$|musd|meur|\bm\b|m\s?(eur|gbp|usd|nok|sek|dkk)/.test(win)) scale = 1e6;
    let rate = 1; // EUR par défaut (taux approximatifs, pour le tri par fourchette)
    if (/£|gbp/.test(win)) rate = 1.17;
    else if (/\$|usd/.test(win)) rate = 0.92;
    else if (/\bnok\b/.test(win)) rate = 0.085;
    else if (/\bsek\b/.test(win)) rate = 0.087;
    else if (/\bdkk\b|\bkr\b/.test(win)) rate = 0.134;
    return amount * scale * rate / 1e6;
  }

  function filteredNavires() {
    const { q, perims, type, region, navProps, navCapTypes, navCapMin, navLenMin, navLenMax, navPriceMin, navPriceMax } = state.filters;
    const nq = norm(q);
    const pays = state.filters.pays;
    return state.navires.filter((n) => {
      if (pays && n._cpays !== pays) return false;
      if (region && n._cregion !== region) return false;
      // Périmètre et type sont des attributs du chantier constructeur : on les applique aussi aux navires.
      if (perims.size && !n._cperims.some((p) => perims.has(p))) return false;
      if (type && !n._ctypes.includes(type)) return false;
      // Propulsion : facette multi-valeurs (le navire doit porter au moins une famille cochée).
      if (navProps.size && !(n.propulsion || []).some((p) => navProps.has(p))) return false;
      // Capacité : types cumulables (le navire doit porter TOUTES les capacités cochées), seuil min commun.
      if (navCapTypes.size) {
        for (const t of navCapTypes) {
          const val = capVal(n, t);
          if (val == null || isNaN(val)) return false;
          if (navCapMin && val < navCapMin) return false;
        }
      }
      // Prix d'acquisition : fourchette en M€ (navire sans prix interprétable exclu si le filtre est actif).
      if (navPriceMin || navPriceMax) {
        const eurM = parsePriceEurM(n.prix_acquisition);
        if (eurM == null) return false;
        if (navPriceMin && eurM < navPriceMin) return false;
        if (navPriceMax && eurM > navPriceMax) return false;
      }
      // Taille : longueur hors-tout dans la fourchette.
      if (navLenMin && !(n.longueur_m >= navLenMin)) return false;
      if (navLenMax && !(n.longueur_m <= navLenMax)) return false;
      if (nq && !(norm(n.nom).includes(nq) || norm(n.type).includes(nq) || norm(n.client).includes(nq) || norm(n.operateur).includes(nq) || norm(n.proprietaire).includes(nq) || norm(n.architecte).includes(nq) || norm(n._cnom).includes(nq))) return false;
      return true;
    });
  }

  function similarVessels(v) {
    const fam = famille(v);
    if (!fam) return []; // famille inconnue : ne pas inventer de similaires
    const base = norm(v.nom).split(" (")[0];
    const L = v.longueur_m;
    return state.navires
      .filter((n) => n._idx !== v._idx && famille(n) === fam && norm(n.nom).split(" (")[0] !== base)
      .map((n) => ({ n, d: (L && n.longueur_m) ? Math.abs(n.longueur_m - L) : 9999 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8)
      .map((x) => x.n);
  }

  function vesselSpecs(n) {
    return [
      n.longueur_m ? n.longueur_m + " m" : null,
      n.jauge_gt ? n.jauge_gt.toLocaleString("fr-FR") + " GT" : null,
      n.port_lourd_dwt ? n.port_lourd_dwt.toLocaleString("fr-FR") + " DWT" : null,
      n.capacite || null, n.energie || null, n.classification || null,
    ].filter(Boolean).join(" · ");
  }

  /* ---------- Index dérivés : dessertes & architectes ---------- */
  // Trace une desserte : repère les escales connues du gazetteer dans la chaîne, dans l'ordre d'apparition.
  function parseRoutePorts(str) {
    const ns = norm(str);
    const hits = [];
    for (const key in PORTS) {
      const idx = ns.indexOf(norm(key));
      if (idx >= 0) hits.push({ idx, pt: PORTS[key], key });
    }
    hits.sort((a, b) => a.idx - b.idx);
    // Dé-doublonne les escales co-localisées (ex. « Verdon » / « Le Verdon »).
    const out = [];
    hits.forEach((h) => {
      const last = out[out.length - 1];
      if (!last || Math.abs(last.pt[0] - h.pt[0]) > 1e-3 || Math.abs(last.pt[1] - h.pt[1]) > 1e-3) out.push(h);
    });
    return out.map((h) => h.pt);
  }

  function buildDerived() {
    // Dessertes : regroupe les navires par ligne exploitée.
    const dmap = new Map();
    state.navires.forEach((n) => {
      const d = (n.desserte || "").trim();
      if (!d || /^(r[ée]serve|bateau de r[ée]serve|en r[ée]serve)$/i.test(d)) return;
      let e = dmap.get(d);
      if (!e) { e = { nom: d, navires: [], operateurs: new Set(), chantiers: new Set(), regions: new Set(), pays: new Set() }; dmap.set(d, e); }
      e.navires.push(n);
      if (n.operateur) e.operateurs.add(n.operateur);
      if (n._cnom) e.chantiers.add(n._cnom);
      if (n._cregion) e.regions.add(n._cregion);
      if (n._cpays) e.pays.add(n._cpays);
    });
    // Garde anti-faux-positif : un toponyme ambigu (ex. « Vieux-Port » Marseille vs La Rochelle) peut produire
    // une ligne aberrante traversant la France. Au-delà de ~1,4° d'amplitude, on ne trace pas (desserte non localisée).
    const span = (pts) => {
      if (pts.length < 2) return 0;
      let la0 = 90, la1 = -90, lo0 = 180, lo1 = -180;
      pts.forEach((p) => { la0 = Math.min(la0, p[0]); la1 = Math.max(la1, p[0]); lo0 = Math.min(lo0, p[1]); lo1 = Math.max(lo1, p[1]); });
      return Math.max(la1 - la0, lo1 - lo0);
    };
    state.dessertes = [...dmap.values()].map((e) => {
      const pts = parseRoutePorts(e.nom);
      if (span(pts) > 1.4) e.points = []; else e.points = pts;
      e.mapped = e.points.length >= 1;
      e.operateur = [...e.operateurs][0] || ""; return e;
    }).sort((a, b) => norm(a.nom).localeCompare(norm(b.nom)));
    state.dessertes.forEach((e, i) => { e._idx = i; }); // _idx APRÈS tri : doit indexer le tableau final

    // Architectes : regroupe les navires par cabinet d'architecture / ensemblier.
    const amap = new Map();
    state.navires.forEach((n) => {
      const a = (n.architecte || "").trim();
      if (!a) return;
      let e = amap.get(a);
      if (!e) { const loc = ARCHITECTES_LIEUX[a] || {}; e = { nom: a, navires: [], operateurs: new Set(), chantiers: new Set(), ...loc }; amap.set(a, e); }
      e.navires.push(n);
      if (n.operateur) e.operateurs.add(n.operateur);
      if (n._cnom) e.chantiers.add(n._cnom);
    });
    // Les equipementiers sont une entite de PREMIER RANG : ils viennent du bloc
    // racine `equipementiers[]` et non d'une derivation des navires. Un
    // equipementier existe donc meme sans reference de navire publique.
    (state.equipementiers || []).forEach((e, i) => { e._idx = i; });
    state.architectes = [...amap.values()]
      .sort((a, b) => b.navires.length - a.navires.length || norm(a.nom).localeCompare(norm(b.nom)));
    state.architectes.forEach((e, i) => { e._idx = i; });

    // Opérateurs : couche normalisée (1191 libellés bruts → ~970 exploitants canoniques). Source unique = chantiers.json.
    const omap = new Map();
    state.navires.forEach((n) => {
      const c = canonOperator(n.operateur);
      if (!c) return;
      let e = omap.get(c.key);
      if (!e) { e = { key: c.key, nom: c.label, _variants: new Map(), navires: [], dessertes: new Set(), chantiers: new Set(), _flags: new Map(), bases: new Map() }; omap.set(c.key, e); }
      e._variants.set(c.label, (e._variants.get(c.label) || 0) + 1);
      e.navires.push(n);
      if (n.desserte && n.desserte.trim()) e.dessertes.add(n.desserte.trim());
      if (n._cnom) e.chantiers.add(n._cnom);
      addFlag(e._flags, n.pavillon);
      const b = operatorBase(n.operateur);
      if (b) e.bases.set(b.name, b.pt);
    });
    // Points cartographiables d'un opérateur : escales de ses dessertes (tracées) + ses bases navales.
    state.operateurs = [...omap.values()].map((e) => {
      // Libellé canonique = variante la plus fréquente (sauf alias déjà fixé).
      const best = [...e._variants.entries()].sort((a, b) => b[1] - a[1])[0];
      if (best && !/marine-nationale-fr/.test(e.key)) e.nom = best[0];
      delete e._variants;
      e.pays = new Set([...e._flags.values()]); delete e._flags;
      const pts = [];
      e.dessertes.forEach((d) => { const dd = (state.dessertes || []).find((x) => x.nom === d); if (dd) pts.push(...dd.points); });
      e.basePts = [...e.bases.entries()];
      e.routePts = pts;
      e.mapped = pts.length > 0 || e.basePts.length > 0;
      return e;
    }).sort((a, b) => b.navires.length - a.navires.length || norm(a.nom).localeCompare(norm(b.nom)));
    state.operateurs.forEach((e, i) => { e._idx = i; }); // _idx APRÈS tri
  }

  function sorted(list) {
    const { key, dir } = state.sort;
    return [...list].sort((a, b) => {
      let va = a[key], vb = b[key];
      if (key === "fondation") { va = va || 0; vb = vb || 0; return (va - vb) * dir; }
      return norm(va).localeCompare(norm(vb)) * dir;
    });
  }

  /* ---------- Controls ---------- */
  function buildControls() {
    // Perimeter chips
    const chips = $("#perim-chips");
    chips.innerHTML = Object.keys(PERIM_COLORS).map((p) =>
      `<button class="chip" data-p="${p}">
        <span class="chip__dot" style="background:${PERIM_COLORS[p]}"></span>${perimLabel(p)}
      </button>`).join("");
    chips.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip"); if (!btn) return;
      const p = btn.dataset.p;
      if (state.filters.perims.has(p)) { state.filters.perims.delete(p); btn.classList.remove("is-on"); }
      else { state.filters.perims.add(p); btn.classList.add("is-on"); }
      render();
    });

    // Vessel types (only those present in data)
    const types = new Set();
    state.all.forEach((c) => c.types_navires.forEach((t) => types.add(t)));
    const selT = $("#f-type");
    [...types].sort((a, b) => typeLabel(a).localeCompare(typeLabel(b)))
      .forEach((t) => selT.add(new Option(typeLabel(t), t)));
    selT.addEventListener("change", () => { state.filters.type = selT.value; render(); });

    // Pays (registre européen)
    const PAYS_ORDER = ["France", "Norvège", "Écosse", "Suède", "Pays-Bas", "Danemark",
      "Espagne", "Grèce", "Irlande", "Irlande du Nord", "Croatie"];
    const paysSet = [...new Set(state.all.map((c) => c.pays))];
    const paysList = PAYS_ORDER.filter((p) => paysSet.includes(p)).concat(paysSet.filter((p) => !PAYS_ORDER.includes(p)));
    // Le sous-titre se DERIVE des pays reellement presents. Il etait ecrit en dur
    // dans index.html et annoncait « France, Norvege, Ecosse et Suede » alors que la
    // base en portait huit : une enumeration figee se perime a la premiere ouverture
    // de pays, en silence, et fait paraitre le registre plus etroit qu'il n'est.
    // Au-dela de six pays on cesse d'enumerer : une liste qui deborde ne renseigne
    // plus, elle encombre.
    const dek = $("#dek");
    if (dek && paysList.length) {
      const p = paysList.length > 6
        ? `${paysList.length} pays`
        : paysList.slice(0, -1).join(", ") + (paysList.length > 1 ? " et " + paysList[paysList.length - 1] : "");
      dek.textContent = `Chantiers et navires de ${p} : construction, réparation, défense, propulsion`;
    }

    const selP = $("#f-pays");
    if (selP) {
      paysList.forEach((p) => selP.add(new Option(p + " (" + state.all.filter((c) => c.pays === p).length + ")", p)));
      selP.addEventListener("change", () => {
        state.filters.pays = selP.value;
        fitToCountry(selP.value);
        render();
      });
    }

    // Regions
    const regions = [...new Set(state.all.map((c) => c.region))].sort((a, b) => a.localeCompare(b));
    const selR = $("#f-region");
    regions.forEach((r) => selR.add(new Option(r, r)));
    selR.addEventListener("change", () => { state.filters.region = selR.value; render(); });

    // Search
    $("#search").addEventListener("input", (e) => { state.filters.q = e.target.value; render(); });

    // Repli des filtres (mobile) : le bouton ouvre/ferme le panneau secondaire.
    const fToggle = $("#filters-toggle");
    if (fToggle) fToggle.addEventListener("click", () => {
      const controls = document.querySelector(".controls");
      const open = controls.classList.toggle("is-collapsed");
      fToggle.setAttribute("aria-expanded", String(!open));
    });

    // Facettes navires (propulsion / capacité / taille). Seules les familles présentes dans les données sont proposées.
    const presentProps = new Set();
    state.navires.forEach((n) => (n.propulsion || []).forEach((p) => presentProps.add(p)));
    const fProp = $("#f-prop");
    if (fProp) {
      fProp.innerHTML = PROPULSION_ORDER.filter((p) => presentProps.has(p)).map((p) =>
        `<button class="prop-chip prop-chip--btn" data-prop="${p}" style="--pc:${propColor(p)}">${propLabel(p)}</button>`).join("");
      fProp.addEventListener("click", (e) => {
        const b = e.target.closest("[data-prop]"); if (!b) return;
        const p = b.dataset.prop;
        if (state.filters.navProps.has(p)) { state.filters.navProps.delete(p); b.classList.remove("is-on"); }
        else { state.filters.navProps.add(p); b.classList.add("is-on"); }
        render();
      });
    }
    const onNum = (sel, key, float) => { const el = $(sel); if (el) el.addEventListener("input", () => { state.filters[key] = (float ? parseFloat(el.value) : parseInt(el.value, 10)) || 0; render(); }); };
    // Capacité : chips cumulables (passagers + véhicules + fret combinables).
    const CAP_TYPES = [["pax", "Passagers"], ["veh", "Véhicules"], ["fret", "Fret"]];
    const fCapTypes = $("#f-cap-types");
    if (fCapTypes) {
      fCapTypes.innerHTML = CAP_TYPES.map(([k, l]) => `<button class="cap-chip" data-cap="${k}">${l}</button>`).join("");
      fCapTypes.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cap]"); if (!b) return;
        const k = b.dataset.cap;
        if (state.filters.navCapTypes.has(k)) { state.filters.navCapTypes.delete(k); b.classList.remove("is-on"); }
        else { state.filters.navCapTypes.add(k); b.classList.add("is-on"); }
        render();
      });
    }
    onNum("#f-cap-min", "navCapMin");
    onNum("#f-len-min", "navLenMin");
    onNum("#f-len-max", "navLenMax");
    onNum("#f-price-min", "navPriceMin", true);
    onNum("#f-price-max", "navPriceMax", true);
    const fNavReset = $("#f-nav-reset");
    if (fNavReset) fNavReset.addEventListener("click", () => {
      state.filters.navProps = new Set(); state.filters.navCapTypes = new Set(); state.filters.navCapMin = 0; state.filters.navLenMin = 0; state.filters.navLenMax = 0; state.filters.navPriceMin = 0; state.filters.navPriceMax = 0;
      document.querySelectorAll("#f-prop .is-on, #f-cap-types .is-on").forEach((c) => c.classList.remove("is-on"));
      ["#f-cap-min", "#f-len-min", "#f-len-max", "#f-price-min", "#f-price-max"].forEach((s) => { const el = $(s); if (el) el.value = ""; });
      render();
    });

    // Retour au début : efface filtres, recherche, tri, ferme la fiche,
    // revient à la carte et la recentre sur la France.
    function resetAll() {
      state.filters = { q: "", perims: new Set(), type: "", region: "", pays: "",
        navProps: new Set(), navCapTypes: new Set(), navCapMin: 0, navLenMin: 0, navLenMax: 0, navPriceMin: 0, navPriceMax: 0 };
      state.sort = { key: "nom", dir: 1 };
      state.activeId = null;
      $("#search").value = ""; selT.value = ""; selR.value = ""; if ($("#f-pays")) $("#f-pays").value = "";
      document.querySelectorAll(".chip.is-on, #f-prop .is-on, #f-cap-types .is-on").forEach((c) => c.classList.remove("is-on"));
      ["#f-cap-min", "#f-len-min", "#f-len-max", "#f-price-min", "#f-price-max"].forEach((s) => { const el = $(s); if (el) el.value = ""; });
      $("#drawer").setAttribute("aria-hidden", "true");
      state.entity = "chantiers"; state.mode = "carte"; syncViews();
      if (map && state.homeBounds) {
        try { map.fitBounds(state.homeBounds, { padding: [16, 16] }); } catch (e) { /* noop */ }
      }
      render();
    }
    $("#reset").addEventListener("click", resetAll);
    // Le titre fait office de bouton accueil (pattern logo).
    const home = $("#home");
    if (home) {
      home.addEventListener("click", resetAll);
      home.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); resetAll(); } });
    }

    // Navigation à deux niveaux : entité (Chantiers/Navires/Dessertes/Architectes) + mode (Annuaire/Carte).
    document.querySelectorAll(".entitytab[data-entity]").forEach((b) =>
      b.addEventListener("click", () => setEntity(b.dataset.entity)));
    document.querySelectorAll(".modetab[data-mode]").forEach((b) =>
      b.addEventListener("click", () => setMode(b.dataset.mode)));

    // Table sort
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (state.sort.key === key) state.sort.dir *= -1;
        else { state.sort.key = key; state.sort.dir = 1; }
        render();
      });
    });

    // Legend
    $("#legend").innerHTML = `<div class="legend__title">Périmètre</div>` + Object.keys(PERIM_COLORS).map((p) =>
      `<div class="legend__row"><span class="legend__dot" style="background:${PERIM_COLORS[p]}"></span>${perimLabel(p)}</div>`
    ).join("");

    // Drawer close (sauf si la modale de correction est ouverte par-dessus)
    document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeDrawer));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#corr-modal").getAttribute("aria-hidden") !== "false") closeDrawer();
    });

    // Corrections : bouton d'en-tête (consultation), formulaire (validation), fermeture.
    const btnCorr = $("#btn-corr");
    if (btnCorr) btnCorr.addEventListener("click", openCorrList);
    const corrForm = $("#corr-form");
    if (corrForm) corrForm.addEventListener("submit", (e) => { e.preventDefault(); submitCorr(); });
    document.querySelectorAll("[data-corr-close]").forEach((el) => el.addEventListener("click", closeCorrForm));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#corr-modal").getAttribute("aria-hidden") === "false") closeCorrForm();
    });
    updateCorrBadge();
  }

  // Navires : pas de carte (pas de données AIS) → forcé en annuaire.
  function effectiveMode() { return state.entity === "navires" ? "annuaire" : state.mode; }

  function syncViews() {
    const e = state.entity, m = effectiveMode();
    document.querySelectorAll(".entitytab[data-entity]").forEach((b) => {
      const on = b.dataset.entity === e;
      b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on));
    });
    document.querySelectorAll(".modetab[data-mode]").forEach((b) => {
      const on = b.dataset.mode === m;
      b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on));
    });
    const mt = $("#modetabs"); if (mt) mt.classList.toggle("is-hidden", e === "navires");
    const showMap = m === "carte";
    $("#view-map").classList.toggle("is-hidden", !showMap);
    $("#view-dir").classList.toggle("is-hidden", !(e === "chantiers" && m === "annuaire"));
    $("#view-nav").classList.toggle("is-hidden", e !== "navires");
    $("#view-dessertes").classList.toggle("is-hidden", !(e === "dessertes" && m === "annuaire"));
    $("#view-operateurs").classList.toggle("is-hidden", !(e === "operateurs" && m === "annuaire"));
    $("#view-architectes").classList.toggle("is-hidden", !(e === "architectes" && m === "annuaire"));
    $("#view-equipementiers").classList.toggle("is-hidden", !(e === "equipementiers" && m === "annuaire"));
    if (showMap && map) setTimeout(() => map.invalidateSize(), 60);
  }

  function setEntity(e) { state.entity = e; state.activeId = null; syncViews(); render(); fitEntityMap(); }
  function setMode(m) { if (state.entity === "navires") return; state.mode = m; syncViews(); render(); fitEntityMap(); }

  // Recentre la carte selon l'entité affichée (appelé au changement, pas à chaque frappe de recherche).
  function fitEntityMap() {
    if (!map || effectiveMode() !== "carte") return;
    if (state.entity === "dessertes") {
      // Cadre sur les dessertes métropolitaines (les lignes DOM-TOM/SPM restent tracées, accessibles au dézoom).
      const pts = [];
      (state.dessertes || []).forEach((d) => d.points.forEach((p) => { if (p[0] >= 41 && p[0] <= 52 && p[1] >= -6 && p[1] <= 10) pts.push(p); }));
      if (pts.length) { try { map.fitBounds(L.latLngBounds(pts).pad(0.08), { maxZoom: 9 }); } catch (e) {} return; }
    }
    if (state.entity === "equipementiers") {
      const pts = (state.equipementiers || []).filter((e) => e.lat != null).map((e) => [e.lat, e.lon]);
      if (pts.length > 1) { try { map.fitBounds(L.latLngBounds(pts).pad(0.2), { maxZoom: 8 }); } catch (e) {} return; }
    }
    if (state.entity === "architectes") {
      const pts = (state.architectes || []).filter((a) => a.lat != null).map((a) => [a.lat, a.lon]);
      if (pts.length === 1) { try { map.setView(pts[0], 8, { animate: false }); } catch (e) {} return; }
      if (pts.length > 1) { try { map.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 8 }); } catch (e) {} return; }
    }
    if (state.entity === "operateurs") {
      const inMetro = (p) => p[0] >= 41 && p[0] <= 52 && p[1] >= -6 && p[1] <= 10;
      const pts = [];
      (state.operateurs || []).forEach((o) => { o.routePts.forEach((p) => { if (inMetro(p)) pts.push(p); }); o.basePts.forEach(([, p]) => { if (inMetro(p)) pts.push(p); }); });
      if (pts.length) { try { map.fitBounds(L.latLngBounds(pts).pad(0.1), { maxZoom: 9 }); } catch (e) {} return; }
    }
    if (state.homeBounds) { try { map.fitBounds(state.homeBounds, { padding: [16, 16] }); } catch (e) {} }
  }

  /* ---------- Map ---------- */
  function showMapFallback() {
    const wrap = document.querySelector(".mapwrap");
    if (wrap) wrap.innerHTML = '<div class="map-fallback">Carte indisponible. La liste et l\'annuaire restent pleinement utilisables.</div>';
  }

  function initMap(geo) {
    if (typeof L === "undefined") { showMapFallback(); return; }
    // `minZoom: 3` et non 4. L'emprise du registre va desormais de la Crete (34,5 N)
    // au Finnmark (71,7 N) : contenir 37 degres de latitude demande un zoom d'environ
    // 3,5, et le plancher a 4 l'interdisait. La consequence n'etait pas un cadrage
    // approximatif mais un ROGNAGE : la carte s'ouvrait sur l'Europe du Nord et 21
    // marqueurs, toute l'Espagne et toute la Grece, restaient invisibles tant qu'on
    // ne dezoomait pas a la main. Les bornes etaient justes depuis le debut, c'est le
    // plancher de zoom qui les rendait inatteignables.
    map = L.map("map", { zoomControl: true, attributionControl: false, minZoom: 3, maxZoom: 12 });
    const landStyle = { fillColor: "#DBE6EF", color: "#A8BCCD", weight: 1, fillOpacity: 1 };
    let bounds = null;
    if (geo) {
      const layer = L.geoJSON(geo, { style: landStyle, interactive: false }).addTo(map);
      try { bounds = layer.getBounds(); } catch (e) { /* noop */ }
    }
    // Fond mondial : même style, par-dessous les marqueurs, et SANS étendre l'emprise.
    // Le distinguo « pays du registre » / « pays de la périphérie » n'a plus lieu
    // d'être : tous les pays sont dessinés, et le cadrage d'accueil se calcule sur les
    // CHANTIERS, jamais sur le décor. Étendre l'emprise au fond dézoomerait la vue
    // jusqu'aux antipodes, ce qui est précisément la faute que le calcul sur les
    // chantiers a corrigée le 05/08/2026.
    if (state.worldGeo) {
      // La classe est ce qui rend la couche MESURABLE. Sans elle, un test qui compte
      // les chemins du SVG compte aussi les regions de France, qui en peignent deja
      // plus de deux cents : le fond mondial pouvait disparaitre sans que le seuil
      // bouge. Constate en faisant echouer le temoin volontairement, le 21/08/2026.
      try { L.geoJSON(state.worldGeo, { style: { ...landStyle, className: "fond-monde" }, interactive: false }).addTo(map); }
      catch (e) { /* noop */ }
    }
    // L'emprise d'accueil se calcule sur les CHANTIERS, pas sur les fonds de carte.
    // Elle etait derivee des contours dessines, et l'ouverture de l'Espagne et de la
    // Grece l'a montre : 21 marqueurs tombaient hors du cadre a l'ouverture, donc 21
    // chantiers reels etaient invisibles tant qu'on ne dezoomait pas. Un fond de
    // carte est un decor ; ce que la carte doit montrer, c'est la donnee.
    // FENETRE EUROPEENNE, et c'est une correction de ma propre premiere version :
    // en prenant TOUS les chantiers j'ai fait entrer l'outre-mer dans le calcul.
    // Polynesie francaise a -149 de longitude et Nouvelle-Caledonie a +166 etirent
    // les bornes sur la moitie du globe ; `minZoom: 4` bloque alors le dezoom, la
    // vue se centre au milieu d'un ocean, et 49 marqueurs europeens sortent du
    // cadre au lieu de 21. L'outre-mer n'est pas aberrant, il a deja SA place :
    // la bande de vignettes `om-inset` sous la carte. La carte principale cadre
    // l'Europe.
    const EURO = (la, lo) => la >= 30 && la <= 72 && lo >= -25 && lo <= 45;
    const pts = (state.all || [])
      .filter((c) => typeof c.lat === "number" && typeof c.lon === "number" && EURO(c.lat, c.lon))
      .map((c) => [c.lat, c.lon]);
    let emprise = null;
    if (pts.length > 1) { try { emprise = L.latLngBounds(pts).pad(0.06); } catch (e) { /* noop */ } }
    if (!emprise || !emprise.isValid()) emprise = bounds;
    if (emprise && emprise.isValid()) { state.homeBounds = emprise; map.fitBounds(emprise, { padding: [16, 16] }); }
    else { map.setView([54, 6], 4); }
    markerLayer = L.layerGroup().addTo(map);
    // La grille CSS peut finir sa mise en page après l'init : on recalcule la taille.
    // Et on RE-CADRE derrière. `invalidateSize` corrige la taille du conteneur mais
    // conserve le centre et le zoom : un cadrage calculé sur une boîte encore vide
    // reste faux après coup. C'est ce qui laissait 21 marqueurs hors du cadre à
    // l'ouverture, dont toute l'Espagne et toute la Grèce, alors que l'emprise
    // calculée, elle, était juste. Le défaut n'était pas dans les bornes mais dans
    // l'instant où on les appliquait.
    // La bande de vignettes d'outre-mer est POSEE PAR-DESSUS le bas de la carte.
    // Cadrer sans reserver sa hauteur revient a cacher la partie sud de l'emprise :
    // une fois le zoom corrige, l'Espagne et la Grece etaient bien dans le cadre,
    // et masquees par la bande. Un marqueur couvert vaut un marqueur absent.
    const padBas = () => {
      const s = document.querySelector(".om-strip");
      const h = s ? Math.round(s.getBoundingClientRect().height) : 0;
      const dispo = document.querySelector("#map").getBoundingClientRect().height || 0;
      // Plafond RELATIF, pas absolu. Un seuil fixe a 400 px marchait sur un ecran
      // large et lachait sur telephone, ou la bande est proportionnellement plus
      // haute : la reserve etait refusee et 19 marqueurs restaient couverts.
      // On reserve au plus 45 % de la hauteur : au-dela, la carte n'aurait plus
      // assez de place pour montrer quoi que ce soit.
      const max = Math.floor(dispo * 0.45);
      if (!h || !dispo) return 16;
      return Math.max(16, Math.min(h + 12, max));
    };
    const recadre = () => {
      map.invalidateSize();
      if (!state.homeBounds) return;
      try {
        map.fitBounds(state.homeBounds, { paddingTopLeft: [16, 16], paddingBottomRight: [16, padBas()] });
      } catch (e) { /* noop */ }
    };
    setTimeout(recadre, 0);
    requestAnimationFrame(recadre);
  }

  // Recentre la carte sur les chantiers d'un pays (hors outre-mer), ou sur l'emprise complète.
  function fitToCountry(pays) {
    if (!map) return;
    if (!pays) { if (state.homeBounds) try { map.fitBounds(state.homeBounds, { padding: [16, 16] }); } catch (e) {} return; }
    const pts = state.all.filter((c) => c.pays === pays && !isOutremer(c) && c.lat != null).map((c) => [c.lat, c.lon]);
    if (pts.length) { try { map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 9 }); } catch (e) {} }
  }

  function renderMap(list) {
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();
    markers.clear();
    // Outre-mer (hors emprise) et chantiers sans coordonnées : non placés sur la carte
    // (ils restent dans l'annuaire, la recherche et les navires).
    list.filter((c) => !isOutremer(c) && c.lat != null && c.lon != null).forEach((c) => {
      const et = etatSite(c);
      // UN SITE FERMÉ PERD SA COULEUR DE PÉRIMÈTRE. Le remplir de la même teinte
      // qu'un site vivant, c'est le déclarer vivant sur la seule surface que la
      // plupart des visiteurs regardent.
      const color = estTermine(et) ? "#9aa4ad" : PERIM_COLORS[primaryPerim(c)];
      const m = L.circleMarker([c.lat, c.lon], {
        radius: estTermine(et) ? 6 : 8, color: "#ffffff", weight: 2,
        fillColor: color, fillOpacity: estTermine(et) ? 0.75 : 1,
      });
      m.bindPopup(
        `<div class="pp-nom">${c.nom} ${badgeEtat(et)}</div>
         <div class="pp-meta">${c.ville} · ${c.region}</div>
         <div class="card__perims">${c.perimetres.map(tag).join("")}</div>
         <div class="pp-btn" data-open="${c.id}">Voir la fiche →</div>`
      );
      m.on("popupopen", (e) => {
        const btn = e.popup.getElement().querySelector("[data-open]");
        if (btn) btn.addEventListener("click", () => openDrawer(c.id));
      });
      m.addTo(markerLayer);
      markers.set(c.id, m);
    });
  }

  /* ---------- Results list ---------- */
  function renderResults(list) {
    const el = $("#results");
    if (!list.length) { el.innerHTML = `<p class="empty">Aucun site ne correspond à ces critères.</p>`; return; }
    el.innerHTML = list.map((c, i) => `
      <div class="card${c.id === state.activeId ? " is-active" : ""}${clsEtat(etatSite(c))}" data-id="${c.id}">
        <div class="card__no">${String(i + 1).padStart(2, "0")}</div>
        <div class="card__body">
          <div class="card__nom">${c.nom} ${badgeEtat(etatSite(c))}</div>
          <div class="card__meta">${c.ville} · ${c.region}</div>
          <div class="card__perims">${c.perimetres.map(tag).join("")}</div>
        </div>
      </div>`).join("");
    el.querySelectorAll(".card[data-id]").forEach((card) => {
      const id = card.dataset.id;
      card.addEventListener("click", () => {
        const m = markers.get(id);
        if (m && map && effectiveMode() === "carte") { map.setView(m.getLatLng(), 9, { animate: true }); m.openPopup(); }
        openDrawer(id);
      });
    });
  }

  /* ---------- Directory table ---------- */
  function renderTable(list) {
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.classList.toggle("sorted", th.dataset.sort === state.sort.key);
      th.classList.toggle("desc", th.dataset.sort === state.sort.key && state.sort.dir === -1);
    });
    const body = $("#table-body");
    body.innerHTML = list.map((c) => `
      <tr data-id="${c.id}" class="${clsEtat(etatSite(c)).trim()}">
        <td><div class="t-nom">${c.nom} ${badgeEtat(etatSite(c))}</div><div class="t-sub">${c.types_navires.map(typeLabel).slice(0,3).join(", ")}</div></td>
        <td>${c.ville}<div class="t-sub">${c.region}</div></td>
        <td class="t-year">${c.fondation || "n.c."}</td>
        <td><div class="cellperims">${c.perimetres.map(tag).join("")}</div></td>
        <td>${c.groupe || "n.c."}</td>
      </tr>`).join("");
    body.querySelectorAll("tr[data-id]").forEach((tr) =>
      tr.addEventListener("click", () => openDrawer(tr.dataset.id)));
  }

  /* ---------- Drawer / fiche ---------- */
  function openDrawer(id) {
    const c = state.all.find((x) => x.id === id);
    if (!c) return;
    state.activeId = id;
    const facts = [
      ["Groupe", c.groupe],
      ["Fondé en", c.fondation],
      ["Superficie", c.superficie_ha ? c.superficie_ha + " ha" : null],
      ["Effectif", c.effectif ? c.effectif.toLocaleString("fr-FR") : null],
    ].filter(([, v]) => v != null && v !== "");

    const capHtml = (c.capacites && c.capacites.length)
      ? `<div class="d-section"><h3>Capacité industrielle</h3>
          ${c.capacites.map((k) => `<div class="d-cap" style="margin-bottom:10px">
            <span class="d-cap__t">${k.type}</span>
            <div class="d-cap__d">${[k.dimensions, k.capacite].filter(Boolean).join(" · ") || ""}</div>
          </div>`).join("")}</div>` : "";

    const prodHtml = (c.produits && c.produits.length)
      ? `<div class="d-section"><h3>Produits phares</h3>
          <ul class="d-list">${c.produits.map((p) =>
            `<li><span class="k" style="min-width:auto;color:var(--blue)">${p.type || ""}</span><span>${p.details || ""}</span></li>`).join("")}</ul></div>` : "";

    const persHtml = (c.personnes && c.personnes.length)
      ? `<div class="d-section"><h3>Personnes clés</h3>
          <ul class="d-list">${c.personnes.map((p) =>
            `<li><span style="font-weight:600">${p.nom || ""}</span><span style="color:var(--muted)">${p.titre || ""}</span></li>`).join("")}</ul></div>` : "";

    const histHtml = (c.historique && c.historique.length)
      ? `<div class="d-section"><h3>Histoire et faits marquants</h3>
          <ul class="d-list">${c.historique.map((h) =>
            `<li><span class="k">${h.annee}</span><span>${h.fait}</span></li>`).join("")}</ul></div>` : "";

    const carFacts = [
      ["Matériaux", (c.materiaux && c.materiaux.length) ? c.materiaux.join(", ") : null],
      ["Classification", (c.classification && c.classification.length) ? c.classification.join(", ") : null],
      ["Énergies", (c.energies && c.energies.length) ? c.energies.join(", ") : null],
      ["Taille max.", c.taille_max || null],
    ].filter(([, v]) => v != null && v !== "");
    const caracHtml = carFacts.length
      ? `<div class="d-section"><h3>Caractéristiques techniques</h3>
          <div class="d-grid">${carFacts.map(([k, v]) =>
            `<div class="d-fact"><div class="d-fact__k">${k}</div><div class="d-fact__v">${v}</div></div>`).join("")}</div></div>` : "";

    const refSpecs = (n) => [
      n.longueur_m ? n.longueur_m + " m" : null,
      n.jauge_gt ? n.jauge_gt.toLocaleString("fr-FR") + " GT" : null,
      n.port_lourd_dwt ? n.port_lourd_dwt.toLocaleString("fr-FR") + " DWT" : null,
      n.capacite || null, n.energie || null,
      n.client ? "pour " + n.client : null, n.classification || null,
    ].filter(Boolean).join(" · ");
    const refHtml = (c.navires_references && c.navires_references.length)
      ? `<div class="d-section"><h3>Navires de référence</h3>
          <ul class="d-list">${c.navires_references.map((n) => `
            <li class="ref-li" ${n._idx != null ? `data-open-vessel="${n._idx}"` : ""} style="flex-direction:column;gap:3px;align-items:flex-start">
              <span class="${clsEtat(etatNavire(n)).trim()}"><b>${n.nom || n.type || "Navire"}</b> ${badgeEtat(etatNavire(n))}${n.type && n.nom ? ` <span style="color:var(--muted)">· ${n.type}</span>` : ""}${n.annee ? ` <span style="color:var(--muted)">· ${n.annee}</span>` : ""}${n._idx != null ? ` <span class="ref-go">→</span>` : ""}</span>
              ${refSpecs(n) ? `<span style="color:var(--muted);font-size:13px">${refSpecs(n)}</span>` : ""}
            </li>`).join("")}</ul></div>` : "";

    // INTERVENTIONS : les navires PASSÉS chez ce chantier sans y avoir été
    // construits. 120 entrées dont le champ `type` disait lui-même « refit »
    // figuraient dans les navires de référence, c'est-à-dire dans le carnet de
    // construction. Le Chantier Naval de Marseille se voyait ainsi créditer de
    // neuf paquebots sortis de Saint-Nazaire, de Marghera et de Papenburg.
    // Elles ne sont pas supprimées : le passage a bien eu lieu, et c'est une
    // information de premier ordre sur un chantier de réparation. Elles sont
    // rangées ailleurs, sous un titre qui dit ce qu'elles sont.
    const interHtml = (c.interventions && c.interventions.length)
      ? `<div class="d-section"><h3>Passages en chantier <span style="color:var(--muted);font-weight:400;font-size:13px">· refit, conversion, restauration — non construits ici</span></h3>
          <ul class="d-list">${c.interventions.map((n) => `
            <li style="flex-direction:column;gap:3px;align-items:flex-start">
              <span><b>${n.nom || n.type || "Navire"}</b>${n.annee ? ` <span style="color:var(--muted)">· ${n.annee}</span>` : ""}</span>
              ${n.type ? `<span style="color:var(--muted);font-size:13px">${n.type}</span>` : ""}
            </li>`).join("")}</ul></div>` : "";

    const contactHtml = (c.contact && (c.contact.adresse || c.contact.web || c.contact.interlocuteur || c.contact.telephone))
      ? `<div class="d-section"><h3>Contact</h3>
          ${c.contact.adresse ? `<div class="d-fact__v">${c.contact.adresse}</div>` : ""}
          ${c.contact.interlocuteur ? `<div class="d-fact__v" style="margin-top:4px">${c.contact.interlocuteur}</div>` : ""}
          ${c.contact.telephone ? `<div class="d-fact__v" style="margin-top:4px">${c.contact.telephone}</div>` : ""}
          ${c.contact.web ? `<a href="${c.contact.web}" target="_blank" rel="noopener" style="font-size:14px;display:inline-block;margin-top:6px">${c.contact.web.replace(/^https?:\/\//, "")}</a>` : ""}
        </div>` : "";

    $("#drawer-body").innerHTML = `
      <div class="d-eyebrow">${c.region} · ${c.pays}</div>
      <h2 class="d-nom${clsEtat(etatSite(c))}" id="d-nom">${c.nom} ${badgeEtat(etatSite(c), true)}</h2>
      <div class="d-loc">${c.ville}</div>
      <div class="d-perims">${c.perimetres.map(tag).join("")}</div>
      <p class="d-desc">${c.description}</p>

      <div class="d-section"><h3>Informations générales</h3>
        <div class="d-grid">${facts.map(([k, v]) =>
          `<div class="d-fact"><div class="d-fact__k">${k}</div><div class="d-fact__v">${v}</div></div>`).join("")}</div>
      </div>

      <div class="d-section"><h3>Production / spécialités</h3>
        <div class="d-types">${c.types_navires.map((t) => `<span class="pill">${typeLabel(t)}</span>`).join("")}</div>
      </div>

      ${caracHtml}
      ${refHtml}
      ${interHtml}
      ${capHtml}
      ${prodHtml}
      ${persHtml}
      ${histHtml}
      ${contactHtml}

      <div class="d-section"><h3>Sources</h3>
        <div class="d-sources">${(c.sources || []).map((s) =>
          `<a href="${s}" target="_blank" rel="noopener">${s}</a>`).join("")}</div>
      </div>

      <div class="d-section d-corr">
        <button class="corr-trigger" type="button" data-corr-chantier>✎ Partager une correction</button>
      </div>`;

    $("#drawer-body").querySelectorAll("[data-open-vessel]").forEach((el) =>
      el.addEventListener("click", () => openVessel(state.navires[+el.dataset.openVessel])));
    const ccTrig = $("#drawer-body").querySelector("[data-corr-chantier]");
    if (ccTrig) ccTrig.addEventListener("click", () => openCorrForm({
      type: "chantier", cible_nom: c.nom,
      cible_contexte: [c.ville, c.region, c.pays].filter(Boolean).join(" · "),
      cid: c.id, vimo: null, vnom: null,
    }));
    $("#drawer").setAttribute("aria-hidden", "false");
    render();
  }

  function closeDrawer() {
    $("#drawer").setAttribute("aria-hidden", "true");
    state.activeId = null;
    render();
  }

  /* ---------- Corrections (retours utilisateur, stockés sur cet appareil) ---------- */
  // App 100% statique : les retours sont conservés en localStorage et consultables ici.
  // Export / copie JSON pour les transmettre et les appliquer ensuite en base.
  const CORR_KEY = "vaiata-corrections";
  const esc = (s) => (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function corrLoad() {
    try { const a = JSON.parse(localStorage.getItem(CORR_KEY) || "[]"); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function corrStore(arr) {
    try { localStorage.setItem(CORR_KEY, JSON.stringify(arr)); } catch (e) { /* quota / mode privé */ }
    updateCorrBadge();
  }
  function updateCorrBadge() {
    const b = $("#corr-count"); if (!b) return;
    const n = corrLoad().length;
    b.textContent = n;
    b.classList.toggle("is-hidden", n === 0);
  }

  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast"); if (!el) return;
    el.textContent = msg; el.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-show"), 2600);
  }

  // Ouvre le formulaire pré-rempli avec l'item ciblé (chantier ou navire).
  function openCorrForm(target) {
    state.corrTarget = target;
    const tEl = $("#corr-target");
    if (tEl) tEl.innerHTML = `<span class="cmodal__tlbl">Sur</span><b>${esc(target.cible_nom)}</b>`
      + `<span class="cmodal__tmeta">${esc(target.cible_contexte)}</span>`;
    const txt = $("#corr-text"), src = $("#corr-src");
    if (txt) txt.value = ""; if (src) src.value = "";
    $("#corr-modal").setAttribute("aria-hidden", "false");
    setTimeout(() => { if (txt) txt.focus(); }, 40);
  }
  function closeCorrForm() {
    $("#corr-modal").setAttribute("aria-hidden", "true");
    state.corrTarget = null;
  }
  function submitCorr() {
    const t = state.corrTarget; if (!t) return;
    const texte = ($("#corr-text").value || "").trim();
    if (!texte) { $("#corr-text").focus(); return; }
    const source = ($("#corr-src").value || "").trim();
    const arr = corrLoad();
    arr.unshift({
      id: "c" + Date.now().toString(36) + Math.round(Math.random() * 1e6).toString(36),
      ts: new Date().toISOString(),
      type: t.type, cible_nom: t.cible_nom, cible_contexte: t.cible_contexte,
      cid: t.cid || null, vimo: t.vimo || null, vnom: t.vnom || null,
      texte, source,
    });
    corrStore(arr);
    closeCorrForm();
    toast("Correction enregistrée. Merci.");
  }

  // Ré-ouvre la fiche ciblée par un retour.
  function corrOpenTarget(c) {
    if (c.type === "navire") {
      let v = null;
      if (c.vimo) v = state.navires.find((n) => n.imo === c.vimo);
      if (!v && c.vnom) v = state.navires.find((n) => n._cid === c.cid && (n.nom || "") === c.vnom);
      if (!v && c.vnom) v = state.navires.find((n) => (n.nom || "") === c.vnom);
      if (v) { openVessel(v); return; }
    }
    if (c.cid && state.all.some((x) => x.id === c.cid)) openDrawer(c.cid);
  }

  // Vue de consultation : liste des retours, export, copie, suppression.
  function openCorrList() {
    const arr = corrLoad();
    const fmt = (iso) => { try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; } };
    const body = arr.length ? `
      <div class="corr-toolbar">
        <button class="cbtn cbtn--ghost" data-corr-export>Exporter (JSON)</button>
        <button class="cbtn cbtn--ghost" data-corr-copy>Copier</button>
        <button class="cbtn cbtn--ghost cbtn--danger" data-corr-clear>Tout effacer</button>
      </div>
      <ul class="corr-list">${arr.map((c) => `
        <li class="corr-item" data-id="${esc(c.id)}">
          <div class="corr-item__head">
            <button class="corr-item__cible" data-corr-open="${esc(c.id)}">
              <span class="corr-item__type corr-item__type--${c.type === "navire" ? "navire" : "chantier"}">${c.type === "navire" ? "Navire" : "Chantier"}</span>
              <b>${esc(c.cible_nom)}</b>
            </button>
            <button class="corr-item__del" data-corr-del="${esc(c.id)}" title="Supprimer ce retour" aria-label="Supprimer">×</button>
          </div>
          <div class="corr-item__ctx">${esc(c.cible_contexte)}</div>
          <p class="corr-item__txt">${esc(c.texte)}</p>
          ${c.source ? `<div class="corr-item__src">Source : ${/^https?:\/\//.test(c.source) ? `<a href="${esc(c.source)}" target="_blank" rel="noopener">${esc(c.source)}</a>` : esc(c.source)}</div>` : ""}
          <div class="corr-item__ts">${fmt(c.ts)}</div>
        </li>`).join("")}</ul>`
      : `<p class="empty" style="padding:24px 0">Aucune correction enregistrée pour l'instant. Ouvrez la fiche d'un chantier ou d'un navire, puis cliquez « Partager une correction ».</p>`;
    $("#drawer-body").innerHTML = `
      <div class="d-eyebrow">Retours · cet appareil</div>
      <h2 class="d-nom" id="d-nom">Mes corrections</h2>
      <div class="d-loc">${arr.length} retour${arr.length > 1 ? "s" : ""} enregistré${arr.length > 1 ? "s" : ""} localement dans ce navigateur</div>
      ${body}`;
    const db = $("#drawer-body");
    db.querySelectorAll("[data-corr-open]").forEach((b) => b.addEventListener("click", () => { const c = corrLoad().find((x) => x.id === b.dataset.corrOpen); if (c) corrOpenTarget(c); }));
    db.querySelectorAll("[data-corr-del]").forEach((b) => b.addEventListener("click", () => { corrStore(corrLoad().filter((x) => x.id !== b.dataset.corrDel)); openCorrList(); }));
    const exp = db.querySelector("[data-corr-export]");
    if (exp) exp.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(corrLoad(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "corrections-vaiata-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const cp = db.querySelector("[data-corr-copy]");
    if (cp) cp.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(corrLoad(), null, 2)); toast("Corrections copiées dans le presse-papier."); }
      catch (e) { toast("Copie indisponible. Utilisez l'export JSON."); }
    });
    const cl = db.querySelector("[data-corr-clear]");
    if (cl) cl.addEventListener("click", () => { if (confirm("Effacer définitivement tous les retours enregistrés sur cet appareil ?")) { corrStore([]); openCorrList(); } });
    $("#drawer").setAttribute("aria-hidden", "false");
  }

  /* ---------- Index outre-mer ---------- */
  function openOutremer(list) {
    const om = list.filter(isOutremer);
    if (!om.length) return;
    const byReg = {};
    om.forEach((c) => (byReg[c.region] = byReg[c.region] || []).push(c));
    const groups = Object.keys(byReg).sort((a, b) => a.localeCompare(b)).map((r) => {
      const cs = byReg[r].sort((a, b) => a.nom.localeCompare(b.nom));
      return `<div class="om-group">
        <p class="om-group__t">${r} <span>· ${cs.length}</span></p>
        ${cs.map((c) => `<button class="om-card" data-open="${c.id}">
          <div class="om-card__nom">${c.nom}</div>
          <div class="om-card__meta">${c.ville}</div>
          <div class="card__perims">${c.perimetres.map(tag).join("")}</div>
        </button>`).join("")}
      </div>`;
    }).join("");
    $("#drawer-body").innerHTML = `
      <div class="d-eyebrow">Hors carte métropole</div>
      <h2 class="d-nom" id="d-nom">Chantiers d'outre-mer</h2>
      <div class="d-loc">${om.length} site${om.length > 1 ? "s" : ""} recensé${om.length > 1 ? "s" : ""} dans les territoires ultramarins</div>
      ${groups}`;
    $("#drawer-body").querySelectorAll("[data-open]").forEach((el) =>
      el.addEventListener("click", () => openDrawer(el.dataset.open)));
    $("#drawer").setAttribute("aria-hidden", "false");
  }

  /* ---------- Panneau navire ---------- */
  function openVessel(v) {
    if (!v) return;
    const sim = similarVessels(v);
    const cap = [
      v.capacite_pax ? v.capacite_pax.toLocaleString("fr-FR") + " passagers" : null,
      v.capacite_vehicules ? v.capacite_vehicules.toLocaleString("fr-FR") + " véhicules" : null,
      v.capacite_fret || null,
    ].filter(Boolean).join(" · ");
    const specRows = [
      ["Type", v.type], ["Année", v.annee], ["IMO", v.imo],
      ["Longueur", v.longueur_m ? v.longueur_m + " m" : null],
      ["Largeur", v.largeur_m ? v.largeur_m + " m" : null],
      ["Jauge", v.jauge_gt ? v.jauge_gt.toLocaleString("fr-FR") + " GT" : null],
      ["Port en lourd", v.port_lourd_dwt ? v.port_lourd_dwt.toLocaleString("fr-FR") + " DWT" : null],
      ["Capacité", cap || v.capacite], ["Desserte", v.desserte], ["Énergie", v.energie],
      ["Prix d'acquisition", v.prix_acquisition
        ? (isEurNative(v.prix_acquisition) ? v.prix_acquisition : priceEur(v.prix_acquisition) + " (" + v.prix_acquisition + ")")
        : null],
      ["Classification", v.classification],
    ].filter(([, x]) => x != null && x !== "");
    // Exploitation : commanditaire (client), opérateur, propriétaire, pavillon actuels.
    const expRows = [
      ["Commanditaire", v.client], ["Opérateur", v.operateur], ["Propriétaire", v.proprietaire], ["Pavillon", v.pavillon],
    ].filter(([, x]) => x != null && x !== "");
    // Photo : affichée seulement si l'identité du navire est sûre (source canonique, idéalement IMO). Jamais de photo devinée.
    const photoHtml = (v.photo && v.photo.url) ? `
      <figure class="ves-photo">
        <img src="${v.photo.url}" alt="${v.nom || v.type || "Navire"}" loading="lazy" onerror="this.closest('.ves-photo').remove()" />
        ${(v.photo.credit || v.photo.licence || v.photo.source) ? `<figcaption>${[v.photo.credit, v.photo.licence].filter(Boolean).join(" · ")}${v.photo.source ? ` <a href="${v.photo.source}" target="_blank" rel="noopener" title="source de l'image">↗</a>` : ""}</figcaption>` : ""}
      </figure>` : "";
    const ROLE = { construction: "Construction", proprietaire: "Propriétaire", operateur: "Opérateur", pavillon: "Pavillon", renommage: "Renommage", conversion: "Conversion", evenement: "Événement" };
    // « Chantier constructeur » etait ecrit sous CHAQUE navire, y compris sur les
    // 63 chantiers que la base declare elle-meme comme purement reparation-refit :
    // 172 navires y portaient une affirmation que la fiche du chantier contredit
    // deux clics plus loin. Reparer n'est pas construire, c'est la regle du journal
    // des erreurs, et l'interface l'ignorait.
    // Le libelle se DERIVE des perimetres, il n'est pas ecrit dans la donnee : le
    // jour ou un chantier est reclasse, l'etiquette suit, sans passe de correction.
    // Le TYPE du navire prime sur les périmètres du chantier. 122 navires portent
    // un type qui dit lui-même « refit », « restauration-refit » ou « conversion »,
    // et beaucoup sont sur des chantiers qui construisent aussi : l'étiquette
    // déduite des seuls périmètres disait donc « Chantier constructeur » sous un
    // navire dont la fiche affiche « refit » deux lignes plus haut. La donnée se
    // contredisait à l'écran, et elle avait raison dans le champ le plus précis.
    const REFIT = /^(restauration|refit|r[ée]paration|maintenance|car[ée]nage|conversion|jumboisation|allongement|passage)/i;
    const roleChantier = (v) => {
      if (REFIT.test(String(v.type || ""))) return "Chantier d'intervention (refit)";
      const p = v._cperims || [];
      if (!p.length) return "Chantier";
      if (p.includes("construction-neuve") || p.includes("naval-defense")) return "Chantier constructeur";
      if (p.includes("reparation-refit")) return "Chantier d'intervention (réparation, refit)";
      return "Chantier";
    };
    const tl = Array.isArray(v.timeline) ? v.timeline.filter((e) => e && e.annee) : [];
    const timelineHtml = tl.length
      ? `<div class="d-section"><h3>Vie du navire</h3>
          <ol class="tl">${tl.map((e) => `
            <li class="tl-item tl-${e.role || "evenement"}">
              <span class="tl-year">${e.annee}</span>
              <span class="tl-body"><span class="tl-role">${ROLE[e.role] || "Étape"}</span>
                <b>${e.nom || ""}</b>${e.detail ? ` <span class="tl-detail">${e.detail}</span>` : ""}${e.prix ? ` <span class="tl-prix">${e.prix}</span>` : ""}
                ${e.source ? ` <a class="tl-src" href="${e.source}" target="_blank" rel="noopener" title="source">↗</a>` : ""}
              </span>
            </li>`).join("")}</ol></div>`
      : "";
    $("#drawer-body").innerHTML = `
      <div class="d-eyebrow">Navire de référence</div>
      <h2 class="d-nom${clsEtat(etatNavire(v))}" id="d-nom">${v.nom || v.type} ${badgeEtat(etatNavire(v), true)}</h2>
      <div class="d-loc">${[v.type, v.annee, v.imo ? "IMO " + v.imo : null].filter(Boolean).join(" · ")}</div>
      ${(v.propulsion && v.propulsion.length) ? `<div class="d-perims" style="margin:14px 0 4px">${propChips(v.propulsion)}</div>` : ""}
      ${photoHtml}
      <div class="d-section"><h3>Caractéristiques techniques</h3>
        <div class="d-grid">${specRows.map(([k, x]) =>
          `<div class="d-fact"><div class="d-fact__k">${k}</div><div class="d-fact__v">${x}</div></div>`).join("")}</div></div>
      ${expRows.length ? `<div class="d-section"><h3>Exploitation</h3>
        <div class="d-grid">${expRows.map(([k, x]) =>
          `<div class="d-fact"><div class="d-fact__k">${k}</div><div class="d-fact__v">${x}</div></div>`).join("")}</div></div>` : ""}
      <div class="d-section"><h3>Conception &amp; construction</h3>
        ${v.architecte ? `<button class="ves-yard ves-yard--arch" data-open-arch="${esc(v.architecte)}"><span class="ves-yard__role">Architecte / ensemblier</span><b>${esc(v.architecte)}</b><span>voir l'architecte →</span></button>` : ""}
        <button class="ves-yard${v._cactif === false ? " is-termine" : ""}" data-open-chantier="${v._cid}"><span class="ves-yard__role">${roleChantier(v)}</span><b>${esc(v._cnom)}</b> ${v._cactif === false ? badgeEtat(ETATS.termine) : ""}<span>${esc(v._cville)} · voir la fiche du chantier →</span></button>
      </div>
      ${timelineHtml}
      ${sim.length ? `<div class="d-section"><h3>Navires similaires</h3>
        <ul class="d-list">${sim.map((s) => `
          <li style="flex-direction:column;gap:4px;align-items:flex-start">
            <span><b>${s.nom || s.type}</b>${s.annee ? ` <span style="color:var(--muted)">· ${s.annee}</span>` : ""}</span>
            ${vesselSpecs(s) ? `<span style="color:var(--muted);font-size:13px">${vesselSpecs(s)}</span>` : ""}
            <button class="ves-link" data-open-vessel="${s._idx}">${s._cnom} · ${s._cville} →</button>
          </li>`).join("")}</ul></div>` : ""}
      ${v.source ? `<div class="d-section"><h3>Source</h3><div class="d-sources"><a href="${v.source}" target="_blank" rel="noopener">${v.source}</a></div></div>` : ""}
      <div class="d-section d-corr">
        <button class="corr-trigger" type="button" data-corr-vessel>✎ Partager une correction</button>
      </div>`;
    $("#drawer-body").querySelectorAll("[data-open-chantier]").forEach((b) => b.addEventListener("click", () => openDrawer(b.dataset.openChantier)));
    $("#drawer-body").querySelectorAll("[data-open-vessel]").forEach((b) => b.addEventListener("click", () => openVessel(state.navires[+b.dataset.openVessel])));
    $("#drawer-body").querySelectorAll("[data-open-arch]").forEach((b) => b.addEventListener("click", () => {
      const a = (state.architectes || []).find((x) => x.nom === b.dataset.openArch); if (a) openArchitecte(a);
    }));
    const cvTrig = $("#drawer-body").querySelector("[data-corr-vessel]");
    if (cvTrig) cvTrig.addEventListener("click", () => openCorrForm({
      type: "navire", cible_nom: v.nom || v.type || "Navire",
      cible_contexte: [v.type, v.annee, "construit par " + v._cnom].filter(Boolean).join(" · "),
      cid: v._cid, vimo: v.imo || null, vnom: v.nom || null,
    }));
    $("#drawer").setAttribute("aria-hidden", "false");
  }

  function renderNavires(list) {
    const el = $("#nav-list");
    if (!list.length) { el.innerHTML = `<p class="empty">Aucun navire ne correspond à ces critères.</p>`; return; }
    el.innerHTML = list.map((n) => `
      <div class="card nav-card${clsEtat(etatNavire(n))}" data-vid="${n._idx}">
        <div class="card__body">
          <div class="nav-card__top">
            <div class="card__nom">${n.nom || n.type} ${badgeEtat(etatNavire(n))}</div>
            ${n.prix_acquisition ? `<div class="nav-prix" title="Prix : ${String(n.prix_acquisition).replace(/"/g, "&quot;")}">${priceEur(n.prix_acquisition)}</div>` : ""}
          </div>
          <div class="card__meta">${[n.type, n.annee].filter(Boolean).join(" · ")}</div>
          ${(n.propulsion && n.propulsion.length) ? `<div class="nav-props">${propChips(n.propulsion)}</div>` : ""}
          ${vesselSpecs(n) ? `<div class="nav-specs">${vesselSpecs(n)}</div>` : ""}
          ${n.operateur ? `<div class="nav-op">Opérateur : <b>${n.operateur}</b></div>` : ""}
          ${n.architecte ? `<div class="nav-yard">Architecte : <b>${n.architecte}</b></div>` : ""}
          <div class="nav-yard${n._cactif === false ? " is-termine" : ""}">Chantier : <b>${n._cnom}</b> ${n._cactif === false ? badgeEtat(ETATS.termine) : ""}<span>· ${n._cville}</span></div>
        </div>
      </div>`).join("");
    el.querySelectorAll(".nav-card[data-vid]").forEach((card) =>
      card.addEventListener("click", () => openVessel(state.navires[+card.dataset.vid])));
  }

  /* ---------- Render orchestration ---------- */
  function render() {
    const e = state.entity, m = effectiveMode();
    if (e === "navires") {
      const nl = filteredNavires();
      $("#count").innerHTML = nl.length === state.navires.length
        ? `<b>${state.navires.length}</b> navires de référence`
        : `<b>${nl.length}</b> sur ${state.navires.length} navires`;
      renderNavires(nl);
      return;
    }
    if (e === "dessertes") { return m === "carte" ? renderDessertesCarte() : renderDessertesAnnuaire(); }
    if (e === "operateurs") { return m === "carte" ? renderOperateursCarte() : renderOperateursAnnuaire(); }
    if (e === "architectes") { return m === "carte" ? renderArchitectesCarte() : renderArchitectesAnnuaire(); }
    if (e === "equipementiers") { return m === "carte" ? renderEquipementiersCarte() : renderEquipementiersAnnuaire(); }
    // Chantiers
    const list = sorted(filtered());
    $("#count").innerHTML = list.length === state.all.length
      ? `<b>${state.all.length}</b> sites recensés`
      : `<b>${list.length}</b> sur ${state.all.length} sites`;
    if (m === "carte") { mapChrome("chantiers"); renderMap(list); renderResults(list); renderInsets(list); }
    else renderTable(list);
  }

  // Affiche/masque la légende et le bandeau outre-mer selon l'entité cartographiée.
  function mapChrome(entity) {
    const lg = $("#legend"), om = $("#om-strip");
    if (entity === "equipementiers") {
      if (lg) {
        const lib = { "batteries": "Batteries et stockage",
          "moteurs-electriques": "Moteurs et conversion \u00e9lectrique",
          "piles-a-combustible": "Piles \u00e0 combustible et hydrog\u00e8ne",
          "velique": "Propulsion v\u00e9lique", "foils": "Foils et sustentation",
          "moteurs-hydrogene": "Moteurs \u00e0 combustion hydrog\u00e8ne",
          "solaire": "Solaire embarqu\u00e9",
          "revetements": "Rev\u00eatements et peintures de car\u00e8ne",
          "recuperation-chaleur": "R\u00e9cup\u00e9ration de chaleur (ORC)" };
        lg.style.display = "";
        lg.innerHTML = '<div class="legend__title">Levier</div>'
          + Object.keys(LEVIER_COULEUR).map(function (k) {
              return '<div class="legend__row"><span class="legend__dot" style="background:'
                + LEVIER_COULEUR[k] + '"></span>' + (lib[k] || k) + "</div>";
            }).join("");
      }
      if (om) { om.classList.add("is-hidden"); om.innerHTML = ""; }
      return;
    }
    if (entity === "operateurs") {
      if (lg) { lg.style.display = ""; lg.innerHTML = `<div class="legend__title">Opérateurs</div><div class="legend__row"><span class="legend__line"></span>desserte exploitée</div><div class="legend__row"><span class="legend__dot" style="background:#c0392b"></span>base / port d'attache</div>`; }
      if (om) { om.classList.add("is-hidden"); om.innerHTML = ""; }
      return;
    }
    if (entity === "chantiers") {
      if (lg) { lg.style.display = ""; lg.innerHTML = `<div class="legend__title">Périmètre</div>` + Object.keys(PERIM_COLORS).map((p) =>
        `<div class="legend__row"><span class="legend__dot" style="background:${PERIM_COLORS[p]}"></span>${perimLabel(p)}</div>`).join(""); }
    } else if (entity === "dessertes") {
      if (lg) { lg.style.display = ""; lg.innerHTML = `<div class="legend__title">Dessertes</div><div class="legend__row"><span class="legend__line"></span>ligne exploitée</div><div class="legend__row"><span class="legend__dot" style="background:#1F9AA8"></span>escale</div>`; }
      if (om) { om.classList.add("is-hidden"); om.innerHTML = ""; }
    } else {
      if (lg) { lg.style.display = ""; lg.innerHTML = `<div class="legend__title">Architectes</div><div class="legend__row"><span class="legend__dot" style="background:#7a3df0"></span>cabinet / ensemblier</div>`; }
      if (om) { om.classList.add("is-hidden"); om.innerHTML = ""; }
    }
  }

  /* ---------- Dessertes ---------- */
  function filteredDessertes() {
    const nq = norm(state.filters.q), pays = state.filters.pays, region = state.filters.region;
    return state.dessertes.filter((d) => {
      if (pays && !d.pays.has(pays)) return false;
      if (region && !d.regions.has(region)) return false;
      if (nq && !(norm(d.nom).includes(nq) || norm(d.operateur).includes(nq) || [...d.operateurs].some((o) => norm(o).includes(nq)))) return false;
      return true;
    });
  }
  function renderDessertesAnnuaire() {
    const list = filteredDessertes();
    $("#count").innerHTML = list.length === state.dessertes.length
      ? `<b>${state.dessertes.length}</b> dessertes recensées`
      : `<b>${list.length}</b> sur ${state.dessertes.length} dessertes`;
    const el = $("#dessertes-list");
    if (!list.length) { el.innerHTML = `<p class="empty">Aucune desserte ne correspond.</p>`; return; }
    el.innerHTML = list.map((d) => `
      <button class="ecard" data-did="${d._idx}">
        <div class="ecard__nom">${esc(d.nom)}</div>
        <div class="ecard__meta">${esc(d.operateur || [...d.operateurs].join(", ") || "Opérateur n.c.")}</div>
        <div class="ecard__stats"><span><b>${d.navires.length}</b> navire${d.navires.length > 1 ? "s" : ""}</span>${d.mapped ? `<span class="ecard__pin">◉ tracée</span>` : ""}</div>
      </button>`).join("");
    el.querySelectorAll("[data-did]").forEach((b) => b.addEventListener("click", () => openDesserte(state.dessertes[+b.dataset.did])));
  }
  function renderDessertesCarte() {
    if (!map || !markerLayer) return;
    mapChrome("dessertes");
    const list = filteredDessertes();
    $("#count").innerHTML = `<b>${list.length}</b> dessertes${list.length !== state.dessertes.length ? ` sur ${state.dessertes.length}` : ""}`;
    markerLayer.clearLayers(); markers.clear();
    list.forEach((d) => {
      if (!d.points.length) return;
      if (d.points.length >= 2) {
        L.polyline(d.points, { color: "#1F9AA8", weight: 2.5, opacity: 0.8 }).addTo(markerLayer);
      }
      d.points.forEach((pt) => {
        const mk = L.circleMarker(pt, { radius: 4, color: "#fff", weight: 1.5, fillColor: "#1F9AA8", fillOpacity: 1 });
        mk.bindPopup(`<div class="pp-nom">${esc(d.nom)}</div><div class="pp-meta">${esc(d.operateur)} · ${d.navires.length} navire(s)</div><div class="pp-btn" data-open-d="${d._idx}">Voir la desserte →</div>`);
        mk.on("popupopen", (e) => { const b = e.popup.getElement().querySelector("[data-open-d]"); if (b) b.addEventListener("click", () => openDesserte(state.dessertes[+b.dataset.openD])); });
        mk.addTo(markerLayer);
      });
    });
    renderDessertesSide(list);
    const nm = list.filter((d) => !d.mapped).length;
    const note = nm ? `<p class="side-note">${nm} desserte${nm > 1 ? "s" : ""} non localisée${nm > 1 ? "s" : ""} (escales hors gazetteer). Visibles en annuaire.</p>` : "";
    const side = $("#results"); if (side && note) side.insertAdjacentHTML("beforeend", note);
  }
  function renderDessertesSide(list) {
    const el = $("#results");
    if (!list.length) { el.innerHTML = `<p class="empty">Aucune desserte.</p>`; return; }
    el.innerHTML = list.map((d) => `
      <div class="card card--solo" data-did="${d._idx}">
        <div class="card__body">
          <div class="card__nom">${esc(d.nom)}</div>
          <div class="card__meta">${esc(d.operateur || "")} · ${d.navires.length} navire${d.navires.length > 1 ? "s" : ""}</div>
        </div>
      </div>`).join("");
    el.querySelectorAll("[data-did]").forEach((c) => c.addEventListener("click", () => {
      const d = state.dessertes[+c.dataset.did];
      if (d.points.length && map) { try { map.fitBounds(L.latLngBounds(d.points).pad(0.5), { maxZoom: 11 }); } catch (e) {} }
      openDesserte(d);
    }));
  }
  function openDesserte(d) {
    if (!d) return;
    const navs = d.navires.slice().sort((a, b) => norm(a.nom || a.type).localeCompare(norm(b.nom || b.type)));
    $("#drawer-body").innerHTML = `
      <div class="d-eyebrow">Desserte · ligne de service public</div>
      <h2 class="d-nom" id="d-nom">${esc(d.nom)}</h2>
      <div class="d-loc">${esc([...d.operateurs].join(", ") || "Opérateur n.c.")}</div>
      <div class="d-section"><h3>Informations</h3>
        <div class="d-grid">
          <div class="d-fact"><div class="d-fact__k">Opérateur(s)</div><div class="d-fact__v">${esc([...d.operateurs].join(", ") || "n.c.")}</div></div>
          <div class="d-fact"><div class="d-fact__k">Navires</div><div class="d-fact__v">${d.navires.length}</div></div>
          ${d.regions.size ? `<div class="d-fact"><div class="d-fact__k">Région(s)</div><div class="d-fact__v">${esc([...d.regions].join(", "))}</div></div>` : ""}
          ${d.chantiers.size ? `<div class="d-fact"><div class="d-fact__k">Chantier(s)</div><div class="d-fact__v">${listeSitesHtml(d.chantiers)}</div></div>` : ""}
        </div>
      </div>
      <div class="d-section"><h3>Navires affectés</h3>
        <ul class="d-list">${navs.map((n) => `
          <li class="ref-li" data-open-vessel="${n._idx}" style="flex-direction:column;gap:3px;align-items:flex-start">
            <span><b>${esc(n.nom || n.type || "Navire")}</b>${n.annee ? ` <span style="color:var(--muted)">· ${n.annee}</span>` : ""} <span class="ref-go">→</span></span>
            <span style="color:var(--muted);font-size:13px">${esc([n.type, n._cnom].filter(Boolean).join(" · "))}</span>
          </li>`).join("")}</ul></div>`;
    $("#drawer-body").querySelectorAll("[data-open-vessel]").forEach((el) =>
      el.addEventListener("click", () => openVessel(state.navires[+el.dataset.openVessel])));
    $("#drawer").setAttribute("aria-hidden", "false");
  }

  /* ---------- Architectes ---------- */
  function filteredArchitectes() {
    const nq = norm(state.filters.q);
    return state.architectes.filter((a) => !nq || norm(a.nom).includes(nq) || norm(a.ville).includes(nq));
  }
  function renderArchitectesAnnuaire() {
    const list = filteredArchitectes();
    $("#count").innerHTML = list.length === state.architectes.length
      ? `<b>${state.architectes.length}</b> architecte${state.architectes.length > 1 ? "s" : ""} / ensemblier${state.architectes.length > 1 ? "s" : ""}`
      : `<b>${list.length}</b> sur ${state.architectes.length} architectes`;
    const el = $("#architectes-list");
    if (!list.length) { el.innerHTML = `<p class="empty">Aucun architecte recensé pour l'instant. Le champ « architecte » s'enrichit au fil des fiches navire.</p>`; return; }
    el.innerHTML = list.map((a) => `
      <button class="ecard" data-aid="${a._idx}">
        <div class="ecard__nom">${esc(a.nom)}</div>
        <div class="ecard__meta">${esc([a.ville, a.pays].filter(Boolean).join(", ") || "Localisation n.c.")}</div>
        <div class="ecard__stats"><span><b>${a.navires.length}</b> navire${a.navires.length > 1 ? "s" : ""} conçu${a.navires.length > 1 ? "s" : ""}</span>${a.lat != null ? `<span class="ecard__pin">◉ situé</span>` : ""}</div>
      </button>`).join("");
    el.querySelectorAll("[data-aid]").forEach((b) => b.addEventListener("click", () => openArchitecte(state.architectes[+b.dataset.aid])));
  }
  function renderArchitectesCarte() {
    if (!map || !markerLayer) return;
    mapChrome("architectes");
    const list = filteredArchitectes();
    const placed = list.filter((a) => a.lat != null);
    $("#count").innerHTML = `<b>${list.length}</b> architecte${list.length > 1 ? "s" : ""}${placed.length < list.length ? ` · ${placed.length} situé(s)` : ""}`;
    markerLayer.clearLayers(); markers.clear();
    placed.forEach((a) => {
      const mk = L.circleMarker([a.lat, a.lon], { radius: 8, color: "#fff", weight: 2, fillColor: "#7a3df0", fillOpacity: 1 });
      mk.bindPopup(`<div class="pp-nom">${esc(a.nom)}</div><div class="pp-meta">${esc([a.ville, a.pays].filter(Boolean).join(", "))} · ${a.navires.length} navire(s)</div><div class="pp-btn" data-open-a="${a._idx}">Voir l'architecte →</div>`);
      mk.on("popupopen", (e) => { const b = e.popup.getElement().querySelector("[data-open-a]"); if (b) b.addEventListener("click", () => openArchitecte(state.architectes[+b.dataset.openA])); });
      mk.addTo(markerLayer);
    });
    renderArchitectesSide(list);
  }
  function renderArchitectesSide(list) {
    const el = $("#results");
    if (!list.length) { el.innerHTML = `<p class="empty">Aucun architecte.</p>`; return; }
    el.innerHTML = list.map((a) => `
      <div class="card card--solo" data-aid="${a._idx}">
        <div class="card__body">
          <div class="card__nom">${esc(a.nom)}</div>
          <div class="card__meta">${esc([a.ville, a.pays].filter(Boolean).join(", ") || "Localisation n.c.")} · ${a.navires.length} navire${a.navires.length > 1 ? "s" : ""}</div>
        </div>
      </div>`).join("");
    el.querySelectorAll("[data-aid]").forEach((c) => c.addEventListener("click", () => {
      const a = state.architectes[+c.dataset.aid];
      if (a.lat != null && map) map.setView([a.lat, a.lon], 9, { animate: true });
      openArchitecte(a);
    }));
  }
  function openArchitecte(a) {
    if (!a) return;
    const navs = a.navires.slice().sort((x, y) => norm(x.nom || x.type).localeCompare(norm(y.nom || y.type)));
    $("#drawer-body").innerHTML = `
      <div class="d-eyebrow">Architecte naval / ensemblier</div>
      <h2 class="d-nom" id="d-nom">${esc(a.nom)}</h2>
      <div class="d-loc">${esc([a.ville, a.region, a.pays].filter(Boolean).join(" · ") || "Localisation à préciser")}</div>
      <div class="d-section"><h3>Informations</h3>
        <div class="d-grid">
          <div class="d-fact"><div class="d-fact__k">Navires conçus</div><div class="d-fact__v">${a.navires.length}</div></div>
          ${a.chantiers.size ? `<div class="d-fact"><div class="d-fact__k">Chantier(s) constructeur(s)</div><div class="d-fact__v">${listeSitesHtml(a.chantiers)}</div></div>` : ""}
          ${a.operateurs.size ? `<div class="d-fact"><div class="d-fact__k">Opérateur(s)</div><div class="d-fact__v">${esc([...a.operateurs].join(", "))}</div></div>` : ""}
        </div>
      </div>
      <div class="d-section"><h3>Navires conçus</h3>
        <ul class="d-list">${navs.map((n) => `
          <li class="ref-li" data-open-vessel="${n._idx}" style="flex-direction:column;gap:3px;align-items:flex-start">
            <span><b>${esc(n.nom || n.type || "Navire")}</b>${n.annee ? ` <span style="color:var(--muted)">· ${n.annee}</span>` : ""} <span class="ref-go">→</span></span>
            <span style="color:var(--muted);font-size:13px">${esc([n.type, n.operateur].filter(Boolean).join(" · "))}</span>
          </li>`).join("")}</ul></div>`;
    $("#drawer-body").querySelectorAll("[data-open-vessel]").forEach((el) =>
      el.addEventListener("click", () => openVessel(state.navires[+el.dataset.openVessel])));
    $("#drawer").setAttribute("aria-hidden", "false");
  }

  /* ---------- Équipementiers (bloc racine, option B) ---------- */
  const LEVIER_COULEUR = {
    "batteries": "#1f9d55", "moteurs-electriques": "#0b7fd4",
    "piles-a-combustible": "#d4770b", "velique": "#7a3df0", "foils": "#c2185b",
    "moteurs-hydrogene": "#a1451c", "solaire": "#c9a227",
    "revetements": "#5d6d7e", "recuperation-chaleur": "#8d6e63",
  };
  function filteredEquipementiers() {
    const nq = norm(state.filters.q);
    return (state.equipementiers || []).filter((e) => !nq
      || norm(e.nom).includes(nq) || norm(e.ville).includes(nq)
      || norm(e.levier_libelle).includes(nq) || norm(e.produit).includes(nq));
  }
  function equipCount(list) {
    const tot = (state.equipementiers || []).length;
    $("#count").innerHTML = list.length === tot
      ? "<b>" + tot + "</b> équipementier" + (tot > 1 ? "s" : "")
      : "<b>" + list.length + "</b> sur " + tot + " équipementiers";
  }
  function renderEquipementiersAnnuaire() {
    const list = filteredEquipementiers();
    equipCount(list);
    const el = $("#equipementiers-list");
    if (!list.length) { el.innerHTML = '<p class="empty">Aucun équipementier.</p>'; return; }
    el.innerHTML = list.map(function (e) {
      const loc = esc([e.ville, e.pays].filter(Boolean).join(", ") || "Localisation n.c.");
      const res = e.confiance === "moyenne"
        ? '<span class="ecard__pin">source à conforter</span>' : "";
      return '<button class="ecard" data-eqid="' + e._idx + '">'
        + '<div class="ecard__nom">' + esc(e.nom) + "</div>"
        + '<div class="ecard__meta">' + loc + "</div>"
        + '<div class="ecard__stats"><span>' + esc(e.levier_libelle || "") + "</span>"
        + res + "</div></button>";
    }).join("");
    el.querySelectorAll("[data-eqid]").forEach(function (b) {
      b.addEventListener("click", function () {
        openEquipementier(state.equipementiers[+b.dataset.eqid]);
      });
    });
  }
  function renderEquipementiersCarte() {
    if (!map || !markerLayer) return;
    mapChrome("equipementiers");
    const list = filteredEquipementiers();
    equipCount(list);
    markerLayer.clearLayers(); markers.clear();
    list.filter(function (e) { return e.lat != null; }).forEach(function (e) {
      const mk = L.circleMarker([e.lat, e.lon], { radius: 8, color: "#fff", weight: 2,
        fillColor: LEVIER_COULEUR[e.levier] || "#555", fillOpacity: 1 });
      mk.bindPopup('<div class="pp-nom">' + esc(e.nom) + "</div>"
        + '<div class="pp-meta">' + esc([e.ville, e.pays].filter(Boolean).join(", "))
        + " &middot; " + esc(e.levier_libelle || "") + "</div>"
        + '<div class="pp-btn" data-open-eq="' + e._idx + '">Voir la fiche</div>');
      mk.on("popupopen", function (ev) {
        const b = ev.popup.getElement().querySelector("[data-open-eq]");
        if (b) b.addEventListener("click", function () {
          openEquipementier(state.equipementiers[+b.dataset.openEq]);
        });
      });
      mk.addTo(markerLayer);
    });
    renderEquipementiersSide(list);
  }
  function renderEquipementiersSide(list) {
    const el = $("#results");
    if (!list.length) { el.innerHTML = '<p class="empty">Aucun équipementier.</p>'; return; }
    el.innerHTML = list.map(function (e) {
      return '<div class="card card--solo" data-eqid="' + e._idx + '">'
        + '<div class="card__body"><div class="card__nom">' + esc(e.nom) + "</div>"
        + '<div class="card__meta">'
        + esc([e.ville, e.levier_libelle].filter(Boolean).join(" \u00b7 "))
        + "</div></div></div>";
    }).join("");
    el.querySelectorAll("[data-eqid]").forEach(function (c) {
      c.addEventListener("click", function () {
        const e = state.equipementiers[+c.dataset.eqid];
        if (e.lat != null && map) map.setView([e.lat, e.lon], 9, { animate: true });
        openEquipementier(e);
      });
    });
  }
  function openEquipementier(e) {
    if (!e) return;
    const yard = e.rattachement_chantier
      ? (state.all || []).find(function (c) { return c.id === e.rattachement_chantier; })
      : null;
    const fact = function (k, v) {
      return v ? '<div class="d-fact"><div class="d-fact__k">' + k
        + '</div><div class="d-fact__v">' + esc(v) + "</div></div>" : "";
    };
    $("#drawer-body").innerHTML =
      '<div class="d-eyebrow">Équipementier &middot; ' + esc(e.levier_libelle || "") + "</div>"
      + '<h2 class="d-nom' + clsEtat(etatSite(e)) + '" id="d-nom">' + esc(e.nom)
        + " " + badgeEtat(etatSite(e), true) + "</h2>"
      + '<div class="d-loc">'
      + esc([e.ville, e.region, e.pays].filter(Boolean).join(" \u00b7 ")
            || "Localisation à préciser") + "</div>"
      + (e.produit ? '<div class="d-section"><h3>Produit</h3><p>' + esc(e.produit)
                     + "</p></div>" : "")
      + '<div class="d-section"><h3>Informations</h3><div class="d-grid">'
      + fact("Raison sociale", e.raison_sociale)
      + fact("Levier", e.levier_libelle)
      + fact("Adresse", e.adresse)
      + fact("Niveau de confiance", e.confiance)
      + "</div></div>"
      + (yard ? '<div class="d-section"><h3>Rattachement</h3><p>Gamme portée par le chantier <b>'
                + esc(yard.nom) + "</b>, ce n'est pas une société indépendante.</p></div>" : "")
      + (e.note ? '<div class="d-section"><h3>Réserve</h3><p>' + esc(e.note) + "</p></div>" : "")
      + '<div class="d-section"><h3>Sources</h3><ul class="d-list">'
      + (e.sources || []).map(function (s) {
          return '<li><a href="' + esc(s) + '" target="_blank" rel="noopener noreferrer">'
            + esc(s) + "</a></li>";
        }).join("")
      + "</ul></div>";
    $("#drawer").setAttribute("aria-hidden", "false");
  }

  /* ---------- Opérateurs (couche normalisée) ---------- */
  function filteredOperateurs() {
    const nq = norm(state.filters.q), pays = state.filters.pays;
    return state.operateurs.filter((o) => {
      if (pays && !o.pays.has(pays)) return false;
      if (nq && !norm(o.nom).includes(nq)) return false;
      return true;
    });
  }
  function renderOperateursAnnuaire() {
    const list = filteredOperateurs();
    $("#count").innerHTML = list.length === state.operateurs.length
      ? `<b>${state.operateurs.length}</b> opérateurs (flottes normalisées)`
      : `<b>${list.length}</b> sur ${state.operateurs.length} opérateurs`;
    const el = $("#operateurs-list");
    if (!list.length) { el.innerHTML = `<p class="empty">Aucun opérateur ne correspond.</p>`; return; }
    el.innerHTML = list.map((o) => `
      <button class="ecard" data-oid="${o._idx}">
        <div class="ecard__nom">${esc(o.nom)}</div>
        <div class="ecard__meta">${o.dessertes.size ? esc([...o.dessertes].slice(0, 2).join(" · ")) + (o.dessertes.size > 2 ? " …" : "") : (o.pays.size ? esc([...o.pays].slice(0, 3).join(", ")) : "Flotte")}</div>
        <div class="ecard__stats"><span><b>${o.navires.length}</b> navire${o.navires.length > 1 ? "s" : ""}</span>${o.dessertes.size ? `<span>${o.dessertes.size} desserte${o.dessertes.size > 1 ? "s" : ""}</span>` : ""}${o.mapped ? `<span class="ecard__pin">◉ cartographié</span>` : ""}</div>
      </button>`).join("");
    el.querySelectorAll("[data-oid]").forEach((b) => b.addEventListener("click", () => openOperateur(state.operateurs[+b.dataset.oid])));
  }
  function renderOperateursCarte() {
    if (!map || !markerLayer) return;
    mapChrome("operateurs");
    const list = filteredOperateurs();
    const placed = list.filter((o) => o.mapped);
    $("#count").innerHTML = `<b>${list.length}</b> opérateurs${placed.length < list.length ? ` · ${placed.length} cartographié(s)` : ""}`;
    markerLayer.clearLayers(); markers.clear();
    placed.forEach((o) => {
      // Routes de l'opérateur (lignes + escales) en sarcelle, bases navales en rouge.
      const routes = new Set();
      o.dessertes.forEach((d) => { const dd = (state.dessertes || []).find((x) => x.nom === d); if (dd && dd.points.length) routes.add(dd); });
      routes.forEach((dd) => {
        if (dd.points.length >= 2) L.polyline(dd.points, { color: "#1F9AA8", weight: 2, opacity: 0.7 }).addTo(markerLayer);
        dd.points.forEach((pt) => {
          const mk = L.circleMarker(pt, { radius: 4, color: "#fff", weight: 1.5, fillColor: "#1F9AA8", fillOpacity: 1 });
          mk.bindPopup(`<div class="pp-nom">${esc(o.nom)}</div><div class="pp-meta">${esc(dd.nom)}</div><div class="pp-btn" data-open-o="${o._idx}">Voir l'opérateur →</div>`);
          mk.on("popupopen", (e) => { const b = e.popup.getElement().querySelector("[data-open-o]"); if (b) b.addEventListener("click", () => openOperateur(state.operateurs[+b.dataset.openO])); });
          mk.addTo(markerLayer);
        });
      });
      o.basePts.forEach(([name, pt]) => {
        const mk = L.circleMarker(pt, { radius: 7, color: "#fff", weight: 2, fillColor: "#c0392b", fillOpacity: 1 });
        mk.bindPopup(`<div class="pp-nom">${esc(o.nom)}</div><div class="pp-meta">Base : ${esc(name)}</div><div class="pp-btn" data-open-o="${o._idx}">Voir l'opérateur →</div>`);
        mk.on("popupopen", (e) => { const b = e.popup.getElement().querySelector("[data-open-o]"); if (b) b.addEventListener("click", () => openOperateur(state.operateurs[+b.dataset.openO])); });
        mk.addTo(markerLayer);
      });
    });
    renderOperateursSide(list);
    const nm = list.filter((o) => !o.mapped).length;
    if (nm) { const side = $("#results"); if (side) side.insertAdjacentHTML("beforeend", `<p class="side-note">${nm} opérateur${nm > 1 ? "s" : ""} sans desserte ni base localisée (haute mer, aquaculture, offshore…). Visibles en annuaire.</p>`); }
  }
  function renderOperateursSide(list) {
    const el = $("#results");
    if (!list.length) { el.innerHTML = `<p class="empty">Aucun opérateur.</p>`; return; }
    const mapped = list.filter((o) => o.mapped);
    el.innerHTML = (mapped.length ? mapped : list).map((o) => `
      <div class="card card--solo" data-oid="${o._idx}">
        <div class="card__body">
          <div class="card__nom">${esc(o.nom)}</div>
          <div class="card__meta">${o.navires.length} navire${o.navires.length > 1 ? "s" : ""}${o.dessertes.size ? ` · ${o.dessertes.size} desserte${o.dessertes.size > 1 ? "s" : ""}` : ""}${o.basePts.length ? ` · ${o.basePts.length} base${o.basePts.length > 1 ? "s" : ""}` : ""}</div>
        </div>
      </div>`).join("");
    el.querySelectorAll("[data-oid]").forEach((c) => c.addEventListener("click", () => {
      const o = state.operateurs[+c.dataset.oid];
      const pts = [...o.routePts, ...o.basePts.map(([, p]) => p)];
      if (pts.length && map) { try { map.fitBounds(L.latLngBounds(pts).pad(0.4), { maxZoom: 11 }); } catch (e) {} }
      openOperateur(o);
    }));
  }
  function openOperateur(o) {
    if (!o) return;
    const navs = o.navires.slice().sort((a, b) => norm(a.nom || a.type).localeCompare(norm(b.nom || b.type)));
    $("#drawer-body").innerHTML = `
      <div class="d-eyebrow">Opérateur / exploitant</div>
      <h2 class="d-nom" id="d-nom">${esc(o.nom)}</h2>
      <div class="d-loc">${o.navires.length} navire${o.navires.length > 1 ? "s" : ""} exploité${o.navires.length > 1 ? "s" : ""}${o.pays.size ? " · " + esc([...o.pays].slice(0, 4).join(", ")) : ""}</div>
      <div class="d-section"><h3>Informations</h3>
        <div class="d-grid">
          <div class="d-fact"><div class="d-fact__k">Flotte</div><div class="d-fact__v">${o.navires.length} navire${o.navires.length > 1 ? "s" : ""}</div></div>
          ${o.dessertes.size ? `<div class="d-fact"><div class="d-fact__k">Dessertes</div><div class="d-fact__v">${o.dessertes.size}</div></div>` : ""}
          ${o.basePts.length ? `<div class="d-fact"><div class="d-fact__k">Base(s)</div><div class="d-fact__v">${esc(o.basePts.map(([n]) => n).join(", "))}</div></div>` : ""}
          ${o.chantiers.size ? `<div class="d-fact"><div class="d-fact__k">Chantier(s)</div><div class="d-fact__v">${listeSitesHtml([...o.chantiers].slice(0, 6))}${o.chantiers.size > 6 ? "…" : ""}</div></div>` : ""}
        </div>
      </div>
      ${o.dessertes.size ? `<div class="d-section"><h3>Dessertes exploitées</h3>
        <ul class="d-list">${[...o.dessertes].sort((a, b) => norm(a).localeCompare(norm(b))).map((d) => {
          const dd = (state.dessertes || []).find((x) => x.nom === d);
          return `<li class="ref-li" ${dd ? `data-open-desserte="${dd._idx}"` : ""} style="align-items:center">${esc(d)}${dd ? ` <span class="ref-go">→</span>` : ""}</li>`;
        }).join("")}</ul></div>` : ""}
      <div class="d-section"><h3>Flotte</h3>
        <ul class="d-list">${navs.map((n) => `
          <li class="ref-li" data-open-vessel="${n._idx}" style="flex-direction:column;gap:3px;align-items:flex-start">
            <span><b>${esc(n.nom || n.type || "Navire")}</b>${n.annee ? ` <span style="color:var(--muted)">· ${n.annee}</span>` : ""} <span class="ref-go">→</span></span>
            <span style="color:var(--muted);font-size:13px">${esc([n.type, n.desserte, n._cnom].filter(Boolean).join(" · "))}</span>
          </li>`).join("")}</ul></div>`;
    $("#drawer-body").querySelectorAll("[data-open-vessel]").forEach((el) =>
      el.addEventListener("click", () => openVessel(state.navires[+el.dataset.openVessel])));
    $("#drawer-body").querySelectorAll("[data-open-desserte]").forEach((el) =>
      el.addEventListener("click", () => openDesserte(state.dessertes[+el.dataset.openDesserte])));
    $("#drawer").setAttribute("aria-hidden", "false");
  }

  /* ---------- Cartouches d'outre-mer (contours locaux) ---------- */
  // Projette lon/lat dans une boite SVG W×H avec correction cosinus, en preservant l'aspect.
  function makeProjector(bbox, W, H, pad) {
    const [lon0, lat0, lon1, lat1] = bbox;
    const midlat = (lat0 + lat1) / 2;
    const kx = Math.cos((midlat * Math.PI) / 180) || 1;
    const geoW = Math.max((lon1 - lon0) * kx, 1e-6);
    const geoH = Math.max(lat1 - lat0, 1e-6);
    const s = Math.min((W - 2 * pad) / geoW, (H - 2 * pad) / geoH);
    const ox = (W - geoW * s) / 2;
    const oy = (H - geoH * s) / 2;
    return (lon, lat) => [ox + (lon - lon0) * kx * s, oy + (lat1 - lat) * s];
  }

  function buildInsetSvg(terr, chantiers) {
    const W = 132, H = 104, pad = 9;
    const rings = state.omPolys[terr] || [];
    // bbox = contours + chantiers (pour que les points soient toujours visibles)
    let lon0 = 999, lat0 = 999, lon1 = -999, lat1 = -999;
    const grow = (lo, la) => { lon0 = Math.min(lon0, lo); lat0 = Math.min(lat0, la); lon1 = Math.max(lon1, lo); lat1 = Math.max(lat1, la); };
    rings.forEach((r) => r.forEach(([lo, la]) => grow(lo, la)));
    chantiers.forEach((c) => grow(c.lon, c.lat));
    if (lon0 === 999) return "";
    // marge geographique
    const mx = (lon1 - lon0) * 0.08 || 0.05, my = (lat1 - lat0) * 0.08 || 0.05;
    const proj = makeProjector([lon0 - mx, lat0 - my, lon1 + mx, lat1 + my], W, H, pad);
    const paths = rings.map((r) => {
      const d = r.map(([lo, la], i) => (i ? "L" : "M") + proj(lo, la).map((v) => v.toFixed(1)).join(" ")).join(" ");
      return `<path d="${d}Z" class="om-land"/>`;
    }).join("");
    const dots = chantiers.map((c) => {
      const [x, y] = proj(c.lon, c.lat);
      const color = PERIM_COLORS[primaryPerim(c)];
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${color}" stroke="#fff" stroke-width="1.5" class="om-dot" data-id="${c.id}"><title>${c.nom}</title></circle>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="om-svg" role="img" aria-label="${terr}">${paths}${dots}</svg>`;
  }

  function renderInsets(list) {
    const strip = $("#om-strip"); if (!strip) return;
    const om = list.filter(isOutremer);
    if (!om.length) { strip.classList.add("is-hidden"); strip.innerHTML = ""; return; }
    const byReg = {};
    om.forEach((c) => (byReg[c.region] = byReg[c.region] || []).push(c));
    strip.innerHTML = Object.keys(byReg).sort((a, b) => a.localeCompare(b)).map((terr) => {
      const cs = byReg[terr];
      return `<figure class="om-inset" data-terr="${terr}">
        ${buildInsetSvg(terr, cs)}
        <figcaption><span class="om-inset__t">${terr}</span><span class="om-inset__n">${cs.length}</span></figcaption>
      </figure>`;
    }).join("");
    strip.classList.remove("is-hidden");
    strip.querySelectorAll(".om-dot[data-id]").forEach((el) =>
      el.addEventListener("click", (e) => { e.stopPropagation(); openDrawer(el.dataset.id); }));
    // Clic sur le cartouche (hors point) = index texte du territoire.
    strip.querySelectorAll(".om-inset").forEach((fig) =>
      fig.addEventListener("click", () => openOutremer(om.filter((c) => c.region === fig.dataset.terr))));
  }

  load().catch((err) => {
    document.getElementById("results").innerHTML =
      `<p class="empty">Données indisponibles. Lancez le site via un serveur HTTP (voir README).</p>`;
    console.error(err);
  });
})();
