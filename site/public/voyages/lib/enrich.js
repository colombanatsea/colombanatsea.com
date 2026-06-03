/* Enrichissement d'un voyage cote navigateur — port fidele de enrich() (server.py).
   Resout les escales (V.db), construit les legs (V.routeLeg), calcule le temps de mer,
   les totaux et les warnings. Sortie identique au backend (hors coords de routage). */
(function (g) {
  const V = (g.VOYAGES = g.VOYAGES || {});
  const PALETTE = ["#b9472f", "#1f6f8b", "#2e8b6f", "#b9860b", "#6c4a83",
                   "#1a5276", "#902b21", "#0e6655", "#7d6608", "#34495e"];
  const INFERRED_RE = /infer|rotation|medium|estim/i;
  const round1 = (x) => Math.round(x * 10) / 10;
  const DAY = 86400000;

  function parseDate(s) {
    if (!s) return null;
    const m = String(s).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    return Number.isNaN(d) ? null : d;
  }

  async function enrich(voyage, db) {
    db = db || V.db;
    const warnings = [], out_vessels = [];
    let total_nm = 0, total_ports = 0, tot_emb = 0, tot_sea = 0, tot_port = 0;
    const vessels = (voyage && voyage.vessels) || [];

    for (let vi = 0; vi < vessels.length; vi++) {
      const v = vessels[vi];
      const color = v.color || PALETTE[vi % PALETTE.length];
      const calls = [];
      for (const c of (v.calls || [])) {
        let lat = c.lat, lon = c.lon;
        let name = c.port != null ? c.port : c.name, locode = c.locode, country = c.country;
        let method = "given", score = 1.0;
        if (lat == null || lon == null) {
          const r = db.resolve(c.port || c.name || "", c.locode, c.country);
          const rec = r[0]; method = r[1]; score = r[2];
          if (rec) {
            lat = rec.lat; lon = rec.lon;
            name = name || rec.name; locode = locode || rec.locode; country = country || rec.country;
          } else {
            warnings.push(`${v.name}: port non résolu '${c.port || c.name || ""}'`);
            continue;
          }
        }
        calls.push({
          port: name, locode: locode, country: country, lat: lat, lon: lon,
          arr: c.arr || c.date, dep: c.dep || c.date, note: c.note || "",
          source: c.source || "", hidden: !!c.hidden, method: method, score: score,
        });
      }
      // legs sur les escales NON masquees, dans l'ordre fourni
      const vis = calls.filter((c) => !c.hidden);
      const legs = []; let vnm = 0;
      for (let i = 0; i < vis.length - 1; i++) {
        const a = [vis[i].lat, vis[i].lon], b = [vis[i + 1].lat, vis[i + 1].lon];
        const leg = await V.routeLeg(a, b);
        vnm += leg.nm;
        legs.push({ coords: leg.coords, nm: leg.nm, routed: leg.routed, from: vis[i].port, to: vis[i + 1].port });
      }
      // temps de mer : jours embarques / au port / en mer
      const emb = parseDate(v.embark), dis = parseDate(v.disembark);
      const embarked = (emb != null && dis != null && dis >= emb) ? Math.round((dis - emb) / DAY) : null;
      let port_days = 0;
      for (const c of vis) {
        const a = parseDate(c.arr), d = parseDate(c.dep);
        if (a != null && d != null && d >= a) port_days += Math.round((d - a) / DAY);
      }
      const sea = embarked != null ? Math.max(0, embarked - port_days) : null;
      const seatime = { embarked: embarked, sea: sea, port: embarked != null ? port_days : null };
      if (embarked != null) { tot_emb += embarked; tot_sea += (sea || 0); tot_port += port_days; }
      const inferred = !!v.inferred || INFERRED_RE.test(String(v.confidence || ""));
      out_vessels.push(Object.assign({}, v, {
        color: color, calls: calls, legs: legs, distance_nm: round1(vnm), seatime: seatime, inferred: inferred,
      }));
      total_nm += vnm; total_ports += vis.length;
    }

    return {
      seafarer: (voyage && voyage.seafarer) || "", generated: (voyage && voyage.generated) || "",
      vessels: out_vessels,
      totals: {
        distance_nm: round1(total_nm), ports: total_ports, vessels: out_vessels.length,
        embarked: tot_emb, sea: tot_sea, port: tot_port,
      },
      warnings: warnings,
    };
  }

  V.parseDate = parseDate;
  V.enrich = enrich;
  if (typeof module !== "undefined" && module.exports) module.exports = V;
})(typeof window !== "undefined" ? window : globalThis);
