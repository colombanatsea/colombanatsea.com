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

  // Territoires d'outre-mer : hors emprise de la carte métropole, regroupés dans un index dédié.
  const OUTREMER_REGIONS = new Set([
    "Martinique", "Guadeloupe", "La Réunion", "Mayotte", "Guyane",
    "Polynésie française", "Nouvelle-Calédonie", "Saint-Pierre-et-Miquelon",
    "Saint-Martin", "Saint-Barthélemy", "Wallis-et-Futuna",
  ]);
  const isOutremer = (c) => OUTREMER_REGIONS.has(c.region);

  const state = {
    all: [],
    perimRef: {},
    typesRef: {},
    filters: { q: "", perims: new Set(), type: "", region: "", pays: "",
      navProps: new Set(), navCapType: "", navCapMin: 0, navLenMin: 0, navLenMax: 0 },
    sort: { key: "nom", dir: 1 },
    view: "map",
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

  /* ---------- Data ---------- */
  async function load() {
    const res = await fetch("data/chantiers.json", { cache: "no-cache" });
    const data = await res.json();
    state.all = data.chantiers;
    state.perimRef = data.meta.perimetres_ref || {};
    state.typesRef = data.meta.types_navires_ref || {};
    // Index plat des navires de référence (recherche par navire).
    state.navires = [];
    state.all.forEach((c) => (c.navires_references || []).forEach((n) => {
      if (n && (n.nom || n.type)) {
        n._idx = state.navires.length; n._cid = c.id; n._cnom = c.nom; n._cville = c.ville; n._cregion = c.region; n._cpays = c.pays;
        n._cperims = c.perimetres || []; n._ctypes = c.types_navires || [];
        state.navires.push(n);
      }
    }));
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
    // Fond des pays étrangers (registre naval européen), servi en local.
    state.foreignGeo = null;
    try {
      const fr = await fetch("data/foreign-countries.geojson", { cache: "force-cache" });
      if (fr.ok) state.foreignGeo = await fr.json();
    } catch (e) { console.warn("Fond pays étrangers indisponible", e); }
    buildControls();
    try { initMap(geo); } catch (e) { console.error("Carte indisponible", e); showMapFallback(); }
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

  function filteredNavires() {
    const { q, perims, type, region, navProps, navCapType, navCapMin, navLenMin, navLenMax } = state.filters;
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
      // Capacité : type (pax/véhicules/fret) avec seuil minimum.
      if (navCapType) {
        const val = navCapType === "pax" ? n.capacite_pax : navCapType === "veh" ? n.capacite_vehicules : (n.capacite_fret ? parseInt(String(n.capacite_fret).replace(/[^\d]/g, ""), 10) : null);
        if (val == null || isNaN(val)) return false;
        if (navCapMin && val < navCapMin) return false;
      }
      // Taille : longueur hors-tout dans la fourchette.
      if (navLenMin && !(n.longueur_m >= navLenMin)) return false;
      if (navLenMax && !(n.longueur_m <= navLenMax)) return false;
      if (nq && !(norm(n.nom).includes(nq) || norm(n.type).includes(nq) || norm(n.client).includes(nq) || norm(n.operateur).includes(nq) || norm(n.proprietaire).includes(nq) || norm(n._cnom).includes(nq))) return false;
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
    const PAYS_ORDER = ["France", "Norvège", "Écosse", "Suède"];
    const paysSet = [...new Set(state.all.map((c) => c.pays))];
    const paysList = PAYS_ORDER.filter((p) => paysSet.includes(p)).concat(paysSet.filter((p) => !PAYS_ORDER.includes(p)));
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
    const onNum = (sel, key) => { const el = $(sel); if (el) el.addEventListener("input", () => { state.filters[key] = parseInt(el.value, 10) || 0; render(); }); };
    const fCapType = $("#f-cap-type");
    if (fCapType) fCapType.addEventListener("change", () => { state.filters.navCapType = fCapType.value; render(); });
    onNum("#f-cap-min", "navCapMin");
    onNum("#f-len-min", "navLenMin");
    onNum("#f-len-max", "navLenMax");
    const fNavReset = $("#f-nav-reset");
    if (fNavReset) fNavReset.addEventListener("click", () => {
      state.filters.navProps = new Set(); state.filters.navCapType = ""; state.filters.navCapMin = 0; state.filters.navLenMin = 0; state.filters.navLenMax = 0;
      document.querySelectorAll("#f-prop .is-on").forEach((c) => c.classList.remove("is-on"));
      ["#f-cap-type", "#f-cap-min", "#f-len-min", "#f-len-max"].forEach((s) => { const el = $(s); if (el) el.value = ""; });
      render();
    });

    // Retour au début : efface filtres, recherche, tri, ferme la fiche,
    // revient à la carte et la recentre sur la France.
    function resetAll() {
      state.filters = { q: "", perims: new Set(), type: "", region: "", pays: "",
        navProps: new Set(), navCapType: "", navCapMin: 0, navLenMin: 0, navLenMax: 0 };
      state.sort = { key: "nom", dir: 1 };
      state.activeId = null;
      $("#search").value = ""; selT.value = ""; selR.value = ""; if ($("#f-pays")) $("#f-pays").value = "";
      document.querySelectorAll(".chip.is-on, #f-prop .is-on").forEach((c) => c.classList.remove("is-on"));
      ["#f-cap-type", "#f-cap-min", "#f-len-min", "#f-len-max"].forEach((s) => { const el = $(s); if (el) el.value = ""; });
      $("#drawer").setAttribute("aria-hidden", "true");
      setView("map");
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

    // View toggle
    $("#btn-map").addEventListener("click", () => setView("map"));
    $("#btn-dir").addEventListener("click", () => setView("dir"));
    if ($("#btn-nav")) $("#btn-nav").addEventListener("click", () => setView("nav"));

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

  function setView(v) {
    state.view = v;
    [["map", "#btn-map"], ["dir", "#btn-dir"], ["nav", "#btn-nav"]].forEach(([k, sel]) => {
      const b = $(sel); if (!b) return;
      b.classList.toggle("is-active", v === k); b.setAttribute("aria-selected", v === k);
    });
    $("#view-map").classList.toggle("is-hidden", v !== "map");
    $("#view-dir").classList.toggle("is-hidden", v !== "dir");
    $("#view-nav").classList.toggle("is-hidden", v !== "nav");
    if (v === "map" && map) setTimeout(() => map.invalidateSize(), 60);
    render();
  }

  /* ---------- Map ---------- */
  function showMapFallback() {
    const wrap = document.querySelector(".mapwrap");
    if (wrap) wrap.innerHTML = '<div class="map-fallback">Carte indisponible. La liste et l\'annuaire restent pleinement utilisables.</div>';
  }

  function initMap(geo) {
    if (typeof L === "undefined") { showMapFallback(); return; }
    map = L.map("map", { zoomControl: true, attributionControl: false, minZoom: 4, maxZoom: 12 });
    const landStyle = { fillColor: "#DBE6EF", color: "#A8BCCD", weight: 1, fillOpacity: 1 };
    let bounds = null;
    if (geo) {
      const layer = L.geoJSON(geo, { style: landStyle, interactive: false }).addTo(map);
      try { bounds = layer.getBounds(); } catch (e) { /* noop */ }
    }
    // Fond des pays étrangers (registre européen) : même style, par-dessous les marqueurs.
    if (state.foreignGeo) {
      try {
        const fl = L.geoJSON(state.foreignGeo, { style: landStyle, interactive: false }).addTo(map);
        bounds = bounds ? bounds.extend(fl.getBounds()) : fl.getBounds();
      } catch (e) { /* noop */ }
    }
    if (bounds && bounds.isValid()) { state.homeBounds = bounds; map.fitBounds(bounds, { padding: [16, 16] }); }
    else { map.setView([54, 6], 4); }
    markerLayer = L.layerGroup().addTo(map);
    // La grille CSS peut finir sa mise en page après l'init : on recalcule la taille.
    setTimeout(() => map.invalidateSize(), 0);
    requestAnimationFrame(() => map.invalidateSize());
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
      const color = PERIM_COLORS[primaryPerim(c)];
      const m = L.circleMarker([c.lat, c.lon], {
        radius: 8, color: "#ffffff", weight: 2, fillColor: color, fillOpacity: 1,
      });
      m.bindPopup(
        `<div class="pp-nom">${c.nom}</div>
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
      <div class="card${c.id === state.activeId ? " is-active" : ""}" data-id="${c.id}">
        <div class="card__no">${String(i + 1).padStart(2, "0")}</div>
        <div class="card__body">
          <div class="card__nom">${c.nom}</div>
          <div class="card__meta">${c.ville} · ${c.region}</div>
          <div class="card__perims">${c.perimetres.map(tag).join("")}</div>
        </div>
      </div>`).join("");
    el.querySelectorAll(".card[data-id]").forEach((card) => {
      const id = card.dataset.id;
      card.addEventListener("click", () => {
        const m = markers.get(id);
        if (m && map && state.view === "map") { map.setView(m.getLatLng(), 9, { animate: true }); m.openPopup(); }
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
      <tr data-id="${c.id}">
        <td><div class="t-nom">${c.nom}</div><div class="t-sub">${c.types_navires.map(typeLabel).slice(0,3).join(", ")}</div></td>
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
              <span><b>${n.nom || n.type || "Navire"}</b>${n.type && n.nom ? ` <span style="color:var(--muted)">· ${n.type}</span>` : ""}${n.annee ? ` <span style="color:var(--muted)">· ${n.annee}</span>` : ""}${n._idx != null ? ` <span class="ref-go">→</span>` : ""}</span>
              ${refSpecs(n) ? `<span style="color:var(--muted);font-size:13px">${refSpecs(n)}</span>` : ""}
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
      <h2 class="d-nom" id="d-nom">${c.nom}</h2>
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
      ["Capacité", cap || v.capacite], ["Desserte", v.desserte], ["Énergie", v.energie], ["Classification", v.classification],
    ].filter(([, x]) => x != null && x !== "");
    // Exploitation : commanditaire (client), opérateur, propriétaire, pavillon actuels.
    const expRows = [
      ["Commanditaire", v.client], ["Opérateur", v.operateur], ["Propriétaire", v.proprietaire], ["Pavillon", v.pavillon],
    ].filter(([, x]) => x != null && x !== "");
    const ROLE = { construction: "Construction", proprietaire: "Propriétaire", operateur: "Opérateur", pavillon: "Pavillon", renommage: "Renommage", conversion: "Conversion", evenement: "Événement" };
    const tl = Array.isArray(v.timeline) ? v.timeline.filter((e) => e && e.annee) : [];
    const timelineHtml = tl.length
      ? `<div class="d-section"><h3>Vie du navire</h3>
          <ol class="tl">${tl.map((e) => `
            <li class="tl-item tl-${e.role || "evenement"}">
              <span class="tl-year">${e.annee}</span>
              <span class="tl-body"><span class="tl-role">${ROLE[e.role] || "Étape"}</span>
                <b>${e.nom || ""}</b>${e.detail ? ` <span class="tl-detail">${e.detail}</span>` : ""}
                ${e.source ? ` <a class="tl-src" href="${e.source}" target="_blank" rel="noopener" title="source">↗</a>` : ""}
              </span>
            </li>`).join("")}</ol></div>`
      : "";
    $("#drawer-body").innerHTML = `
      <div class="d-eyebrow">Navire de référence</div>
      <h2 class="d-nom" id="d-nom">${v.nom || v.type}</h2>
      <div class="d-loc">${[v.type, v.annee, v.imo ? "IMO " + v.imo : null].filter(Boolean).join(" · ")}</div>
      ${(v.propulsion && v.propulsion.length) ? `<div class="d-perims" style="margin:14px 0 4px">${propChips(v.propulsion)}</div>` : ""}
      <div class="d-section"><h3>Caractéristiques</h3>
        <div class="d-grid">${specRows.map(([k, x]) =>
          `<div class="d-fact"><div class="d-fact__k">${k}</div><div class="d-fact__v">${x}</div></div>`).join("")}</div></div>
      ${expRows.length ? `<div class="d-section"><h3>Exploitation</h3>
        <div class="d-grid">${expRows.map(([k, x]) =>
          `<div class="d-fact"><div class="d-fact__k">${k}</div><div class="d-fact__v">${x}</div></div>`).join("")}</div></div>` : ""}
      <div class="d-section"><h3>Construit par</h3>
        <button class="ves-yard" data-open-chantier="${v._cid}"><b>${v._cnom}</b><span>${v._cville} · voir la fiche du chantier →</span></button>
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
      <div class="card nav-card" data-vid="${n._idx}">
        <div class="card__body">
          <div class="card__nom">${n.nom || n.type}</div>
          <div class="card__meta">${[n.type, n.annee].filter(Boolean).join(" · ")}</div>
          ${(n.propulsion && n.propulsion.length) ? `<div class="nav-props">${propChips(n.propulsion)}</div>` : ""}
          ${vesselSpecs(n) ? `<div class="nav-specs">${vesselSpecs(n)}</div>` : ""}
          ${n.operateur ? `<div class="nav-op">Opérateur : <b>${n.operateur}</b></div>` : ""}
          <div class="nav-yard">Chantier : <b>${n._cnom}</b> <span>· ${n._cville}</span></div>
        </div>
      </div>`).join("");
    el.querySelectorAll(".nav-card[data-vid]").forEach((card) =>
      card.addEventListener("click", () => openVessel(state.navires[+card.dataset.vid])));
  }

  /* ---------- Render orchestration ---------- */
  function render() {
    if (state.view === "nav") {
      const nl = filteredNavires();
      $("#count").innerHTML = nl.length === state.navires.length
        ? `<b>${state.navires.length}</b> navires de référence`
        : `<b>${nl.length}</b> sur ${state.navires.length} navires`;
      renderNavires(nl);
      return;
    }
    const list = sorted(filtered());
    $("#count").innerHTML = list.length === state.all.length
      ? `<b>${state.all.length}</b> sites recensés`
      : `<b>${list.length}</b> sur ${state.all.length} sites`;
    if (state.view === "map") { renderMap(list); renderResults(list); renderInsets(list); }
    else renderTable(list);
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
