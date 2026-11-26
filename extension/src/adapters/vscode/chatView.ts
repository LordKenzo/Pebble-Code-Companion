import * as vscode from "vscode";
import { escapeHtml } from "./markdown";
import { CHAT_TEXT, type Lang } from "../../core/i18n";

export interface ChatAction {
  id: string;
  label: string;
  primary?: boolean;
}

export type ChatItem =
  | { kind: "user"; text: string }
  | { kind: "pebble"; label: string; file?: string; html: string; meta?: string; actions?: ChatAction[] }
  | { kind: "thinking"; text: string }
  | { kind: "error"; text: string; actions?: ChatAction[] };

export interface ChatHandlers {
  send(text: string): void;
  action(id: string): void;
  ready(): void;
}

/** Pannello laterale di Pebble: una conversazione con il mentor. Vista "stupida": lo stato sta nell'host. */
export class ChatView implements vscode.WebviewViewProvider {
  static readonly id = "pebble.chat";
  private view: vscode.WebviewView | undefined;
  private items: ChatItem[] = [];
  private busy = false;

  constructor(
    private handlers: ChatHandlers,
    private lang: () => Lang = () => "it",
    /** Per i fantasmini del Mentor in media/ (ghost-*.svg). */
    private extensionUri?: vscode.Uri,
  ) {}

  private page(webview: vscode.Webview): string {
    const ghost = (mood: string) => (this.extensionUri ? webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", `ghost-${mood}.svg`)).toString() : "");
    return html(webview.cspSource, this.lang(), { neutral: ghost("neutral"), thinking: ghost("thinking"), worried: ghost("worried") });
  }

  /** Cambio di lingua: la pagina si ridisegna con i testi nuovi, la conversazione resta. */
  relocalize(): void {
    if (this.view) this.view.webview.html = this.page(this.view.webview);
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true, ...(this.extensionUri && { localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")] }) };
    view.webview.html = this.page(view.webview);
    view.webview.onDidReceiveMessage((m: { type: string; text?: string; id?: string }) => {
      if (m.type === "ready") {
        this.flush();
        this.handlers.ready();
      }
      if (m.type === "send" && m.text?.trim()) this.handlers.send(m.text.trim());
      if (m.type === "action" && m.id) this.handlers.action(m.id);
    });
    view.onDidDispose(() => (this.view = undefined));
  }

  get visible(): boolean {
    return !!this.view;
  }

  async reveal(): Promise<void> {
    if (this.view) this.view.show(true);
    else await vscode.commands.executeCommand(`${ChatView.id}.focus`);
  }

  push(item: ChatItem): void {
    this.items = this.items.filter((i) => i.kind !== "thinking");
    this.items.push(item);
    if (this.items.length > 60) this.items = this.items.slice(-60);
    this.flush();
  }

  thinking(text: string): void {
    this.busy = true;
    this.push({ kind: "thinking", text });
  }

  done(): void {
    this.busy = false;
    this.items = this.items.filter((i) => i.kind !== "thinking");
    this.flush();
  }

  /** Toglie un pulsante da tutte le schede (gli altri pulsanti restano). */
  clearActions(id: string): void {
    for (const i of this.items) {
      if ((i.kind === "pebble" || i.kind === "error") && i.actions) {
        i.actions = i.actions.filter((a) => a.id !== id);
        if (!i.actions.length) i.actions = undefined;
      }
    }
    this.flush();
  }

  clear(): void {
    this.items = [];
    this.flush();
  }

  private flush(): void {
    void this.view?.webview.postMessage({ type: "items", items: this.items, busy: this.busy });
  }
}

function html(csp: string, lang: Lang, ghosts: { neutral: string; thinking: string; worried: string }): string {
  const C = CHAT_TEXT[lang];
  const a = (s: string) => escapeHtml(s);
  const nonce = Math.random().toString(36).slice(2);
  return `<!doctype html><html lang="${C.htmlLang}"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp}; style-src ${csp} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
  html,body{height:100%}
  body{margin:0;padding:0;font-family:var(--vscode-font-family);font-size:var(--vscode-font-size);color:var(--vscode-foreground);display:flex;flex-direction:column}
  #feed{flex:1;min-height:0;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:10px}
  /* Le schede mantengono la loro altezza: scorre la conversazione, non si schiacciano i messaggi. */
  #feed > *{flex:0 0 auto}
  footer{flex:0 0 auto}
  .card{border:1px solid var(--vscode-panel-border);border-radius:6px;background:var(--vscode-editor-background);overflow:hidden}
  .card header{display:flex;gap:6px;align-items:center;padding:6px 10px;border-bottom:1px solid var(--vscode-panel-border);font-size:11px}
  .label{color:var(--vscode-textLink-foreground);font-weight:600;letter-spacing:.02em}
  .file{margin-left:auto;color:var(--vscode-descriptionForeground);font-family:var(--vscode-editor-font-family);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
  .body{padding:8px 10px;line-height:1.5;overflow-wrap:anywhere}
  .body > :first-child{margin-top:0}.body > :last-child{margin-bottom:0}
  .body h3{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--vscode-descriptionForeground);margin:14px 0 4px}
  .body p{margin:6px 0}
  .body ul,.body ol{padding-left:18px;margin:6px 0}
  .body code{font-family:var(--vscode-editor-font-family);background:var(--vscode-textCodeBlock-background);padding:0 4px;border-radius:3px}
  .body pre{background:var(--vscode-textCodeBlock-background);padding:8px;border-radius:4px;overflow-x:auto}
  .body pre code{background:none;padding:0}
  .body blockquote{border-left:2px solid var(--vscode-textLink-foreground);margin:6px 0;padding:0 0 0 8px;color:var(--vscode-foreground)}
  .note{border-top:1px solid var(--vscode-panel-border);padding:6px 0}
  .note:first-of-type{border-top:0}
  .sev{font-size:10px;padding:0 5px;border-radius:3px;font-family:var(--vscode-editor-font-family);margin-right:4px}
  .sev.errore{color:var(--vscode-errorForeground);border:1px solid var(--vscode-errorForeground)}
  .sev.avviso{color:var(--vscode-editorWarning-foreground);border:1px solid var(--vscode-editorWarning-foreground)}
  .sev.info{color:var(--vscode-editorInfo-foreground);border:1px solid var(--vscode-editorInfo-foreground)}
  .meta{padding:0 10px 6px;font-size:11px;color:var(--vscode-descriptionForeground)}
  .actions{display:flex;flex-wrap:wrap;gap:6px;padding:0 10px 10px}
  button{font:inherit;font-size:12px;background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);border:0;padding:4px 10px;border-radius:3px;cursor:pointer}
  button.primary{background:var(--vscode-button-background);color:var(--vscode-button-foreground)}
  button:focus-visible,textarea:focus{outline:1px solid var(--vscode-focusBorder)}
  .user{align-self:flex-end;max-width:85%;background:var(--vscode-input-background);border:1px solid var(--vscode-panel-border);border-radius:10px 10px 2px 10px;padding:6px 10px;white-space:pre-wrap;overflow-wrap:anywhere}
  .error{border-color:var(--vscode-errorForeground)}
  .thinking{display:flex;gap:6px;align-items:center;color:var(--vscode-descriptionForeground);font-size:12px}
  .dots i{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--vscode-textLink-foreground);margin-right:3px;animation:p 1s infinite}
  .dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
  @keyframes p{50%{opacity:.25}}
  @media (prefers-reduced-motion:reduce){.dots i{animation:none}}
  .empty{color:var(--vscode-descriptionForeground);text-align:center;padding:30px 10px;line-height:1.6}
  /* Il fantasmino-mentor: avatar sulle risposte, pensieroso mentre aspetta, preoccupato sugli errori. */
  .ghost{width:22px;height:24px;flex:0 0 auto;margin:-3px 0}
  .empty .ghost{display:block;width:72px;height:78px;margin:0 auto 10px}
  .thinking .ghost{width:28px;height:30px;animation:bob 1.6s ease-in-out infinite}
  @keyframes bob{50%{transform:translateY(-3px)}}
  @media (prefers-reduced-motion:reduce){.thinking .ghost{animation:none}}
  footer{border-top:1px solid var(--vscode-panel-border);padding:8px 10px;display:flex;flex-direction:column;gap:6px}
  textarea{font:inherit;resize:none;color:var(--vscode-input-foreground);background:var(--vscode-input-background);border:1px solid var(--vscode-input-border,transparent);border-radius:4px;padding:6px 8px;min-height:34px;max-height:120px}
  .hint{font-size:10.5px;color:var(--vscode-descriptionForeground)}
</style></head><body>
<div id="feed"></div>
<footer>
  <textarea id="input" rows="1" placeholder="${a(C.inputPlaceholder)}" aria-label="${a(C.inputLabel)}"></textarea>
  <span class="hint">${a(C.footerHint)}</span>
</footer>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const feed = document.getElementById("feed");
  const input = document.getElementById("input");
  const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const G = ${JSON.stringify(ghosts)};
  const ghost = (mood) => G[mood] ? '<img class="ghost" src="' + G[mood] + '" alt="">' : "";
  const actions = (list) => list && list.length ? '<div class="actions">' + list.map(a => '<button class="' + (a.primary ? "primary" : "") + '" data-action="' + esc(a.id) + '">' + esc(a.label) + '</button>').join("") + '</div>' : "";

  function render(items) {
    if (!items.length) {
      feed.innerHTML = '<div class="empty">' + ghost("neutral") + '${C.empty.replace(/'/g, "\\'")}</div>';
      return;
    }
    feed.innerHTML = items.map((i) => {
      if (i.kind === "user") return '<div class="user">' + esc(i.text) + '</div>';
      if (i.kind === "thinking") return '<div class="thinking">' + (G.thinking ? ghost("thinking") : '<span class="dots"><i></i><i></i><i></i></span>') + esc(i.text) + '</div>';
      if (i.kind === "error") return '<div class="card error"><header>' + ghost("worried") + '<span class="label">Pebble</span></header><div class="body">' + esc(i.text) + '</div>' + actions(i.actions) + '</div>';
      return '<article class="card"><header>' + ghost("neutral") + '<span class="label">' + esc(i.label) + '</span>' + (i.file ? '<span class="file">' + esc(i.file) + '</span>' : "") + '</header><div class="body">' + i.html + '</div>' + (i.meta ? '<div class="meta">' + esc(i.meta) + '</div>' : "") + actions(i.actions) + '</article>';
    }).join("");
    feed.scrollTop = feed.scrollHeight;
  }

  function send(text) { if (text.trim()) vscode.postMessage({ type: "send", text }); }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); input.value = ""; input.style.height = ""; }
  });
  input.addEventListener("input", () => { input.style.height = ""; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.cmd) send(b.dataset.cmd);
    if (b.dataset.action) vscode.postMessage({ type: "action", id: b.dataset.action });
  });
  window.addEventListener("message", (e) => { if (e.data.type === "items") render(e.data.items); });
  vscode.postMessage({ type: "ready" });
</script></body></html>`;
}

export { escapeHtml };
