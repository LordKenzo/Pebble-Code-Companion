import * as vscode from "vscode";
import type { ReviewResult } from "../../core/model";
import { formatUsd } from "../../core/cost";
import { EXT_TEXT, type Lang } from "../../core/i18n";
import type { SpendData, SpendRow } from "./spendLedger";
import { ghostOfMode } from "../../core/prompt";

type State =
  | { kind: "loading"; file: string; provider: string }
  | { kind: "result"; file: string; uri: vscode.Uri; result: ReviewResult }
  | { kind: "error"; file: string; message: string; action?: { label: string; command: string } }
  | { kind: "spend"; data: SpendData; modes: SpendData; currentMonth: number; budget: number };

/** Pannello laterale con l'esito della review (ADR-001). */
export class ReviewPanel {
  private panel: vscode.WebviewPanel | undefined;
  private uri: vscode.Uri | undefined;

  constructor(private readonly lang: () => Lang = () => "it") {}

  show(state: State): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        "pebble.review",
        "Pebble",
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        { enableScripts: true },
      );
      this.panel.onDidDispose(() => (this.panel = undefined));
      this.panel.webview.onDidReceiveMessage((msg: { type: string; line?: number; command?: string }) => {
        if (msg.type === "goto" && this.uri && msg.line) void revealLine(this.uri, msg.line);
        if (msg.type === "command" && msg.command) void vscode.commands.executeCommand(msg.command);
      });
    }
    if (state.kind === "result") this.uri = state.uri;
    this.panel.webview.html = render(state, this.panel.webview.cspSource, this.lang());
    this.panel.reveal(vscode.ViewColumn.Beside, true);
  }
}

async function revealLine(uri: vscode.Uri, line: number): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
  const pos = new vscode.Position(Math.max(0, line - 1), 0);
  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Testo semplice con `codice` inline evidenziato. */
const inline = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>");
function renderSpend(data: SpendData, modes: SpendData, currentMonth: number, budget: number, lang: Lang): string {
  const T = EXT_TEXT[lang];
  const num = (n: number) => n.toLocaleString(T.numberLocale);
  const months = Object.keys(data).sort().reverse();
  if (!months.length) return `<p class="muted">${T.noRequests}</p>`;
  const budgetLine = budget > 0 ? `<p>${T.budgetUsed(formatUsd(budget, lang), Math.round((currentMonth / budget) * 100))}</p>` : "";
  const row = (label: string, r: SpendRow) =>
    `<tr><td>${label}</td><td>${r.reviews}</td><td>${num(r.inputTokens)}</td><td>${num(r.outputTokens)}</td><td>${num(r.cacheReadTokens + r.cacheWriteTokens)}</td><td>${r.unpriced === r.reviews ? "–" : formatUsd(r.costUsd, lang)}</td></tr>`;
  // Per fantasmino: le modalità raggruppate sotto chi le serve, ordinate per costo (ADR-016).
  const byGhost = (m: string) => {
    const rows = Object.entries(modes[m] ?? {});
    if (!rows.length) return "";
    const ghost = (mode: string) => T.ghostNames[ghostOfMode(mode) ?? "other"];
    rows.sort(([a, ra], [b, rb]) => ghost(a).localeCompare(ghost(b)) || rb.costUsd - ra.costUsd);
    return `<h3>${T.byGhostTitle}</h3>
<table><thead><tr>${[T.byGhostColumn, ...T.columns.slice(1)].map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>
${rows.map(([mode, r]) => row(`${esc(ghost(mode))} · <code>${esc(mode)}</code>`, r)).join("")}
</tbody></table>`;
  };
  const tables = months.map((m) => {
    const rows = Object.entries(data[m]).sort(([, a], [, b]) => b.costUsd - a.costUsd);
    const total = rows.reduce((s, [, r]) => s + r.costUsd, 0);
    const unpriced = rows.reduce((s, [, r]) => s + r.unpriced, 0);
    return `<h2>${esc(m)} · ${formatUsd(total, lang)}${unpriced ? ` <span class="muted">${T.unpricedRequests(unpriced)}</span>` : ""}</h2>
<table><thead><tr>${T.columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>
${rows.map(([k, r]) => row(esc(k), r)).join("")}
</tbody></table>${byGhost(m)}`;
  }).join("");
  return `${budgetLine}${tables}
<p class="muted">${T.spendNote} ${T.byGhostNote}</p>
<button data-command="pebble.resetSpend">${T.resetCount}</button>`;
}

function render(state: State, csp: string, lang: Lang): string {
  const T = EXT_TEXT[lang];
  const num = (n: number) => n.toLocaleString(T.numberLocale);
  const nonce = Math.random().toString(36).slice(2);
  let body: string;
  if (state.kind === "spend") {
    body = renderSpend(state.data, state.modes, state.currentMonth, state.budget, lang);
  } else if (state.kind === "loading") {
    body = `<p class="muted">${T.reviewing(esc(state.file), esc(state.provider))}</p>`;
  } else if (state.kind === "error") {
    body = `<div class="card err"><p>${inline(state.message)}</p>${
      state.action ? `<button data-command="${esc(state.action.command)}">${esc(state.action.label)}</button>` : ""
    }</div>`;
  } else {
    const { review, violations, provider, model, level, usage, costUsd } = state.result;
    const notes = review.notes
      .map(
        (n) => `<article class="card">
  <header><span class="sev ${n.severity}">${T.severity[n.severity]}</span>
    <a href="#" data-line="${n.line}">${T.line} ${n.line}${n.endLine && n.endLine !== n.line ? `–${n.endLine}` : ""}</a>
    <span class="anchor">${esc(n.anchor)}</span></header>
  <p><b>${inline(n.problem)}</b></p>
  <p class="muted">${inline(n.why)}</p>
  <p><span class="label">${T.try}</span> ${inline(n.try)}</p>
</article>`,
      )
      .join("");
    body = `<p class="summary">${inline(review.summary)}</p>
${notes || `<p class="muted">${T.noNotes}</p>`}
${review.question ? `<div class="q"><span class="label">${T.question}</span><p>${inline(review.question)}</p></div>` : ""}
${review.adrProposal ? `<div class="q"><span class="label">${T.adrToConsider}</span><p>${inline(review.adrProposal)}</p></div>` : ""}
${violations ? `<p class="muted">${T.removedBlocks(violations)}</p>` : ""}
<footer class="muted">${esc(provider)} · ${esc(model)} · ${T.level} ${esc(level)}<br>
${T.tokens(num(usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens), num(usage.cacheReadTokens), num(usage.outputTokens))} · <a href="#" data-command="pebble.showSpend">${esc(formatUsd(costUsd, lang))}</a></footer>`;
  }

  return `<!doctype html><html lang="${T.htmlLang}"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${csp} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
  body{font-family:var(--vscode-font-family);font-size:var(--vscode-font-size);color:var(--vscode-foreground);padding:12px 16px;line-height:1.5}
  .gear{float:right;text-transform:none;letter-spacing:0;font-size:12px}
  h1{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--vscode-descriptionForeground);margin:0 0 10px}
  .file{font-family:var(--vscode-editor-font-family)}
  .summary{margin:0 0 12px}
  .card{border:1px solid var(--vscode-panel-border);border-radius:6px;padding:10px 12px;margin:0 0 10px;background:var(--vscode-editor-background)}
  .card.err{border-color:var(--vscode-errorForeground)}
  .card header{display:flex;gap:8px;align-items:center;font-size:12px;margin-bottom:4px}
  .card p{margin:4px 0}
  .anchor{margin-left:auto;color:var(--vscode-descriptionForeground);font-family:var(--vscode-editor-font-family)}
  .sev{font-size:11px;padding:0 6px;border-radius:4px;font-family:var(--vscode-editor-font-family)}
  .sev.errore{color:var(--vscode-errorForeground);border:1px solid var(--vscode-errorForeground)}
  .sev.avviso{color:var(--vscode-editorWarning-foreground);border:1px solid var(--vscode-editorWarning-foreground)}
  .sev.info{color:var(--vscode-editorInfo-foreground);border:1px solid var(--vscode-editorInfo-foreground)}
  a{color:var(--vscode-textLink-foreground)}
  code{font-family:var(--vscode-editor-font-family);background:var(--vscode-textCodeBlock-background);padding:0 4px;border-radius:3px}
  .muted{color:var(--vscode-descriptionForeground)}
  .label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--vscode-textLink-foreground)}
  .q{border-left:2px solid var(--vscode-textLink-foreground);padding:2px 0 2px 10px;margin:12px 0}
  .q p{margin:2px 0 0}
  footer{margin-top:16px;font-size:11px}
  h2{font-size:13px;margin:16px 0 6px}
  table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums}
  th,td{text-align:right;padding:4px 6px;border-bottom:1px solid var(--vscode-panel-border)}
  th:first-child,td:first-child{text-align:left}
  th{color:var(--vscode-descriptionForeground);font-weight:normal}
  button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:0;padding:5px 12px;border-radius:3px;cursor:pointer}
</style></head><body>
<h1>Pebble · <span class="file">${state.kind === "spend" ? T.spendTitle : esc(state.file)}</span><a class="gear" href="#" data-command="pebble.openSettings">${T.settings}</a></h1>
${body}
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-line]");
    if (a) { e.preventDefault(); vscode.postMessage({ type: "goto", line: Number(a.dataset.line) }); }
    const b = e.target.closest("[data-command]");
    if (b) { e.preventDefault(); vscode.postMessage({ type: "command", command: b.dataset.command }); }
  });
</script></body></html>`;
}
