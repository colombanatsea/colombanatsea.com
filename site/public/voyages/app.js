/* Controleur de l'app — rendu delegue au moteur teste (render.js / MAPRENDER). */
const $ = (s, r = document) => r.querySelector(s);

const state = {
  voyage: { seafarer: "", vessels: [] },
  routed: null,
  theme: "parchment", projection: "atlantic",
  showRoutes: true, showPorts: true, showLabels: true, showLegend: true,
  title: "", subtitle: "", lbls: null, lang: "fr",
};
state.lang = window.I18N[(navigator.language || "fr").slice(0, 2)] ? (navigator.language || "fr").slice(0, 2) : "fr";

let WORLD = null, PORTS = [], RENDER = null;
const t = (k) => (window.I18N[state.lang] && window.I18N[state.lang][k]) || window.I18N.en[k] || k;

const THEME_KEYS = [["parchment", "th_parchment"], ["nautical", "th_nautical"], ["bathy", "th_bathy"], ["sober", "th_sober"], ["bw", "th_bw"], ["blueprint", "th_blueprint"]];
const PROJ_KEYS = [["atlantic", "pr_atlantic"], ["pacific", "pr_pacific"], ["natural", "pr_natural"], ["mercator", "pr_mercator"], ["spilhaus", "pr_spilhaus"]];
const TKEY = Object.fromEntries(THEME_KEYS), PKEY = Object.fromEntries(PROJ_KEYS);
const PRESETS = [
  { theme: "parchment", proj: "atlantic" }, { theme: "nautical", proj: "natural" },
  { theme: "bathy", proj: "spilhaus" }, { theme: "bw", proj: "atlantic" }, { theme: "blueprint", proj: "mercator" },
];

/* ---------- render wrapper (delegue au moteur teste) ---------- */
function renderMap() {
  if (!RENDER) return;
  state.lbls = { v: t("vessels"), p: t("ports"), m: t("miles"), emb: t("st_emb"), sea: t("st_sea"), port: t("st_port") };
  state.credits = t("credits");
  state.keyLbls = { ais: t("key_ais"), inf: t("key_inferred") };
  state.portTip = t("port_click");
  const host = $("#poster");
  const svg = RENDER.renderMap(host, { state, world: WORLD, routed: state.routed });
  const W = +svg.dataset.w, H = +svg.dataset.h;
  const stage = $("#stage").getBoundingClientRect();
  const scale = Math.min((stage.width - 56) / W, (stage.height - 56) / H, 1.3);
  svg.setAttribute("width", Math.round(W * scale)); svg.setAttribute("height", Math.round(H * scale));
  enableDrag(svg, "legend", "legendPos");
  enableDrag(svg, "cartouche", "cartouchePos");
  wirePortClicks(svg);
}

// déplacement d'un élément du poster (légende, cartouche) — écran -> coordonnées poster
function enableDrag(svg, id, stateKey) {
  const g = svg.querySelector("#" + id); if (!g) return;
  const toVB = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let start = null, base = null;
  g.addEventListener("pointerdown", (e) => { e.preventDefault(); g.setPointerCapture(e.pointerId); start = toVB(e); base = { dx: (state[stateKey] && state[stateKey].dx) || 0, dy: (state[stateKey] && state[stateKey].dy) || 0 }; });
  g.addEventListener("pointermove", (e) => { if (!start) return; const p = toVB(e); const dx = base.dx + (p.x - start.x), dy = base.dy + (p.y - start.y); g.setAttribute("transform", `translate(${dx},${dy})`); state[stateKey] = { dx, dy }; });
  g.addEventListener("pointerup", () => { start = null; });
}

// clic sur une escale = masquer / afficher (réversible)
function wirePortClicks(svg) {
  const gp = svg.querySelector("g.ports"); if (!gp) return;
  gp.addEventListener("click", (e) => {
    const dot = e.target.closest("circle[data-vi]"); if (!dot) return;
    const vi = +dot.getAttribute("data-vi"), ci = +dot.getAttribute("data-ci");
    const v = state.voyage.vessels[vi]; if (!v || !v.calls[ci]) return;
    v.calls[ci].hidden = !v.calls[ci].hidden; renderEditor(); scheduleRoute();
  });
}

/* ---------- routing (searoute-js client-side, lazy) ---------- */
let routeTimer = null;
const scheduleRoute = () => { clearTimeout(routeTimer); routeTimer = setTimeout(route, 280); };
async function route() {
  $(".loading").classList.add("on");
  try {
    const data = await window.VOYAGES.enrich(state.voyage);
    data.vessels.forEach((v, i) => { v.uihidden = state.voyage.vessels[i] && state.voyage.vessels[i].uihidden; });
    state.routed = data; renderEditor(); renderMap(); showWarnings(); persist();
  } catch (e) { console.error(e); alert(e); }
  $(".loading").classList.remove("on");
}

/* ---------- editor ---------- */
function renderEditor() {
  const host = $("#vessels"); host.innerHTML = "";
  if (!state.voyage.vessels.length) {
    const e = document.createElement("div"); e.className = "empty-state"; e.textContent = t("empty_hint"); host.appendChild(e); return;
  }
  state.voyage.vessels.forEach((v, vi) => {
    const card = document.createElement("div"); card.className = "vessel";
    const col = (state.routed && state.routed.vessels[vi] && state.routed.vessels[vi].color) || "#999";
    const head = document.createElement("div"); head.className = "vhead";
    head.innerHTML = `<span class="vgrip" draggable="true" title="↕">${gripIcon()}</span><span class="swatch" style="background:${col}"></span><span class="vn">${esc(v.name || "—")}</span><span class="vmeta">${v.imo ? "IMO " + esc(v.imo) : ""}</span><button class="iconbtn" title="${t(v.uihidden ? "show" : "hide")}">${v.uihidden ? eyeOff() : eye()}</button>`;
    head.querySelector(".iconbtn").onclick = (e) => { e.stopPropagation(); v.uihidden = !v.uihidden; if (state.routed) state.routed.vessels[vi].uihidden = v.uihidden; renderEditor(); renderMap(); };
    const grip = head.querySelector(".vgrip");
    grip.onclick = (e) => e.stopPropagation();
    grip.ondragstart = (e) => { e.dataTransfer.effectAllowed = "move"; window._vdrag = vi; card.classList.add("dragging"); };
    grip.ondragend = () => card.classList.remove("dragging");
    card.ondragover = (e) => { if (window._vdrag != null && window._vdrag !== vi) { e.preventDefault(); card.classList.add("drop-target"); } };
    card.ondragleave = () => card.classList.remove("drop-target");
    card.ondrop = (e) => { e.preventDefault(); card.classList.remove("drop-target"); const from = window._vdrag; if (from != null && from !== vi) { const [m] = state.voyage.vessels.splice(from, 1); state.voyage.vessels.splice(vi, 0, m); window._vdrag = null; renderEditor(); scheduleRoute(); } };
    const body = document.createElement("div"); body.className = "vbody" + (vi === 0 ? " open" : "");
    head.onclick = () => body.classList.toggle("open");
    card.appendChild(head);
    body.appendChild(vesselFields(v));
    const calls = document.createElement("div"); calls.className = "calls";
    (v.calls || []).forEach((c, ci) => calls.appendChild(callRow(v, c, ci)));
    body.appendChild(calls);
    const add = document.createElement("button"); add.className = "addcall"; add.innerHTML = plus() + " " + t("add_call");
    add.onclick = () => { v.calls = v.calls || []; v.calls.push({ port: "", arr: "", dep: "" }); renderEditor(); };
    body.appendChild(add);
    const act = document.createElement("div"); act.className = "row-actions";
    const del = document.createElement("button"); del.className = "btn danger"; del.textContent = t("del");
    del.onclick = () => { if (confirm(t("confirm_del_vessel"))) { state.voyage.vessels.splice(vi, 1); renderEditor(); scheduleRoute(); } };
    act.appendChild(del); body.appendChild(act); card.appendChild(body); host.appendChild(card);
  });
}
function vesselFields(v) {
  const frag = document.createDocumentFragment();
  const mkField = (parent, lab, key, cls, type) => {
    const f = document.createElement("div"); f.className = "field " + cls; f.innerHTML = `<label>${t(lab)}</label>`;
    const inp = document.createElement("input"); inp.type = type; inp.value = v[key] || "";
    inp.oninput = () => { v[key] = inp.value; if (key === "name") { const vn = inp.closest(".vessel").querySelector(".vn"); if (vn) vn.textContent = inp.value || "—"; } };
    f.appendChild(inp); parent.appendChild(f);
  };
  // essentiels, toujours visibles
  const primary = document.createElement("div"); primary.className = "vgrid";
  [["v_name", "name", "full", "text"], ["v_embark", "embark", "", "date"], ["v_disembark", "disembark", "", "date"], ["v_role", "role", "full", "text"]].forEach(([l, k, c, ty]) => mkField(primary, l, k, c, ty));
  frag.appendChild(primary);
  // secondaires, repliés
  const det = document.createElement("details"); det.className = "moredetails";
  const sum = document.createElement("summary"); sum.textContent = t("details"); det.appendChild(sum);
  const sec = document.createElement("div"); sec.className = "vgrid";
  [["v_imo", "imo", "", "text"], ["v_mmsi", "mmsi", "", "text"], ["v_type", "type", "full", "text"], ["v_flag", "flag", "", "text"], ["v_gt", "gt", "", "text"]].forEach(([l, k, c, ty]) => mkField(sec, l, k, c, ty));
  det.appendChild(sec); frag.appendChild(det);
  return frag;
}
function callRow(v, c, ci) {
  const row = document.createElement("div"); row.className = "crow" + (c.hidden ? " hidden-call" : "");
  const grip = document.createElement("span"); grip.className = "grip"; grip.draggable = true; grip.title = "↕"; grip.innerHTML = gripIcon();
  grip.ondragstart = (e) => { e.dataTransfer.effectAllowed = "move"; window._drag = { v, ci }; row.classList.add("dragging"); };
  grip.ondragend = () => row.classList.remove("dragging");
  row.ondragover = (e) => { const d = window._drag; if (d && d.v === v) { e.preventDefault(); row.classList.add("drop-target"); } };
  row.ondragleave = () => row.classList.remove("drop-target");
  row.ondrop = (e) => { e.preventDefault(); row.classList.remove("drop-target"); const d = window._drag; if (d && d.v === v && d.ci !== ci) { const [m] = v.calls.splice(d.ci, 1); v.calls.splice(ci, 0, m); window._drag = null; renderEditor(); scheduleRoute(); } };
  const port = document.createElement("input"); port.value = c.port || ""; port.placeholder = t("call_port"); port.setAttribute("list", "portlist");
  port.oninput = () => { c.port = port.value; }; port.onchange = scheduleRoute;
  const arr = document.createElement("input"); arr.type = "date"; arr.value = c.arr || ""; arr.onchange = () => { c.arr = arr.value; if (!c.dep) c.dep = arr.value; scheduleRoute(); };
  const dep = document.createElement("input"); dep.type = "date"; dep.value = c.dep || ""; dep.onchange = () => { c.dep = dep.value; };
  const hide = document.createElement("button"); hide.className = "iconbtn"; hide.title = t(c.hidden ? "show" : "hide"); hide.innerHTML = c.hidden ? eyeOff() : eye();
  hide.onclick = () => { c.hidden = !c.hidden; renderEditor(); scheduleRoute(); };
  const del = document.createElement("button"); del.className = "iconbtn warn"; del.title = t("del"); del.innerHTML = xmark();
  del.onclick = () => { v.calls.splice(ci, 1); renderEditor(); scheduleRoute(); };
  row.append(grip, port, arr, dep, hide, del); return row;
}

/* ---------- controls ---------- */
function buildControls() {
  const pc = $("#presetchips"); pc.innerHTML = "";
  PRESETS.forEach((p) => {
    const active = state.theme === p.theme && state.projection === p.proj;
    const b = chip(`${t(TKEY[p.theme])} · ${t(PKEY[p.proj])}`, active);
    b.onclick = () => { state.theme = p.theme; state.projection = p.proj; buildControls(); renderMap(); };
    pc.appendChild(b);
  });
  fill("#themechips", THEME_KEYS, "theme", () => { buildControls(); renderMap(); });
  fill("#projchips", PROJ_KEYS, "projection", () => { buildControls(); renderMap(); });
  const tg = $("#toggles"); tg.innerHTML = "";
  [["show_routes", "showRoutes"], ["show_ports", "showPorts"], ["labels", "showLabels"], ["show_legend", "showLegend"]].forEach(([lk, key]) => {
    const b = chip(t(lk), state[key]); b.onclick = () => { state[key] = !state[key]; b.setAttribute("aria-pressed", state[key]); renderMap(); }; tg.appendChild(b);
  });
}
function fill(sel, keys, stateKey, after) {
  const host = $(sel); host.innerHTML = "";
  keys.forEach(([k, lk]) => { const b = chip(t(lk), state[stateKey] === k); b.onclick = () => { state[stateKey] = k; host.querySelectorAll(".chip").forEach((x, i) => x.setAttribute("aria-pressed", keys[i][0] === k)); after(); }; host.appendChild(b); });
}
function chip(text, on) { const b = document.createElement("button"); b.className = "chip"; b.textContent = text; b.setAttribute("aria-pressed", !!on); return b; }
function showWarnings() {
  const w = $("#warnings"); const list = (state.routed && state.routed.warnings) || [];
  if (!list.length) { w.hidden = true; w.innerHTML = ""; return; }
  w.hidden = false;
  w.innerHTML = `<b>${esc(t("warnings_title"))}</b>` + list.map((s) => `<div>${esc(s)}</div>`).join("");
}

/* ---------- i18n ---------- */
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((e) => { e.textContent = t(e.dataset.i18n); });
  $("#dropbig").textContent = t("drop_hint"); $("#dropsmall").textContent = t("drop_sub");
  $("#dropor").textContent = t("or"); $("#exlink").textContent = t("load_example");
  $("#titlein").placeholder = t("title_label"); $("#subin").placeholder = t("subtitle_label");
  document.documentElement.lang = state.lang;
  buildControls(); renderEditor(); showWarnings(); renderMap();
}

/* ---------- export ---------- */
function serializeSVG() {
  const cur = $("#poster svg"); const svg = cur.cloneNode(true);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const W = cur.dataset.w, H = cur.dataset.h; svg.setAttribute("width", W); svg.setAttribute("height", H);
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,900&family=Space+Grotesk:wght@400;500;600&family=Space+Mono&display=swap');";
  svg.insertBefore(style, svg.firstChild);
  return { str: new XMLSerializer().serializeToString(svg), W: +W, H: +H };
}
function download(blob, name) { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); }
function exportSVG() { download(new Blob([serializeSVG().str], { type: "image/svg+xml;charset=utf-8" }), "carte-maritime.svg"); }
async function exportPNG(scale = 4) {
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) { }
  const { str, W, H } = serializeSVG(); const img = new Image();
  img.onload = () => { const cv = document.createElement("canvas"); cv.width = W * scale; cv.height = H * scale; const ctx = cv.getContext("2d"); ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.drawImage(img, 0, 0, W, H); cv.toBlob((b) => download(b, "carte-maritime.png")); };
  img.onerror = () => alert("Export PNG indisponible: utilisez SVG ou Imprimer (qualité parfaite).");
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(str);
}

/* ---------- ingest (client-side, lazy pdf.js / SheetJS) ---------- */
async function ingestFile(file) {
  $(".loading").classList.add("on");
  try {
    const data = await window.VOYAGES.ingest(file);
    if (data && data.error) alert(data.error);
    else { setVoyage(data); await route(); }
  } catch (e) { alert(e); }
  $(".loading").classList.remove("on");
}
// Vue par defaut : carte de Colomban deja enrichie (legs + temps de mer bakes) -> instantanee, sans routage.
async function loadExample() {
  try {
    const d = await (await fetch("./voyage-colomban.json")).json();
    state.routed = d;
    state.voyage = { seafarer: d.seafarer || "", vessels: (d.vessels || []).map((v) => Object.assign({}, v)) };
    if (!state.title) { state.title = d.seafarer || ""; $("#titlein").value = state.title; }
    renderEditor(); renderMap(); showWarnings();
  } catch (e) { console.error(e); }
}
function setVoyage(d) {
  state.voyage = { seafarer: d.seafarer || "", vessels: d.vessels || [] };
  if (!state.title) { state.title = d.seafarer || ""; $("#titlein").value = state.title; }
  renderEditor();
}

/* ---------- icons ---------- */
const eye = () => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
const eyeOff = () => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10 10 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M1 1l22 22"/></svg>`;
const xmark = () => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
const plus = () => `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>`;
const gripIcon = () => `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>`;
const esc = (s) => (s + "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- persistance locale + export/import ---------- */
const LS_KEY = "voyages-app:voyage";
function persist() { try { localStorage.setItem(LS_KEY, JSON.stringify(state.voyage)); } catch (e) { } }
function loadSaved() { try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function exportJSON() { download(new Blob([JSON.stringify(state.voyage, null, 2)], { type: "application/json" }), "ma-carte-maritime.json"); }
function resetExample() { try { localStorage.removeItem(LS_KEY); } catch (e) { } state.title = ""; loadExample(); }

/* ---------- boot ---------- */
async function boot() {
  RENDER = window.MAPRENDER.createRenderer(d3);
  const urlLang = new URLSearchParams(location.search).get("lang");
  if (urlLang && window.I18N[urlLang]) state.lang = urlLang;
  const sel = $("#lang");
  Object.keys(window.I18N).forEach((k) => { const o = document.createElement("option"); o.value = k; o.textContent = window.I18N[k]._name; sel.appendChild(o); });
  sel.value = state.lang; sel.onchange = () => { state.lang = sel.value; applyI18n(); };

  const [land, ports, aliases, supp] = await Promise.all([
    fetch("./data/land-50m.json").then((r) => r.json()),
    fetch("./data/ports.json").then((r) => r.json()).catch(() => []),
    fetch("./data/aliases.json").then((r) => r.json()).catch(() => ({})),
    fetch("./data/ports_supplement.json").then((r) => r.json()).catch(() => ({})),
  ]);
  WORLD = topojson.feature(land, land.objects.land);
  PORTS = ports;
  window.VOYAGES.db = window.VOYAGES.createPortDB(ports, aliases, supp);
  const dl = $("#portlist"); ports.slice(0, 4000).forEach((p) => { const o = document.createElement("option"); o.value = p.n; dl.appendChild(o); });

  buildControls();
  $("#exlink").onclick = loadExample;
  $("#titlein").oninput = (e) => { state.title = e.target.value; renderMap(); };
  $("#subin").oninput = (e) => { state.subtitle = e.target.value; renderMap(); };
  $("#btnpng").onclick = () => exportPNG(4);
  $("#btnsvg").onclick = exportSVG;
  $("#btnprint").onclick = () => window.print();
  $("#btnaddvessel").onclick = () => { state.voyage.vessels.push({ name: "", imo: "", calls: [] }); renderEditor(); };
  $("#exportjson").onclick = exportJSON;
  $("#resetex").onclick = resetExample;
  $("#importjson").onclick = () => $("#fileinput").click();

  const fi = $("#fileinput");
  $("#dropzone").onclick = () => fi.click();
  fi.onchange = () => { if (fi.files[0]) ingestFile(fi.files[0]); fi.value = ""; };
  const ov = $("#globaldrop");
  ["dragenter", "dragover"].forEach((ev) => document.addEventListener(ev, (e) => { e.preventDefault(); ov.classList.add("on"); }));
  document.addEventListener("dragleave", (e) => { if (e.target === document.documentElement) ov.classList.remove("on"); });
  document.addEventListener("drop", (e) => { e.preventDefault(); ov.classList.remove("on"); const f = e.dataTransfer.files[0]; if (f) ingestFile(f); });
  window.addEventListener("resize", () => { clearTimeout(window._rz); window._rz = setTimeout(renderMap, 150); });

  applyI18n();
  const saved = loadSaved();
  if (saved && saved.vessels && saved.vessels.length) { setVoyage(saved); await route(); }
  else await loadExample();
}
boot();
