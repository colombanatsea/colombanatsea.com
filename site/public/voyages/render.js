/* Moteur de rendu cartographique — source unique, testable en navigateur ET en headless.
   createRenderer(d3, topojson) -> { THEMES, makeProjection, posterSize, renderMap }
   Aucune dependance au global `document` : on derive le document du conteneur. */
(function (global) {
  const SVGNS = "http://www.w3.org/2000/svg";

  function createRenderer(d3, topojson) {

    function brighten(hex) {
      const c = d3.color(hex); if (!c) return hex;
      const h = d3.hsl(c); h.l = Math.min(0.74, h.l + 0.3); h.s = Math.min(1, h.s + 0.12);
      return h.formatHex();
    }

    // ---- THEMES ----
    const THEMES = {
      parchment: {
        poster: "#e8dabb", ocean: "#e8dabb", land: "#d4ba8e", coast: "#7c5a31", coastW: 1.0,
        graticule: "#b2925f", gratW: 0.4, gratOpacity: 0.45, vignette: "#7c5a31",
        route: (c) => c, routeW: 2.3, halo: 0, port: "#5a3d1e", portStroke: "#e8dabb", portR: 3.2,
        label: "#4a3a22", labelHalo: "#e8dabb", title: "#3a2a14", compass: true,
      },
      nautical: {
        poster: "#dde9eb", ocean: "url(#g-naut)", land: "#efe6cf", coast: "#8a9a7e", coastW: 0.8,
        graticule: "#6f8fa0", gratW: 0.35, gratOpacity: 0.4, vignette: null,
        route: (c) => c, routeW: 2.1, halo: 0, port: "#b9472f", portStroke: "#fff", portR: 3.1,
        label: "#2c4a59", labelHalo: "#eef4f5", title: "#22414f", compass: true,
      },
      bathy: {
        poster: "#07202f", ocean: "url(#g-bathy)", land: "#0b1419", coast: "#3f7794", coastW: 0.7,
        graticule: "#4f9cba", gratW: 0.3, gratOpacity: 0.22, vignette: "#04141f",
        route: (c) => brighten(c), routeW: 2.4, halo: 5, port: "#ffd27a", portStroke: "#07202f", portR: 3.2,
        label: "#cfe9f4", labelHalo: "#07202f", title: "#eaf6fb", compass: false,
      },
      sober: {
        poster: "#faf8f4", ocean: "#faf8f4", land: "#e9e4da", coast: "#cbc3b5", coastW: 0.7,
        graticule: "#efeae1", gratW: 0.35, gratOpacity: 0.8, vignette: null,
        route: (c) => c, routeW: 2.1, halo: 0, port: "#1a1714", portStroke: "#fff", portR: 3.1,
        label: "#5a5248", labelHalo: "#faf8f4", title: "#1a1714", compass: false,
      },
      bw: {
        poster: "#0c0c0c", ocean: "#0c0c0c", land: "#171717", coast: "#666", coastW: 0.8,
        graticule: "#242424", gratW: 0.3, gratOpacity: 0.85, vignette: null,
        route: () => "#ffffff", routeW: 2.0, halo: 0, port: "#fff", portStroke: "#0c0c0c", portR: 3.0,
        label: "#cfcfcf", labelHalo: "#0c0c0c", title: "#fff", compass: false,
      },
      blueprint: {
        poster: "#0d2438", ocean: "url(#g-blue)", land: "#16314f", coast: "#5fc7e0", coastW: 0.6,
        graticule: "#3f74909", gratW: 0.3, gratOpacity: 0.5, vignette: "#091b2c",
        route: () => "#eaf6fb", routeW: 2.0, halo: 4, port: "#9fe9f6", portStroke: "#0d2438", portR: 3.0,
        label: "#bfe2f0", labelHalo: "#0d2438", title: "#eaf6fb", compass: true, mono: true,
      },
    };

    ["bathy", "bw", "blueprint"].forEach((k) => { THEMES[k].dark = true; });

    // ---- projections ----
    // Spilhaus : carre conforme ocean-centre (famille Peirce/Adams), routes preservees.
    const LAT_BAND = (deg) => ({
      type: "Polygon",
      coordinates: [[[-180, -deg], [-90, -deg], [0, -deg], [90, -deg], [180, -deg],
      [180, deg], [90, deg], [0, deg], [-90, deg], [-180, deg], [-180, -deg]]],
    });

    // Construit la projection ET derive la taille exacte du poster a partir de
    // ses bornes reelles -> aspect correct pour chaque projection (Mercator large,
    // Spilhaus carre, Natural Earth 2:1), plus de carre parasite.
    function projectAndSize(name) {
      const targetW = name === "spilhaus" ? 900 : 1080;
      const m = 26, innerW = targetW - 2 * m;
      // Mercator : calcule explicitement, latitude bornee a ±80°, hauteur deduite.
      if (name === "mercator") {
        const s = innerW / (2 * Math.PI);
        const p = d3.geoMercator().rotate([-10, 0]).scale(s).translate([targetW / 2, 0]);
        const yT = p([0, 80])[1], yB = p([0, -80])[1];
        const innerH = yB - yT, W = targetW, H = Math.round(innerH + 2 * m);
        p.translate([targetW / 2, m - yT]).clipExtent([[0, 0], [W, H]]).precision(0.3);
        return { proj: p, W, H };
      }
      let p;
      if (name === "pacific") p = d3.geoNaturalEarth1().rotate([-150, 0]);
      else if (name === "natural") p = d3.geoNaturalEarth1().rotate([-10, 0]);
      else if (name === "spilhaus") p = d3.geoPeirceQuincuncial().rotate([-66.94, 40.44, 45]); // Spilhaus canonique : ocean (66.94E/49.56S) au centre
      else p = d3.geoNaturalEarth1().rotate([25, 0]); // atlantic
      p.precision(0.3).fitWidth(innerW, { type: "Sphere" });
      const b = d3.geoPath(p).bounds({ type: "Sphere" });
      const innerH = Math.max(40, b[1][1] - b[0][1]);
      const W = targetW, H = Math.round(innerH + 2 * m);
      const tx = p.translate();
      p.translate([tx[0] - b[0][0] + m, tx[1] - b[0][1] + m]);
      return { proj: p, W, H };
    }

    // ---- svg helpers (doc-agnostic) ----
    function mk(doc, tag, attrs) { const e = doc.createElementNS(SVGNS, tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function addPath(doc, p, d, attrs) { if (!d) return null; const e = mk(doc, "path", { d, ...attrs }); p.appendChild(e); return e; }

    function defs(doc, W, H) {
      const d = mk(doc, "defs");
      const lin = (id, stops, vertical) => { const g = mk(doc, "linearGradient", { id, x1: 0, y1: 0, x2: vertical ? 0 : 1, y2: vertical ? 1 : 0 }); stops.forEach(([o, c]) => g.appendChild(mk(doc, "stop", { offset: o, "stop-color": c }))); return g; };
      const rad = (id, stops) => { const g = mk(doc, "radialGradient", { id, cx: "50%", cy: "47%", r: "62%" }); stops.forEach(([o, c]) => g.appendChild(mk(doc, "stop", { offset: o, "stop-color": c }))); return g; };
      d.appendChild(lin("g-naut", [[0, "#d2e3e7"], [1, "#bdd6dc"]], true));
      d.appendChild(rad("g-bathy", [[0, "#3f86a6"], [0.5, "#155069"], [1, "#061a29"]]));
      d.appendChild(lin("g-blue", [[0, "#123455"], [1, "#0a1d30"]], true));
      d.appendChild(rad("g-vignette", [[0.62, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.34)"]]));
      return d;
    }

    function compass(doc, cx, cy, r, th) {
      const g = mk(doc, "g", { transform: `translate(${cx},${cy})`, opacity: 0.82 });
      g.appendChild(mk(doc, "circle", { r, fill: "none", stroke: th.coast, "stroke-width": 0.8 }));
      g.appendChild(mk(doc, "circle", { r: r * 0.6, fill: "none", stroke: th.coast, "stroke-width": 0.5, opacity: 0.6 }));
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4, lng = i % 2 === 0, r2 = lng ? r : r * 0.58;
        g.appendChild(mk(doc, "path", { d: `M${Math.sin(a) * r * 0.13},${-Math.cos(a) * r * 0.13}L${Math.sin(a) * r2},${-Math.cos(a) * r2}`, stroke: th.title, "stroke-width": lng ? 1.1 : 0.6 }));
      }
      g.appendChild(mk(doc, "path", { d: `M0,${-r * 0.85}L${r * 0.12},0L0,${r * 0.3}L${-r * 0.12},0Z`, fill: "#b9472f", opacity: 0.9 }));
      const n = mk(doc, "text", { x: 0, y: -r - 4, "text-anchor": "middle", "font-size": 9, fill: th.title, "font-weight": 700 }); n.textContent = "N"; g.appendChild(n);
      return g;
    }

    function cartouche(doc, W, H, th, state, R) {
      const cp = state.cartouchePos;
      const g = mk(doc, "g", { id: "cartouche", style: "cursor:move", transform: `translate(${(cp && cp.dx) || 0},${(cp && cp.dy) || 0})` });
      const x = 32, y = H - 104;
      const lbl = state.lbls || {};
      const title = (state.title != null && state.title !== "") ? state.title : ((R && R.seafarer) || "");
      if (title) { const f = mk(doc, "text", { x, y, "font-family": "'Fraunces',Georgia,serif", "font-weight": 900, "font-size": 34, fill: th.title }); f.textContent = title; g.appendChild(f); }
      if (state.subtitle) { const s = mk(doc, "text", { x, y: y + 22, "font-size": 13, fill: th.title, opacity: 0.82 }); s.textContent = state.subtitle; g.appendChild(s); }
      g.appendChild(mk(doc, "path", { d: `M${x},${y + 34}L${x + 200},${y + 34}`, stroke: th.title, "stroke-width": 1.1, opacity: 0.55 }));
      if (R) {
        const L = (n) => Math.round(n).toLocaleString(state.lang || "fr");
        const tot = `${R.totals.vessels} ${lbl.v || "navires"}  ·  ${R.totals.ports} ${lbl.p || "escales"}  ·  ${L(R.totals.distance_nm)} ${lbl.m || "milles"}`;
        const m = mk(doc, "text", { x, y: y + 52, "font-family": "'Space Mono',monospace", "font-size": 11.5, fill: th.title, opacity: 0.85 }); m.textContent = tot; g.appendChild(m);
        if (R.totals.embarked) {
          const st = `${L(R.totals.embarked)} ${lbl.emb || "j embarqués"}  ·  ${L(R.totals.sea)} ${lbl.sea || "j mer"}  ·  ${L(R.totals.port)} ${lbl.port || "j port"}`;
          const m2 = mk(doc, "text", { x, y: y + 70, "font-family": "'Space Mono',monospace", "font-size": 11.5, fill: th.title, opacity: 0.7 }); m2.textContent = st; g.appendChild(m2);
        }
      }
      return g;
    }

    function legend(doc, th, R, pos, key) {
      const dx = (pos && pos.dx) || 0, dy = (pos && pos.dy) || 0;
      const g = mk(doc, "g", { id: "legend", transform: `translate(${dx},${dy})`, style: "cursor:move" });
      const vis = (R.vessels || []).filter((v) => !v.uihidden);
      if (!vis.length) return g;
      const x = 28, y = 26, pad = 13, rowH = 27, lineLen = 24, textX = pad + lineLen + 9;
      // largeur dynamique : on estime la largeur du texte pour que rien ne deborde
      const wName = (s) => (s || "").length * 7.0;        // 12.5px gras
      const wMeta = (s) => (s || "").length * 5.15;       // 8.6px mono
      const rows = vis.map((v) => {
        const meta = [];
        if (v.imo) meta.push("IMO " + v.imo);
        if (v.mmsi) meta.push("MMSI " + v.mmsi);
        if (v.flag) meta.push(v.flag);
        if (v.gt) meta.push(v.gt + " GT");
        if (v.embark) meta.push((v.embark || "") + (v.disembark ? " → " + v.disembark : ""));
        return { v, meta: meta.join("  ·  ") };
      });
      let contentW = 90;
      rows.forEach((r) => { contentW = Math.max(contentW, textX + wName(r.v.name || "—"), textX + wMeta(r.meta)); });
      const boxW = Math.round(Math.min(440, contentW + pad));
      const keyH = key ? 20 : 0;
      const boxH = pad * 2 + vis.length * rowH + keyH;
      g.appendChild(mk(doc, "rect", { x, y, width: boxW, height: boxH, rx: 10,
        fill: th.dark ? "rgba(7,22,32,0.62)" : "rgba(255,255,255,0.68)",
        stroke: th.dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)", "stroke-width": 1 }));
      rows.forEach((r, i) => {
        const ry = y + pad + i * rowH + 11, lx = x + pad;
        const col = th.route(r.v.color || "#888", i);
        const ln = mk(doc, "line", { x1: lx, y1: ry - 3, x2: lx + lineLen, y2: ry - 3, stroke: col, "stroke-width": 3, "stroke-linecap": "round" });
        if (r.v.inferred) ln.setAttribute("stroke-dasharray", "5 3");
        g.appendChild(ln);
        const nm = mk(doc, "text", { x: x + textX, y: ry, "font-size": 12.5, "font-weight": 600, fill: th.title }); nm.textContent = r.v.name || "—"; g.appendChild(nm);
        const mt = mk(doc, "text", { x: x + textX, y: ry + 12, "font-family": "'Space Mono',monospace", "font-size": 8.6, fill: th.title, opacity: 0.68 }); mt.textContent = r.meta; g.appendChild(mt);
      });
      // clé de lecture : trait plein = AIS réel, tireté = reconstruit
      if (key) {
        const ky = y + pad + vis.length * rowH + 9, kx = x + pad;
        g.appendChild(mk(doc, "path", { d: `M${kx},${ky}L${kx + 18},${ky}`, stroke: th.title, "stroke-width": 2.4, "stroke-linecap": "round", opacity: 0.85 }));
        const ka = mk(doc, "text", { x: kx + 24, y: ky + 3.5, "font-size": 8.6, fill: th.title, opacity: 0.7 }); ka.textContent = key.ais; g.appendChild(ka);
        const k2 = kx + 24 + (key.ais.length * 5 + 22);
        g.appendChild(mk(doc, "path", { d: `M${k2},${ky}L${k2 + 18},${ky}`, stroke: th.title, "stroke-width": 2.4, "stroke-dasharray": "5 3", "stroke-linecap": "butt", opacity: 0.85 }));
        const ki = mk(doc, "text", { x: k2 + 24, y: ky + 3.5, "font-size": 8.6, fill: th.title, opacity: 0.7 }); ki.textContent = key.inf; g.appendChild(ki);
      }
      return g;
    }

    function credits(doc, W, H, th, state) {
      if (!state.credits) return null;
      const t = mk(doc, "text", { x: W - 28, y: H - 14, "text-anchor": "end", "font-family": "'Space Mono',monospace", "font-size": 8.4, fill: th.title, opacity: 0.52 });
      t.textContent = state.credits; return t;
    }

    // ---- main render ----
    function renderMap(container, opts) {
      const doc = container.ownerDocument;
      const state = opts.state, world = opts.world, R = opts.routed;
      const th = THEMES[state.theme] || THEMES.sober;
      const { proj, W, H } = projectAndSize(state.projection);
      const path = d3.geoPath(proj);

      while (container.firstChild) container.removeChild(container.firstChild);
      const svg = mk(doc, "svg", { viewBox: `0 0 ${W} ${H}` });
      svg.setAttribute("xmlns", SVGNS);
      svg.style.fontFamily = th.mono ? "'Space Mono',monospace" : "'Space Grotesk',system-ui,sans-serif";
      svg.dataset.w = W; svg.dataset.h = H;
      if (opts.scale) { svg.setAttribute("width", W * opts.scale); svg.setAttribute("height", H * opts.scale); }
      container.appendChild(svg);
      svg.appendChild(defs(doc, W, H));
      const layer = (cls) => { const g = mk(doc, "g", { class: cls }); svg.appendChild(g); return g; };

      svg.appendChild(mk(doc, "rect", { x: 0, y: 0, width: W, height: H, fill: th.poster }));
      const sphere = path({ type: "Sphere" });
      if (th.ocean !== "none" && th.ocean !== th.poster) addPath(doc, layer("ocean"), sphere, { fill: th.ocean });

      addPath(doc, layer("grat"), path(d3.geoGraticule10()), { fill: "none", stroke: th.graticule, "stroke-width": th.gratW, opacity: th.gratOpacity });

      if (world) {
        addPath(doc, layer("land"), path(world), { fill: th.land });
        addPath(doc, layer("coast"), path(world), { fill: "none", stroke: th.coast, "stroke-width": th.coastW, "stroke-linejoin": "round" });
      }
      addPath(doc, layer("frame"), sphere, { fill: "none", stroke: th.coast, "stroke-width": 0.8, opacity: 0.5 });

      // routes — toujours dessinees si presentes et activees
      let routePaths = 0;
      if (R && state.showRoutes !== false) {
        const gr = layer("routes");
        R.vessels.forEach((v, vi) => {
          if (v.uihidden) return;
          const col = th.route(v.color || "#888", vi);
          const dash = v.inferred ? `${th.routeW * 2.4} ${th.routeW * 2}` : null; // tirete = route inferee
          (v.legs || []).forEach((leg) => {
            const d = path({ type: "LineString", coordinates: leg.coords });
            if (!d) return;
            if (th.halo) addPath(doc, gr, d, { fill: "none", stroke: col, "stroke-width": th.routeW + th.halo, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.28 });
            const a = { fill: "none", stroke: col, "stroke-width": th.routeW, "stroke-linecap": dash ? "butt" : "round", "stroke-linejoin": "round" };
            if (dash) a["stroke-dasharray"] = dash;
            addPath(doc, gr, d, a);
            routePaths++;
          });
        });
      }

      // ports + labels (anti-collision gloutonne des etiquettes)
      if (R && state.showPorts !== false) {
        const gp = layer("ports"), gl = layer("labels"), seen = new Set(), placed = [];
        gl.setAttribute("pointer-events", "none"); // les étiquettes n'interceptent pas les clics sur les escales
        const overlaps = (b) => placed.some((p) => !(b[2] < p[0] || b[0] > p[2] || b[3] < p[1] || b[1] > p[3]));
        R.vessels.forEach((v, vi) => {
          if (v.uihidden) return;
          const calls = v.calls || [];
          const vis = calls.map((c, i) => ({ c, i })).filter((o) => !o.c.hidden);
          vis.forEach((o, k) => {
            const c = o.c, ci = o.i;
            const xy = proj([c.lon, c.lat]); if (!xy || !isFinite(xy[0])) return;
            const edge = k === 0 || k === vis.length - 1;
            const dot = mk(doc, "circle", { cx: xy[0], cy: xy[1], r: edge ? th.portR + 1.4 : th.portR, fill: th.port, stroke: th.portStroke, "stroke-width": 1.2, "data-vi": vi, "data-ci": ci, style: "cursor:pointer" });
            const ttl = mk(doc, "title"); ttl.textContent = (c.port || "") + (c.arr ? " · " + c.arr : "") + (state.portTip ? "  —  " + state.portTip : ""); dot.appendChild(ttl);
            gp.appendChild(dot);
            if (edge) gp.appendChild(mk(doc, "circle", { cx: xy[0], cy: xy[1], r: th.portR + 4, fill: "none", stroke: th.port, "stroke-width": 1, opacity: 0.55, "pointer-events": "none" }));
            if (state.showLabels !== false && !seen.has(c.locode || c.port)) {
              seen.add(c.locode || c.port);
              const tx0 = xy[0] + 6, ty0 = xy[1] - 5, w = (c.port || "").length * 5.5 + 4;
              const box = [tx0, ty0 - 9, tx0 + w, ty0 + 3];
              if (!overlaps(box)) {
                placed.push(box);
                const tx = mk(doc, "text", { x: tx0, y: ty0, "font-size": 9.5, fill: th.label, "paint-order": "stroke", stroke: th.labelHalo, "stroke-width": 2.6, "stroke-linejoin": "round", "font-weight": 500 });
                tx.textContent = c.port; gl.appendChild(tx);
              }
            }
          });
        });
      }

      if (th.vignette) addPath(doc, layer("vignette"), sphere, { fill: "url(#g-vignette)", "pointer-events": "none" });
      if (th.compass) svg.appendChild(compass(doc, W - 74, H - 74, 28, th));
      if (R && state.showLegend !== false) svg.appendChild(legend(doc, th, R, state.legendPos, state.keyLbls));
      svg.appendChild(cartouche(doc, W, H, th, state, R));
      const cr = credits(doc, W, H, th, state); if (cr) svg.appendChild(cr);

      svg.dataset.routePaths = routePaths;
      return svg;
    }

    return { THEMES, projectAndSize, renderMap, brighten };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { createRenderer };
  else global.MAPRENDER = { createRenderer };
})(typeof window !== "undefined" ? window : globalThis);
