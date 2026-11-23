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
    // Il totale viene dalla roadmap: il percorso contiene solo i passi già preparati (ADR-011).
    const num = Number((/passo\s+(\d+)/i.exec(step.name) || [])[1]) || idx + 1;
    const position = model.roadmapSteps ? `passo ${num} di ${model.roadmapSteps}` : `passo ${num}`;

    const tasks = step.tasks.map((t) => {
      const cls = ["task", t.checked ? "done" : "", t.current ? "current" : "", flashLines.has(t.line) ? "flash" : ""].join(" ");
      const body = [
        t.todo ? `<p>${inline(t.todo)}</p>` : "",
        t.signature ? `<div class="sig">${esc(t.signature)}</div>` : "",
        t.state && t.state.status === "open" && t.state.reason ? `<p class="reason">Ancora aperto: ${condition(t.state.reason)}</p>` : "",
        missingHint(t),
        t.state && t.state.warning ? `<p class="warning">${condition(t.state.warning)}</p>` : "",
        expectBlock(t),
        `<div class="actions">${scaffoldButton(t)}<button class="btn" type="button" data-reveal="${t.line}">Apri nel percorso</button></div>`,
      ].join("");
      return `<li class="${cls}"><details${t.current ? " open" : ""}><summary>
          <button class="box" type="button" role="checkbox" aria-checked="${t.checked}" aria-label="${t.checked ? "Segna da fare" : "Segna come fatto"}: ${esc(t.title)}" data-line="${t.line}"></button>
          <span class="label">${esc(t.title)}</span>${meta(t)}
        </summary><div class="detail">${body}</div></details></li>`;
    }).join("");

    const others = model.steps.map((s, i) => i === idx ? "" :
      `<li class="${s.done === s.total ? "full" : ""}"><button type="button" data-step="${i}" title="Mostra ${esc(s.name)}">
        <span class="dot"></span><span class="name">${esc(s.name)}</span><span class="count">${s.done}/${s.total}</span></button></li>`).join("");

    root.innerHTML = `
      <div class="sec"><span>Pebble · percorso</span><b>${model.done} di ${model.total}</b></div>
      <div class="step">${esc(step.name)}<small>roadmap › ${position}${esc(refs)}</small><div class="bar"><i data-pct="${pct}"></i></div></div>
      <ul class="tasks">${tasks}</ul>
      ${step.done === step.total && idx === model.currentStep ? nextCard() : ""}
      ${others ? `<div class="sec"><span>Altri passi</span></div><ul class="others">${others}</ul>` : ""}
      ${foot()}`;
    // Il CSP vieta gli attributi style nell'HTML: la larghezza si imposta da script.
    for (const bar of root.querySelectorAll("[data-pct]")) bar.style.width = `${bar.dataset.pct}%`;
  }

  /** Accanto al titolo: "1/4" rosso o verde quando ci sono i test, altrimenti il riassunto delle condizioni. */
  function meta(t) {
    const p = t.state && t.state.progress;
    if (p) {
      const cls = t.state.status === "done" ? (t.state.warning ? "warn" : "green") : "red";
      return `<span class="meta ${cls}" title="${p.passed} test verdi su ${p.total}">${p.passed}/${p.total}${t.state.warning ? " !" : ""}</span>`;
    }
    if (t.state && t.state.status === "open") return `<span class="meta red" title="${esc(t.state.reason || "")}">da fare</span>`;
    return `<span class="meta">${esc(t.summary)}</span>`;
  }

  /** "Cosa mi aspetto": ogni condizione spiegata, con l'esempio del nome del test quando serve. */
  function expectBlock(t) {
    const items = t.expect.map((x) =>
      `<li class="${x.invalid ? "invalid" : ""}"><span>${condition(x.text)}</span>${x.example ? `<code class="ex">${esc(x.example)}</code>` : ""}</li>`).join("");
    return `<div class="expect"><span class="label2">Cosa mi aspetto</span><ul>${items}</ul></div>`;
  }

  /** Un test "non trovato" va spiegato: è il nome del test che conta, non quello che verifica. */
  function missingHint(t) {
    const r = t.state && t.state.status === "open" ? t.state.reason || "" : "";
    if (!r.startsWith("test non trovato")) return "";
    const names = (model.check && model.check.names) || [];
    const found = names.length
      ? `Ora i tuoi test si chiamano: ${names.map((n) => `<code>“${esc(n)}”</code>`).join(", ")}.`
      : "Non ho ancora trovato nessun test: controlla il comando in fondo al pannello.";
    return `<p class="hint">Pebble cerca un test il cui <b>nome</b> contiene quelle parole: è il testo tra virgolette in <code>test('…', …)</code>. ${found} Rinomina il test e salva.</p>`;
  }

  /** "Prepara il file" (ADR-003): per i compiti da fare che citano un file che manca o non è ancora verificato. */
  function scaffoldButton(t) {
    if (t.checked || !t.files.length) return "";
    const missing = t.files.find((f) => t.state && t.state.reason && t.state.reason.includes(`manca ${f}`)) || (!t.state ? t.files[0] : null);
    if (!missing) return "";
    return `<button class="btn primary" type="button" data-scaffold="${esc(missing)}" data-line="${t.line}" title="Firme e pseudocodice in ${esc(missing)}">Prepara il file</button>`;
  }

  /** Il passo è chiuso: Pebble offre di preparare il prossimo, partendo dal codice com'è adesso (ADR-011). */
  function nextCard() {
    const n = model.next;
    if (!n) return "";
    const action = model.planning
      ? `<span class="planning"><span class="spin"></span> Pebble sta preparando il passo ${n.n}…</span>`
      : `<button class="btn primary" type="button" data-plan>Prepara il passo ${n.n}</button>`;
    return `<div class="next"><span class="lvl">Passo fatto</span><p>Prossimo: <b>Passo ${n.n} · ${esc(n.title)}</b>. Pebble lo scompone in compiti partendo dal codice com'è adesso, e ti mostra la proposta prima di scriverla.</p>${action}</div>`;
  }

  function foot() {
    const c = model.check;
    const verify = `<button class="link" type="button" data-verify>Verifica ora</button>`;
    if (c.running) return `<div class="foot"><span class="spin"></span> Sto lanciando i test e guardando il compilatore…</div>`;
    if (c.error)
      return `<div class="foot err">I test non sono partiti: ${esc(c.error)}.<br>Comando: <code>${esc(c.command)}</code> · <button class="link" type="button" data-settings>Cambia comando</button> · ${verify}</div>`;
    if (c.at) {
      const red = c.failed ? `, <span class="r">${c.failed} ross${c.failed === 1 ? "o" : "i"}</span>` : ", tutti verdi";
      return `<div class="foot">Verificato alle ${esc(c.at)} · ${c.tests} test${red}. Le caselle si spuntano quando test e compilatore lo confermano. ${verify}</div>`;
    }
    return `<div class="foot">Le caselle si spuntano quando test e compilatore lo confermano: salva un file o ${verify}. Puoi anche spuntarle tu.</div>`;
  }

  // ---------- il sentiero d'avvio: bootstrap, piano, primo passo ----------

  const QUESTIONS = [
    { key: "name", kind: "line", title: "Come si chiama il progetto?", help: "Un nome di lavoro va benissimo, lo puoi cambiare quando vuoi.", example: "mini-calc" },
    { key: "what", kind: "text", title: "Cosa vuoi costruire, e per chi?", help: "Poche righe, con parole tue. È la cosa più importante.", example: "Un programma da riga di comando che aiuta a caricare il bilanciere in palestra." },
    { key: "example", kind: "text", optional: true, title: "Come lo useresti? Un esempio concreto", help: "Un comando, una schermata, un'azione. Una riga per esempio.", example: "mini-calc 1rm 100 5 → massimale stimato" },
    { key: "stack", kind: "chips", title: "Con quale linguaggio, su quale piattaforma?", help: "Se non lo sai, va bene: diventa uno dei dubbi da chiarire.", options: ["TypeScript su Node", "Python", "Web app con React", "Swift per iOS", "Non lo so ancora"] },
    { key: "rules", kind: "text", optional: true, title: "Ci sono regole che non si possono sbagliare?", help: "Le regole del dominio: è lì che un errore costa di più. Una per riga.", example: "Bilanciere da 20 kg; dischi da 25 a 1,25 kg, in coppia" },
    { key: "unknowns", kind: "checks", title: "Cosa non sai ancora?", help: "I dubbi sono il punto di partenza: è proprio lì che Pebble ti aiuta di più." },
    { key: "level", kind: "levels", title: "Quanta esperienza hai?", help: "Cambia come Pebble ti spiega le cose. Puoi modificarlo nelle impostazioni." },
  ];
  const LEVEL_OPTIONS = [
    ["entry", "Sto imparando", "spiegazioni semplici, ogni termine spiegato"],
    ["junior", "Ho scritto qualcosa", "il perché, con il nome dei principi"],
    ["mid", "Sono autonomo", "il giusto, senza ripetere l'ovvio"],
    ["senior", "Sono esperto", "asciutto: bug, decisioni, compromessi"],
  ];
  const saved0 = vscode.getState() || {};
  let wizard = saved0.wizard || null; // { step, answers }
  const saveWizard = () => vscode.setState({ ...(vscode.getState() || {}), shownStep, wizard });

  function renderEmpty() {
    if (wizard) return renderWizard();
    const ob = model.onboarding;
    const stage = (n, done, active, title, text, actions) => `
      <div class="stage${done ? " done" : ""}${active ? " active" : ""}">
        <div class="stage-head"><span class="stage-n">${done ? "" : n}</span><b>${title}</b></div>
        <p>${text}</p>${active || done ? `<div class="actions">${actions}</div>` : ""}
      </div>`;
    const planBtn = model.next && ob.roadmap
      ? `<button class="btn primary" type="button" data-plan ${model.planning ? "disabled" : ""}>${model.planning ? "Pebble sta preparando il passo…" : `Prepara il passo ${model.next.n}`}</button>`
      : "";
    root.innerHTML = `
      <div class="sec"><span>Pebble · si parte</span></div>
      <div class="intro">Tre sassolini per partire. Pebble ti guida e ti propone, il codice lo scrivi tu.</div>
      <div class="stages">
        ${stage(1, ob.bootstrap, !ob.bootstrap, "Racconta il progetto",
          ob.bootstrap ? "Il tuo <code>bootstrap.md</code> c'è." : "Un <code>bootstrap.md</code>: cosa vuoi costruire, i vincoli, cosa non sai ancora.",
          ob.bootstrap
            ? `<button class="link" type="button" data-open-bootstrap>Apri bootstrap.md</button>`
            : `<button class="btn primary" type="button" data-wizard>Rispondi a qualche domanda</button><button class="btn" type="button" data-template>Lo scrivo io nel file</button>`)}
        ${stage(2, ob.roadmap, ob.bootstrap && !ob.roadmap, "Pebble propone il piano",
          "Decisioni, architettura e roadmap in <code>.pebble/</code>. Le leggi, le discuti e le salvi tu.",
          ob.roadmap ? "" : `<button class="btn primary" type="button" data-init>Proponi il piano</button>`)}
        ${stage(3, false, ob.roadmap, "Il primo passo",
          "Pebble scompone il passo 1 della roadmap in compiti piccoli, ognuno con quello che si aspetta.",
          planBtn)}
      </div>
      <div class="foot">Preferisci provare subito? <button class="link" type="button" data-create>Crea un percorso di esempio</button></div>`;
  }

  function renderWizard() {
    const q = QUESTIONS[wizard.step];
    const a = wizard.answers;
    const pct = Math.round(((wizard.step + 1) / QUESTIONS.length) * 100);
    let field = "";
    if (q.kind === "line") field = `<input id="f" type="text" value="${esc(a[q.key] || "")}" placeholder="${esc(q.example || "")}">`;
    if (q.kind === "text") field = `<textarea id="f" rows="4" placeholder="${esc(q.example || "")}">${esc(a[q.key] || "")}</textarea>`;
    if (q.kind === "chips")
      field = `<div class="chips">${q.options.map((o) => `<button type="button" class="chip${a.stack === o ? " on" : ""}" data-chip="${esc(o)}">${esc(o)}</button>`).join("")}</div>
        <input id="f" type="text" value="${esc(q.options.includes(a.stack) ? "" : a.stack || "")}" placeholder="Altro: scrivilo qui">`;
    if (q.kind === "checks")
      field = `<div class="checks">${model.onboarding.commonUnknowns.map((u) => `<label><input type="checkbox" data-check="${esc(u)}" ${(a.unknowns || []).includes(u) ? "checked" : ""}> ${esc(u)}</label>`).join("")}</div>
        <textarea id="f" rows="2" placeholder="Altri dubbi, uno per riga">${esc(a.otherUnknown || "")}</textarea>`;
    if (q.kind === "levels")
      field = `<div class="levels">${LEVEL_OPTIONS.map(([id, t, d]) => `<button type="button" class="level${(a.level || model.onboarding.level) === id ? " on" : ""}" data-level="${id}"><b>${t}</b><span>${d}</span></button>`).join("")}</div>`;
    const last = wizard.step === QUESTIONS.length - 1;
    root.innerHTML = `
      <div class="sec"><span>Racconta il progetto</span><b>${wizard.step + 1} di ${QUESTIONS.length}</b></div>
      <div class="step"><div class="bar"><i data-pct="${pct}"></i></div></div>
      <div class="wizard">
        <h2>${esc(q.title)}</h2>
        <p class="help">${esc(q.help)}</p>
        ${field}
        ${q.example && q.kind !== "line" ? `<p class="example">Per esempio: ${esc(q.example)}</p>` : ""}
        <div class="actions">
          ${wizard.step > 0 ? `<button class="btn" type="button" data-wiz="back">Indietro</button>` : `<button class="btn" type="button" data-wiz="cancel">Annulla</button>`}
          <button class="btn primary" type="button" data-wiz="${last ? "finish" : "next"}">${last ? "Crea bootstrap.md" : q.optional ? "Avanti (o salta)" : "Avanti"}</button>
        </div>
      </div>`;
    for (const bar of root.querySelectorAll("[data-pct]")) bar.style.width = `${bar.dataset.pct}%`;
    const f = document.getElementById("f");
    if (f) f.focus();
  }

  /** Legge il campo della domanda corrente nelle risposte. */
  function collect() {
    const q = QUESTIONS[wizard.step];
    const f = document.getElementById("f");
    const a = wizard.answers;
    if (q.kind === "line" || q.kind === "text") a[q.key] = f ? f.value : "";
    if (q.kind === "chips" && f && f.value.trim()) a.stack = f.value.trim();
    if (q.kind === "checks") {
      a.unknowns = [...root.querySelectorAll("[data-check]")].filter((c) => c.checked).map((c) => c.dataset.check);
      a.otherUnknown = f ? f.value : "";
    }
  }

  function finishWizard() {
    const a = wizard.answers;
    const unknownStack = a.stack === "Non lo so ancora";
    const answers = {
      name: a.name || "", what: a.what || "", example: a.example || "",
      stack: unknownStack ? "" : a.stack || "", rules: a.rules || "",
      unknowns: [...(a.unknowns || []), ...(unknownStack ? ["Quale linguaggio e piattaforma usare"] : [])],
      otherUnknown: a.otherUnknown || "",
    };
    vscode.postMessage({ type: "bootstrapWizard", answers, level: a.level || null });
    wizard = null;
    saveWizard();
    render(new Set());
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
      vscode.setState({ ...(vscode.getState() || {}), shownStep });
      return render(new Set());
    }
    if (e.target.closest("[data-create]")) return vscode.postMessage({ type: "createExample" });
    if (e.target.closest("[data-template]")) return vscode.postMessage({ type: "bootstrapTemplate" });
    if (e.target.closest("[data-open-bootstrap]")) return vscode.postMessage({ type: "openBootstrap" });
    if (e.target.closest("[data-init]")) return vscode.postMessage({ type: "init" });
    if (e.target.closest("[data-wizard]")) {
      wizard = { step: 0, answers: {} };
      saveWizard();
      return render(new Set());
    }
    const chip = e.target.closest("[data-chip]");
    if (chip && wizard) {
      wizard.answers.stack = chip.dataset.chip;
      saveWizard();
      return render(new Set());
    }
    const lvl = e.target.closest("[data-level]");
    if (lvl && wizard) {
      wizard.answers.level = lvl.dataset.level;
      saveWizard();
      return render(new Set());
    }
    const wiz = e.target.closest("[data-wiz]");
    if (wiz && wizard) {
      const act = wiz.dataset.wiz;
      if (act === "cancel") wizard = null;
      else {
        collect();
        if (act === "back") wizard.step = Math.max(0, wizard.step - 1);
        if (act === "next") wizard.step = Math.min(QUESTIONS.length - 1, wizard.step + 1);
        if (act === "finish") return finishWizard();
      }
      saveWizard();
      return render(new Set());
    }
    if (e.target.closest("[data-verify]")) return vscode.postMessage({ type: "verify" });
    if (e.target.closest("[data-plan]")) return vscode.postMessage({ type: "planNext" });
    const sc = e.target.closest("[data-scaffold]");
    if (sc) return vscode.postMessage({ type: "scaffold", path: sc.dataset.scaffold, line: Number(sc.dataset.line) });
    if (e.target.closest("[data-settings]")) return vscode.postMessage({ type: "settings" });
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && wizard && e.target.tagName === "INPUT" && e.target.type === "text") {
      e.preventDefault();
      const next = root.querySelector('[data-wiz="next"], [data-wiz="finish"]');
      if (next) next.click();
    }
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
