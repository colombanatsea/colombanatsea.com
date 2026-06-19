/* Interface de la demo. Tout est local : pdf.js extrait le texte, le moteur evalue. */
(function () {
  "use strict";
  const E = window.BunkeringEngine;
  const $ = s => document.querySelector(s);
  let REPORTS = [];

  // pdf.js auto-heberge, charge a la demande. Parsing en thread principal (pas de
  // Web Worker) : on charge le module worker comme script normal, pdf.js detecte
  // globalThis.pdfjsWorker.WorkerMessageHandler et n'appelle jamais new Worker().
  // Avec isEvalSupported:false, tout tient sous une CSP script-src 'self'.
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("chargement " + src));
      document.head.appendChild(s);
    });
  }
  async function ensurePdfjs() {
    if (!window.pdfjsLib) await loadScript("vendor/pdf.min.js");
    if (!(window.pdfjsWorker && window.pdfjsWorker.WorkerMessageHandler))
      await loadScript("vendor/pdf.worker.min.js");
  }

  // -------- pdf.js : reconstruction des lignes (approx. pdfplumber) ----------
  async function pdfToPages(buf) {
    await ensurePdfjs();
    const pdf = await pdfjsLib.getDocument({ data: buf, isEvalSupported: false }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      const rows = {};
      tc.items.forEach(it => {
        if (!it.str || !it.str.trim()) return;
        const y = Math.round(it.transform[5]);
        (rows[y] = rows[y] || []).push({ x: it.transform[4], s: it.str });
      });
      const ys = Object.keys(rows).map(Number).sort((a, b) => b - a);
      const lines = ys.map(y =>
        rows[y].sort((a, b) => a.x - b.x).map(o => o.s).join(" ").replace(/\s+/g, " ").trim());
      pages.push(lines.join("\n"));
      page.cleanup();
    }
    return pages;
  }

  // ---------------------------------- rendu --------------------------------
  const SEVTXT = { ok: "conforme", warning: "attention", out_of_spec: "non conforme" };
  function sevTag(s) { return `<span class="tag ${s === "out_of_spec" ? "oos" : s === "warning" ? "warn" : "ok"}">${SEVTXT[s] || s}</span>`; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

  function graded(r) { return r.parameters.filter(p => ["pass", "fail", "indeterminate"].includes(p.verdict)).length; }

  function render() {
    if (!REPORTS.length) { $("#results").classList.add("hidden"); return; }
    $("#results").classList.remove("hidden");
    const quality = REPORTS.filter(r => r.report_type === "quality");
    const oos = REPORTS.reduce((a, r) => a + r.out_of_spec_count, 0);
    const warn = REPORTS.reduce((a, r) => a + r.warning_count, 0);

    $("#kpis").innerHTML = [
      ["", REPORTS.length, "rapports ingérés"],
      ["", new Set(REPORTS.filter(r => r.lab !== "UNKNOWN").map(r => r.lab)).size, "formats labo reconnus"],
      ["oos", oos, "paramètres hors-spec"],
      ["warn", warn, "points d'attention"],
    ].map(k => `<div class="kpi ${k[0]}"><div class="n">${k[1]}</div><div class="l">${k[2]}</div></div>`).join("");

    // alertes
    const al = E.alerts(REPORTS, true);
    $("#alerts").innerHTML = al.length ? al.map(a => `
      <div class="alert ${a.severity === "out_of_spec" ? "oos" : "warn"}">
        <div class="ico">${a.severity === "out_of_spec" ? "✕" : "!"}</div>
        <div class="body">
          <b>${esc(E.BY_KEY[a.parameter] ? E.BY_KEY[a.parameter].label : a.raw_label)} = ${esc(a.raw_value)}</b>
          <span class="tag muted" style="margin-left:6px">${esc(a.lab)}</span>
          <div class="meta">${esc(a.vessel || "?")} · ${esc(a.supplier || "?")} · ISO ${esc(a.iso_revision)} :
            ${a.iso_limit_max != null ? "max " + a.iso_limit_max : ""}${a.iso_limit_min != null ? " min " + a.iso_limit_min : ""}
            — ${esc(a.rationale)}</div>
        </div>
      </div>`).join("")
      : `<p class="muted small">Aucune non-conformité ni point d'attention détecté.</p>`;

    // fournisseurs
    const sc = E.supplierScores(quality);
    $("#suppliers").innerHTML = `<thead><tr><th>Fournisseur</th><th class="num">Param.</th>
      <th class="num">OOS</th><th>Qualité</th></tr></thead><tbody>` +
      sc.map(s => `<tr><td>${esc(s.supplier)}<div class="small muted">${esc(s.ports.join(", "))}</div></td>
        <td class="num">${s.n_params}</td>
        <td class="num">${s.n_oos ? '<b style="color:var(--oos)">' + s.n_oos + "</b>" : "0"}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="qbar"><i style="width:${s.quality_score}%"></i></div>
          <span class="mono">${s.quality_score}</span></div></td></tr>`).join("") + "</tbody>";

    // rapports
    $("#reports tbody").innerHTML = REPORTS.map((r, i) => `
      <tr class="clickable" data-i="${i}">
        <td>${esc(r.report_id)}</td>
        <td><span class="tag ${r.lab === "UNKNOWN" ? "muted" : "lab"}">${esc(r.lab)}</span></td>
        <td class="small">${esc(r.report_type)}</td>
        <td>${esc(r.vessel || "—")}</td>
        <td class="small">${esc(r.grade_ordered || "—")}</td>
        <td class="mono">${esc(r.iso_revision || "—")}</td>
        <td class="num">${graded(r)}</td>
        <td class="num">${r.out_of_spec_count || ""}</td>
        <td class="num">${r.warning_count || ""}</td>
        <td>${sevTag(r.overall_severity)}</td>
      </tr>`).join("");
    $("#reports tbody").querySelectorAll("tr").forEach(tr =>
      tr.addEventListener("click", () => showDetail(+tr.dataset.i, tr)));
  }

  function showDetail(i, tr) {
    const r = REPORTS[i];
    $("#reports tbody").querySelectorAll("tr").forEach(t => t.classList.remove("sel"));
    if (tr) tr.classList.add("sel");
    const d = $("#detail");
    d.classList.remove("hidden");
    const meta = [
      ["Navire", r.vessel], ["IMO", r.imo], ["Port", r.port], ["Date soutage", r.bunker_date],
      ["Fournisseur", r.supplier], ["Grade", r.grade_ordered], ["PO", r.po_number],
      ["Révision ISO", (r.iso_revision || "") + (r.iso_revision_source ? " (" + r.iso_revision_source + ")" : "")],
      ["Statut", r.status],
    ].filter(x => x[1]).map(x => `<span class="pill">${x[0]} <b>${esc(x[1])}</b></span>`).join("");

    const rows = r.parameters.map(p => {
      const lim = [p.iso_limit_min != null ? "min " + p.iso_limit_min : "", p.iso_limit_max != null ? "max " + p.iso_limit_max : ""].filter(Boolean).join(", ");
      const sev = p.severity === "out_of_spec" ? "oos" : p.severity === "warning" ? "warn" : "ok";
      const vshow = p.verdict === "no_limit" ? '<span class="tag muted">informatif</span>'
        : p.verdict === "qualitative" ? '<span class="tag muted">qualitatif</span>'
        : p.verdict === "unknown_param" ? '<span class="tag muted">non mappé</span>'
        : sevTag(p.severity);
      return `<tr>
        <td>${esc(E.BY_KEY[p.canonical_key] ? E.BY_KEY[p.canonical_key].label : p.raw_label)}
          <div class="small muted">${esc(p.raw_label)}${p.method ? " · " + esc(p.method) : ""}</div></td>
        <td class="num">${esc(p.raw_value)}</td>
        <td class="small">${esc(p.unit || "")}</td>
        <td class="num small">${esc(lim || "—")}</td>
        <td>${vshow}</td>
      </tr>`;
    }).join("");

    d.innerHTML = `<h3>${esc(r.report_id)} · ${esc(r.lab)}</h3>
      <div class="small muted">${graded(r)} paramètres évalués contre ISO 8217 ${esc(r.iso_revision || "")}</div>
      <div class="pillrow">${meta}</div>
      <table><thead><tr><th>Paramètre</th><th class="num">Valeur</th><th>Unité</th>
        <th class="num">Limite ISO</th><th>Verdict</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="small muted" style="margin-top:10px">La valeur conserve sa notation d'origine
      (« &lt; », « &gt; »). Le verdict est recalculé par notre moteur contre la révision applicable,
      pas repris du code couleur du laboratoire.</p>`;
    d.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---------------------------------- entrees -------------------------------
  function setStatus(t) { $("#status").textContent = t || ""; }

  function loadSample() {
    REPORTS = (window.BUNKERING_SAMPLES || []).map(o => E.processPages(o.pages, o.key.toUpperCase()));
    setStatus(REPORTS.length + " rapports d'exemple analysés (réels, anonymisés).");
    render();
    if (REPORTS.length) showDetail(REPORTS.findIndex(r => r.out_of_spec_count > 0) >= 0
      ? REPORTS.findIndex(r => r.out_of_spec_count > 0) : 0, null);
  }

  async function handleFiles(files) {
    let added = 0;
    for (const f of files) {
      if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) continue;
      setStatus("Lecture de " + f.name + " …");
      try {
        const pages = await pdfToPages(await f.arrayBuffer());
        const r = E.processPages(pages, f.name.replace(/\.pdf$/i, ""));
        REPORTS = REPORTS.filter(x => x.source_file !== r.source_file);
        r.source_file = f.name;
        REPORTS.unshift(r);
        added++;
      } catch (e) {
        setStatus("Échec lecture " + f.name + " : " + e.message);
      }
    }
    if (added) { setStatus(added + " fichier(s) analysé(s) localement."); render(); showDetail(0, null); }
  }

  // wiring
  $("#pick").addEventListener("click", () => $("#file").click());
  $("#file").addEventListener("change", e => handleFiles(e.target.files));
  $("#loadSample").addEventListener("click", loadSample);
  const dz = $("#drop");
  ["dragover", "dragenter"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("drag"); }));
  ["dragleave", "drop"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("drag"); }));
  dz.addEventListener("drop", e => handleFiles(e.dataTransfer.files));

  // charge l'exemple au demarrage
  loadSample();
})();
