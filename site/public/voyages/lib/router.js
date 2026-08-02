/* Routage maritime cote navigateur — port de la logique leg_route() de server.py.
   Primaire : searoute-js (lib_ext/searoute.bundle.js, lazy). Repli : grand-cercle autonome.
   a, b sont des couples [lat, lon] (comme les tuples Python). Sortie coords D3 = [lon, lat]. */
(function (g) {
  const V = (g.VOYAGES = g.VOYAGES || {});
  const R_NM = 3440.065;
  const round1 = (x) => Math.round(x * 10) / 10;

  function haversineNm(a, b) {
    const toR = Math.PI / 180;
    const lat1 = a[0] * toR, lon1 = a[1] * toR, lat2 = b[0] * toR, lon2 = b[1] * toR;
    const h = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
    return 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  // interpolation grand-cercle (slerp spherique) -> liste [lon, lat]
  function greatCircle(a, b) {
    const toR = Math.PI / 180, toD = 180 / Math.PI;
    const lat1 = a[0] * toR, lon1 = a[1] * toR, lat2 = b[0] * toR, lon2 = b[1] * toR;
    const d = 2 * Math.asin(Math.min(1, Math.sqrt(
      Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2)));
    if (d === 0) return [[a[1], a[0]]];
    const nm = haversineNm(a, b);
    const n = Math.max(2, Math.min(120, Math.round(nm / 200)));
    const out = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);
      out.push([Math.atan2(y, x) * toD, Math.atan2(z, Math.sqrt(x * x + y * y)) * toD]);
    }
    return out;
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = () => res(); s.onerror = () => rej(new Error("load " + src));
      document.head.appendChild(s);
    });
  }

  let _sr; // undefined = pas tente, false = indispo, function = pret
  let _loading = null;
  async function ensureRouter() {
    if (_sr !== undefined) return _sr;
    if (g.searoute) { _sr = g.searoute; return _sr; }
    if (V._searoute) { _sr = V._searoute; return _sr; }
    if (typeof document === "undefined") { _sr = false; return _sr; }
    if (!_loading) _loading = (async () => {
      try { await loadScript("./lib_ext/searoute.bundle.js"); _sr = g.searoute || false; }
      catch (e) { console.warn("searoute indisponible, repli grand-cercle", e); _sr = false; }
      return _sr;
    })();
    return _loading;
  }

  const pt = (a) => ({ type: "Feature", geometry: { type: "Point", coordinates: [a[1], a[0]] } });

  // retourne { coords:[[lon,lat]...], nm, routed }
  async function routeLeg(a, b) {
    if (a[0] === b[0] && a[1] === b[1]) return { coords: [[a[1], a[0]]], nm: 0.0, routed: true };
    const sr = await ensureRouter();
    if (sr) {
      try {
        const r = sr(pt(a), pt(b), "nm");
        if (r && r.geometry && r.geometry.coordinates && r.geometry.coordinates.length >= 2) {
          const coords = r.geometry.coordinates.map((c) => [c[0], c[1]]);
          return { coords, nm: round1(r.properties.length), routed: true };
        }
      } catch (e) { /* repli */ }
    }
    return { coords: greatCircle(a, b), nm: round1(haversineNm(a, b)), routed: false };
  }

  V.haversineNm = haversineNm;
  V.greatCircle = greatCircle;
  V.ensureRouter = ensureRouter;
  V.routeLeg = routeLeg;
  if (typeof module !== "undefined" && module.exports) module.exports = V;
})(typeof window !== "undefined" ? window : globalThis);
