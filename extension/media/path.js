// Vista Percorso: disegna il modello che arriva dall'estensione (core/path buildViewModel).
// Vista "stupida": lo stato vero è .pebble/percorso.md, questa pagina manda solo intenzioni.
(function () {
  const vscode = acquireVsCodeApi();
  const root = document.getElementById("root");
  let model = null;
  let shownStep = null; // passo scelto dall'utente; null = quello corrente
  let lastDone = new Set();
  let loaded = false;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  /** `codice` → <code>, il resto escapato. */
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  /** Nelle condizioni: percorsi di file e nomi tra virgolette in monospazio, come nel mockup. */
  const condition = (s) =>
    esc(s)
      .replace(/(^|\s)([\w.\-/]+\.[a-z]{1,5})(?=,|\s|$)/g, "$1<code>$2</code>")
      .replace(/&quot;([^&]+)&quot;/g, "<code>“$1”</code>");

  function render(flashLines) {
    if (!model) return;
    if (!model.hasFile) return renderEmpty();
    if (model.total === 0) return renderNoTasks();

    const idx = shownStep !== null && shownStep < model.steps.length ? shownStep : model.currentStep;
    const step = model.steps[idx];
    const pct = step.total ? Math.round((step.done / step.total) * 100) : 0;
    const refs = step.refs.length ? ` · ${step.refs.join(", ")}` : "";
    const position = `passo ${idx + 1} di ${model.steps.length}`;

    const tasks = step.tasks.map((t) => {
      const cls = ["task", t.checked ? "done" : "", t.current ? "current" : "", flashLines.has(t.line) ? "flash" : ""].join(" ");
      const body = [
        t.todo ? `<p>${inline(t.todo)}</p>` : "",
        t.signature ? `<div class="sig">${esc(t.signature)}</div>` : "",
        ...t.when.map((w) => `<span class="when${w.invalid ? " invalid" : ""}"><span>${w.invalid ? `Da correggere: ${condition(w.text)}` : w.text === "a mano" ? "La spunti tu, quando ti sembra fatto" : `Si spunta quando ${condition(w.text)}`}</span></span>`),
        `<div class="actions"><button class="btn" type="button" data-reveal="${t.line}">Apri nel percorso</button></div>`,
      ].join("");
      return `<li class="${cls}"><details${t.current ? " open" : ""}><summary>
          <button class="box" type="button" role="checkbox" aria-checked="${t.checked}" aria-label="${t.checked ? "Segna da fare" : "Segna come fatto"}: ${esc(t.title)}" data-line="${t.line}"></button>
          <span class="label">${esc(t.title)}</span><span class="meta">${esc(t.summary)}</span>
        </summary><div class="detail">${body}</div></details></li>`;
    }).join("");

    const others = model.steps.map((s, i) => i === idx ? "" :
      `<li class="${s.done === s.total ? "full" : ""}"><button type="button" data-step="${i}" title="Mostra ${esc(s.name)}">
        <span class="dot"></span><span class="name">${esc(s.name)}</span><span class="count">${s.done}/${s.total}</span></button></li>`).join("");

    root.innerHTML = `
      <div class="sec"><span>Pebble · percorso</span><b>${model.done} di ${model.total}</b></div>
      <div class="step">${esc(step.name)}<small>roadmap › ${position}${esc(refs)}</small><div class="bar"><i data-pct="${pct}"></i></div></div>
      <ul class="tasks">${tasks}</ul>
      ${others ? `<div class="sec"><span>Altri passi</span></div><ul class="others">${others}</ul>` : ""}
      <div class="foot">Per ora le caselle le spunti tu, e <code>.pebble/percorso.md</code> si aggiorna. Presto lo faranno i tuoi test e il compilatore.</div>`;
    // Il CSP vieta gli attributi style nell'HTML: la larghezza si imposta da script.
    for (const bar of root.querySelectorAll("[data-pct]")) bar.style.width = `${bar.dataset.pct}%`;
  }

  function renderEmpty() {
    root.innerHTML = `
      <div class="sec"><span>Pebble · percorso</span></div>
      <div class="empty">
        <h2>Nessun percorso, per ora</h2>
        <p>Il percorso trasforma la roadmap in compiti piccoli: cosa fare, la firma da raggiungere, quando è fatto. Vive in <code>.pebble/percorso.md</code>, una checklist che puoi modificare a mano.</p>
        <pre>## Passo 2 · Dischi per lato
- [ ] Implementa platesFor
  firma: platesFor(total: Grams)
  fatto quando: test "60 kg"</pre>
        <button class="btn primary" type="button" data-create>Crea un percorso di esempio</button>
      </div>`;
  }

  function renderNoTasks() {
    root.innerHTML = `
      <div class="sec"><span>Pebble · percorso</span></div>
      <div class="empty">
        <h2>Il percorso non ha ancora compiti</h2>
        <p>Aggiungi una riga <code>- [ ] titolo</code> sotto un passo <code>## …</code> in <code>.pebble/percorso.md</code>.</p>
        <button class="btn" type="button" data-reveal="0">Apri percorso.md</button>
      </div>`;
  }

  root.addEventListener("click", (e) => {
    const box = e.target.closest(".box");
    if (box) {
      e.preventDefault(); // non aprire o chiudere il dettaglio
      e.stopPropagation();
      const checked = box.getAttribute("aria-checked") !== "true";
      box.closest(".task").classList.toggle("done", checked); // risposta immediata; poi arriva lo stato vero
      box.setAttribute("aria-checked", String(checked));
      vscode.postMessage({ type: "toggle", line: Number(box.dataset.line), checked });
      return;
    }
    const reveal = e.target.closest("[data-reveal]");
    if (reveal) return vscode.postMessage({ type: "reveal", line: Number(reveal.dataset.reveal) });
    const stepBtn = e.target.closest("[data-step]");
    if (stepBtn) {
      shownStep = Number(stepBtn.dataset.step);
      vscode.setState({ shownStep });
      return render(new Set());
    }
    if (e.target.closest("[data-create]")) vscode.postMessage({ type: "createExample" });
  });

  window.addEventListener("message", (e) => {
    if (e.data.type !== "model") return;
    const prev = lastDone;
    model = e.data.model;
    const nowDone = new Set(model.steps.flatMap((s) => s.tasks.filter((t) => t.checked).map((t) => t.line)));
    const flash = new Set([...nowDone].filter((l) => !prev.has(l)));
    lastDone = nowDone;
    // Quando un passo si completa, torna a seguire quello corrente.
    if (shownStep !== null && model.steps[shownStep] && model.steps[shownStep].done === model.steps[shownStep].total && flash.size) shownStep = null;
    render(loaded ? flash : new Set()); // al primo caricamento niente lampeggio
    loaded = true;
  });

  const saved = vscode.getState();
  if (saved && typeof saved.shownStep === "number") shownStep = saved.shownStep;
  vscode.postMessage({ type: "ready" });
})();
