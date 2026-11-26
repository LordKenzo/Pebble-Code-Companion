import * as vscode from "vscode";
import { estimateCost, type Price } from "../../core/cost";
import type { DiaryEvent } from "../../core/diary";
import { GIT_CARD_IDS, needsAttention, nextSteps, parseConflicts, pickCards, resolveBlock, sideNames, type GitState, type Resolution } from "../../core/git";
import { GIT_CARDS } from "../../core/gitCards";
import { buildGitConflictMessage, checkUnion, GitConflictAnswer } from "../../core/gitConflict";
import { EXT_TEXT, GIT_TEXT, type Lang } from "../../core/i18n";
import type { ExperienceLevel, Usage } from "../../core/model";
import type { MentorModel } from "../../core/ports";
import type { Ghost } from "../../core/prompt";
import { readGitState, type GitRead } from "./gitRepo";
import { SideView } from "./sideView";

export interface GitDeps {
  mentor(ghost?: Ghost): Promise<MentorModel>;
  systemPrompt(): Promise<string>;
  level(path?: string | null): ExperienceLevel;
  priceFor(mentor: MentorModel): Price | undefined;
  record(entry: { provider: string; model: string; usage: Usage; costUsd: number | null }): Promise<void>;
  lang(): Lang;
  training(): boolean;
  note?(event: DiaryEvent): void;
}

/** La spiegazione di un blocco, legata al testo del blocco: se il blocco cambia, non vale più. */
interface Explained {
  path: string;
  index: number;
  fingerprint: string;
  status: "loading" | "done" | "error";
  data?: GitConflictAnswer & { droppedSide: "ours" | "theirs" | null };
  error?: string;
}

type FromView =
  | { type: "ready" }
  | { type: "open"; path: string }
  | { type: "explain"; path: string }
  | { type: "resolve"; path: string; how: "union" | "ours" | "theirs" | "both" }
  | { type: "dismiss" }
  | { type: "save"; path: string }
  | { type: "copy"; text: string };

/**
 * Il fantasmino Git (ADR-017): un indicatore nella barra di stato quando c'è un'operazione a metà,
 * e un pannello accanto al codice con lo stato, i comandi da lanciare, le schede e la spiegazione di un conflitto.
 */
export class GitPanel implements vscode.Disposable {
  /** La sezione Git nella barra laterale di Pebble: compare quando c'è qualcosa da fare o la apri tu. */
  readonly view: SideView;
  private read: GitRead | undefined;
  private explained: Explained | undefined;
  private readonly item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  private readonly disposables: vscode.Disposable[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly root: vscode.Uri | undefined,
    private readonly deps: GitDeps,
  ) {
    this.item.command = "pebble.git";
    this.view = new SideView("pebble.git", "pebble.gitOpen", extensionUri, (webview) => {
      const media = vscode.Uri.joinPath(extensionUri, "media");
      webview.html = html(webview.cspSource, webview.asWebviewUri(vscode.Uri.joinPath(media, "git.css")), webview.asWebviewUri(vscode.Uri.joinPath(media, "git.js")), this.deps.lang());
      webview.onDidReceiveMessage((m: FromView) => void this.onMessage(m));
    });
    if (!root) return;
    const watch = (glob: string) => {
      const w = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, glob));
      w.onDidChange(() => this.schedule());
      w.onDidCreate(() => this.schedule());
      w.onDidDelete(() => this.schedule());
      this.disposables.push(w);
    };
    watch(".git/{HEAD,index,MERGE_HEAD,REBASE_HEAD,CHERRY_PICK_HEAD,REVERT_HEAD}");
    watch(".git/rebase-merge/*");
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(() => this.schedule()),
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (this.read?.ok && this.read.state.conflicts.some((p) => e.document.uri.path.endsWith("/" + p))) this.schedule(600);
      }),
      vscode.window.onDidChangeWindowState((s) => s.focused && this.schedule()),
      vscode.workspace.onDidGrantWorkspaceTrust(() => this.schedule()),
    );
    this.schedule(0);
  }

  private get T() {
    return GIT_TEXT[this.deps.lang()];
  }

  private schedule(ms = 300): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.refresh(), ms);
  }

  async refresh(): Promise<void> {
    if (!this.root) return;
    try {
      this.read = await readGitState(this.root);
    } catch {
      this.read = { ok: false, reason: "noRepo" };
    }
    this.updateItem();
    this.post();
  }

  private updateItem(): void {
    const r = this.read;
    const T = this.T;
    const f = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
    if (r && !r.ok && r.reason === "untrusted" && r.op) {
      this.item.text = `$(git-merge) ${f(T.status[r.op] ?? r.op, { n: "?", total: "?" }).replace(" ?/?", "")} · ${T.untrustedBadge}`;
      this.item.tooltip = T.notTrusted;
      this.item.backgroundColor = undefined;
      this.item.show();
      return;
    }
    if (!r?.ok || !needsAttention(r.state)) {
      this.item.hide();
      return;
    }
    const s = r.state;
    void this.view.enable();
    const op = s.op ? f(T.status[s.op] ?? s.op, { n: s.step?.n ?? 0, total: s.step?.total ?? 0 }) : "";
    const n = s.conflicts.length;
    const conflicts = n ? (n === 1 ? T.conflictBadge : f(T.conflictsBadge, { n })) : "";
    this.item.text = `$(git-merge) ${[op, conflicts].filter(Boolean).join(" · ")}`;
    this.item.tooltip = T.statusTooltip;
    this.item.backgroundColor = n ? new vscode.ThemeColor("statusBarItem.warningBackground") : undefined;
    this.item.show();
  }

  async open(): Promise<void> {
    await this.view.reveal(false);
    await this.refresh();
  }

  private async onMessage(m: FromView): Promise<void> {
    if (m.type === "ready") return this.post();
    if (m.type === "copy") {
      await vscode.env.clipboard.writeText(m.text);
      return;
    }
    if (m.type === "open") return void (await this.openFile(m.path));
    if (m.type === "explain") return this.explain(m.path);
    if (m.type === "resolve") return this.resolve(m.path, m.how);
    if (m.type === "save") {
      const uri = this.uri(m.path);
      const doc = uri && vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
      await doc?.save();
      return this.refresh();
    }
    if (m.type === "dismiss") {
      this.explained = undefined;
      this.post();
    }
  }

  private uri(path: string): vscode.Uri | undefined {
    return this.root && vscode.Uri.joinPath(this.root, ...path.split("/"));
  }

  private async openFile(path: string, line?: number): Promise<vscode.TextDocument | undefined> {
    const uri = this.uri(path);
    if (!uri) return undefined;
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One, preserveFocus: false });
    const block = parseConflicts(doc.getText())[0];
    const at = new vscode.Position(Math.max(0, (line ?? block?.start ?? 1) - 1), 0);
    editor.selection = new vscode.Selection(at, at);
    editor.revealRange(new vscode.Range(at, at), vscode.TextEditorRevealType.InCenter);
    return doc;
  }

  /** *Spiegami il conflitto*: il primo blocco ancora aperto del file, e solo quello va al modello. */
  private async explain(path: string): Promise<void> {
    const r = this.read;
    const uri = this.uri(path);
    if (!r?.ok || !uri) return;
    const doc = await vscode.workspace.openTextDocument(uri);
    const content = doc.getText();
    const block = parseConflicts(content)[0];
    if (!block) return this.refresh();
    const fingerprint = [...block.ours, "=", ...block.theirs].join("\n");
    this.explained = { path, index: 0, fingerprint, status: "loading" };
    this.post();
    try {
      const names = sideNames(r.state);
      const T = this.T;
      const theirs = r.state.op === "rebase" && names.theirs ? T.yourCommit.replace("{subject}", names.theirs) : names.theirs || block.theirsLabel;
      const message = buildGitConflictMessage({
        level: this.deps.level(path),
        lang: this.deps.lang(),
        op: r.state.op,
        path,
        content,
        block,
        oursName: names.ours || block.oursLabel,
        theirsName: theirs,
        swapped: names.swapped,
      });
      const mentor = await this.deps.mentor("git");
      const { data, usage } = await mentor.generate(await this.deps.systemPrompt(), message, GitConflictAnswer, "git_conflict");
      await this.deps.record({ provider: mentor.provider, model: mentor.model, usage, costUsd: estimateCost(usage, this.deps.priceFor(mentor)) });
      // In allenamento l'unione non si mostra, anche se il modello l'avesse scritta (ADR-016).
      const checked = checkUnion(data, block);
      this.explained = { ...this.explained, status: "done", data: this.deps.training() ? { ...checked, union: null } : checked };
    } catch (err) {
      this.explained = { ...this.explained, status: "error", error: this.T.failed.replace("{error}", err instanceof Error ? err.message : String(err)) };
    }
    this.post();
  }

  /** Risolve il primo blocco del file con la scelta fatta: modifica l'editor, non salva e non lancia git. */
  private async resolve(path: string, how: "union" | "ours" | "theirs" | "both"): Promise<void> {
    const uri = this.uri(path);
    if (!uri) return;
    const doc = await vscode.workspace.openTextDocument(uri);
    const content = doc.getText();
    const block = parseConflicts(content)[0];
    const e = this.explained;
    if (how === "union" && (!e?.data?.union || e.path !== path || !block || [...block.ours, "=", ...block.theirs].join("\n") !== e.fingerprint)) {
      void vscode.window.showWarningMessage(this.T.stale);
      return;
    }
    const resolution: Resolution = how === "union" ? { union: e!.data!.union! } : how;
    const next = resolveBlock(content, 0, resolution);
    if (next === null) return;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(uri, new vscode.Range(doc.positionAt(0), doc.positionAt(content.length)), next);
    await vscode.workspace.applyEdit(edit);
    this.deps.note?.({ kind: "conflict", file: path, how });
    this.explained = undefined;
    await this.openFile(path, block?.start);
    await this.refresh();
  }

  private post(): void {
    const webview = this.view.webview;
    if (!webview) return;
    const lang = this.deps.lang();
    const T = this.T;
    const ghost = (name: string) => webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", `${name}.svg`)).toString();
    const r = this.read;
    const base = { type: "state", T, ghosts: { git: ghost("ghost-git"), thinking: ghost("ghost-thinking"), worried: ghost("ghost-worried") } };
    if (!r) return void webview.postMessage({ ...base, loading: true });
    if (!r.ok) return void webview.postMessage({ ...base, problem: T[r.reason === "untrusted" ? "notTrusted" : r.reason === "noGit" ? "noGit" : "noRepo"] });
    const s: GitState = r.state;
    const picked = pickCards(s);
    const cards = GIT_CARDS[lang];
    const e = this.explained;
    const names = sideNames(s);
    void webview.postMessage({
      ...base,
      state: s,
      names: { ours: names.ours, theirs: s.op === "rebase" ? T.yourCommit.replace("{subject}", names.theirs) : names.theirs, swapped: names.swapped },
      steps: nextSteps(s).map((x) => ({ text: T.stepText[x.key] ?? x.key, cmd: x.cmd ?? null })),
      picked: picked.map((id) => ({ id, ...cards[id] })),
      others: GIT_CARD_IDS.filter((id) => !picked.includes(id)).map((id) => ({ id, ...cards[id] })),
      explained: e ? { path: e.path, status: e.status, data: e.data ?? null, error: e.error ?? null } : null,
      dirty: r.dirty,
      training: this.deps.training(),
      ghostName: EXT_TEXT[lang].ghostNames.git ?? "Git",
    });
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.item.dispose();
    this.view.dispose();
    for (const d of this.disposables) d.dispose();
  }
}

function html(cspSource: string, css: vscode.Uri, js: vscode.Uri, lang: Lang): string {
  const nonce = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource}; style-src ${cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${css}">
</head><body><div id="root" aria-live="polite"></div>
<script nonce="${nonce}" src="${js}"></script>
</body></html>`;
}
