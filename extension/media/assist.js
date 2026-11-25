// Pannello di aiuto ⌥P (ADR-015). Riceve lo stato dall'estensione e disegna schede e contenuti; il CSP vieta gli style inline.
(function () {
  const vscode = acquireVsCodeApi();
  const root = document.getElementById("root");
  let st = null;
  const f = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ""));
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  /** `codice` in linea, come nel resto di Pebble. */
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  const img = (mood, cls) => (st.ghosts[mood] ? `<img class="ghost ${cls || ""}" src="${esc(st.ghosts[mood])}" alt="">` : "");

  window.addEventListener("message", (e) => {
    if (e.data.type !== "state") return;
    st = e.data;
    render();
  });

  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.tab) vscode.postMessage({ type: "tab", id: b.dataset.tab });
    else if (b.dataset.retry !== undefined) vscode.postMessage({ type: "retry" });
    else if (b.dataset.insert !== undefined) vscode.postMessage({ type: "insert" });
    else if (b.dataset.copy !== undefined) vscode.postMessage({ type: "copy" });
    else if (b.dataset.ladder === "reply") {
      const box = root.querySelector("textarea");
      if (box && box.value.trim()) vscode.postMessage({ type: "ladder", action: "reply", text: box.value });
    } else if (b.dataset.ladder) vscode.postMessage({ type: "ladder", action: b.dataset.ladder });
  });
  root.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA" && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      root.querySelector("[data-ladder=reply]")?.click();
    }
  });

  function render() {
    const T = st.T;
    const tabs = st.tabs.map((t) => `<button type="button" class="pill${t.active ? " on" : ""}${t.ladder ? " ladder" : ""}" data-tab="${t.id}" aria-pressed="${t.active}">${esc(t.label)}</button>`).join("");
    const busy = st.active === "ladder" ? st.ladder.busy && !st.ladder.turns.length : st.result && st.result.status === "loading";
    root.innerHTML = `
      <header>${img(busy ? "thinking" : "neutral", "head")}<div><div class="title">${esc(st.title)}</div><div class="sub">${esc(st.sub)}</div></div></header>
      <nav>${tabs}</nav>
      ${st.stale ? `<div class="stale">${esc(T.fileChanged)} <button type="button" class="link" data-retry>${esc(T.ask)}</button></div>` : ""}
      <main>${st.active === "ladder" ? ladder(T) : body(T)}</main>`;
  }

  function body(T) {
    const r = st.result;
    if (!r || r.status === "loading") return `<div class="wait">${img("thinking", "bob")}<span>${esc(T.thinking)}</span></div>`;
    if (r.status === "error") return `<div class="error">${img("worried")}<p>${esc(r.message)}</p><button type="button" class="btn" data-retry>${esc(T.retry)}</button></div>`;
    const d = r.data;
    switch (st.active) {
      case "tips":
        return d.tips.map((x) => `<article class="card"><div class="row"><span class="where">${esc(x.where)}</span><b>${inline(x.title)}</b><span class="anchor">${esc(x.anchor)}</span></div><p>${inline(x.body)}</p></article>`).join("");
      case "study":
        return d.items.map((x) => `<article class="study"><b>${inline(x.title)}</b><p>${inline(x.body)}</p><span class="src">${inline(x.source)}</span></article>`).join("");
      case "pseudo":
        return `<p>${inline(d.intro)}</p>
          <pre class="pseudo">${d.steps.map((x, i) => `// ${i + 1}. ${esc(x)}`).join("\n")}${d.question ? `\n// ? ${esc(d.question)}` : ""}</pre>
          <div class="actions">${d.target ? `<button type="button" class="btn primary" data-insert>${esc(f(T.insertComment, { fn: d.target }))}</button>` : ""}<button type="button" class="btn" data-copy>${esc(T.copySteps)}</button></div>`;
      case "explain":
        return `<div class="lines">${d.lines.map((x) => `<div class="line"><span class="where">${esc(x.where)}</span><span>${inline(x.text)}</span></div>`).join("")}</div>
          <div class="summary">${inline(d.summary)}</div>`;
      case "similar":
        return d.examples.map((x) => `<article class="card"><b>${inline(x.title)}</b><p>${inline(x.setup)}</p><pre class="trace">${esc(x.trace)}</pre></article>`).join("") + `<p class="note">${esc(T.similarNote)}</p>`;
    }
    return "";
  }

  function ladder(T) {
    const L = st.ladder;
    const bar = "▰".repeat(L.rung) + "▱".repeat(4 - L.rung);
    const turns = L.turns.map((t) => t.who === "you"
      ? `<div class="turn you"><b>${esc(T.you)}</b><p>${t.html}</p></div>`
      : `<div class="turn pebble"><div class="md">${t.html}</div>${t.concept ? `<p class="concept"><i>${esc(T.concept)}:</i> ${esc(t.concept)}</p>` : ""}</div>`).join("");
    const wait = L.busy ? `<div class="wait">${img("thinking", "bob")}<span>${esc(T.thinking)}</span></div>` : "";
    const actions = L.busy ? "" : `
      <div class="actions">
        ${L.rung < 4 ? `<button type="button" class="btn ghostbtn" data-ladder="up">${esc(T.more)}</button>` : ""}
        <button type="button" class="btn ghostbtn" data-ladder="why">${esc(T.why)}</button>
        <button type="button" class="btn ghostbtn" data-ladder="deep">${esc(T.deep)}</button>
        <button type="button" class="btn ghostbtn" data-ladder="close">${esc(T.close)}</button>
      </div>
      <label class="replylabel" for="reply">${esc(T.reply)}</label>
      <div class="reply"><textarea id="reply" rows="2" placeholder="${esc(T.replyPlaceholder)}"></textarea><button type="button" class="btn" data-ladder="reply">${esc(T.reply)}</button></div>`;
    return `<div class="rung"><span class="bar">${bar}</span><span>${esc(f(T.rung, { n: L.rung, name: T.rungs[L.rung] }))}</span></div>${turns}${wait}${actions}`;
  }

  vscode.postMessage({ type: "ready" });
})();
