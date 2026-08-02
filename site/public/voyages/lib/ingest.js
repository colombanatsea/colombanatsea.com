/* Ingestion d'un releve cote navigateur — port fidele de parse_releve.py + parsing PDF/Excel.
   Sortie : squelette { seafarer, vessels:[{name, imo, role, embark, disembark, calls:[]}] }.
   JSON -> tel quel. CSV/TXT -> lignes. XLSX -> SheetJS (lazy). PDF -> pdf.js (lazy). */
(function (g) {
  const V = (g.VOYAGES = g.VOYAGES || {});

  const IMO_RE = /\b(\d{7})\b/;
  const MONTHS_FR = {
    janvier: 1, fevrier: 2, "février": 2, mars: 3, avril: 4, mai: 5, juin: 6,
    juillet: 7, aout: 8, "août": 8, septembre: 9, octobre: 10, novembre: 11,
    decembre: 12, "décembre": 12,
  };
  const MONTH_SRC = "\\b(\\d{1,2})\\s+(" + Object.keys(MONTHS_FR).join("|") + ")\\s+(\\d{4})\\b";
  const DATE_PATS = [
    [/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/g, ["y", "m", "d"]],
    [/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/g, ["d", "m", "y"]],
    [/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})\b/g, ["d", "m", "yy"]],
  ];
  const ROLE_HINTS = ["commandant", "capitaine", "second", "lieutenant", "officier", "eleve",
    "élève", "cadet", "chef mecanicien", "mecanicien", "matelot", "bosco",
    "master", "chief", "mate", "engineer", "cuisinier", "maître"];

  function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function mkDate(y, m, d) {
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const ms = Date.UTC(y, m - 1, d);
    const dt = new Date(ms);
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return ms;
  }

  function findDates(s) {
    const out = [];
    const monthRe = new RegExp(MONTH_SRC, "ig");
    let m;
    while ((m = monthRe.exec(s)) !== null) {
      const ms = mkDate(+m[3], MONTHS_FR[m[2].toLowerCase()], +m[1]);
      if (ms != null) out.push([m.index, ms]);
    }
    for (const [pat, order] of DATE_PATS) {
      pat.lastIndex = 0;
      while ((m = pat.exec(s)) !== null) {
        const gp = {}; order.forEach((k, i) => { gp[k] = m[i + 1]; });
        const y = "y" in gp ? +gp.y : 2000 + +gp.yy;
        const ms = mkDate(y, +gp.m, +gp.d);
        if (ms != null) out.push([m.index, ms]);
      }
    }
    out.sort((a, b) => a[0] - b[0]);
    const seen = new Set(), res = [];
    for (const [, ms] of out) { if (!seen.has(ms)) { seen.add(ms); res.push(ms); } }
    return res;
  }

  function findRole(s) {
    const low = s.toLowerCase();
    for (const r of ROLE_HINTS) if (low.includes(r)) return r;
    return null;
  }

  function cleanName(s, imo, dates, role) {
    s = s.replace(/\b\d{7}\b/g, " ");
    s = s.replace(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g, " ");
    s = s.replace(/\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, " ");
    s = s.replace(new RegExp(MONTH_SRC, "ig"), " ");
    if (role) s = s.replace(new RegExp(role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), " ");
    s = s.replace(/\b(imo|mmsi|n[°o]|jours?|j)\b/ig, " ");
    const stop = "embarqu[ée]?e?s?|debarqu[ée]?e?s?|débarqu[ée]?e?s?|embarcation|" +
      "du|au|le|la|les|de|des|et|en|sur|second|chief|capitaine|" +
      "from|to|on|the|signed|off";
    s = s.replace(new RegExp("\\b(" + stop + ")\\b", "ig"), " ");
    s = s.replace(/\(\s*\)/g, " ");
    s = s.replace(/[;,|\t()]+/g, " ");
    s = s.replace(/\s{2,}/g, " ").replace(/^[\s\-–—:.]+|[\s\-–—:.]+$/g, "");
    return s.trim();
  }

  function parseRows(rows, seafarer) {
    const vessels = [];
    for (const raw of rows) {
      const line = (raw || "").trim();
      if (!line) continue;
      const imoM = line.match(IMO_RE);
      const imo = imoM ? imoM[1] : null;
      const dates = findDates(line);
      const role = findRole(line);
      const name = cleanName(line, imo, dates, role);
      if (!imo && !dates.length) continue; // ecarte entetes, titres, bruit
      vessels.push({
        name: name || null, imo: imo, role: role,
        embark: dates.length ? iso(dates[0]) : null,
        disembark: dates.length > 1 ? iso(dates[1]) : (dates.length ? iso(dates[0]) : null),
        calls: [],
      });
    }
    return { seafarer: seafarer || "", vessels: vessels };
  }

  // CSV/TSV si entete plausible, sinon ligne par ligne (port de la branche is_table de parse_releve.py)
  function csvOrLines(text) {
    const lines = text.split(/\r?\n/);
    const first = (lines[0] || "").toLowerCase();
    const isTable = ["imo", "navire", "vessel", "ship", "embarqu"].some((k) => first.includes(k)) &&
      (first.includes(",") || first.includes("\t") || first.includes(";"));
    if (!isTable) return lines;
    const delim = first.includes("\t") ? "\t" : (first.includes(";") ? ";" : ",");
    return lines.slice(1).map((ln) => ln.split(delim).join(" "));
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = () => res(); s.onerror = () => rej(new Error("load " + src));
      document.head.appendChild(s);
    });
  }

  async function xlsxRows(file) {
    if (!g.XLSX) await loadScript("./lib_ext/xlsx.full.min.js");
    const buf = await file.arrayBuffer();
    const wb = g.XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const aoa = g.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    const rows = [];
    for (const r of aoa) {
      const cells = r.map((x) => (x == null ? "" : String(x)));
      if (cells.some((c) => c.trim())) rows.push(cells.join(" "));
    }
    return rows;
  }

  async function pdfRows(file) {
    if (!g.pdfjsLib) await loadScript("./lib_ext/pdf.min.js");
    // Parsing PDF dans le thread principal, sans Web Worker : on charge le module worker
    // comme script normal. pdf.js detecte globalThis.pdfjsWorker.WorkerMessageHandler et
    // n'appelle jamais new Worker() -> indifferent a worker-src de la CSP. isEvalSupported
    // false car la CSP n'autorise pas 'unsafe-eval'.
    if (!(g.pdfjsWorker && g.pdfjsWorker.WorkerMessageHandler)) await loadScript("./lib_ext/pdf.worker.min.js");
    const buf = await file.arrayBuffer();
    const pdf = await g.pdfjsLib.getDocument({ data: buf, isEvalSupported: false }).promise;
    const rows = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const lines = new Map();
      for (const it of tc.items) {
        if (!it.str) continue;
        const y = Math.round(it.transform[5]);
        if (!lines.has(y)) lines.set(y, []);
        lines.get(y).push([it.transform[4], it.str]);
      }
      const ys = [...lines.keys()].sort((a, b) => b - a);
      for (const y of ys) {
        const line = lines.get(y).sort((a, b) => a[0] - b[0]).map((x) => x[1]).join(" ").replace(/\s+/g, " ").trim();
        if (line) rows.push(line);
      }
    }
    return rows;
  }

  // ---- ENM "Lignes de service" (enm.mes-services.mer.gouv.fr) ----
  // Format structure : Debut;Fin;Armateur;<immat> - NAVIRE;Genre;Position;Fonction;...
  // Donne navire + periode d'embarquement, JAMAIS d'escales. On consolide par navire.
  const DMY = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  function isoDMY(s) {
    const m = (s || "").trim().match(DMY);
    if (!m) return null;
    const d = mkDate(+m[3], +m[2], +m[1]);
    return d == null ? null : iso(d);
  }
  function titleCase(s) {
    return (s || "").toLowerCase().replace(/\b([a-zà-ÿ])/g, (c) => c.toUpperCase()).trim();
  }
  function shipFromCell(cell) {
    // "933184 - ZOURITE" / "806560 - NORMANDIE" -> "ZOURITE". Tolere l'absence de tiret.
    const parts = (cell || "").split(/\s[-–]\s/);
    return (parts.length > 1 ? parts.slice(1).join(" ") : cell).replace(/\s+/g, " ").trim();
  }

  function parseEnmCsv(text) {
    const lines = text.split(/\r?\n/).map((l) => l.replace(/^﻿/, ""));
    // entete des donnees : une ligne dont les cellules contiennent Debut/Du et Navire
    let h = -1, cols = null;
    for (let i = 0; i < lines.length; i++) {
      const c = lines[i].split(";").map((x) => x.trim());
      if (c.some((x) => /^d[eé]but$/i.test(x)) && c.some((x) => /navire/i.test(x))) { h = i; cols = c; break; }
    }
    if (h < 0) return null;
    const idx = (re) => cols.findIndex((x) => re.test(x));
    const iDeb = idx(/^d[eé]but$/i), iFin = idx(/^fin$/i), iArm = idx(/armateur/i),
          iNav = idx(/navire/i), iFonc = idx(/fonction/i);
    if (iDeb < 0 || iFin < 0 || iNav < 0) return null;

    // nom du marin (bloc "Nom;Prenom;N marin")
    let seafarer = "";
    for (let i = 0; i < h; i++) {
      const c = lines[i].split(";").map((x) => x.trim());
      const prev = (lines[i - 1] || "").split(";").map((x) => x.trim());
      if (prev[0] && /^nom$/i.test(prev[0]) && c[0]) { seafarer = titleCase(c[1] + " " + c[0]); break; }
    }

    const byShip = new Map();
    for (let i = h + 1; i < lines.length; i++) {
      const c = lines[i].split(";").map((x) => x.replace(/\t/g, " ").trim());
      const emb = isoDMY(c[iDeb]), dis = isoDMY(c[iFin]);
      if (!emb || !dis) continue; // pas une ligne d'embarquement
      const ship = shipFromCell(c[iNav]); if (!ship) continue;
      const role = iFonc >= 0 ? c[iFonc] : "";
      const armateur = iArm >= 0 ? c[iArm] : "";
      const key = ship.toLowerCase();
      let v = byShip.get(key);
      if (!v) { v = { name: ship, role: role, type: titleCase(armateur), embark: emb, disembark: dis, _days: 0, _periods: 0, calls: [] }; byShip.set(key, v); }
      if (emb < v.embark) v.embark = emb;
      if (dis > v.disembark) v.disembark = dis;
      const dd = parseDays(emb, dis); if (dd != null) v._days += dd;
      v._periods += 1;
      if (role && /commandant|capitaine|second|officier|chief|master/i.test(role)) v.role = role; // garde la fonction la plus senior
    }
    if (!byShip.size) return null;
    const vessels = [...byShip.values()].sort((a, b) => (a.embark < b.embark ? 1 : -1)).map((v) => ({
      name: v.name, role: v.role, type: v.type, embark: v.embark, disembark: v.disembark,
      embarked_days: v._days, periods: v._periods, calls: [],
    }));
    return { seafarer: seafarer, vessels: vessels, source: "enm" };
  }

  function parseDays(a, b) {
    const t1 = Date.parse(a + "T00:00:00Z"), t2 = Date.parse(b + "T00:00:00Z");
    if (Number.isNaN(t1) || Number.isNaN(t2) || t2 < t1) return null;
    return Math.round((t2 - t1) / 86400000);
  }

  // marqueurs d'etat civil / en-tete a ne jamais prendre pour un navire
  const NOISE = /naissance|date d.?[ée]dition|lieu de naissance|adresse|t[ée]l[ée]phone|identification du marin|[ée]tat civil|page\s+\d+\s*\/|nom d.?usage|service de rattachement|lexique|abr[ée]viation/i;

  async function ingest(file) {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".json")) return JSON.parse(await file.text());
    if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) return parseRows(await xlsxRows(file), "");
    if (name.endsWith(".pdf")) {
      const rows = await pdfRows(file);
      const isEnm = rows.some((l) => /lignes de service|navire \/ r[oô]le|bilan synth/i.test(l));
      const out = parseRows(rows.filter((l) => !NOISE.test(l)), "");
      if (isEnm) out.note = "enm-pdf"; // le PDF ENM est peu fiable : recommander le CSV
      return out;
    }
    // CSV / texte : tenter le format ENM (colonnes), sinon parseur generique
    const text = await file.text();
    const enm = parseEnmCsv(text);
    if (enm) return enm;
    return parseRows(csvOrLines(text).filter((l) => !NOISE.test(l)), "");
  }

  V.findDates = findDates;
  V.findRole = findRole;
  V.cleanName = cleanName;
  V.parseRows = parseRows;
  V.csvOrLines = csvOrLines;
  V.parseEnmCsv = parseEnmCsv;
  V.ingest = ingest;
  if (typeof module !== "undefined" && module.exports) module.exports = V;
})(typeof window !== "undefined" ? window : globalThis);
