import * as vscode from "vscode";
import type { Ghost } from "../../core/prompt";
import { ASSIST_SCHEMAS, buildAssistMessage, insertPseudocode, type AssistAsk, type Pseudo } from "../../core/assist";
import { reviewFile } from "../../core/reviewFile";
import { estimateCost, type Price } from "../../core/cost";
import type { DiaryEvent } from "../../core/diary";
import { buildHelpMessage, historyLine, parseHelpAnswer, type HelpAsk, type HelpTask, type Rung } from "../../core/help";
import { ASSIST_TEXT, type Lang } from "../../core/i18n";
import type { ExperienceLevel, Usage } from "../../core/model";
import type { TestResult } from "../../core/path";
import { stripLongCode } from "../../core/policy";
import type { MentorModel } from "../../core/ports";
import { WorkspaceStore } from "../store/workspaceStore";
import { renderMarkdown } from "./markdown";
import { editorProblems } from "./problems";
import { toDiagnostics } from "./diagnostics";
import { SideView } from "./sideView";

/** ⌥P (ADR-015): un menu, poi un pannello accanto al codice con una scheda per tipo di aiuto. */
export interface AssistDeps {
  /** Il modello del fantasmino (#20): Suggeritore per le schede, Mentor per la scala di aiuto. */
  mentor(ghost?: Ghost): Promise<MentorModel>;
  systemPrompt(): Promise<string>;
  /** Il livello per quel file: quello del suo linguaggio, o del progetto (roadmap #23). */
  level(path?: string | null): ExperienceLevel;
  priceFor(mentor: MentorModel): Price | undefined;
  record(entry: { provider: string; model: string; usage: Usage; costUsd: number | null }): Promise<void>;
  helpContext(filePath: string): { task?: HelpTask; tests?: (TestResult & { detail?: string })[] };
  lang(): Lang;
  /** Le note della review anche come sottolineature nell'editor, come la review in chat. */
  diagnostics?: vscode.DiagnosticCollection;
  /** Allenamento (ADR-016): niente *Mostrami il codice*. */
  training(): boolean;
  note?(event: DiaryEvent): void;
}

type Tab = AssistAsk | "ladder";
type Result = { status: "loading" } | { status: "error"; message: string } | { status: "done"; data: unknown };
interface Turn {
  who: "pebble" | "you";
  html: string;
  label?: string;
  concept?: string;
}
interface Session {
  uri: vscode.Uri;
  path: string;
  /** Righe selezionate, da 1; null = il file intero. */
  selection: { from: number; to: number } | null;
  line: number;
  version: number;
  tabs: Tab[];
  active: Tab;
  results: Map<Tab, Result>;
  red: number;
  ladder: { rung: Rung; history: string[]; turns: Turn[]; busy: boolean; concepts: string[] };
}

type FromView =
  | { type: "ready" }
  | { type: "tab"; id: Tab }
  | { type: "retry" }
  | { type: "insert" }
  | { type: "copy" }
  | { type: "ladder"; action: "up" | "why" | "deep" | "code" | "close" | "reply"; text?: string };

export class AssistPanel implements vscode.Disposable {
  /** La sezione ⌥P nella barra laterale di Pebble, accanto a Percorso e Mentor. */
  readonly view: SideView;
  private s: Session | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly root: vscode.Uri | undefined,
    private readonly deps: AssistDeps,
  ) {
    this.view = new SideView("pebble.assist", "pebble.assistOpen", extensionUri, (webview) => {
      const media = vscode.Uri.joinPath(extensionUri, "media");
      webview.html = html(webview.cspSource, webview.asWebviewUri(vscode.Uri.joinPath(media, "assist.css")), webview.asWebviewUri(vscode.Uri.joinPath(media, "assist.js")), this.deps.lang());
      webview.onDidReceiveMessage((m: FromView) => void this.onMessage(m));
    });
    // Il file cambia sotto il pannello: le risposte restano, ma il pannello lo dice.
    this.disposables.push(vscode.workspace.onDidChangeTextDocument((e) => {
      if (this.s && e.document.uri.toString() === this.s.uri.toString()) this.post();
    }));
  }

  private get T() {
    return ASSIST_TEXT[this.deps.lang()];
  }

  /** ⌥P: il menu, diverso con e senza selezione; poi il pannello sulla scheda scelta. */
  async open(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return void vscode.window.showInformationMessage(this.T.noEditor);
    const doc = editor.document;
    const sel = editor.selection;
    const selection = sel.isEmpty ? null : { from: sel.start.line + 1, to: sel.end.character === 0 && sel.end.line > sel.start.line ? sel.end.line : sel.end.line + 1 };
    const path = vscode.workspace.asRelativePath(doc.uri, false);
    const red = this.deps.helpContext(path).tests?.filter((t) => !t.ok).length ?? 0;
    const T = this.T;
    const items: (vscode.QuickPickItem & { id: Tab })[] = selection
      ? [
          { id: "explain", label: T.explain, detail: T.explainHint },
          { id: "study", label: T.study, detail: T.studyHint },
          { id: "similar", label: T.similar, detail: T.similarHint },
          { id: "ladder", label: T.ladderSelection, detail: T.ladderHint },
        ]
      : [
          { id: "review", label: T.tips, detail: T.tipsHint },
          { id: "study", label: T.study, detail: T.studyHint },
          { id: "pseudo", label: T.pseudo, detail: T.pseudoHint },
          ...(red ? [{ id: "ladder" as const, label: T.ladderFile, description: T.redBadge(red), detail: T.ladderHint }] : []),
        ];
    const pick = await vscode.window.showQuickPick(items, {
      placeHolder: selection ? T.askSelection(selection.to - selection.from + 1) : T.askFile(path.split("/").pop() ?? path),
      matchOnDetail: true,
    });
    if (!pick) return;
    this.s = {
      uri: doc.uri,
      path,
      selection,
      line: (selection?.from ?? sel.active.line + 1),
      version: doc.version,
      tabs: items.map((i) => i.id),
      active: pick.id,
      results: new Map(),
      red,
      ladder: { rung: 1, history: [], turns: [], busy: false, concepts: [] },
    };
    await this.show();
    await this.select(pick.id);
  }

  private async show(): Promise<void> {
    await this.view.reveal(true);
    this.view.description = this.s?.path.split("/").pop();
  }

  private async onMessage(m: FromView): Promise<void> {
    if (!this.s) return;
    if (m.type === "ready") return this.post();
    if (m.type === "tab") return this.select(m.id);
    if (m.type === "retry") {
      this.s.results.delete(this.s.active);
      this.s.version = (await this.document())?.version ?? this.s.version;
      return this.select(this.s.active);
    }
    if (m.type === "insert" || m.type === "copy") return this.pseudocode(m.type === "insert");
    if (m.type === "ladder") {
      if (m.action === "close") {
        await this.view.hide();
        return;
      }
      if (m.action === "reply" && m.text?.trim()) {
        this.s.ladder.turns.push({ who: "you", html: escapeHtml(m.text.trim()) });
        return this.ladder({ kind: "reply", rung: this.s.ladder.rung, text: m.text.trim() });
      }
      if (m.action === "up" && this.s.ladder.rung < 4) {
        this.s.ladder.rung = (this.s.ladder.rung + 1) as Rung;
        return this.ladder({ kind: "rung", rung: this.s.ladder.rung });
      }
      if (m.action === "why") return this.ladder({ kind: "why", rung: this.s.ladder.rung });
      if (m.action === "deep") return this.ladder({ kind: "deep", rung: this.s.ladder.rung });
      if (m.action === "code" && !this.deps.training()) return this.ladder({ kind: "code", rung: this.s.ladder.rung });
    }
  }

  private async document(): Promise<vscode.TextDocument | undefined> {
    if (!this.s) return undefined;
    try {
      return await vscode.workspace.openTextDocument(this.s.uri);
    } catch {
      return undefined;
    }
  }

  /** Apre una scheda: la chiede al modello solo la prima volta. */
  private async select(tab: Tab): Promise<void> {
    const s = this.s;
    if (!s) return;
    s.active = tab;
    if (tab === "ladder") {
      if (!s.ladder.turns.length) return this.ladder({ kind: "rung", rung: 1 });
      return this.post();
    }
    if (s.results.has(tab)) return this.post();
    s.results.set(tab, { status: "loading" });
    this.post();
    try {
      const doc = await this.document();
      if (!doc) throw new Error(s.path);
      if (tab === "review") {
        // La review vera (MODE: REVIEW, del Mentor): note con gravità e riga, filtrate e segnate nel diario.
        const mentor = await this.deps.mentor("mentor");
        const empty = { load: async () => ({ bootstrap: null, architecture: null, decisions: [] }) };
        const result = await reviewFile(
          mentor,
          this.root ? new WorkspaceStore(this.root) : empty,
          await this.deps.systemPrompt(),
          { path: s.path, content: doc.getText(), languageId: doc.languageId, problems: editorProblems(s.uri) },
          this.deps.level(s.path),
          this.deps.priceFor(mentor),
          this.deps.lang(),
        );
        await this.deps.record({ provider: result.provider, model: result.model, usage: result.usage, costUsd: result.costUsd });
        this.deps.note?.({ kind: "review", file: s.path, notes: result.review.notes.length });
        this.deps.diagnostics?.set(doc.uri, toDiagnostics(doc, result.review.notes));
        s.results.set(tab, { status: "done", data: result.review });
      } else {
      const ctx = this.root ? await new WorkspaceStore(this.root).load() : { bootstrap: null, architecture: null, decisions: [] };
      const { tests } = this.deps.helpContext(s.path);
      const message = buildAssistMessage({
        ctx,
        level: this.deps.level(s.path),
        file: { path: s.path, content: doc.getText() },
        ask: tab,
        selection: s.selection,
        red: tests?.filter((t) => !t.ok).map((t) => t.name),
        problems: editorProblems(s.uri),
        lang: this.deps.lang(),
      });
      const mentor = await this.deps.mentor("assist");
      const { data, usage } = await mentor.generate(await this.deps.systemPrompt(), message, ASSIST_SCHEMAS[tab] as never, `assist_${tab}`);
      await this.deps.record({ provider: mentor.provider, model: mentor.model, usage, costUsd: estimateCost(usage, this.deps.priceFor(mentor)) });
      s.results.set(tab, { status: "done", data: clean(data, this.deps.lang()) });
      }
    } catch (err) {
      s.results.set(tab, { status: "error", message: this.T.failed(err instanceof Error ? err.message : String(err)) });
    }
    this.post();
  }

  /** La scala di aiuto (ADR-009), ora come scheda del pannello: stessi gradini, stessa modalità HELP. */
  private async ladder(ask: HelpAsk): Promise<void> {
    const s = this.s;
    if (!s || s.ladder.busy) return;
    s.ladder.busy = true;
    s.active = "ladder";
    this.post();
    try {
      const doc = await this.document();
      if (!doc) throw new Error(s.path);
      const ctx = this.root ? await new WorkspaceStore(this.root).load() : { bootstrap: null, architecture: null, decisions: [] };
      const { task, tests } = this.deps.helpContext(s.path);
      const problems = editorProblems(s.uri);
      const message = buildHelpMessage({
        ctx,
        level: this.deps.level(s.path),
        file: { path: s.path, content: doc.getText() },
        line: s.line,
        ask,
        history: s.ladder.history,
        ...(task && { task }),
        ...(tests && { tests }),
        problems,
        lang: this.deps.lang(),
      });
      const mentor = await this.deps.mentor("mentor");
      const { text, usage } = await mentor.chat(await this.deps.systemPrompt(), message);
      await this.deps.record({ provider: mentor.provider, model: mentor.model, usage, costUsd: estimateCost(usage, this.deps.priceFor(mentor)) });
      // Il codice chiesto con *Mostrami il codice* passa; il resto della scala resta filtrato (ADR-016).
      const { body, concept } = parseHelpAnswer(ask.kind === "code" ? text : stripLongCode(text, this.deps.lang()).text);
      if (concept && !s.ladder.concepts.includes(concept)) s.ladder.concepts.push(concept);
      s.ladder.history.push(historyLine(body));
      s.ladder.turns.push({ who: "pebble", html: renderMarkdown(body), ...(concept && { concept }) });
      if (ask.kind === "code") this.deps.note?.({ kind: "code", where: `${s.path}:${s.line}`, level: this.deps.level(s.path) });
      else if (ask.kind !== "reply") {
        const fix = problems.some((p) => p.severity === "errore");
        const rung = ask.kind === "why" ? "why" : ask.kind === "deep" ? "deep" : fix ? "fix" : ask.rung;
        this.deps.note?.({ kind: "help", file: s.path, line: s.line, rung, ...(concept && { concept }) });
      }
    } catch (err) {
      s.ladder.turns.push({ who: "pebble", html: escapeHtml(this.T.failed(err instanceof Error ? err.message : String(err))) });
    } finally {
      s.ladder.busy = false;
      this.post();
    }
  }

  /** "Inserisci come commento": i passi dentro la funzione vuota; se non la trova, li copia. */
  private async pseudocode(insert: boolean): Promise<void> {
    const s = this.s;
    const r = s?.results.get("pseudo");
    if (!s || r?.status !== "done") return;
    const p = r.data as Pseudo;
    const steps = p.steps;
    const plain = steps.map((x, i) => `${i + 1}. ${x}`).join("\n");
    if (!insert || !p.target) {
      await vscode.env.clipboard.writeText(plain);
      return void vscode.window.setStatusBarMessage(this.T.copied, 3000);
    }
    const doc = await this.document();
    const next = doc && insertPseudocode(doc.getText(), p.target, steps);
    if (!doc || !next) {
      await vscode.env.clipboard.writeText(plain);
      return void vscode.window.showInformationMessage(this.T.notFound(p.target));
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, new vscode.Range(0, 0, doc.lineCount, 0), next);
    await vscode.workspace.applyEdit(edit);
    s.version = doc.version;
    void vscode.window.setStatusBarMessage(this.T.inserted(p.target), 3000);
  }

  private post(): void {
    const s = this.s;
    const webview = this.view.webview;
    if (!s || !webview) return;
    const T = this.T;
    const file = s.path.split("/").pop() ?? s.path;
    const label: Record<Tab, string> = {
      review: T.tabTips,
      study: T.tabStudy,
      pseudo: T.tabPseudo,
      explain: T.tabExplain,
      similar: T.tabSimilar,
      ladder: s.selection ? T.tabLadderSelection : T.tabLadderFile(s.red),
    };
    // Il Suggeritore ⌥P è verde; la scala di aiuto è del Mentor, azzurro (#20).
    const ghost = (mood: string) => webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", `ghost-${mood}${s.active === "ladder" ? "" : "-assist"}.svg`)).toString();
    const open = vscode.workspace.textDocuments.find((d) => d.uri.toString() === s.uri.toString());
    // Nella webview passano solo dati: i testi con parametri diventano modelli con {segnaposto}.
    const W = {
      ...Object.fromEntries(Object.entries(T).filter(([, v]) => typeof v !== "function")),
      insertComment: T.insertComment("{fn}"),
      rung: T.rung("{n}" as unknown as number, "{name}"),
    };
    void webview.postMessage({
      type: "state",
      T: W,
      ghosts: { neutral: ghost("neutral"), thinking: ghost("thinking"), worried: ghost("worried"), happy: ghost("happy") },
      title: s.selection ? T.onLines(s.selection.from, s.selection.to) : T.onFile(file),
      sub: T.sub(this.deps.level(s.path), s.red ? T.redBadge(s.red) : ""),
      tabs: s.tabs.map((id) => ({ id, label: label[id], active: id === s.active, ladder: id === "ladder" })),
      active: s.active,
      result: s.active === "ladder" ? null : s.results.get(s.active) ?? null,
      ladder: { rung: s.ladder.rung, busy: s.ladder.busy, turns: s.ladder.turns, code: !this.deps.training() },
      stale: !!open && open.version !== s.version,
    });
  }

  dispose(): void {
    this.view.dispose();
    for (const d of this.disposables) d.dispose();
  }
}

/** Il filtro sul codice anche qui (ADR-003): ogni testo della risposta passa da stripLongCode. */
function clean(data: unknown, lang: Lang): unknown {
  if (typeof data === "string") return stripLongCode(data, lang).text;
  if (Array.isArray(data)) return data.map((d) => clean(d, lang));
  if (data && typeof data === "object") return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, clean(v, lang)]));
  return data;
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
