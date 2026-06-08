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

  const state = {
    all: [],
    perimRef: {},
    typesRef: {},
    filters: { q: "", perims: new Set(), type: "", region: "" },
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
        n._idx = state.navires.length; n._cid = c.id; n._cnom = c.nom; n._cville = c.ville; n._cregion = c.region;
        state.navires.push(n);
      }
    }));
    // Fond de carte France, servi en local (aucune dépendance externe).
    let geo = null;
    try {
      const gr = await fetch("data/france-regions.geojson", { cache: "force-cache" });
      if (gr.ok) geo = await gr.json();
    } catch (e) { console.warn("Fond de carte indisponible", e); }
    buildControls();
    try { initMap(geo); } catch (e) { console.error("Carte indisponible", e); showMapFallback(); }
    render();
  }

  /* ---------- Filtering / sorting ---------- */
  function filtered() {
    const { q, perims, type, region } = state.filters;
    const nq = norm(q);
    return state.all.filter((c) => {
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
  const FAMILLES = ["ferry","bac","ropax","ro-ro","car-ferry","passagers","croisiere","paquebot","catamaran","trimaran","voilier","goelette","motoryacht","yacht","chalutier","thonier","ligneur","caseyeur","fileyeur","crevettier","peche","remorqueur","pousseur","peniche","patrouilleur","intercepteur","opv","fregate","corvette","aviso","sous-marin","ravitailleur","baliseur","pilotine","pilote","vedette","methanier","gazier","drague","barge","crewboat","servitude","hydrographique","scientifique","navire-ecole"];
  const STOP = new Set(["navire","navires","de","du","des","la","le","les","un","une","modele","modeles","gamme","serie","series","reference","references","refit","reparation","bateau","bateaux","unite","unites","classe","type","et","a","au","aux","pour","sur","mesure"]);
  const famille = (t) => {
    const n = norm(t);
    const hit = FAMILLES.find((f) => n.includes(norm(f)));
    if (hit) return hit;
    const tok = n.split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w));
    return tok[0] || n;
  };

  function filteredNavires() {
    const { q, region } = state.filters;
    const nq = norm(q);
    return state.navires.filter((n) => {
      if (region && n._cregion !== region) return false;
      if (nq && !(norm(n.nom).includes(nq) || norm(n.type).includes(nq) || norm(n.client).includes(nq) || norm(n._cnom).includes(nq))) return false;
      return true;
    });
  }

  function similarVessels(v) {
    const fam = famille(v.type);
    const L = v.longueur_m;
    return state.navires
      .filter((n) => n._idx !== v._idx && famille(n.type) === fam)
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

    // Regions
    const regions = [...new Set(state.all.map((c) => c.region))].sort((a, b) => a.localeCompare(b));
    const selR = $("#f-region");
    regions.forEach((r) => selR.add(new Option(r, r)));
    selR.addEventListener("change", () => { state.filters.region = selR.value; render(); });

    // Search
    $("#search").addEventListener("input", (e) => { state.filters.q = e.target.value; render(); });

    // Reset
    $("#reset").addEventListener("click", () => {
      state.filters = { q: "", perims: new Set(), type: "", region: "" };
      $("#search").value = ""; selT.value = ""; selR.value = "";
      document.querySelectorAll(".chip.is-on").forEach((c) => c.classList.remove("is-on"));
      render();
    });

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

    // Drawer close
    document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeDrawer));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
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
    map = L.map("map", { zoomControl: true, attributionControl: false, minZoom: 5, maxZoom: 12 });
    if (geo) {
      const layer = L.geoJSON(geo, {
        style: { fillColor: "#DBE6EF", color: "#A8BCCD", weight: 1, fillOpacity: 1 },
        interactive: false,
      }).addTo(map);
      try { map.fitBounds(layer.getBounds(), { padding: [16, 16] }); }
      catch (e) { map.setView([46.6, 2.4], 6); }
    } else {
      map.setView([46.6, 2.4], 6);
    }
    markerLayer = L.layerGroup().addTo(map);
    // La grille CSS peut finir sa mise en page après l'init : on recalcule la taille.
    setTimeout(() => map.invalidateSize(), 0);
    requestAnimationFrame(() => map.invalidateSize());
  }

  function renderMap(list) {
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();
    markers.clear();
    list.forEach((c) => {
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
      </div>`;

    $("#drawer-body").querySelectorAll("[data-open-vessel]").forEach((el) =>
      el.addEventListener("click", () => openVessel(state.navires[+el.dataset.openVessel])));
    $("#drawer").setAttribute("aria-hidden", "false");
    render();
  }

  function closeDrawer() {
    $("#drawer").setAttribute("aria-hidden", "true");
    state.activeId = null;
    render();
  }

  /* ---------- Panneau navire ---------- */
  function openVessel(v) {
    if (!v) return;
    const sim = similarVessels(v);
    const specRows = [
      ["Type", v.type], ["Année", v.annee],
      ["Longueur", v.longueur_m ? v.longueur_m + " m" : null],
      ["Jauge", v.jauge_gt ? v.jauge_gt.toLocaleString("fr-FR") + " GT" : null],
      ["Port en lourd", v.port_lourd_dwt ? v.port_lourd_dwt.toLocaleString("fr-FR") + " DWT" : null],
      ["Capacité", v.capacite], ["Énergie", v.energie],
      ["Armateur", v.client], ["Classification", v.classification],
    ].filter(([, x]) => x != null && x !== "");
    $("#drawer-body").innerHTML = `
      <div class="d-eyebrow">Navire de référence</div>
      <h2 class="d-nom" id="d-nom">${v.nom || v.type}</h2>
      <div class="d-loc">${[v.type, v.annee].filter(Boolean).join(" · ")}</div>
      <div class="d-section"><h3>Caractéristiques</h3>
        <div class="d-grid">${specRows.map(([k, x]) =>
          `<div class="d-fact"><div class="d-fact__k">${k}</div><div class="d-fact__v">${x}</div></div>`).join("")}</div></div>
      <div class="d-section"><h3>Construit par</h3>
        <button class="ves-yard" data-open-chantier="${v._cid}"><b>${v._cnom}</b><span>${v._cville} · voir la fiche du chantier →</span></button>
      </div>
      ${sim.length ? `<div class="d-section"><h3>Navires similaires</h3>
        <ul class="d-list">${sim.map((s) => `
          <li style="flex-direction:column;gap:4px;align-items:flex-start">
            <span><b>${s.nom || s.type}</b>${s.annee ? ` <span style="color:var(--muted)">· ${s.annee}</span>` : ""}</span>
            ${vesselSpecs(s) ? `<span style="color:var(--muted);font-size:13px">${vesselSpecs(s)}</span>` : ""}
            <button class="ves-link" data-open-vessel="${s._idx}">${s._cnom} · ${s._cville} →</button>
          </li>`).join("")}</ul></div>` : ""}
      ${v.source ? `<div class="d-section"><h3>Source</h3><div class="d-sources"><a href="${v.source}" target="_blank" rel="noopener">${v.source}</a></div></div>` : ""}`;
    $("#drawer-body").querySelectorAll("[data-open-chantier]").forEach((b) => b.addEventListener("click", () => openDrawer(b.dataset.openChantier)));
    $("#drawer-body").querySelectorAll("[data-open-vessel]").forEach((b) => b.addEventListener("click", () => openVessel(state.navires[+b.dataset.openVessel])));
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
          ${vesselSpecs(n) ? `<div class="nav-specs">${vesselSpecs(n)}</div>` : ""}
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
    if (state.view === "map") { renderMap(list); renderResults(list); }
    else renderTable(list);
  }

  load().catch((err) => {
    document.getElementById("results").innerHTML =
      `<p class="empty">Données indisponibles. Lancez le site via un serveur HTTP (voir README).</p>`;
    console.error(err);
  });
})();
