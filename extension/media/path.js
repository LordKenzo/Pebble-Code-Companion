// Vista Percorso: disegna il modello che arriva dall'estensione (core/path buildViewModel).
// Vista "stupida": lo stato vero è .pebble/percorso.md, questa pagina manda solo intenzioni.
// I testi arrivano con il modello (model.t, catalogo VIEW_TEXT in core/i18n.ts): qui nessuna frase fissa (ADR-012).
(function () {
  const vscode = acquireVsCodeApi();
  const root = document.getElementById("root");
  let model = null;
  let T = null;
  let shownStep = null; // passo scelto dall'utente; null = quello corrente
  let lastDone = new Set();
  let loaded = false;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  /** "{n} di {total}" con i valori: i valori sono già escapati da chi chiama, se serve. */
  const f = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
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
    const num = Number((/(?:passo|step)\s+(\d+)/i.exec(step.name) || [])[1]) || idx + 1;
    const position = model.roadmapSteps ? f(T.position, { num, total: model.roadmapSteps }) : f(T.positionShort, { num });

    const tasks = step.tasks.map((t) => {
      const cls = ["task", t.checked ? "done" : "", t.current ? "current" : "", flashLines.has(t.line) ? "flash" : ""].join(" ");
      const body = [
        t.todo ? `<p>${inline(t.todo)}</p>` : "",
        t.signature ? `<div class="sig">${esc(t.signature)}</div>` : "",
        t.state && t.state.status === "open" && t.state.reason ? `<p class="reason">${f(T.stillOpen, { reason: condition(t.state.reason) })}</p>` : "",
        missingHint(t),
        t.state && t.state.warning ? `<p class="warning">${condition(t.state.warning)}</p>` : "",
        expectBlock(t),
        `<div class="actions">${scaffoldButton(t)}<button class="btn" type="button" data-reveal="${t.line}">${esc(T.openInPath)}</button></div>`,
      ].join("");
      return `<li class="${cls}"><details${t.current ? " open" : ""}><summary>
          <button class="box" type="button" role="checkbox" aria-checked="${t.checked}" aria-label="${esc(t.checked ? T.markTodo : T.markDone)}: ${esc(t.title)}" data-line="${t.line}"></button>
          <span class="label">${esc(t.title)}</span>${meta(t)}
        </summary><div class="detail">${body}</div></details></li>`;
    }).join("");

    const others = model.steps.map((s, i) => i === idx ? "" :
      `<li class="${s.done === s.total ? "full" : ""}"><button type="button" data-step="${i}" title="${esc(f(T.showStep, { name: s.name }))}">
        <span class="dot"></span><span class="name">${esc(s.name)}</span><span class="count">${s.done}/${s.total}</span></button></li>`).join("");

    root.innerHTML = `
      <div class="sec"><span>${esc(T.header)}</span><b>${f(T.ofTotal, { done: model.done, total: model.total })}</b></div>
      <div class="step">${esc(step.name)}<small>roadmap › ${esc(position)}${esc(refs)}</small><div class="bar"><i data-pct="${pct}"></i></div></div>
      ${testNames(step)}
      <ul class="tasks">${tasks}</ul>
      ${step.done === step.total && idx === model.currentStep ? nextCard() : ""}
      ${others ? `<div class="sec"><span>${esc(T.otherSteps)}</span></div><ul class="others">${others}</ul>` : ""}
      <div class="newpaths"><button class="btn" type="button" data-new-path="feature">${esc(T.newFeature)}</button><button class="btn" type="button" data-new-path="bug">${esc(T.newBug)}</button></div>
      ${foot()}`;
    // Il CSP vieta gli attributi style nell'HTML: la larghezza si imposta da script.
    for (const bar of root.querySelectorAll("[data-pct]")) bar.style.width = `${bar.dataset.pct}%`;
  }

  /** Accanto al titolo: "1/4" rosso o verde quando ci sono i test, altrimenti il riassunto delle condizioni. */
  function meta(t) {
    const p = t.state && t.state.progress;
    if (p) {
      const cls = t.state.status === "done" ? (t.state.warning ? "warn" : "green") : "red";
      return `<span class="meta ${cls}" title="${esc(f(T.testsGreenOf, { passed: p.passed, total: p.total }))}">${p.passed}/${p.total}${t.state.warning ? " !" : ""}</span>`;
    }
    if (t.state && t.state.status === "open") return `<span class="meta red" title="${esc(t.state.reason || "")}">${esc(T.toDo)}</span>`;
    return `<span class="meta">${esc(t.summary)}</span>`;
  }

  /** "Cosa mi aspetto": ogni condizione spiegata, con l'esempio del nome del test quando serve. */
  function expectBlock(t) {
    const items = t.expect.map((x) =>
      `<li class="${x.invalid ? "invalid" : ""}"><span>${condition(x.text)}</span>${x.example ? `<code class="ex">${esc(x.example)}</code>` : ""}</li>`).join("");
    return `<div class="expect"><span class="label2">${esc(T.expectTitle)}</span><ul>${items}</ul></div>`;
  }

  /** I nomi dei test che il passo si aspetta (roadmap #11): a qualsiasi passo, da copiare. */
  let testNamesOpen = false;
  document.addEventListener("toggle", (e) => {
    if (e.target.classList && e.target.classList.contains("tnames")) testNamesOpen = e.target.open;
  }, true);

  function testNames(step) {
    if (!step.tests || !step.tests.length) return "";
    const label = { pass: T.testPass, fail: T.testFail, missing: T.testMissing, unknown: "" };
    const rows = step.tests.map((x) => {
      const name = x.suggested || x.wanted;
      const found = x.actual.length && !x.actual.includes(name) ? `<span class="as">${esc(T.testFoundAs)} “${esc(x.actual[0])}”</span>` : "";
      return `<li class="${x.status}"><i class="tdot"></i><code>${esc(name)}</code>${label[x.status] ? `<span class="st">${esc(label[x.status])}</span>` : ""}${found}</li>`;
    }).join("");
    const names = step.tests.map((x) => x.suggested || x.wanted).join("\n");
    const unknown = step.tests.every((x) => x.status === "unknown") ? `<p class="hint">${esc(T.testUnknown)}</p>` : "";
    return `<details class="tnames"${testNamesOpen ? " open" : ""}><summary>${esc(f(T.testNames, { n: step.tests.length }))}</summary>
      <p class="hint">${T.testNamesHint}</p><ul>${rows}</ul>${unknown}
      <button class="btn" type="button" data-copy="${esc(names)}">${esc(T.copyTestNames)}</button></details>`;
  }

  /** Un test "non trovato" va spiegato: è il nome del test che conta, non quello che verifica. */
  function missingHint(t) {
    if (!t.state || t.state.status !== "open" || t.state.code !== "testMissing") return "";
    const names = (model.check && model.check.names) || [];
    const found = names.length ? f(T.missingFound, { names: names.map((n) => `<code>“${esc(n)}”</code>`).join(", ") }) : T.missingNone;
    return `<p class="hint">${f(T.missingHint, { found })}</p>`;
  }

  /** "Prepara il file" (ADR-003): per i compiti da fare che citano un file che manca o non è ancora verificato. */
  function scaffoldButton(t) {
    if (t.checked || !t.files.length) return "";
    const missing = t.state && t.state.code === "fileMissing" ? t.state.path : !t.state ? t.files[0] : null;
    if (!missing) return "";
    return `<button class="btn primary" type="button" data-scaffold="${esc(missing)}" data-line="${t.line}" title="${esc(f(T.prepareFileTitle, { path: missing }))}">${esc(T.prepareFile)}</button>`;
  }

  /** Il passo è chiuso: Pebble offre di preparare il prossimo, partendo dal codice com'è adesso (ADR-011). */
  function nextCard() {
    const n = model.next;
    if (!n) return "";
    const action = model.planning
      ? `<span class="planning"><span class="spin"></span> ${esc(f(T.preparingStep, { n: n.n }))}</span>`
      : `<button class="btn primary" type="button" data-plan>${esc(f(T.prepareStep, { n: n.n }))}</button>`;
    const closed = /(\d+)/.exec(model.steps[model.currentStep].name);
    const more = `<div class="more">${closed ? `<button class="btn" type="button" data-review-step="${closed[1]}">${esc(T.reviewStepBtn)}</button>` : ""}<button class="link" type="button" data-open-map>${esc(T.openMap)}</button></div>`;
    return `<div class="next"><span class="lvl">${ghost("happy")}${esc(T.stepDone)}</span><p>${f(T.nextStep, { n: n.n, title: esc(n.title) })}</p>${action}${more}</div>`;
  }

  function foot() {
    const c = model.check;
    const verify = `<button class="link" type="button" data-verify>${esc(T.checkNow)}</button>`;
    if (c.running) return `<div class="foot"><span class="spin"></span> ${esc(T.running)}</div>`;
    if (c.error)
      return `<div class="foot err">${ghost("worried")}${esc(f(T.testsFailed, { error: c.error }))}<br>${esc(T.command)} <code>${esc(c.command)}</code> · <button class="link" type="button" data-settings>${esc(T.changeCommand)}</button> · ${verify}</div>`;
    if (c.at) {
      const red = c.failed ? (c.failed === 1 ? T.redOne : f(T.redMany, { n: c.failed })) : T.allGreen;
      const count = c.tests === 1 ? T.testCount1 : f(T.testCountN, { n: c.tests });
      return `<div class="foot">${f(T.checkedAt, { at: esc(c.at), count, red })} ${verify}</div>`;
    }
    return `<div class="foot">${f(T.neverChecked, { verify })}</div>`;
  }

  // ---------- il sentiero d'avvio: bootstrap, piano, primo passo ----------

  const saved0 = vscode.getState() || {};
  let wizard = saved0.wizard || null; // { step, answers }
  const saveWizard = () => vscode.setState({ ...(vscode.getState() || {}), shownStep, wizard });

  /** Il fantasmino-mentor: neutro, contento o preoccupato. */
  function ghost(mood, cls) {
    const src = model.ghosts && model.ghosts[mood];
    return src ? `<img class="ghost ${cls || ""}" src="${esc(src)}" alt="">` : "";
  }

  function renderEmpty() {
    if (wizard) return renderWizard();
    const ob = model.onboarding;
    const stage = (n, done, active, title, text, actions) => `
      <div class="stage${done ? " done" : ""}${active ? " active" : ""}">
        <div class="stage-head"><span class="stage-n">${done ? "" : n}</span><b>${esc(title)}</b></div>
        <p>${text}</p>${active || done ? `<div class="actions">${actions}</div>` : ""}
      </div>`;
    const planBtn = model.next && ob.roadmap
      ? `<button class="btn primary" type="button" data-plan ${model.planning ? "disabled" : ""}>${esc(model.planning ? T.preparingStepShort : f(T.prepareStep, { n: model.next.n }))}</button>`
      : "";
    root.innerHTML = `
      <div class="sec"><span>${esc(T.startHeader)}</span></div>
      <div class="intro with-ghost">${ghost("neutral", "big")}<span>${esc(T.startIntro)}</span></div>
      <div class="stages">
        ${stage(1, ob.bootstrap, !ob.bootstrap, T.stage1Title, ob.bootstrap ? T.stage1Done : T.stage1Todo,
          ob.bootstrap
            ? `<button class="link" type="button" data-open-bootstrap>${esc(T.openBootstrap)}</button>`
            : ob.hasCode
              ? `<p class="hint">${esc(T.adoptHint)}</p><button class="btn primary" type="button" data-adopt>${esc(T.adoptProject)}</button><button class="btn" type="button" data-wizard>${esc(T.answerQuestions)}</button>`
              : `<button class="btn primary" type="button" data-wizard>${esc(T.answerQuestions)}</button><button class="btn" type="button" data-template>${esc(T.writeItMyself)}</button>`)}
        ${stage(2, ob.roadmap, ob.bootstrap && !ob.roadmap, T.stage2Title, T.stage2Text,
          ob.roadmap ? "" : `<button class="btn primary" type="button" data-init>${esc(T.proposePlan)}</button>`)}
        ${stage(3, false, ob.roadmap, T.stage3Title, T.stage3Text, planBtn)}
      </div>
      <div class="foot">${esc(T.tryNow)} <button class="link" type="button" data-create>${esc(T.createExample)}</button></div>`;
  }

  function renderWizard() {
    const QUESTIONS = T.questions;
    const q = QUESTIONS[wizard.step];
    const a = wizard.answers;
    const pct = Math.round(((wizard.step + 1) / QUESTIONS.length) * 100);
    let field = "";
    if (q.kind === "line") field = `<input id="f" type="text" value="${esc(a[q.key] || "")}" placeholder="${esc(q.example || "")}">`;
    if (q.kind === "text") field = `<textarea id="f" rows="4" placeholder="${esc(q.example || "")}">${esc(a[q.key] || "")}</textarea>`;
    if (q.kind === "chips")
      field = `<div class="chips">${q.options.map((o, i) => `<button type="button" class="chip${a.stack === o ? " on" : ""}" data-chip="${esc(o)}" data-chip-i="${i}">${esc(o)}</button>`).join("")}</div>
        <input id="f" type="text" value="${esc(q.options.includes(a.stack) ? "" : a.stack || "")}" placeholder="${esc(T.otherPlaceholder)}">`;
    if (q.kind === "checks")
      field = `<div class="checks">${model.onboarding.commonUnknowns.map((u) => `<label><input type="checkbox" data-check="${esc(u)}" ${(a.unknowns || []).includes(u) ? "checked" : ""}> ${esc(u)}</label>`).join("")}</div>
        <textarea id="f" rows="2" placeholder="${esc(T.otherDoubts)}">${esc(a.otherUnknown || "")}</textarea>`;
    if (q.kind === "levels")
      field = `<div class="levels">${T.levels.map(([id, t, d]) => `<button type="button" class="level${(a.level || model.onboarding.level) === id ? " on" : ""}" data-level="${id}"><b>${esc(t)}</b><span>${esc(d)}</span></button>`).join("")}</div>`;
    const last = wizard.step === QUESTIONS.length - 1;
    root.innerHTML = `
      <div class="sec"><span>${esc(T.wizardTitle)}</span><b>${esc(f(T.wizardCount, { i: wizard.step + 1, n: QUESTIONS.length }))}</b></div>
      <div class="step"><div class="bar"><i data-pct="${pct}"></i></div></div>
      <div class="wizard">
        <h2>${esc(q.title)}</h2>
        <p class="help">${esc(q.help)}</p>
        ${field}
        ${q.example && q.kind !== "line" ? `<p class="example">${esc(f(T.forExample, { x: q.example }))}</p>` : ""}
        <div class="actions">
          ${wizard.step > 0 ? `<button class="btn" type="button" data-wiz="back">${esc(T.back)}</button>` : `<button class="btn" type="button" data-wiz="cancel">${esc(T.cancel)}</button>`}
          <button class="btn primary" type="button" data-wiz="${last ? "finish" : "next"}">${esc(last ? T.createBootstrap : q.optional ? T.nextOrSkip : T.next)}</button>
        </div>
      </div>`;
    for (const bar of root.querySelectorAll("[data-pct]")) bar.style.width = `${bar.dataset.pct}%`;
    const input = document.getElementById("f");
    if (input) input.focus();
  }

  /** Legge il campo della domanda corrente nelle risposte. */
  function collect() {
    const q = T.questions[wizard.step];
    const input = document.getElementById("f");
    const a = wizard.answers;
    if (q.kind === "line" || q.kind === "text") a[q.key] = input ? input.value : "";
    if (q.kind === "chips" && input && input.value.trim()) a.stack = input.value.trim();
    if (q.kind === "checks") {
      a.unknowns = [...root.querySelectorAll("[data-check]")].filter((c) => c.checked).map((c) => c.dataset.check);
      a.otherUnknown = input ? input.value : "";
    }
  }

  function finishWizard() {
    const a = wizard.answers;
    // L'ultima scelta del linguaggio è sempre "Non lo so ancora": diventa un dubbio, non un vincolo.
    const stackOptions = T.questions.find((q) => q.kind === "chips").options;
    const unknownStack = a.stack === stackOptions[stackOptions.length - 1];
    const answers = {
      name: a.name || "", what: a.what || "", example: a.example || "",
      stack: unknownStack ? "" : a.stack || "", rules: a.rules || "",
      unknowns: a.unknowns || [],
      otherUnknown: a.otherUnknown || "",
    };
    vscode.postMessage({ type: "bootstrapWizard", answers, level: a.level || null, unknownStack });
    wizard = null;
    saveWizard();
    render(new Set());
  }

  function renderNoTasks() {
    root.innerHTML = `
      <div class="sec"><span>${esc(T.header)}</span></div>
      <div class="empty">
        <h2>${esc(T.noTasksTitle)}</h2>
        <p>${T.noTasksText}</p>
        <button class="btn" type="button" data-reveal="0">${esc(T.openPathFile)}</button>
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
        if (act === "next") wizard.step = Math.min(T.questions.length - 1, wizard.step + 1);
        if (act === "finish") return finishWizard();
      }
      saveWizard();
      return render(new Set());
    }
    if (e.target.closest("[data-verify]")) return vscode.postMessage({ type: "verify" });
    const copy = e.target.closest("[data-copy]");
    if (copy) return vscode.postMessage({ type: "copy", text: copy.dataset.copy });
    if (e.target.closest("[data-adopt]")) return vscode.postMessage({ type: "adopt" });
    const np = e.target.closest("[data-new-path]");
    if (np) return vscode.postMessage({ type: "newPath", kind: np.dataset.newPath });
    if (e.target.closest("[data-plan]")) return vscode.postMessage({ type: "planNext" });
    const review = e.target.closest("[data-review-step]");
    if (review) return vscode.postMessage({ type: "reviewStep", n: Number(review.dataset.reviewStep) });
    if (e.target.closest("[data-open-map]")) return vscode.postMessage({ type: "openMap" });
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
    T = model.t;
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
