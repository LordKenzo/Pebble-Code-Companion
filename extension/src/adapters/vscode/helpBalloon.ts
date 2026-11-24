import * as vscode from "vscode";
import { estimateCost, formatUsd, type Price } from "../../core/cost";
import { buildHelpMessage, historyLine, parseHelpAnswer, type HelpAsk, type HelpTask, type Rung } from "../../core/help";
import { HELP_TEXT, type Lang } from "../../core/i18n";
import type { ExperienceLevel, Usage } from "../../core/model";
import { stripLongCode } from "../../core/policy";
import type { MentorModel } from "../../core/ports";
import type { TestResult } from "../../core/path";
import { WorkspaceStore } from "../store/workspaceStore";
import { editorProblems } from "./problems";

export interface HelpDeps {
  mentor(): Promise<MentorModel>;
  systemPrompt(): Promise<string>;
  level(): ExperienceLevel;
  priceFor(mentor: MentorModel): Price | undefined;
  record(entry: { provider: string; model: string; usage: Usage; costUsd: number | null }): Promise<void>;
  /** Compito attivo e ultimi risultati dei test, dal percorso. */
  helpContext(filePath: string): { task?: HelpTask; tests?: (TestResult & { detail?: string })[] };
  /** Lingua del fumetto e delle risposte (ADR-012). */
  lang(): Lang;
}

interface ThreadState {
  id: string;
  rung: Rung;
  history: string[];
  concepts: string[];
  busy: boolean;
}

class Note implements vscode.Comment {
  mode = vscode.CommentMode.Preview;
  constructor(
    public body: vscode.MarkdownString | string,
    public author: vscode.CommentAuthorInformation,
    public label?: string,
    /** Testo della risposta senza la riga dei tasti, per toglierla quando arriva una risposta nuova. */
    public readonly base?: string,
  ) {}
}

/** Argomento dei comandi: dal menu sotto il riquadro una CommentReply, dal titolo il thread, dai tasti nella bolla l'id. */
type ThreadArg = vscode.CommentReply | vscode.CommentThread | string;

const ACTIONS = ["pebble.help.up", "pebble.help.why", "pebble.help.deep", "pebble.help.close"];
/** L'avanzamento sui gradini, come nel mockup: ▰▰▱▱. */
const rungBar = (r: Rung) => "▰".repeat(r) + "▱".repeat(4 - r);

/**
 * Il fumetto sulla riga (ADR-009): con ⌥P si apre un riquadro di commento sotto il cursore,
 * che parte da una domanda e sale la scala di aiuto solo quando lo chiedi (ADR-006).
 */
export class HelpBalloon implements vscode.Disposable {
  private readonly controller = vscode.comments.createCommentController("pebble.help", "Pebble");
  private readonly states = new Map<vscode.CommentThread, ThreadState>();
  private readonly byId = new Map<string, vscode.CommentThread>();
  private nextId = 1;
  private readonly pebble: vscode.CommentAuthorInformation;
  private get T() {
    return HELP_TEXT[this.deps.lang()];
  }

  constructor(
    extensionUri: vscode.Uri,
    private readonly root: vscode.Uri | undefined,
    private readonly deps: HelpDeps,
  ) {
    this.pebble = { name: "Pebble", iconPath: vscode.Uri.joinPath(extensionUri, "media", "icon.png") };
    this.controller.options = { prompt: this.T.prompt, placeHolder: this.T.placeholder };
  }

  /** ⌥P: apre il fumetto sulla riga del cursore, o riapre quello che c'è già. */
  async helpHere(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== "file") {
      void vscode.window.showInformationMessage(this.T.noEditor);
      return;
    }
    const line = editor.selection.active.line;
    const existing = [...this.states.keys()].find((t) => t.uri.toString() === editor.document.uri.toString() && t.range?.start.line === line);
    if (existing) {
      existing.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
      return;
    }
    const thread = this.controller.createCommentThread(editor.document.uri, new vscode.Range(line, 0, line, 0), []);
    thread.contextValue = "pebble.help";
    thread.canReply = true;
    thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
    const id = String(this.nextId++);
    this.states.set(thread, { id, rung: 1, history: [], concepts: [], busy: false });
    this.byId.set(id, thread);
    await this.ask(thread, { kind: "rung", rung: 1 });
  }

  async up(arg: ThreadArg): Promise<void> {
    const thread = this.threadOf(arg);
    if (!thread) return;
    const st = this.states.get(thread);
    if (!st || st.busy) return;
    if (st.rung === 4) {
      void vscode.window.showInformationMessage(this.T.atTop);
      return;
    }
    st.rung = (st.rung + 1) as Rung;
    await this.ask(thread, { kind: "rung", rung: st.rung });
  }

  async why(arg: ThreadArg): Promise<void> {
    const thread = this.threadOf(arg);
    if (!thread) return;
    const st = this.states.get(thread);
    if (st) await this.ask(thread, { kind: "why", rung: st.rung });
  }

  async deep(arg: ThreadArg): Promise<void> {
    const thread = this.threadOf(arg);
    if (!thread) return;
    const st = this.states.get(thread);
    if (st) await this.ask(thread, { kind: "deep", rung: st.rung });
  }

  /** Lo sviluppatore risponde alla domanda: è il cuore didattico, ragionare prima di ricevere. */
  async reply(arg: vscode.CommentReply): Promise<void> {
    const st = this.states.get(arg.thread);
    const text = arg.text.trim();
    if (!st || st.busy || !text) return;
    arg.thread.comments = [...arg.thread.comments, new Note(text, { name: this.T.you })];
    st.history.push(`Developer: ${text}`);
    await this.ask(arg.thread, { kind: "reply", rung: st.rung, text });
  }

  close(arg: ThreadArg): void {
    const thread = this.threadOf(arg);
    if (!thread) return;
    const st = this.states.get(thread);
    if (st) this.byId.delete(st.id);
    this.states.delete(thread);
    thread.dispose();
  }

  private threadOf(arg: ThreadArg): vscode.CommentThread | undefined {
    if (typeof arg === "string") return this.byId.get(arg);
    return "thread" in arg ? arg.thread : arg;
  }

  /** La bolla di una risposta: avanzamento e contesto in alto, la risposta, i tasti, il costo. */
  private bubble(st: ThreadState, base: string, withActions: boolean): vscode.MarkdownString {
    const md = new vscode.MarkdownString(base, true);
    if (withActions) {
      const link = (cmd: string, icon: string, label: string) =>
        `[$(${icon}) ${label}](command:${cmd}?${encodeURIComponent(JSON.stringify([st.id]))} "${label}")`;
      const actions = [
        st.rung < 4 ? link("pebble.help.up", "arrow-up", this.T.more) : null,
        link("pebble.help.why", "question", this.T.why),
        link("pebble.help.deep", "book", this.T.deep),
        link("pebble.help.close", "check", this.T.gotIt),
      ].filter(Boolean);
      md.appendMarkdown(`\n\n${actions.join(" &nbsp;·&nbsp; ")}\n\n${this.T.orReply}`);
      md.isTrusted = { enabledCommands: ACTIONS };
    }
    md.supportHtml = true;
    return md;
  }

  private async ask(thread: vscode.CommentThread, ask: HelpAsk): Promise<void> {
    const st = this.states.get(thread);
    if (!st || st.busy) return;
    st.busy = true;
    const thinking = new Note(new vscode.MarkdownString(this.T.thinking), this.pebble);
    thread.comments = [...thread.comments, thinking];
    thread.label = this.T.label(rungBar(st.rung), st.rung, this.T.rungs[st.rung]);
    // Le risposte precedenti perdono i tasti: valgono solo sull'ultima.
    thread.comments = thread.comments.map((c) => {
      const base = c instanceof Note ? (c as Note).base : undefined; // Comment è già assegnabile a Note: serve il cast
      return base && c !== thinking ? new Note(this.bubble(st, base, false), this.pebble, undefined, base) : c;
    });
    try {
      const doc = await vscode.workspace.openTextDocument(thread.uri);
      const path = vscode.workspace.asRelativePath(thread.uri, false);
      const ctx = this.root ? await new WorkspaceStore(this.root).load() : { bootstrap: null, architecture: null, decisions: [] };
      const { task, tests } = this.deps.helpContext(path);
      const message = buildHelpMessage({
        ctx,
        level: this.deps.level(),
        file: { path, content: doc.getText() },
        line: (thread.range?.start.line ?? 0) + 1,
        ask,
        history: st.history,
        ...(task && { task }),
        ...(tests && { tests }),
        problems: editorProblems(thread.uri),
        lang: this.deps.lang(),
      });
      const mentor = await this.deps.mentor();
      const { text, usage } = await mentor.chat(await this.deps.systemPrompt(), message);
      const costUsd = estimateCost(usage, this.deps.priceFor(mentor));
      await this.deps.record({ provider: mentor.provider, model: mentor.model, usage, costUsd });

      const { body, concept } = parseHelpAnswer(stripLongCode(text, this.deps.lang()).text);
      if (concept && !st.concepts.includes(concept)) st.concepts.push(concept);
      st.history.push(historyLine(body));
      const red = tests?.filter((t) => !t.ok).length ?? 0;
      const context = [this.T.line((thread.range?.start.line ?? 0) + 1), task?.title, red ? this.T.red(red) : null].filter(Boolean).join(" · ");
      const base = [
        `<span style="color:#e3b25c;">${rungBar(st.rung)}</span> &nbsp;<sub>${context}</sub>`,
        body,
        concept ? `*${this.T.concept}:* ${concept}` : "",
        `<sub>${mentor.provider} · ${mentor.model} · ${formatUsd(costUsd, this.deps.lang())}</sub>`,
      ]
        .filter(Boolean)
        .join("\n\n");
      thread.comments = thread.comments.map((c) => (c === thinking ? new Note(this.bubble(st, base, true), this.pebble, undefined, base) : c));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const md = new vscode.MarkdownString(this.T.failed(msg));
      thread.comments = thread.comments.map((c) => (c === thinking ? new Note(md, this.pebble) : c));
    } finally {
      st.busy = false;
    }
  }

  dispose(): void {
    this.controller.dispose();
  }
}
