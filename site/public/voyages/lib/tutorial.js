/* Mini-tutoriel premiere visite (skippable, reouvrable via le bouton aide).
   window.VOYAGES.tutorial(t, force) — t = fonction i18n. Persiste "vu" en localStorage. */
(function (g) {
  const V = (g.VOYAGES = g.VOYAGES || {});
  const KEY = "voyages-app:tuto-seen";

  function tutorial(t, force) {
    try { if (!force && localStorage.getItem(KEY)) return; } catch (e) { /* localStorage indispo */ }
    if (document.querySelector(".tuto-ov")) return;
    const steps = [1, 2, 3, 4].map((i) => ({ t: t("tuto_s" + i + "_t"), b: t("tuto_s" + i + "_b") }));
    let i = 0;

    const ov = document.createElement("div");
    ov.className = "tuto-ov";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", t("tuto_title"));
    const card = document.createElement("div");
    card.className = "tuto-card";
    ov.appendChild(card);

    function close() {
      try { localStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ }
      document.removeEventListener("keydown", onKey);
      ov.remove();
    }
    function next() { if (i < steps.length - 1) { i++; render(); } else close(); }
    function prev() { if (i > 0) { i--; render(); } }
    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }

    function render() {
      const s = steps[i];
      card.innerHTML = "";
      const h = document.createElement("h2"); h.className = "tuto-h"; h.textContent = s.t; card.appendChild(h);
      const p = document.createElement("p"); p.className = "tuto-b"; p.textContent = s.b; card.appendChild(p);
      const dots = document.createElement("div"); dots.className = "tuto-dots";
      steps.forEach((_, k) => { const d = document.createElement("span"); d.className = "tuto-dot" + (k === i ? " on" : ""); dots.appendChild(d); });
      card.appendChild(dots);
      const row = document.createElement("div"); row.className = "tuto-row";
      const skip = document.createElement("button"); skip.type = "button"; skip.className = "tuto-skip"; skip.textContent = t("tuto_skip"); skip.onclick = close;
      const actions = document.createElement("div"); actions.className = "tuto-actions";
      if (i > 0) { const b = document.createElement("button"); b.type = "button"; b.className = "tuto-btn ghost"; b.textContent = t("tuto_back"); b.onclick = prev; actions.appendChild(b); }
      const nx = document.createElement("button"); nx.type = "button"; nx.className = "tuto-btn";
      nx.textContent = i === steps.length - 1 ? t("tuto_start") : t("tuto_next");
      nx.onclick = next; actions.appendChild(nx);
      row.appendChild(skip); row.appendChild(actions); card.appendChild(row);
      nx.focus();
    }

    render();
    document.body.appendChild(ov);
    document.addEventListener("keydown", onKey);
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
  }

  V.tutorial = tutorial;
})(typeof window !== "undefined" ? window : globalThis);
