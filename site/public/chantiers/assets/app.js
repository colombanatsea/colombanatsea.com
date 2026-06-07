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
      if (nq && !(norm(c.nom).includes(nq) || norm(c.ville).includes(nq) || norm(c.groupe).includes(nq))) return false;
      if (perims.size && !c.perimetres.some((p) => perims.has(p))) return false;
      if (type && !c.types_navires.includes(type)) return false;
      if (region && c.region !== region) return false;
      return true;
    });
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
    $("#btn-map").classList.toggle("is-active", v === "map");
    $("#btn-dir").classList.toggle("is-active", v === "dir");
    $("#btn-map").setAttribute("aria-selected", v === "map");
    $("#btn-dir").setAttribute("aria-selected", v === "dir");
    $("#view-map").classList.toggle("is-hidden", v !== "map");
    $("#view-dir").classList.toggle("is-hidden", v !== "dir");
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

      ${capHtml}
      ${prodHtml}
      ${persHtml}
      ${histHtml}
      ${contactHtml}

      <div class="d-section"><h3>Sources</h3>
        <div class="d-sources">${(c.sources || []).map((s) =>
          `<a href="${s}" target="_blank" rel="noopener">${s}</a>`).join("")}</div>
      </div>`;

    $("#drawer").setAttribute("aria-hidden", "false");
    render();
  }

  function closeDrawer() {
    $("#drawer").setAttribute("aria-hidden", "true");
    state.activeId = null;
    render();
  }

  /* ---------- Render orchestration ---------- */
  function render() {
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
