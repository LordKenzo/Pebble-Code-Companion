// Pannello del fantasmino Git (ADR-017). Riceve lo stato dall'estensione e lo disegna; il CSP vieta gli style inline.
(function () {
  const vscode = acquireVsCodeApi();
  const root = document.getElementById("root");
  let st = null;
  const f = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ""));
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  const img = (src, cls) => (src ? `<img class="ghost ${cls || ""}" src="${esc(src)}" alt="">` : "");

  window.addEventListener("message", (e) => {
    if (e.data.type !== "state") return;
    st = e.data;
    render();
  });

  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.copy !== undefined) {
      vscode.postMessage({ type: "copy", text: b.dataset.copy });
      const old = b.textContent;
      b.textContent = st.T.copied;
      setTimeout(() => (b.textContent = old), 1200);
    } else if (b.dataset.open) vscode.postMessage({ type: "open", path: b.dataset.open });
    else if (b.dataset.explain) vscode.postMessage({ type: "explain", path: b.dataset.explain });
    else if (b.dataset.resolve) vscode.postMessage({ type: "resolve", path: b.dataset.path, how: b.dataset.resolve });
    else if (b.dataset.dismiss !== undefined) vscode.postMessage({ type: "dismiss" });
  });

  function render() {
    const T = st.T;
    if (st.loading) return void (root.innerHTML = `<header>${img(st.ghosts.thinking, "head bob")}<div class="title">${esc(T.title)}</div></header>`);
    if (st.problem) return void (root.innerHTML = `<header>${img(st.ghosts.worried, "head")}<div class="title">${esc(T.title)}</div></header><p class="muted">${esc(st.problem)}</p>`);
    const s = st.state;
    const busy = st.explained && st.explained.status === "loading";
    root.innerHTML = `
      <header>${img(busy ? st.ghosts.thinking : st.ghosts.git, "head" + (busy ? " bob" : ""))}
        <div><div class="title">${esc(T.title)}</div><div class="sub">${inline(sub(T, s))}</div></div>
        <span class="badge">${esc(T.zeroTokens)}</span></header>
      ${progress(s)}
      <p class="where">${inline(where(T, s))}</p>
      ${st.names.swapped && s.conflicts.length ? `<div class="callout"><b>${esc(T.swapTitle)}</b> ${inline(f(T.swapBody, { onto: "`" + st.names.ours + "`" }))}</div>` : ""}
      ${s.files.length ? `<section><h2>${esc(T.files)}</h2>${s.files.map((x) => file(T, x)).join("")}</section>` : ""}
      ${st.steps.length ? `<section><h2>${esc(T.steps)}</h2><div class="steps">${st.steps.map((x, i) => step(T, x, i)).join("")}</div></section>` : ""}
      ${st.picked.length ? `<section><h2>${esc(T.cards)}</h2>${st.picked.map((c) => card(T, c, true)).join("")}</section>` : ""}
      <section><h2>${esc(st.picked.length ? T.otherCards : T.cards)}</h2>${st.others.map((c) => card(T, c, false)).join("")}</section>`;
  }

  function sub(T, s) {
    const code = (x) => "`" + x + "`";
    if (s.op === "rebase") return f(T.subRebase, { branch: code(s.rewriting || "HEAD"), onto: code(s.onto || "?") });
    if (s.op === "merge") return f(T.subMerge, { incoming: code(s.incoming || "?"), branch: code(s.branch || "HEAD") });
    if (s.op) return f(T.subOther, { op: s.op });
    if (s.detached) return T.subDetached;
    return f(T.subIdle, { branch: code(s.branch || "?") });
  }

  function where(T, s) {
    const code = (x) => "`" + x + "`";
    if (s.op === "rebase") {
      const v = { total: s.step ? s.step.total : "?", n: s.step ? s.step.n : "?", onto: code(s.onto || "?"), subject: s.applying || "" };
      return f(s.conflicts.length ? T.whereRebase : T.whereRebaseNoConflict, v);
    }
    if (s.op === "merge") return f(T.whereMerge, { incoming: code(s.incoming || "?"), branch: code(s.branch || "HEAD") });
    if (s.op) return f(T.whereOther, { op: s.op });
    if (s.detached) return T.whereDetached;
    if (s.ahead || s.behind) return f(T.whereAhead, { ahead: s.ahead, behind: s.behind });
    return T.whereIdle;
  }

  function progress(s) {
    if (s.op !== "rebase" || !s.step || !s.step.total) return "";
    const segs = Array.from({ length: s.step.total }, (_, i) => `<span class="seg ${i + 1 < s.step.n ? "done" : i + 1 === s.step.n ? "here" : ""}"></span>`).join("");
    return `<div class="progress" role="img" aria-label="${esc(s.step.n + " / " + s.step.total)}">${segs}</div>`;
  }

  function file(T, x) {
    const e = st.explained && st.explained.path === x.path ? st.explained : null;
    const blocks = x.blocks === 0 ? T.resolvedInFile : x.blocks === 1 ? T.block : f(T.blocks, { n: x.blocks });
    return `<div class="file">
      <div class="row"><code>${esc(x.path)}</code><span class="${x.blocks ? "red" : "muted"}">${esc(blocks)}</span>
        <span class="actions"><button type="button" class="btn" data-open="${esc(x.path)}">${esc(T.open)}</button>
        ${x.blocks && !e ? `<button type="button" class="btn primary" data-explain="${esc(x.path)}">${esc(T.explain)}</button>` : ""}</span></div>
      ${e ? explanation(T, x.path, e) : ""}</div>`;
  }

  function explanation(T, path, e) {
    if (e.status === "loading") return `<div class="wait">${img(st.ghosts.thinking, "bob")}<span>${esc(T.thinking)}</span></div>`;
    if (e.status === "error") return `<p class="red">${esc(e.error)}</p>`;
    const d = e.data;
    const names = st.names;
    const keep = (how, name) => `<button type="button" class="btn" data-resolve="${how}" data-path="${esc(path)}">${esc(f(T.keep, { name }))}</button>`;
    return `<div class="explain">
      <div class="sides"><div class="side ours"><span class="label">${esc(names.ours)}</span><p>${inline(d.ours)}</p></div>
        <div class="side theirs"><span class="label">${esc(names.theirs)}</span><p>${inline(d.theirs)}</p></div></div>
      <p>${inline(d.explanation)}</p>
      ${d.union ? `<h3>${esc(T.union)}</h3><pre class="union">${esc(d.union)}</pre>` : ""}
      <div class="actions wrap">
        ${d.union ? `<button type="button" class="btn primary" data-resolve="union" data-path="${esc(path)}">${esc(T.applyUnion)}</button>` : ""}
        ${keep("ours", names.ours)}${keep("theirs", names.theirs)}
        <button type="button" class="btn" data-resolve="both" data-path="${esc(path)}">${esc(T.keepBoth)}</button>
        <button type="button" class="btn" data-dismiss>${esc(T.doItMyself)}</button></div>
      <p class="muted"><b>${esc(T.check)}</b> ${inline(d.check)}</p>
      ${st.training ? `<p class="muted">${esc(T.trainingNote)}</p>` : ""}
      <p class="cost">${esc(f(T.callCost, { ghost: st.ghostName }))}</p></div>`;
  }

  function step(T, x, i) {
    return `<span class="n">${i + 1}</span><span>${esc(x.text)}${x.cmd ? `<br><code class="cmd">${esc(x.cmd)}</code>` : ""}</span>
      ${x.cmd ? `<button type="button" class="btn" data-copy="${esc(x.cmd)}">${esc(T.copy)}</button>` : "<span></span>"}`;
  }

  function card(T, c, open) {
    const cmds = c.commands.map((k) => `<div class="cmdrow"><code class="cmd">${esc(k.cmd)}</code><span class="muted">${esc(k.note)}</span>${/[<>]/.test(k.cmd) ? "" : `<button type="button" class="btn" data-copy="${esc(k.cmd)}">${esc(T.copy)}</button>`}</div>`).join("");
    return `<details class="card"${open ? " open" : ""}><summary>${esc(c.title)}</summary><p>${inline(c.body)}</p>${c.warning ? `<p class="warn">${inline(c.warning)}</p>` : ""}${cmds}</details>`;
  }

  vscode.postMessage({ type: "ready" });
})();
