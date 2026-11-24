// Mappa del sentiero (ADR-013). Riceve { model, T } dall'estensione; il CSP vieta gli attributi style:
// posizioni e larghezze si impostano da script.
(function () {
  const vscode = acquireVsCodeApi();
  const root = document.getElementById("root");
  let model = null;
  let T = null;
  let picked = (vscode.getState() || {}).picked ?? null;

  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const f = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ""));
  const day = (iso) => {
    if (!iso) return "";
    const [, m, d] = iso.split("-").map(Number);
    return `${d} ${T.months[m - 1]}`;
  };
  const span = (a, b) => (!a ? "" : a === b || !b ? day(a) : `${day(a)} – ${day(b)}`);
  const kind = (text) =>
    /^(rosso|red)\b/i.test(text) ? "red"
    : /^(verde|green|passo chiuso|step closed)\b/i.test(text) ? "green"
    : /^(fumetto|balloon)\b/i.test(text) ? "help"
    : /^(rilettura|review)\b/i.test(text) ? "review"
    : /^(passo preparato|step prepared|file preparato|file prepared)\b/i.test(text) ? "plan"
    : "";

  window.addEventListener("message", (e) => {
    if (e.data.type !== "model") return;
    model = e.data.model;
    T = e.data.T;
    render();
  });

  root.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.dataset.step) {
      picked = Number(el.dataset.step);
      vscode.setState({ picked });
      render();
    } else if (el.dataset.review) vscode.postMessage({ type: "review", n: Number(el.dataset.review) });
    else if (el.dataset.open) vscode.postMessage({ type: "open", file: el.dataset.open });
    else if (el.dataset.path !== undefined) vscode.postMessage({ type: "path" });
    else if (el.dataset.plan !== undefined) vscode.postMessage({ type: "plan" });
  });

  /** Punti del sentiero in un riquadro 1000×600: da sinistra in basso a destra in alto, a zig-zag. */
  function points(n) {
    return Array.from({ length: n }, (_, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = 110 + t * 780;
      const y = Math.min(430, Math.max(120, 400 - t * 250 + (i % 2 ? -45 : 35)));
      return [x, y];
    });
  }
  /** Curva morbida che passa per i punti (Catmull-Rom → Bézier). */
  function curve(pts) {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  }

  function render() {
    if (!model || !model.steps.length) {
      root.innerHTML = `<div class="nothing">${esc(T ? T.empty : "")}</div>`;
      return;
    }
    const steps = model.steps;
    if (!steps.some((s) => s.n === picked)) {
      picked = (steps.find((s) => s.state === "current" || s.state === "next") || [...steps].reverse().find((s) => s.state === "done") || steps[0]).n;
    }
    const pts = points(steps.length);
    const lastWalked = Math.max(steps.map((s) => s.state).lastIndexOf("done"), steps.findIndex((s) => s.state === "current"));
    const ahead_ = (s) => s.state === "future" || s.state === "next";
    const walked = lastWalked > 0 ? curve(pts.slice(0, lastWalked + 1)) : "";
    const ahead = curve(pts.slice(Math.max(0, lastWalked)));
    const end = pts[pts.length - 1];
    const check = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

    const stones = steps.map((s, i) => {
      const label = `${f(T.step, { n: s.n })} · ${s.state === "future" ? T.toPrepare : s.state === "next" ? T.next : `${s.done}/${s.total}`}`;
      const when = s.state === "current" ? T.inProgress : s.state === "future" || s.state === "next" ? "" : span(s.from, s.to);
      return `<button type="button" class="stone ${s.state}${s.n === picked ? " selected" : ""}" data-step="${s.n}" data-x="${pts[i][0]}" data-y="${pts[i][1]}"
          aria-pressed="${s.n === picked}" aria-label="${esc(`${label}: ${s.title}`)}">${s.state === "done" ? check : esc(s.n)}</button>
        <div class="label" data-x="${pts[i][0]}" data-y="${pts[i][1]}" data-below="${s.state === "current" || s.state === "next" ? 38 : 32}">
          <span class="k${s.state === "next" ? " next" : ""}">${esc(label)}</span><span class="t${s.state === "future" ? " future" : ""}">${esc(s.title)}</span>${when ? `<span class="d">${esc(when)}</span>` : ""}
        </div>`;
    }).join("");

    const pct = model.tasksTotal ? Math.round((model.tasksDone / model.tasksTotal) * 100) : 0;
    root.innerHTML = `
      <div class="head">
        <div><div class="kicker">${esc(T.header)}</div>
          <h1>${esc(f(T.summary, { steps: model.stepsDone, total: steps.length, done: model.tasksDone, tasks: model.tasksTotal }))}</h1></div>
        <div class="legend"><span><i class="dot done"></i>${esc(T.legendDone)}</span>${steps.some((s) => s.state === "next") ? `<span><i class="dot next"></i>${esc(T.next)}</span>` : `<span><i class="dot current"></i>${esc(T.legendCurrent)}</span>`}<span><i class="dot future"></i>${esc(T.legendFuture)}</span></div>
      </div>
      <div class="body">
        <div class="map">
          <svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
            <path class="trail" vector-effect="non-scaling-stroke" d="${curve(pts)}"/>
            ${walked ? `<path class="walked" vector-effect="non-scaling-stroke" d="${walked}"/>` : ""}
            ${steps.some(ahead_) ? `<path class="ahead" vector-effect="non-scaling-stroke" d="${ahead}"/>` : ""}
            <path class="flag" vector-effect="non-scaling-stroke" d="M${end[0]} ${end[1] - 30} L${end[0]} ${end[1] - 80} L${end[0] + 34} ${end[1] - 68} L${end[0]} ${end[1] - 56}"/>
          </svg>
          ${stones}
          <div class="hint"><div class="bar"><i data-pct="${pct}"></i></div>${steps.some(ahead_) ? esc(T.futureHint) : ""}</div>
        </div>
        ${diary(steps.find((s) => s.n === picked))}
      </div>`;

    // Posizioni in percentuale del riquadro 1000×600, così la mappa segue la larghezza della scheda.
    for (const el of root.querySelectorAll(".stone, .label")) {
      el.style.left = `${(Number(el.dataset.x) / 1000) * 100}%`;
      el.style.top = el.dataset.below ? `calc(${(Number(el.dataset.y) / 600) * 100}% + ${el.dataset.below}px)` : `${(Number(el.dataset.y) / 600) * 100}%`;
    }
    for (const bar of root.querySelectorAll("[data-pct]")) bar.style.width = `${bar.dataset.pct}%`;
  }

  function diary(s) {
    const chips = s.state === "future" || s.state === "next" ? [] : [
      [`${s.done}/${s.total}`, T.tasks],
      s.counts.green ? [s.counts.green, s.counts.green === 1 ? T.green1 : T.green] : null,
      s.counts.red ? [s.counts.red, s.counts.red === 1 ? T.red1 : T.red] : null,
      s.counts.help ? [s.counts.help, s.counts.help === 1 ? T.help1 : T.help] : null,
      s.counts.concepts ? [s.counts.concepts, s.counts.concepts === 1 ? T.concepts1 : T.concepts] : null,
    ].filter(Boolean);
    let lastDay = "";
    const entries = s.entries.map((e) => {
      const head = e.date !== lastDay ? `<li class="day">${esc(day(e.date))}</li>` : "";
      lastDay = e.date;
      return `${head}<li><span class="time">${esc(e.time)}</span><i class="dot ${kind(e.text)}"></i><span class="text">${esc(e.text)}</span></li>`;
    }).join("");
    const body = s.state === "next"
      ? `<div class="future-box"><div>${esc(T.nextBody)} <q>${esc(s.roadmap || s.title)}</q></div></div>`
      : s.state === "future"
      ? `<div class="future-box"><div>${esc(T.futureBody)} <q>${esc(s.roadmap || s.title)}</q></div>${esc(T.futureNext)}</div>`
      : `${entries ? `<ul class="entries">${entries}</ul>` : `<div class="empty">${esc(T.noEntries)}</div>`}
         ${s.notes.length ? `<div class="notes"><div class="k">${esc(T.notes)}</div>${s.notes.map((n) => `<p>${esc(n.replace(/^>\s?/, ""))}</p>`).join("")}</div>` : ""}`;
    const primary = s.state === "done"
      ? `<button type="button" class="btn primary" data-review="${s.n}">${esc(T.reviewStep)}</button>`
      : s.state === "current" ? `<button type="button" class="btn primary" data-path>${esc(T.openPath)}</button>`
      : s.state === "next" ? `<button type="button" class="btn primary" data-plan>${esc(f(T.prepareStep, { n: s.n }))}</button>` : "";
    const secondary = s.state === "future" || s.state === "next"
      ? `<button type="button" class="btn" data-open="roadmap">${esc(T.openRoadmap)}</button>`
      : `<button type="button" class="btn" data-open="diary">${esc(T.openDiary)}</button>`;
    return `<aside class="diary" aria-label="${esc(T.diaryOf)}">
      <div class="top"><div class="kicker">${esc(T.diaryOf)}</div>
        <h2>${esc(f(T.step, { n: s.n }))} · ${esc(s.title)}</h2>
        <div class="sub">${esc(s.state === "future" ? T.toPrepare : s.state === "next" ? T.next : s.state === "current" ? T.inProgress : span(s.from, s.to))}</div>
        ${chips.length ? `<div class="chips">${chips.map(([v, l]) => `<span class="chip"><b>${esc(v)}</b> ${esc(l)}</span>`).join("")}</div>` : ""}
      </div>
      ${body}
      <div class="actions">${primary}${secondary}</div>
    </aside>`;
  }

  vscode.postMessage({ type: "ready" });
})();
