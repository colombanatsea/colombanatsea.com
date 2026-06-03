/* Resolveur de ports cote navigateur — port fidele de scripts/ports.py (skill maritime-voyage-mapper).
   Correspondance : locode exact -> alias -> nom exact -> sous-chaine -> flou (Dice ~ difflib).
   Donnees : data/ports.json (3962 ports {n,l,c,lat,lon}) + aliases.json + ports_supplement.json. */
(function (g) {
  const V = (g.VOYAGES = g.VOYAGES || {});
  const LOCODE_RE = /^[A-Z]{2}[A-Z0-9]{3}$/;
  const COMBINING = new RegExp("[\\u0300-\\u036f]", "g"); // diacritiques combinants

  function norm(s) {
    if (!s) return "";
    s = ("" + s).normalize("NFKD").replace(COMBINING, "");
    s = s.toLowerCase().replace(/[^a-z0-9]+/g, " ");
    return s.trim();
  }
  const round3 = (x) => Math.round(x * 1000) / 1000;

  // similarite ~ difflib.SequenceMatcher.ratio (coefficient de Dice sur bigrammes)
  function bigrams(s) { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const b = s.substr(i, 2); m.set(b, (m.get(b) || 0) + 1); } return m; }
  function dice(a, b) {
    if (a === b) return 1; if (a.length < 2 || b.length < 2) return 0;
    const A = bigrams(a), B = bigrams(b); let inter = 0, tot = 0;
    A.forEach((c, k) => { tot += c; if (B.has(k)) inter += Math.min(c, B.get(k)); });
    B.forEach((c) => { tot += c; });
    return tot ? (2 * inter) / tot : 0;
  }

  function createPortDB(ports, aliases, supplement) {
    const by_locode = {}, by_name = {}, records = [];
    for (const p of ports) {
      const rec = { name: p.n, locode: p.l, country: p.c, lat: p.lat, lon: p.lon };
      records.push(rec);
      if (rec.locode) by_locode[rec.locode.toUpperCase().replace(/ /g, "")] = rec;
      const n = norm(rec.name);
      if (n && !(n in by_name)) by_name[n] = rec;
    }
    if (supplement) for (const k in supplement) {
      if (k.startsWith("_")) continue; const v = supplement[k];
      by_locode[v.locode.toUpperCase()] = { name: v.name, locode: v.locode, country: v.country, lat: v.lat, lon: v.lon };
    }
    const aliasMap = {};
    if (aliases) for (const k in aliases) { if (k.startsWith("_")) continue; aliasMap[norm(k)] = aliases[k]; }
    const normNames = Object.keys(by_name);

    function resolve(query, locode, country) {
      // 1. locode exact (argument explicite, ou requete ressemblant a un locode)
      for (const key of [(locode || "").toUpperCase().replace(/ /g, ""),
                         (query || "").toUpperCase().replace(/[ -]/g, "")]) {
        if (key && LOCODE_RE.test(key) && by_locode[key]) return [by_locode[key], "locode", 1.0];
      }
      // 2. alias autoritaire (exonymes FR, corrections)
      let qn = norm(query);
      if (qn in aliasMap) {
        const val = aliasMap[qn]; const vk = val.toUpperCase().replace(/ /g, "");
        if (LOCODE_RE.test(vk) && by_locode[vk]) return [by_locode[vk], "alias", 1.0];
        query = val; qn = norm(val); // re-resoudre via nom canonique
      }
      // 3. nom exact normalise
      if (qn in by_name) {
        const rec = by_name[qn];
        if (!country || norm(rec.country).includes(norm(country))) return [rec, "name-exact", 1.0];
      }
      // 3b. nom contenu (sous-chaine) avec filtre pays optionnel
      const cand = [];
      for (const rec of records) {
        const rn = norm(rec.name); if (!rn) continue;
        if (qn && (rn.includes(qn) || qn.includes(rn))) {
          if (country && !norm(rec.country || "").includes(norm(country))) continue;
          const score = qn.length / Math.max(rn.length, qn.length);
          cand.push([score, rec]);
        }
      }
      if (cand.length) { cand.sort((a, b) => b[0] - a[0]); return [cand[0][1], "name-substring", round3(cand[0][0])]; }
      // 4. flou
      let best = null, bestScore = 0;
      for (const nm of normNames) { const s = dice(qn, nm); if (s > bestScore) { bestScore = s; best = nm; } }
      if (best && bestScore >= 0.78) return [by_name[best], "fuzzy", round3(bestScore)];
      return [null, "unresolved", 0.0];
    }

    return { resolve, records, by_locode, by_name };
  }

  V.norm = norm;
  V.createPortDB = createPortDB;
})(typeof window !== "undefined" ? window : globalThis);
